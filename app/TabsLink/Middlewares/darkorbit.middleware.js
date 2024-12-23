const Utils = require("../../Utils/Utils");
const server_list = [
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
];

class DarkOrbitMiddleware {
  constructor(ipcRouter, options, core) {
    this.core = core;
    this.ipcRouter = ipcRouter;
    this.options = options;
  }

  match(url) {
    const regex = /^https?:\/\/(?:\w+\.)*darkorbit\.com(?:\/|$)/;
    return regex.test(url);
  }

  async handle(url) {
    return new Promise(async (resolve) => {
      //Patch for consent bug
      /*  window.__gpp = function () {
        return true;
      }; */

      if (
        this.options.autoLogin == true &&
        sessionStorage.getItem("viewID") == 1 &&
        window.location.pathname == "/"
      ) {
        let result = await this.ipcRouter.core.autoFill(0, true);
        this.core.autoFill(result);
      }

      if (
        this.options.detectSID == true &&
        window.location.pathname == "/" &&
        Utils.validateSID(Utils.getClipboardString())
      ) {
        if (!this.modalOpen) {
          const options = {
            message: this.options.locale["modal.sidLoggin.message"],
            title: this.options.locale["modal.sidLoggin.title"],
            buttons: [
              {
                text: this.options.locale["modal.button.confirm"],
                type: "btn-green"
              },
              {
                text: this.options.locale["modal.button.cancel"],
                type: "btn-red"
              }
            ],
            type: "info",
            defaultId: 0,
            detail: this.options.locale["modal.sidLoggin.detail"],
            size: "small",
            inputs: [
              {
                type: "text",
                autocomplete: server_list,
                name: "server",
                placeholder:
                  this.options.locale["modal.sidLoggin.input.placeholder"]
              }
            ]
          };
          this.modalOpen = true;
          let result = await this.ipcRouter.core.popUp(options, 1);
          if (result.buttonIndex == 0) {
            this.ipcRouter.main
              .sidLogin(
                Utils.getClipboardString(),
                result.inputsData[0].server,
                sessionStorage.getItem("partition")
              )
              .then((res) => {
                if (!res) {
                  throw new Error("Server invalid (empty)");
                }
                window.location.href = `https://${result.inputsData[0].server}.darkorbit.com/indexInternal.es?action=internalStart`;
              });
          }
        }
      }
      this.loadUserInfos();

      resolve();
    });
  }

  loadUserInfos() {
    let userInfosDiv = document.getElementById("userInfoSheet");

    if (userInfosDiv) {
      let tabID = sessionStorage.getItem("viewID");
      let rawUsername =
        document.getElementsByClassName("userInfoLine")[0].innerText;
      let accountUsername = rawUsername.substring(
        rawUsername.indexOf(":") + 1,
        rawUsername.length
      );
      let accountRankIcon = document
        .getElementsByClassName("userInfoLine")[2]
        .getElementsByTagName("img")[0].src;

      let infos = {
        title: accountUsername,
        rankIcon: accountRankIcon
      };

      this.ipcRouter.core.setUserInfo(infos, tabID);
    }
  }
}
module.exports = DarkOrbitMiddleware;
