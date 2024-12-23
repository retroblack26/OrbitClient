const { ipcRenderer, ipcMain, webContents } = require("electron");
const SecurityManager = require("./SecurityManager");
const ObjectSerializer = require("./Utils/ObjectSerializer");
const crypto = require("crypto");
const CryptoUtils = require("./Utils/Crypto");

/**
 * Class representing an IPC Router for inter-process communication in Electron.
 * Handles the communication between main, renderer, and preload processes with optional encryption.
 */
class IPCRouter {
  /**
   * Creates an instance of IPCRouter.
   * @param {string} processType - The type of process ('main', 'renderer', 'preload').
   * @param {Object} IPCFunctions - An object containing IPC methods available for invocation.
   * @param {Object|number} args - Additional arguments or view ID.
   * @param {Object} [main=null] - Reference to the main process (if applicable).
   * @param {boolean} [useEncryption=false] - Flag to enable or disable encryption.
   */
  constructor(
    processType,
    IPCFunctions,
    args,
    main = null,
    useEncryption = false
  ) {
    this.processType = processType;
    this.IPCFunctions = IPCFunctions;
    this.useEncryption = useEncryption;

    // Serializer for object serialization and deserialization.
    this.objectSerializer = new ObjectSerializer(this, {
      jsonDoubleSerialize: false
    });

    if (typeof args === "object" && args !== null) {
      this.viewID = args.viewID;
      this.coreProcessName = args.coreProcessName;
      this.parent = args.parent;
    } else {
      this.viewID = args;
    }

    this.main = main;
    this.processName = `${processType}-${crypto
      .randomBytes(4)
      .toString("hex")}`;
    this.securityManager = new SecurityManager();
    this.coreProcessMap = new Map();

    this.cachedFunctions = new Map();

    return new Promise(async (resolve) => {
      if (this.useEncryption) {
        await this.securityManager.registerProcess(this.processName);
      }

      if (processType === "main") {
        await this.setupMainProcess();
      } else {
        await this.setupRendererProcess();
      }

      resolve(
        new Proxy(this, {
          get: (target, prop, receiver) => {
            if (prop == "main" || prop == "core") {
              return new Proxy(
                {},
                {
                  get: (_, methodName) => {
                    return (...args) =>
                      target.invoke(prop, methodName, ...args);
                  }
                }
              );
            }

            if (prop == "getTabCommunication") {
              return (...args) => {
                return target.getTabCommunication(...args);
              };
            }

            return Reflect.get(target, prop, receiver);
          }
        })
      );
    });
  }

  /**
   * Caches a function for later invocation.
   * @param {Function} func - The function to cache.
   * @returns {Object} An object containing the function ID, process name, and argument keys.
   */
  cacheFunction(func) {
    /**
     * Extracts the argument names from a function.
     * @param {Function} fn - The function to analyze.
     * @returns {Array<string>} An array of argument names.
     */
    const extractFunctionArgs = function (fn) {
      const fnString = fn.toString().trim();

      // Determine if the function is an arrow function.
      const isArrowFunction =
        fnString.startsWith("(") || /^[a-zA-Z0-9_$]+\s*=>/.test(fnString);

      if (isArrowFunction) {
        // Handle arrow functions.
        const hasParens = fnString.startsWith("(");

        if (hasParens) {
          // Arrow function with parentheses.
          const openParenIndex = fnString.indexOf("(");
          const closeParenIndex = fnString.indexOf(")");
          const argString = fnString
            .slice(openParenIndex + 1, closeParenIndex)
            .trim();

          if (argString === "") {
            return [];
          }

          const args = argString.split(",").map((arg) => arg.trim());
          const argKeys = args.map((arg) => arg.split("=")[0].trim());

          return argKeys;
        } else {
          // Arrow function without parentheses.
          const arrowIndex = fnString.indexOf("=>");
          const argString = fnString.slice(0, arrowIndex).trim();

          if (argString === "") {
            return [];
          }

          const args = argString.split(",").map((arg) => arg.trim());
          const argKeys = args.map((arg) => arg.split("=")[0].trim());

          return argKeys;
        }
      } else {
        // Handle regular functions or class methods.
        const openParenIndex = fnString.indexOf("(");
        const closeParenIndex = fnString.indexOf(")");
        const argString = fnString
          .slice(openParenIndex + 1, closeParenIndex)
          .trim();

        if (argString === "") {
          return [];
        }

        const args = argString.split(",").map((arg) => arg.trim());
        const argKeys = args.map((arg) => arg.split("=")[0].trim());

        return argKeys;
      }
    };

    const id = CryptoUtils.randomUUID().toString();
    this.cachedFunctions.set(id, func);

    return {
      id: id,
      processName: this.processName,
      args: extractFunctionArgs(func)
    };
  }

  /**
   * Executes a cached function with the provided arguments.
   * @param {string} funcId - The ID of the cached function.
   * @param {Object} args - The arguments to pass to the function.
   * @returns {Promise<any>} The result of the function execution.
   */
  async executeCachedFunction(funcId, args) {
    let cachedFunc = this.cachedFunctions.get(funcId);
    return await cachedFunc(...Object.values(args));
  }

  /**
   * Executes a cached function on a distant process.
   * @param {string} processName - The name of the distant process.
   * @param {string} funcId - The ID of the cached function.
   * @param {Object} args - The arguments to pass to the function.
   * @returns {Promise<any>} The result of the function execution.
   */
  async executeDistantCachedFunction(processName, funcId, args) {
    if (processName == this.processName) {
      return await this.executeCachedFunction(funcId, args);
    }

    return await this.invoke(processName, "executeDistantCachedFunction", {
      funcId,
      ...args
    });
  }

  /**
   * Retrieves communication interface with a specific tab.
   * @param {number} tabId - The ID of the tab.
   * @returns {Promise<Proxy>} A proxy to communicate with the tab.
   */
  getTabCommunication(tabId) {
    return new Promise(async (resolve) => {
      this.coreProcessMap = await ipcRenderer.invoke("request-core-map");
      if (
        !this.coreProcessMap.has(this.processName) ||
        !this.coreProcessMap.get(this.processName).has(tabId)
      ) {
        throw new Error(`Tab with ID ${tabId} is not registered.`);
      }
      let parsedData = this.objectSerializer.deserialize(
        this.coreProcessMap.get(this.processName).get(tabId)
      );
      const processName = parsedData.processName;

      // Check if a cached proxy exists for the processName
      if (this.proxyCache && this.proxyCache.has(processName)) {
        resolve(this.proxyCache.get(processName));
      } else {
        await this.waitPreloadProcessIsReady(tabId);

        const proxy = new Proxy(
          {},
          {
            get: (target, methodName) => {
              if (methodName !== "then") {
                return async (...args) => {
                  let result = await this.invoke(
                    processName,
                    methodName,
                    ...args
                  );
                  return result;
                };
              }
            }
          }
        );

        // Cache the proxy for future use
        if (!this.proxyCache) {
          this.proxyCache = new Map();
        }
        this.proxyCache.set(processName, proxy);

        resolve(proxy);
      }
    });
  }

  /**
   * Sets up the main process for IPC communication.
   * @private
   */
  async setupMainProcess() {
    if (this.useEncryption) {
      const sharedKey = crypto.randomBytes(32);
      this.securityManager.sharedProcess[this.processName].sharedKey =
        sharedKey;
    }

    // Handle renderer process load event.
    ipcMain.on("renderer-ipc-loaded", (event, coreProcess, tabID) => {
      if (!coreProcess || !tabID) return;
      let parsedData = this.objectSerializer.deserialize(
        this.coreProcessMap.get(coreProcess).get(parseInt(tabID))
      );
      parsedData.isReady = true;
      this.coreProcessMap
        .get(coreProcess)
        .set(parseInt(tabID), this.objectSerializer.serialize(parsedData));
    });

    // Handle core process ready event.
    ipcMain.on("core-ready", (event, distantCoreProcessN) => {
      this.coreProcessMap.get(distantCoreProcessN).set("isReady", true);
    });

    // Provide core process map on request.
    ipcMain.handle("request-core-map", (event) => {
      return this.coreProcessMap;
    });

    /**
     * Handle public key request from renderer or preload processes.
     * Registers the process and provides necessary encryption keys.
     */
    ipcMain.handle(
      "request-public-key",
      async (event, { processName, viewID, coreProcessName }) => {
        if (processName.startsWith("preload-")) {
          if (!viewID) {
            throw new Error("You must specify a viewID for preload process");
          }
          if (!this.coreProcessMap.has(coreProcessName)) {
            this.coreProcessMap.set(coreProcessName, new Map());
          }
          this.coreProcessMap.get(coreProcessName).set(
            viewID,
            this.objectSerializer.serialize({
              processName: processName,
              webContentsId: event.sender.id
            })
          );
        } else if (processName.startsWith("core-")) {
          this.coreProcessMap.set(processName, new Map());
          this.coreProcessMap
            .get(processName)
            .set("webContentsId", event.sender.id);
          this.coreProcessMap.get(processName).set("isReady", false);
        }

        if (this.useEncryption) {
          const { publicKey } = await this.securityManager.registerProcess(
            processName
          );
          if (processName.startsWith("core-")) {
            let index = this.main.windows.indexOf(this.main.currentWindow);
            this.main.windows[index].ipcProcessName = processName;
          }
          return { publicKey, processName, webContentsId: event.sender.id };
        } else {
          return { processName, webContentsId: event.sender.id };
        }
      }
    );

    /**
     * Handles shared key transmission from renderer or preload processes.
     */
    ipcMain.handle(
      "send-shared-key",
      (event, { encryptedSharedKey, processName }) => {
        if (this.useEncryption) {
          const { privateKey } =
            this.securityManager.sharedProcess[processName];
          const sharedKey = crypto.privateDecrypt(
            privateKey,
            Buffer.from(encryptedSharedKey, "hex")
          );
          this.securityManager.sharedProcess[processName].sharedKey = sharedKey;
        }
      }
    );

    /**
     * Handles method invocation requests from renderer or preload processes.
     * Routes the request to the appropriate target.
     */
    ipcMain.on(
      "invoke-method",
      async (event, { data, target, processName, parentProcessName }) => {
        const parsedData = this.useEncryption
          ? this.objectSerializer.deserialize(
              this.securityManager.decrypt(data, processName),
              "args"
            )
          : this.objectSerializer.deserialize(data, "args");
        let {
          methodName,
          args,
          messageId,
          processName: fromProccess,
          viewID: fromViewID
        } = parsedData;

        if (target == "main") {
          args = this.objectSerializer.deserialize(args);
          if (methodName == "executeDistantCachedFunction") {
            // Execute a cached function.
            try {
              const result = await this.executeCachedFunction(
                args[0].funcId,
                args[0].args
              );
              const response = this.useEncryption
                ? this.securityManager.encrypt(
                    this.objectSerializer.serialize({ result: result }),
                    processName
                  )
                : this.objectSerializer.serialize({ result: result });
              event.sender.send(`response-${messageId}`, {
                response,
                processName
              });
            } catch (error) {
              const response = this.useEncryption
                ? this.securityManager.encrypt(
                    this.objectSerializer.serialize({ error: error.message }),
                    processName
                  )
                : this.objectSerializer.serialize({ error: error.message });
              event.sender.send(`response-${messageId}`, {
                response,
                processName
              });
            }
          } else {
            // Invoke a method from IPCFunctions.
            if (typeof this.IPCFunctions[methodName] === "function") {
              try {
                const result =
                  typeof args === "object" && Object.keys(args).length > 0
                    ? await this.IPCFunctions[methodName](
                        ...Object.values(args)
                      )
                    : await this.IPCFunctions[methodName]();
                const response = this.useEncryption
                  ? this.securityManager.encrypt(
                      this.objectSerializer.serialize({ result: result }),
                      processName
                    )
                  : this.objectSerializer.serialize({ result: result });
                event.sender.send(`response-${messageId}`, {
                  response,
                  processName
                });
              } catch (error) {
                const response = this.useEncryption
                  ? this.securityManager.encrypt(
                      this.objectSerializer.serialize({ error: error.message }),
                      processName
                    )
                  : this.objectSerializer.serialize({ error: error.message });
                event.sender.send(`response-${messageId}`, {
                  response,
                  processName
                });
              }
            } else {
              const errorMessage = `Method '${methodName}' not found in main process.`;
              const response = this.useEncryption
                ? this.securityManager.encrypt(
                    this.objectSerializer.serialize({ error: errorMessage }),
                    processName
                  )
                : this.objectSerializer.serialize({ error: errorMessage });
              event.sender.send(`response-${messageId}`, {
                response,
                processName
              });
            }
          }
        } else if (target.startsWith("core")) {
          // Forward the request to the core process.
          const coreWebContentsId = this.coreProcessMap
            .get(parentProcessName)
            .get("webContentsId");
          if (coreWebContentsId) {
            const dataForCore = this.useEncryption
              ? this.securityManager.encrypt(
                  this.objectSerializer.serialize({ ...parsedData }),
                  parentProcessName
                )
              : this.objectSerializer.serialize({ ...parsedData });
            const coreWebContents = webContents.fromId(coreWebContentsId);
            coreWebContents.send("invoke-method", {
              data: dataForCore,
              target: "core",
              processName: parentProcessName
            });
            ipcMain.once(`response-${messageId}`, (e, { response }) => {
              const parsedResponse = this.useEncryption
                ? this.securityManager.decrypt(response, parentProcessName)
                : response;
              const responseForCaller = this.useEncryption
                ? this.securityManager.encrypt(parsedResponse, fromProccess)
                : parsedResponse;
              event.sender.send(`response-${messageId}`, {
                response: responseForCaller,
                processName
              });
            });
          }
        } else {
          // Forward the request to the target preload process.
          const tabID = this.getKeyFromProcessName(
            this.coreProcessMap.get(processName),
            target
          );
          const parsedProcessInfo = this.objectSerializer.deserialize(
            this.coreProcessMap.get(processName).get(tabID)
          );
          const preloadWebContents = webContents.fromId(
            parsedProcessInfo.webContentsId
          );
          if (!preloadWebContents) {
            let error = { error: "Tab does not exist" };
            const responseForCaller = this.useEncryption
              ? this.securityManager.encrypt(
                  this.objectSerializer.serialize(error),
                  fromProccess
                )
              : this.objectSerializer.serialize(error);
            event.sender.send(`response-${messageId}`, {
              response: responseForCaller,
              processName
            });
            return;
          }
          const dataForPreload = this.useEncryption
            ? this.securityManager.encrypt(
                this.objectSerializer.serialize({ ...parsedData }),
                parsedProcessInfo.processName
              )
            : this.objectSerializer.serialize({ ...parsedData });
          preloadWebContents.send("invoke-method", {
            data: dataForPreload,
            target: target,
            processName: parsedProcessInfo.processName
          });

          ipcMain.once(`response-${messageId}`, (e, { response }) => {
            const parsedResponse = this.useEncryption
              ? this.securityManager.decrypt(
                  response,
                  parsedProcessInfo.processName
                )
              : response;
            const responseForCaller = this.useEncryption
              ? this.securityManager.encrypt(parsedResponse, fromProccess)
              : parsedResponse;
            event.sender.send(`response-${messageId}`, {
              response: responseForCaller,
              processName
            });
          });
        }
      }
    );
  }

  /**
   * Removes a core process from the process map and security manager.
   * @param {string} processName - The name of the core process to remove.
   */
  async removeCoreProcess(processName) {
    if (this.useEncryption) {
      const coreProcessName = Object.keys(
        this.securityManager.sharedProcess
      ).find((name) => name.startsWith(processName) || processName == name);
      if (coreProcessName) {
        this.securityManager.removeProcess(coreProcessName);
      }
    }
    this.coreProcessMap.delete(processName);
  }

  /**
   * Removes a preload process from the process map and security manager.
   * @param {number} tabID - The ID of the tab.
   * @param {string} coreProcessName - The name of the core process.
   */
  async removePreloadProcess(tabID, coreProcessName) {
    tabID = parseInt(tabID);

    let process = this.objectSerializer.deserialize(
      this.coreProcessMap.get(coreProcessName).get(tabID)
    );

    if (this.useEncryption) {
      this.securityManager.removeProcess(process.processName);
    }

    this.coreProcessMap.get(coreProcessName).delete(tabID);
  }

  /**
   * Removes all processes from the process map and security manager.
   */
  async removeAllProcess() {
    if (this.useEncryption) {
      this.securityManager.removeAllProcess();
    }
    this.coreProcessMap = new Map();
  }

  /**
   * Sets up the renderer or preload process for IPC communication.
   * @private
   */
  async setupRendererProcess() {
    let viewID = this.processName.startsWith("preload-") ? this.viewID : null;
    if (this.useEncryption) {
      const { publicKey, webContentsId } = await ipcRenderer.invoke(
        "request-public-key",
        {
          processName: this.processName,
          viewID,
          coreProcessName: this.coreProcessName
        }
      );
      const sharedKey = crypto.randomBytes(32);
      const encryptedSharedKey = crypto.publicEncrypt(publicKey, sharedKey);
      await ipcRenderer.invoke("send-shared-key", {
        encryptedSharedKey: encryptedSharedKey.toString("hex"),
        processName: this.processName
      });
      this.securityManager.sharedProcess[this.processName].sharedKey =
        sharedKey;
      this.webContentsId = webContentsId;
    } else {
      const { webContentsId } = await ipcRenderer.invoke("request-public-key", {
        processName: this.processName,
        viewID,
        coreProcessName: this.coreProcessName
      });
      this.webContentsId = webContentsId;
    }

    window.addEventListener("beforeunload", () => {
      if (this.useEncryption) {
        this.securityManager.removeAllProcess();
      }
    });

    // Handle method invocation requests.
    ipcRenderer.on(
      "invoke-method",
      async (event, { data, target, processName }) => {
        const parsedData = this.useEncryption
          ? this.objectSerializer.deserialize(
              this.securityManager.decrypt(data, processName),
              "args"
            )
          : this.objectSerializer.deserialize(data, "args");
        let {
          methodName,
          args,
          messageId,
          processName: fromProccess,
          viewID
        } = parsedData;
        if (
          target == this.processName ||
          (target == this.processType && processName == this.processName)
        ) {
          if (args) {
            args = this.objectSerializer.deserialize(args);
          }

          if (methodName == "executeDistantCachedFunction") {
            // Execute a cached function.
            try {
              const result = await this.executeCachedFunction(
                args[0].funcId,
                args[0].args
              );
              const response = this.useEncryption
                ? this.securityManager.encrypt(
                    this.objectSerializer.serialize({ result: result }),
                    processName
                  )
                : this.objectSerializer.serialize({ result: result });
              event.sender.send(`response-${messageId}`, {
                response,
                processName
              });
            } catch (error) {
              console.error(error);
              const response = this.useEncryption
                ? this.securityManager.encrypt(
                    this.objectSerializer.serialize({ error: error.message }),
                    processName
                  )
                : this.objectSerializer.serialize({ error: error.message });
              event.sender.send(`response-${messageId}`, {
                response,
                processName
              });
            }
          } else {
            // Invoke a method from IPCFunctions.
            if (typeof this.IPCFunctions[methodName] === "function") {
              try {
                const result =
                  typeof args === "object" && args.length > 0
                    ? await this.IPCFunctions[methodName](...args)
                    : await this.IPCFunctions[methodName]();

                if (result) {
                  const serializedResult = this.objectSerializer.serialize({
                    result
                  });
                  const response = this.useEncryption
                    ? this.securityManager.encrypt(
                        serializedResult,
                        this.processName
                      )
                    : serializedResult;
                  ipcRenderer.send(`response-${messageId}`, {
                    response,
                    processName
                  });
                }
              } catch (error) {
                const serializedError = this.objectSerializer.serialize({
                  error: error.message
                });
                const response = this.useEncryption
                  ? this.securityManager.encrypt(
                      serializedError,
                      this.processName
                    )
                  : serializedError;
                ipcRenderer.send(`response-${messageId}`, {
                  response,
                  processName
                });
                console.error(error);
              }
            } else {
              const errorMessage = `Method '${methodName}' not found in ${
                target === this.processName ? "preload process" : "process"
              } '${this.processName}'.`;
              const response = this.useEncryption
                ? this.securityManager.encrypt(
                    this.objectSerializer.serialize({ error: errorMessage }),
                    this.processName
                  )
                : this.objectSerializer.serialize({ error: errorMessage });
              ipcRenderer.send(`response-${messageId}`, {
                response,
                processName
              });
            }
          }
        }
      }
    );

    if (this.parent) {
      if (this.parent.ready) {
        this.parent.ready.then(() => {
          ipcRenderer.send(
            "renderer-ipc-loaded",
            this.coreProcessName,
            !this.parent.areWeInADataURL()
              ? sessionStorage.getItem("viewID")
              : this.parent.viewID
          );
        });
      }
    }
  }

  /**
   * Invokes a method on the specified target process.
   * @param {string} target - The target process ('main', 'core', or process name).
   * @param {string} methodName - The name of the method to invoke.
   * @param {...any} args - Arguments to pass to the method.
   * @returns {Promise<any>} The result of the method invocation.
   */
  async invoke(target, methodName, ...args) {
    const messageId = Math.random().toString(36).substr(2, 9);
    const message = {
      methodName,
      args,
      processName: this.processName,
      viewID: this.viewID,
      messageId
    };
    const data = this.useEncryption
      ? this.securityManager.encrypt(
          this.objectSerializer.serialize(message),
          this.processName
        )
      : this.objectSerializer.serialize(message);

    if (this.processType === "main") {
      const coreProcessName = this.main.currentWindow.ipcProcessName;
      if (target === "main") {
        const targetFunction = this.IPCFunctions[methodName];
        if (typeof targetFunction === "function") {
          try {
            const result =
              typeof args === "object" && Object.keys(args).length > 0
                ? await targetFunction(...Object.values(args))
                : await targetFunction();
            return result;
          } catch (error) {
            throw new Error(error.message);
          }
        }
      } else if (target === "core") {
        if (coreProcessName) {
          const dataForCore = this.useEncryption
            ? this.securityManager.encrypt(
                this.objectSerializer.serialize(message),
                coreProcessName
              )
            : this.objectSerializer.serialize(message);
          this.main.currentWindow.webContents.send("invoke-method", {
            data: dataForCore,
            target: "core",
            processName: coreProcessName
          });
          return new Promise((resolve, reject) => {
            ipcMain.once(`response-${messageId}`, (event, data) => {
              let { response, processName: processNameRes } = data;
              let parsedResult = this.useEncryption
                ? this.objectSerializer.deserialize(
                    this.securityManager.decrypt(response, processNameRes)
                  )
                : this.objectSerializer.deserialize(response);
              if (parsedResult.error) {
                reject(new Error(parsedResult.error));
              } else {
                resolve(parsedResult.result);
              }
            });
          });
        }
      } else {
        let parsedProcessInfo, tabID;
        if (target.startsWith("core-")) {
          parsedProcessInfo = {
            webContentsId: this.coreProcessMap.get(target).get("webContentsId")
          };
        } else {
          tabID = this.getKeyFromProcessName(
            this.coreProcessMap.get(coreProcessName),
            target
          );
          parsedProcessInfo = this.objectSerializer.deserialize(
            this.coreProcessMap.get(coreProcessName).get(tabID)
          );
        }

        const preloadWebContents = webContents.fromId(
          parsedProcessInfo.webContentsId
        );

        const dataForPreload = this.useEncryption
          ? this.securityManager.encrypt(
              this.objectSerializer.serialize(message),
              target
            )
          : this.objectSerializer.serialize(message);
        preloadWebContents.send("invoke-method", {
          data: dataForPreload,
          target: target,
          processName: coreProcessName,
          tabID
        });
        return new Promise((resolve, reject) => {
          ipcMain.once(`response-${messageId}`, (event, data) => {
            let { response, processName: processNameRes } = data;
            let parsedResult = this.useEncryption
              ? this.objectSerializer.deserialize(
                  this.securityManager.decrypt(response, processNameRes)
                )
              : this.objectSerializer.deserialize(response);
            if (parsedResult.error) {
              reject(new Error(parsedResult.error));
            } else {
              resolve(parsedResult.result);
            }
          });
        });
      }
    } else {
      ipcRenderer.send("invoke-method", {
        data,
        target,
        processName: this.processName,
        parentProcessName: this.coreProcessName
          ? this.coreProcessName
          : this.processName
      });
      return new Promise((resolve, reject) => {
        ipcRenderer.once(`response-${messageId}`, (event, data) => {
          let { response, processName: processNameRes } = data;
          let parsedResult = this.useEncryption
            ? this.objectSerializer.deserialize(
                this.securityManager.decrypt(response, processNameRes)
              )
            : this.objectSerializer.deserialize(response);
          if (parsedResult.error) {
            reject(new Error(parsedResult.error));
          } else {
            resolve(parsedResult.result);
          }
        });
      });
    }
  }

  /**
   * Waits until a process is registered in the core process map.
   * @param {number} tabID - The ID of the tab.
   * @returns {Promise<void>}
   */
  async waitForProcessRegister(tabID) {
    return new Promise((resolve) => {
      const checkProcessRegistered = async () => {
        this.coreProcessMap = await ipcRenderer.invoke("request-core-map");
        if (
          this.coreProcessMap.has(this.processName) &&
          this.coreProcessMap.get(this.processName).has(parseInt(tabID))
        ) {
          resolve();
        } else {
          setTimeout(checkProcessRegistered, 100);
        }
      };
      checkProcessRegistered();
    });
  }

  /**
   * Waits until a web contents is registered.
   * @param {number} webContentsId - The ID of the web contents.
   * @returns {Promise<string>}
   */
  waitForWebContentsRegister(webContentsId) {
    if (this.processType !== "main") {
      console.error("This function can only be used in main process.");
      return;
    }
    return new Promise((resolve) => {
      const checkProcessLoaded = async () => {
        for (const [key, value] of this.coreProcessMap.entries()) {
          if (value.get("webContentsId") == webContentsId) {
            resolve(key);
          }
        }
        setTimeout(checkProcessLoaded, 100);
      };
      checkProcessLoaded();
    });
  }

  /**
   * Waits until a preload process is ready.
   * @param {number} tabID - The ID of the tab.
   * @returns {Promise<void>}
   */
  waitPreloadProcessIsReady(tabID) {
    return new Promise((resolve) => {
      const checkProcessLoaded = async () => {
        this.coreProcessMap = await ipcRenderer.invoke("request-core-map");
        let parsedData = this.objectSerializer.deserialize(
          this.coreProcessMap.get(this.processName).get(parseInt(tabID))
        );
        if (parsedData.isReady == true) {
          resolve();
        } else {
          setTimeout(checkProcessLoaded, 100);
        }
      };
      checkProcessLoaded();
    });
  }

  /**
   * Waits until a core process is ready.
   * @param {string} processName - The name of the core process.
   * @returns {Promise<void>}
   */
  waitCoreProcessIsReady(processName) {
    if (this.processType !== "main") {
      throw new Error("This function can only be called from the main process");
    }

    return new Promise((resolve) => {
      const checkProcessLoaded = async () => {
        if (this.coreProcessMap.get(processName).get("isReady") === true) {
          resolve();
        } else {
          setTimeout(checkProcessLoaded, 100);
        }
      };
      checkProcessLoaded();
    });
  }

  /**
   * Retrieves the key from the process name in a map.
   * @param {Map} map - The map containing process data.
   * @param {string} value - The process name to search for.
   * @returns {string|null} The key corresponding to the process name.
   */
  getKeyFromProcessName(map, value) {
    if (!map || !value) {
      throw new Error("Invalid arguments. Please provide a map and value");
    }

    let keyResult = "";

    for (const item of map) {
      const parsedValue = this.objectSerializer.deserialize(item[1]);
      if (parsedValue.processName == value) {
        keyResult = item[0];
        break;
      }
    }

    if (keyResult.length <= 0) {
      return null;
    }
    return keyResult;
  }
}

module.exports = IPCRouter;
