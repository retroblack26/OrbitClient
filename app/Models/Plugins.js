const Model = require("../Model");

/**
 * Classe Plugins pour gérer les opérations de base de données liées aux plugins.
 */
class Plugins extends Model {
  /**
   * Constructeur de la classe Plugins.
   * @param {sqlite3.Database} db - Instance de la base de données SQLite.
   */
  constructor(db) {
    super(db);
  }

  /**
   * Ajoute un nouveau plugin à la base de données.
   * @param {Object} plugin - L'objet plugin à ajouter.
   * @returns {Promise<number>} L'ID du nouveau plugin.
   */
  async create(plugin) {
    const id = await super.create(plugin);
    return id;
  }

  defaultStructure() {
    return {
      id: { type: "INTEGER PRIMARY KEY AUTOINCREMENT" },
      pluginName: { type: "TEXT NOT NULL" },
      pluginPath: { type: "TEXT NOT NULL" },
      identifier: { type: "TEXT NOT NULL" },
      enabled: { type: "TEXT" }, // Notez l'usage des guillemets simples pour les chaînes
      installed: { type: "TEXT" },
      install_date: { type: "INTEGER" }
    };
  }
}

module.exports = Plugins;
