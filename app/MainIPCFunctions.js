const { app, session } = require("electron");

class MainIPCFunctions {
  constructor(main) {
    this.main = main;
  }

  async getMaster() {
    let originalCoreProcess = Array.from(
      this.main.ipcRouter.coreProcessMap.entries()
    );

    let coreProcName;

    originalCoreProcess.forEach((coreProc) => {
      if (coreProc[1].get("isReady") === true) {
        coreProcName = coreProc[0];
      }
    });

    if (!coreProcName) {
      throw new Error("No ready core process available.");
    }

    let masterHash = await this.main.ipcRouter.invoke(
      coreProcName,
      "getMaster"
    );
    return masterHash;
  }

  async setCookies(partition, cookies) {
    return new Promise(async (resolve) => {
      const ses = session.fromPartition(partition);
      for (const cookie of cookies) {
        try {
          await ses.cookies.set(cookie);
        } catch (error) {}
      }
      resolve();
    });
  }

  async getCookies(partition) {
    const ses = session.fromPartition(partition);
    return new Promise(async (resolve) => {
      try {
        await ses.cookies.get({}).then((result) => {
          const modifiedCookies = [];

          result.forEach((cookie) => {
            if (cookie.secure == true) {
              cookie.secure = false;
            }

            if (cookie.httpOnly == true) {
              cookie.httpOnly = false;
            }

            if (cookie.domain.startsWith(".")) {
              cookie.url = `http://${cookie.domain.substring(
                1,
                cookie.domain.length
              )}/`;
            } else {
              cookie.url = `http://${cookie.domain}/`;
            }

            modifiedCookies.push(cookie);
          });

          resolve(modifiedCookies);
        });
      } catch (error) {
        console.error("Error getting session cookies:", error);
        resolve();
      }
    });
  }

  removeIpcProcess(processName) {
    this.main.ipcRouter.removeProcess(processName);
  }

  removePreloadIPCProcess(tabID, coreProcessName) {
    this.main.ipcRouter.removePreloadProcess(tabID, coreProcessName);
  }

  restartApp() {
    app.relaunch();
    app.exit();
  }

  reloadApp(clearCache = false) {
    if (clearCache) {
      this.main.clearCacheFunction();
    }
    this.main.ipcRouter.removeAllProcess();
    this.main.currentWindow.reload();
  }

  quitApp(forced = false) {
    if (forced) {
      app.quit();
    } else {
      this.main.closeWindow();
    }
  }

  changeUiScale(scaleFactor) {
    this.main.currentWindow.webContents.setZoomFactor(parseFloat(scaleFactor));
  }

  resetCookie(url, cookieName) {
    this.main.currentWindow.webContents.session.cookies.remove(url, cookieName);
  }

  windowAction(options) {
    if (this.main.currentWindow) {
      switch (options.action) {
        case "minimize":
          this.main.currentWindow.minimize();
          break;
        case "maximize":
          this.main.currentWindow.maximize();
          break;
        case "unmaximize":
          this.main.currentWindow.unmaximize();
          break;
        case "setAlwaysOnTop":
          this.main.currentWindow.setAlwaysOnTop(options.args);
          break;
        case "fullScreen":
          this.main.toggleWindowFullScreen();
          break;
        case "clearCache":
          this.main.clearCacheFunction().then(() => {
            app.relaunch();
            app.exit();
          });
          break;
      }
    }
  }

  sidLogin(sid, server, partition) {
    let baseUrl = "https://" + server.toLowerCase() + ".darkorbit.com/";
    let cookie = {
      url: baseUrl,
      name: "dosid",
      value: sid,
      domain: server.toLowerCase() + ".darkorbit.com",
      path: "/"
    };

    const ses = session.fromPartition(partition);
    ses.cookies.remove(baseUrl, "dosid").then(
      () => {
        console.log("succefully removed cookie dosid");
      },
      (error) => {
        console.log(error);
      }
    );
    ses.cookies.set(cookie).then(
      () => {
        console.log("succefully loaded cookie dosid");
      },
      (error) => {
        console.log(error);
      }
    );

    return server.toLowerCase();
  }

  showContext(options) {
    this.main.generateContextMenu(options);
  }

  createNewWindow(fromTab) {
    this.main.createWindow(true, fromTab);
  }

  reloadLocales(lang) {
    this.main.Locales.reload(lang);
  }

  updateConfigTempItems(tempItems) {
    this.main.configModel.tempItems = tempItems;
  }
}

module.exports = MainIPCFunctions;
