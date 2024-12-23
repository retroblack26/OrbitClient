const { ipcRenderer } = require("electron");
const EventEmitter = require("events");
const ErrorHandler = require("./ErrorHandler.js");
const Updater = require("./Updater.js");
const PluginManager = require("./Plugins/PluginManager.js");
const BrowserUI = require("./Ui/BrowserUI.js");
const IPCRouter = require("./IPCRouter.js");
const SQLiteStore = require("./Stores/SQLiteStore.js");
const JSONStore = require("./Stores/JSONStore.js");
const Bookmarks = require("./Models/Bookmarks.js");
const Users = require("./Models/Users.js");
const UserDatas = require("./Models/UserDatas.js");
const Plugins = require("./Models/Plugins.js");
const Navigation = require("./Navigation.js");
const SetMasterPasswordModal = require("./Modals/SetMasterPasswordModal");
const Config = new (require("./Models/Config.js"))();
const Locales = require("./Locales.js");
const StateRecover = require("./Modules/StateRecover.js");
const Utils = require("./Utils/Utils.js");
const CoreIPCFunctions = require("./CoreIPCFunctions.js");
const MigrateDBFromJSON = require("./Modules/MigrateDBFromJSON.js");

const userDatabasePath = global.appDataPath + "/data.db";
const pluginsPath = global.appDataPath + "/plugins";

class Core extends EventEmitter {
  constructor() {
    super();
    this.queryParams = Utils.getQueryParameters();
    this.serverListElement = "";

    this.startupSteps = [];

    this.errorHandler = new ErrorHandler({
      process: "core",
      callback: (message) => {
        console.warn(message);
      }
    });

    this.UserStore = new SQLiteStore(userDatabasePath).getDatabase();

    this.bookmarksModel = new Bookmarks(this.UserStore);
    this.usersModel = new Users(this.UserStore);
    this.userDatasModel = new UserDatas(this.UserStore);

    // this.pluginsModel = new Plugins(this.UserStore); in next update...

    this.stateRecover = new StateRecover(this);

    this.updater = new Updater(global.appDataPath);

    this.isReady = this.init();

    this.isReady.then(() => {
      window.dispatchEvent(
        new CustomEvent("core-ready", {
          detail: {}, // You can pass any data you want
          bubbles: true,
          cancelable: true
        })
      );
    });
  }

  async startUpdate() {
    try {
      this.server_list = new JSONStore({
        file: `${global.appPath}/app/Ui/Views/sections/newTab/server_list.json`,
        defaults: {}
      });

      await this.updater.updateServerList(this.server_list);

      this.serverListElement = this.loadServerListElement();
    } catch (e) {
      console.warn("Error updating server list .");
      console.warn(e);
    }

    this.updater.updateGameAgent();
  }

  loadServerListElement() {
    let buildedElement = '<div class="servers-container">';

    this.server_list.get("servers").forEach((server) => {
      buildedElement += '<div class="site">';
      buildedElement += '<div class="img-overlay">' + server.name + "</div>";
      buildedElement +=
        '<div class="img" style="background:url(' + server.image + ')"></div>';
      buildedElement +=
        '<div class="site-btn-container"><button class="site-btn" data-url="' +
        server.url +
        '">' +
        Locales.get("newTab.site.playButton") +
        "</button></div>";
      buildedElement +=
        "<span>" + Locales.get("newTab.site.moreInformations") + "</span>";
      buildedElement += '<div class="site-info">';
      buildedElement +=
        "<p>" + Locales.get("newTab.site.moreInfos.gameStyle") + "</p>";
      buildedElement += "<p>" + server.style + "</p>";
      buildedElement +=
        "<p>" + Locales.get("newTab.site.moreInfos.players") + "</p>";
      buildedElement += "<p>" + server.players + "</p>";
      buildedElement +=
        "<p>" + Locales.get("newTab.site.moreInfos.language") + "</p>";
      buildedElement += "<p>" + server.language + "</p>";
      buildedElement += "</div>";
      buildedElement +=
        '<div class="arrow"><svg fill="#ffffff" width="14px" height="14px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" stroke="#ffffff"><g stroke-width="0"></g><g stroke-linecap="round" stroke-linejoin="round"></g><g><g data-name="Layer 2"><g data-name="arrow-ios-downward"><rect width="24" height="24" opacity="0"></rect><path d="M12 16a1 1 0 0 1-.64-.23l-6-5a1 1 0 1 1 1.28-1.54L12 13.71l5.36-4.32a1 1 0 0 1 1.41.15 1 1 0 0 1-.14 1.46l-6 4.83A1 1 0 0 1 12 16z"></path></g></g></g></svg></div>';
      buildedElement += "</div>";
    });

    buildedElement += "</div>";

    return buildedElement;
  }

  async init() {
    return new Promise(async (resolve) => {
      this.ipcFunctions = new CoreIPCFunctions(this);
      this.ipcRouter = await new IPCRouter("core", this.ipcFunctions);

      Config.setTempsItemCallbackFunction(
        this.ipcRouter.main.updateConfigTempItems
      );

      const masterUnlocked = Config.getTempItem("masterPasswordUnlock");

      this.browser = new BrowserUI(this);

      this.navigation = new Navigation({
        parent: this,
        defaultFavicons: true,
        showAddTabButton: true,
        showUrlBar: true,
        newTabParams: [
          Config.get("newTabURL"),
          {
            close: true,
            icon: global.appPath + "/icon.ico"
          }
        ],
        newTabCallback: (id, url, options) => {
          options.postTabOpenCallback = (webview) => {
            webview.setAttribute("plugins", "");

            webview.setAttribute("offscreen", true);

            if (url.indexOf("darkorbit.com") >= 0) {
              webview.setAttribute("useragent", Config.get("gameVersion"));
            } else {
              webview.setAttribute("useragent", Config.get("defaultUserAgent"));
            }
          };
          return {
            options
          };
        }
      });

      await this.usersModel.ready;

      this.migrateDBFromJSON = new MigrateDBFromJSON(this, this.usersModel);

      // await this.pluginsModel.ready; in next update..

      this.addStartupStep(Locales.get("loading.step.start"), () => {});

      this.addStartupStep(
        Locales.get("loading.step.gameUpdate"),
        this.startUpdate
      );
      this.addStartupStep(
        Locales.get("loading.step.clientLoading"),
        this.loadLocales
      );

      this.addStartupStep(
        Locales.get("loading.step.masterPasswordWaiting"),
        async () => {
          if (!masterUnlocked) {
            await this.checkMasterLock();
          }
        }
      );

      this.initializeContextMenus();

      await this.proceedStartupSteps();

      await this.browser.ready();
      resolve();
    });
  }

  async proceedStartupSteps() {
    for (const startupStep of this.startupSteps) {
      const { stepDetail, stepCallback } = startupStep;
      this.browser.loadingTextObject.innerText = stepDetail;

      const bindedCallback = stepCallback.bind(this);
      await bindedCallback();
    }
    this.browser.loadingTextObject.innerText = Locales.get(
      "loading.step.pageLoading"
    );
    await this.startBrowser();
  }

  addStartupStep(stepDetail, stepCallback) {
    if (typeof stepDetail !== "string") {
      console.error("First argument must be a string.");
    }

    if (typeof stepCallback !== "function") {
      console.error("Second argument must be a function.");
    }

    this.startupSteps.push({ stepDetail, stepCallback });
  }

  async loadLocales() {
    const elementsWithLocale = document.querySelectorAll("[data-locale]");
    let missingTranslations = [];

    elementsWithLocale.forEach((element) => {
      const rawData = element.getAttribute("data-locale");
      const localeData = JSON.parse(rawData.replace(/'/g, '"'));

      for (const [localeKey, type] of Object.entries(localeData)) {
        const translation = Locales.get(localeKey);

        if (translation) {
          switch (type) {
            case "title":
              element.title = translation;
              break;
            case "innerText":
              let output = translation;
              let inputs = element.querySelectorAll("input");

              if (inputs.length > 0) {
                output = element.innerHTML + output;
              }

              element.innerHTML = output;
              break;
            case "placeholder":
              element.placeholder = translation;
              break;
            case "tooltip":
              element.setAttribute("data-tooltip", translation);
              break;
            default:
              console.warn(`Type "${type}" non reconnu.`);
          }
        } else {
          missingTranslations.push(localeKey);
        }
      }
    });

    if (missingTranslations.length > 0) {
      console.log(
        "Traductions manquantes pour les clés suivantes:",
        missingTranslations.join("\r\n")
      );
    }
  }

  async startBrowser() {
    if (this.queryParams.newWindow) {
      let originalHash = await this.ipcRouter.main.getMaster();
      await this.usersModel.initialize({
        masterPasswordUnlock: false,
        hash: originalHash
      });
    }

    if (!this.usersModel.initialized) {
      await this.usersModel.initialize({
        secretKey: ""
      });
    }

    this.userDatasModel.initialize(this.usersModel.hash);

    this.emit("browser-init");

    //this.pluginManager = new PluginManager(pluginsPath, this); in next update

    /* this.pluginManager.on("pluginLoaded", (pluginName) => {
      console.log(`Plugin loaded: ${pluginName}`);
    }); */

    //this.pluginManager.loadPlugins(this);

    var length = window.process.argv.length;
    var lastArgument = window.process.argv[length - 1];

    const createTab = () => {
      return new Promise(async (resolve) => {
        let createdTabID = "";
        if (
          lastArgument &&
          lastArgument.indexOf("sid=") >= 0 &&
          lastArgument.indexOf("server=") >= 0
        ) {
          console.log(lastArgument);

          //sid login
        } else if (Config.get("atStartup") == "homepage") {
          createdTabID = await this.navigation.newTab(Config.get("homepage"), {
            icon: global.appPath + "/icon.ico"
          });
        } else if (
          Config.get("atStartup") == "autoLogin" &&
          !this.queryParams.newWindow
        ) {
          createdTabID = await this.navigation.newTab(
            "https://www.darkorbit.com/",
            {
              icon: global.appPath + "/icon.ico"
            }
          );
        } else {
          createdTabID = await this.navigation.newTab(Config.get("newTabURL"), {
            icon: global.appPath + "/icon.ico"
          });
        }

        resolve(createdTabID);
      });
    };

    if (Config.get("savedState") == true) {
      try {
        await this.navigation.resumeState().then(async (result) => {
          if (result.error) {
            await createTab();
          }
        });
      } catch (error) {
        console.error(error);
        await createTab();
      }
    } else {
      await createTab();
    }

    ipcRenderer.send("core-ready", this.ipcRouter.processName);
  }

  initializeContextMenus() {
    ipcRenderer.on("context-menu-action", async (event, action, values) => {
      switch (action) {
        case "refresh-tab":
          this.navigation.reload(values);
          break;
        case "mute-tab":
          this.navigation.handleMuteButton(values);
          break;
        case "close-other-tabs":
          let tabToExclude = values;
          let allTabs = [
            ...document.querySelectorAll(".nav-tabs-tab"),
            ...document.querySelectorAll(".context-tabItem")
          ];
          allTabs.forEach((tab) => {
            if (tab.getAttribute("data-session") != tabToExclude) {
              this.navigation.closeTab(tab.getAttribute("data-session"));
            }
          });
          break;
        case "close-tab":
          this.navigation.closeTab(values);
          break;
        case "inspect-element":
          if (values[0].sender == "webview") {
            this.navigation
              .getCurrentTab()
              .inspectElement(values[0].x, values[0].y);
          }
          break;
        case "open-link":
          break;
        case "go-back":
          this.navigation.back();
          break;
        case "go-forward":
          this.navigation.forward();
          break;
        case "refresh":
          this.navigation.reload();
          break;
        case "set-as-homepage":
          Config.set("homepage", values);
          Config.set("newTab", "homepage");
          break;
        case "add-bookmark":
          this.browser.bookmarksBar.addBookmark(values);
          break;
        case "edit-bookmark":
          let selectedBookmark = await this.bookmarksModel.find(values);
          this.browser.bookmarksBar.showBookmarkModal(selectedBookmark);
          break;
        case "remove-bookmark":
          this.browser.bookmarksBar._removeBookmarkButton(values);
          break;
        case "detach":
          let tab = this.navigation.getTab(values);
          if (tab.webview) delete tab.webview;
          this.ipcRouter.main.createNewWindow(tab);
          this.navigation.closeTab(values);
          break;
        case "search":
          let type = values[0].type;
          let finalUrl;
          switch (type) {
            case "search":
              finalUrl =
                "https://duckduckgo.com/?q=" + values[0].link.replace(" ", "+");
              this.navigation.newTab(finalUrl);
              break;
            case "link":
              finalUrl = values[0].link;
              this.navigation.newTab(finalUrl);
              break;
            case "paste-and-search":
              document.getElementById("nav-ctrls-url").value = values[0].link;
              if (Utils.isValidURL(values[0].link)) {
                finalUrl = values[0].link;
              } else {
                finalUrl =
                  "https://duckduckgo.com/?q=" +
                  values[0].link.replace(" ", "+");
              }
              this.navigation.getCurrentTab().loadURL(finalUrl);
              break;
          }
          break;
      }
    });

    window.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      let options = {};
      options.values = [];
      let element = e.target;
      let tabElement = null;

      options.sender = "core";

      tabElement = Utils.findParentWithClass(
        element,
        "nav-tabs-tab",
        "context-tabItem"
      );
      element =
        Utils.findParentWithClass(element, "single-bookmark", "context-Item") ||
        element;

      if (tabElement !== null) {
        options.element = "tab";
        const viewID = tabElement.getAttribute("data-session");
        let tabLength = document.querySelectorAll(".nav-tabs-tab").length;
        options.values.push({
          viewID: viewID,
          tabLength: tabLength,
          x: e.x,
          y: e.y
        });
        ipcRenderer.send("context-menu", options);
      } else if (
        element.type == "text" ||
        element.type == "password" ||
        element.type == "email"
      ) {
        const selectedText = Utils.getSelectedText();
        options.values.push({ selectedText: selectedText, x: e.x, y: e.y });
        if (element.id == "nav-ctrls-url") {
          options.element = "urlBar";
        } else {
          options.element = "input";
        }
        ipcRenderer.send("context-menu", options);
      } else if (
        element.classList.contains("single-bookmark") ||
        element.id == "context-bookmark"
      ) {
        options.element = "bookmark";
        options.values.push({
          bookmarkId: element.getAttribute("data-id"),
          x: e.x,
          y: e.y
        });
        ipcRenderer.send("context-menu", options);
      } else {
        options.element = "dev";
        options.values.push({ x: e.x, y: e.y });
        ipcRenderer.send("context-menu", options);
      }
    });
  }

  async checkMasterLock() {
    return new Promise((resolve) => {
      if (Config.get("masterPassword") == true) {
        this.browser.masterPasswordModal.ready.then(() => {
          this.browser.masterPasswordModal.show();
        });

        this.browser.masterPasswordModal.masterUnlockPromise.then(() => {
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  unlockMaster() {
    Config.setTempItem("masterPasswordUnlock", true);
    this.browser.loadingTextObject.innerText = Locales.get(
      "loading.step.pageLoading"
    );

    this.browser.masterPasswordModal.hide();

    setTimeout(() => {
      this.browser.loadingTextObject.style.display = "none";
    }, 5000);
  }

  setMasterPassword() {
    return new Promise(async (resolve) => {
      let setMasterPassword = {
        title: Locales.get("modal.setMasterPassword.title"),
        closeable: false,
        inputs: [
          {
            label: Locales.get("modal.setMasterPassword.checkbox.label"),
            type: "checkbox",
            name: "useMasterPassword",
            checked: false
          },
          {
            type: "password",
            name: "modalPassword",
            placeholder: Locales.get(
              "modal.setMasterPassword.input.placeholder"
            ),
            required: true
          },
          {
            type: "password",
            name: "passwordVerification",
            placeholder: Locales.get(
              "modal.setMasterPassword.input.verify.placeholder"
            ),
            required: true
          }
        ],
        buttons: [
          {
            text: Locales.get("modal.button.confirm"),
            name: "confirm-button",
            type: "btn-green",
            disabled: true,
            closeOnClick: true,
            callback: async (result) => {
              if (result.inputsData[0].useMasterPassword == false) {
                this.usersModel.setMasterPassword(
                  result.inputsData[1].modalPassword
                );
                Config.set("masterPassword", true);
                try {
                  await this.usersModel.reloadUsers();
                } catch (e) {}

                resolve();
              } else {
                this.usersModel.setMasterPassword("");
                resolve();
              }
            }
          }
        ],
        type: "module",
        icon: "icons/lock.svg"
      };

      new SetMasterPasswordModal({
        onRemove: () => {
          this.browser.settingsModal.masterPasswordUseCheckBox.checked = false;
        },
        size: "small",
        template: setMasterPassword
      }).show();
    });
  }

  async reloadLocales(language) {
    Config.set("language", language);
    Locales.reload(language);
    await this.ipcRouter.main.reloadLocales(language);
    this.loadServerListElement();
  }

  async closeApp() {
    if (Config.get("modal").showQuitModal == true) {
      this.browser.modalListeners
        .get("quitApp")
        .popUp(1)
        .then(async (result) => {
          if (result.buttonIndex == 0) {
            if (typeof this.navigation !== "undefined") {
              if (Config.get("atStartup") == "resume") {
                await this.navigation.saveState();
              }
            }

            this.ipcRouter.main.quitApp();
          }
        });
    } else {
      if (typeof this.navigation !== "undefined") {
        if (Config.get("atStartup") == "resume") {
          await this.navigation.saveState();
        }
      }
      this.ipcRouter.main.quitApp();
    }
  }
}

module.exports = new Core();
