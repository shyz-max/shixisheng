var STORAGE_KEY = "mes-outbound-flow-config";

var state = {
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
    selectPartButtonTarget: "",
    partSearchTarget: "",
    partSearchButtonTarget: "",
    partResultScopeTarget: "",
    partNextPageTarget: "",
    partMaxPages: 5,
    quantityTarget: "",
    partConfirmButtonTarget: "",
    drawingColumnName: "零件图号",
    quantityColumnName: "数量",
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

function $(selector, root) {
  return (root || document).querySelector(selector);
}

function $$(selector, root) {
  return Array.prototype.slice.call((root || document).querySelectorAll(selector));
}

function addEvent(element, eventName, handler) {
  if (!element) return;
  if (element.addEventListener) element.addEventListener(eventName, handler, false);
  else element.attachEvent("on" + eventName, handler);
}

function addClass(element, className) {
  if (!element) return;
  if ((" " + element.className + " ").indexOf(" " + className + " ") < 0) {
    element.className = element.className ? element.className + " " + className : className;
  }
}

function removeClass(element, className) {
  if (!element) return;
  element.className = (" " + element.className + " ").replace(" " + className + " ", " ").replace(/^\s+|\s+$/g, "");
}

function cloneTemplate(id, itemClassName) {
  var source = document.getElementById(id);
  var box = document.createElement("div");
  box.innerHTML = source.innerHTML;
  return $(itemClassName, box);
}

function bindTabs() {
  var tabs = $$(".tab");
  var panels = $$(".panel");
  for (var i = 0; i < tabs.length; i++) {
    addEvent(tabs[i], "click", function () {
      for (var j = 0; j < tabs.length; j++) removeClass(tabs[j], "active");
      for (var k = 0; k < panels.length; k++) removeClass(panels[k], "active");
      addClass(this, "active");
      addClass(document.getElementById(this.getAttribute("data-tab")), "active");
    });
  }
}

function numberValue(id, fallback) {
  var value = document.getElementById(id).value;
  return Number(value || fallback || 0);
}

function getConfig() {
  return {
    flowName: $("#flowName").value.replace(/^\s+|\s+$/g, ""),
    mesUrl: $("#mesUrl").value.replace(/^\s+|\s+$/g, ""),
    login: {
      enabled: $("#loginEnabled").value === "true",
      username: $("#loginUsername").value.replace(/^\s+|\s+$/g, ""),
      password: $("#loginPassword").value,
      usernameTarget: $("#usernameTarget").value.replace(/^\s+|\s+$/g, ""),
      passwordTarget: $("#passwordTarget").value.replace(/^\s+|\s+$/g, ""),
      loginButtonTarget: $("#loginButtonTarget").value.replace(/^\s+|\s+$/g, ""),
      waitMs: numberValue("loginWaitMs", 0)
    },
    steps: state.steps,
    partTemplate: {
      name: $("#templateName").value.replace(/^\s+|\s+$/g, ""),
      rowClickRule: $("#rowClickRule").value,
      finalButton: $("#finalButton").value.replace(/^\s+|\s+$/g, ""),
      selectPartButtonTarget: $("#selectPartButtonTarget").value.replace(/^\s+|\s+$/g, ""),
      partSearchTarget: $("#partSearchTarget").value.replace(/^\s+|\s+$/g, ""),
      partSearchButtonTarget: $("#partSearchButtonTarget").value.replace(/^\s+|\s+$/g, ""),
      partResultScopeTarget: $("#partResultScopeTarget").value.replace(/^\s+|\s+$/g, ""),
      partNextPageTarget: $("#partNextPageTarget").value.replace(/^\s+|\s+$/g, ""),
      partMaxPages: numberValue("partMaxPages", 5),
      quantityTarget: $("#quantityTarget").value.replace(/^\s+|\s+$/g, ""),
      partConfirmButtonTarget: $("#partConfirmButtonTarget").value.replace(/^\s+|\s+$/g, ""),
      drawingColumnName: $("#drawingColumnName").value.replace(/^\s+|\s+$/g, ""),
      quantityColumnName: $("#quantityColumnName").value.replace(/^\s+|\s+$/g, ""),
      parts: state.partTemplate.parts
    },
    settings: {
      browserType: $("#browserType").value,
      defaultWait: numberValue("defaultWait", 0),
      failureMode: $("#failureMode").value,
      requireConfirm: $("#requireConfirm").checked
    }
  };
}

function syncTopFields(config) {
  $("#flowName").value = config.flowName || "";
  $("#mesUrl").value = config.mesUrl || "";
  $("#loginEnabled").value = String(config.login && config.login.enabled !== false);
  $("#loginUsername").value = config.login && config.login.username || "";
  $("#loginPassword").value = config.login && config.login.password || "";
  $("#usernameTarget").value = config.login && config.login.usernameTarget || "#username";
  $("#passwordTarget").value = config.login && config.login.passwordTarget || "#password";
  $("#loginButtonTarget").value = config.login && config.login.loginButtonTarget || "登录";
  $("#loginWaitMs").value = config.login && config.login.waitMs != null ? config.login.waitMs : 1200;
  $("#templateName").value = config.partTemplate && config.partTemplate.name || "";
  $("#rowClickRule").value = config.partTemplate && config.partTemplate.rowClickRule || "byPartCode";
  $("#finalButton").value = config.partTemplate && config.partTemplate.finalButton || "";
  $("#selectPartButtonTarget").value = config.partTemplate && (config.partTemplate.selectPartButtonTarget || config.partTemplate.addPartButtonTarget) || "";
  $("#partSearchTarget").value = config.partTemplate && config.partTemplate.partSearchTarget || "";
  $("#partSearchButtonTarget").value = config.partTemplate && config.partTemplate.partSearchButtonTarget || "";
  $("#partResultScopeTarget").value = config.partTemplate && config.partTemplate.partResultScopeTarget || "";
  $("#partNextPageTarget").value = config.partTemplate && config.partTemplate.partNextPageTarget || "";
  $("#partMaxPages").value = config.partTemplate && config.partTemplate.partMaxPages || 5;
  $("#quantityTarget").value = config.partTemplate && config.partTemplate.quantityTarget || "";
  $("#partConfirmButtonTarget").value = config.partTemplate && (config.partTemplate.partConfirmButtonTarget || config.partTemplate.addPartButtonTarget) || "";
  $("#drawingColumnName").value = config.partTemplate && config.partTemplate.drawingColumnName || "零件图号";
  $("#quantityColumnName").value = config.partTemplate && config.partTemplate.quantityColumnName || "数量";
  $("#browserType").value = config.settings && config.settings.browserType || "chrome";
  $("#defaultWait").value = config.settings && config.settings.defaultWait != null ? config.settings.defaultWait : 800;
  $("#failureMode").value = config.settings && config.settings.failureMode || "pause";
  $("#requireConfirm").checked = !!(config.settings && config.settings.requireConfirm);
}

function updatePreview() {
  $("#configPreview").innerHTML = "";
  $("#configPreview").appendChild(document.createTextNode(JSON.stringify(getConfig(), null, 2)));
}

function updateStepValueField(item, action) {
  var valueField = $("[data-field='value']", item);
  if (!valueField) return;
  var isButtonOnly = action === "buttonClick" || action === "click";
  valueField.disabled = isButtonOnly;
  valueField.placeholder = isButtonOnly ? "点击按钮不需要填写" : "";
  if (isButtonOnly) valueField.value = "";
}

function normalizeClickStep(step) {
  if (step.action === "buttonClick" || step.action === "click") step.value = "";
  return step;
}

function normalizePart(part) {
  part = part || {};
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
  var list = $("#stepsList");
  list.innerHTML = "";
  for (var i = 0; i < state.steps.length; i++) {
    (function (index) {
      var step = normalizeClickStep(state.steps[index]);
      var item = cloneTemplate("stepTemplate", ".step-item");
      $(".step-number", item).innerHTML = "第 " + (index + 1) + " 步";
      var fields = $$("[data-field]", item);
      for (var f = 0; f < fields.length; f++) {
        (function (field) {
          field.value = step[field.getAttribute("data-field")] || "";
          var handleFieldChange = function () {
            var key = field.getAttribute("data-field");
            state.steps[index][key] = key === "waitMs" ? Number(field.value || 0) : field.value;
            if (key === "action") {
              normalizeClickStep(state.steps[index]);
              updateStepValueField(item, field.value);
            }
            updatePreview();
          };
          addEvent(field, "input", handleFieldChange);
          addEvent(field, "change", handleFieldChange);
        })(fields[f]);
      }
      updateStepValueField(item, step.action);
      addEvent($(".remove-step", item), "click", function () {
        state.steps.splice(index, 1);
        renderSteps();
        renderPendingFlow();
        updatePreview();
      });
      list.appendChild(item);
    })(i);
  }
}

function renderParts() {
  var list = $("#partsList");
  list.innerHTML = "";
  for (var i = 0; i < state.partTemplate.parts.length; i++) {
    (function (index) {
      var part = normalizePart(state.partTemplate.parts[index]);
      state.partTemplate.parts[index] = part;
      var item = cloneTemplate("partTemplate", ".part-item");
      var title = $(".part-title", item);
      title.innerHTML = "零件 " + (index + 1) + "：" + (part.code || "未填编码");
      var fields = $$("[data-field]", item);
      for (var f = 0; f < fields.length; f++) {
        (function (field) {
          field.value = part[field.getAttribute("data-field")] || "";
          var handleFieldChange = function () {
            var key = field.getAttribute("data-field");
            state.partTemplate.parts[index][key] = key === "quantity" ? Number(field.value || 0) : field.value;
            title.innerHTML = "零件 " + (index + 1) + "：" + (state.partTemplate.parts[index].code || "未填编码");
            updatePreview();
          };
          addEvent(field, "input", handleFieldChange);
          addEvent(field, "change", handleFieldChange);
        })(fields[f]);
      }
      addEvent($(".remove-part", item), "click", function () {
        state.partTemplate.parts.splice(index, 1);
        renderParts();
        updatePreview();
      });
      list.appendChild(item);
    })(i);
  }
  renderPendingFlow();
}

function parseBomText(text) {
  var lines = text.split(/\r?\n/);
  var parts = [];
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].replace(/^\s+|\s+$/g, "");
    if (!line) continue;
    var cells = line.split(/\t|,|，/);
    for (var c = 0; c < cells.length; c++) cells[c] = cells[c].replace(/^\s+|\s+$/g, "");
    if (/^(零件编码|编码|part|part\s*code)$/i.test(cells[0])) continue;
    if (cells[0]) {
      parts.push(normalizePart({
        code: cells[0],
        name: cells[1] || "",
        quantity: cells[2] || 1,
        warehouse: cells[3] || "",
        remark: cells.slice(4).join(" ")
      }));
    }
  }
  return parts;
}

function findHeaderIndex(headers, preferredName) {
  var candidates = [preferredName, "零件图号", "图号", "物料图号", "物料编码", "零件编码", "编码", "part no", "part number", "part code"];
  for (var i = 0; i < candidates.length; i++) {
    var candidate = String(candidates[i] || "").replace(/^\s+|\s+$/g, "").toLowerCase();
    for (var j = 0; j < headers.length; j++) {
      if (String(headers[j] || "").replace(/^\s+|\s+$/g, "").toLowerCase() === candidate) return j;
    }
  }
  return 0;
}

function findRequiredHeaderIndex(headers, names) {
  for (var i = 0; i < names.length; i++) {
    var candidate = String(names[i] || "").replace(/^\s+|\s+$/g, "").toLowerCase();
    for (var j = 0; j < headers.length; j++) {
      if (String(headers[j] || "").replace(/^\s+|\s+$/g, "").toLowerCase() === candidate) return j;
    }
  }
  return -1;
}

function rowsToParts(rows) {
  if (!rows.length) return [];
  var headers = rows[0] || [];
  var codeIndex = findRequiredHeaderIndex(headers, [$("#drawingColumnName").value, "零件图号", "图号", "物料图号", "物料编码", "零件编码", "编码", "part no", "part number", "part code"]);
  var qtyIndex = findRequiredHeaderIndex(headers, [$("#quantityColumnName").value, "数量", "计划数", "需求数量", "领料数量", "qty", "quantity"]);
  if (codeIndex < 0 || qtyIndex < 0) {
    addLog("Excel 必须包含图号列和数量列。当前识别结果：图号列 " + (codeIndex >= 0 ? "已找到" : "未找到") + "，数量列 " + (qtyIndex >= 0 ? "已找到" : "未找到") + "。");
    return [];
  }
  var nameIndex = findHeaderIndex(headers, "零件名称");
  var warehouseIndex = findHeaderIndex(headers, "库位");
  var parts = [];
  for (var i = 1; i < rows.length; i++) {
    var row = rows[i] || [];
    var hasValue = false;
    for (var c = 0; c < row.length; c++) {
      if (String(row[c] || "").replace(/^\s+|\s+$/g, "")) hasValue = true;
    }
    if (!hasValue) continue;
    var part = normalizePart({
      code: row[codeIndex] || "",
      name: nameIndex === codeIndex ? "" : row[nameIndex] || "",
      quantity: row[qtyIndex] || 0,
      warehouse: warehouseIndex === codeIndex ? "" : row[warehouseIndex] || ""
    });
    if (part.code) parts.push(part);
  }
  return parts;
}

function renderPendingFlow() {
  var list = $("#pendingFlow");
  if (!list) return;
  list.innerHTML = "";
  var pre = document.createElement("li");
  pre.appendChild(document.createTextNode("先执行选料前步骤 " + state.steps.length + " 项：进入页面/填写单头/点击确认等。"));
  list.appendChild(pre);
  for (var s = 0; s < state.steps.length; s++) {
    var step = state.steps[s];
    var preStep = document.createElement("li");
    preStep.appendChild(document.createTextNode("前置 " + (s + 1) + "：" + (step.name || step.action) + " -> " + (step.target || "未填写目标")));
    list.appendChild(preStep);
  }
  if (!state.partTemplate.parts.length) {
    var empty = document.createElement("li");
    empty.appendChild(document.createTextNode("然后上传包含图号、数量的 Excel，自动生成逐个选料流程。"));
    list.appendChild(empty);
    return;
  }
  for (var i = 0; i < state.partTemplate.parts.length; i++) {
    var part = state.partTemplate.parts[i];
    var li = document.createElement("li");
    li.appendChild(document.createTextNode("物料 " + (i + 1) + "：点击添加 -> 子表输入图号 " + part.code + " -> 查询并精确选择 -> 提交添加 -> 填计划数 " + part.quantity));
    list.appendChild(li);
  }
}

function readExcelFile(file) {
  if (!window.XLSX) {
    addLog("Excel 解析库未加载，请检查网络后刷新页面。");
    return;
  }
  var reader = new FileReader();
  reader.onload = function (event) {
    var data = event.target.result;
    var workbook = XLSX.read(data, { type: "binary" });
    var firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    var rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1, raw: false });
    var parts = rowsToParts(rows);
    if (!parts.length) {
      addLog("Excel 中没有识别到零件图号，请检查图号列名。");
      return;
    }
    state.partTemplate.parts = parts;
    renderParts();
    updatePreview();
    addLog("已从 Excel 读取 " + parts.length + " 个零件图号。");
  };
  reader.onerror = function () {
    addLog("Excel 文件读取失败。");
  };
  reader.readAsBinaryString(file);
}

function applyBom(append) {
  var parts = parseBomText($("#bomText").value);
  if (!parts.length) {
    addLog("没有解析到 BOM 零件，请检查粘贴内容。");
    return;
  }
  state.partTemplate.parts = append ? state.partTemplate.parts.concat(parts) : parts;
  renderParts();
  updatePreview();
  addLog("已从 BOM " + (append ? "追加" : "生成") + " " + parts.length + " 个零件。");
}

function loadConfig(config) {
  state.flowName = config.flowName || state.flowName;
  state.mesUrl = config.mesUrl || "";
  state.login = {
    enabled: !config.login || config.login.enabled !== false,
    username: config.login && config.login.username || "",
    password: config.login && config.login.password || "",
    usernameTarget: config.login && config.login.usernameTarget || "#username",
    passwordTarget: config.login && config.login.passwordTarget || "#password",
    loginButtonTarget: config.login && config.login.loginButtonTarget || "登录",
    waitMs: Number(config.login && config.login.waitMs != null ? config.login.waitMs : 1200)
  };
  state.steps = config.steps && config.steps.length ? config.steps : state.steps;
  for (var i = 0; i < state.steps.length; i++) normalizeClickStep(state.steps[i]);
  state.partTemplate = {
    name: config.partTemplate && config.partTemplate.name || "BOM 生产领料",
    rowClickRule: config.partTemplate && config.partTemplate.rowClickRule || "byPartCode",
    finalButton: config.partTemplate && config.partTemplate.finalButton || "",
    selectPartButtonTarget: config.partTemplate && (config.partTemplate.selectPartButtonTarget || config.partTemplate.addPartButtonTarget) || "",
    partSearchTarget: config.partTemplate && config.partTemplate.partSearchTarget || "",
    partSearchButtonTarget: config.partTemplate && config.partTemplate.partSearchButtonTarget || "",
    partResultScopeTarget: config.partTemplate && config.partTemplate.partResultScopeTarget || "",
    partNextPageTarget: config.partTemplate && config.partTemplate.partNextPageTarget || "",
    partMaxPages: Number(config.partTemplate && config.partTemplate.partMaxPages || 5),
    quantityTarget: config.partTemplate && config.partTemplate.quantityTarget || "",
    partConfirmButtonTarget: config.partTemplate && (config.partTemplate.partConfirmButtonTarget || config.partTemplate.addPartButtonTarget) || "",
    drawingColumnName: config.partTemplate && config.partTemplate.drawingColumnName || "零件图号",
    quantityColumnName: config.partTemplate && config.partTemplate.quantityColumnName || "数量",
    parts: []
  };
  var sourceParts = config.partTemplate && config.partTemplate.parts ? config.partTemplate.parts : state.partTemplate.parts;
  for (var p = 0; p < sourceParts.length; p++) state.partTemplate.parts.push(normalizePart(sourceParts[p]));
  if (!state.partTemplate.parts.length) state.partTemplate.parts.push(normalizePart({ code: "P001", name: "示例零件", quantity: 1 }));
  state.settings = {
    browserType: config.settings && config.settings.browserType || "chrome",
    defaultWait: Number(config.settings && config.settings.defaultWait != null ? config.settings.defaultWait : 800),
    failureMode: config.settings && config.settings.failureMode || "pause",
    requireConfirm: !!(config.settings && config.settings.requireConfirm)
  };
  syncTopFields(state);
  renderSteps();
  renderParts();
  updatePreview();
}

function addLog(message) {
  var li = document.createElement("li");
  li.appendChild(document.createTextNode(message));
  $("#runLog").appendChild(li);
}

function simulateRun() {
  var config = getConfig();
  $("#runLog").innerHTML = "";
  addLog("准备打开 MES：" + (config.mesUrl || "未填写地址"));
  if (config.login.enabled) {
    addLog("自动登录账号：" + (config.login.username || "未填写账号"));
    addLog("点击登录按钮：" + (config.login.loginButtonTarget || "未配置"));
  }
  for (var i = 0; i < config.steps.length; i++) {
    var step = config.steps[i];
    var actionName = step.action === "buttonClick" ? "只点按钮" : step.action;
    addLog("第 " + (i + 1) + " 步：" + actionName + " -> " + step.targetType + ":" + (step.target || "未填写目标"));
  }
  addLog("本单共 " + config.partTemplate.parts.length + " 个领料零件。");
  for (var p = 0; p < config.partTemplate.parts.length; p++) {
    var part = config.partTemplate.parts[p];
    addLog("零件 " + (p + 1) + "：" + (part.code || "未填编码") + "，点击添加 -> 子表查图号 -> 精确选中 -> 提交 -> 填计划数 " + (part.quantity || 0));
  }
  addLog("所有零件选完后点击：" + (config.partTemplate.finalButton || "未配置"));
  if (config.settings.requireConfirm) addLog("提交前需要二次确认。");
  if (config.mesUrl) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    addLog("即将在新窗口打开 MES 目标页面。");
    setTimeout(function () {
      var opened = window.open(config.mesUrl, "_blank");
      if (!opened) addLog("浏览器拦截了新窗口，请允许弹窗后重试。");
    }, 500);
  }
}

function addStep(step) {
  state.steps.push(normalizeClickStep(step));
  renderSteps();
  renderPendingFlow();
  updatePreview();
}

function addPart() {
  state.partTemplate.parts.push(normalizePart({ quantity: 1 }));
  renderParts();
  updatePreview();
}

function addPrePickPreset() {
  addStep({
    name: "打开出入库管理",
    action: "buttonClick",
    targetType: "text",
    target: "出入库管理",
    value: "",
    waitMs: numberValue("defaultWait", 800)
  });
  addStep({
    name: "打开出库申请",
    action: "buttonClick",
    targetType: "text",
    target: "出库申请",
    value: "",
    waitMs: numberValue("defaultWait", 800)
  });
  addStep({
    name: "打开零星计划配套单维护",
    action: "buttonClick",
    targetType: "text",
    target: "零星计划配套单维护",
    value: "",
    waitMs: numberValue("defaultWait", 800)
  });
}

function bindActions() {
  addEvent($("#addStep"), "click", function () {
    addStep({
      name: "自定义步骤 " + (state.steps.length + 1),
      action: "click",
      targetType: "text",
      target: "",
      value: "",
      waitMs: numberValue("defaultWait", 800)
    });
  });
  addEvent($("#addButtonStep"), "click", function () {
    addStep({
      name: "点击按钮 " + (state.steps.length + 1),
      action: "buttonClick",
      targetType: "text",
      target: "",
      value: "",
      waitMs: numberValue("defaultWait", 800)
    });
  });
  addEvent($("#addPrePickPreset"), "click", addPrePickPreset);
  addEvent($("#addPart"), "click", addPart);
  addEvent($("#parseBom"), "click", function () { applyBom(false); });
  addEvent($("#appendBom"), "click", function () { applyBom(true); });
  addEvent($("#clearParts"), "click", function () {
    state.partTemplate.parts = [];
    renderParts();
    updatePreview();
    addLog("已清空零件清单。");
  });

  var ids = ["flowName", "mesUrl", "loginEnabled", "loginUsername", "loginPassword", "usernameTarget", "passwordTarget", "loginButtonTarget", "loginWaitMs", "templateName", "rowClickRule", "finalButton", "selectPartButtonTarget", "partSearchTarget", "partSearchButtonTarget", "partResultScopeTarget", "partNextPageTarget", "partMaxPages", "quantityTarget", "partConfirmButtonTarget", "drawingColumnName", "quantityColumnName", "browserType", "defaultWait", "failureMode", "requireConfirm"];
  for (var i = 0; i < ids.length; i++) {
    addEvent(document.getElementById(ids[i]), "input", updatePreview);
    addEvent(document.getElementById(ids[i]), "change", updatePreview);
  }

  addEvent($("#saveConfig"), "click", function () {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(getConfig()));
    addLog("配置已保存到本机浏览器。");
  });
  addEvent($("#exportConfig"), "click", function () {
    var text = JSON.stringify(getConfig(), null, 2);
    if (window.navigator && window.navigator.msSaveBlob) {
      window.navigator.msSaveBlob(new Blob([text], { type: "application/json" }), "mes-bom-issue-flow.json");
      return;
    }
    var blob = new Blob([text], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = "mes-bom-issue-flow.json";
    link.click();
    URL.revokeObjectURL(url);
  });
  addEvent($("#importConfig"), "change", function (event) {
    var file = event.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function (loadEvent) {
      loadConfig(JSON.parse(loadEvent.target.result));
      addLog("已导入配置：" + file.name);
    };
    reader.readAsText(file);
    event.target.value = "";
  });
  addEvent($("#excelFile"), "change", function (event) {
    var file = event.target.files[0];
    if (!file) return;
    readExcelFile(file);
    event.target.value = "";
  });
  addEvent($("#copyConfig"), "click", function () {
    var text = JSON.stringify(getConfig(), null, 2);
    if (window.clipboardData) window.clipboardData.setData("Text", text);
    addLog("配置 JSON 已复制。");
  });
  addEvent($("#runSimulation"), "click", simulateRun);
  addEvent($("#clearLog"), "click", function () {
    $("#runLog").innerHTML = "";
  });
}

function init() {
  var saved = localStorage.getItem(STORAGE_KEY);
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
