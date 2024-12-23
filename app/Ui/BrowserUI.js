const Locales = require("../Locales");
const PluginConsoleUi = require("./Developpers/PluginConsoleUI");
const Config = new (require("../Models/Config"))();
const BookmarksBar = require("./BookmarksBar.js");
const { ShortcutManager } = require("./Shortcut.js");
const { Modal, ModalPopUp } = require("./Modal.js");
const SettingsModal = require("../Modals/SettingsModal.js");
const MasterPasswordModal = require("../Modals/MasterPasswordModal.js");
const { CustomTableManager } = require("./CustomTable.js");
const UserOnboarding = require("./UserOnBoarding.js");
const Utils = require("../Utils/Utils.js");

class BrowserUI {
  constructor(core) {
    this.core = core;

    //Window Buttons
    this.minButton = document.getElementById("min-button");
    this.maxButton = document.getElementById("max-button");
    this.restoreButton = document.getElementById("restore-button");
    this.closeButton = document.getElementById("close-button");
    this.alwaysOnTopButton = document.getElementById("alwaysTop-btn");
    //Tooltip Buttons
    this.fullScreenButton = document.getElementById(
      "fullscreen-tooltip-button"
    );
    this.zoomInButton = document.getElementById("zoomIn-tooltip-button");
    this.zoomOutButton = document.getElementById("zoomOut-tooltip-button");
    this.settingsButton = document.getElementById("settings-tooltip-button");
    this.loadingTextObject = document.querySelector("#loading-overlay span");

    this.pluginConsoleUI = new PluginConsoleUi();
    this.bookmarksBar = new BookmarksBar(core);
    this.shortcutsManager = new ShortcutManager();
    this.tableManager = new CustomTableManager();

    this.modalListeners = new Map();
    this.settingsModal = new SettingsModal(this.core);
    this.masterPasswordModal = new MasterPasswordModal(this.core);

    this.initShortcuts();
    this.initWindowControls();
    this.initializeModals();

    this.ready = this.initUi;

    if (Config.get("ui").animations == false) {
      document.body.classList.add("no-animations");
    }

    document.getElementById("browser-header-mask").style.opacity = "1";
    document.getElementById("browser-header").style.opacity = "1";
    document.getElementById("nav-body-tabs").style.opacity = "1";
    document.getElementById("nav-body-views").style.opacity = "1";
  }

  initWindowControls() {
    this.minButton.addEventListener("click", () => {
      this.core.ipcRouter.main.windowAction({ action: "minimize" });
    });

    this.alwaysOnTopButton.addEventListener("click", () => {
      if (!this.alwaysOnTopButton.classList.contains("active")) {
        this.alwaysOnTopButton.classList.add("active");
        this.core.ipcRouter.main.windowAction({
          action: "setAlwaysOnTop",
          args: true
        });
      } else {
        this.alwaysOnTopButton.classList.remove("active");
        this.core.ipcRouter.main.windowAction({
          action: "setAlwaysOnTop",
          args: false
        });
      }
    });

    this.maxButton.addEventListener("click", () => {
      this.windowMaximize();
      this.core.ipcRouter.main.windowAction({ action: "maximize" });
    });
    this.restoreButton.addEventListener("click", () => {
      this.windowUnMaximize();
      this.core.ipcRouter.main.windowAction({ action: "unmaximize" });
    });
    this.closeButton.addEventListener("click", () => {
      this.core.closeApp();
    });
  }

  initializeTutorial() {
    let modalOldLeft = null;
    if (Config.get("updatedNow") == true) {
      updater.getUpdateNote(Config.get("language")).then((updateNoteSteps) => {
        if (updateNoteSteps.tutorial) {
          const updateOnBoarding = new UserOnboarding(
            updateNoteSteps.tutorial,
            {
              autoAdvance: false,
              nextLabel: Locales.get("next.tooltip.button"),
              prevLabel: Locales.get("previous.tooltip.button"),
              skipLabel: Locales.get("modal.button.later"),
              doneLabel: Locales.get("app.quit"),
              globalTitle: updateNoteSteps.title,
              customAnimation: (element, onComplete) => {
                // Implement custom animation here, e.g., fade in/out
                element.style.opacity = "0";
                setTimeout(() => {
                  element.style.opacity = "1";
                  onComplete();
                }, 500);
              },
              onDismissCallback: (stepNumber) => {},
              interactiveElements: ["#settings-tooltip-button"],
              closeButtonCallback: (stepNumber) => {
                this.modalListeners
                  .get("quitTutorial")
                  .popUp()
                  .then((result) => {
                    if (result.buttonIndex == 0) {
                      onboarding.dismiss();
                    } else {
                      onboarding.complete();
                    }
                  });
              },
              beforeStepCallback: (stepNumber) => {
                let stepAction = updateNoteSteps.tutorial.find(
                  (step) => step.number === stepNumber
                );
                if (typeof stepAction.beforeAction !== "undefined") {
                  try {
                    eval(stepAction.beforeAction);
                  } catch (error) {
                    console.log(
                      `Error when executing tutorial step action: ${error}`
                    );
                  }
                }
              },
              afterStepCallback: (stepNumber) => {
                let stepAction = updateNoteSteps.tutorial.find(
                  (step) => step.number === stepNumber
                );
                if (typeof stepAction.afterAction !== "undefined") {
                  try {
                    eval(stepAction.afterAction);
                  } catch (error) {
                    console.log(
                      `Error when executing tutorial step action: ${error}`
                    );
                  }
                }
              },
              onCompleteCallback: (dismissed) => {
                if (dismissed === false) {
                  Config.set("updatedNow", false);
                }
              }
            }
          );
          updateOnBoarding.start();
        }
      });
    }
    if (Config.get("modal").showTutorial === true) {
      const onboarding = new UserOnboarding(this.loadTutorialSteps(), {
        autoAdvance: false,
        nextLabel: Locales.get("next.tooltip.button"),
        prevLabel: Locales.get("previous.tooltip.button"),
        skipLabel: Locales.get("modal.button.later"),
        doneLabel: Locales.get("app.quit"),
        globalTitle: Locales.get("tutorial.title"),
        customAnimation: (element, onComplete) => {
          // Implement custom animation here, e.g., fade in/out
          element.style.opacity = "0";
          setTimeout(() => {
            element.style.opacity = "1";
            onComplete();
          }, 500);
        },
        onDismissCallback: (stepNumber) => {
          Config.set("tutorialStep", stepNumber);
        },
        interactiveElements: ["#settings-tooltip-button"],
        closeButtonCallback: (stepNumber) => {
          this.modalListeners
            .get("quitTutorial")
            .popUp()
            .then((result) => {
              if (result.buttonIndex == 0) {
                onboarding.dismiss();
              } else {
                onboarding.complete();
              }
            });
        },
        beforeStepCallback: async (stepNumber) => {
          switch (stepNumber) {
            case 2:
              await this.core.navigation.newTab(Config.get("newTabURL"), {
                icon: global.appPath + "/icon.ico"
              });
              break;
            case 3:
              this.core.navigation.splitTabs(
                document.querySelector(".nav-tabs-tab.active"),
                document.querySelector('.nav-tabs-tab[data-session="1"]')
              );
              break;
            case 4:
              document.getElementById("collapse-tooltip-button").click();
              break;
            case 5:
              document.getElementById("more-tooltip-button").click();
              break;
            case 8:
              document.getElementById("settings-tooltip-button").click();
              let settingsModalElement = this.settingsModal.element.modal;
              modalOldLeft = settingsModalElement.style.left;
              settingsModalElement.style.left = "920px";
              document
                .getElementsByClassName("pc-tab")[0]
                .querySelector('input[id="tab2"]')
                .click();
              break;
            case 9:
              document
                .getElementsByClassName("pc-tab")[0]
                .querySelector('input[id="tab4"]')
                .click();
              break;
            case 10:
              document
                .getElementsByClassName("pc-tab")[0]
                .querySelector('input[id="tab3"]')
                .click();
              break;
            case 11:
              document
                .getElementsByClassName("tab3")[1]
                .children[0].children[3].children[1].children[1].click();
              break;
          }
        },
        afterStepCallback: (stepNumber, selectValue) => {
          switch (stepNumber) {
            case 0:
              if (!Config.get("tutorialStep")) {
                if (selectValue) {
                  this.core.reloadLocales(selectValue);
                  onboarding.dismiss();
                  this.core.ipcRouter.main.reloadApp();
                }
              }
              break;
            case 1:
              break;
            case 3:
              this.core.navigation.closeTab(2);
              break;
            case 4:
              document.getElementById("collapse-tooltip-button").click();
              break;
            case 8:
              break;
            case 11:
              this.settingsModal.hide();
              if (modalOldLeft !== null) {
                this.settingsModal.element.modal.style.left = modalOldLeft;
              }
              break;
          }
        },
        onCompleteCallback: (dismissed) => {
          if (dismissed === false) {
            Config.set("modal", { showTutorial: false });
          }
        }
      });

      let step = 0;
      if (Config.get("tutorialStep")) {
        step = Config.get("tutorialStep");
      }
      onboarding.start(step);
    }
  }

  loadTutorialSteps() {
    const languages = [
      { value: "de_DE", label: "Deutsch" },
      { value: "en_UK", label: "English UK" },
      { value: "fr_FR", label: "Français" },
      { value: "en_US", label: "English US" },
      { value: "es_ES", label: "Español" },
      { value: "sv_SE", label: "Svenska" },
      { value: "ru_RU", label: "Pyccĸий" },
      { value: "it_IT", label: "Italiano" },
      { value: "tr_TR", label: "Tϋrkçe" },
      { value: "fi_FI", label: "Suomi" },
      { value: "pl_PL", label: "Polski" },
      { value: "da_DK", label: "Dansk" },
      { value: "pt_PT", label: "Português" },
      { value: "nl_NL", label: "Nederlands" },
      { value: "no_NO", label: "Norsk" },
      { value: "cs_CZ", label: "Čeština" },
      { value: "sk_SK", label: "Slovenčina" },
      { value: "pt_BR", label: "Português BR" },
      { value: "ro_RO", label: "Română" },
      { value: "el_GR", label: "Ελληνικά" },
      { value: "bg_BG", label: "Български" },
      { value: "hu_HU", label: "Magyar" },
      { value: "co_CO", label: "Colombia" },
      { value: "ve_VE", label: "Venezuela" },
      { value: "cl_CL", label: "Chile" },
      { value: "ar_AR", label: "Argentina" },
      { value: "pe_PE", label: "Perú" },
      { value: "ja_JP", label: "日本語" },
      { value: "ko_KR", label: "한국어" }
    ];

    return [
      {
        //0
        intro: Locales.get("tutorial.step1.message"),
        title: Locales.get("tutorial.step1.title"),
        caracter: "caracter3",
        position: "center",
        selectOptions: languages,
        selectName: "country",
        selectedValue: Config.get("language")
      },
      {
        //1
        title: Locales.get("tutorial.step2.title"),
        caracter: "caracter3",
        position: "center",
        intro: Locales.get("tutorial.step2.message")
      },
      {
        //2
        title: Locales.get("tutorial.step3.title"),
        caracter: "caracter3",
        elements: ["#nav-body-tabs"],
        intro: Locales.get("tutorial.step3.message"),
        position: "center"
      },
      {
        //3
        title: Locales.get("tutorial.step4.title"),
        caracter: "caracter1",
        elements: [
          "#nav-body-tabs",
          '.nav-tabs-tab[data-session="2"]',
          "#nav-body-views"
        ],
        intro: Locales.get("tutorial.step4.message"),
        position: "center"
      },
      {
        //4
        title: Locales.get("tutorial.step5.title"),
        caracter: "caracter2",
        intro: Locales.get("tutorial.step5.message"),
        images: ["test.png", "test2.png"],
        position: "center"
      },
      {
        //5
        title: Locales.get("tutorial.step6.title"),
        caracter: "caracter2",
        elements: ["#more-tooltip-button", "#OptionsContainer"],
        intro: Locales.get("tutorial.step6.message"),
        position: "center"
      },
      {
        //6
        title: Locales.get("tutorial.step7.title"),
        caracter: "caracter2",
        intro: Locales.get("tutorial.step7.message"),
        images: ["screenConnect.png"],
        position: "center"
      },
      {
        //7
        title: Locales.get("tutorial.step8.title"),
        caracter: "caracter3",
        intro: Locales.get("tutorial.step8.message"),
        position: "center"
      },
      {
        //8
        //Open settings -> Credentials
        title: Locales.get("tutorial.step9.title"),
        caracter: "caracter3",
        elements: [".modal"],
        intro: Locales.get("tutorial.step9.message"),
        position: "left"
      },
      {
        //9
        //Open settings -> Users
        title: Locales.get("tutorial.step10.title"),
        caracter: "caracter3",
        elements: [".modal"],
        intro: Locales.get("tutorial.step10.message"),
        position: "left"
        //Open settings -> General
      },
      {
        //10
        title: Locales.get("tutorial.step11.title"),
        caracter: "caracter3",
        elements: [".modal"],
        intro: Locales.get("tutorial.step11.message"),
        position: "left"
      },
      {
        //11
        title: Locales.get("tutorial.step12.title"),
        caracter: "caracter3",
        elements: [".modal", 'section[value="autoLogin"]'],
        intro: Locales.get("tutorial.step12.message"),
        position: "left"
      },
      {
        //12
        //On NewTab
        title: Locales.get("tutorial.step13.title"),
        caracter: "caracter1",
        intro: Locales.get("tutorial.step13.message"),
        images: ["image.png"],
        position: "center"
      },
      {
        //13
        title: Locales.get("tutorial.step14.title"),
        caracter: "caracter3",
        intro: Locales.get("tutorial.step14.message"),
        position: "center"
      }
      // Add more steps as needed
    ];
  }

  initializeModals() {
    let forceSidLogin = {
      title: Locales.get("modal.forceSidLoggin.title"),
      onClose: (modal) => {
        modal.hide();
      },
      buttons: [
        {
          text: Locales.get("modal.button.confirm"),
          type: "btn-green",
          callback: async (result, modal) => {
            if (
              result.inputsData[1].server.length <= 0 ||
              result.inputsData[0].sid.length <= 0
            ) {
              await new ModalPopUp({
                message: Locales.get("modal.forceSidLoggin.empty.message"),
                buttons: [{ text: Locales.get("modal.button.confirm") }],
                type: "error",
                icon: "themes/warning.svg",
                size: "small",
                defaultId: 0
              }).popUp();
              return;
            }

            if (!Utils.validateSID(result.inputsData[0].sid)) {
              await new ModalPopUp({
                message: Locales.get("modal.forceSidLoggin.invalid.message"),
                buttons: [{ text: Locales.get("modal.button.confirm") }],
                type: "error",
                icon: "themes/warning.svg",
                size: "small",
                defaultId: 0
              }).popUp();
              return;
            }

            this.core.ipcRouter.main.sidLogin(
              result.inputsData[0].sid,
              result.inputsData[1].server,
              this.core.navigation.getCurrentTab().getAttribute("partition")
            );
            let backendUrl = `https://${result.inputsData[1].server}.darkorbit.com/indexInternal.es?action=internalStart`;
            this.core.navigation.handleUserAgent(backendUrl);
            this.core.navigation.getCurrentTab().loadURL(backendUrl);
            modal.hide();
          }
        }
      ],
      icon: "themes/key.svg",
      type: "module",
      defaultId: 0,
      size: "small",
      command: "sidLogin",
      inputs: [
        {
          label: { text: "SID:", style: "text-align:center;" },
          type: "text",
          name: "sid",
          placeholder: "424cs04392e4dfa8552dba83939a238dd"
        },
        {
          label: { text: "Server:", style: "text-align:center;" },
          type: "text",
          autocomplete: [
            "INT1",
            "INT2",
            "INT3",
            "INT4",
            "INT5",
            "INT6",
            "INT7",
            "INT8",
            "INT10",
            "INT11",
            "INT12",
            "INT13",
            "INT14",
            "INT15",
            "DE1",
            "DE2",
            "DE3",
            "DE4",
            "DE5",
            "DE6",
            "DE7",
            "US1",
            "US2",
            "US3",
            "US4",
            "GB1",
            "GB2",
            "FR1",
            "FR2",
            "FR3",
            "FR4",
            "ES1",
            "ES2",
            "ES3",
            "ES4",
            "MX1",
            "IT1",
            "IT2",
            "IT3",
            "PL1",
            "PL2",
            "PL3",
            "CZ1",
            "CZ2",
            "CZ3",
            "RU1",
            "RU2",
            "RU3",
            "RU4",
            "RU5",
            "RU6",
            "TR1",
            "TR2",
            "TR3",
            "TR4",
            "TR5",
            "TR6",
            "BR1",
            "BR2",
            "HU1",
            "TEST1",
            "TEST2"
          ],
          name: "server",
          placeholder: Locales.get("modal.sidLoggin.input.placeholder")
        }
      ]
    };

    let reportBug = {
      message: Locales.get("modal.bugReport.message"),
      title: Locales.get("modal.bugReport.title"),
      onClose: (modal) => {
        modal.hide();
      },
      buttons: [
        { text: Locales.get("modal.button.confirm") },
        { text: Locales.get("modal.button.cancel") }
      ],
      type: "info",
      defaultId: 0,
      size: "small",
      icon: {
        type: "svg",
        data: '<svg width="16px" height="16px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M19 15V11.9375C19 9.76288 17.2371 8 15.0625 8H8.9375C6.76288 8 5 9.76288 5 11.9375V15C5 18.866 8.13401 22 12 22C15.866 22 19 18.866 19 15Z" stroke="#ffffff" stroke-width="1.5"></path><path d="M16.5 8.5V7.5C16.5 5.01472 14.4853 3 12 3C9.51472 3 7.5 5.01472 7.5 7.5V8.5" stroke="#ffffff" stroke-width="1.5"></path><path opacity="0.5" d="M19 14H22" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"></path><path opacity="0.5" d="M5 14H2" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"></path><path opacity="0.5" d="M14.5 3.5L17 2" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"></path><path opacity="0.5" d="M9.5 3.5L7 2" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"></path><path opacity="0.5" d="M20.5 20.0002L18.5 19.2002" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"></path><path opacity="0.5" d="M20.5 7.9998L18.5 8.7998" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"></path><path opacity="0.5" d="M3.5 20.0002L5.5 19.2002" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"></path><path opacity="0.5" d="M3.5 7.9998L5.5 8.7998" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"></path><path opacity="0.5" d="M12 21.5V15" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"></path></g></svg>'
      }
    };

    let quitTutorial = {
      onClose: (modal) => {
        modal.hide();
      },
      message: Locales.get("tutorial.quitMessage"),
      buttons: [
        { text: Locales.get("modal.button.later") },
        { text: Locales.get("app.quit") }
      ],
      type: "info",
      size: "small",
      defaultId: 0
    };

    let quitApp = {
      onClose: (modal) => {
        modal.hide();
      },
      message: Locales.get("app.modalQuit.message"),
      title: Locales.get("app.modalQuit.title"),
      buttons: [
        { text: Locales.get("modal.button.confirm"), type: "btn-green" },
        { text: Locales.get("modal.button.cancel"), type: "btn-red" }
      ],
      type: "info",
      icon: "themes/quit.svg"
    };

    this.modalListeners.set(
      "forceSidLogin",
      new Modal({ template: forceSidLogin, size: "small" })
    );
    this.modalListeners.set("reportBug", new ModalPopUp(reportBug));
    this.modalListeners.set("quitTutorial", new ModalPopUp(quitTutorial));
    this.modalListeners.set("quitApp", new ModalPopUp(quitApp));
  }

  /* The above code is a JavaScript function called `initializeToolTips` that adds tooltips to elements
    with the class "tooltip". */
  initializeToolTips() {
    const tooltips = document.querySelectorAll(".tooltip");

    tooltips.forEach(function (tooltip) {
      const tooltipText = tooltip.getAttribute("data-tooltip");
      const tooltipBox = document.createElement("div");
      tooltipBox.className = "tooltip-box";
      tooltipBox.innerText = tooltipText;
      document.body.appendChild(tooltipBox);

      tooltip.addEventListener("mouseover", function () {
        const rect = tooltip.getBoundingClientRect();
        const boxRect = tooltipBox.getBoundingClientRect();
        let top = rect.top - boxRect.height - 6;
        let left = rect.left + (rect.width - boxRect.width) / 2;

        // Check for overflow on the top
        if (top < 0) {
          top = rect.bottom + 3;
        }

        // Check for overflow on the left
        if (left < 0) {
          left = 10;
        }

        // Check for overflow on the right
        if (left + boxRect.width > window.innerWidth) {
          left = window.innerWidth - boxRect.width - 10;
        }

        tooltipBox.style.top = top + "px";
        tooltipBox.style.left = left + "px";
        tooltipBox.style.opacity = "1";
      });

      tooltip.addEventListener("mouseout", function () {
        tooltipBox.style.opacity = "0";
      });
    });
  }

  initShortcuts() {
    this.mainShortcut = this.shortcutsManager.createContainer(
      "more-tooltip-button",
      "optionsContainer"
    );

    this.shortcutsManager.createContainer(
      "showOverFlow-tooltip-button",
      "tabListContainer"
    );
    this.shortcutsManager.createContainer(
      "more-bookmarks-button",
      "overflowBookmarksContainer"
    );

    this.mainShortcut.addItem({
      name: Locales.get("context.item.forceSID"),
      icon: {
        type: "svg",
        data: `<svg width="14px" height="14px" viewBox="0 0 24 24" fill="none"
            xmlns="http://www.w3.org/2000/svg">
            <g stroke-width="0"></g>
            <g stroke-linecap="round" stroke-linejoin="round"></g>
            <g>
                <path fill-rule="evenodd" clip-rule="evenodd"
                    d="M20 23L12 23C11.4477 23 11 22.5523 11 22C11 21.4477 11.4477 21 12 21L20 21C20.5523 21 21 20.5523 21 20L21 4C21 3.44771 20.5523 3 20 3L12 3C11.4477 3 11 2.55228 11 2C11 1.44772 11.4477 1 12 1L20 0.999999C21.6569 0.999999 23 2.34315 23 4L23 20C23 21.6569 21.6569 23 20 23Z"
                    fill="#ffffff"></path>
                <path fill-rule="evenodd" clip-rule="evenodd"
                    d="M18.6881 10.6901C19.3396 11.4418 19.3396 12.5581 18.6881 13.3098L14.5114 18.1291C13.2988 19.5282 11 18.6707 11 16.8193L11 15L5 15C3.89543 15 3 14.1046 3 13L3 11C3 9.89541 3.89543 8.99998 5 8.99998L11 8.99998L11 7.18071C11 5.3293 13.2988 4.47176 14.5114 5.87085L18.6881 10.6901ZM16.6091 12.6549C16.9348 12.279 16.9348 11.7209 16.6091 11.345L13 7.18071L13 9.49998C13 10.3284 12.3284 11 11.5 11L5 11L5 13L11.5 13C12.3284 13 13 13.6716 13 14.5L13 16.8193L16.6091 12.6549Z"
                    fill="#ffffff"></path>
            </g>
        </svg>`
      },
      callback: () => {
        this.modalListeners.get("forceSidLogin").show();
      }
    });

    this.mainShortcut.addItem({
      name: Locales.get("context.item.reportBug"),
      icon: {
        type: "svg",
        data: `<svg width="16px" height="16px" viewBox="0 0 24 24" fill="none"
            xmlns="http://www.w3.org/2000/svg">
            <g stroke-width="0"></g>
            <g stroke-linecap="round" stroke-linejoin="round"></g>
            <g>
                <path
                    d="M19 15V11.9375C19 9.76288 17.2371 8 15.0625 8H8.9375C6.76288 8 5 9.76288 5 11.9375V15C5 18.866 8.13401 22 12 22C15.866 22 19 18.866 19 15Z"
                    stroke="#ffffff" stroke-width="1.5"></path>
                <path d="M16.5 8.5V7.5C16.5 5.01472 14.4853 3 12 3C9.51472 3 7.5 5.01472 7.5 7.5V8.5"
                    stroke="#ffffff" stroke-width="1.5"></path>
                <path opacity="0.5" d="M19 14H22" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round">
                </path>
                <path opacity="0.5" d="M5 14H2" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round">
                </path>
                <path opacity="0.5" d="M14.5 3.5L17 2" stroke="#ffffff" stroke-width="1.5"
                    stroke-linecap="round"></path>
                <path opacity="0.5" d="M9.5 3.5L7 2" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round">
                </path>
                <path opacity="0.5" d="M20.5 20.0002L18.5 19.2002" stroke="#ffffff" stroke-width="1.5"
                    stroke-linecap="round"></path>
                <path opacity="0.5" d="M20.5 7.9998L18.5 8.7998" stroke="#ffffff" stroke-width="1.5"
                    stroke-linecap="round"></path>
                <path opacity="0.5" d="M3.5 20.0002L5.5 19.2002" stroke="#ffffff" stroke-width="1.5"
                    stroke-linecap="round"></path>
                <path opacity="0.5" d="M3.5 7.9998L5.5 8.7998" stroke="#ffffff" stroke-width="1.5"
                    stroke-linecap="round"></path>
                <path opacity="0.5" d="M12 21.5V15" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round">
                </path>
            </g>
        </svg>`
      },
      callback: () => {
        this.modalListeners
          .get("reportBug")
          .popUp()
          .then((result) => {
            if (result.buttonIndex == 0) {
              this.core.navigation.newTab("https://discord.gg/HttatHWnW2", {
                close: true
              });
            }
          });
      }
    });

    if (Config.get("devMode") == true) {
      this.mainShortcut.addItem({
        name: Locales.get("context.item.pluginConsole"),
        style: "background: rgba(234, 133,0, 1);",
        icon: {
          type: "svg",
          data: `<svg width="14px" height="14px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="#ffffff" stroke="#ffffff"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M5 6l2.702 2.5L5 11zm0 12l2.702-2.5L5 13zm5-9h10V8H10zm0 7h7v-1h-7zM1 3h22v18H1zm1 17h20V4H2z"></path><path fill="none" d="M0 0h24v24H0z"></path></g></svg>`
        },
        callback: () => {
          this.browser.pluginConsoleUI.show();
        }
      });
    }
  }

  async initUi() {
    this.zoomInButton.addEventListener("click", () => this.zoomIn());

    this.zoomOutButton.addEventListener("click", () => this.zoomOut());

    this.fullScreenButton.addEventListener("click", (e) => {
      if (!this.fullScreenButton.classList.contains("disabled")) {
        this.toggleFullscreen(e);
      }
    });

    this.settingsButton.addEventListener("click", () => {
      this.settingsModal.show();
    });

    if (Config.get("windowBounds").isMax == true) {
      this.windowMaximize();
    } else {
      this.windowUnMaximize();
    }
    window.addEventListener("keyup", (e) => this.toggleFullscreen(e), true);

    this.initializeToolTips();

    this.settingsModal.ready.then(async () => {
      await this.settingsModal.initializeSettings();
      this.settingsModal.loadSettings();
    });

    this.initializeTutorial();
  }

  windowUnMaximize() {
    Config.set("windowBounds", { isMax: false });

    document
      .getElementById("max-button")
      .setAttribute("style", "display:block!important;");
    document
      .getElementById("restore-button")
      .setAttribute("style", "display:none;");
    document.body.classList.remove("maximized");
  }

  windowMaximize() {
    Config.set("windowBounds", { isMax: true });
    document
      .getElementById("max-button")
      .setAttribute("style", "display:none;");
    document
      .getElementById("restore-button")
      .setAttribute("style", "display:block!important;");
    document.body.classList.add("maximized");
  }

  async toggleFullscreen(event) {
    if (event.key === "Escape") {
      this.core.navigation.getCurrentTab().exitFullscreen();
    }
    if (event.type === "click") {
      this.core.navigation.getCurrentTab().requestFullscreen();

      let tabCom = await this.core.ipcRouter.getTabCommunication(
        this.core.navigation.getTab().id
      );
      tabCom.requestFullscreen();
    }
  }

  zoomIn(event) {
    let activeWebView = this.core.navigation.getCurrentTab();
    activeWebView.zoomFactor = activeWebView.getZoomFactor() + 0.2; //1
  }

  zoomOut(event) {
    let activeWebView = this.core.navigation.getCurrentTab();
    activeWebView.zoomFactor = activeWebView.getZoomFactor() - 0.2; //1
  }
}

module.exports = BrowserUI;
