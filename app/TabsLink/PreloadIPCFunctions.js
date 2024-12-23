class PreloadIPCFunctions {
  constructor(preload) {
    this.preload = preload;
  }

  requestFullscreen() {
    let div = document.createElement("div");

    div.innerHTML = `<div id="fullscreen-overlay" style="display:flex!important;font-size:21px!important;justify-content:center;align-items:center;width:450px;height:100px;z-index:55;background:rgba(0, 0, 0, 0.5);border-radius:15px;font-size:calc(2vw + 8px);color:white;position:absolute;top:150px;left:50%;transform: translateX(-50%);font-family: 'Roboto', 'Arial', sans-serif; text-align: center; opacity: 1; transition: opacity 1s ease;">
            <p style="margin:0;">${this.preload.options.locale["preload.fullscreen.text"]}</p>
        </div>`;

    document.body.appendChild(div);

    setTimeout(() => {
      // Start fade-out by setting opacity to 0
      div.firstChild.style.opacity = "0";
      // Remove the div after the fade-out duration (1s here)
      setTimeout(() => {
        div.remove();
      }, 1000); // Match this duration with the CSS transition
    }, 2500); // Time before fade-out starts
  }

  async loadPluginPart(plugin) {
    const { pluginName, pluginPath } = plugin;
    await this.preload.pluginManager.loadPluginPart(
      pluginName,
      pluginPath,
      !this.preload.areWeInADataURL()
        ? sessionStorage.getItem("viewID")
        : this.preload.viewID
    );
    return true;
  }

  async rendererPluginInvokePreload(data) {
    const { pluginName, partName, methodName, args } = data;
    var result = {};

    await this.preload.pluginManager.ready;
    const plugin = this.preload.pluginManager.getPlugin(pluginName);

    const loadedPart = plugin.find((part) => part.name === partName);
    if (!loadedPart) {
      result.error = `Plugin ${pluginName} didn't loaded preload named "${partName}"`;
      return result;
    }
    result.result = (await loadedPart.loadedPlugin[methodName])
      ? await loadedPart.loadedPlugin[methodName](...args)
      : Promise.reject("Method not found");
    return result;
  }
}

module.exports = PreloadIPCFunctions;
