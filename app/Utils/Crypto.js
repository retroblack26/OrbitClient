const CryptoJS = require("crypto-js");
const machineID = require("node-machine-id");

const uniqueID = machineID.machineIdSync();

class CryptoUtils {
  randomUUID() {
    const hex = "0123456789abcdef";
    let uuid = "";

    for (let i = 0; i < 36; i++) {
      if (i === 8 || i === 13 || i === 18 || i === 23) {
        uuid += "-";
      } else if (i === 14) {
        uuid += "4"; // Version 4 UUID always has the third segment start with 4
      } else {
        const randomIndex = Math.floor(Math.random() * 16);
        uuid += hex[randomIndex];
      }
    }

    // Ensure the 17th character is always '8', '9', 'a', or 'b'
    const specialChar = hex[8 + Math.floor(Math.random() * 4)];
    uuid = uuid.substr(0, 19) + specialChar + uuid.substr(20);

    return uuid;
  }

  sha1(passKey, oldVersion = false) {
    if (oldVersion == true) {
      return CryptoJS.SHA1(passKey + "12345678").toString();
    }
    return CryptoJS.SHA1(passKey + uniqueID).toString();
  }

  encrypt(text, secretKey) {
    try {
      if (typeof text !== "string" || text === "") {
        throw new Error("Invalid text for encryption.");
      } else if (typeof secretKey !== "string") {
        throw new Error("Invalid key for encryption.");
      }
      return CryptoJS.AES.encrypt(text, secretKey).toString();
    } catch (error) {
      console.error("An error occurred during encryption:", error);
      return null;
    }
  }

  decrypt(cipherText, secretKey) {
    try {
      if (typeof cipherText !== "string" || cipherText === "") {
        return [{ returnState: false, reason: "cipherText sucks..." }];
      } else if (typeof secretKey !== "string") {
        return [
          {
            returnState: false,
            reason: "error when decrypt secret is empty or not string"
          }
        ];
      }
      const bytes = CryptoJS.AES.decrypt(cipherText, secretKey);
      const decryptedText = bytes.toString(CryptoJS.enc.Utf8);

      // In case decryption fails, CryptoJS will return an empty string
      if (decryptedText === "") {
        return [
          {
            returnState: false,
            reason: " decryption fails, CryptoJS will return an empty string"
          }
        ];
      }

      return decryptedText;
    } catch (error) {
      console.error("An error occurred during decryption:", error);

      return [
        {
          returnState: "error",
          reason: "An error occurred during decryption:",
          error
        }
      ];
    }
  }
}

module.exports = new CryptoUtils();
