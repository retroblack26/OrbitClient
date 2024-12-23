const Config = new (require("../Models/Config.js"))();
const Locales = require("../Locales.js");
const JSONStore = require("../Stores/JSONStore");
const { ModalPopUp, Modal } = require("../Ui/Modal");
const path = require("path");
const fs = require("fs");

class MigrateDBFromJSON {
  constructor(core, usersDB) {
    this.core = core;
    this.usersDB = usersDB;

    this.completePromiseResolve = null;
    this.completePromise = new Promise((resolve) => {
      this.completePromiseResolve = resolve;
    });

    this.configFilePath = path.join(
      global.appDataPath,
      "user-preferences.json"
    );

    this.usersFilePath = path.join(global.appDataPath, "users.json");

    this.core.addStartupStep(
      Locales.get("loading.step.dbMigration"),
      async () => {
        return new Promise((resolve) => {
          this.checkIfMigrationNeededANDWanted();
          this.completePromise.then(() => {
            resolve();
          });
        });
      }
    );
  }

  async checkIfMigrationNeededANDWanted() {
    const oldFileHere = (fileType) => {
      if (fileType == "config") {
        try {
          this.configFile = fs.readFileSync(this.configFilePath);
        } catch (e) {
          return false;
        }

        return true;
      } else if (fileType == "users") {
        try {
          this.usersFile = fs.readFileSync(this.usersFilePath);
        } catch (e) {
          return false;
        }

        return true;
      }
      console.log(
        "Function OldFileHere need an argument of type string 'config' or 'users'."
      );
      return false;
    };

    const oldUsersFile = oldFileHere("users");
    const oldConfig = oldFileHere("config");

    if ((oldUsersFile || oldConfig) && !Config.get("dbMigration")) {
      await this.migrateConfigFile();
      if (oldUsersFile) {
        await this.migrateUsersFile();
      }
      Config.set("dbMigration", true);
      await this.core.ipcRouter.main.restartApp();
    }
    this.completePromiseResolve();
  }

  async migrateConfigFile() {
    return new Promise((resolve) => {
      try {
        let configData = new JSONStore({ configName: "user-preferences" });

        //for stateRecover, ensure no bugs after migration;
        configData.data['savedState'] = false;

        Config.initializeDefaultConfig(configData.data, true);
        Config.cacheDatas();
        configData.removeFile();
      } catch (error) {
        console.warn(error);
      }
      resolve();
    });
  }

  async migrateUsersFile() {
    return new Promise(async (resolve) => {
      await this.usersDB.createOrUpdate(0, {
        value: this.usersFile.toString()
      });

      fs.unlink(this.usersFilePath, (err) => {
        if (err) throw err;
      });
      resolve();
    });
  }
}
module.exports = MigrateDBFromJSON;
