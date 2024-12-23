const JSONStore = require('../Stores/JSONStore');

class PluginStore extends JSONStore {

    constructor({ pluginName, defaults, configName, encrypted, appDataPath }) {
        let options = {
            configName: !configName ? `/plugins/store/${pluginName}/${pluginName}` : `/plugins/store/${pluginName}/${configName}`,
            defaults: defaults ? defaults : {},
            appDataPath: appDataPath
        };
        if (encrypted) {

        }
        super(options);
    }
}

module.exports = PluginStore;