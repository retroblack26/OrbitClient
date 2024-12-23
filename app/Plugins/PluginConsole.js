const { ipcRenderer } = require('electron');
class PluginConsole {

    constructor(caller = 'renderer', pluginConsoleModal, ipcRouter, viewID) {
        this.originalConsole = window.console;
        this.ipcRouter = ipcRouter;
        if (caller == 'renderer') {
            if (!pluginConsoleModal) {
                throw new Error('pluginConsole modal must be passed as argument');
            }
            this.pluginConsoleModal = pluginConsoleModal;
        } else {
            this.caller = caller;
            this.viewID = viewID;
        }
    }

    log(...args) {
        this.originalConsole.log(`[${this.plugin.name}]: `, ...args);//log in the plugin console html eleemnt
        if (this.caller == 'plugin') {
            try {
                this.ipcRouter.pluginDebugConsole({ pluginName: this.plugin.name, viewID: this.viewID, args: args })
            } catch (e) {
                this.originalConsole.error(`[${this.plugin.name}]: ${e}`);
            }
        }
    }
    error(...args) {
        this.originalConsole.error(`[${this.plugin.name}]: `, ...args);//log in the plugin console html eleemnt
        if (this.caller == 'plugin') {
            try {
                this.ipcRouter.pluginDebugConsole({ pluginName: this.plugin.name, viewID: this.viewID, args: args })
            } catch (e) {
                this.originalConsole.error(`[${this.plugin.name}]: ${e}`);
            }
        }
    }
    warn(...args) {
        this.originalConsole.warn(`[${this.plugin.name}]: `, ...args);//log in the plugin console html eleemnt
        if (this.caller == 'plugin') {
            try {
                this.ipcRouter.pluginDebugConsole({ pluginName: this.plugin.name, viewID: this.viewID, args: args })
            } catch (e) {
                this.originalConsole.error(`[${this.plugin.name}]: ${e}`);
            }
        }
    }
}

module.exports = PluginConsole;