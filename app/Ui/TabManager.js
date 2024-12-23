class TabManager {
    constructor(container) {
        this.container = container;
        this.tabs = [];
        this.tabCount = 0;
    }

    addTab(title, content) {
        this.tabCount++;
        const tabId = `tab${this.tabCount}`;
        const isChecked = this.tabs.length === 0; // Premier onglet ajouté est actif par défaut

        // Ajouter l'onglet à la liste des onglets
        this.tabs.push({ id: tabId, title, content, isChecked });

        // Mise à jour de l'affichage
        this.render();
    }

    render() {
        // Nettoyer le contenu précédent
        this.container.innerHTML = '';

        // Créer les inputs radio
        const inputs = this.tabs.map(tab => {
            return `<input ${tab.isChecked ? 'checked="checked"' : ''} id="${tab.id}" type="radio" name="pct" />`;
        }).join('');

        // Créer les labels dans <nav>
        const navItems = this.tabs.map(tab => {
            return `
                <li class="${tab.id}">
                    <label for="${tab.id}">${tab.title}</label>
                </li>
            `;
        }).join('');

        // Créer les sections de contenu
        const contentSections = this.tabs.map(tab => {
            return `
                <div class="${tab.id}">
                    ${tab.content}
                </div>
            `;
        }).join('');

        // Assembler le HTML
        const html = `
            <div class="pc-tab">
                ${inputs}
                <nav>
                    <ul>
                        ${navItems}
                    </ul>
                </nav>
                <section>
                    ${contentSections}
                </section>
            </div>
        `;

        // Insérer le HTML dans le container
        this.container.innerHTML = html;
    }
}

module.exports = TabManager;
