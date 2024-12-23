const axios = require("axios");
const fs = require("fs");
const ImageCache = require("./Utils/ImageCache");
const Config = new (require("./Models/Config"))();

const updateGameUrl =
  "http://darkorbit-22-client.bpsecure.com/bpflashclient/windows.x64/repository/Updates.xml";
const serverListUrl = "https://orbitclient.online/updateServers";
const systemMessageUrl = "https://orbitclient.online/systemMessage/";
const updateNoteUrl = "https://orbitclient.online/updates/latest/";

class Updater {
  constructor(appDataPath) {
    this.appDataPath = appDataPath;
    this.imageCache = new ImageCache(this.appDataPath);
  }
  async httpGet(url) {
    try {
      const response = await axios.get(url, { responseType: "text" });
      return response.data;
    } catch (error) {
      console.error(error);
    }
  }
  async getGameVersion() {
    try {
      const versionString = await this.httpGet(updateGameUrl);
      const version = versionString.match(/>(.*)<\/Version/)[1];
      return `BigPointClient/${version}`;
    } catch (error) {
      console.error(error);
      return Config.get("gameVersion");
    }
  }

  async getServerList() {
    try {
      const result = await this.httpGet(serverListUrl);
      return result; // Assuming the result is JSON
    } catch (error) {
      console.error(error);
    }
  }

  async getSystemMessage(language, platform) {
    try {
      const result = await this.httpGet(
        `${systemMessageUrl}${platform}/${language}`
      );
      if (result.length <= 0) {
        return null;
      }
      return result; // Assuming the result is JSON
    } catch (error) {
      console.error(error);
    }
  }

  async getUpdateNote(language) {
    try {
      const result = await this.httpGet(`${updateNoteUrl}${language}`);
      return result; // Assuming the result is JSON
    } catch (error) {
      console.error(error);
    }
  }

  async updateServerList(server_list) {
    try {
      if (
        Config.get("serverListUpdateMode") == "automatic" &&
        this.checkDelayBetweenUpdates(Config.get("lastServerListUpdate"), 1)
      ) {
        const imagesDir = `${global.appPath}/app/Ui/Views/sections/newTab/server_images`;

        if (!fs.existsSync(imagesDir)) {
          fs.mkdirSync(imagesDir, { recursive: true });
        }

        const updateServerImages = async (servers) => {
          const promises = servers.map(async (server) => {
            if (server.image) {
              let image = await this.imageCache.downloadImage(
                server.image,
                imagesDir
              );
              server.image = `'server_images/${image.fileName}'`;
            }
            return server;
          });
          return Promise.all(promises);
        };

        let localData = JSON.parse(await this.getServerList());
        let remoteServers = server_list.data.servers || [];
        let localServers = localData.servers || [];

        // Remove servers marked as deleted
        localServers = localServers.filter(
          (localServer) =>
            !remoteServers.some(
              (remoteServer) =>
                remoteServer.id === localServer.id && remoteServer.deleted
            )
        );

        // Add or update new servers from the remote list
        remoteServers.forEach((remoteServer) => {
          const existingIndex = localServers.findIndex(
            (localServer) => localServer.id === remoteServer.id
          );

          if (existingIndex > -1) {
            localServers[existingIndex] = {
              ...localServers[existingIndex],
              ...remoteServer
            };
          } else {
            localServers.push(remoteServer);
          }
        });

        const updatedServers = await updateServerImages(localServers);

        localData.servers = updatedServers; // Update the local server list
        server_list.writeData(localData); // Write updated data to the file

        Config.set("lastServerListUpdate", new Date().toISOString()); // Update the last update time
      }
    } catch (e) {
      console.warn(e);
      return undefined;
    }
  }

  async updateGameAgent() {
    if (
      this.checkDelayBetweenUpdates(
        Config.get("lastGameUpdate"),
        null,
        Config.get("gameUpdateFrequency")
      )
    ) {
      let result = await this.getGameVersion();
      if (result) {
        Config.set("gameVersion", result);
        Config.set("lastGameUpdate", new Date().toISOString());
      }
    }
  }

  checkDelayBetweenUpdates(lastUpdate, delay, updateFrequency) {
    // Si la fréquence de mise à jour est définie sur 'never', aucune mise à jour n'est nécessaire
    if (updateFrequency == "never") {
      return false;
    }

    const currentDateTime = new Date(); // Date et heure actuelles

    // Si la dernière mise à jour est définie sur 'never', une mise à jour est nécessaire
    if (lastUpdate === "never") {
      return true;
    }

    const lastUpdateDateTime = new Date(lastUpdate); // Convertir la dernière mise à jour en objet 'Date'
    const timeDifference = currentDateTime - lastUpdateDateTime; // Calculer la différence en millisecondes
    const daysDifference = timeDifference / (1000 * 60 * 60 * 24); // Convertir en jours

    // Vérifier la nécessité de mise à jour basée sur la fréquence de mise à jour
    switch (updateFrequency) {
      case "everyday":
        return daysDifference >= 1;
      case "everyweek":
        return daysDifference >= 7;
      default:
        // Si aucune fréquence de mise à jour spécifique n'est définie, utiliser le délai
        return daysDifference >= delay;
    }
  }
}

module.exports = Updater;
