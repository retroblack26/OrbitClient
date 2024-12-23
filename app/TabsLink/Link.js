const { ipcRenderer } = require("electron");
const { promises } = require("fs");
const { default: structuredClone } = require("@ungap/structured-clone");
const path = require("path");
const popOver = require("../Ui/Views/sections/popover.min.js");

const PreloadPluginManager = require("./PreloadPluginManager.js");
const MiddlewareManager = require("./MiddlewareManager.js");
const IPCRouter = require("../IPCRouter.js");

const Utils = require("../Utils/Utils.js");

const NewTabMiddleware = require("./Middlewares/newTab.middleware");
const DarkOrbitMiddleware = require("./Middlewares/darkorbit.middleware");
const PreloadIPCFunctions = require("./PreloadIPCFunctions.js");
const PinkGalaxyMiddleware = require("./Middlewares/pinkgalaxy.middleware.js");
const DarkOrbit_GameMapMiddleware = require("./Middlewares/darkorbit_gamemap.middleware.js");

globalThis.structuredClone = (...args) => {
  return structuredClone(...args);
};

if (!("randomUUID" in crypto))
  // https://stackoverflow.com/a/2117523/2800218
  // LICENSE: https://creativecommons.org/licenses/by-sa/4.0/legalcode
  self.crypto.randomUUID = function randomUUID() {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
      (
        c ^
        (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
      ).toString(16)
    );
  };

class Link {
  constructor() {
    this.viewID = null;
    this.partition = null;
    this.preloadPlugins = null;
    this.ipcProcessName = "";

    this.options = null;
    this.serverListElement = null;

    this.fieldsGroups = [];

    this.ready = this.setupViewIdListener();
  }

  setupViewIdListener() {
    return new Promise((resolve) => {
      ipcRenderer.once("setViewID", async (event, args) => {
        let { sessionID, partition, ipcProcessName, preloadPlugins } = args;

        this.viewID = sessionID;
        this.partition = partition;
        this.preloadPlugins = preloadPlugins;
        this.ipcProcessName = ipcProcessName;

        try {
          sessionStorage.setItem("viewID", sessionID);
          sessionStorage.setItem("partition", partition);
        } catch (e) {
          console.error(e);
        }

        await this.init();
        resolve();
      });
    });
  }

  async init() {
    return new Promise(async (resolve) => {
      this.middlewareManager = new MiddlewareManager();
      this.IPCFunctions = new PreloadIPCFunctions(this);

      this.ipcRouter = await new IPCRouter("preload", this.IPCFunctions, {
        viewID: this.viewID,
        coreProcessName: this.ipcProcessName,
        parent: this
      });
      //this.pluginManager = new PreloadPluginManager(this);
      this.options = await this.ipcRouter.core.getPreloadOptions(); // {locale, addUserModal, baseUrl, autoLogin, detectSID }
      this.serverListElement = this.options.serverListElement;
      this.overrideOpen();

      this.middlewareManager.useInstance(
        new NewTabMiddleware(
          this.options.locale,
          this.serverListElement,
          this.searchFunction,
          this.ipcRouter.core
        )
      );
      this.middlewareManager.useInstance(
        new DarkOrbitMiddleware(this.ipcRouter, this.options, this)
      );
      this.middlewareManager.useInstance(
        new DarkOrbit_GameMapMiddleware(this.ipcRouter)
      );

      this.middlewareManager.useInstance(
        new PinkGalaxyMiddleware(this.ipcRouter)
      );

      await this.middlewareManager.executeMiddlewares(window.location.href);

      /*       if (this.preloadPlugins) {
        for (const plugin of this.preloadPlugins) {
          try {
            await this.pluginManager.loadPluginPart(
              plugin.pluginName,
              plugin.pluginPath
            );
          } catch (pluginsInitError) {
            console.warn(`Plugin ${plugin.pluginName} cannot be loaded.`);
          }
        }
      } */

      this.setupContextMenus();

      this.loadAutoCompletion();
      resolve();
    });
  }

  overrideOpen() {
    window.open = (function (open) {
      return function (url, name, options) {
        let isValid = Utils.isValidURL(url);
        if (name == "_self") {
          if (isValid) {
            document.location.href = url;
          } else {
            const finalUrl =
              url.startsWith("/") || window.location.origin.endsWith("/")
                ? window.location.origin + url
                : url.startsWith("?")
                ? window.location.origin + window.location.pathname + url
                : window.location.origin + "/" + url;
            document.location.href = finalUrl;
          }
          return false;
        } else {
          if (isValid) {
            return open.call(window, url, name, options);
          } else {
            const finalUrl =
              url.startsWith("/") || window.location.origin.endsWith("/")
                ? window.location.origin + url
                : url.startsWith("?")
                ? window.location.origin + window.location.pathname + url
                : window.location.origin + "/" + url;

            return open.call(window, finalUrl, name, options);
          }
        }
      };
    })(window.open);
  }

  setupContextMenus() {
    window.addEventListener("contextmenu", (e) => {
      e.preventDefault();

      let options = {};
      options.values = [];
      let element = e.target;
      const selectedText = Utils.getSelectedText();

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
  }

  async loadAutoCompletion() {
    var divPopOver = document.createElement("div");
    this.users = await this.ipcRouter.core.getUsersLogins(Utils.getDomain());

    let loginInput = Utils.findField("login", document.body);
    let i = 0;

    for (let input of loginInput) {
      let logInput, passwordInput, submitButton;
      let submitForm = Utils.findFormContainer(input);
      logInput = input;

      if (input.getAttribute("id") == null) {
        input.setAttribute("id", "popOverTempID");
      }

      if (submitForm !== null) {
        passwordInput = Utils.findField("password", submitForm)[0];
        Utils.addFirstEventListener(submitForm, "submit", (e) => {
          this.processLogin(e, logInput.value, passwordInput.value);
        });
      } else {
        passwordInput = Utils.findFieldNearOther("password", "input", input);
        submitButton = Utils.findFieldNearOther("login", "button", input);
        if (submitButton) {
          Utils.addFirstEventListener(submitButton, "click", (e) => {
            this.processLogin(e, logInput.value, passwordInput.value);
          });
        }
      }

      this.fieldsGroups.push({ id: i, login: input, password: passwordInput });
      i++;
    }

    if (this.fieldsGroups.length > 0 && this.users && this.users.length > 0) {
      promises
        .readFile(
          path.join(this.options.baseUrl, "app/Ui/Views/sections/popover.html")
        )
        .then((file) => {
          divPopOver.innerHTML = file.toString();

          document.body.appendChild(divPopOver);

          this.users.forEach((user) => {
            this.addNewElementToPullOver(user.login, user.id);
          });

          this.fieldsGroups.forEach((group) => {
            let loginField = group.login;

            loginField.setAttribute(
              "data-popover-target",
              "#credential-popover-target"
            );

            PopoverComponent.init({
              ele: "#" + loginField.getAttribute("id"),
              position: "right",
              margin: "5",
              zindex: 10
            });
          });

          var list = document
            .getElementById("list-account")
            .getElementsByTagName("li");
          for (var i = 0; i < list.length; i++) {
            list[i].addEventListener("click", async (e) => {
              var target = e.target;

              const parent =
                target.parentElement.parentElement.parentElement.getAttribute(
                  "data-popover-parent"
                );

              let group = this.fieldsGroups.find(
                (gr) => gr.login.id === parent
              );
              let userToLog = await this.ipcRouter.core.autoFill(
                target.getAttribute("user-id"),
                group.id,
                false
              );
              this.autoFill(userToLog, group);
              document.getElementById("credential-popover-target").display =
                "none";
            });
          }
        }); // end readfile
    }
  }

  autoFill(userToLog, group) {
    let { user, autoLog } = userToLog;
    if (!group) {
      document.getElementById("bgcdw_login_form_username").value = user.login;
      document.getElementById("bgcdw_login_form_password").value =
        user.password;
    } else {
      group.login.value = user.login;
      group.password.value = user.password;
    }

    if (autoLog == true) {
      let parentForm = document.getElementsByName("bgcdw_login_form")[0];
      let loginButton = parentForm.querySelectorAll(
        '.bgcdw_login_form_login[type="submit"]'
      )[0];
      loginButton.click();
    }
  }

  async processLogin(event, login, password) {
    if (
      login.length >= 3 &&
      !this.userListContains(login) &&
      this.options.addUserModal == true
    ) {
      let user = {
        login: login,
        password: password,
        domain: Utils.getDomain()
      };
      this.ipcRouter.core.showAddUserModal(user);
    }
  }

  searchFunction(query) {
    window.location.href =
      "https://duckduckgo.com/?q=" + query.replace(" ", "+");
  }

  addNewElementToPullOver(login, id) {
    var liPopOver = document.createElement("li");
    liPopOver.setAttribute("value", login);
    liPopOver.setAttribute("user-id", id);
    liPopOver.innerHTML = login;
    document.getElementById("list-account").appendChild(liPopOver);
  }

  userListContains(login) {
    if (this.users != null) {
      return this.users.some((user) => user.login == login);
    }
    return false;
  }

  areWeInADataURL() {
    if (document.location.href.startsWith("data:")) {
      return true;
    }
    return false;
  }
}

module.exports = new Link();
document.addEventListener("touchstart", function () {}, true);
