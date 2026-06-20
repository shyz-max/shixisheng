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
    await page.getByText(part.code, { exact: true }).click();
  }
}

async function findAutoNextButton(page) {
  const candidates = [
    "下一页",
    "下页",
    "后一页",
    "Next",
    ">",
    "›",
    "»"
  ];
  for (const label of candidates) {
    const button = page.getByText(label, { exact: true }).first();
    if (await button.count()) return button;
  }

  const selectors = [
    "a[title='下一页']",
    "button[title='下一页']",
    "img[title='下一页']",
    ".x-tbar-page-next",
    ".x-btn:has-text('下一页')"
  ];
  for (const selector of selectors) {
    const button = page.locator(selector).first();
    if (await button.count()) return button;
  }
  return null;
}

async function findAndChooseExactPart(page, template, part, defaultWait) {
  if (part.rowTarget) {
    await choosePartRow(page, template, part);
    return;
  }

  const maxPages = Math.max(Number(template.partMaxPages || 20), 1);
  const scope = template.partResultScopeTarget ? targetLocator(page, template.partResultScopeTarget) : page.locator("body");

  for (let pageIndex = 0; pageIndex < maxPages; pageIndex += 1) {
    const exactCell = scope.getByText(part.code, { exact: true }).first();
    if (await exactCell.count()) {
      await exactCell.click();
      return;
    }

    const nextButton = template.partNextPageTarget ? targetLocator(page, template.partNextPageTarget) : await findAutoNextButton(page);
    if (!nextButton || !(await nextButton.count())) break;
    const disabled = await nextButton.evaluate((el) => {
      const className = el.className || "";
      return el.disabled || /disabled|x-item-disabled|x-btn-disabled/.test(String(className));
    }).catch(() => false);
    if (disabled) break;
    await nextButton.click();
    await page.waitForTimeout(Number(defaultWait || 0));
  }

  throw new Error(`没有在选择物料结果中找到完全匹配图号：${part.code}`);
}

async function addIssuePart(page, template, part, defaultWait) {
  if (template.selectPartButtonTarget) {
    await targetLocator(page, template.selectPartButtonTarget).click();
    await page.waitForTimeout(Number(defaultWait || 0));
  }

  if (template.partSearchTarget && part.code) {
    const search = targetLocator(page, template.partSearchTarget);
    await search.fill(part.code);
    if (template.partSearchButtonTarget) {
      await targetLocator(page, template.partSearchButtonTarget).click();
    } else {
      await page.keyboard.press("Enter");
    }
    await page.waitForTimeout(Number(defaultWait || 0));
  }

  await findAndChooseExactPart(page, template, part, defaultWait);

  const confirmTarget = template.partConfirmButtonTarget || template.addPartButtonTarget;
  if (confirmTarget) {
    await targetLocator(page, confirmTarget).click();
    await page.waitForTimeout(Number(defaultWait || 0));
  }

  if (template.quantityTarget) {
    await targetLocator(page, template.quantityTarget).fill(String(part.quantity || 0));
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
