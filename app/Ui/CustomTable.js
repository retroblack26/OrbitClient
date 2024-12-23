class CustomTableManager {
    constructor() {
        this.tables = [];
    }

    getTable(id) {
        return this.tables.find(table => table.id === id);
    }

    createTable(args) {
        let table = new CustomTable(args);
        this.tables.push(table);
        return table;
    }

    removeTable(id) {

    }

}
class CustomTable {
    constructor({ element, options, template, storeArray }) {

        this.template = template;
        this.currentNumber = 0;
        this.callbacks = options.callbacks ? options.callbacks : {};
        this.cells = template.cells || [];
        this.id = options.id;

        // Define columns from storeArray or template
        if (storeArray && storeArray.length > 0) {
            const firstItem = storeArray[0];
            this.allColumns = Object.keys(firstItem).map(key => ({ name: key, title: key.charAt(0).toUpperCase() + key.slice(1), visible: template.columns.some(tc => tc.name === key) }));
        } else {
            if (template.columns) {
                this.allColumns = template.cells.map(cell => ({
                    name: cell.name,
                    title: cell.title ? cell.title : cell.name.charAt(0).toUpperCase() + cell.name.slice(1),
                    visible: template.columns.some(tc => tc.name === cell.name)
                }));
            } else {
                this.allColumns = [];
            }
        }

        this.storeArray = storeArray || [];
        this.element = element || this._createTable(options);
        this.inputs = [];
        this._modifyRow = this._modifyRow.bind(this);
        this._saveRow = this._saveRow.bind(this);
        this._deleteRow = this._deleteRow.bind(this);

        if (this.storeArray.length > 0) {
            this._createFromObjectArray(this.storeArray);
        }
    }

    addItem(data) {
        const table = this.element;
        const row = data ? table.insertRow(-1) : table.insertRow(1); // Insert at the end of the table

        this.allColumns.forEach(column => {
            const cell = row.insertCell();
            let cellTemplate = this.cells.find(c => c.name === column.name) || {};
            let columnVisibility = column.visible == true ? '' : 'none';

            cell.style.display = columnVisibility;

            if (data && column.name in data) {
                cell.appendChild(this._createCell(cellTemplate, data[column.name]));
            } else {
                cell.appendChild(this._createCell(cellTemplate));
            }
        });

        // Add buttons in the last cell
        const buttonCell = row.insertCell();
        buttonCell.appendChild(this._createButtonCell(data ? false : true));

        this.currentNumber++;
    }

    removeItem({ }) {

    }

    removeAllRows() {
        var table = this.element;
        while (table.rows.length > 1) {
            table.deleteRow(1);
        }
        this.currentNumber = 0;
    }



    _createButtonCell(emptyRow) {
        let buttonSection = document.createElement('section');
        buttonSection.id = 'table-btn-container';

        let buttonCase = document.createElement('section');
        buttonCase.className = 'buttonCase';
        buttonCase.style.display = 'none';

        let saveButtonElement = document.createElement('button');
        saveButtonElement.classList.add('table-btn', 'table-btn-green');
        saveButtonElement.setAttribute('type', 'button');
        saveButtonElement.innerHTML = '<svg width="12px" height="12px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M4 12.6111L8.92308 17.5L20 6.5" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>';

        saveButtonElement.addEventListener('click', (e) => this._saveRow(e));

        let editButtonElement = document.createElement('button');
        editButtonElement.classList.add('table-btn');
        editButtonElement.setAttribute('type', 'button');
        editButtonElement.innerHTML = '<svg width="10px" height="10px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill-rule="evenodd" clip-rule="evenodd" d="M20.8477 1.87868C19.6761 0.707109 17.7766 0.707105 16.605 1.87868L2.44744 16.0363C2.02864 16.4551 1.74317 16.9885 1.62702 17.5692L1.03995 20.5046C0.760062 21.904 1.9939 23.1379 3.39334 22.858L6.32868 22.2709C6.90945 22.1548 7.44285 21.8693 7.86165 21.4505L22.0192 7.29289C23.1908 6.12132 23.1908 4.22183 22.0192 3.05025L20.8477 1.87868ZM18.0192 3.29289C18.4098 2.90237 19.0429 2.90237 19.4335 3.29289L20.605 4.46447C20.9956 4.85499 20.9956 5.48815 20.605 5.87868L17.9334 8.55027L15.3477 5.96448L18.0192 3.29289ZM13.9334 7.3787L3.86165 17.4505C3.72205 17.5901 3.6269 17.7679 3.58818 17.9615L3.00111 20.8968L5.93645 20.3097C6.13004 20.271 6.30784 20.1759 6.44744 20.0363L16.5192 9.96448L13.9334 7.3787Z" fill="#ffffff"></path> </g></svg>';

        editButtonElement.addEventListener('click', (e) => this._modifyRow(e));

        let deleteButtonElement = document.createElement('button');
        deleteButtonElement.classList.add('table-btn', 'table-btn-red');
        deleteButtonElement.setAttribute('type', 'button');
        deleteButtonElement.innerHTML = '<svg width="10px" height="10px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#000000" stroke-width="0.00024000000000000003"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M20.7457 3.32851C20.3552 2.93798 19.722 2.93798 19.3315 3.32851L12.0371 10.6229L4.74275 3.32851C4.35223 2.93798 3.71906 2.93798 3.32854 3.32851C2.93801 3.71903 2.93801 4.3522 3.32854 4.74272L10.6229 12.0371L3.32856 19.3314C2.93803 19.722 2.93803 20.3551 3.32856 20.7457C3.71908 21.1362 4.35225 21.1362 4.74277 20.7457L12.0371 13.4513L19.3315 20.7457C19.722 21.1362 20.3552 21.1362 20.7457 20.7457C21.1362 20.3551 21.1362 19.722 20.7457 19.3315L13.4513 12.0371L20.7457 4.74272C21.1362 4.3522 21.1362 3.71903 20.7457 3.32851Z" fill="#ff0000"></path> </g></svg>';

        deleteButtonElement.addEventListener('click', (e) => this._deleteRow(e));

        if (emptyRow) {
            buttonCase.appendChild(saveButtonElement);

        } else {
            buttonCase.appendChild(editButtonElement);
        }
        buttonCase.appendChild(deleteButtonElement);
        buttonSection.appendChild(buttonCase);

        return buttonSection;
    }

    _createCell(options, data) {
        if (options.type == 'hidden') {
            options.type = 'text';
            options.style = 'display:none';
            options.disabled = true;
        }

        let cell = `<input ${options.style ? 'style="' + options.style + '"' : ''} type="${options.type}" name="${options.name}_InputTable" id="${this.element.id}-${options.name}Input${this.currentNumber}" placeholder="${options.placeholder ? options.placeholder : ''}" class="form-control ${data ? 'tableInput' : ''}" ${data ? 'value="' + data + '"' : ''} ${options.disabled == true || data ? 'disabled' : ''} ${options.checked ? 'checked' : ''}/>`;
        let placeholderDiv = document.createElement('div');
        placeholderDiv.innerHTML = cell;
        let inputHTMLElement = placeholderDiv.firstChild;
        this.inputs.push(inputHTMLElement);
        return inputHTMLElement;
    }

    _createFromObjectArray(objectArray) {
        try {
            this.removeAllRows();
            this.allColumns = [];
            if (objectArray) {
                this.allColumns = Object.keys(objectArray[0]).map(key => ({ name: key, title: key.charAt(0).toUpperCase() + key.slice(1), visible: this.template.columns.some(tc => tc.name === key) }));
                objectArray.forEach(item => {
                    this.addItem(item);
                });
            }
        } catch (e) {
            console.error(e)
        }
    }

    _createTable(options) {
        if (!options.container) {
            throw new Error('You must specify a container to create the table');
        }

        let tableElement = document.createElement('table');
        tableElement.classList.add('settings-table', 'table-bordered', 'table-striped');

        let tbody = document.createElement('tbody');

        if (options.id) {
            tableElement.id = options.id;
        }

        let tableHeader = document.createElement('tr');

        this.allColumns.forEach(column => {
            let columnVisibility = true;
            if (typeof column.visible !== 'undefined') {
                columnVisibility = column.visible;
            }
            let tableColumn = document.createElement('th');
            tableColumn.innerText = column.title || column.name;
            tableColumn.style.display = columnVisibility == true ? '' : 'none';
            tableHeader.appendChild(tableColumn);
        });

        // Add a column for buttons
        let buttonColumn = document.createElement('th');
        tableHeader.appendChild(buttonColumn);

        tbody.appendChild(tableHeader);

        tableElement.appendChild(tbody);
        options.container.appendChild(tableElement);
        return tableElement;
    }


    _modifyRow(e) {
        let element = this._determinateElement(e);
        this._switchTableView(element, true);

        // Création d'un nouvel élément et configuration
        let newElement = element.cloneNode(true);
        newElement.innerHTML = '<svg width="12px" height="12px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M4 12.6111L8.92308 17.5L20 6.5" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>';
        newElement.classList.add('table-btn-green');

        // Ajout du gestionnaire d'événements
        newElement.addEventListener("click", (e) => this._saveRow(e));

        // Remplacement de l'ancien élément par le nouveau
        element.replaceWith(newElement);
    }

    async _saveRow(e) {
        let element = this._determinateElement(e);

        try {

            if (typeof this.callbacks.saveRow == 'function') {
                await this.callbacks.saveRow(this._getInputDatas(element));
            }

            this._switchTableView(element, false);

            // Création d'un nouvel élément et configuration
            let newElement = element.cloneNode(true);
            newElement.innerHTML = '<svg width="10px" height="10px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill-rule="evenodd" clip-rule="evenodd" d="M20.8477 1.87868C19.6761 0.707109 17.7766 0.707105 16.605 1.87868L2.44744 16.0363C2.02864 16.4551 1.74317 16.9885 1.62702 17.5692L1.03995 20.5046C0.760062 21.904 1.9939 23.1379 3.39334 22.858L6.32868 22.2709C6.90945 22.1548 7.44285 21.8693 7.86165 21.4505L22.0192 7.29289C23.1908 6.12132 23.1908 4.22183 22.0192 3.05025L20.8477 1.87868ZM18.0192 3.29289C18.4098 2.90237 19.0429 2.90237 19.4335 3.29289L20.605 4.46447C20.9956 4.85499 20.9956 5.48815 20.605 5.87868L17.9334 8.55027L15.3477 5.96448L18.0192 3.29289ZM13.9334 7.3787L3.86165 17.4505C3.72205 17.5901 3.6269 17.7679 3.58818 17.9615L3.00111 20.8968L5.93645 20.3097C6.13004 20.271 6.30784 20.1759 6.44744 20.0363L16.5192 9.96448L13.9334 7.3787Z" fill="#ffffff"></path> </g></svg>';
            newElement.classList.remove('table-btn-green');

            // Ajout du gestionnaire d'événements
            newElement.addEventListener("click", (e) => this._modifyRow(e));

            // Remplacement de l'ancien élément par le nouveau
            element.replaceWith(newElement);
        } catch (error) {
            console.error("Error in _saveRow:", error);
            // Gérer l'erreur comme nécessaire
        }
    }

    async _deleteRow(e) {
        let element = this._determinateElement(e);

        var rowCount = this.element.rows.length;
        if (rowCount <= 1) {
            alert("There is no row available to delete!");
            return;
        }

        try {

            if (typeof this.callbacks.deleteRow == 'function') {
                await this.callbacks.deleteRow(this._getInputDatas(element));
            }

            element.parentNode.parentNode.parentNode.parentNode.remove();
        } catch (error) {
            console.error("Error in _saveRow:", error);
            // Gérer l'erreur comme nécessaire
        }
    }

    _getInputDatas(element) {
        let returnObject = {};
        for (let i = 0; i <= this.cells.length; i++) {
            try {
                const input = element.parentNode.parentNode.parentNode.parentNode.childNodes[i].firstChild;
                if (input && input.tagName !== "SECTION") {

                    returnObject[`${(input.name).split("_InputTable")[0]}`] = input.value;
                }
            } catch (error) {
                console.log("Error in _getInputDatas:", error);
            }

        }
        return returnObject;
    }

    _switchTableView(element, enabled) {
        for (let i = 0; i <= this.cells.length; i++) {
            const input = element.parentNode.parentNode.parentNode.parentNode.childNodes[i].firstChild;
            if (enabled == true) {
                input.classList.remove('tableInput');
                input.disabled = false;
            } else {
                input.classList.add('tableInput');
                input.disabled = true;
            }
        }
    }

    _determinateElement(e) {
        let element = null;
        if (e.path[0].type == 'button') {
            element = e.path[0];
        } else if (e.path[1].type == 'button') {
            element = e.path[1];
        } else {
            element = e.target.closest('button');
        }

        return element;
    }


}

module.exports = { CustomTable, CustomTableManager };