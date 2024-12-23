const fs = require("fs");
const PluginAPI = require("./PluginApi");
const path = require("path");
const EventEmitter = require("events");
const semver = require("semver");
const vm = require("vm");
const PluginStore = require("./PluginStore");
const PluginCommunicator = require("./PluginCommunicator");
const PluginConsole = require("./PluginConsole");
const MainUIAPI = require("./Api/MainUIAPI");
const Config = new (require("../Models/Config"))();
const Locales = require("../Locales");
const Utils = require("../Utils/Utils");
const { Modal } = require("../Ui/Modal.js");

class PluginManager extends EventEmitter {
  constructor(directory, core) {
    super();
    this.core = core;
    this.plugins = new Map();
    this.preloadPlugins = new Map();
    this.pluginsStore = new Map();
    this.pluginMiddlewares = [];
    this.apiVersion = "1.0.0";
    this.pluginDirectory = directory;
    this.api = new PluginAPI(this);
    this.pluginConsole = new PluginConsole(
      "renderer",
      this.core.browser.pluginConsoleUI
    );
    this.communicator = new PluginCommunicator("renderer", this.core.ipcRouter);
    if (!fs.existsSync(this.pluginDirectory)) {
      fs.mkdirSync(this.pluginDirectory, { recursive: true });
    }
  }

  async loadPlugins(core) {
    this.api._updateCore(core);
    this.core = core;
    this.installedPlugins = await this.core.pluginsModel.findAll();
    // Obtenir la liste des plugins installés
    this.installedPlugins = this.installedPlugins.map(
      (plugin) => plugin.identifier
    ); // Supposant que pluginsModel retourne un tableau de plugins avec la propriété 'identifier'

    // Scanner le répertoire des plugins
    const pluginMetadatas = this.scanPlugins();

    console.log(pluginMetadatas);

    // Pour chaque plugin trouvé
    for (const metadata of pluginMetadatas) {
      if (!metadata.identifier) {
        console.warn(
          `Le plugin ${metadata.name} nécessite un identifiant dans les métadonnées, passage. (ex: com.exemple)`
        );
        continue;
      }

      // Si le plugin est installé
      if (
        this.installedPlugins.includes(metadata.identifier) &&
        !this.plugins.has(metadata.name)
      ) {
        if (
          this.areDependenciesSatisfied(metadata) &&
          !metadata.identifier.includes(" ")
        ) {
          if (metadata.icon) {
            metadata.icon = path.join(
              this.pluginDirectory,
              metadata.name,
              metadata.icon
            );
          }
          if (metadata.targetInstances) {
            if (metadata.targetInstances["preload"]) {
              this.loadPluginForAllTabs(
                metadata,
                metadata.targetInstances["preload"]
              );
            }
            if (metadata.targetInstances["main"]) {
              this.loadPlugin(metadata, metadata.targetInstances["main"]);
            }
          } else {
            this.loadPlugin(metadata);
          }
        } else {
          console.warn(`Dépendances non satisfaites pour ${metadata.name}.`);
        }
      } else {
        // Le plugin n'est pas installé, stocker ses métadonnées
        this.plugins.set(metadata.name, { metadata });
      }
    }
  }

  scanPlugins() {
    return fs
      .readdirSync(this.pluginDirectory)
      .filter(
        (file) =>
          path.extname(file) === ".asar" ||
          (Config.get("devMode") &&
            fs.statSync(path.join(this.pluginDirectory, file)).isDirectory())
      )
      .map((pluginFile) => {
        let pluginPath = path.join(this.pluginDirectory, pluginFile);
        let metadataPath = path.join(pluginPath, "plugin.json");

        // Si le fichier est un .asar, ajuster le chemin
        if (path.extname(pluginFile) === ".asar") {
          pluginPath = pluginPath; // Chemin du fichier .asar
          metadataPath = path.join(pluginPath, "plugin.json"); // Electron permet d'accéder aux fichiers internes
        }

        if (fs.existsSync(metadataPath)) {
          try {
            const metadataContent = fs.readFileSync(metadataPath, "utf8");
            const metadata = JSON.parse(metadataContent);
            metadata._pluginPath = pluginPath; // Stocker le chemin du plugin pour une utilisation ultérieure
            return metadata;
          } catch (err) {
            console.error(
              `Erreur lors de la lecture des métadonnées depuis ${metadataPath}: ${err}`
            );
            return null;
          }
        } else {
          console.warn(
            `Aucun fichier 'plugin.json' trouvé pour ${pluginFile}.`
          );
          return null;
        }
      })
      .filter((metadata) => metadata !== null);
  }

  areDependenciesSatisfied(metadata) {
    if (!metadata.dependencies) return true;
    return Object.entries(metadata.dependencies).every(([dep, version]) => {
      if (!this.plugins.has(dep)) return false;
      const depMetadata = this.plugins.get(dep).metadata;
      return semver.satisfies(depMetadata.version, version);
    });
  }

  loadPlugin(metadata, mainPath = "index.js") {
    const pluginPath = metadata._pluginPath;
    const pluginName = metadata.name;
    const indexPath = path.join(pluginPath, mainPath);
    const mainUIAPI = new MainUIAPI(this, pluginName);
    const plugin = {
      name: pluginName,
      uuid: crypto.randomUUID().toString()
    };

    try {
      const boundApi = Utils.bindPrototypeToPlugin(this.api, plugin);
      const pluginConsole = Utils.bindPrototypeToPlugin(
        this.pluginConsole,
        plugin
      );

      const moduleCache = {};
      const customRequire = (moduleName) => {
        // Vérifier si c'est un module natif
        if (require.resolve.paths(moduleName) === null) {
          return require(moduleName);
        }

        let resolvedPath;

        if (moduleName.startsWith("./") || moduleName.startsWith("../")) {
          // Gérer les chemins relatifs
          resolvedPath = path.join(pluginPath, moduleName);

          // Ajouter '.js' si aucune extension n'est spécifiée
          if (!path.extname(resolvedPath)) {
            resolvedPath = `${resolvedPath}.js`;
          }

          // Vérifier si le chemin est un répertoire et ajouter 'index.js' si c'est le cas
          if (
            fs.existsSync(resolvedPath) &&
            fs.statSync(resolvedPath).isDirectory()
          ) {
            resolvedPath = path.join(resolvedPath, "index.js");
          }
        } else {
          // Gérer les noms de modules (depuis node_modules)
          try {
            resolvedPath = require.resolve(moduleName, {
              paths: [path.join(pluginPath, "node_modules")]
            });
          } catch (err) {
            // Repli sur le node_modules de l'application principale
            resolvedPath = require.resolve(moduleName);
          }
        }

        // Vérifier le cache
        if (moduleCache[resolvedPath]) {
          return moduleCache[resolvedPath].exports;
        }

        // Lire et exécuter le code du module dans le sandbox
        const moduleCode = fs.readFileSync(resolvedPath, "utf8");
        const moduleWrapper = `(function(require, module, exports) { ${moduleCode} \n})`;
        const moduleScript = new vm.Script(moduleWrapper);
        const moduleContext = vm.createContext({
          require: customRequire,
          module: {},
          exports: {},
          console: pluginConsole,
          api: boundApi,
          __basePath: pluginPath,
          path: path,
          window: mainUIAPI,
          Modal: Utils.bindPrototypeToPlugin(new Modal())
        });
        const moduleFunction = moduleScript.runInNewContext(moduleContext);
        const moduleExports = {};
        const moduleObject = { exports: moduleExports };

        moduleFunction(customRequire, moduleObject, moduleExports);

        // Mettre en cache le module
        moduleCache[resolvedPath] = moduleObject;

        return moduleObject.exports;
      };

      const code = fs.readFileSync(indexPath, "utf8");

      const pluginStore = Utils.bindPrototypeToPlugin(
        new PluginStore({
          pluginName: metadata.name,
          defaults: null,
          appDataPath: global.appDataPath
        }),
        plugin
      );

      plugin.metadata = metadata;
      const sandboxModule = { exports: {} };
      const sandbox = {
        api: boundApi,
        __basePath: pluginPath,
        path: path,
        window: mainUIAPI,
        module: sandboxModule,
        exports: sandboxModule.exports,
        require: customRequire,
        console: pluginConsole,
        store: pluginStore
      };

      const context = new vm.createContext(sandbox);
      const script = new vm.Script(code);
      script.runInNewContext(context);

      let exports = sandboxModule.exports;
      let pluginClass = exports;

      if (typeof exports === "object" && Object.keys(exports).length > 0) {
        for (let key in exports) {
          if (
            exports.hasOwnProperty(key) &&
            typeof exports[key] === "function"
          ) {
            pluginClass = exports[key];
            break;
          }
        }
      }
      let loadedPlugin = new pluginClass(metadata);

      let defaults = {};
      if (exports.pluginDefaultSettings) {
        defaults = exports.pluginDefaultSettings;
      }

      pluginStore.setDefaults(defaults);

      this.pluginsStore.set(plugin, pluginStore);

      this.plugins.set(pluginName, {
        exports: loadedPlugin,
        metadata,
        api: boundApi,
        instance: { vm: script, context: context },
        pluginPath: pluginPath
      });

      this.emit("pluginLoaded", pluginName);
    } catch (error) {
      console.error(`Échec du chargement du plugin à ${pluginPath}: ${error}`);
      console.log(error);
    }
  }

  forceUnloadPlugin(pluginName) {
    const plugin = this.plugins.get(pluginName);

    if (!plugin) {
      console.log(`Plugin ${pluginName} is not loaded.`);
      return;
    }

    const cleanGlobalScript = new vm.Script(
      "this.global = null; this.exports = null;"
    );

    const cleanThis = new vm.Script(
      "Object.keys(this).forEach(key => delete this[key]);"
    );

    cleanGlobalScript.runInContext(plugin.instance.context);
    cleanThis.runInContext(plugin.instance.context);
    delete require.cache[require.resolve(plugin.pluginPath)];

    console.log(`Plugin ${pluginName} unloaded.`);

    this.plugins.delete(pluginName);
  }

  async installPlugin(pluginName) {
    // Trouver les métadonnées du plugin
    const pluginInfo = this.plugins.get(pluginName);
    if (!pluginInfo || !pluginInfo.metadata) {
      console.error(`Plugin ${pluginName} non trouvé.`);
      return;
    }

    // Ajouter le plugin aux plugins installés
    await this.core.pluginsModel.create({
      identifier: pluginInfo.metadata.identifier
    });

    // Charger le plugin
    this.loadPlugin(pluginInfo.metadata);
  }

  getPluginShortcut(plugin) {
    return this.plugins.get(plugin.name).boundShortcut;
  }

  getPlugin(pluginName) {
    const pluginInfo = this.plugins.get(pluginName);
    return pluginInfo ? pluginInfo.exports : null;
  }

  async pluginInvokeApiMethod(data) {
    const { viewID, messageId, pluginName, methodName, args } = data;

    let pluginApi = this.plugins.get(pluginName).api;

    webview = document.querySelectorAll('[data-session="' + viewID + '"]')[1];
    try {
      const result = (await pluginApi[methodName])
        ? pluginApi[methodName](...args)
        : Promise.reject("Method not found");
      webview.send(`api-response-${messageId}`, { messageId, result });
    } catch (error) {
      webview.send(`api-response-${messageId}`, { messageId, error });
    }
  }

  async loadPluginForAllTabs(pluginMeta, preloadFilePath) {
    //Function to load the spécified file indicated in plugin.json targetInstances and
    console.log(pluginMeta);
    let pluginPath = path
      .join(pluginMeta._pluginPath, preloadFilePath)
      .toString();
    let preloadPlugins = Config.getTempItem("preloadPlugins");
    if (preloadPlugins) {
      let alreadyContains = preloadPlugins.find(
        (plugin) => plugin.identifier === pluginMeta.identifier
      );
      if (!alreadyContains) {
        preloadPlugins.push({ pluginName: pluginMeta.name, pluginPath });
        Config.setTempItem("preloadPlugins", preloadPlugins);
      }
    } else {
      Config.setTempItem("preloadPlugins", [
        { pluginName: pluginMeta.name, pluginPath }
      ]);
    }

    const tabArray = await this.core.navigation.sendToAll("load-plugin-part", {
      pluginName: pluginMeta.name,
      pluginPath
    });

    let resultArray = [];

    tabArray.forEach((result) => {
      let communicator = this.communicator.bindPlugin(pluginMeta.name, result);
      resultArray.push(communicator);
    });

    return resultArray;
  }

  loadInTab(pluginName, fileName, options) {
    const targetTabs = options ? options.target : "current"; // [Can be all/current/a selected] tab
    this.preloadPlugins.set(pluginName, fileName);
    let pluginPath = path
      .join(this.plugins.get(pluginName).metadata._pluginPath, fileName)
      .toString();

    this.core.navigation.send(targetTabs, "load-plugin-part", {
      pluginName,
      pluginPath
    });
  }

  isApiVersionCompatible(pluginApiVersion) {
    return semver.satisfies(pluginApiVersion, this.apiVersion);
  }

  reloadPlugin(pluginName) {
    const pluginInfo = this.plugins.get(pluginName);
    if (pluginInfo) {
      const pluginPath = path.join(this.pluginDirectory, pluginName);
      delete require.cache[require.resolve(pluginPath)];
      this.loadPlugin(pluginPath);
      console.log(`Plugin reloaded: ${pluginName}`);
    } else {
      console.error(`Plugin not found: ${pluginName}`);
    }
  }

  startPlugin(pluginName) {
    const pluginInfo = this.plugins.get(pluginName);
    if (pluginInfo && pluginInfo.plugin.start) {
      try {
        pluginInfo.plugin.start();
        console.log(`Plugin started: ${pluginName}`);
      } catch (error) {
        console.error(`Error starting plugin ${pluginName}: ${error.message}`);
      }
    } else {
      console.warn(`Start method not found for plugin: ${pluginName}`);
    }
  }

  stopPlugin(pluginName) {
    const pluginInfo = this.plugins.get(pluginName);
    if (pluginInfo && pluginInfo.plugin.stop) {
      try {
        pluginInfo.plugin.stop();
        console.log(`Plugin stopped: ${pluginName}`);
      } catch (error) {
        console.error(`Error stopping plugin ${pluginName}: ${error.message}`);
      }
    } else {
      console.warn(`Stop method not found for plugin: ${pluginName}`);
    }
  }

  removePlugin(plugin) {}

  restartPlugin(pluginName) {
    this.stopPlugin(pluginName);
    this.startPlugin(pluginName);
  }

  openPluginSettings(plugin) {
    let pluginSettingsContainer = document.getElementById("");
  }

  createCustomShortcuts(plugin, customShortcutTemplate) {
    let metadata = plugin.metadata;
    let firstLevelIcon = metadata.icon || null;
    let title = customShortcutTemplate.title || metadata.name;
    if (customShortcutTemplate.icon) {
      firstLevelIcon = customShortcutTemplate.icon;
    }

    let mainShortcut = this.core.browser.shortcutsManager.getContainer(0);

    if (customShortcutTemplate.template) {
      return mainShortcut.addItem({
        name: metadata.name,
        multiLevel: true,
        icon: firstLevelIcon,
        title: title,
        subContainerId: `${metadata.name}-PopComponent`,
        template: customShortcutTemplate.template
      });
    } else {
      return mainShortcut.addItem({
        name: metadata.name,
        multiLevel: false,
        icon: firstLevelIcon,
        title: title,
        action: "open-plugin-modal"
      });
    }
  }
}

module.exports = PluginManager;
