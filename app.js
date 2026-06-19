const STORAGE_KEY = "mes-outbound-flow-config";

const state = {
  flowName: "MES 生产领料申请",
  mesUrl: "",
  login: {
    enabled: true,
    username: "",
    password: "",
    usernameTarget: "#username",
    passwordTarget: "#password",
    loginButtonTarget: "登录",
    waitMs: 1200
  },
  steps: [
    {
      name: "打开生产领料菜单",
      action: "buttonClick",
      targetType: "text",
      target: "生产领料",
      value: "",
      waitMs: 800
    }
  ],
  partTemplate: {
    name: "BOM 生产领料",
    rowClickRule: "byPartCode",
    finalButton: "",
    partSearchTarget: "",
    quantityTarget: "",
    addPartButtonTarget: "",
    parts: [
      {
        code: "P001",
        name: "示例零件",
        quantity: 1,
        rowTarget: "",
        warehouse: "",
        station: "",
        substitute: "",
        remark: ""
      }
    ]
  },
  settings: {
    browserType: "chrome",
    defaultWait: 800,
    failureMode: "pause",
    requireConfirm: true
  }
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

function bindTabs() {
  $$(".tab").forEach((button) => {
    button.addEventListener("click", () => {
      $$(".tab").forEach((tab) => tab.classList.remove("active"));
      $$(".panel").forEach((panel) => panel.classList.remove("active"));
      button.classList.add("active");
      $(`#${button.dataset.tab}`).classList.add("active");
    });
  });
}

function getConfig() {
  return {
    flowName: $("#flowName").value.trim(),
    mesUrl: $("#mesUrl").value.trim(),
    login: {
      enabled: $("#loginEnabled").value === "true",
      username: $("#loginUsername").value.trim(),
      password: $("#loginPassword").value,
      usernameTarget: $("#usernameTarget").value.trim(),
      passwordTarget: $("#passwordTarget").value.trim(),
      loginButtonTarget: $("#loginButtonTarget").value.trim(),
      waitMs: Number($("#loginWaitMs").value || 0)
    },
    steps: state.steps,
    partTemplate: {
      name: $("#templateName").value.trim(),
      rowClickRule: $("#rowClickRule").value,
      finalButton: $("#finalButton").value.trim(),
      partSearchTarget: $("#partSearchTarget").value.trim(),
      quantityTarget: $("#quantityTarget").value.trim(),
      addPartButtonTarget: $("#addPartButtonTarget").value.trim(),
      parts: state.partTemplate.parts
    },
    settings: {
      browserType: $("#browserType").value,
      defaultWait: Number($("#defaultWait").value || 0),
      failureMode: $("#failureMode").value,
      requireConfirm: $("#requireConfirm").checked
    }
  };
}

function syncTopFields(config = state) {
  $("#flowName").value = config.flowName || "";
  $("#mesUrl").value = config.mesUrl || "";
  $("#loginEnabled").value = String(config.login?.enabled ?? true);
  $("#loginUsername").value = config.login?.username || "";
  $("#loginPassword").value = config.login?.password || "";
  $("#usernameTarget").value = config.login?.usernameTarget || "#username";
  $("#passwordTarget").value = config.login?.passwordTarget || "#password";
  $("#loginButtonTarget").value = config.login?.loginButtonTarget || "登录";
  $("#loginWaitMs").value = config.login?.waitMs ?? 1200;
  $("#templateName").value = config.partTemplate?.name || "";
  $("#rowClickRule").value = config.partTemplate?.rowClickRule || "byPartCode";
  $("#finalButton").value = config.partTemplate?.finalButton || "";
  $("#partSearchTarget").value = config.partTemplate?.partSearchTarget || "";
  $("#quantityTarget").value = config.partTemplate?.quantityTarget || "";
  $("#addPartButtonTarget").value = config.partTemplate?.addPartButtonTarget || "";
  $("#browserType").value = config.settings?.browserType || "chrome";
  $("#defaultWait").value = config.settings?.defaultWait ?? 800;
  $("#failureMode").value = config.settings?.failureMode || "pause";
  $("#requireConfirm").checked = Boolean(config.settings?.requireConfirm);
}

function updatePreview() {
  $("#configPreview").textContent = JSON.stringify(getConfig(), null, 2);
}

function updateStepValueField(item, action) {
  const valueField = $("[data-field='value']", item);
  if (!valueField) return;
  const isButtonOnly = action === "buttonClick" || action === "click";
  valueField.disabled = isButtonOnly;
  valueField.placeholder = isButtonOnly ? "点击按钮不需要填写" : "";
  if (isButtonOnly) valueField.value = "";
}

function normalizeClickStep(step) {
  if (step.action === "buttonClick" || step.action === "click") {
    step.value = "";
  }
  return step;
}

function normalizePart(part = {}) {
  return {
    code: part.code || "",
    name: part.name || "",
    quantity: Number(part.quantity || 0),
    rowTarget: part.rowTarget || "",
    warehouse: part.warehouse || "",
    station: part.station || "",
    substitute: part.substitute || "",
    remark: part.remark || ""
  };
}

function renderSteps() {
  const list = $("#stepsList");
  list.innerHTML = "";
  state.steps.forEach((step, index) => {
    normalizeClickStep(step);
    const fragment = $("#stepTemplate").content.cloneNode(true);
    const item = $(".step-item", fragment);
    $(".step-number", item).textContent = `第 ${index + 1} 步`;

    $$("[data-field]", item).forEach((field) => {
      field.value = step[field.dataset.field] ?? "";
      const handleFieldChange = () => {
        const key = field.dataset.field;
        state.steps[index][key] = key === "waitMs" ? Number(field.value || 0) : field.value;
        if (key === "action") {
          normalizeClickStep(state.steps[index]);
          updateStepValueField(item, field.value);
        }
        updatePreview();
      };
      field.addEventListener("input", handleFieldChange);
      field.addEventListener("change", handleFieldChange);
    });

    updateStepValueField(item, step.action);
    $(".remove-step", item).addEventListener("click", () => {
      state.steps.splice(index, 1);
      renderSteps();
      updatePreview();
    });
    list.appendChild(fragment);
  });
}

function renderParts() {
  const list = $("#partsList");
  list.innerHTML = "";
  state.partTemplate.parts.forEach((part, index) => {
    const normalized = normalizePart(part);
    state.partTemplate.parts[index] = normalized;
    const fragment = $("#partTemplate").content.cloneNode(true);
    const item = $(".part-item", fragment);
    $(".part-title", item).textContent = `零件 ${index + 1}：${normalized.code || "未填编码"}`;

    $$("[data-field]", item).forEach((field) => {
      field.value = normalized[field.dataset.field] ?? "";
      const handleFieldChange = () => {
        const key = field.dataset.field;
        state.partTemplate.parts[index][key] = key === "quantity" ? Number(field.value || 0) : field.value;
        $(".part-title", item).textContent = `零件 ${index + 1}：${state.partTemplate.parts[index].code || "未填编码"}`;
        updatePreview();
      };
      field.addEventListener("input", handleFieldChange);
      field.addEventListener("change", handleFieldChange);
    });

    $(".remove-part", item).addEventListener("click", () => {
      state.partTemplate.parts.splice(index, 1);
      renderParts();
      updatePreview();
    });
    list.appendChild(fragment);
  });
}

function parseBomText(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split(/\t|,|，/).map((cell) => cell.trim()))
    .filter((cells) => cells.length && !/^(零件编码|编码|part|part\s*code)$/i.test(cells[0]))
    .map((cells) => normalizePart({
      code: cells[0],
      name: cells[1] || "",
      quantity: cells[2] || 1,
      warehouse: cells[3] || "",
      remark: cells.slice(4).join(" ")
    }))
    .filter((part) => part.code);
}

function applyBom(append) {
  const parts = parseBomText($("#bomText").value);
  if (!parts.length) {
    addLog("没有解析到 BOM 零件，请检查粘贴内容。");
    return;
  }
  state.partTemplate.parts = append ? state.partTemplate.parts.concat(parts) : parts;
  renderParts();
  updatePreview();
  addLog(`已从 BOM ${append ? "追加" : "生成"} ${parts.length} 个零件。`);
}

function loadConfig(config) {
  Object.assign(state, {
    flowName: config.flowName || state.flowName,
    mesUrl: config.mesUrl || "",
    login: {
      enabled: config.login?.enabled ?? true,
      username: config.login?.username || "",
      password: config.login?.password || "",
      usernameTarget: config.login?.usernameTarget || "#username",
      passwordTarget: config.login?.passwordTarget || "#password",
      loginButtonTarget: config.login?.loginButtonTarget || "登录",
      waitMs: Number(config.login?.waitMs ?? 1200)
    },
    steps: Array.isArray(config.steps) ? config.steps.map(normalizeClickStep) : [],
    partTemplate: {
      name: config.partTemplate?.name || "BOM 生产领料",
      rowClickRule: config.partTemplate?.rowClickRule || "byPartCode",
      finalButton: config.partTemplate?.finalButton || "",
      partSearchTarget: config.partTemplate?.partSearchTarget || "",
      quantityTarget: config.partTemplate?.quantityTarget || "",
      addPartButtonTarget: config.partTemplate?.addPartButtonTarget || "",
      parts: Array.isArray(config.partTemplate?.parts) ? config.partTemplate.parts.map(normalizePart) : []
    },
    settings: {
      browserType: config.settings?.browserType || "chrome",
      defaultWait: Number(config.settings?.defaultWait ?? 800),
      failureMode: config.settings?.failureMode || "pause",
      requireConfirm: Boolean(config.settings?.requireConfirm)
    }
  });
  syncTopFields(state);
  renderSteps();
  renderParts();
  updatePreview();
}

function addLog(message) {
  const li = document.createElement("li");
  li.textContent = message;
  $("#runLog").appendChild(li);
}

function simulateRun() {
  const config = getConfig();
  $("#runLog").innerHTML = "";
  addLog(`准备打开 MES：${config.mesUrl || "未填写地址"}`);
  if (config.login.enabled) {
    addLog(`自动登录账号：${config.login.username || "未填写账号"}`);
    addLog(`点击登录按钮：${config.login.loginButtonTarget || "未配置"}`);
  }
  config.steps.forEach((step, index) => {
    const actionName = step.action === "buttonClick" ? "只点按钮" : step.action;
    addLog(`第 ${index + 1} 步：${actionName} -> ${step.targetType}:${step.target || "未填写目标"}`);
  });
  addLog(`本单共 ${config.partTemplate.parts.length} 个领料零件。`);
  config.partTemplate.parts.forEach((part, index) => {
    addLog(`零件 ${index + 1}：${part.code || "未填编码"}，数量 ${part.quantity || 0}，库位 ${part.warehouse || "未填"}`);
  });
  addLog(`所有零件选完后点击：${config.partTemplate.finalButton || "未配置"}`);
  if (config.settings.requireConfirm) {
    addLog("提交前需要二次确认。");
  }
  if (config.mesUrl) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    addLog("即将在新窗口打开 MES 目标页面。");
    setTimeout(() => {
      const opened = window.open(config.mesUrl, "_blank", "noopener,noreferrer");
      if (!opened) {
        addLog("浏览器拦截了新窗口，请允许弹窗后重试。");
      }
    }, 500);
  }
}

function addStep(step) {
  state.steps.push(normalizeClickStep(step));
  renderSteps();
  updatePreview();
}

function addPart() {
  state.partTemplate.parts.push(normalizePart({ quantity: 1 }));
  renderParts();
  updatePreview();
}

function bindActions() {
  $("#addStep").addEventListener("click", () => {
    addStep({
      name: `自定义步骤 ${state.steps.length + 1}`,
      action: "click",
      targetType: "text",
      target: "",
      value: "",
      waitMs: Number($("#defaultWait").value || 800)
    });
  });

  $("#addButtonStep").addEventListener("click", () => {
    addStep({
      name: `点击按钮 ${state.steps.length + 1}`,
      action: "buttonClick",
      targetType: "text",
      target: "",
      value: "",
      waitMs: Number($("#defaultWait").value || 800)
    });
  });

  $("#addPart").addEventListener("click", addPart);
  $("#parseBom").addEventListener("click", () => applyBom(false));
  $("#appendBom").addEventListener("click", () => applyBom(true));
  $("#clearParts").addEventListener("click", () => {
    state.partTemplate.parts = [];
    renderParts();
    updatePreview();
    addLog("已清空零件清单。");
  });

  [
    "flowName",
    "mesUrl",
    "loginEnabled",
    "loginUsername",
    "loginPassword",
    "usernameTarget",
    "passwordTarget",
    "loginButtonTarget",
    "loginWaitMs",
    "templateName",
    "rowClickRule",
    "finalButton",
    "partSearchTarget",
    "quantityTarget",
    "addPartButtonTarget",
    "browserType",
    "defaultWait",
    "failureMode",
    "requireConfirm"
  ].forEach((id) => {
    $(`#${id}`).addEventListener("input", updatePreview);
    $(`#${id}`).addEventListener("change", updatePreview);
  });

  $("#saveConfig").addEventListener("click", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(getConfig()));
    addLog("配置已保存到本机浏览器。");
  });

  $("#exportConfig").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(getConfig(), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "mes-bom-issue-flow.json";
    link.click();
    URL.revokeObjectURL(url);
  });

  $("#importConfig").addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const text = await file.text();
    loadConfig(JSON.parse(text));
    addLog(`已导入配置：${file.name}`);
    event.target.value = "";
  });

  $("#copyConfig").addEventListener("click", async () => {
    await navigator.clipboard.writeText(JSON.stringify(getConfig(), null, 2));
    addLog("配置 JSON 已复制。");
  });

  $("#runSimulation").addEventListener("click", simulateRun);
  $("#clearLog").addEventListener("click", () => {
    $("#runLog").innerHTML = "";
  });
}

function init() {
  const saved = localStorage.getItem(STORAGE_KEY);
  bindTabs();
  bindActions();
  try {
    loadConfig(saved ? JSON.parse(saved) : state);
  } catch (error) {
    localStorage.removeItem(STORAGE_KEY);
    loadConfig(state);
    addLog("旧配置读取失败，已恢复默认配置。");
  }
}

init();
