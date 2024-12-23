class PluginConsoleUi {
    constructor(options) {
        this.ready = new Promise(async resolve => {
            await this._initUi();
            resolve();
        })
    }

    async _initUi() {
        let container = document.createElement("div");
        container.id = "pluginConsoleContainer";

        //document.body.appendChild(container);

    }

    addLog(args) {
        console.log(args);
    }

    async show(){

    }
}
module.exports = PluginConsoleUi;