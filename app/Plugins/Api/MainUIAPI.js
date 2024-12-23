const HTMLElementAbstractionLayer = require('../Abstractors/HTMLElementAbstractionLayer');
const TabElementApi = require('./TabElementApi');
const domPurify = require('dompurify');
const DOMPurify = domPurify(window);
class MainUIAPI {
    constructor(pluginManager, pluginName) {
        this.pluginManager = pluginManager;
        this.pluginName = pluginName;

        this.whenReady = new Promise(async (resolve) => {
            await pluginManager.core.isReady;
            resolve();
        });
    }

    getTab(id) {
        if (!id) {
            let tab = this.pluginManager.core.navigation.getTab();
            id = tab.id;
        }
        return new TabElementApi(this.pluginManager.communicator.bindPlugin(this.pluginName, id), id)
    }

    /**
     * Inserts sanitized HTML into the DOM with enhanced capabilities for plugin creators.
     * 
     * @param {string} html - The HTML string to be inserted.
     * @param {Object} options - Configuration options for insertion and features.
     */
    insertHTML(html, options = {}) {
        // Define default options with extended capabilities
        const defaultOptions = {
            parentElementSelector: 'body',
            insertPosition: 'beforeend',
            cssStyles: '', // Custom CSS styles for the inserted HTML
            externalResources: [], // URLs of external CSS or JS
            domPurifyConfig: {
                KEEP_CONTENT: false,
                FORBID_TAGS: ['script']
            }, // Custom DOMPurify configuration for sanitization
        };

        DOMPurify.addHook('uponSanitizeAttribute', function (node, data) {
            // Check if the attribute name starts with 'on'
            if (data.attrName.startsWith('on')) {
                // Remove the attribute
                data.keepAttr = false;
            }
        });

        // Merge default options with user-provided options
        const finalOptions = { ...defaultOptions, ...options };

        // Sanitize HTML with custom DOMPurify configuration
        const sanitizedHTML = DOMPurify.sanitize(html, finalOptions.domPurifyConfig);

        // Insert custom CSS styles
        if (finalOptions.cssStyles) {
            const styleTag = document.createElement('style');
            styleTag.textContent = finalOptions.cssStyles;
            document.head.appendChild(styleTag);
        }

        // Load external resources securely
        finalOptions.externalResources.forEach(resource => {
            if (resource.endsWith('.css')) {
                loadExternalCSS(resource);
            }
        });

        // Find the parent element and insert the sanitized HTML
        const parentElement = document.querySelector(finalOptions.parentElementSelector);
        if (!parentElement) {
            console.error('Parent element not found.');
            return;
        }

        const id = `pluginInsertedHTML${Math.random().toString(36).substr(2, 9)}`;
        const newElementDiv = document.createElement('div');
        newElementDiv.id = id;
        newElementDiv.innerHTML = sanitizedHTML;

        parentElement.insertAdjacentElement(finalOptions.insertPosition, newElementDiv);

        const elementInterface = new HTMLElementAbstractionLayer(newElementDiv);

        return elementInterface;
    }

    /**
     * Loads an external CSS file securely.
     * @param {string} url - The URL of the external CSS file.
     */
    loadExternalCSS(url) {
        const link = document.createElement('link');
        link.href = url;
        link.type = 'text/css';
        link.rel = 'stylesheet';
        document.head.appendChild(link);
    }

    /**
    * Inserts CSS rules into the document to modify existing elements' styles.
    * 
    * @param {string} cssString - The CSS rules to be inserted.
    */
    insertCSS(cssString) {
        // Create a new style element
        const styleElement = document.createElement('style');
        styleElement.type = 'text/css';

        // Append the CSS rules to the style element
        if (styleElement.styleSheet) {
            // This is required for IE8 and below.
            styleElement.styleSheet.cssText = cssString;
        } else {
            // This is for modern browsers.
            styleElement.appendChild(document.createTextNode(cssString));
        }

        // Append the style element to the head of the document
        document.head.appendChild(styleElement);
    }
}

module.exports = MainUIAPI;
