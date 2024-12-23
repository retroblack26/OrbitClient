const { clipboard } = require("electron");
const possibleAttributesLogin = [
  "log",
  "logininput",
  "username",
  "user",
  "login",
  "user-name",
  "inputUserOrEmail"
];
const possibleAttributesPassword = ["password", "user-password"];

class Utils {
  static instance;
  constructor() {
    if (Utils.instance) {
      return Utils.instance;
    }

    Utils.instance = this;
  }

  validateSID(string) {
    let regex = /^[a-z0-9]{32}$/;
    return regex.test(string);
  }

  getClipboardString() {
    return clipboard.readText();
  }

  getSelectedText() {
    return window.getSelection().toString();
  }

  getDomain() {
    const hostnameArray = window.location.hostname.split(".");
    const numberOfSubdomains = hostnameArray.length - 2;
    return hostnameArray.length === 2
      ? window.location.hostname
      : hostnameArray.slice(numberOfSubdomains).join(".");
  }

  getQueryParameters() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    return Object.fromEntries(urlParams.entries());
  }

  bindPrototypeToPlugin(prototype, plugin = {}, ...args) {
    const boundApi = {};
    // Start with the current instance (this)
    let proto = Object.getPrototypeOf(prototype);

    // Traverse the prototype chain
    while (proto) {
      let allFunctions = Object.getOwnPropertyNames(proto).filter(
        (prop) =>
          typeof prototype[prop] === "function" &&
          !prop.startsWith("_") &&
          prop !== "constructor"
      );

      // Bind methods to `this` and add them to boundApi
      allFunctions.forEach((funcName) => {
        // Avoid overwriting methods from subclasses with those from the superclass
        if (!boundApi.hasOwnProperty(funcName)) {
          boundApi[funcName] = prototype[funcName].bind({
            ...prototype,
            plugin,
            ...args
          });
        }
      });

      // Move up the prototype chain
      proto = Object.getPrototypeOf(proto);
    }
    return boundApi;
  }

  isValidURL(string) {
    var pattern = new RegExp(
      "^((ft|htt)ps?:\\/\\/)" + // protocol (mandatory)
        "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // domain name and extension
        "((\\d{1,3}\\.){3}\\d{1,3}))" + // OR ip (v4) address
        "(\\:\\d+)?" + // port
        "(\\/[-a-z\\d%@_.~+&:]*)*" + // path
        "(\\?[;&a-z\\d%@_.,~+&:=-]*)?" + // query string
        "(\\#[-a-z\\d_]*)?$",
      "i"
    ); // fragment locator
    return pattern.test(string);
  }

  findParentWithClass(element, classA, classB) {
    let currentElement = element;

    while (currentElement !== null) {
      if (
        currentElement.classList.contains(classA) ||
        currentElement.classList.contains(classB)
      ) {
        return currentElement;
      }
      currentElement = currentElement.parentElement;
    }

    return null;
  }

  addFirstEventListener(element, eventType, listener) {
    // Add the event listener normally
    element.addEventListener(eventType, listener);

    // Use the "beforefirst" event to move the listener to the first position
    element.addEventListener("beforefirst", function (event) {
      event.stopImmediatePropagation(); // Stop other listeners from executing before this one
      element.removeEventListener(eventType, listener); // Remove the listener from its current position
      element.addEventListener(eventType, listener); // Add it again to move it to the first position
    });
  }

  findField(type, form) {
    // Liste d'attributs communs pour les champs de connexion
    var possibleAttributes = [];
    if (type === "login") {
      possibleAttributes = possibleAttributesLogin;
    } else if (type === "password") {
      possibleAttributes = possibleAttributesPassword;
    }

    // Rechercher tous les éléments input dans la form spécifique
    const inputs = form.querySelectorAll("input");

    let inputsToReturn = [];

    for (const input of inputs) {
      for (const attr of possibleAttributes) {
        if (
          (input.name.toLowerCase().includes(attr) ||
            input.id.toLowerCase().includes(attr) ||
            input.placeholder.toLowerCase() == attr) &&
          input.type !== "hidden"
        ) {
          if (type == "login") {
            if (input.type.toLowerCase() == "text") {
              if (!inputsToReturn.includes(input)) {
                inputsToReturn.push(input);
              }
            }
          } else if (type == "password") {
            if (input.type.toLowerCase() == "password") {
              if (!inputsToReturn.includes(input)) {
                inputsToReturn.push(input);
              }
            }
          } else {
            if (!inputsToReturn.includes(input)) {
              inputsToReturn.push(input);
            }
          }
        }
      }
    }
    return inputsToReturn;
  }

  findFieldNearOther(
    possibleAttributesType,
    elementType,
    inputElement,
    maxDepth = 4
  ) {
    let possibleAttributes = null;
    if (possibleAttributesType == "password") {
      possibleAttributes = possibleAttributesPassword;
    } else {
      possibleAttributes = possibleAttributesLogin;
    }
    function findInAttributes(element) {
      for (const attr of possibleAttributes) {
        const lowercaseValue = attr.toLowerCase();
        if (
          (element.name &&
            element.name.toLowerCase().includes(lowercaseValue)) ||
          (element.id && element.id.toLowerCase().includes(lowercaseValue)) ||
          (element.placeholder &&
            element.placeholder.toLowerCase().includes(lowercaseValue) &&
            element.type !== "hidden")
        ) {
          return element; // Found an element with specified attributes
        }
      }
      return null;
    }

    function searchInContainer(container, depth) {
      if (depth < 0 || !container) {
        return null; // Reached maximum depth or container not found
      }

      const foundElement = findInAttributes(container);
      if (
        foundElement &&
        foundElement !== inputElement &&
        foundElement.tagName === elementType.toUpperCase()
      ) {
        return foundElement;
      }

      // Search in child elements
      const childElements = container.querySelectorAll("*");
      for (const child of childElements) {
        const foundElement = findInAttributes(child);
        if (
          foundElement &&
          foundElement !== inputElement &&
          foundElement.tagName === elementType.toUpperCase()
        ) {
          return foundElement;
        }
      }

      // Move upwards to the parent element
      return searchInContainer(container.parentElement, depth - 1);
    }

    const nearestElement = searchInContainer(
      inputElement.parentElement,
      maxDepth
    );
    return nearestElement;
  }

  findFormContainer(inputElement) {
    let currentElement = inputElement;

    // Traverse the DOM hierarchy upwards
    while (currentElement !== null) {
      // Check if the current element is a form element (form, fieldset, etc.)
      if (currentElement.tagName === "FORM") {
        return currentElement; // Found a form, return it
      }

      // Move to the parent element
      currentElement = currentElement.parentElement;
    }

    // No form container found
    return null;
  }
}

module.exports = new Utils();
