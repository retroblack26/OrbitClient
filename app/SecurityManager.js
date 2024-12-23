const crypto = require('crypto');
class SecurityManager {
    constructor() {
        this.sharedProcess = {};
    }

    async registerProcess(processName) {
        return new Promise((resolve, reject) => {
            const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
                modulusLength: 2048,
                publicKeyEncoding: { type: 'spki', format: 'pem' },
                privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
            });


            this.sharedProcess[processName] = {
                publicKey: publicKey,
                privateKey: privateKey
            }

            resolve({ publicKey: publicKey, privateKey: privateKey });
        });

    }

    removeProcess(processName) {
        if (this.sharedProcess[processName]) {
            delete this.sharedProcess[processName];
        }
    }

    removeAllProcess() {
        for (let process in this.sharedProcess) {
            if (!process.startsWith('main-')) {
                delete this.sharedProcess[process];
            }
        }
    }

    encrypt(message, processName) {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-cbc', this.sharedProcess[processName].sharedKey, iv);
        let encrypted = cipher.update(message, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return { iv: iv.toString('hex'), content: encrypted };
    }

    decrypt(encryptedMessage, processName) {
        const iv = Buffer.from(encryptedMessage.iv, 'hex');
        const encryptedText = Buffer.from(encryptedMessage.content, 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', this.sharedProcess[processName].sharedKey, iv);
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
}

module.exports = SecurityManager;
