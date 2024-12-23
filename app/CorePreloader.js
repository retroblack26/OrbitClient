const { ipcRenderer } = require("electron");
const SQLiteStore = require("./Stores/SQLiteStore.js");
const Config = require("./Models/Config.js");

class CorePreloader {
  constructor() {
    window.addEventListener("load", () => {
      this.init();
    });
  }

  async init() {
    let result = await ipcRenderer.invoke("get-core-preloader-data");

    global.appDataPath = result.userData;
    global.appPath = result.appPath;

    const configCache = result.configCache;

    const configDatabasePath = global.appDataPath + "/storage.db";

    this.sqliteStore = new SQLiteStore(configDatabasePath).getDatabase();
    this.config = new Config(this.sqliteStore, configCache);

    await this.config.ready;
    await this.config.init(result.appPath);

    if (!("randomUUID" in crypto))
      self.crypto.randomUUID = function randomUUID() {
        return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
          (
            c ^
            (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
          ).toString(16)
        );
      };

    this.locales = require("./Locales.js");
    this.core = require("./Core.js");
  }
}

module.exports = new CorePreloader();
