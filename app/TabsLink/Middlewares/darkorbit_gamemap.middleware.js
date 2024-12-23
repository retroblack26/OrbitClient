class DarkOrbit_GameMapMiddleware {
  constructor(ipcRouter) {
    this.ipcRouter = ipcRouter;
  }

  match(url) {
    const regex =
      /^https?:\/\/(?:\w+\.)*darkorbit\.com\/.*internalMapRevolution.*$/;
    return regex.test(url);
  }

  async handle(url) {
    // Disable the fullscreen button because DarkBorbit integrate one in-game
    this.ipcRouter.core.enableFullscreenButton(false);
  }
}
module.exports = DarkOrbit_GameMapMiddleware;
