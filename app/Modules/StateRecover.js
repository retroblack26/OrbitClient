class StateRecover {
  constructor(core) {
    this.core = core;
    this.userDatasModel = this.core.userDatasModel;
  }

  async restoreCookies(tab) {
    return new Promise(async (resolve) => {
      const tabPartition = tab.options.partition;
      const tabCookies = tab.options.cookies;
      await this.core.ipcRouter.main.setCookies(tabPartition, tabCookies);
      resolve();
    });
  }

  async saveTabState(tabs, tabsInfos) {
    return new Promise(async (resolve) => {
      const tabStates = [];

      for (const tab of tabs) {
        let cookies = await this.core.ipcRouter.main.getCookies(
          tab.options.partition
        );
        tab.options.cookies = cookies;
        delete tab.webview;
        tabStates.push(tab);
      }
      let saveObj = { tabs: tabStates, tabsInfos: tabsInfos };
      await this.userDatasModel.save(saveObj);
      resolve();
    });
  }
}
module.exports = StateRecover;
