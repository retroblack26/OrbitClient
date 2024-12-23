const { Modal } = require('../Ui/Modal');
class SetMasterPasswordModal extends Modal {
    constructor(template) {
        super(template);
        this.ready.then(() => {
            this.init();
        })
    }

    init() {

        this.useCheckBox = this.element.modalParts.modalContainer.querySelector('[name="useMasterPassword"]');
        this.passwordInput1 = this.element.modalParts.modalContainer.querySelector('[name="modalPassword"]');
        this.passwordInput2 = this.element.modalParts.modalContainer.querySelector('[name="passwordVerification"]');
        this.confirmButton = this.element.modal.querySelector('[name="confirm-button"]');

        this.useCheckBox.addEventListener("change", (e) => {
            if (this.passwordInput1.disabled == true && this.passwordInput2.disabled == true) {
                this.confirmButton.disabled = true;
                this.passwordInput1.disabled = false;
                this.passwordInput2.disabled = false;
            } else {
                this.confirmButton.disabled = false;
                this.passwordInput1.disabled = true;
                this.passwordInput2.disabled = true;
            }
        })

        this.passwordInput2.addEventListener("input", (e) => {
            if (this.passwordInput1.value !== this.passwordInput2.value) {
                this.confirmButton.disabled = true;
                this.passwordInput2.setAttribute("style", "border: 1px solid red;");
                this.passwordInput1.setAttribute("style", "border: 1px solid red;");
            } else {
                this.confirmButton.disabled = false;
                this.passwordInput2.removeAttribute("style");
                this.passwordInput1.removeAttribute("style");
            }

        });

        this.confirmButton.addEventListener('click', e => {
            if (this.passwordInput1.length < 8) {
                e.preventDefault();
                alert("Please enter 8 characters minimum");
            }
        });

    }
}
module.exports = SetMasterPasswordModal;