const path = require("path");
const fs = require("fs");
const https = require("https");
const http = require("http");
const url = require("url");

class ImageCache {
  constructor(userDataPath) {
    userDataPath = global.appDataPath ? global.appDataPath : userDataPath;
    if (!userDataPath) {
      throw new Error("userDataPath is required");
    }

    this.cacheDir = path.join(userDataPath, "bcache");

    // Create the cache directory if it doesn't exist
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  async downloadImage(baseUrl, outputPath = null) {
    if (baseUrl.startsWith("file://")) {
      return baseUrl;
    }
    const parsedUrl = url.parse(baseUrl);

    // Remove parameters from the URL
    parsedUrl.search = "";
    const cleanedUrl = url.format(parsedUrl);
    const fileName = this.generateRandom13Digits() + path.basename(cleanedUrl);
    const filePath = path.join(
      outputPath ? outputPath : this.cacheDir,
      fileName
    );
    // Create a write stream to save the image

    const fileStream = fs.createWriteStream(filePath);

    // Determine the appropriate module based on the URL protocol
    const requestModule = cleanedUrl.startsWith("https://") ? https : http;

    const requestOptions = {
      rejectUnauthorized: false // Ignore certificate errors
    };

    return new Promise((resolve, reject) => {
      // Download the image
      requestModule
        .get(cleanedUrl, requestOptions, (response) => {
          response.pipe(fileStream);

          fileStream.on("finish", () => {
            fileStream.close();
            resolve({ filePath, fileName });
          });
        })
        .on("error", (error) => {
          fileStream.close();
          reject(error);
        });
    });
  }

  async saveImage(image, options) {
    let format = "webp";

    if (options && options.convert == true) {
      if (options.format) {
        format = options.format;
      }
    }
    let name = this.generateRandom13Digits() + "." + format;
    let pathDir = path.join(this.cacheDir, name);
    let tempDir = pathDir + ".png";

    fs.writeFileSync(tempDir, image);

    return pathDir;
  }

  removeImage(path) {
    try {
      fs.unlink(path, (err) => {
        if (err) throw err;
      });
    } catch (e) {
      console.warn(e);
    }
  }

  generateRandom13Digits() {
    let result = "";
    for (let i = 0; i < 13; i++) {
      result += Math.floor(Math.random() * 10); // Generates a random digit (0-9)
    }
    return result;
  }
}

module.exports = ImageCache;
