//temp class not used for now
const { ipcRenderer, ipcMain, webContents } = require("electron");
const Utils = require("./Utils/Utils.js");

class OrbitContexMenu {
  constructor(process) {
    this.process = process;

    if (this.process == "main") {
      this.ready = this.initMainProcess();
    } else if (this.process == "core") {
      this.ready = this.initCoreProcess();
    } else {
      this.ready = this.initWebviewProcess();
    }
  }

  initMainProcess() {
    return new Promise((resolve) => {
      resolve();
    });
  }

  initRendererProcess() {
    return new Promise((resolve) => {
      window.addEventListener("contextmenu", (e) => {
        e.preventDefault();

        let options = { values: [] };

        const element = e.target;
        const selectedText = Utils.getSelectedText();
        const xyPoint = { x: e.x, y: e.y };

        if (
          element.type == "text" ||
          element.type == "password" ||
          element.type == "email"
        ) {
          options.values.push({ selectedText: selectedText, x: e.x, y: e.y });
          options.element = "input";
        } else {
          options.element = "webview";
          options.values.push({
            viewID: !this.areWeInADataURL()
              ? sessionStorage.getItem("viewID")
              : this.viewID,
            partition: !this.areWeInADataURL()
              ? sessionStorage.getItem("partition")
              : this.partition,
            origin: window.location.origin,
            selectedText: selectedText,
            x: e.x,
            y: e.y
          });
        }

        if (element.tagName == "A") {
          options.isLink = true;
          options.link = element.href;
        }

        if (Utils.isValidURL(selectedText)) {
          options.isLink = true;
          options.link = selectedText;
        }

        options.currentPage = window.location.href;
        options.sender = "webview";
        options.webContentsId = this.ipcRouter.webContentsId;
        ipcRenderer.send("context-menu", options);
      });
      resolve();
    });
  }

  generateMenuForWebview() {}

  generateMenuForCore() {}

  addItem(menu) {}

  collectDatas() {
    let datas = {};

    const element = e.target;
    const selectedText = Utils.getSelectedText();
    const xyPoint = { x: e.x, y: e.y };
  }
}

module.exports = OrbitContexMenu;
