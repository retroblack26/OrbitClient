const { Modal, ModalPopUp } = require("../Ui/Modal");
const Locales = require("../Locales");
const Config = new (require("../Models/Config"))();

class MasterPasswordModal extends Modal {
  constructor(core) {
    super({
      translateKey: "modal.masterpassword.title",
      width: "250px",
      icon: "icons/lock.svg",
      protected: true,
      closeable: false
    });
    this.core = core;

    this.masterPromiseResolve = null;

    this.masterUnlockPromise = new Promise((resolve) => {
      this.masterPromiseResolve = resolve;
    });

    this.ready.then(() => {
      this.element.modalParts.modalFooter.innerHTML = `  <div class="btn-wrapper">
            <button class="btn btn-green" id="modalMasterPassword-button">${Locales.get(
              "modal.button.confirm"
            )}</button>
        </div>`;
      this._initElements();
    });
  }

  _createContent() {
    return `
        <p id="modalMasterPassword-message" style=" margin-bottom: 13px;text-align:center;">
        ${Locales.get("modal.masterpassword.message")}
    </p>

    <p></p>

    <input type="password" name="masterPassword" required=""
        style="margin-left: 50%;transform: translateX(-50%);" placeholder="${Locales.get(
          "modal.masterpassword.input.password"
        )}">
    <!-- Add Components like textfield, etc-->

    <a class="forgot-link" id="modalMasterPassword-forgotLink">${Locales.get(
      "modal.masterpassword.forgotLink"
    )}</a>`;
  }

  show() {
    this.passwordInput.focus();
    super.show();
  }

  _initElements() {
    this.passwordInput = this.element.modalParts.modalContainer.querySelector(
      "[name=masterPassword]"
    );
    this.forgotLink = this.element.modalParts.modalContainer.querySelector(
      "#modalMasterPassword-forgotLink"
    );
    this.confirmButton = this.element.modalParts.modalFooter.querySelector(
      "#modalMasterPassword-button"
    );

    this.confirmButton.addEventListener("click", () =>
      this.masterPasswordConfirmBtnSubmit()
    );

    this.passwordInput.addEventListener("keyup", (e) => {
      if (e.key === "Enter" || e.keyCode === 13) {
        this.confirmButton.click();
      }
    });

    this.forgotLink.addEventListener("click", () => this.forgotLinkClicked());
  }

  async masterPasswordConfirmBtnSubmit() {
    this.confirmButton.innerHTML =
      '<svg width="25" height="8" viewBox="6 5 10 10" xmlns="http://www.w3.org/2000/svg"><style>.spinner_S1WN{animation:spinner_MGfb .8s linear infinite;animation-delay:-.8s}.spinner_Km9P{animation-delay:-.65s}.spinner_JApP{animation-delay:-.5s}@keyframes spinner_MGfb{93.75%,100%{opacity:.2}}</style><circle class="spinner_S1WN" cx="4" cy="12" r="3"/><circle class="spinner_S1WN spinner_Km9P" cx="12" cy="12" r="3"/><circle class="spinner_S1WN spinner_JApP" cx="20" cy="12" r="3"/></svg>';
    if (this.passwordInput.value.length > 0) {
      let result = await this.core.usersModel.initialize({
        secretKey: this.passwordInput.value,
        masterPassworkUnlock: true
      });
      if (result == true) {
        this.core.unlockMaster();
        this.masterPromiseResolve();
      } else {
        this.confirmButton.innerText = Locales.get("modal.button.confirm");
        new ModalPopUp({
          message: Locales.get(
            "modal.masterPassword.error.badPassword.message"
          ),
          buttons: [{ text: Locales.get("modal.button.confirm") }],
          type: "error",
          icon: "themes/warning.svg",
          defaultId: 0
        }).popUp();
      }
      this.passwordInput.value = "";
    } else {
      new ModalPopUp({
        message: Locales.get("modal.masterPassword.error.empty.message"),
        buttons: [{ text: Locales.get("modal.button.confirm") }],
        type: "error",
        icon: "themes/warning.svg",
        defaultId: 0
      }).popUp();
      this.confirmButton.innerText = Locales.get("modal.button.confirm");
    }
  }

  masterForgotEraseDatas() {
    this.core.usersModel.removeAllUsers();
    Config.set("masterPassword", false);
    if (Config.get("atStartup") == "autoLogin") {
      Config.set("atStartup", "newTab");
    }
    this.core.ipcRouter.main.reloadApp(true);
  }

  forgotLinkClicked(event) {
    new ModalPopUp({
      message: Locales.get("modal.forgotLink.message"),
      buttons: [
        { text: Locales.get("modal.button.erase"), type: "btn-red" },
        { text: Locales.get("modal.button.cancel") }
      ],
      type: "error",
      icon: "themes/warning.svg",
      size: "small",
      defaultId: 0
    })
      .popUp()
      .then((result) => {
        if (result.buttonIndex == 0) {
          this.masterForgotEraseDatas();
        } else {
          console.log("Modal Cancelled");
        }
      });
  }
}

module.exports = MasterPasswordModal;
