const fs = require('fs');
const path = require('path');
const { app } = require('electron');

class LogHelper {
    constructor(opts) {
        // Définir le chemin du dossier de logs
        this.logsDirPath = opts ? opts.logsDirPath ? opts.logsDirPath : path.join(app.getPath('userData'), 'logs') : path.join(app.getPath('userData'), 'logs');

        // Créer le dossier 'logs' s'il n'existe pas
        if (!fs.existsSync(this.logsDirPath)) {
            fs.mkdirSync(this.logsDirPath);
        }

        // Supprimer les fichiers de log sauf les deux plus récents
        this._keepLatestLogs(2);

        // Générer un nom de fichier basé sur la date actuelle
        const currentDate = new Date().toISOString().split('T')[0];
        const logFileName = `log_${currentDate}.txt`;

        // Définir le chemin du fichier de log dans le dossier 'logs'
        this.logFilePath = path.join(this.logsDirPath, logFileName);

        // Si le fichier de log n'existe pas, écrire la date et l'heure actuelles comme première ligne
        if (!fs.existsSync(this.logFilePath)) {
            fs.writeFileSync(this.logFilePath, `Log started on: ${new Date().toISOString()}\n`);
        }
    }

    _keepLatestLogs(count) {
        const logFiles = fs.readdirSync(this.logsDirPath).filter(file => file.startsWith('log_')).sort().reverse();
        for (let i = count; i < logFiles.length; i++) {
            fs.unlinkSync(path.join(this.logsDirPath, logFiles[i]));
        }
    }

    _isDuplicate(message) {
        const lastLine = fs.readFileSync(this.logFilePath, 'utf-8').trim().split('\n').pop();
        return lastLine === message;
    }

    // Écrire un message dans le fichier de log avec un niveau de gravité
    log(level, message) {
        if (!this._isDuplicate(message)) {
            const timestamp = new Date().toISOString();
            const logMessage = `${timestamp} [${level}] - ${message}\n`;

            fs.appendFile(this.logFilePath, logMessage, (err) => {
                if (err) {
                    console.error('Erreur lors de l\'écriture dans le fichier de log:', err);
                }
            });
        }
    }

    error(message) {
        this.log('ERROR', message);
    }

    warning(message) {
        this.log('WARNING', message);
    }

    info(message) {
        this.log('INFO', message);
    }

    debug(message) {
        this.log('DEBUG', message);
    }

    // Lire le contenu du fichier de log
    read(callback) {
        fs.readFile(this.logFilePath, 'utf8', (err, data) => {
            if (err) {
                console.error('Erreur lors de la lecture du fichier de log:', err);
                callback(null);
                return;
            }
            callback(data);
        });
    }

    // Effacer le contenu du fichier de log
    clear() {
        fs.truncate(this.logFilePath, 0, (err) => {
            if (err) {
                console.error('Erreur lors de l\'effacement du fichier de log:', err);
            }
        });
    }
}

module.exports = LogHelper;
