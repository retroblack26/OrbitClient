const { Modal, ModalPopUp } = require("../Ui/Modal");
const Locales = require("../Locales");
const Config = new (require("../Models/Config"))();
const UiUtils = require("../Utils/UiUtils");

class SettingsModal extends Modal {
  constructor(core) {
    super({
      title: Locales.get("modal.settings.title"),
      icon: "themes/settings_icon.png",
      size: "medium",
      protected: true
    });
    this.core = core;

    this.ready.then(async () => {
      this.tableManager = core.browser.tableManager;
      this.element.modalParts.modalFooter.remove();
    });
  }

  show() {
    this.loadUsers();
    this.loadSettings();
    super.show();
  }

  _createContent() {
    return `<div class="pc-tab">
        <input id="tab1" type="radio" name="pct" />
        <input id="tab2" type="radio" name="pct" />
        <input id="tab4" type="radio" name="pct" />
        <input checked="checked" id="tab3" type="radio" name="pct" />
        <nav>
            <ul>
                <li class="tab1">
                    <label for="tab1" data-locale="{'modal.settings.tab1.title':'innerText'}">${Locales.get(
                      "modal.settings.tab1.title"
                    )}</label>
                </li>
                <li class="tab2">
                    <label for="tab2" data-locale="{'modal.settings.tab2.title':'innerText'}">${Locales.get(
                      "modal.settings.tab2.title"
                    )}</label>
                </li>

                <li class="tab4">
                    <label for="tab4"
                        data-locale="{'modal.settings.tab4.title':'innerText'}">${Locales.get(
                          "modal.settings.tab4.title"
                        )}</label>
                </li>

                <li class="tab3">
                    <label for="tab3" data-locale="{'modal.settings.tab3.title':'innerText'}"><span>${Locales.get(
                      "modal.settings.tab3.title"
                    )}</span></label>
                </li>
            </ul>
        </nav>
        <section>
            <div class="tab1">
               ${this._createAboutSection()}
           

            <div class="tab2">
            ${this._createSecuritySettings()}
            </div>
            <div class="tab4">
                <section class="btn-wrapper">
                    <button id="add-user-button" class="btn btn-primary"
                        data-locale="{'setting.adduser.button':'innerText'}">Ajouter
                        utilisateur</button>
                </section>
                <br>
            </div>
            <div class="tab3">
                ${this._createGlobalSettings()}
            </div>
        </section>
    </div>
    <section class="btn-wrapper">
        <button id="sendParams-btn" data-locale="{'settings.saveSettings.button':'innerText'}"
            class="btn btn-sendParams">Enregistrer</button>
    </section>
    <section class="btn-wrapper btn-wrapper-red">
        <button id="cancel-settings-btn" data-locale="{'modal.button.cancel':'innerText'}"
            class="btn btn-sendParams btn-red">Cancel</button>
    </section>
    <section class="btn-wrapper" style="
            right: 10px;
            position: fixed;
        ">
        <button id="reInitSettings-btn" data-locale="{'settings.reInitSettings.button':'innerText'}"
            class="btn btn-sendParams">Réinitialiser</button>
    </section>
</section>`;
  }

  _createGlobalSettings() {
    return `<section class="general-section" style="justify-content: center;">
        <section class="select-container">
            <label id="setting-language-label"
                data-locale="{'setting.language.label':'innerText'}">Langue:</label>
            <section class="custom-select">
                <select name="country">
                    <option value="de_DE">Deutsch</option>
                    <option value="en_UK">English UK</option>
                    <option value="fr_FR">Français</option>
                    <option value="en_US">English US</option>
                    <option value="es_ES">Español</option>
                    <option value="sv_SE">Svenska</option>
                    <option value="ru_RU">Pyccĸий</option>
                    <option value="it_IT">Italiano</option>
                    <option value="tr_TR">Tϋrkçe</option>
                    <option value="fi_FI">Suomi</option>
                    <option value="pl_PL">Polski</option>
                    <option value="da_DK">Dansk</option>
                    <option value="pt_PT">Português</option>
                    <option value="nl_NL">Nederlands</option>
                    <option value="no_NO">Norsk</option>
                    <option value="cs_CZ">Čeština</option>
                    <option value="sk_SK">Slovenčina</option>
                    <option value="pt_BR">Português BR</option>
                    <option value="ro_RO">Română</option>
                    <option value="el_GR">Ελληνικά</option>
                    <option value="bg_BG">Български</option>
                    <option value="hu_HU">Magyar</option>
                    <option value="es_MX">Mexicano</option>
                    <option value="co_CO">Colombia</option>
                    <option value="ve_VE">Venezuela</option>
                    <option value="cl_CL">Chile</option>
                    <option value="ar_AR">Argentina</option>
                    <option value="pe_PE">Perú</option>
                    <option value="ja_JP">日本語</option>
                    <option value="ko_KR">한국어</option>
                </select>
            </section>
            <label id="setting-siteForceLanguage" class="tooltip"
                data-tooltip="Cliquez pour faire quelque chose"
                data-locale="{'setting.siteForceLanguage.tooltip':'tooltip', 'setting.siteForceLanguage.label':'innerText'}"><input
                    type="checkbox"></input></label>
        </section>
        <br></br>
        <section class="select-container">
            <label id="setting-atStartuplabel"
                data-locale="{'setting.atStartup.label':'innerText'}">Au démarage:</label>
            <section class="custom-select">
                <select id="startupTabOptions">
                    <option value="resume"
                        data-locale="{'setting.onNewTab.options.resume':'innerText'}">Reprendre
                    </option>
                    <option value="newTab"
                        data-locale="{'setting.onNewTab.options.newTab':'innerText'}">Ouvrir
                        "Nouvelle Page"</option>
                    <option value="homepage"
                        data-locale="{'setting.onNewTab.options.homepage':'innerText'}">Page
                        d'acceuil configurée</option>
                    <option value="autoLogin"
                        data-locale="{'setting.atStartup.options.autoLogin':'innerText'}">
                        AutoLogin</option>
                </select>
            </section>
            <button class="tooltip-info-btn tooltip" data-tooltip=""
                data-locale="{'setting.atStartup.tooltip':'tooltip'}">i</button>
        </section>
    </section>
    <section class="general-section" style="justify-content: center;">
        <section class="input-container">
            <section class="vertical">
                <label id="setting-homepage-label"
                    data-locale="{'setting.homepage.label':'innerText'}">Homepage:</label>
                <input id="setting-homepage-input" type="text"
                    placeholder="https://www.darkorbit.com/">
            </section>
        </section>
        <section class="select-container">
            <label id="setting-onNewTab-label"
                data-locale="{'setting.onNewTab.label':'innerText'}">Au démarage:</label>
            <section class="custom-select">
                <select id="onNewTabOptions">
                    <option value="newTab"
                        data-locale="{'setting.onNewTab.options.newTab':'innerText'}">Ouvrir
                        "Nouvelle Page"</option>
                    <option value="homepage"
                        data-locale="{'setting.onNewTab.options.homepage':'innerText'}">Page
                        d'acceuil configurée</option>
                </select>
            </section>
            <button class="tooltip-info-btn tooltip" data-tooltip=""
                data-locale="{'setting.onNewTab.tooltip':'tooltip'}">i</button>
        </section>
    </section>

    <fieldset class="groupBox">
        <legend id="groupBoxUpdates-title"
            data-locale="{'modal.settings.updates.title':'innerText'}">Mises à jour</legend>
        <section class="updates-section" style="display: flex;">
            <section class="select-container">
                <label id="setting-update-game-label"
                    data-locale="{'setting.update.game.label':'innerText'}">Mise a jour du
                    jeux:</label>
                <section class="custom-select">
                    <select id="gameUpdateFrequency">
                        <option value="never"
                            data-locale="{'setting.gameUpdateFrequency.never':'innerText'}">
                            Jamais</option>
                        <option value="everyday"
                            data-locale="{'setting.gameUpdateFrequency.everyday':'innerText'}">
                            Tous les jours</option>
                        <option value="everyweek"
                            data-locale="{'setting.gameUpdateFrequency.everyweek':'innerText'}">
                            Toutes les semaines</option>
                    </select>
                </section>
                <button class="tooltip-info-btn tooltip"
                    data-tooltip="Cliquez pour faire quelque chose"
                    data-locale="{'setting.gameUpdateFrequency.tooltip':'tooltip'}">i</button>
            </section>
            <br></br>
            <section class="select-container">
                <label id="setting-update-client-label"
                    data-locale="{'setting.update.client.label':'innerText'}">Mise a jour du
                    client:</label>
                <section class="custom-select">
                    <select id="clientUpdateFrequency">
                        <option value="disabled"
                            data-locale="{'setting.clientUpdateFrequency.disabled':'innerText'}">
                            Désactiver</option>
                        <option value="automatic"
                            data-locale="{'setting.clientUpdateFrequency.automatic':'innerText'}">
                            Automatique</option>
                        <option value="ask"
                            data-locale="{'setting.clientUpdateFrequency.ask':'innerText'}">
                            Demander</option>
                    </select>
                </section>
                <button class="tooltip-info-btn tooltip"
                    data-locale="{'setting.clientUpdateFrequency.tooltip':'tooltip'}">i</button>
            </section>
        </section>
        <section style="display:flex;margin-top:10px;">
            <section class="select-container">
                <label id="setting-update-client-label"
                    data-locale="{'setting.update.serverList.label':'innerText'}">Màj des
                    serveurs privés:</label>
                <section class="custom-select">
                    <select id="serverListUpdateFrequency">
                        <option value="disabled"
                            data-locale="{'setting.clientUpdateFrequency.disabled':'innerText'}">
                            Désactiver</option>
                        <option value="automatic"
                            data-locale="{'setting.clientUpdateFrequency.automatic':'innerText'}">
                            Automatique</option>
                    </select>
                </section>
                <button class="tooltip-info-btn tooltip"
                    data-locale="{'setting.serverUpdateFrequency.tooltip':'tooltip'}">i</button>
            </section>
        </section>
    </fieldset>
    <fieldset class="groupBox">
        <legend id="groupBoxInterface-title"
            data-locale="{'modal.settings.interface.title':'innerText'}">Interface</legend>

        <label id="setting-UIScale" data-locale="{'setting.uiScale':'innerText'}"></label>
        <section class="rangeLabels"><label id="range-label-little"
                data-locale="{'setting.range.label.little':'innerText'}">Petit</label><label
                id="range-label-medium"
                data-locale="{'setting.range.label.medium':'innerText'}">Normal</label><label
                id="range-label-large"
                data-locale="{'setting.range.label.large':'innerText'}">Grand</label>
        </section>
        <section class="sliderContainer">
            <section class="slider">
                <input type="range" min="90" max="110" value="100" id="setting-uiScaleSlider"
                    step="2" list="scale">
                <datalist id="scale" class="sliderDatalist">
                    <option class="sliderOption" value="90"></option>
                    <option class="sliderOption" value="100"></option>
                    <option class="sliderOption" value="110"></option>
                </datalist>
            </section>
            <button class="tooltip-info-btn tooltip"
                data-tooltip="Cliquez pour faire quelque chose"
                data-locale="{'setting.range.tooltip':'tooltip'}">i</button>
        </section>
        <br></br>
        <label id="setting-enableAnimations"
            data-locale="{'setting.enableAnimations.label':'innerText'}"><input
                type="checkbox"></label>
    </fieldset>
    <fieldset class="groupBox">
        <legend data-locale="{'modal.settings.modal.title':'innerText'}">Modal</legend>
        <section style="display: grid; grid-template-columns: 1fr 1fr; margin-top: 10px;">
            <label id="setting-detectSID" class="tooltip"
                data-locale="{'setting.detectSID.label':'innerText', 'setting.detectSID.tooltip':'tooltip'}">
                <input type="checkbox">
            </label>
            <label id="setting-enableQuitModal"
                data-locale="{'setting.enableQuitModal.label':'innerText'}">
                <input type="checkbox">
            </label>
            <label id="setting-enableAddUserModal"
                data-locale="{'setting.enableAddUserModal.label':'innerText'}">
                <input type="checkbox">
            </label>
            <label id="setting-enableShowTutorial" class="tooltip"
                data-locale="{'setting.enableShowTutorial.label':'innerText','setting.enableShowTutorial.tooltip':'tooltip'}">
                <input type="checkbox">
            </label>
        </section>
    </fieldset>

    <fieldset class="groupBox">
        <legend id="groupBoxAdvanced-title"
            data-locale="{'modal.settings.advanced.label':'innerText'}">Paramètres Avancés
        </legend>
        <section class="advanced-section" style="display: flex;margin-bottom: 7px;">
            <section class="input-container">
                <section class="vertical">
                    <label data-locale="{'setting.gameVersion.label':'innerText'}">Game Version
                        :</label>
                    <input id="setting-gameVersion-input" type="text"
                        placeholder="BigPoint 1.6.9" />
                    <button class="tooltip-info-btn tooltip"
                        data-tooltip="Cliquez pour faire quelque chose"
                        data-locale="{'setting.gameVersion.tooltip':'tooltip'}">i</button>
                </section>
            </section>
            <br></br>
            <section class="input-container">
                <section class="vertical">
                    <label data-locale="{'setting.userAgent.label':'innerText'}">User Agent
                        :</label>
                    <input id="setting-useragent-input" type="text" />
                    <button class="tooltip-info-btn tooltip"
                        data-tooltip="Cliquez pour faire quelque chose"
                        data-locale="{'setting.userAgent.tooltip':'tooltip'}">i</button>
                </section>
            </section>
        </section>
        <section style="display: grid; grid-template-columns: 1fr 1fr; margin-top: 25px;">
            <label id="setting-cleanBeforeQuit" class="tooltip"
                data-locale="{'setting.cleanBeforeQuit.label':'innerText', 'setting.cleanBeforeQuit.tooltip':'tooltip'}"><input
                    type="checkbox"></label>

        </section>
        <br>
        <section class="btn-wrapper">
            <button id="clear-cache-button"
                data-locale="{'setting.clearCache.button':'innerText'}" onclick=""
                class="btn btn-primary">Effacer
                cache</button>
        </section>
    </fieldset>`;
  }

  _createSecuritySettings() {
    return ` <label data-locale="{'setting.useMasterCheckBox':'innerText'}"><input type="checkbox"
 id="useMasterPassword-checkbox"></label>
<fieldset class="groupBox">
<legend id="groupBoxMasterPassword-title"
 data-locale="{'modal.settings.security.groupBox.masterPassword.title':'innerText'}">
 Change Master Password</legend>

<section class="settings-inputs-group">
 <input type="password" id="setting-changemaster-oldPassword"
     placeholder="Enter old master password"
     data-locale="{'setting.changemaster.oldPassword':'placeholder'}" disabled>
 <input type="password" id="setting-changemaster-newPassword"
     placeholder="Enter new password"
     data-locale="{'setting.changemaster.newPassword':'placeholder'}" disabled>
 <input type="password" id="setting-changemaster-newVerifyPassword"
     placeholder="Rewrite new passwordf"
     data-locale="{'setting.changemaster.newVerifyPassword':'placeholder'}" disabled>
 <section class="btn-wrapper" style="margin:auto;">
     <button data-locale="{'setting.changemaster.button':'innerText'}"
         id="setting-changemaster-button" class="btn btn-primary"
         disabled>Changer</button>
 </section>
</section>

</fieldset>`;
  }

  _createPluginSection() {
    return `${
      Config.get("devMode") === true
        ? `<section class="btn-wrapper">
         <button id="add-plugin-button" class="btn btn-primary"
            data-locale="{'modal.settings.plugin.addPlugin.button':'innerText'}">Installer un plugin</button>
    </section>`
        : ""
    }
    <fieldset class="groupBox">
        <legend id="groupBoxPlugin-title"
         data-locale="{'modal.settings.plugin.groupBox.installed.title':'innerText'}">
         Installed plugins</legend>

         <section class="plugins-container" id="plugins-container">
         </section>

    </fieldset>`;
  }

  _createAboutSection() {
    return ` <h1
        style="color:#000;font-weight:600;text-shadow: 0 0 2px #3191b4;text-align:center;margin-bottom: 44px;">
        OrbitClient</h1>
    <p style="font-size:10px;text-align: center;">
        OrbitClient 2024-2025.All rights reserved.
        OrbitClient is not affiliated to BigPoint GmBH or DarkOrbit and is not an official
        client.
    </p>
    <br>
    <p>Version : 2.0b</p>
    <p>Flash Player version: 32.0 r0</p><br>

     <p>Plugin API: 1.1 (disabled)</p><br>

    <p>Creator: Benjamin (retroBlack)</p>
</div>`;
  }

  createSinglePluginCard(plugin) {
    let singlePlugin = ` <section class="single-plugin">
        <section class="left-section">
                 <section class="icon"><img src=''></section>
        </section>
        <section class="right-section">
        <section class="description">
                 <section class="title">${plugin.metadata.name}</section>
                 <section class="second-line">
                          <section class="creator">Creator: ${plugin.metadata.creator}</section>
        <section class="version">Version: ${plugin.metadata.version}</section>
                 </section>

        <section class="details">${plugin.metadata.description}</section>
        </section>

        <section class="buttons">
        <section class="btn-wrapper">
           <button class="btn btn-red" id="remove-btn">Remove</button>
           </section>
           <a href="">Informations sur le plugin</a>
        </section>
        </section>
        
        </section>`;

    let pluginDiv = document.createElement("div");
    pluginDiv.innerHTML = singlePlugin;

    this.pluginsContainer.appendChild(pluginDiv.firstChild);
    let removeBtn = pluginDiv.querySelector("#remove-btn");
    removeBtn.addEventListener("click", () => {
      this.core.pluginsManager.removePlugin(plugin.id);
    });
  }

  async initializeSettings() {
    this.masterPasswordUseCheckBox =
      this.element.modalParts.modalContainer.querySelector(
        "#useMasterPassword-checkbox"
      );
    this.pluginsContainer =
      this.element.modalParts.modalContainer.querySelector(
        "#plugins-container"
      );
    this.masterPasswordOldPassword =
      this.element.modalParts.modalContainer.querySelector(
        "#setting-changemaster-oldPassword"
      );
    this.masterPasswordNewPassword =
      this.element.modalParts.modalContainer.querySelector(
        "#setting-changemaster-newPassword"
      );
    this.masterPasswordNewPasswordVerify =
      this.element.modalParts.modalContainer.querySelector(
        "#setting-changemaster-newVerifyPassword"
      );
    this.masterPasswordButton =
      this.element.modalParts.modalContainer.querySelector(
        "#setting-changemaster-button"
      );
    this.clearCacheButton =
      this.element.modalParts.modalContainer.querySelector(
        "#clear-cache-button"
      );
    this.animationsCheckBox =
      this.element.modalParts.modalContainer.querySelector(
        "#setting-enableAnimations"
      ).firstChild;
    this.uiScaleSlider = this.element.modalParts.modalContainer.querySelector(
      "#setting-uiScaleSlider"
    );
    this.siteForceLanguageCheckBox =
      this.element.modalParts.modalContainer.querySelector(
        "#setting-siteForceLanguage"
      ).firstChild;
    this.startUpSelect =
      this.element.modalParts.modalContainer.querySelector(
        "#startupTabOptions"
      );
    this.addUserButton =
      this.element.modalParts.modalContainer.querySelector("#add-user-button");
    this.resetBtn = this.element.modalParts.modalContainer.querySelector(
      "#reInitSettings-btn"
    );
    this.confirmButton =
      this.element.modalParts.modalContainer.querySelector("#sendParams-btn");
    this.cancelBtn = this.element.modalParts.modalContainer.querySelector(
      "#cancel-settings-btn"
    );

    this.language = document.getElementsByName("country")[0];
    this.gameUpdateFrequency =
      this.element.modalParts.modalContainer.querySelector(
        "#gameUpdateFrequency"
      );
    this.clientUpdateFrequency =
      this.element.modalParts.modalContainer.querySelector(
        "#clientUpdateFrequency"
      );
    this.serverListUpdateFrequency =
      this.element.modalParts.modalContainer.querySelector(
        "#serverListUpdateFrequency"
      );
    this.homepage = this.element.modalParts.modalContainer.querySelector(
      "#setting-homepage-input"
    );
    this.gameVersion = this.element.modalParts.modalContainer.querySelector(
      "#setting-gameVersion-input"
    );
    this.userAgent = this.element.modalParts.modalContainer.querySelector(
      "#setting-useragent-input"
    );
    this.cleanBeforeQuit = this.element.modalParts.modalContainer.querySelector(
      "#setting-cleanBeforeQuit"
    ).firstChild;
    this.detectSid =
      this.element.modalParts.modalContainer.querySelector(
        "#setting-detectSID"
      ).firstElementChild;
    this.quitModal = this.element.modalParts.modalContainer.querySelector(
      "#setting-enableQuitModal"
    ).firstElementChild;
    this.addUserModal = this.element.modalParts.modalContainer.querySelector(
      "#setting-enableAddUserModal"
    ).firstElementChild;
    this.showTutorial = this.element.modalParts.modalContainer.querySelector(
      "#setting-enableShowTutorial"
    ).firstElementChild;
    this.onNewTab =
      this.element.modalParts.modalContainer.querySelector("#onNewTabOptions");
    /*     this.pluginDevelopperCheckBox =
      this.element.modalParts.modalContainer.querySelector(
        "#setting-devMode"
      ).firstElementChild;
 */
    this.usersTable = this.tableManager.createTable({
      options: {
        id: "users-table",
        container: document.getElementsByClassName("tab4")[1],
        callbacks: {
          saveRow: (datas) => {
            return new Promise(async (resolve, reject) => {
              var { id, login, password, domain } = datas;
              if (login.length <= 0 || password.length <= 0) {
                new ModalPopUp({
                  message: Locales.get("modal.addUser.error.empty.message"),
                  buttons: [{ text: Locales.get("modal.button.confirm") }],
                  type: "error",
                  icon: "themes/warning.svg"
                }).popUp();
                reject();
              }
              await this.core.usersModel.addUser(
                { id, login, password, domain },
                false,
                Config.get("masterPassword"),
                () => this.core.setMasterPassword()
              );
              resolve();
            });
          },
          deleteRow: (data) => {
            return new Promise((resolve, reject) => {
              if (data.id !== "") {
                new ModalPopUp({
                  message: Locales.get("modal.removeUser.message"),
                  buttons: [
                    {
                      text: Locales.get("modal.button.confirm"),
                      type: "btn-green"
                    },
                    {
                      text: Locales.get("modal.button.cancel"),
                      type: "btn-red"
                    }
                  ],
                  type: "error",
                  icon: "themes/warning.svg",
                  defaultId: 0
                })
                  .popUp()
                  .then((result) => {
                    if (result.buttonIndex == 0) {
                      this.core.usersModel.removeUser(data.id);
                      resolve();
                    }
                  });
              } else {
                resolve();
              }
            });
          }
        }
      },
      template: {
        columns: [
          {
            name: "login"
          },
          {
            name: "password"
          },
          {
            name: "domain"
          }
        ],
        cells: [
          {
            name: "id",
            type: "hidden"
          },
          {
            name: "login",
            type: "text",
            title: Locales.get("modal.settings.userstable.tableTitle1")
          },
          {
            name: "password",
            type: "password",
            title: Locales.get("modal.settings.userstable.tableTitle2")
          },
          {
            name: "domain",
            title: Locales.get("modal.settings.userstable.tableTitle3"),
            type: "text"
          }
        ]
      }
    });

    this.addUserButton.addEventListener("click", (e) =>
      this.usersTable.addItem()
    );

    const clearCache = (event) => {
      if (event.type === "click") {
        this.core.ipcRouter.main.windowAction({ action: "clearCache" });
      }
    };

    const clearInputs = () => {
      this.masterPasswordOldPassword.value = "";
      this.masterPasswordNewPassword.value = "";
      this.masterPasswordNewPasswordVerify.value = "";
    };

    this.confirmButton.addEventListener("click", (event) => {
      this.sendParams();
    });

    this.resetBtn.addEventListener("click", (e) => {
      new ModalPopUp({
        message: Locales.get("settings.reset.message"),
        buttons: [
          { text: Locales.get("modal.button.confirm") },
          { text: Locales.get("modal.button.cancel") }
        ],
        type: "error",
        icon: "themes/warning.svg",
        size: "small"
      })
        .popUp()
        .then(async (result) => {
          if (result.buttonIndex == 0) {
            Config.reInit();
            await this.core.navigation.saveState();
            this.core.ipcRouter.main.reloadApp();
          }
        });
    });

    this.cancelBtn.addEventListener("click", () => {
      this.hide();
    });

    this.clearCacheButton.addEventListener("click", (e) => {
      new ModalPopUp({
        message: Locales.get("modal.clearCache.message"),
        buttons: [
          { text: Locales.get("modal.button.confirm") },
          { text: Locales.get("modal.button.cancel") }
        ],
        type: "info",
        size: "small"
      })
        .popUp()
        .then((result) => {
          if (result.buttonIndex == 0) {
            clearCache(e);
          }
        });
    });

    this.oldStartupSelectValue = this.startUpSelect.value;

    this.startUpSelect.addEventListener("change", (e) => {
      if (e.target.value == "autoLogin") {
        this.autoLoginUserSelect();
      } else {
        Config.set("autoLogin", { enabled: false });
        Config.set("autoLogin", { userID: null });
      }
    });

    this.uiScaleSlider.addEventListener("change", (e) => {
      let newUIScale = parseFloat(this.uiScaleSlider.value) / 100;
      this.core.navigation.getCurrentTab().setZoomFactor(1 / newUIScale);
      this.core.ipcRouter.main.changeUiScale(newUIScale);
    });

    this.animationsCheckBox.addEventListener("change", (e) => {
      if (e.target.checked) {
        document.body.classList.remove("no-animations");
      } else {
        document.body.classList.add("no-animations");
      }
    });

    this.masterPasswordNewPasswordVerify.addEventListener("keyup", (e) => {
      if (e.key === "Enter" || e.keyCode === 13) {
        this.masterPasswordButton.click();
      } else {
        if (
          this.masterPasswordNewPasswordVerify.value !=
          this.masterPasswordNewPassword.value
        ) {
          this.masterPasswordNewPassword.setAttribute(
            "style",
            "border: 1px solid red;"
          );
          this.masterPasswordNewPasswordVerify.setAttribute(
            "style",
            "border: 1px solid red;"
          );
          this.masterPasswordButton.disabled = true;
        } else {
          this.masterPasswordNewPassword.removeAttribute("style");
          this.masterPasswordNewPasswordVerify.removeAttribute("style");
          this.masterPasswordButton.disabled = false;
        }
      }
    });

    this.masterPasswordButton.addEventListener("click", async (e) => {
      if (
        this.masterPasswordOldPassword.value.length > 0 &&
        this.masterPasswordNewPassword.value.length > 0 &&
        this.masterPasswordNewPasswordVerify.value.length > 0
      ) {
        if (
          (await this.core.usersModel.checkMasterPassword(
            this.masterPasswordOldPassword.value
          )) == true
        ) {
          this.core.usersModel.changeMasterPassword(
            this.masterPasswordOldPassword.value,
            this.masterPasswordNewPassword.value,
            true
          );
          this.core.userDatasModel.updateHash(this.core.usersModel.hash);
          new ModalPopUp({
            message: Locales.get("modal.masterPassword.success.changePassword"),
            buttons: [{ text: Locales.get("modal.button.confirm") }],
            type: "success",
            size: "small",
            defaultId: 0
          }).popUp();
          clearInputs();
        } else {
          new ModalPopUp({
            message: Locales.get(
              "modal.masterPassword.error.badPassword.message"
            ),
            buttons: [{ text: Locales.get("modal.button.confirm") }],
            type: "error",
            size: "small",
            icon: "themes/warning.svg",
            defaultId: 0
          }).popUp();
        }
      } else {
        new ModalPopUp({
          message: Locales.get("modal.masterPassword.error.empty.message"),
          buttons: [{ text: Locales.get("modal.button.confirm") }],
          type: "error",
          icon: "themes/warning.svg",
          size: "small",
          defaultId: 0
        }).popUp();
      }
    });

    this.masterPasswordUseCheckBox.addEventListener("change", (e) => {
      if (e.target.checked) {
        if (
          this.masterPasswordUseCheckBox.getAttribute("data-users") == "true"
        ) {
          if (Config.get("masterPassword") == false) {
            this.core.setMasterPassword();
          } else {
            e.target.checked = true;
          }
        } else {
          new ModalPopUp({
            message: Locales.get("settings.setMasterPassword.message"),
            buttons: [{ text: Locales.get("modal.button.confirm") }],
            type: "error",
            icon: "themes/warning.svg",
            size: "small"
          }).popUp();
          e.target.checked = false;
        }
      } else {
        if (Config.get("masterPassword") == true) {
          const options = {
            title: Locales.get("modal.masterpassword.header.title"),
            message: Locales.get("modal.masterpassword.message"),
            inputs: [
              {
                type: "password",
                name: "password",
                placeholder: Locales.get(
                  "modal.masterpassword.input.placeholder"
                ),
                required: true
              }
            ],
            buttons: [
              { text: Locales.get("modal.button.confirm"), type: "btn-green" },
              { text: Locales.get("modal.button.cancel"), type: "btn-red" }
            ],
            type: "info"
          };

          new ModalPopUp(options).popUp().then(async (result) => {
            if (result.buttonIndex == 0) {
              let enterredpassword = result.inputsData[0].password;

              if (
                (await this.core.usersModel.checkMasterPassword(
                  enterredpassword
                )) === true
              ) {
                new ModalPopUp({
                  message: Locales.get("settings.removeMasterPassword.message"),
                  detail: Locales.get("settings.removeMasterPassword.detail"),
                  buttons: [
                    { text: Locales.get("modal.button.keep") },
                    { text: Locales.get("modal.button.erase"), type: "btn-red" }
                  ],
                  type: "error",
                  icon: "themes/warning.svg",
                  size: "small",
                  defaultId: 0
                })
                  .popUp()
                  .then(async (result) => {
                    if (result.buttonIndex == 0) {
                      let changeMasterPasswordState =
                        await this.core.usersModel.changeMasterPassword(
                          enterredpassword,
                          ""
                        );
                      if (changeMasterPasswordState) {
                        Config.set("masterPassword", false);
                        this.core.userDatasModel.updateHash(
                          this.core.usersModel.hash
                        );
                      }
                    } else {
                      Config.set("resumeState", false);
                      this.core.userDatasModel.removeTabState();
                      this.core.masterPasswordModal.masterForgotEraseDatas();
                    }
                    this.disableGroup(true);
                  });
              } else {
                new ModalPopUp({
                  message: Locales.get(
                    "modal.masterPassword.error.badPassword.message"
                  ),
                  buttons: [{ text: Locales.get("modal.button.confirm") }],
                  type: "error",
                  icon: "themes/warning.svg",
                  size: "small",
                  defaultId: 0
                }).popUp();
                e.target.checked = true;
              }
            } else {
              e.target.checked = true;
            }
          });
        } else {
          e.target.checked = true;
        }
      }
    });

    const createSinglePlugin = (metadata) => {
      let singlePluginSection = document.createElement("section");
      singlePluginSection.className = "single-plugin";
      let singlePluginContainer = document.createElement("section");
      singlePluginContainer.className = "container";

      let pluginIcon = document.createElement("img");
      pluginIcon.src = metadata.icon;

      let pluginName = document.createElement("h1");
      pluginName.innerText = metadata.name;

      let pluginDescription = document.createElement("p");
      pluginDescription.innerText = metadata.description;

      let buttonSection = document.createElement("section");
      buttonSection.className = "control-buttons-group";

      let installButton = document.createElement("button");
      installButton.innerText =
        this.core.pluginManager.installedPlugins.includes(metadata.identifier)
          ? "Remove"
          : "Install";
      installButton.addEventListener("click", (e) => {
        alert("install " + metadata.name);
      });

      buttonSection.appendChild(installButton);

      singlePluginContainer.appendChild(pluginIcon);
      singlePluginContainer.appendChild(pluginName);
      singlePluginContainer.appendChild(pluginDescription);
      singlePluginContainer.appendChild(buttonSection);

      singlePluginSection.appendChild(singlePluginContainer);

      return singlePluginSection;
    };

    const initPluginList = () => {
      let plugins = this.core.pluginManager.scanPlugins();
      let completeSection = document.getElementById("plugins-container");

      for (let plugin of plugins) {
        let singlePlugin = createSinglePlugin(plugin);

        completeSection.appendChild(singlePlugin);
      }

      return completeSection;
    };

    // initPluginList();
  }

  disableGroup(disabled) {
    this.masterPasswordOldPassword.disabled = disabled;
    this.masterPasswordNewPassword.disabled = disabled;
    this.masterPasswordNewPasswordVerify.disabled = disabled;
    this.masterPasswordButton.disabled = disabled;
  }

  verifySettingsModifications() {
    let language = this.language.value;
    let gameUpdateFrequency = this.gameUpdateFrequency.value;
    let clientUpdateFrequency = this.clientUpdateFrequency.value;
    let serverListUpdateFrequency = this.serverListUpdateFrequency.value;
    let UIScale = parseFloat(this.uiScaleSlider.value) / 100;
    let animationsStatut = this.animationsCheckBox.checked;
    let siteForceLanguageStatut = this.siteForceLanguageCheckBox.checked;
    let homepage = this.homepage.value;
    let gameVersion = this.gameVersion.value;
    let userAgent = this.userAgent.value;
    let cleanBeforeQuit = this.cleanBeforeQuit.checked;
    /* let pluginDevMode = this.pluginDevelopperCheckBox.checked; */
    let detectSid = this.detectSid.checked;
    let quitModal = this.quitModal.checked;
    let addUserModal = this.addUserModal.checked;
    let showTutorial = this.showTutorial.checked;
    let onNewTab = this.onNewTab.value;
    let atStartup = this.startUpSelect.value;
    let toReturn = false;

    /*     if (Config.get("devMode") != pluginDevMode) {
      toReturn = true;
    } */

    if (Config.get("ui").scale != UIScale) {
      toReturn = true;
    }

    if (Config.get("ui").animations != animationsStatut) {
      toReturn = true;
    }

    if (Config.get("siteForceLanguage") != siteForceLanguageStatut) {
      toReturn = true;
    }

    if (Config.get("cleanBeforeQuit") != cleanBeforeQuit) {
      toReturn = true;
    }

    if (Config.get("modal").detectSidModal != detectSid) {
      toReturn = true;
    }

    if (Config.get("modal").showQuitModal != quitModal) {
      toReturn = true;
    }

    if (Config.get("modal").showAddUserModal != addUserModal) {
      toReturn = true;
    }

    if (Config.get("modal").showTutorial != showTutorial) {
      toReturn = true;
    }

    if (Config.get("onNewTab") != onNewTab) {
      toReturn = true;
    }

    if (Config.get("atStartup") != atStartup) {
      toReturn = true;
    }

    if (Config.get("gameUpdateFrequency") != gameUpdateFrequency) {
      toReturn = true;
    }

    if (Config.get("serverListUpdateMode") != serverListUpdateFrequency) {
      toReturn = true;
    }

    if (Config.get("clientUpdateFrequency") != clientUpdateFrequency) {
      toReturn = true;
    }

    if (Config.get("homepage") != homepage) {
      toReturn = true;
    }

    if (Config.get("gameVersion") != gameVersion) {
      toReturn = true;
    }

    if (Config.get("defaultUserAgent") != userAgent) {
      toReturn = true;
    }

    if (Config.get("language") != language) {
      toReturn = true;
    }
    return toReturn;
  }

  async askSaveSettings() {
    return new Promise((resolve, reject) => {
      new ModalPopUp({
        message: Locales.get("modal.settings.save.message"),
        buttons: [
          { text: Locales.get("app.edit.save") },
          { text: Locales.get("modal.button.later") }
        ],
        type: "info",
        defaultId: 0,
        size: "small"
      })
        .popUp()
        .then((result) => {
          if (result.buttonIndex == 0) {
            resolve(true);
          } else {
            resolve(false);
          }
        });
    });
  }

  sendParams() {
    let language = this.language.value;
    let gameUpdateFrequency = this.gameUpdateFrequency.value;
    let clientUpdateFrequency = this.clientUpdateFrequency.value;
    let serverListUpdateFrequency = this.serverListUpdateFrequency.value;
    let UIScale = parseFloat(this.uiScaleSlider.value) / 100;
    let animationsStatut = this.animationsCheckBox.checked;
    let siteForceLanguageStatut = this.siteForceLanguageCheckBox.checked;
    let homepage = this.homepage.value;
    let gameVersion = this.gameVersion.value;
    let userAgent = this.userAgent.value;
    let cleanBeforeQuit = this.cleanBeforeQuit.checked;
    let detectSid = this.detectSid.checked;
    let quitModal = this.quitModal.checked;
    let addUserModal = this.addUserModal.checked;
    let showTutorial = this.showTutorial.checked;
    let onNewTab = this.onNewTab.value;
    let atStartup = this.startUpSelect.value;
    /*     let pluginDevMode = this.pluginDevelopperCheckBox.checked;
     */ let neededReload = false;
    /* 
    if (Config.get("devMode") != pluginDevMode) {
      Config.set("devMode", pluginDevMode);
      neededReload = true;
    } */

    if (Config.get("ui").scale != UIScale) {
      Config.set("ui", { scale: UIScale });
      neededReload = true;
    }

    if (Config.get("ui").animations != animationsStatut) {
      Config.set("ui", { animations: animationsStatut });
    }

    if (Config.get("siteForceLanguage") != siteForceLanguageStatut) {
      Config.set("siteForceLanguage", siteForceLanguageStatut);
    }

    if (Config.get("cleanBeforeQuit") != cleanBeforeQuit) {
      Config.set("cleanBeforeQuit", cleanBeforeQuit);
    }

    if (Config.get("modal").detectSidModal != detectSid) {
      Config.set("modal", { detectSidModal: detectSid });
    }

    if (Config.get("modal").showQuitModal != quitModal) {
      Config.set("modal", { showQuitModal: quitModal });
    }

    if (Config.get("modal").showAddUserModal != addUserModal) {
      Config.set("modal", { showAddUserModal: addUserModal });
    }

    if (Config.get("modal").showTutorial != showTutorial) {
      Config.set("modal", { showTutorial: showTutorial });
    }

    if (Config.get("onNewTab") != onNewTab) {
      Config.set("onNewTab", onNewTab);
    }

    if (Config.get("atStartup") != atStartup) {
      Config.set("atStartup", atStartup);
    }

    if (Config.get("gameUpdateFrequency") != gameUpdateFrequency) {
      Config.set("gameUpdateFrequency", gameUpdateFrequency);
    }

    if (Config.get("serverListUpdateMode") != serverListUpdateFrequency) {
      Config.set("serverListUpdateMode", serverListUpdateFrequency);
    }

    if (Config.get("clientUpdateFrequency") != clientUpdateFrequency) {
      Config.set("clientUpdateFrequency", clientUpdateFrequency);
    }

    if (Config.get("homepage") != homepage) {
      Config.set("homepage", url);
    }

    if (Config.get("gameVersion") != gameVersion) {
      Config.set("gameVersion", gameVersion);
      neededReload = true;
    }

    if (Config.get("defaultUserAgent") != userAgent) {
      Config.set("defaultUserAgent", userAgent);
      neededReload = true;
    }

    if (Config.get("language") != language) {
      this.core.reloadLocales(language);
      neededReload = true;
    }

    if (neededReload == true) {
      new ModalPopUp({
        message: Locales.get("modal.reload.message"),
        buttons: [
          { text: Locales.get("modal.button.reload"), type: "btn-green" },
          { text: Locales.get("modal.button.cancel"), type: "btn-red" }
        ],
        type: "info",
        defaultId: 0
      })
        .popUp()
        .then(async (result) => {
          if (result.buttonIndex == 0) {
            await this.core.navigation.saveState();
            await Config.setTempItem("masterPasswordUnlock", false);
            this.core.ipcRouter.main.reloadApp();
          }
        });
    }
  }

  loadSettings() {
    this.masterPasswordUseCheckBox.checked = Config.get("masterPassword");

    /*     this.pluginDevelopperCheckBox.checked = Config.get("devMode");
     */
    if (Config.get("masterPassword") == true) {
      this.masterPasswordOldPassword.disabled = false;
      this.masterPasswordNewPassword.disabled = false;
      this.masterPasswordNewPasswordVerify.disabled = false;
      this.masterPasswordButton.disabled = false;
    }

    if (this.masterPasswordUseCheckBox.checked == true) {
      this.disableGroup(false);
    }

    this.language.value = Config.get("language");

    this.gameUpdateFrequency.value = Config.get("gameUpdateFrequency");

    this.serverListUpdateFrequency.value = Config.get("serverListUpdateMode");

    this.onNewTab.value = Config.get("onNewTab");

    this.animationsCheckBox.checked = Config.get("ui").animations;

    this.startUpSelect.value = Config.get("atStartup");

    this.clientUpdateFrequency.value = Config.get("clientUpdateFrequency");

    this.homepage.value = Config.get("homepage");

    this.gameVersion.value = Config.get("gameVersion");

    this.userAgent.value = Config.get("defaultUserAgent");

    this.cleanBeforeQuit.checked = Config.get("cleanBeforeQuit");

    this.detectSid.checked = true;

    this.quitModal.checked = Config.get("modal").showQuitModal;

    this.addUserModal.checked = Config.get("modal").showAddUserModal;

    this.showTutorial.checked = Config.get("modal").showTutorial;

    this.uiScaleSlider.value = Config.get("ui").scale * 100;

    this.confirmButton.disabled = false;

    UiUtils.initializeSelects();
  }

  loadUsers() {
    var table = this.usersTable.element;
    if (this.core.usersModel.count() > 0) {
      if (table.rows.length <= 1) {
        this.usersTable._createFromObjectArray(this.core.usersModel.data.users);

        let darkUsers = this.core.usersModel.data.users.filter(
          (user) => user.domain == "darkorbit.com"
        );

        if (darkUsers.length > 0) {
          UiUtils.disableSelectElement(
            this.element.modalParts.modalContainer.querySelector(
              "#startupTabOptions"
            ).options[3],
            false
          );
        } else {
          UiUtils.disableSelectElement(
            this.element.modalParts.modalContainer.querySelector(
              "#startupTabOptions"
            ).options[3],
            true
          );
        }
        this.masterPasswordUseCheckBox.setAttribute("data-users", "true");
      }
    } else {
      UiUtils.disableSelectElement(
        this.element.modalParts.modalContainer.querySelector(
          "#startupTabOptions"
        ).options[3],
        true
      );
    }
  }

  async hide() {
    if (this.verifySettingsModifications()) {
      await this.askSaveSettings().then((result) => {
        if (result == true) {
          this.sendParams();
        }
      });
    }
    super.hide();
  }

  autoLoginUserSelect() {
    let options = {
      message: Locales.get("modal.autoLogin.message"),
      title: Locales.get("modal.autoLogin.title"),
      buttons: [
        { text: Locales.get("modal.button.confirm") },
        { text: Locales.get("modal.button.cancel") }
      ],
      type: "question",
      icon: "themes/key.svg",
      inputs: [
        {
          type: "list",
          name: "userSelect",
          options: this.core.usersModel.getUsersLogins("darkorbit.com")
        }
      ]
    };

    new ModalPopUp(options).popUp().then((result) => {
      if (result.buttonIndex == 0 && result.inputsData[0].userSelect !== null) {
        Config.set("autoLogin", { enabled: true });
        Config.set("autoLogin", { userID: result.inputsData[0].userSelect });
        Config.set("atStartup", "autoLogin");
      } else {
        this.startUpSelect.value = this.oldStartupSelectValue;
        UiUtils.initializeSelects(this.startUpSelect.parentElement);
      }
    });
  }
}

module.exports = SettingsModal;
