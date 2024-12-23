const Model = require("../Model.js");
const crypto = require("../Utils/Crypto.js");

class Users extends Model {
  constructor(db) {
    super(db);

    this.initialized = false;
  }

  async initialize({ secretKey, masterPasswordUnlock, hash }) {
    return new Promise(async (resolve) => {
      if (hash) {
        this.hash = hash;
      } else {
        this.hash = crypto.sha1(secretKey);
      }
      let result = await this.parseData(this.hash, masterPasswordUnlock);

      this.initialized = true;
      resolve(result);
    });
  }

  count() {
    if (this.data && this.data.users) {
      return this.data.users.length;
    }
    return 0;
  }

  get(id) {
    if (this.data.users) {
      return this.data.users.find((user) => user.id == id);
    }
    return null;
  }

  contains(login, domain) {
    if (this.data) {
      return this.data.users.some(
        (user) => user.login == login && user.domain == domain
      );
    }
    return false;
  }

  async addUser(user, bypass, masterPassword, setMasterPasswordCallback) {
    return new Promise(async (resolve) => {
      let usersCount = this.count();
      if (usersCount <= 0 && masterPassword === false && !bypass) {
        await setMasterPasswordCallback().then(async (result) => {
          user.id = this.generateUserId();

          if (this.data) {
            if (this.data.users) {
              this.data.users.push(user);
            }
          } else {
            this.data = { users: [user] };
          }
          let cipherText = crypto.encrypt(
            JSON.stringify(this.data).toString(),
            this.hash
          );
          if (!cipherText) console.log("Encryption failed");
          await this.createOrUpdate(1, { value: cipherText });
          resolve(user.id);
        });
      } else {
        user.id = user.id ? user.id : this.generateUserId();

        if (this.data) {
          if (this.data.users) {
            let userExist = false;
            for (let userD of this.data.users) {
              if (userD.id == user.id) {
                userD.login = user.login;
                userD.password = user.password;
                userD.domain = user.domain;
                userExist = true;
                break;
              }
            }
            if (!userExist) {
              this.data.users.push(user);
            }
          }
        } else {
          this.data = { users: [user] };
        }

        let cipherText = crypto.encrypt(
          JSON.stringify(this.data).toString(),
          this.hash
        );
        if (!cipherText) console.log("Encryption failed");
        await this.createOrUpdate(1, { value: cipherText });
        resolve(user.id);
      }
    });
  }

  async createOrUpdate(id, value) {
    let linesCount = await super.count();
    if (linesCount <= 0) {
      await this.create(value);
    } else {
      await this.update(id, value);
    }
  }

  async removeUser(id) {
    if (this.data && this.data.users) {
      this.data.users = this.data.users.filter((user) => user.id != id);
      let cipherText = crypto.encrypt(
        JSON.stringify(this.data).toString(),
        this.hash
      );
      if (!cipherText) console.log("Encryption failed");
      await this.update(1, { value: cipherText });
    }
  }

  generateUserId() {
    if (!this.data) {
      return 1;
    }

    let maxId = Math.max(...this.data.users.map((user) => user.id));

    if (maxId === -Infinity) {
      return 1;
    }

    return maxId + 1;
  }

  setMasterPassword(password) {
    this.hash = crypto.sha1(password);
  }

  async changeMasterPassword(oldPassword, newPassword) {
    if (!this.checkMasterPassword(oldPassword)) {
      return false;
    }

    this.hash = crypto.sha1(newPassword);

    if (this.data) {
      let result = await this.reloadUsers(this.data);
      if (!result) {
        return false;
      }
    }

    return true;
  }

  getUsers() {
    if (typeof this.data !== "undefined") {
      return this.data;
    }
    return {};
  }

  async reloadUsers(users) {
    if (users) {
      this.data = users;
    }

    let cipherText = crypto.encrypt(
      JSON.stringify(this.data).toString(),
      this.hash
    );
    this.cipher = cipherText;
    if (!cipherText) {
      throw new Error("Error when encryption of users");
    }

    let result = await this.update(1, { value: cipherText });
    if (result.error) {
      return false;
    }

    return true;
  }

  async removeAllUsers() {
    let result = await this.reloadUsers([]);
    if (!result) {
      return false;
    }
    return true;
  }

  async checkMasterPassword(secretKey) {
    let hashedPasword = crypto.sha1(secretKey);
    try {
      if (typeof hashedPasword !== "string") {
        return false;
      }

      let tempValue = await this.find(1);

      const decryptedText = crypto.decrypt(tempValue.value, hashedPasword);

      if (typeof decryptedText === "object") {
        return false;
      }

      // In case decryption fails, CryptoJS will return an empty string
      if (decryptedText === "") {
        return false;
      }

      return true;
    } catch (error) {
      console.error("An error occurred during password verification:", error);
      return false;
    }
  }

  defaultStructure() {
    return {
      id: { type: "INTEGER PRIMARY KEY AUTOINCREMENT" },
      value: { type: "TEXT NOT NULL" }
    };
  }

  getUsersLogins(domain) {
    let result = [];
    try {
      const users = this.getUsers();
      if (users.users) {
        result = users.users
          .filter((user) => user.domain === domain)
          .map((user) => ({ login: user.login, id: user.id }));
      }
    } catch (e) {
      console.error(e);
    }

    return result;
  }

  parseData(secretKey, masterPasswordUnlock) {
    return new Promise(async (resolve, reject) => {
      try {
        let encryptedData = await this.find(1);
        let decryptedData = crypto.decrypt(
          encryptedData.value,
          secretKey.toString()
        );
        if (typeof decryptedData === "object") {
          if (decryptedData[0].returnState == false) {
            if (masterPasswordUnlock === true) {
              resolve(false);
            }
          } else if (decryptedData[0].returnState == "error") {
            resolve(false);
          }
          resolve(false);
        }

        let JSONObj = JSON.parse(decryptedData.toString());

        this.data = JSONObj;
        this.cipher = encryptedData.value;

        resolve(true);
      } catch (error) {
        resolve(false);
      }
    });
  }
}

module.exports = Users;
