class PluginCommunicator {
  constructor(channelPrefix, ipcRouter) {
    this.channelPrefix = channelPrefix;
    this.ipcRouter = ipcRouter;
  }

  bindPlugin(pluginName, tabID) {
    if (this.channelPrefix == "renderer") {
      return new Proxy(this, {
        get: (_, preloadKey) => {
          return new Proxy(this, {
            get: (target, propKey) => {
              return (...args) => {
                return new Promise(async (resolve, reject) => {
                  const messageObject = {
                    pluginName,
                    methodName: propKey,
                    partName: preloadKey,
                    args,
                  };

                  let webview = document.querySelectorAll(
                    'webview[data-session="' + tabID + '"]'
                  )[0];

                  if (webview) {
                    let tabChannel = await this.ipcRouter.getTabCommunication(
                      tabID
                    );
                    try {
                      let result = await tabChannel.rendererPluginInvokePreload(
                        messageObject
                      );
                      if (result.error) {
                        console.log(result.error);

                        this.ipcRouter.core.pluginDebugConsole({
                          pluginName,
                          tabID,
                          args: result.error,
                        });
                      }
                      resolve(result.result);
                    } catch (error) {
                      let messageSended = false;
                      webview.addEventListener("dom-ready", async (event) => {
                        if (!messageSended) {
                          let result =
                            await tabChannel.rendererPluginInvokePreload(
                              messageObject
                            );
                          if (result.error) {
                            console.log(result.error);
                            this.ipcRouter.core.pluginDebugConsole({
                              pluginName,
                              tabID,
                              args: result.error,
                            });
                          }
                          resolve(result.result);
                          messageSended = true;
                        }
                      });
                    }
                  } else {
                    console.error("no tab found with id: " + this.viewID);
                  }
                });
              };
            },
          });
        },
      });
    } else if (this.channelPrefix == "plugin") {
      return new Proxy(this, {
        get: (target, propKey) => {
          return (...args) => {
            return new Promise(async (resolve, reject) => {
              const messageObject = {
                pluginName,
                methodName: propKey,
                args,
              };
              resolve(
                await this.ipcRouter.core.pluginInvokeInstance({
                  viewID: tabID,
                  ...messageObject,
                })
              );
            });
          };
        },
      });
    }
  }
}

module.exports = PluginCommunicator;
