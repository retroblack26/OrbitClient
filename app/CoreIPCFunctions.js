const Locales = require("./Locales");
const Config = new (require("./Models/Config"))();
const { ModalPopUp } = require("./Ui/Modal");

class CoreIPCFunctions {
  constructor(core) {
    this.core = core;
  }

  async saveState() {
    await this.core.navigation.saveState();
  }

  getMaster() {
    return this.core.usersModel.hash;
  }

  showAddUserModal(user) {
    const options = {
      message: Locales.get("modal.addUser.message"),
      title: Locales.get("modal.addUser.title"),
      buttons: [
        { text: Locales.get("modal.button.confirm"), type: "btn-green" },
        { text: Locales.get("modal.button.cancel"), type: "btn-red" }
      ],
      type: "info"
    };

    new ModalPopUp(options).popUp(1).then((result) => {
      if (result.buttonIndex == 0) {
        this.core.usersModel.addUser(
          user,
          false,
          Config.get("masterPassword"),
          async () => await this.core.setMasterPassword()
        );
      }
    });
  }

  async getPreloadOptions() {
    return {
      locale: Locales.data,
      autoLogin: Config.get("autoLogin").enabled,
      addUserModal: Config.get("modal").showAddUserModal,
      detectSID: Config.get("modal").detectSidModal,
      baseUrl: global.appPath,
      serverListElement: await this.core.serverListElement
    };
  }

  getUsersLogins(domain) {
    return this.core.usersModel.getUsersLogins(domain);
  }

  async popUp(options, priority) {
    return new Promise(async (resolve) => {
      let result = await new ModalPopUp(options).popUp(priority);
      resolve(result);
    });
  }

  async autoFill(id, autoLog) {
    let user;
    if (autoLog == true) {
      user = this.core.usersModel.get(Config.get("autoLogin").userID);
    } else {
      user = this.core.usersModel.get(id);
    }

    return { user, autoLog };
  }

  setUserInfo(infos, tabID) {
    let tabElement = document.querySelectorAll(
      'span[data-session="' + tabID + '"]'
    )[0];
    let tabTitle = tabElement.getElementsByClassName("nav-tabs-title")[0];
    let tabIcon = tabElement.getElementsByClassName("nav-tabs-favicon")[0];

    tabTitle.innerHTML = '<div class="slideText">' + infos.title + "</div>";
    tabTitle.title = infos.title;
    tabIcon.setAttribute("src", infos.rankIcon);
    tabIcon.classList.add("rank-icon");

    this.core.navigation.setTabInfos(tabID, infos);
  }

  redirectWebview(url, tabID) {
    this.core.navigation.handleUserAgent(url, tabID);
    this.core.navigation.getViewById(tabID).loadURL(url);
  }

  enableFullscreenButton(state = true) {
    let webview = this.core.navigation.getCurrentTab();

    webview.obfullscreenEnabled = state;
    if (!state) {
      this.core.browser.fullScreenButton.classList.add("disabled");
    } else {
      this.core.browser.fullScreenButton.classList.remove("disabled");
    }
  }

  pluginDebugConsole(obj) {
    const { pluginName, viewID, args } = obj;
    this.core.pluginManager.pluginConsole.pluginConsoleModal.addLog({
      pluginName,
      viewID,
      args
    });
  }

  async pluginInvokeInstance(data) {
    const { pluginName, methodName, args, viewID } = data;

    const plugin = this.core.pluginManager.getPlugin(pluginName);
    const result = (await plugin[methodName])
      ? await plugin[methodName](viewID, ...args)
      : Promise.reject("Method not found");

    return result;
  }

  keyBindAction(action, arg) {
    let webview = this.core.navigation.getCurrentTab();
    switch (action) {
      case "zoomIn":
        this.core.browser.zoomIn();
        break;
      case "zoomOut":
        this.core.browser.zoomOut();
        break;
      case "resetZoom":
        webview.zoomFactor = 1;
        break;
      case "fullScreen":
        this.core.browser.toggleFullscreen();
        break;
      case "reload":
        this.core.navigation.reload();
        break;
      case "hard-reload":
        webview.webContents.session.clearCache();
        this.core.navigation.reload();
        break;
      case "nextTab":
        this.core.navigation.nextTab();
        break;
      case "prevTab":
        this.core.navigation.prevTab();
        break;
      case "devTools":
        webview.openDevTools();
        break;
      case "closeTab":
        this.core.navigation.closeTab();
        break;
      case "switchToTab":
        this.core.navigation.goToTab(arg);
        //use arg tabNumber 0 - 8
        break;
      case "showURL":
        document.getElementById("collapse-tooltip-button").click();
        document.getElementById("nav-ctrls-url").focus();
        // show url bar and focus input
        break;
      case "newTab":
        this.core.navigation.newTab(newTabURL);
        break;
      case "next":
        webview.goForward();
        break;
      case "previous":
        webview.goBack();
        break;
    }
  }

  windowUnmaximized() {
    document
      .getElementById("max-button")
      .setAttribute("style", "display:block!important;");
    document
      .getElementById("restore-button")
      .setAttribute("style", "display:none;");
    document.body.classList.remove("maximized");
  }

  openTab(tab) {
    tab = JSON.parse(tab);
    this.core.navigation.newTab(tab.url, tab.options);
  }

  getConfigTempItems() {
    return Config.tempItems;
  }
}

module.exports = CoreIPCFunctions;
