const Model = require("../Model");
const crypto = require("../Utils/Crypto");

class UserDatas extends Model {
  constructor(db) {
    super(db);
  }

  defaultStructure() {
    return {
      id: { type: "INTEGER PRIMARY KEY AUTOINCREMENT" },
      value: { type: "TEXT" }
    };
  }

  initialize(hash) {
    this.hash = hash;
  }

  updateHash(hash) {
    this.hash = hash;
  }

  async save(stateObj) {
    try {
      let encryptedData = crypto.encrypt(JSON.stringify(stateObj), this.hash);
      await this.createOrUpdate(1, encryptedData);
    } catch (error) {
      console.error(error);
    }
    //encryp & save the tab state into db
  }

  async createOrUpdate(id, value) {
    let linesCount = await super.count();
    if (linesCount <= 0) {
      await this.create({ value });
    } else {
      await this.update(id, { value });
    }
  }

  async getSavedTabs() {
    try {
      // Tentative de lecture des données
      let encryptedDatas;
      try {
        encryptedDatas = await this.find(1);
      } catch (readError) {
        throw new Error(
          "Erreur lors de la lecture des données : " + readError.message
        );
      }

      // Tentative de déchiffrement des données
      let rawDatas;
      try {
        rawDatas = crypto.decrypt(encryptedDatas.value, this.hash);
      } catch (decryptError) {
        throw new Error(
          "Erreur lors du déchiffrement des données : " + decryptError.message
        );
      }

      // Tentative de conversion des données JSON en objet
      try {
        this.stateDatas = JSON.parse(rawDatas);
      } catch (parseError) {
        throw new Error(
          "Erreur lors de l'analyse JSON des données : " + parseError.message
        );
      }
      return this.stateDatas;
    } catch (error) {
      // Gestion des erreurs spécifiques
      console.error("Une erreur est survenue dans getSavedTabs: ", error);
      // Retourner une valeur par défaut ou propager l'erreur
      return null; // ou throw error;
    }
  }

  removeSavedTabs() {
    this.stateDatas = null;
    this.update(1, { value: {} });
  }
}

module.exports = UserDatas;
