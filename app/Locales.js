const path = require('path');
const fs = require('fs');
const { app } = require('electron');
const Config = new (require('./Models/Config'))();
class Locales {
  static instance;
  constructor() {
    if (Locales.instance) {
      return Locales.instance;
    }

    this.loadLocales();
    Locales.instance = this;
  }

  loadLocales() {
    this.baseUrl = global.appPath ? global.appPath : app.getAppPath();
    this.path = path.join(this.baseUrl + '/locales/', Config.get('language') + '.lang');
    this.data = this.parseDataFile(this.path, this.baseUrl);
  }

  get(key) {
    if (this.data[key]) {
      return this.data[key];
    }
    console.log(`Missing translation for: ${key}`);
    return key;
  }

  reload(language) {
    this.path = path.join(this.baseUrl + '/locales/', language + '.lang');
    this.data = this.parseDataFile(this.path, this.baseUrl);
  }

  parseDataFile(filePath, baseUrl) {
    try {
      return JSON.parse(fs.readFileSync(filePath));
    } catch (error) {
      return JSON.parse(fs.readFileSync(path.join(baseUrl + '/locales/', 'en_US.lang')))
    }
  }
}
module.exports = new Locales(); // Export the instance
