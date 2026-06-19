import { test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const configPath = process.env.MES_FLOW_CONFIG || path.resolve("mes-bom-issue-flow.json");

function readConfig() {
  if (!fs.existsSync(configPath)) {
    throw new Error(`找不到配置文件：${configPath}`);
  }
  return JSON.parse(fs.readFileSync(configPath, "utf8"));
}

function looksLikeSelector(target) {
  return /^(#|\.|\[|button|input|select|textarea|a|tr|td|div|span|xpath=)/.test(target) || target.includes(":has-text");
}

function targetLocator(page, target) {
  if (!target) return null;
  if (target.startsWith("//")) return page.locator(`xpath=${target}`);
  if (target.startsWith("xpath=")) return page.locator(target);
  if (looksLikeSelector(target)) return page.locator(target);
  return page.getByText(target, { exact: true });
}

function locatorFor(page, step) {
  const target = step.target || "";
  if (step.targetType === "css") return page.locator(target);
  if (step.targetType === "xpath") return page.locator(`xpath=${target}`);
  if (step.targetType === "text") return page.getByText(target, { exact: true });
  return null;
}

async function autoLogin(page, login, defaultWait) {
  if (!login?.enabled) return;
  if (!login.usernameTarget || !login.passwordTarget || !login.loginButtonTarget) {
    throw new Error("已启用自动登录，但账号框、密码框或登录按钮没有配置完整");
  }

  await targetLocator(page, login.usernameTarget).fill(login.username || "");
  await targetLocator(page, login.passwordTarget).fill(login.password || "");
  await targetLocator(page, login.loginButtonTarget).click();
  await page.waitForTimeout(Number(login.waitMs || defaultWait || 0));
}

async function runStep(page, step, defaultWait) {
  if (step.action === "wait") {
    await page.waitForTimeout(Number(step.waitMs || defaultWait || 0));
    return;
  }

  if (step.targetType === "coordinate") {
    const [x, y] = String(step.target || "").split(",").map((value) => Number(value.trim()));
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      throw new Error(`坐标格式错误：${step.target}`);
    }
    if (step.action === "click" || step.action === "buttonClick") await page.mouse.click(x, y);
    return;
  }

  if (step.targetType === "note") {
    console.log(`人工备注：${step.target}`);
    return;
  }

  const locator = locatorFor(page, step);
  if (!locator) return;

  if (step.action === "click" || step.action === "buttonClick") await locator.click();
  if (step.action === "type") await locator.fill(step.value || "");
  if (step.action === "select") await locator.selectOption({ label: step.value || "" });
  if (step.action === "hotkey") await page.keyboard.press(step.value || step.target || "Enter");

  await page.waitForTimeout(Number(step.waitMs || defaultWait || 0));
}

async function choosePartRow(page, template, part) {
  if (part.rowTarget) {
    if (/^\d+$/.test(String(part.rowTarget))) {
      await page.locator("tr").nth(Number(part.rowTarget) - 1).click();
      return;
    }
    await page.locator(part.rowTarget).click();
    return;
  }

  if (template.rowClickRule === "byPartCode" && part.code) {
    await page.getByText(part.code, { exact: false }).click();
  }
}

async function addIssuePart(page, template, part, defaultWait) {
  if (template.selectPartButtonTarget) {
    await targetLocator(page, template.selectPartButtonTarget).click();
    await page.waitForTimeout(Number(defaultWait || 0));
  }

  if (template.partSearchTarget && part.code) {
    const search = targetLocator(page, template.partSearchTarget);
    await search.fill(part.code);
    await page.keyboard.press("Enter");
    await page.waitForTimeout(Number(defaultWait || 0));
  }

  await choosePartRow(page, template, part);

  if (template.quantityTarget) {
    await targetLocator(page, template.quantityTarget).fill(String(part.quantity || 0));
  }

  const confirmTarget = template.partConfirmButtonTarget || template.addPartButtonTarget;
  if (confirmTarget) {
    await targetLocator(page, confirmTarget).click();
    await page.waitForTimeout(Number(defaultWait || 0));
  }
}

test("MES 生产领料申请", async ({ page }) => {
  const config = readConfig();
  if (!config.mesUrl) throw new Error("配置里没有填写 MES 地址");

  await page.goto(config.mesUrl);
  await autoLogin(page, config.login, config.settings?.defaultWait);

  for (const step of config.steps || []) {
    try {
      await runStep(page, step, config.settings?.defaultWait);
    } catch (error) {
      if (config.settings?.failureMode === "skip") continue;
      throw error;
    }
  }

  for (const part of config.partTemplate?.parts || []) {
    try {
      await addIssuePart(page, config.partTemplate, part, config.settings?.defaultWait);
    } catch (error) {
      if (config.settings?.failureMode === "skip") continue;
      throw error;
    }
  }

  const finalButton = config.partTemplate?.finalButton;
  if (finalButton) {
    await targetLocator(page, finalButton).click();
  }
});
