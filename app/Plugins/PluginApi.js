const PluginStore = require("./PluginStore");
const PluginCommunicator = require("./PluginCommunicator");
const path = require("path");
const MainUIAPI = require("./Api/MainUIAPI");
const Utils = require("../Utils/Utils");
const Config = new (require("../Models/Config.js"))();

class PluginAPI {
  constructor(pluginManager) {
    this.shortcut = pluginManager.shortcutManager;
    this.pluginManager = pluginManager;
  }

  useMiddleware(middleware) {
    this.pluginManager.pluginMiddlewares.push({ middleware });
  }

  updateDiscordPresence(presence) {
    const {} = presence;
  }

  createTab(args) {
    return new Promise(async (resolve, reject) => {
      let { url, preload } = args;
      if (!url) reject("URL is needed to create a tab");
      let newTab = await this.core.navigation.newTab(url);

      if (preload) {
        preload = path
          .join(this.pluginManager.pluginDirectory, this.plugin.name, preload)
          .toString();
        let tabChannel =
          await this.pluginManager.core.ipcRouter.getTabCommunication(
            newTab.id
          );
        await tabChannel.loadPluginPart({
          pluginName: this.plugin.name,
          pluginPath: preload
        });
        newTab.webview.addEventListener("did-finish-load", async () => {
          let rtabChannel =
            await this.pluginManager.core.ipcRouter.getTabCommunication(
              newTab.id
            );
          await rtabChannel.loadPluginPart({
            pluginName: this.plugin.name,
            pluginPath: preload
          });
        });
      }

      let tabApi = new MainUIAPI(this.pluginManager, this.plugin.name).getTab(
        newTab.id
      );
      resolve(tabApi);
    });
  }

  async loadInAllTabs(file) {
    return await this.pluginManager.loadPluginForAllTabs(
      this.plugin.name,
      file
    );
  }

  loadInCurrentTab(file) {
    let pluginCommunicator = this.pluginManager.pluginCommunicator.bindPlugin(
      this.plugin.name
    );
    this.pluginManager.loadInTab(this.plugin.name, file);

    return pluginCommunicator;
  }

  getPluginSettingsStore() {
    return this.pluginManager.pluginsStore.get(this.plugin);
  }

  createStoreInstance(configName) {
    return Utils.bindPrototypeToPlugin(
      new PluginStore({
        pluginName: this.plugin.name,
        configName: configName,
        appDataPath: global.appDataPath
      }),
      this.plugin
    );
  }

  _updateCore(core) {
    this.core = core;
  }

  // Method to emit events
  emitEvent(event, ...args) {
    this.pluginManager.emit(event, ...args);
  }

  onEvent(event, ...args) {
    this.pluginManager.on(event, ...args);
  }

  apiVersion() {
    return this.pluginManager.apiVersion;
  }

  updateCustomShortcut(template) {
    this.pluginManager.updateCustomShortcut(this.plugin, template);
  }

  getShortcut() {
    return this.pluginManager.getPluginShortcut(this.plugin);
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

  createCustomShortcut(template) {
    return Utils.bindPrototypeToPlugin(
      this.pluginManager.createCustomShortcuts(this.plugin, template),
      this.plugin
    );
  }

  getDependencyFunction(pluginName, functionName) {
    const plugin = this.pluginManager.getPlugin(pluginName);
    if (plugin && typeof plugin[functionName] === "function") {
      return plugin[functionName];
    } else {
      throw new Error(
        `Function ${functionName} not found in plugin ${pluginName}`
      );
    }
  }

  // More complex API methods can be added here
}

module.exports = PluginAPI;
