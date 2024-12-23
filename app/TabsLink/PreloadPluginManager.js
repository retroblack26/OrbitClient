const { ipcRenderer } = require("electron");
const PluginCommunicator = require("../Plugins/PluginCommunicator");
const PluginConsole = require("../Plugins/PluginConsole");
const fs = require("fs");
const Utils = require("../Utils/Utils");

class PreloadPluginManager {
  constructor(core) {
    this.core = core;
    this.plugins = new Map();
    this.communicator = new PluginCommunicator("plugin", this.core.ipcRouter);
    this.pluginConsole = new PluginConsole(
      "plugin",
      null,
      this.core.ipcRouter.core,
      this.core.viewID
    );
  }

  loadPluginPart(pluginName, file) {
    return new Promise(async (resolve, reject) => {
      let viewID = !this.core.areWeInADataURL()
        ? sessionStorage.getItem("viewID")
        : this.core.viewID;
      if (this.plugins.has(pluginName)) {
        const pluginObj = this.plugins.get(pluginName);
        if (pluginObj.loadedParts.some((part) => part.pluginPath === file)) {
          resolve();
        }
      }

      try {
        const pluginCommunicator = this.communicator.bindPlugin(
          pluginName,
          viewID
        );

        const plugin = await this._loadModuleWithCustomContext(
          file,
          Utils.bindPrototypeToPlugin(
            this.pluginConsole,
            { name: pluginName },
            { viewID }
          ),
          pluginCommunicator
        );

        let loadedPlugin = new plugin(pluginCommunicator);

        let loadedParts = [];

        if (this.plugins.has(pluginName)) {
          loadedParts = this.plugins.get(pluginName).loadedParts;
        }

        loadedParts.push({
          name: loadedPlugin.constructor.name,
          pluginPath: file,
          loadedPlugin: loadedPlugin
        });
        this.plugins.set(pluginName, { loadedParts, pluginCommunicator });

        console.log(
          `[PluginManager] Preload part of ${pluginName} loaded. (${loadedParts.length})`
        );

        resolve();
      } catch (error) {
        console.error(error);
        console.error(`Failed to load plugin ${pluginName}: ${error.message}`);
        reject();
      }
    });
  }

  _loadModuleWithCustomContext(
    resolvedPath,
    pluginConsole,
    pluginCommunicator
  ) {
    return new Promise((resolve) => {
      // Read the module code
      const moduleCode = fs.readFileSync(resolvedPath, "utf8");

      // Define the custom context for the module
      const moduleContext = {
        require: require,
        module: {},
        exports: {},
        console: pluginConsole,
        window: window,
        document: document,
        self: self,
        global: global,
        parent: pluginCommunicator,
        MiddlewareManager: Utils.bindPrototypeToPlugin(
          this.core.middlewareManager
        )
      };

      // Create a function from the module code and execute it within the custom context
      const moduleFunction = new Function(
        ...Object.keys(moduleContext),
        moduleCode
      );

      // Execute the module function with the custom context
      moduleFunction.apply(moduleContext, Object.values(moduleContext));

      // Return the module's exports
      resolve(moduleContext.module.exports);
    });
  }

  getPlugin(pluginName) {
    const pluginInfo = this.plugins.get(pluginName);
    return pluginInfo ? pluginInfo.loadedParts : null;
  }
}

module.exports = PreloadPluginManager;
