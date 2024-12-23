const HTMLElementAbstractionLayer = require('../Abstractors/HTMLElementAbstractionLayer');
const Utils = require('../../Utils/Utils');
class TabElementApi extends HTMLElementAbstractionLayer {
    constructor(communicator, id) {
        let tabElement = document.querySelectorAll('[data-session="' + id + '"]')[0];
        if (typeof tabElement === 'undefined') {
            console.error(`Tab with id ${id} not found`)
            return;
        }
        super(tabElement, false);

        this.id = id;
        this.communicator = communicator;
        this.webView = tabElement;

        return Utils.bindPrototypeToPlugin(this, {});
    }

    getCommunicator() {
        return this.communicator;
    }
}

module.exports = TabElementApi;