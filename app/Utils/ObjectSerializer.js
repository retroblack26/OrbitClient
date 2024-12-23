const CryptoUtils = require("./Crypto");
class ObjectSerializer {
  constructor(ipcRouter, options) {
    this.options = {
      jsonDoubleSerialize: false,
      ...options
    };
    this.ipcRouter = ipcRouter;
    this.typeKey = "_t_";
    this.valueKey = "_v_";
    this.cacheFunctions = new Map();
  }

  serializeValue(value) {
    const isArrowFunctionOrClassMethod = (fn) => {
      const fnString = fn.toString().trim();
      return (
        fnString.startsWith("(") ||
        fnString.startsWith("async ") ||
        /^[a-zA-Z0-9_$]+\s*=>/.test(fnString) ||
        /^[a-zA-Z0-9_$]+\(.*\)\s*{/.test(fnString)
      );
    };

    if (
      value &&
      typeof value === "object" &&
      value[this.typeKey] &&
      value[this.valueKey]
    ) {
      // Value is already serialized
      return value;
    }

    if (
      typeof value === "object" ||
      (typeof value === "function" && value !== null)
    ) {
      if (Array.isArray(value)) {
        return {
          [this.typeKey]: "Array",
          [this.valueKey]: value.map((item) => this.serializeValue(item))
        };
      } else if (value instanceof Map) {
        return {
          [this.typeKey]: "Map",
          [this.valueKey]: Array.from(value.entries()).map(([key, val]) => [
            this.serializeValue(key),
            this.serializeValue(val)
          ])
        };
      } else if (value instanceof Set) {
        return {
          [this.typeKey]: "Set",
          [this.valueKey]: Array.from(value).map((val) =>
            this.serializeValue(val)
          )
        };
      } else if (value instanceof Date) {
        return {
          [this.typeKey]: "Date",
          [this.valueKey]: value.toISOString()
        };
      } else if (value instanceof RegExp) {
        return {
          [this.typeKey]: "RegExp",
          [this.valueKey]: value.toString()
        };
      } else if (value instanceof ArrayBuffer) {
        return {
          [this.typeKey]: "ArrayBuffer",
          [this.valueKey]: Array.from(new Uint8Array(value))
        };
      } else if (ArrayBuffer.isView(value)) {
        return {
          [this.typeKey]: value.constructor.name,
          [this.valueKey]: Array.from(value)
        };
      } else if (typeof value === "bigint") {
        return {
          [this.typeKey]: "BigInt",
          [this.valueKey]: value.toString()
        };
      } else if (typeof value === "function") {
        if (isArrowFunctionOrClassMethod(value)) {
          return {
            [this.typeKey]: "ArrowFunction",
            [this.valueKey]: this.ipcRouter.cacheFunction(value)
          };
        }
        return {
          [this.typeKey]: "Function",
          [this.valueKey]: value.toString()
        };
      } else if (typeof value === "Error") {
        return {
          [this.typeKey]: "Error",
          [this.valueKey]: value.message
        };
      } else {
        const obj = {};
        for (const key in value) {
          try {
            if (value.hasOwnProperty(key)) {
              obj[key] = this.serializeValue(value[key]);
            }
          } catch (e) {
            obj[key] = this.serializeValue(value[key]);
          }
        }
        return {
          [this.typeKey]: "Object",
          [this.valueKey]: obj
        };
      }
    }
    return value;
  }

  serialize(obj) {
    let result = this.options.jsonDoubleSerialize
      ? JSON.stringify(this.serializeValue(obj))
      : this.serializeValue(obj);
    return result;
  }

  deserializeValue(value, excludedKey = "") {
    if (typeof value === "object" && value !== null) {
      if (value[this.typeKey] === "Array") {
        return value[this.valueKey].map((item) =>
          this.deserializeValue(item, excludedKey)
        );
      } else if (value[this.typeKey] === "Map") {
        const map = new Map();
        value[this.valueKey].forEach(([key, val]) => {
          map.set(
            this.deserializeValue(key, excludedKey),
            this.deserializeValue(val, excludedKey)
          );
        });
        return map;
      } else if (value[this.typeKey] === "Set") {
        const set = new Set();
        value[this.valueKey].forEach((val) => {
          set.add(this.deserializeValue(val, excludedKey));
        });
        return set;
      } else if (value[this.typeKey] === "Date") {
        return new Date(value[this.valueKey]);
      } else if (value[this.typeKey] === "RegExp") {
        const match = value[this.valueKey].match(/\/(.*)\/(.*)?/);
        return new RegExp(match[1], match[2] || "");
      } else if (value[this.typeKey] === "ArrayBuffer") {
        return new Uint8Array(value[this.valueKey]).buffer;
      } else if (value[this.typeKey] === "BigInt") {
        return BigInt(value[this.valueKey]);
      } else if (value[this.typeKey] === "Error") {
        return new Error(value[this.valueKey]);
      } else if (value[this.typeKey] === "Function") {
        return new Function("return " + value[this.valueKey])();
      } else if (value[this.typeKey] === "ArrowFunction") {
        const createCloneFunction = () => {
          let argKeys = value[this.valueKey].args;
          const functionBody = `
                        const context = this;
                        return async function(${argKeys.join(", ")}) {
                            const argsList = {args: { ${argKeys
                              .map((arg) => `${arg}: ${arg}`)
                              .join(", ")} }};
                            return await context.ipcRouter.executeDistantCachedFunction('${
                              value[this.valueKey].processName
                            }', '${value[this.valueKey].id}', argsList);
                        };
                    `;

          return new Function(functionBody).bind(this)();
        };
        return createCloneFunction();
      } else if (value[this.typeKey] === "Object") {
        const obj = {};
        for (const key in value[this.valueKey]) {
          if (value[this.valueKey].hasOwnProperty(key)) {
            if (key == excludedKey) {
              // Include the 'args' key without deserialization
              obj[key] = value[this.valueKey][key];
            } else {
              obj[key] = this.deserializeValue(
                value[this.valueKey][key],
                excludedKey
              );
            }
          }
        }
        return obj;
      } else {
        const obj = {};
        for (const key in value) {
          if (value.hasOwnProperty(key)) {
            if (key == excludedKey) {
              obj[key] = value[key];
            } else {
              obj[key] = this.deserializeValue(value[key], excludedKey);
            }
          }
        }
        return obj;
      }
    }
    return value;
  }

  deserialize(str, excludedKey) {
    try {
      if (typeof str == "object") {
        return this.deserializeValue(str, excludedKey);
      }
      return this.deserializeValue(
        this.options.jsonDoubleSerialize ? JSON.parse(str) : str,
        excludedKey
      );
    } catch (e) {
      console.log(e);
      return this.deserializeValue(str, excludedKey);
    }
  }
}

module.exports = ObjectSerializer;
