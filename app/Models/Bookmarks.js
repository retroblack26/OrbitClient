const Model = require("../Model");

/**
 * Classe Bookmarks pour gérer les opérations de base de données liées aux marque-pages.
 */
class Bookmarks extends Model {
  /**
   * Constructeur de la classe Bookmarks.
   * @param {sqlite3.Database} db - Instance de la base de données SQLite.
   */
  constructor(db) {
    super(db);
  }

  // L'utilisation de la méthode find héritée de BaseModel rend cette surcharge inutile.
  // get(id) est donc supprimée puisque BaseModel fournit déjà cette fonctionnalité.

  /**
   * Récupère et trie les marque-pages par leur position.
   * @returns {Promise<Object[]>} Un tableau de marque-pages triés.
   */
  getSortedBookmarks() {
    return this.customQuery(
      `SELECT * FROM ${this.tableName} ORDER BY position ASC`,
      []
    );
  }

  /**
   * Vérifie si un marque-page avec l'URL spécifiée existe déjà.
   * @param {string} url - URL du marque-page à vérifier.
   * @returns {Promise<boolean>} Vrai si le marque-page existe, faux sinon.
   */
  async contains(url) {
    const rows = await this.customQuery(
      `SELECT COUNT(id) AS count FROM ${this.tableName} WHERE url = ?`,
      [url]
    );
    return rows[0].count > 0;
  }

  /**
   * Ajoute un nouveau marque-page à la base de données.
   * @param {Object} bookmark - L'objet marque-page à ajouter.
   * @returns {Promise<number>} L'ID du nouveau marque-page.
   */
  async create(bookmark) {
    // L'ID et la position peuvent être générés automatiquement en fonction de votre configuration de base de données.
    let position = (await super.count()) + 1;
    bookmark.position = position;
    const id = await super.create(bookmark);
    return id;
  }

  defaultStructure() {
    return {
      id: { type: "INTEGER PRIMARY KEY AUTOINCREMENT" },
      title: { type: "TEXT NOT NULL" },
      url: { type: "TEXT" }, // Notez l'usage des guillemets simples pour les chaînes
      icon: { type: "TEXT" },
      position: { type: "INTEGER" }
    };
  }
}

module.exports = Bookmarks;
