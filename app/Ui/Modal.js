const Locales = require("../Locales");
const UiUtils = require("../Utils/UiUtils");

class Modal {
  constructor(options) {
    this.options = {
      id: "",
      title: "",
      name: "modal",
      icon: "themes/question_icon.png",
      closeable: true,
      show: false,
      width: "200px",
      height: "200px",
      overlay: true,
      moveable: true,
      onRemove: null,
      onShow: null,
      onHide: null,
      protected: false,
      ...options
    };

    if (this.options.translateKey) {
      this.options.title = Locales.get(this.options.translateKey);
    }

    let modalElement = document.getElementById(this.options.name);
    if (modalElement) {
      throw new Error("Modal with this name already exists.");
    }

    this.ready = this._initModal();

    this.ready.then(() => {
      if (this.options.show === true) {
        this.show();
      }
    });
  }

  async _initModal() {
    return new Promise(async (resolve) => {
      this.element = await this._createModal();

      if (this.options.template) {
        await this._createTemplateContent(this.options.template);
      }
      await this._preloadModal();
      resolve();
    });
  }

  async _preloadModal() {
    return new Promise((resolve) => {
      this.element.modal.style.opacity = "0";
      this.element.modal.classList.remove("hidden");
      setTimeout(() => {
        this.element.modal.classList.add("hidden");
        resolve();
      }, 0);
    });
  }

  async _createTemplateContent(template) {
    let { modalHeaderIcon, modalContainer, modalFooter, modalCloseButton } =
      this.element.modalParts;
    let modal = this.element.modal;
    let inputs = template.inputs || [];

    let buttons = template.buttons || [];

    let title = template.title || Locales.get(`modal.title.${template.type}`);

    return new Promise((resolve) => {
      this.setTitle(title);

      if (template.icon) {
        modalHeaderIcon.src =
          template.icon.type === "svg"
            ? URL.createObjectURL(
                new Blob([template.icon.data], { type: "image/svg+xml" })
              )
            : template.icon;
      }

      modal.classList.add("modal-popup");

      if (template.width) {
        modal.style.width = template.width;
      }

      if (template.height) {
        modal.style.width = template.width;
      }

      if (template.size) {
        modal.classList.add("modal-size-${template.size}");
      }

      modalCloseButton.addEventListener("click", () => {
        if (template.onClose && typeof template.onClose === "function") {
          template.onClose(this);
        } else {
          this.remove();
        }
      });

      let contentHtml = `
    ${template.image ? `<img class="img-icon" src="${template.image}">` : ""}
    <p style="text-align: center; ${
      template.type === "module" ? "line-height: 16px;" : "line-height: 20px;"
    }">${template.message || ""}</p>
    <p style="font-size: 10px; line-height: 14px;">${template.detail || ""}</p>
    <div class="inputs-group">
      ${inputs
        .map(
          (input) => `
        ${
          input.label
            ? `<label ${
                typeof input.label == "object" && input.label.style
                  ? `style="${input.label.style}"`
                  : ""
              }>${
                typeof input.label == "object" ? input.label.text : input.label
              }${
                input.type === "checkbox"
                  ? `<input name="${input.name}" ${
                      input.id ? `id="${input.id}"` : ""
                    } type="checkbox">`
                  : ""
              }</label>`
            : ""
        }
        ${
          input.type === "password" || input.type === "text"
            ? `<input ${input.id ? `id="${input.id}"` : ""} type="${
                input.type
              }" name="${input.name}" placeholder="${
                input.placeholder || ""
              }" ${input.required ? "required" : ""} ${
                input.value ? `value="${input.value}"` : ""
              } ${
                input.autocomplete ? `list="autocomplete-${input.name}"` : ""
              }>`
            : ""
        }
        ${
          input.autocomplete
            ? `<datalist id="autocomplete-${input.name}">${input.autocomplete
                .map((value) => `<option value="${value}"></option>`)
                .join("")}</datalist>`
            : ""
        }
        ${
          input.type === "select"
            ? `
          <section class="custom-select">
            <select name="${input.name}">${
                input.options
                  ? input.options
                      .map(
                        (user) =>
                          `<option value="${user.id}">${user.login}</option>`
                      )
                      .join("")
                  : ""
              }</select>
          </section>
        `
            : ""
        }
        ${
          input.type === "list"
            ? `
          <div class="contextMenu-Tab" name="${input.name}">
            ${
              input.options
                ? input.options
                    .map(
                      (user) => `
              <div class="context-Item" data-value="${user.id}">
                <div class="title">${user.login}</div>
              </div>
            `
                    )
                    .join("")
                : ""
            }
          </div>
        `
            : ""
        }
      `
        )
        .join("")}
    </div>
  `;

      modalContainer.innerHTML = contentHtml;

      if (modalContainer.querySelector(".custom-select")) {
        UiUtils.initializeSelects(
          modalContainer.querySelector(".custom-select")
        );
      }

      modalContainer.querySelectorAll(".context-Item").forEach((item) => {
        item.addEventListener("click", (e) => {
          let parent = e.target.closest(".contextMenu-Tab");
          let activeItem = parent.querySelector(".active");
          if (activeItem && activeItem !== e.target.closest(".context-Item")) {
            activeItem.classList.remove("active");
          }
          e.target.closest(".context-Item").classList.add("active");
        });
      });

      let result = {};
      let btnIndex = 0;

      buttons.forEach((button) => {
        let btnHtml = `
      <div class="btn-wrapper${
        button.type === "btn-green"
          ? " btn-wrapper-green"
          : button.type === "btn-red"
          ? " btn-wrapper-red"
          : ""
      }">
        <button ${button.id ? `id="${button.id}"` : ""} class="btn${
          button.type ? ` ${button.type}` : ""
        }" name="${button.name}" data-default="${btnIndex}" ${
          button.disabled ? "disabled" : ""
        }>${button.text}</button>
      </div>
    `;

        let btnFragment = document
          .createRange()
          .createContextualFragment(btnHtml);
        let btn = btnFragment.querySelector("button");

        btn.addEventListener("click", async (e) => {
          let inputsData = [];
          inputs.forEach((input) => {
            let value = null;
            if (input.type === "checkbox") {
              value = modalContainer.querySelector(
                `input[name="${input.name}"]`
              ).checked;
            } else if (input.type === "password" || input.type === "text") {
              value = modalContainer.querySelector(
                `input[name="${input.name}"]`
              ).value;
            } else if (input.type === "select") {
              value = modalContainer.querySelector(
                `select[name="${input.name}"]`
              ).value;
            } else if (input.type === "list") {
              let listElement = modalContainer.querySelector(
                `div[name="${input.name}"] .active`
              );
              value = listElement
                ? listElement.getAttribute("data-value")
                : null;
            }
            inputsData.push({ [input.name]: value });
          });

          let buttonIndex = e.target.getAttribute("data-default");
          result.buttonIndex = buttonIndex;
          result.inputsData = inputsData;

          if (button.callback && typeof button.callback === "function") {
            await button.callback(result, this);
          }

          if (button.closeOnClick) {
            this.hide();
          }
        });
        modalFooter.appendChild(btnFragment);
        btnIndex++;
      });

      resolve();
    });
  }

  async _createModal() {
    return new Promise(async (resolve, reject) => {
      let modalHtml = `
        <div class="modal hidden${this.options.protected ? " protected" : ""}${
        this.options.size ? ` modal-size-${this.options.size}` : ""
      }" style="width: ${this.options.width}; height: ${this.options.height};">
          <div class="modal-close-button">
            <div class="button">x</div>
          </div>
          <div class="modal-header">
            <img class="modal-header-img" src="${this.options.icon || ""}">
            <div class="modal-header-title">${this.options.title}</div>
          </div>
          <div class="modal-content">
            <div class="container">${
              this.options.content ||
              (typeof this._createContent === "function"
                ? this._createContent()
                : "")
            }</div>
            <div class="modal-footer"></div>
          </div>
        </div>
      `;

      let modalFragment = document
        .createRange()
        .createContextualFragment(modalHtml);
      let modal = modalFragment.querySelector(".modal");
      let modalCloseButton = modal.querySelector(".modal-close-button");
      let modalContainer = modal.querySelector(".container");
      let modalFooter = modal.querySelector(".modal-footer");
      let modalHeaderIcon = modal.querySelector(".modal-header-img");
      let modalHeaderTitle = modal.querySelector(".modal-header-title");

      if (this.options.closeable === false) {
        modalCloseButton.classList.add("disabled");
      } else {
        modalCloseButton.addEventListener("click", () => {
          this.hide();
        });
      }

      document.body.appendChild(modal);

      if (this.options.moveable) {
        UiUtils.dragElement(modal);
      }

      // Close modal when the Esc key is pressed
      const handleEscKey = (e) => {
        if (e.key === "Escape" && !modal.classList.contains("hidden")) {
          this.hide();
        }
      };
      document.addEventListener("keydown", handleEscKey);

      resolve({
        modal,
        modalParts: {
          modalHeaderIcon,
          modalContainer,
          modalFooter,
          modalHeaderTitle,
          modalCloseButton
        }
      });
    });
  }

  _createOverlay() {
    let overlay = document.querySelector(".overlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.className = "overlay hidden";
      document.body.appendChild(overlay);
    }
    return overlay;
  }

  _toggleOverlay(show) {
    let overlay = this._createOverlay();
    overlay.style.opacity = show ? "1" : "0";
    overlay.classList.toggle("hidden", !show);
  }

  _remove() {
    if (this.options.overlay) {
      this._toggleOverlay(false);
    }
    this.element.modal.remove();
  }

  // Exposed Methods

  getElement() {
    return this.element.modal;
  }

  setContent(args) {
    let { type, content } = args;
    if (type === "html") {
      this.getElement().innerHTML = content;
    } else if (type === "template") {
      this._setContentFromTemplate(content);
    }
  }

  setTitle(title) {
    this.element.modalParts.modalHeaderTitle.innerText = title;
  }

  show() {
    this.ready.then(() => {
      if (typeof this.options.onShow === "function") {
        this.options.onShow({ modal: this.element.modal });
      }

      if (this.options.overlay) {
        this._toggleOverlay(true);
      }
      this.element.modal.classList.remove("hidden");
      setTimeout(() => {
        this.element.modal.style.opacity = "1";
      }, 100);
    });
  }

  hide() {
    if (typeof this.options.onHide === "function") {
      this.options.onHide({ modal: this.element.modal });
    }
    if (this.options.overlay) {
      this._toggleOverlay(false);
    }
    this.element.modal.style.opacity = "0";
    setTimeout(() => {
      this.element.modal.classList.add("hidden");
    }, 300);
  }

  remove() {
    let cancel = false;
    let eventObj = { cancel: () => (cancel = true), modal: this.element.modal };
    if (typeof this.options.onRemove === "function") {
      this.options.onRemove(eventObj);
    }

    if (!cancel) {
      this._remove();
    }
  }
}

class ModalPopUp extends Modal {
  constructor(popUpTemplate) {
    super();
    this.popUpTemplate = popUpTemplate;
    this.popUpResolve = null;

    this.ready = this._initPopUp();
  }

  async _initPopUp() {
    return new Promise(async (resolve) => {
      await this._initModal();
      resolve();
    });
  }

  async _initModal() {
    return new Promise(async (resolve) => {
      this.element = await this._createModal();
      if (this.popUpTemplate) {
        await this._createPopupContent(this.popUpTemplate);
      }
      resolve();
    });
  }

  async _createPopupContent(template) {
    let { modalHeaderIcon, modalContainer, modalFooter, modalCloseButton } =
      this.element.modalParts;
    let modal = this.element.modal;
    let inputs = template.inputs || [];

    let title = template.title || Locales.get(`modal.title.${template.type}`);

    return new Promise((resolve) => {
      this.setTitle(title);

      if (template.icon) {
        modalHeaderIcon.src =
          template.icon.type === "svg"
            ? URL.createObjectURL(
                new Blob([template.icon.data], { type: "image/svg+xml" })
              )
            : template.icon;
      }

      if (template.width) {
        modal.style.width = template.width;
      }

      if (template.height) {
        modal.style.width = template.width;
      }

      if (template.size) {
        modal.classList.add(`modal-size-${template.size}`);
      }

      modal.classList.add("modal-popup");

      modalCloseButton.addEventListener("click", () => {
        if (template.onClose && typeof template.onClose === "function") {
          template.onClose(this);
        }
        if (this.popUpResolve) {
          this.popUpResolve({ buttonIndex: null, cancelled: true });
        }
        this.hide();
      });

      let contentHtml = `
        ${
          template.image ? `<img class="img-icon" src="${template.image}">` : ""
        }
        <p style="text-align: center; ${
          template.type === "module"
            ? "line-height: 16px;"
            : "line-height: 20px;"
        }">${template.message || ""}</p>
        <p style="font-size: 10px; line-height: 14px;">${
          template.detail || ""
        }</p>
        <div class="inputs-group">
          ${inputs
            .map(
              (input) => `
            ${
              input.label
                ? `<label ${
                    typeof input.label == "object" && input.label.style
                      ? `style="${input.label.style}"`
                      : ""
                  }>${
                    typeof input.label == "object"
                      ? input.label.text
                      : input.label
                  }${
                    input.type === "checkbox" ? '<input type="checkbox">' : ""
                  }</label>`
                : ""
            }
            ${
              input.type === "password" || input.type === "text"
                ? `<input type="${input.type}" name="${
                    input.name
                  }" placeholder="${input.placeholder || ""}" ${
                    input.required ? "required" : ""
                  } ${input.value ? `value="${input.value}"` : ""} ${
                    input.autocomplete
                      ? `list="autocomplete-${input.name}"`
                      : ""
                  }>`
                : ""
            }
            ${
              input.autocomplete
                ? `<datalist id="autocomplete-${
                    input.name
                  }">${input.autocomplete
                    .map((value) => `<option value="${value}"></option>`)
                    .join("")}</datalist>`
                : ""
            }
            ${
              input.type === "select"
                ? `
              <section class="custom-select">
                <select name="${input.name}">${
                    input.options
                      ? input.options
                          .map(
                            (user) =>
                              `<option value="${user.id}">${user.login}</option>`
                          )
                          .join("")
                      : ""
                  }</select>
              </section>
            `
                : ""
            }
            ${
              input.type === "list"
                ? `
              <div class="contextMenu-Tab" name="${input.name}">
                ${
                  input.options
                    ? input.options
                        .map(
                          (user) => `
                  <div class="context-Item" data-value="${user.id}">
                    <div class="title">${user.login}</div>
                  </div>
                `
                        )
                        .join("")
                    : ""
                }
              </div>
            `
                : ""
            }
          `
            )
            .join("")}
        </div>
      `;

      modalContainer.innerHTML = contentHtml;

      if (modalContainer.querySelector(".custom-select")) {
        UiUtils.initializeSelects(
          modalContainer.querySelector(".custom-select")
        );
      }

      modalContainer.querySelectorAll(".context-Item").forEach((item) => {
        item.addEventListener("click", (e) => {
          let parent = e.target.closest(".contextMenu-Tab");
          let activeItem = parent.querySelector(".active");
          if (activeItem && activeItem !== e.target.closest(".context-Item")) {
            activeItem.classList.remove("active");
          }
          e.target.closest(".context-Item").classList.add("active");
        });
      });

      let inputsData = [];
      let result = {};
      let btnIndex = 0;

      template.buttons.forEach((button) => {
        let btnHtml = `
          <div class="btn-wrapper${
            button.type === "btn-green"
              ? " btn-wrapper-green"
              : button.type === "btn-red"
              ? " btn-wrapper-red"
              : ""
          }">
            <button class="btn${button.type ? ` ${button.type}` : ""}" ${
          button.role ? `data-role="${button.role}"` : ""
        } data-default="${btnIndex}" ${button.disabled ? "disabled" : ""}>${
          button.text
        }</button>
          </div>
        `;

        let btnFragment = document
          .createRange()
          .createContextualFragment(btnHtml);
        let btn = btnFragment.querySelector("button");

        btn.addEventListener("click", (e) => {
          let aborted = false;
          inputs.forEach((input) => {
            if (input.required) {
              let inputElement = modalContainer.querySelector(
                `input[name="${input.name}"]`
              );

              if (inputElement.value.length <= 0) {
                inputElement.style.border = "1px solid red";
                aborted = true;
              }
            }
            let value = null;
            if (input.type === "checkbox") {
              value = modalContainer.querySelector(
                `input[name="${input.name}"]`
              ).checked;
            } else if (input.type === "password" || input.type === "text") {
              value = modalContainer.querySelector(
                `input[name="${input.name}"]`
              ).value;
            } else if (input.type === "select") {
              value = modalContainer.querySelector(
                `select[name="${input.name}"]`
              ).value;
            } else if (input.type === "list") {
              let listElement = modalContainer.querySelector(
                `div[name="${input.name}"] .active`
              );
              value = listElement
                ? listElement.getAttribute("data-value")
                : null;
            }
            inputsData.push({ [input.name]: value });
          });

          let buttonIndex = e.target.getAttribute("data-default");
          result.buttonIndex = buttonIndex;
          result.inputsData = inputsData;

          if (
            e.target.getAttribute("data-role") == "abort" ||
            (this.popUpResolve && !aborted)
          ) {
            this.popUpResolve(result);
            this.hide();
          }
        });
        modalFooter.appendChild(btnFragment);
        btnIndex++;
      });

      resolve();
    });
  }

  async popUp() {
    return new Promise((resolve) => {
      this.ready.then(() => {
        this.popUpResolve = resolve;
        this.show();
      });
    });
  }
}

module.exports = {
  Modal,
  ModalPopUp
};
