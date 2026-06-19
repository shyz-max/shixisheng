import { test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const configPath = process.env.MES_FLOW_CONFIG || path.resolve("mes-outbound-flow.json");

function readConfig() {
  if (!fs.existsSync(configPath)) {
    throw new Error(`找不到配置文件：${configPath}`);
  }
  return JSON.parse(fs.readFileSync(configPath, "utf8"));
}

function locatorFor(page, step) {
  const target = step.target || "";
  if (step.targetType === "css") return page.locator(target);
  if (step.targetType === "xpath") return page.locator(`xpath=${target}`);
  if (step.targetType === "text") return page.getByText(target, { exact: true });
  return null;
}

function looksLikeSelector(target) {
  return /^(#|\.|\[|button|input|select|textarea|a|tr|td|div|span|xpath=)/.test(target) || target.includes(":has-text");
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
    if (step.action === "click") await page.mouse.click(x, y);
    return;
  }

  if (step.targetType === "note") {
    console.log(`人工备注：${step.target}`);
    return;
  }

  const locator = locatorFor(page, step);
  if (!locator) return;

  if (step.action === "click") await locator.click();
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

test("MES 零件出库申请", async ({ page }) => {
  const config = readConfig();
  if (!config.mesUrl) throw new Error("配置里没有填写 MES 地址");

  await page.goto(config.mesUrl);

  for (const step of config.steps || []) {
    try {
      await runStep(page, step, config.settings?.defaultWait);
    } catch (error) {
      if (config.settings?.failureMode === "skip") continue;
      throw error;
    }
  }

  for (const part of config.partTemplate?.parts || []) {
    await choosePartRow(page, config.partTemplate, part);
  }

  const finalButton = config.partTemplate?.finalButton;
  if (finalButton) {
    if (finalButton.startsWith("//")) {
      await page.locator(`xpath=${finalButton}`).click();
    } else if (looksLikeSelector(finalButton)) {
      await page.locator(finalButton).click();
    } else {
      await page.getByText(finalButton, { exact: true }).click();
    }
  }
});
