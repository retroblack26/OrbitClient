class PinkGalaxyMiddleware {
  constructor(ipcRouter) {
    this.ipcRouter = ipcRouter;
  }

  match(url) {
    const regex = /^https?:\/\/(?:\w+\.)*pinkgalaxy\.net(?:\/|$)/;
    return regex.test(url);
  }

  async handle() {
    this.loadUserInfos();
  }

  loadUserInfos() {
    try {
      let userInfosDiv = document
        .querySelector(".user.styleUpdate")
        .querySelector(".infos");

      if (userInfosDiv) {
        let tabID = sessionStorage.getItem("viewID");
        let accountUsername =
          document.getElementsByClassName("username")[0].innerText;

        let accountRankIcon = userInfosDiv.getElementsByTagName("img")[1].src;

        let infos = {
          title: accountUsername,
          rankIcon: accountRankIcon
        };

        this.ipcRouter.core.setUserInfo(infos, tabID);
      }
    } catch (e) {}
  }
}
module.exports = PinkGalaxyMiddleware;
