/**
 * Classe de base pour la modélisation et la gestion des opérations sur les tables de la base de données SQLite.
 */
class Model {
  /**
   * Constructeur de la classe BaseModel.
   * @param {sqlite3.Database} db - Instance de la base de données SQLite.
   * @param {string} tableName - Nom de la table à gérer.
   */
  constructor(db) {
    this.db = db;
    this.tableName = this.constructor.name.toLowerCase();
    this.ready = this.ensureTableExists();
  }

  async ensureTableExists() {
    return new Promise(async (resolve, reject) => {
      await this.db.get(
        `SELECT name FROM sqlite_master WHERE type='table' AND name=?;`,
        [this.tableName],
        async (err, row) => {
          if (err) {
            console.error(
              "Erreur lors de la vérification de l'existence de la table:",
              err
            );
            reject(err);
            return;
          }
          if (!row) {
            console.log(
              `La table ${this.tableName} n'existe pas. Création en cours...`
            );
            await this.createTable();
            resolve();
          }
          resolve();
        }
      );
    });
  }

  async createTable() {
    return new Promise(async (resolve, reject) => {
      if (
        typeof this.defaultStructure !== "function" ||
        !Object.keys(this.defaultStructure()).length
      ) {
        reject("Structure de la table non définie ou invalide.");
      }

      let structure = this.defaultStructure();
      // Génère la définition des colonnes en prenant en compte les types et les valeurs par défaut
      const columns = Object.entries(structure)
        .map(([key, { type, defaultValue }]) => {
          let columnDefinition = `${key} ${type}`;
          if (defaultValue !== undefined) {
            columnDefinition += ` DEFAULT ${defaultValue}`;
          }
          return columnDefinition;
        })
        .join(", ");

      const sql = `CREATE TABLE ${this.tableName} (${columns});`;

      await this.db.run(sql, (err) => {
        if (err) {
          reject(
            `Erreur lors de la création de la table ${this.tableName}:`,
            err
          );
        } else {
          console.log(`Table ${this.tableName} créée avec succès.`);
          resolve();
        }
      });
    });
  }

  /**
   * Récupère un enregistrement par son ID.
   * @param {number} id - L'ID de l'enregistrement à récupérer.
   * @returns {Promise<Object|null>} Une promesse résolue avec l'enregistrement trouvé ou null si aucun n'a été trouvé.
   * @example
   * const user = await userModel.find(1);
   */
  find(id) {
    return new Promise((resolve, reject) => {
      this.db.get(
        `SELECT * FROM ${this.tableName} WHERE id = ?`,
        [id],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row);
          }
        }
      );
    });
  }

  /**
   * Récupère tous les enregistrements de la table.
   * @returns {Promise<Object[]>} Une promesse résolue avec un tableau d'objets représentant les enregistrements.
   * @example
   * const users = await userModel.findAll();
   */
  findAll() {
    return new Promise((resolve, reject) => {
      this.db.all(`SELECT * FROM ${this.tableName}`, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  /**
   * Compte le nombre d'éléments dans la collection spécifiée.
   * @returns {Promise<number>} Le nombre d'éléments dans la collection.
   */
  count() {
    return new Promise((resolve, reject) => {
      this.db.get(
        `SELECT COUNT(*) AS count FROM ${this.tableName}`,
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row.count);
          }
        }
      );
    });
  }

  /**
   * Recherche un enregistrement par une colonne spécifique.
   * @param {string} columnName - Nom de la colonne utilisée pour la recherche.
   * @param {string|number} value - Valeur à rechercher dans la colonne spécifiée.
   * @returns {Promise<Object|null>} Une promesse résolue avec l'objet trouvé ou null.
   * @example
   * const user = await userModel.findByColumn('email', 'user@example.com');
   */
  findByColumn(columnName, value) {
    return new Promise((resolve, reject) => {
      this.db.get(
        `SELECT * FROM ${this.tableName} WHERE ${columnName} = ?`,
        [value],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row);
          }
        }
      );
    });
  }

  /**
   * Insère un nouvel enregistrement dans la table.
   * @param {Object} data - Un objet où les clés correspondent aux noms de colonnes et les valeurs aux données à insérer.
   * @returns {Promise<number>} Une promesse résolue avec l'ID du nouvel enregistrement.
   * @example
   * const userId = await userModel.create({ name: 'John Doe', email: 'john@example.com' });
   */
  create(data) {
    this.validate(data); // Validation intégrée
    const columns = Object.keys(data).join(", ");
    const placeholders = Object.keys(data)
      .map(() => "?")
      .join(", ");
    const values = Object.values(data);

    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO ${this.tableName} (${columns}) VALUES (${placeholders})`,
        values,
        function (err) {
          if (err) {
            reject(err);
          } else {
            resolve(this.lastID);
          }
        }
      );
    });
  }

  /**
   * Met à jour un enregistrement existant identifié par son ID.
   * @param {number} id - ID de l'enregistrement à mettre à jour.
   * @param {Object} data - Un objet où les clés correspondent aux noms des colonnes à mettre à jour et les valeurs aux nouvelles données.
   * @returns {Promise<number>} Une promesse résolue avec le nombre d'enregistrements mis à jour.
   * @example
   * const changes = await userModel.update(1, { name: 'Jane Doe', email: 'jane@example.com' });
   */
  update(id, data) {
    this.validate(data); // Validation intégrée
    const updates = Object.keys(data)
      .map((key) => `${key} = ?`)
      .join(", ");
    const values = [...Object.values(data), id];

    return new Promise((resolve, reject) => {
      this.db.run(
        `UPDATE ${this.tableName} SET ${updates} WHERE id = ?`,
        values,
        function (err) {
          if (err) {
            reject(err);
          } else {
            resolve(this.changes);
          }
        }
      );
    });
  }

  /**
   * Supprime un enregistrement de la table basé sur son ID.
   * @param {number} id - ID de l'enregistrement à supprimer.
   * @returns {Promise<number>} Une promesse résolue avec le nombre d'enregistrements supprimés.
   * @example
   * const changes = await userModel.delete(1);
   */
  delete(id) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `DELETE FROM ${this.tableName} WHERE id = ?`,
        [id],
        function (err) {
          if (err) {
            reject(err);
          } else {
            resolve(this.changes);
          }
        }
      );
    });
  }

  /**
   * Valide les données avant leur insertion ou mise à jour.
   * @param {Object} data - Données à valider.
   * @throws {Error} Si les données sont invalides.
   */
  validate(data) {
    if (!data || typeof data !== "object" || !Object.keys(data).length) {
      throw new Error("Données invalides");
    }
    // Ajouter ici des validations spécifiques au modèle
  }

  /**
   * Exécute plusieurs opérations dans une transaction unique.
   * @param {Function[]} operations - Un tableau de fonctions exécutant des opérations de base de données.
   * @returns {Promise<void>} Une promesse résolue une fois la transaction terminée.
   * @example
   * await userModel.transaction([
   *   () => userModel.create({ name: "Alice", email: "alice@example.com" }),
   *   () => userModel.update(1, { name: "Bob", email: "bob@example.com" })
   * ]);
   */
  transaction(operations) {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run("BEGIN TRANSACTION;");
        try {
          operations.forEach((operation) => {
            operation();
          });
          this.db.run("COMMIT;", () => resolve());
        } catch (error) {
          this.db.run("ROLLBACK;", () => reject(error));
        }
      });
    });
  }

  /**
   * Permet d'exécuter des requêtes SQL personnalisées.
   * @param {string} sql - La requête SQL à exécuter.
   * @param {Array} params - Les paramètres de la requête SQL.
   * @returns {Promise<Object[]>} Une promesse résolue avec les résultats de la requête.
   * @example
   * const users = await userModel.customQuery('SELECT * FROM users WHERE email LIKE ?', ['%example.com']);
   */
  customQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }
}

class EncryptedModel extends Model {
  constructor(hash) {}
}

class DictionaryModel extends EncryptedModel {
  async createOrUpdate(id, value) {
    let linesCount = await super.count();
    if (linesCount <= 0) {
      await this.create(value);
    } else {
      await this.update(id, value);
    }
  }
}

module.exports = Model;
