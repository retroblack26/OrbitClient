const Model = require("../Model");

const defaultConfig = {
  windowBounds: {
    width: 1280,
    height: 720,
    isMax: false
  },
  homepage: "http://www.darkorbit.com/",
  language: "en_US",
  masterPassword: false,
  lastClientUpdate: "never",
  lastGameUpdate: "never",
  lastServerListUpdate: "never",
  serverListUpdateMode: "automatic",
  gameUpdateFrequency: "everyday",
  clientUpdateFrequency: "automatic",
  gameVersion: "BigpointClient/1.6.9",
  defaultUserAgent:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 11_0_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.122 Safari/537.36",
  siteForceLanguage: false,
  cleanBeforeQuit: false,
  onNewTab: "newTab",
  newTabURL: `file://${global.appPath}/app/Ui/Views/sections/newTab/newTab.html`,
  atStartup: "newTab",
  render_sandboxed: true,
  devMode: false,
  autoLogin: {
    enabled: false,
    userID: null
  },
  ui: {
    scale: 1,
    animations: true,
    urlBarShow: false,
    urlBarAutoHide: true,
    bookmarksHidden: true
  },
  modal: {
    showAddUserModal: true,
    showTutorial: true,
    showQuitModal: true,
    detectSidModal: true
  },
  modules: {
    pluginsEnabled: false
  }
};
/**
 * Classe Config pour gérer les opérations de base de données liées aux paramètres.
 */
class Config extends Model {
  /**
   * Constructeur de la classe Bookmarks.
   * @param {sqlite3.Database} db - Instance de la base de données SQLite.
   */
  static instance;
  constructor(db, configCache) {
    if (Config.instance) {
      return Config.instance;
    }
    if (!db) {
      throw new Error(
        "You must provide a database instance to initialize the Config Model"
      );
    }
    super(db);
    this.tempItems = [];
    this.cache = {};

    if (configCache) {
      this.tempItems = configCache;
    }

    Config.instance = this;
  }

  async init(appPath) {
    if (appPath) {
      defaultConfig.newTabURL = `file://${appPath}/app/Ui/Views/sections/newTab/newTab.html`;
    }

    return new Promise(async (resolve) => {
      await this.initializeDefaultConfig(defaultConfig);
      await this.cacheDatas();
      resolve();
    });
  }

  async cacheDatas() {
    const items = await this.findAll(); // Suppose que BaseModel a une méthode findAll
    items.forEach((item) => {
      try {
        // Essayer de parser chaque valeur en supposant qu'elle est au format JSON
        this.cache[item.key] = JSON.parse(item.value);
      } catch (e) {
        // Si le parsing échoue, stocker la valeur telle quelle
        this.cache[item.key] = item.value;
      }
    });
  }

  async set(key, partialValue) {
    let valueToStore;
    // Si la valeur partielle est un objet, fusionner avec l'existant, sinon utiliser directement la valeur
    if (
      typeof partialValue === "object" &&
      partialValue !== null &&
      !Array.isArray(partialValue)
    ) {
      // Essayer de récupérer la valeur existante depuis le cache
      const existingValue = this.cache[key] || {};

      // Fusionner l'objet existant avec les modifications partielles
      // Cette opération doit être récursive pour gérer les objets imbriqués
      const mergedValue = this.mergeDeep(existingValue, partialValue);

      // Mettre à jour le cache interne avec l'objet fusionné
      this.cache[key] = mergedValue;

      // Sérialiser l'objet fusionné en chaîne JSON pour le stockage
      valueToStore = JSON.stringify(mergedValue);
    } else {
      // Pour les valeurs primitives ou null, utiliser directement la valeur
      this.cache[key] = partialValue;
      valueToStore = JSON.stringify(partialValue); // Sérialiser aussi les valeurs primitives pour la cohérence de stockage
    }

    const existingItem = await this.findByColumn("key", key);
    if (existingItem) {
      await this.update(existingItem.id, { key, value: valueToStore });
    } else {
      await this.create({ key, value: valueToStore });
    }
  }

  // Une fonction utilitaire pour fusionner profondément deux objets
  mergeDeep(target, source) {
    if (typeof target == "object" && typeof source == "object") {
      for (const key in source) {
        if (source[key] === null && target[key] !== undefined) {
          target[key] = null;
        } else if (typeof source[key] !== "object" || !source[key]) {
          target[key] = source[key];
        } else {
          if (!target[key]) target[key] = {};
          this.mergeDeep(target[key], source[key]);
        }
      }
    }
    return target;
  }

  // Récupère la valeur pour une clé donnée
  get(key) {
    return this.cache[key];
  }

  // Vérifie si une clé spécifique existe dans la base de données
  contains(key) {
    return Object.hasOwnProperty.call(this.cache, key);
  }

  // Supprime une paire clé-valeur par clé
  async deleteByKey(key) {
    const item = await this.findByColumn("key", key);
    if (item) {
      return this.delete(item.id);
    }
  }

  defaultStructure() {
    return {
      id: { type: "INTEGER PRIMARY KEY AUTOINCREMENT" },
      key: { type: "TEXT NOT NULL" },
      value: { type: "TEXT" } // Notez l'usage des guillemets simples pour les chaînes
    };
  }

  async initializeDefaultConfig(defaultConfig, force = false) {
    return new Promise(async (resolve) => {
      const keys = Object.keys(defaultConfig);
      for (let key of keys) {
        if (force == false) {
          const exists = await this.dbContains(key);
          if (!exists) {
            await this.set(key, defaultConfig[key]);
          }
        } else {
          await this.set(key, defaultConfig[key]);
        }
      }
      resolve();
    });
  }

  async dbContains(key) {
    const item = await this.findByColumn("key", key);
    return item !== undefined;
  }

  setTempsItemCallbackFunction(func) {
    if (typeof func === "function") {
      this.tempsItemCallbackFunction = func;
    }
  }

  async setTempItem(key, val) {
    const foundItemIndex = this.tempItems.findIndex((item) => item.key === key);
    if (foundItemIndex !== -1) {
      // Update the existing item's value
      this.tempItems[foundItemIndex].value = val;
    } else {
      // Add a new item
      this.tempItems.push({ key: key, value: val });
    }

    if (this.tempsItemCallbackFunction) {
      await this.tempsItemCallbackFunction(this.tempItems);
    }
  }

  getTempItem(key) {
    const foundItem = this.tempItems.find((item) => item.key == key);
    return foundItem ? foundItem.value : undefined;
  }

  reInit() {
    if (this.get("masterPassword") == true) {
      this.defaultConfig["masterPassword"] = true;
    }
    this.initializeDefaultConfig(defaultConfig, true);
  }
}

module.exports = Config;
