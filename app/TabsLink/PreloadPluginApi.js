class PreloadPluginApi {
    constructor() {
        this.api = {
            dom: {
                createElement(tagName, attributes) {
                    const element = document.createElement(tagName);
                    Object.keys(attributes).forEach(key => {
                        element.setAttribute(key, attributes[key]);
                    });
                    document.body.appendChild(element);
                    return element;
                },
                removeElement(selector) {
                    const element = document.querySelector(selector);
                    if (element) {
                        element.parentNode.removeChild(element);
                    }
                },
                querySelector(selector) {
                    return document.querySelector(selector);
                },
                updateElementContent(selector, content) {
                    const element = document.querySelector(selector);
                    if (element) {
                        element.innerHTML = content;
                    }
                },
                addClass(selector, className) {
                    const element = document.querySelector(selector);
                    if (element) {
                        element.classList.add(className);
                    }
                },
                removeClass(selector, className) {
                    const element = document.querySelector(selector);
                    if (element) {
                        element.classList.remove(className);
                    }
                },
                setStyle(selector, styleObject) {
                    const element = document.querySelector(selector);
                    if (element) {
                        Object.assign(element.style, styleObject);
                    }
                },
                setAttribute(selector, attribute, value) {
                    const elements = document.querySelectorAll(selector);
                    elements.forEach(element => {
                        element.setAttribute(attribute, value);
                    });
                },
                getAttribute(selector, attribute) {
                    const element = document.querySelector(selector);
                    return element ? element.getAttribute(attribute) : null;
                },
                setDataAttribute(selector, key, value) {
                    const elements = document.querySelectorAll(selector);
                    elements.forEach(element => {
                        element.dataset[key] = value;
                    });
                },
                getDataAttribute(selector, key) {
                    const element = document.querySelector(selector);
                    return element ? element.dataset[key] : null;
                },
                querySelectorAll(selector) {
                    return [...document.querySelectorAll(selector)];
                },
                cloneElement(selector, deep = true) {
                    const element = document.querySelector(selector);
                    return element ? element.cloneNode(deep) : null;
                },
                getNextSibling(selector) {
                    const element = document.querySelector(selector);
                    return element ? element.nextElementSibling : null;
                },
                getPreviousSibling(selector) {
                    const element = document.querySelector(selector);
                    return element ? element.previousElementSibling : null;
                },
                appendChild(selector, childElement) {
                    const parent = document.querySelector(selector);
                    if (parent) {
                        parent.appendChild(childElement);
                    }
                },
                removeChild(selector, childSelector) {
                    const parent = document.querySelector(selector);
                    const child = parent ? parent.querySelector(childSelector) : null;
                    if (parent && child) {
                        parent.removeChild(child);
                    }
                },
                async loadAndDisplayContent(selector, url) {
                    try {
                        const response = await fetch(url);
                        const content = await response.text();
                        const element = document.querySelector(selector);
                        if (element) {
                            element.innerHTML = content;
                        }
                    } catch (error) {
                        console.error('Failed to load content:', error);
                    }
                },
                async animateElement(selector, animationClass, duration = 500) {
                    return new Promise((resolve) => {
                        const element = document.querySelector(selector);
                        if (element) {
                            element.classList.add(animationClass);
                            setTimeout(() => {
                                element.classList.remove(animationClass);
                                resolve();
                            }, duration);
                        } else {
                            resolve(); // Resolve immediately if element not found
                        }
                    });
                }
            },
            events: {
                addEventListener(event, callback) {
                    window.addEventListener(event, callback);
                },
                removeEventListener(event, callback) {
                    window.removeEventListener(event, callback);
                },
                addEventListenerOnce(event, callback) {
                    const onceCallback = (...args) => {
                        callback(...args);
                        window.removeEventListener(event, onceCallback);
                    };
                    window.addEventListener(event, onceCallback);
                },
                addDelegatedEventListener(selector, event, callback) {
                    document.addEventListener(event, (e) => {
                        if (e.target.matches(selector)) {
                            callback(e);
                        }
                    });
                },
                dispatchCustomEvent(selector, eventName, detail = {}) {
                    const event = new CustomEvent(eventName, { detail });
                    const elements = document.querySelectorAll(selector);
                    elements.forEach(element => {
                        element.dispatchEvent(event);
                    });
                },
                preventDefault(event) {
                    event.preventDefault();
                },
                stopPropagation(event) {
                    event.stopPropagation();
                },
                addEventListenerWithCapture(selector, event, callback) {
                    const element = document.querySelector(selector);
                    if (element) {
                        element.addEventListener(event, callback, true);
                    }
                },
                throttleEvent(selector, event, callback, limit = 300) {
                    let lastEvent, timer;
                    const element = document.querySelector(selector);
                    if (!element) return;

                    element.addEventListener(event, (e) => {
                        if (lastEvent && (Date.now() - lastEvent) < limit) {
                            clearTimeout(timer);
                            timer = setTimeout(() => {
                                lastEvent = Date.now();
                                callback(e);
                            }, limit - (Date.now() - lastEvent));
                        } else {
                            lastEvent = Date.now();
                            callback(e);
                        }
                    });
                },
                async handleEventAsync(selector, event, asyncCallback) {
                    const element = document.querySelector(selector);
                    if (element) {
                        element.addEventListener(event, async (e) => {
                            await asyncCallback(e);
                        });
                    }
                },
                createEventBus() {
                    const listeners = {};

                    return {
                        emit(event, data) {
                            (listeners[event] || []).forEach((callback) => callback(data));
                        },
                        on(event, callback) {
                            if (!listeners[event]) {
                                listeners[event] = [];
                            }
                            listeners[event].push(callback);
                        },
                        off(event, callback) {
                            if (!listeners[event]) return;
                            const index = listeners[event].indexOf(callback);
                            if (index > -1) {
                                listeners[event].splice(index, 1);
                            }
                        }
                    };
                }
            },
            network: {
                async fetch(url, options) {
                    try {
                        const response = await fetch(url, options);
                        return response.json(); // Assuming JSON response
                    } catch (error) {
                        console.error('Fetch error:', error);
                        throw error;
                    }
                },
                async request(url, { method = 'GET', headers = {}, body = null, responseType = 'json' } = {}) {
                    try {
                        const response = await fetch(url, { method, headers, body });
                        if (responseType === 'json') {
                            return response.json();
                        } else if (responseType === 'text') {
                            return response.text();
                        } else if (responseType === 'blob') {
                            return response.blob();
                        }
                        // Add more response types as needed
                    } catch (error) {
                        console.error('HTTP request error:', error);
                        throw error;
                    }
                },
                async uploadFile(url, file, additionalData = {}) {
                    const formData = new FormData();
                    formData.append('file', file);
                    Object.keys(additionalData).forEach(key => {
                        formData.append(key, additionalData[key]);
                    });

                    return this.request(url, {
                        method: 'POST',
                        body: formData,
                    });
                },
                async fetchWithTimeout(url, options = {}, timeout = 5000) {
                    const controller = new AbortController();
                    const id = setTimeout(() => controller.abort(), timeout);
                    options.signal = controller.signal;

                    try {
                        const response = await fetch(url, options);
                        clearTimeout(id);
                        return response.json(); // or handle other response types as needed
                    } catch (error) {
                        console.error('Fetch request failed:', error);
                        throw error;
                    }
                },
                async performSequentialRequests(urls) {
                    const results = [];
                    for (const url of urls) {
                        const response = await this.fetchWithTimeout(url);
                        results.push(response);
                    }
                    return results;
                },
                async performParallelRequests(urls) {
                    return Promise.all(urls.map(url => this.fetchWithTimeout(url)));
                },
                createWebSocket(url, protocols) {
                    const ws = new WebSocket(url, protocols);
                    return {
                        send: (data) => ws.send(data),
                        close: () => ws.close(),
                        onMessage: (callback) => { ws.onmessage = callback; },
                        onError: (callback) => { ws.onerror = callback; },
                        onClose: (callback) => { ws.onclose = callback; },
                        onOpen: (callback) => { ws.onopen = callback; }
                    };
                },
                listenToServerSentEvent(url, callback) {
                    const eventSource = new EventSource(url);
                    eventSource.onmessage = (event) => {
                        callback(event.data);
                    };
                    return {
                        close: () => eventSource.close()
                    };
                }
            },
            utils: {
                formatDate(date, formatString) {
                    // Implement a simple date formatting function or use a library
                    return new Date(date).toLocaleDateString();
                },
                encodeBase64(string) {
                    return btoa(string);
                },
                decodeBase64(encodedString) {
                    return atob(encodedString);
                },
                generateUUID() {
                    // Simple UUID v4 generator or use a library
                    return 'xxxx-xxxx-4xxx-yxxx-xxxx-xxxx'.replace(/[xy]/g, function (c) {
                        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
                        return v.toString(16);
                    });
                },
                deepMerge(target, ...sources) {
                    sources.forEach(source => {
                        Object.keys(source).forEach(key => {
                            if (source[key] && typeof source[key] === 'object') {
                                if (!target[key]) target[key] = {};
                                this.deepMerge(target[key], source[key]);
                            } else {
                                target[key] = source[key];
                            }
                        });
                    });
                    return target;
                },
                debounce(func, wait, immediate) {
                    let timeout;
                    return function () {
                        const context = this, args = arguments;
                        const later = function () {
                            timeout = null;
                            if (!immediate) func.apply(context, args);
                        };
                        const callNow = immediate && !timeout;
                        clearTimeout(timeout);
                        timeout = setTimeout(later, wait);
                        if (callNow) func.apply(context, args);
                    };
                },
                async debounceAsync(func, wait, immediate) {
                    let timeout;
                    return async function (...args) {
                        const context = this;
                        const later = async () => {
                            timeout = null;
                            if (!immediate) await func.apply(context, args);
                        };
                        const callNow = immediate && !timeout;
                        clearTimeout(timeout);
                        timeout = setTimeout(later, wait);
                        if (callNow) await func.apply(context, args);
                    };
                },
                async readFileAsync(filePath) {
                    const fs = require('fs').promises; // Assuming Node.js environment in preload script
                    try {
                        const data = await fs.readFile(filePath, 'utf8');
                        return data;
                    } catch (error) {
                        console.error('Failed to read file:', error);
                        throw error;
                    }
                },
                filterCollection(collection, predicate) {
                    return collection.filter(predicate);
                },
                mapCollection(collection, transform) {
                    return collection.map(transform);
                },
                reduceCollection(collection, reducer, initialValue) {
                    return collection.reduce(reducer, initialValue);
                },
                async fetchDataAndProcess(url, processDataFunc) {
                    try {
                        const response = await fetch(url);
                        const data = await response.json();
                        return processDataFunc(data);
                    } catch (error) {
                        console.error('Error fetching or processing data:', error);
                        throw error;
                    }
                }
            },
            tasks: {
                async runInBackground(taskFunc, ...args) {
                    // Use Web Workers or Node.js worker_threads based on the environment
                    // This is a conceptual implementation
                    return new Promise((resolve, reject) => {
                        try {
                            const result = taskFunc(...args); // Assume taskFunc returns a Promise or is an async function
                            resolve(result);
                        } catch (error) {
                            reject(error);
                        }
                    });
                }
            },
            state: {
                createStore(initialState) {
                    let state = initialState;
                    const listeners = [];

                    return {
                        getState: () => state,
                        setState: (newState) => {
                            state = { ...state, ...newState };
                            listeners.forEach((listener) => listener(state));
                        },
                        subscribe: (listener) => {
                            listeners.push(listener);
                            return () => {
                                const index = listeners.indexOf(listener);
                                if (index > -1) {
                                    listeners.splice(index, 1);
                                }
                            };
                        }
                    };
                }
            }
        };

    }
}

module.exports = PreloadPluginApi;