const STORAGE_KEY = "mes-outbound-flow-config";

const state = {
  flowName: "MES 零件出库申请",
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
      name: "打开出库申请菜单",
      action: "click",
      targetType: "text",
      target: "出库申请",
      value: "",
      waitMs: 800
    },
    {
      name: "选择申请类型",
      action: "select",
      targetType: "css",
      target: "#applyType",
      value: "零件出库",
      waitMs: 800
    }
  ],
  partTemplate: {
    name: "常用出库零件",
    rowClickRule: "byPartCode",
    finalButton: "",
    parts: [
      {
        code: "P001",
        name: "示例零件",
        quantity: 1,
        rowTarget: "",
        warehouse: "",
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
  $("#browserType").value = config.settings?.browserType || "chrome";
  $("#defaultWait").value = config.settings?.defaultWait ?? 800;
  $("#failureMode").value = config.settings?.failureMode || "pause";
  $("#requireConfirm").checked = Boolean(config.settings?.requireConfirm);
}

function updatePreview() {
  $("#configPreview").textContent = JSON.stringify(getConfig(), null, 2);
}

function renderSteps() {
  const list = $("#stepsList");
  list.innerHTML = "";
  state.steps.forEach((step, index) => {
    const node = $("#stepTemplate").content.cloneNode(true);
    $(".step-number", node).textContent = `第 ${index + 1} 步`;
    $$("[data-field]", node).forEach((field) => {
      field.value = step[field.dataset.field] ?? "";
      field.addEventListener("input", () => {
        const key = field.dataset.field;
        state.steps[index][key] = key === "waitMs" ? Number(field.value || 0) : field.value;
        updatePreview();
      });
    });
    $(".remove-step", node).addEventListener("click", () => {
      state.steps.splice(index, 1);
      renderSteps();
      updatePreview();
    });
    list.appendChild(node);
  });
}

function renderParts() {
  const list = $("#partsList");
  list.innerHTML = "";
  state.partTemplate.parts.forEach((part, index) => {
    const node = $("#partTemplate").content.cloneNode(true);
    $(".part-title", node).textContent = `零件 ${index + 1}`;
    $$("[data-field]", node).forEach((field) => {
      field.value = part[field.dataset.field] ?? "";
      field.addEventListener("input", () => {
        const key = field.dataset.field;
        state.partTemplate.parts[index][key] = key === "quantity" ? Number(field.value || 0) : field.value;
        updatePreview();
      });
    });
    $(".remove-part", node).addEventListener("click", () => {
      state.partTemplate.parts.splice(index, 1);
      renderParts();
      updatePreview();
    });
    list.appendChild(node);
  });
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
    steps: Array.isArray(config.steps) ? config.steps : [],
    partTemplate: {
      name: config.partTemplate?.name || "零件模板",
      rowClickRule: config.partTemplate?.rowClickRule || "byPartCode",
      finalButton: config.partTemplate?.finalButton || "",
      parts: Array.isArray(config.partTemplate?.parts) ? config.partTemplate.parts : []
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
    addLog(`填写账号框：${config.login.usernameTarget || "未配置"}`);
    addLog(`填写密码框：${config.login.passwordTarget || "未配置"}`);
    addLog(`点击登录按钮：${config.login.loginButtonTarget || "未配置"}`);
  }
  config.steps.forEach((step, index) => {
    addLog(`第 ${index + 1} 步：${step.action} -> ${step.targetType}:${step.target || "未填写目标"}`);
  });
  config.partTemplate.parts.forEach((part, index) => {
    addLog(`零件 ${index + 1}：${part.code || "未填编码"}，数量 ${part.quantity || 0}，行目标 ${part.rowTarget || config.partTemplate.rowClickRule}`);
  });
  addLog(`最后点击：${config.partTemplate.finalButton || "未配置"}`);
  if (config.settings.requireConfirm) {
    addLog("提交前需要二次确认。");
  }
}

function bindActions() {
  $("#addStep").addEventListener("click", () => {
    state.steps.push({
      name: `自定义步骤 ${state.steps.length + 1}`,
      action: "click",
      targetType: "text",
      target: "",
      value: "",
      waitMs: Number($("#defaultWait").value || 800)
    });
    renderSteps();
    updatePreview();
  });

  $("#addPart").addEventListener("click", () => {
    state.partTemplate.parts.push({
      code: "",
      name: "",
      quantity: 1,
      rowTarget: "",
      warehouse: "",
      remark: ""
    });
    renderParts();
    updatePreview();
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
    link.download = "mes-outbound-flow.json";
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
  loadConfig(saved ? JSON.parse(saved) : state);
}

init();
