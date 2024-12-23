const domPurify = require("dompurify");
const DOMPurify = domPurify(window);
const Utils = require("../../Utils/Utils");

class HTMLElementAbstractionLayer {
  constructor(element, bindToPlugin = true) {
    if (!element) {
      throw new Error("Element is not defined");
    }

    this.element = element;

    if (bindToPlugin == true) {
      return Utils.bindPrototypeToPlugin(this, {});
    }
  }

  /**
   * Adds an event listener to the element.
   * @param {string} eventType - Type of the event to listen for.
   * @param {Function} callback - Callback function to execute when the event occurs.
   */
  addEventListener(eventType, callback) {
    this.element.addEventListener(eventType, (event) => {
      try {
        callback();
      } catch (e) {
        console.error(e);
      }
    });
  }

  /**
   * Sets the innerHTML of the element, sanitizing the input to prevent XSS.
   * @param {string} html - The HTML string to be set as the innerHTML.
   */
  setInnerHTML(html) {
    // Use a sanitization library or implement custom sanitization logic here.
    // For demonstration purposes, we'll just assign the HTML directly,
    // but in a real-world scenario, you MUST sanitize `html` to prevent XSS attacks.
    this.element.innerHTML = DOMPurify.sanitize(html);
  }

  /**
   * Appends a child element from a template string.
   * @param {string} templateString - The HTML string of the element to append.
   */
  appendChildFromTemplate(templateString) {
    const template = document.createElement("template");
    // Sanitize `templateString` before using it.
    template.innerHTML = templateString.trim(); // Assuming `templateString` is sanitized
    this.element.appendChild(template.content.firstChild);
  }

  /**
   * Updates the style of the element.
   * @param {Object} styles - An object containing style properties and values.
   */
  updateStyle(styles) {
    for (const property in styles) {
      if (styles.hasOwnProperty(property)) {
        // Directly assign style properties to the element.
        this.element.style[property] = styles[property];
      }
    }
  }

  /**
   * Sets an attribute on the element.
   * @param {string} name - The name of the attribute.
   * @param {string} value - The value of the attribute.
   */
  setAttribute(name, value) {
    this.element.setAttribute(name, value);
  }

  /**
   * Removes an attribute from the element.
   * @param {string} name - The name of the attribute to remove.
   */
  removeAttribute(name) {
    this.element.removeAttribute(name);
  }

  /**
   * Removes all child nodes from the element.
   */
  clear() {
    while (this.element.firstChild) {
      this.element.removeChild(this.element.firstChild);
    }
  }

  /**
   * Query for elements within the plugin's root element. This method ensures that
   * plugins can only access elements within their assigned scope.
   *
   * @param {string} selector - The CSS selector to query for.
   * @returns {Array<HTMLElementAbstractionLayer>} - An array of abstracted elements.
   */
  querySelectorAll(selector) {
    const elements = this.element.querySelectorAll(selector);
    return Array.from(elements).map(
      (el) => new HTMLElementAbstractionLayer(el)
    );
  }

  /**
   * Gets or sets the text content of the element.
   *
   * @param {string} [text] - The text to set. If omitted, the current text content is returned.
   * @returns {string|undefined} The current text content if getting, otherwise undefined.
   */
  textContent(text) {
    if (text !== undefined) {
      this.element.textContent = text;
    } else {
      return this.element.textContent;
    }
  }

  /**
   * Gets or sets the value of form elements.
   *
   * @param {string} [value] - The value to set. If omitted, the current value is returned.
   * @returns {string|undefined} The current value if getting, otherwise undefined.
   */
  value(value) {
    if (value !== undefined) {
      if ("value" in this.element) {
        this.element.value = value;
      }
    } else {
      return this.element.value;
    }
  }

  /**
   * Dispatches a custom event from the element.
   *
   * @param {string} eventName - The name of the event.
   * @param {Object} [detail] - Optional details to pass with the event.
   */
  dispatchCustomEvent(eventName, detail = {}) {
    const event = new CustomEvent(eventName, { detail });
    this.element.dispatchEvent(event);
  }

  getElementById(id) {
    // Restrict this method to work only within the scoped element

    const foundElement = this.element.querySelector(`#${id}`);
    if (foundElement.classList.contains("protected")) {
      throw new Error("Protected elements are not allowed to be modified.");
    }
    return foundElement ? new HTMLElementAbstractionLayer(foundElement) : null;
  }

  querySelector(selector) {
    const foundElement = this.element.querySelector(selector);
    if (foundElement.classList.contains("protected")) {
      throw new Error("Protected elements are not allowed to be modified.");
    }
    return foundElement ? new HTMLElementAbstractionLayer(foundElement) : null;
  }

  addClass(className) {
    this.element.classList.add(className);
  }

  removeClass(className) {
    this.element.classList.remove(className);
  }

  toggleClass(className) {
    this.element.classList.toggle(className);
  }

  hasClass(className) {
    return this.element.classList.contains(className);
  }

  setStyle(property, value) {
    this.element.style[property] = value;
  }

  getStyle(property) {
    return getComputedStyle(this.element)[property];
  }

  setAttributeNS(namespace, name, value) {
    this.element.setAttributeNS(namespace, name, value);
  }

  removeAttributeNS(namespace, name) {
    this.element.removeAttributeNS(namespace, name);
  }

  getAttribute(name) {
    return this.element.getAttribute(name);
  }

  getBoundingClientRect() {
    return this.element.getBoundingClientRect();
  }

  focus() {
    if (this.element.focus) {
      this.element.focus();
    }
  }

  blur() {
    if (this.element.blur) {
      this.element.blur();
    }
  }

  appendChild(element) {
    // Ensure the passed element is an instance of HTMLElementAbstractionLayer
    if (element instanceof HTMLElementAbstractionLayer) {
      this.element.appendChild(element.element);
    } else {
      console.error(
        "appendChild: Passed element is not an instance of HTMLElementAbstractionLayer."
      );
    }
  }

  removeChild(element) {
    // Similar check as in appendChild
    if (element instanceof HTMLElementAbstractionLayer) {
      this.element.removeChild(element.element);
    } else {
      console.error(
        "removeChild: Passed element is not an instance of HTMLElementAbstractionLayer."
      );
    }
  }

  /**
   * Scrolls the element into view.
   * @param {boolean|ScrollIntoViewOptions} options - Boolean or an object with options.
   */
  scrollIntoView(options) {
    this.element.scrollIntoView(options);
  }

  /**
   * Sets the inner HTML safely by sanitizing the input HTML.
   * Note: Sanitization implementation should be added to prevent XSS.
   * @param {string} html - The HTML string to be set.
   */
  safeSetInnerHTML(html) {
    // Assume sanitizeHTML is a function you've defined elsewhere to sanitize HTML input
    this.element.innerHTML = DOMPurify.sanitize(html);
  }

  /**
   * Inserts an element before the specified sibling element.
   * @param {HTMLElementAbstractionLayer} newElement - The element to insert.
   * @param {HTMLElementAbstractionLayer} referenceElement - The sibling element before which newElement should be inserted.
   */
  insertBefore(newElement, referenceElement) {
    if (
      newElement instanceof HTMLElementAbstractionLayer &&
      referenceElement instanceof HTMLElementAbstractionLayer
    ) {
      this.element.insertBefore(newElement.element, referenceElement.element);
    } else {
      console.error(
        "insertBefore: Passed elements are not instances of HTMLElementAbstractionLayer."
      );
    }
  }

  /**
   * Clones the current element.
   * @param {boolean} deep - If true, the clone will include the element's descendants.
   * @returns {HTMLElementAbstractionLayer} The cloned element wrapped in HTMLElementAbstractionLayer.
   */
  cloneNode(deep = false) {
    const clone = this.element.cloneNode(deep);
    return new HTMLElementAbstractionLayer(clone);
  }

  /**
   * Replaces the current element with another element.
   * @param {HTMLElementAbstractionLayer} newElement - The new element to replace the current element.
   */
  replaceWith(newElement) {
    if (newElement instanceof HTMLElementAbstractionLayer) {
      this.element.replaceWith(newElement.element);
    } else {
      console.error(
        "replaceWith: Passed element is not an instance of HTMLElementAbstractionLayer."
      );
    }
  }

  /**
   * Attaches a shadow DOM to the element, enabling encapsulated shadow tree.
   * @param {ShadowRootInit} options - Configuration options for the shadow root.
   * @returns {ShadowRoot} The created shadow root.
   */
  attachShadow(options) {
    return this.element.attachShadow(options);
  }

  /**
   * Sets data attributes in a safe manner.
   * @param {string} name - The data attribute name (without the 'data-' prefix).
   * @param {string} value - The value of the data attribute.
   */
  setDataAttribute(name, value) {
    this.element.setAttribute(`data-${name}`, value);
  }

  /**
   * Gets the value of a specified data attribute.
   * @param {string} name - The data attribute name (without the 'data-' prefix).
   * @returns {string|null} The value of the data attribute, or null if it doesn't exist.
   */
  getDataAttribute(name) {
    return this.element.getAttribute(`data-${name}`);
  }

  /**
   * Adds a CSS class if it's not already present on the element.
   * @param {string} className - The class name to add.
   */
  addClassIfNotPresent(className) {
    if (!this.element.classList.contains(className)) {
      this.element.classList.add(className);
    }
  }

  /**
   * Removes a child node by selector.
   * @param {string} selector - The CSS selector of the child to remove.
   */
  removeChildBySelector(selector) {
    const child = this.element.querySelector(selector);
    if (child) {
      this.element.removeChild(child);
    }
  }
}
module.exports = HTMLElementAbstractionLayer;
