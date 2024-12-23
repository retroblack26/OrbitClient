const path = require("path");
const fs = require("fs");
const CryptoUtils = require("../Utils/Crypto.js");

class JSONStore {
  constructor(opts) {
    if (opts && opts.file) {
      this.path = opts.file;
    } else {
      this.path = opts.path
        ? opts.path
        : path.join(global.appDataPath, opts.configName + ".json");
    }

    if (!fs.existsSync(path.dirname(this.path))) {
      fs.mkdirSync(path.dirname(this.path), { recursive: true });
    }

    if (opts.encrypted) {
      if (!opts.key) throw new Error("Encrypted stores need a key in options");
      this.decryptKey = CryptoUtils.sha1(opts.key);
      let decryptedDatas = CryptoUtils.decrypt(
        this.parseDataFile(opts.defaults, this.path),
        this.decryptKey
      );

      if (typeof decryptedDatas !== "string") {
        throw new Error(
          "Error when decrypting datas from users file for migration."
        );
      }

      this.data = JSON.parse(decryptedDatas);
    } else {
      this.data = opts.data ? opts.data : this.parseDataFile(opts.defaults);
    }

    this.defaults = opts.defaults;
  }

  get(key) {
    return this.data[key];
  }

  set(key, val, skey) {
    if (skey) {
      this.data[key][skey] = val;
    } else {
      this.data[key] = val;
    }
    this.writeData();
  }

  contains(key) {
    return Boolean(this.data[key]);
  }

  reload() {
    this.data = this.parseDataFile();
  }

  setDefaults(defaults) {
    this.data = this.data ? this.data : this.parseDataFile(defaults);
    this.defaults = defaults;
  }

  writeData(data) {
    if (data) {
      this.data = data;
      fs.writeFileSync(this.path, JSON.stringify(data));
    } else {
      fs.writeFileSync(this.path, JSON.stringify(this.data));
    }
  }

  parseDataFile(defaults, file) {
    let returnValue = null;
    try {
      if (!file) {
        returnValue = JSON.parse(fs.readFileSync(this.path));
      } else {
        returnValue = fs.readFileSync(file).toString();
      }

      return returnValue;
    } catch (error) {
      if (!file) {
        this.writeData(defaults);
        return defaults;
      }
    }
  }

  generateId(valueName, keyName = "id") {
    if (valueName) {
      if (!this.data || !this.data[valueName]) {
        return 1;
      }
    }

    if (!this.data) {
      return 1;
    }

    let maxId;

    if (valueName) {
      maxId = Math.max(...this.data[valueName].map((dat) => dat[keyName]));
    } else {
      maxId = Math.max(...this.data.map((dat) => dat[keyName]));
    }

    if (maxId === -Infinity) {
      return 1;
    }

    return maxId + 1;
  }

  writeFile(path, data) {
    fs.writeFileSync(path, data);
  }

  removeFile(path) {
    !path ? (path = this.path) : path;
    fs.unlink(path, (err) => {
      if (err) throw err;
    });
  }
}

module.exports = JSONStore;
