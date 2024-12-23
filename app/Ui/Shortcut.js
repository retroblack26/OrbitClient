const HTMLElementAbstractionLayer = require("../Plugins/Abstractors/HTMLElementAbstractionLayer");

class ShortcutContainer {
    constructor(manager, buttonId, containerId, parentShortcutContainer, alreadyCreatedContainer, popComponent, position) {
        this.manager = manager;
        this.containerId = containerId;
        this.shortcuts = [];
        this.parent = parentShortcutContainer;
        this.buttonElement = buttonId;
        this.popComponent = popComponent || null;
        this.isMouseInside = false;
        this.action = null;
        this.level = this._calculateLevel();

        if (alreadyCreatedContainer) {
            this.element = alreadyCreatedContainer;
            this._createPopoverEventListener(this.element, popComponent);
        } else {
            this.element = this._createContainer(containerId, buttonId, position);
        }
    }

    addItem(options) {
        let defaultIcon = `<svg width="14px" height="14px" viewBox="0 0 24 24" id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" fill="#000000"><g stroke-width="0"></g><g stroke-linecap="round" stroke-linejoin="round"></g><g><defs><style>.cls-1{fill:none;stroke:#ffffff;stroke-miterlimit:10;stroke-width:1.91px;}</style></defs><path class="cls-1" d="M19.64,11.05h-1V5.32H13v-1a2.86,2.86,0,1,0-5.72,0v1H1.5v5.73h1a2.86,2.86,0,1,1,0,5.72h-1V22.5H7.23v-.95a2.86,2.86,0,1,1,5.72,0v.95h5.73V16.77h1a2.86,2.86,0,0,0,0-5.72Z"></path></g></svg>`;
        let type = options.type || null;
        let multiLevel = options.template ? true : false;
        let icon = options.icon || null;
        let callback = options.callback || null;
        let style = options.style || null;

        let iconSvg = `<svg width="14px" height="14px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g stroke-width="0"></g><g stroke-linecap="round" stroke-linejoin="round"></g><g><path d="M14.2893 5.70708C13.8988 5.31655 13.2657 5.31655 12.8751 5.70708L7.98768 10.5993C7.20729 11.3805 7.2076 12.6463 7.98837 13.427L12.8787 18.3174C13.2693 18.7079 13.9024 18.7079 14.293 18.3174C14.6835 17.9269 14.6835 17.2937 14.293 16.9032L10.1073 12.7175C9.71678 12.327 9.71678 11.6939 10.1073 11.3033L14.2893 7.12129C14.6799 6.73077 14.6799 6.0976 14.2893 5.70708Z"fill="#ffffff"></path></g></svg>`;

        let shortcut = document.createElement('div');

        if (type && type == 'separator') {
            shortcut.classList.add('context-Item');
            shortcut.setAttribute('data-type', 'separator');
            shortcut.id = 'context-Item';
            this.element.appendChild(shortcut);
            return shortcut;
        }

        if (!options.name) {
            throw new Error(`Shortcut need a name.`);
        }

        shortcut.classList.add('context-Item');
        shortcut.setAttribute('data-name', options.name);
        shortcut.id = 'context-Item-' + options.name;

        if (style) {
            shortcut.setAttribute('style', style);
        }

        let shortcutIcon = document.createElement('div');
        shortcutIcon.classList.add('icon');

        if (multiLevel == true) {
            icon = iconSvg;
            shortcut.setAttribute('data-popover-target', `#${options.subContainerId}`);
        } else {
            if (!icon) {
                icon = defaultIcon;
            } else {
                if (typeof icon === 'object') {
                    if (icon.type && icon.type == 'svg') {
                        icon = icon.data;
                    }
                } else {
                    icon = `<img src="${icon}" />`;

                }
            }
            if (options.closeOnClick !== false) {
                shortcut.addEventListener('click', () => {
                    this.manager.hideAllPopOvers();
                });
            } else {
                shortcut.addEventListener('click', (e) => {
                    e.stopPropagation();
                });
            }
        }

        shortcutIcon.innerHTML = icon;

        let shortcutTitle = document.createElement('div');
        shortcutTitle.classList.add('title');
        shortcutTitle.innerText = options.title ? options.title : options.name;

        shortcut.appendChild(shortcutIcon);
        shortcut.appendChild(shortcutTitle);

        if (options.action) {
            this.action = options.action;
            shortcut.addEventListener('click', () => {
                try {
                    switch (options.action) {
                        case 'open-plugin-modal':
                            console.log('open-plugin-modal');
                            break;
                    }
                } catch (error) {
                    console.error('Error executing action:', error);
                }
            });
        }

        if (callback && typeof callback === 'function') {
            shortcut.addEventListener('click', (e) => {
                if (!shortcut.classList.contains('disabled')) {
                    try {
                        callback();
                    } catch (error) {
                        console.error('Error executing callback:', error);
                    }
                }
            });
        }

        this.element.appendChild(shortcut);

        if (multiLevel) {
            if (options.subContainerId) {
                let subContainer = this.manager.createContainer(shortcut.id, options.subContainerId, this, 'left');

                options.template.forEach(function (item) {
                    subContainer.addItem(item);
                });

                shortcut.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    await this.manager.hideAllPopOvers(subContainer);
                });

                shortcut.addEventListener('mouseenter', async (e) => {
                    await this.manager.hideAllPopOvers(subContainer);
                    setTimeout(() => {
                        subContainer.popComponent.show();
                    }, 250);
                });

                this.shortcuts.push({ element: shortcut, childs: [subContainer], parent: this, ...options });
                return subContainer;
            } else {
                throw new Error(`Multi-level items needs to have subContainerId option.`);
            }
        } else {
            this.shortcuts.push({ element: shortcut, parent: this, ...options });
            return shortcut;
        }
    }

    updateItem(name, newOptions) {
        let iconSvg = `<svg width="14px" height="14px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g stroke-width="0"></g><g stroke-linecap="round" stroke-linejoin="round"></g><g><path d="M14.2893 5.70708C13.8988 5.31655 13.2657 5.31655 12.8751 5.70708L7.98768 10.5993C7.20729 11.3805 7.2076 12.6463 7.98837 13.427L12.8787 18.3174C13.2693 18.7079 13.9024 18.7079 14.293 18.3174C14.6835 17.9269 14.6835 17.2937 14.293 16.9032L10.1073 12.7175C9.71678 12.327 9.71678 11.6939 10.1073 11.3033L14.2893 7.12129C14.6799 6.73077 14.6799 6.0976 14.2893 5.70708Z"fill="#ffffff"></path></g></svg>`;
        let shortcutItem;
        let isDisabled = newOptions.disabled || false;

        for (let shortcut of this.shortcuts) {
            if (shortcut.name === name) {
                shortcutItem = shortcut;
                break;
            }
            if (shortcut.childs) {
                for (let child of shortcut.childs) {
                    for (let childShortcut of child.shortcuts) {
                        if (childShortcut.name === name) {
                            shortcutItem = childShortcut;
                            break;
                        }
                    }
                }
            }
        }

        if (!shortcutItem) {
            throw new Error(`Shortcut with name ${name} not found.`);
        }

        const shortcutElement = shortcutItem.element;
        if (shortcutElement) {
            let icon = shortcutElement.querySelector('.icon');

            if (newOptions.title) {
                shortcutElement.querySelector('.title').innerText = newOptions.title;
            }

            if (isDisabled == true) {
                shortcutElement.classList.add('disabled');
            } else {
                shortcutElement.classList.remove('disabled');
            }

            if (newOptions.icon) {
                icon.src = newOptions.icon; //add path to icon
            }
            if (newOptions.callback) {
                shortcutItem.callback = newOptions.callback;
            }
            if (newOptions.action) {
                shortcutItem.action = newOptions.action;
            }
            if (newOptions.template) {
                if (newOptions.subContainerId) {
                    icon.innerHTML = iconSvg;

                    let itemClone = shortcutElement.cloneNode(true);

                    shortcutElement.parentNode.replaceChild(itemClone, shortcutElement);

                    itemClone.setAttribute('data-popover-target', `#${newOptions.subContainerId}`);

                    let subContainer = this.manager.createContainer(itemClone.id, newOptions.subContainerId, shortcutItem.parent, 'left');

                    itemClone.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.manager.hideAllPopOvers(subContainer);
                    });

                    newOptions.template.forEach(function (item) {
                        subContainer.addItem(item);
                    });

                    shortcutItem = { element: itemClone, childs: [subContainer], ...shortcutItem.options, ...newOptions };
                } else {
                    throw new Error(`A multi-level shortcut need a subContainerId.`);
                }
            } else {
                shortcutItem = { element: shortcutElement, ...shortcutItem.options, ...newOptions };
            }
        }
    }

    removeItem(name) {
        let shortcutTemp;

        let i = 0;
        let o = 0;
        let y = 0;
        let result = false;
        for (let shortcut of this.shortcuts) {
            if (shortcut.name === name) {
                removeElement(shortcut.element);
                this.shortcuts.splice(i, 1);
                result = true;
                break;
            }
            shortcutTemp = shortcut.childs;
            if (shortcutTemp) {
                for (let child of shortcutTemp) {
                    for (let childShortcut of child.shortcuts) {
                        if (childShortcut.name === name) {
                            removeElement(childShortcut.element);
                            this.manager.removeContainer(childShortcut.containerId);
                            if (childShortcut.childs) {
                                childShortcut.childs.forEach(cChild => {
                                    this.manager.removeContainer(child.containerId);
                                    removeElement(cChild.element);
                                })
                            }
                            child.shortcuts.splice(o, 1);
                            result = true;
                            break;
                        }
                        o++;
                    }
                    y++
                }
            }
            i++
        }

        if (result == false) {
            throw new Error(`Shortcut with name ${name} not found.`);
        }

        function removeElement(element) {
            if (element) {
                element.remove();
            }
        }
    }

    getElement(name) {
        let shortcut = this.shortcuts.find(shortcut => shortcut.name == name);

        if (shortcut) {
            return new HTMLElementAbstractionLayer(shortcut.element, true);
        } else {
            throw new Error(`Element with name ${name} not found in shortcuts.`)
        }
    }

    _calculateLevel() {
        if (this.parent) {
            let parent = this.parent;
            let tempLevel = 0;
            while (parent) {
                tempLevel++;
                parent = parent.parent;
            }

            return tempLevel;
        }
        return 0;
    }

    _createPopoverEventListener(element, popComElement) {
        let thisClas = this;
        element.addEventListener('mouseenter', function () {
            thisClas.isMouseInside = true;
            popComElement.show();
        });

        element.addEventListener('mouseleave', function () {
            thisClas.isMouseInside = false;
            setTimeout(function () {
                if (!thisClas.isMouseInside) {
                    popComElement.hide();
                }
            }, 2000);
        });
    }

    _createContainer(containerId, buttonId, position = 'left') {
        let pluginCustomPopOverComponent = document.createElement('div');
        pluginCustomPopOverComponent.id = containerId;
        pluginCustomPopOverComponent.classList.add('contextMenu-Tab');
        document.body.append(pluginCustomPopOverComponent);
        let thisClass = this;

        let pluginCustomPopComponent = PopoverComponent.init({
            ele: `#${buttonId}`,
            position: position,
            margin: '5',
            zindex: 10
        });

        pluginCustomPopOverComponent.addEventListener('mouseenter', function () {
            thisClass.isMouseInside = true;
            let parent = thisClass.parent;

            while (parent) {
                parent.isMouseInside = true;
                parent = parent.parent;
            }
            pluginCustomPopComponent.show();
        });

        pluginCustomPopOverComponent.addEventListener('mouseleave', function () {
            thisClass.isMouseInside = false;
            let parent = thisClass.parent;

            while (parent) {
                parent.isMouseInside = false;
                parent = parent.parent;
            }
            setTimeout(function () {
                if (!thisClass.isMouseInside) {
                    pluginCustomPopComponent.hide();
                }

                let parent = thisClass.parent;
                while (parent) {
                    if (!parent.isMouseInside) {
                        parent.popComponent.hide();
                    }
                    parent = parent.parent;
                }

                let childrens = thisClass.shortcuts.filter(c => c.childs);
                if (childrens) {
                    for (let child of childrens) {
                        for (let cChild of child.childs) {
                            if (!cChild.isMouseInside) {
                                cChild.popComponent.hide();
                            }
                        }
                    }
                }
            }, 2000);
        });

        this.popComponent = pluginCustomPopComponent;
        return pluginCustomPopOverComponent;
    }
}

class ShortcutManager {
    constructor() {
        this.containers = [];
    }

    createObjectFromExistingContainer(containerElement, buttonId, position = 'bottom') {
        let popComponent = PopoverComponent.init({
            ele: `#${buttonId}`,
            position: position,
            margin: '5',
            zindex: 10
        });
        const container = new ShortcutContainer(this, null, containerElement.id, null, containerElement, popComponent);
        this.containers.push(container);
        return container;
    }

    createContainer(buttonId, containerId, parentShortcutContainer, position = 'bottom') {
        if (this.containers[containerId]) {
            throw new Error(`Container with ID ${containerId} already exists.`);
        }

        document.getElementById(buttonId).setAttribute('data-popover-target', `#${containerId}`)

        const container = new ShortcutContainer(this, buttonId, containerId, parentShortcutContainer, null, null, position);
        this.containers.push(container);
        return container;
    }

    removeContainer(containerId) {
        delete this.containers[containerId];
    }

    getContainer(containerId) {
        return this.containers[containerId] || null;
    }

    hideAllPopOvers(fromContainer) {
        return new Promise((resolve) => {
            this.containers.forEach(function (container) {
                if (fromContainer) {
                    if (container.level == fromContainer.level && container !== fromContainer) {
                        container.popComponent.hide();
                    }
                } else {
                    container.popComponent.hide();
                }
            });
            resolve();
        });
    }
}

module.exports = { ShortcutContainer, ShortcutManager };

// Update and remove methods can be implemented as needed