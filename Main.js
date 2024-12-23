const {
  app,
  BrowserWindow,
  globalShortcut,
  Menu,
  clipboard,
  session,
  ipcMain,
  webContents
} = require("electron");
const { autoUpdater } = require("electron-updater");
const path = require("path");
const Config = require("./app/Models/Config.js");
const LogHelper = require("./app/Utils/LogHelper.js");
const DiscordClient = require("discord-rich-presence")("1155505604526346383");
const Bookmarks = require("./app/Models/Bookmarks.js");
const SQLiteStore = require("./app/Stores/SQLiteStore.js");
const IPCRouter = require("./app/IPCRouter.js");
const MainIPCFunctions = require("./app/MainIPCFunctions.js");
const ErrorHandler = require("./app/ErrorHandler.js");

const configDatabasePath = app.getPath("userData") + "/storage.db";
const userDatabasePath = app.getPath("userData") + "/data.db";

process.env.ELECTRON_IS_DEV = 1;

class Main {
  constructor() {
    this.pluginName = "";

    this.logger = new LogHelper();

    this.setupProcess();
    this.windows = [];
    this.currentWindow = null;
    this.ConfigDatabase = new SQLiteStore(configDatabasePath).getDatabase();
    this.UsersDatabase = new SQLiteStore(userDatabasePath).getDatabase();

    this.bookmarksModel = new Bookmarks(this.UsersDatabase);
    this.configModel = new Config(this.ConfigDatabase);

    this.errorHandler = new ErrorHandler({
      process: "main",
      callback: (message) => {
        alert(message);
      }
    });

    autoUpdater.setFeedURL("https://orbitclient.online/downloads/latest/");
    autoUpdater.autoDownload = false;

    this.init();
  }

  async init() {
    await this.configModel.ready.then(async () => {
      await this.configModel.init(app.getAppPath());
    });

    this.IPCFunctions = new MainIPCFunctions(this);
    this.ipcRouter = await new IPCRouter("main", this.IPCFunctions, null, this);

    if (this.configModel.get("render-sandboxed") == false) {
      app.commandLine.appendSwitch("no-sandbox");
    }

    this.Locales = require("./app/Locales.js");

    this.updater = new (require("./app/Updater"))(
      app.getPath("userData"),
      this.configModel
    );

    this.setupUpdateListeners();
    this.setupMenu();
    this.setupDiscordPresence();

    this.startApp();

    app.on("window-all-closed", async () => {
      app.quit();
    });

    app.on("before-quit", () => {
      if (this.configModel.get("cleanBeforeQuit") == true) {
        this.clearCacheFunction();
      }
    });

    ipcMain.handle("get-core-preloader-data", async () => {
      return {
        userData: app.getPath("userData"),
        appPath: app.getAppPath(),
        configCache: this.configModel.tempItems
      };
    });
  }

  setupUpdateListeners() {
    autoUpdater.on("error", (err) => {
      this.logger.log(1, err.message);
    });

    autoUpdater.on("update-available", async (data) => {
      if (this.configModel.get("clientUpdateFrequency") == "ask") {
        const options = {
          message: this.Locales.get("app.update.install.message"),
          title: this.Locales.get("app.update.install.title"),
          buttons: [
            { text: this.Locales.get("modal.button.install") },
            { text: this.Locales.get("modal.button.later") }
          ],
          type: "info"
        };

        this.ipcRouter.core.popUp(options, 1).then((result) => {
          if (result.buttonIndex == 0) {
            Config.set("lastClientUpdate", new Date().toISOString());
            autoUpdater.downloadUpdate();
          }
        });
      } else if (this.configModel.get("clientUpdateFrequency") == "automatic") {
        autoUpdater.downloadUpdate();
      }
    });

    autoUpdater.on("update-downloaded", (e) => {
      const options = {
        message: this.Locales.get("app.update.restart.message"),
        title: this.Locales.get("app.update.restart.title"),
        buttons: [{ text: this.Locales.get("modal.button.ok") }],
        type: "info"
      };

      this.ipcRouter.core.popUp(options, 1).then((result) => {
        if (result.buttonIndex == 0) {
          Config.set("lastClientUpdate", new Date().toISOString());
          Config.set("updateNow", true);
          autoUpdater.quitAndInstall();
        }
      });
    });
  }

  async startApp() {
    let menu = Menu.buildFromTemplate(this.template);
    Menu.setApplicationMenu(menu);

    app.on("browser-window-focus", () => {
      this.loadKeyBinding();
    });

    app.on("browser-window-blur", () => {
      globalShortcut.unregisterAll();
    });

    this.initContextMenus();

    try {
      await this.createWindow();
      if (
        this.configModel.get("clientUpdateFrequency") !== "disabled" &&
        this.updater.checkDelayBetweenUpdates(
          this.configModel.get("lastClientUpdate"),
          1
        )
      ) {
        autoUpdater.checkForUpdatesAndNotify();
      }

      if (process.env.ELECTRON_IS_DEV == 1) {
        this.currentWindow.webContents.openDevTools();
      }
    } catch (e) {
      console.log(e);
    }
  }

  setupProcess() {
    switch (process.platform) {
      case "win32":
        switch (process.arch) {
          case "ia32":
          case "x32":
            this.pluginName = path.join(
              path.dirname(__dirname),
              "flashver/pepflashplayer.dll"
            );
            break;
          case "x64":
            this.pluginName = path.join(
              path.dirname(__dirname),
              "flashver/pepflashplayer64.dll"
            );
            break;
        }

        break;
      case "linux":
        switch (process.arch) {
          case "ia32":
          case "x32":
            this.pluginName = path.join(
              path.dirname(__dirname),
              "flashver/libpepflashplayer.so"
            );
            break;
          case "x64":
            this.pluginName = path.join(
              path.dirname(__dirname),
              "flashver/libpepflashplayer.so"
            );
            break;
        }
        break;
      case "darwin":
        const resourcesPath = path.join(app.getAppPath(), "..");
        this.pluginName = path.join(
          resourcesPath,
          "flashver/PepperFlashPlayer.plugin"
        );
        this.logger.log(1, `FlashPlayer PluginPath: ${this.pluginName}`);
        /*  if (process.env.ELECTRON_IS_DEV == 1) {
                pluginName = path.join(__dirname, 'flashver/PepperFlashPlayer.plugin')
            } */
        break;
    }

    if (process.env.ELECTRON_IS_DEV == 1) {
      app.commandLine.appendSwitch("enable-logging");
    }

    app.commandLine.appendSwitch("disable-renderer-backgrounding");

    if (process.platform !== "darwin") {
      app.commandLine.appendSwitch("high-dpi-support", "1");
    }

    app.commandLine.appendSwitch("--enable-npapi");
    app.commandLine.appendSwitch("ppapi-flash-path", this.pluginName);
    app.commandLine.appendSwitch("disable-site-isolation-trials");
    app.commandLine.appendSwitch("ignore-certificate-errors", "true");
    app.commandLine.appendSwitch("allow-insecure-localhost", "true");
  }

  setupMenu() {
    this.template = [
      {
        label: this.Locales.get("app.edit"),
        submenu: [
          { role: "undo", label: this.Locales.get("app.edit.undo") },
          { role: "redo", label: this.Locales.get("app.edit.redo") },
          { type: "separator" },
          { role: "cut", label: this.Locales.get("app.edit.cut") },
          { role: "copy", label: this.Locales.get("app.edit.copy") },
          { role: "paste", label: this.Locales.get("app.edit.paste") },
          { role: "delete", label: this.Locales.get("app.edit.delete") },
          { role: "selectAll", label: this.Locales.get("app.edit.selectAll") }
        ]
      }
    ];

    if (process.platform === "darwin") {
      // macOS
      this.template.unshift({
        label: app.name,
        submenu: [
          {
            label: this.Locales.get("app.newWindow"),
            click: () => {
              this.createWindow(true);
            }
          },
          { role: "hide", label: this.Locales.get("app.hide") },
          { role: "hideOthers", label: this.Locales.get("app.hideOthers") },
          { role: "unhide", label: this.Locales.get("app.unHide") },
          { type: "separator" },
          { role: "quit", label: this.Locales.get("app.quit") }
        ]
      });

      // Fenêtre menu for macOS
      this.template.push({
        label: this.Locales.get("app.window"),
        submenu: [
          { role: "minimize", label: this.Locales.get("app.minimize") },
          { role: "zoom", label: this.Locales.get("app.zoom") },
          { type: "separator" },
          { role: "front", label: this.Locales.get("app.front") },
          { type: "separator" },
          { role: "window", label: this.Locales.get("app.window") }
        ]
      });
    } else {
      // Windows & Linux
      this.template.push({
        label: this.Locales.get("app.file"),
        submenu: [
          {
            label: this.Locales.get("app.newWindow"),
            click: () => {
              this.createWindow(true);
            }
          },
          { role: "quit", label: this.Locales.get("app.quit") }
        ]
      });
    }
  }

  setupDiscordPresence() {
    try {
      DiscordClient.updatePresence({
        state: process.env.ELECTRON_IS_DEV == 0 ? "Play DarkOrbit" : "Dev Mode",
        details: "🌌",
        startTimestamp: Date.now(),
        largeImageKey: "loading_background",
        smallImageKey: "icon_1_",
        instance: true
      });
    } catch (error) {
      this.logger.log(error);
    }
  }

  closeWindow() {
    const index = this.windows.indexOf(this.currentWindow);
    if (index > -1) {
      this.windows.splice(index, 1);
    }
    this.currentWindow.close();
    this.currentWindow = BrowserWindow.getFocusedWindow();
  }

  async createWindow(newWindow, fromTab) {
    let { width, height, isMax } = await this.configModel.get("windowBounds");

    let param = "";
    if (newWindow) {
      param = "?newWindow=true";
    }

    if (width < 100 || height < 100) {
      width = 800;
      height = 500;
    }

    let mainWindow = new BrowserWindow({
      width: width,
      height: height,
      minWidth: 700,
      frame: false,
      show: false,
      transparent: true,
      webPreferences: {
        nodeIntegration: true,
        webviewTag: true,
        plugins: true,
        preload: path.join(__dirname, "app", "CorePreloader.js"),
        contextIsolation: false,
        enableRemoteModule: false
      }
    });

    mainWindow.webContents.setZoomFactor(
      parseFloat(this.configModel.get("ui").scale)
    );

    mainWindow.loadURL(
      `file://${app.getAppPath()}/app/Ui/Views/browser.html${param}`
    );

    mainWindow.on("focus", () => {
      this.currentWindow = mainWindow;
    });

    mainWindow.on("closed", () => {
      this.windows = this.windows.map((window) => {
        if (window != mainWindow) {
          return window;
        }
      });
      this.ipcRouter.removeCoreProcess(mainWindow.ipcProcessName);
      mainWindow = null;
    });

    mainWindow.once("ready-to-show", () => {
      if (isMax) {
        mainWindow.maximize();
      }
      mainWindow.show();
    });

    mainWindow.on("will-move", (event) => {
      if (this.configModel.get("windowBounds").isMax == true) {
        event.preventDefault();
        mainWindow.unmaximize();
        this.configModel.set("windowBounds", { isMax: false });
        this.ipcRouter.core.windowUnmaximized();
      }
    });

    mainWindow.on("resize", () => {
      if (this.configModel.get("windowBounds").isMax == false) {
        let { width, height } = mainWindow.getBounds();

        this.configModel.set("windowBounds", { width: width, height: height });
      }
    });

    mainWindow.webContents.on("did-finish-load", async () => {
      if (newWindow && fromTab) {
        this.ipcRouter
          .waitForWebContentsRegister(mainWindow.webContents.id)
          .then(async (processName) => {
            mainWindow.ipcProcessName = processName;
            await this.ipcRouter.waitCoreProcessIsReady(processName);
            this.ipcRouter.core.openTab(JSON.stringify(fromTab));
          });
      }
    });

    mainWindow.webContents.on(
      "did-fail-load",
      (event, errorCode, errorDescription, validatedURL) => {
        if (errorCode === -3) {
          console.error(`Error occurred while loading URL: ${validatedURL}`);
          console.error(`Error description: ${errorDescription}`);
        }
      }
    );
    mainWindow.onbeforeunload = async (e) => {
      if (this.configModel.get("atStartup") == "resume") {
        await this.ipcRouter.core.saveState();
      }
    };

    this.windows.push(mainWindow);

    this.currentWindow = mainWindow;
  }

  async initContextMenus() {
    ipcMain.on("context-menu", async (event, options) => {
      let menu;
      const clipboardContent = clipboard.readText();

      let inputMenuTemplate = [
        { role: "undo", label: this.Locales.get("app.edit.undo") },
        { role: "redo", label: this.Locales.get("app.edit.redo") },
        { type: "separator" },
        { role: "cut", label: this.Locales.get("app.edit.cut") },
        {
          role: "paste",
          label: this.Locales.get("app.edit.paste"),
          enabled: clipboardContent ? true : false
        },
        { role: "selectAll", label: this.Locales.get("app.edit.selectAll") }
      ];

      if (options.element === "tab") {
        const tabMenuTemplate = [
          {
            label: this.Locales.get("contextMenu.refresh"),
            click: () =>
              event.reply(
                "context-menu-action",
                "refresh-tab",
                options.values[0].viewID
              )
          },
          {
            label: this.Locales.get("core.muteUnmute"),
            click: () =>
              event.reply(
                "context-menu-action",
                "mute-tab",
                options.values[0].viewID
              )
          },
          { type: "separator" },
          {
            label: this.Locales.get("contextMenu.detach"),
            enabled: options.values[0].tabLength > 1,
            click: () =>
              event.reply(
                "context-menu-action",
                "detach",
                options.values[0].viewID
              )
          },
          { type: "separator" },
          {
            label: this.Locales.get("contextMenu.closeOtherTabs"),
            enabled: options.values[0].tabLength > 1,
            click: () =>
              event.reply(
                "context-menu-action",
                "close-other-tabs",
                options.values[0].viewID
              )
          },
          {
            label: this.Locales.get("contextMenu.closeTab"),
            click: () =>
              event.reply(
                "context-menu-action",
                "close-tab",
                options.values[0].viewID
              )
          }
        ];

        menu = tabMenuTemplate;
      } else if (options.element === "bookmark") {
        const bookmarkMenuTemplate = [
          {
            label: this.Locales.get("contextMenu.bookmark.edit"),
            click: () =>
              event.reply(
                "context-menu-action",
                "edit-bookmark",
                options.values[0].bookmarkId
              )
          },
          {
            label: this.Locales.get("contextMenu.bookmark.remove"),
            click: () =>
              event.reply(
                "context-menu-action",
                "remove-bookmark",
                options.values[0].bookmarkId
              )
          }
        ];

        menu = bookmarkMenuTemplate;
      } else if (options.element === "input") {
        let textSelected = options.values[0].selectedText !== "" ? true : false;

        if (textSelected) {
          if (isValidURL(options.values[0].selectedText)) {
            let linkItem = {
              label: this.Locales.get("contextMenu.openLinkInNewTab"),
              click: () =>
                this.currentWindow.webContents.send(
                  "context-menu-action",
                  "search",
                  [{ link: options.values[0].selectedText, type: "link" }]
                )
            };
            inputMenuTemplate.unshift(linkItem);
          }
          let copyItem = {
            role: "copy",
            label: this.Locales.get("app.edit.copy")
          };
          inputMenuTemplate.splice(4, 0, copyItem);
        }

        menu = inputMenuTemplate;
      } else if (options.element === "webview") {
        let webviewWebContents = webContents.fromId(options.webContentsId);

        let webviewMenuTemplate = [
          {
            label: this.Locales.get("previous.tooltip.button"),
            click: () =>
              this.currentWindow.webContents.send(
                "context-menu-action",
                "go-back",
                options.values[0].viewID
              ),
            enabled: webviewWebContents.canGoBack()
          },
          {
            label: this.Locales.get("next.tooltip.button"),
            click: () =>
              this.currentWindow.webContents.send(
                "context-menu-action",
                "go-forward",
                options.values[0].viewID
              ),
            enabled: webviewWebContents.canGoForward()
          },
          {
            label: this.Locales.get("contextMenu.refresh"),
            click: () =>
              this.currentWindow.webContents.send(
                "context-menu-action",
                "refresh",
                options.values[0].viewID
              )
          },
          { type: "separator" }
        ];

        if (!options.currentPage.startsWith("file://")) {
          webviewMenuTemplate.push({
            label: this.Locales.get("contextMenu.setAsHome"),
            click: () =>
              this.currentWindow.webContents.send(
                "context-menu-action",
                "set-as-homepage",
                options.currentPage
              )
          });
        }

        if (
          !(await this.bookmarksModel.contains(options.currentPage)) &&
          !options.currentPage.startsWith(`file://`)
        ) {
          webviewMenuTemplate.push(
            { type: "separator" },
            {
              label: this.Locales.get("contextMenu.addBookmark"),
              click: () =>
                this.currentWindow.webContents.send(
                  "context-menu-action",
                  "add-bookmark",
                  options
                )
            }
          );
        }

        // Si du texte est sélectionné, ajoutez des options supplémentaires au menu
        if (options.values[0].selectedText !== "") {
          webviewMenuTemplate.unshift(
            {
              label: `${this.Locales.get("contextMenu.search")} "${
                options.values[0].selectedText
              }"`,
              click: () =>
                this.currentWindow.webContents.send(
                  "context-menu-action",
                  "search",
                  [{ link: options.values[0].selectedText, type: "search" }]
                )
            },
            { label: this.Locales.get("app.edit.copy"), role: "copy" },
            { type: "separator" }
          );
        }

        if (options.isLink == true) {
          webviewMenuTemplate.unshift(
            {
              label: this.Locales.get("contextMenu.openLinkInNewTab"),
              click: () =>
                this.currentWindow.webContents.send(
                  "context-menu-action",
                  "search",
                  [{ link: options.link, type: "link" }]
                )
            },
            { type: "separator" }
          );
        }

        if (options.values[0].origin.endsWith("darkorbit.com")) {
          const dosidMenuItem = {
            label: this.Locales.get("app.edit.copySID"),
            click: () => {
              let url = new URL(options.currentPage);
              let ses = session.fromPartition(options.values[0].partition);
              let cookie = {
                url: url.origin,
                name: "dosid",
                domain: url.hostname
              };
              ses.cookies.get(cookie).then(
                (result) => {
                  clipboard.writeText(result[0].value);
                },
                (error) => {
                  console.log(error);
                }
              );
            }
          };

          webviewMenuTemplate.push({ type: "separator" }, dosidMenuItem);
        }

        menu = webviewMenuTemplate;
      } else if (options.element === "urlBar") {
        if (clipboardContent) {
          const pasteAndSearch = {
            label: this.Locales.get("contextMenu.pasteAndSearch"),
            click: () =>
              event.reply("context-menu-action", "search", [
                { link: clipboardContent, type: "paste-and-search" }
              ])
          };

          inputMenuTemplate.splice(6, 0, pasteAndSearch);
        }

        let textSelected = options.values[0].selectedText !== "" ? true : false;

        if (textSelected) {
          let copyItem = {
            role: "copy",
            label: this.Locales.get("app.edit.copy")
          };
          inputMenuTemplate.splice(4, 0, copyItem);
        }

        menu = inputMenuTemplate;
      } else if (
        options.element === "dev" &&
        process.env.ELECTRON_IS_DEV == 0
      ) {
        return;
      }

      if (options.sender == "webview") {
        menu.push(
          { type: "separator" },
          {
            label: this.Locales.get("contextMenu.inspectElement"),
            click: () => {
              let values = [];
              values.push({
                sender: options.sender,
                viewID: options.values[0].viewID,
                x: options.values[0].x,
                y: options.values[0].y
              });
              this.currentWindow.webContents.send(
                "context-menu-action",
                "inspect-element",
                values
              );
            }
          }
        );
      }

      if (process.env.ELECTRON_IS_DEV == 1) {
        if (options.element == "dev") {
          menu = [];
        }
        menu.push(
          { type: "separator" },
          {
            label: this.Locales.get("contextMenu.inspectElement") + " (client)",
            click: () => {
              this.currentWindow.webContents.inspectElement(
                options.values[0].x,
                options.values[0].y
              );
            }
          }
        );
      }

      let contextmenu = Menu.buildFromTemplate(menu);

      let sender;

      if (options.sender == "core") {
        sender = event.sender;
      } else {
        sender = event.sender.hostWebContents;
      }

      let browserWindow = BrowserWindow.fromWebContents(sender);
      contextmenu.popup(browserWindow);
      browserWindow.focus();
    });
  }

  toggleWindowFullScreen() {
    this.currentWindow.setFullScreen(!this.currentWindow.isFullScreen());
  }

  loadKeyBinding() {
    const keyBindings = [
      { accelerator: "CmdOrCtrl+T", action: "newTab" }, // Open a new tab
      { accelerator: "CmdOrCtrl+R", action: "reload" }, // Refresh page
      { accelerator: "CmdOrCtrl+W", action: "closeTab" }, // close current tab
      { accelerator: "CmdOrCtrl+1", action: "switchToTab", arg: 1 }, // Switch to tab 1
      { accelerator: "CmdOrCtrl+2", action: "switchToTab", arg: 2 }, // Switch to tab 2
      { accelerator: "CmdOrCtrl+3", action: "switchToTab", arg: 3 }, // Switch to tab 3
      { accelerator: "CmdOrCtrl+4", action: "switchToTab", arg: 4 }, // Switch to tab 4
      { accelerator: "CmdOrCtrl+5", action: "switchToTab", arg: 5 }, // Switch to tab 5
      { accelerator: "CmdOrCtrl+6", action: "switchToTab", arg: 6 }, // Switch to tab 6
      { accelerator: "CmdOrCtrl+7", action: "switchToTab", arg: 7 }, // Switch to tab 7
      { accelerator: "CmdOrCtrl+8", action: "switchToTab", arg: 8 }, // Switch to tab 8
      { accelerator: "CmdOrCtrl+9", action: "switchToTab", arg: 9 }, // Switch to tab 9
      { accelerator: "CmdOrCtrl+=", action: "zoomIn" }, // Zoom in
      { accelerator: "CmdOrCtrl+-", action: "zoomOut" }, // Zoom out
      { accelerator: "CmdOrCtrl+0", action: "resetZoom" }, // Reset zoom
      { accelerator: "CmdOrCtrl+Shift+I", action: "devTools" }, // Toggle DevTools
      { accelerator: "F5", action: "reload" }, // F5 for refresh
      { accelerator: "F11", action: "fullScreen" }, // F11 for full-screen
      { accelerator: "CmdOrCtrl+L", action: "showURL" }, // Focus address bar
      { accelerator: "Ctrl+TAB", action: "nextTab" }, // Next tab
      { accelerator: "Ctrl+Shift+TAB", action: "prevTab" }, // previous tab
      { accelerator: "Alt+Left", action: "previous" }, //previous (web)
      { accelerator: "Alt+Right", action: "next" } // next (web)
    ];

    keyBindings.forEach((binding) => {
      globalShortcut.register(binding.accelerator, (e) => {
        this.ipcRouter.core.keyBindAction(binding.action, binding.arg);
      });
    });

    globalShortcut.register("CTRL+SHIFT+r", () => {
      if (process.env.ELECTRON_IS_DEV == 1) {
        this.IPCFunctions.reloadApp();
      } else {
        this.ipcRouter.core.keyBindAction("hard-reload");
      }
      //Sinon reload la page en effacant le cache
    });

    globalShortcut.register("CTRL+SHIFT+F10", () => {
      let session = this.currentWindow.webContents.session;
      session.clearCache();
      app.relaunch();
      app.exit();
    });
  }

  async clearCacheFunction() {
    return new Promise((resolve) => {
      let ses = this.currentWindow.webContents.session;
      ses.clearCache();
      ses.flushStorageData();
      ses.clearStorageData();
      ses.cookies.flushStore();
      resolve();
    });
  }
}
new Main();
