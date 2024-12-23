const sqlite3 = require("sqlite3").verbose();
class SQLiteStore {
  constructor(dbPath) {
    this.db = new sqlite3.Database(
      dbPath,
      sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
      (err) => {
        if (err) {
          console.error(err.message);
        }
      }
    );
  }

  getDatabase() {
    return this.db;
  }
}
module.exports = SQLiteStore;
