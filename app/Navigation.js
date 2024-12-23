var $ = require("jquery");
const path = require("path");
var urlRegex = require("url-regex");
const Locales = require("./Locales");
const Config = new (require("./Models/Config"))();
const UiUtils = require("./Utils/UiUtils");
var globalCloseableTabsOverride;

const newTabURL = `file:///${global.appPath}/app/Ui/Views/sections/newTab/newTab.html`;

var tabsGroupColors = {
  blue: false,
  red: false,
  green: false,
  yellow: false,
  purple: false
};

let tabsInfos = [];

let currentTabs = [];

let overflowTabs = [];

var draggedElement;

/**
 * OBJECT
 */
function Navigation(options) {
  /**
   * OPTIONS
   */

  var defaults = {
    showBackButton: true,
    showForwardButton: true,
    showReloadButton: true,
    showUrlBar: true,
    showAddTabButton: true,
    closableTabs: true,
    verticalTabs: false,
    defaultFavicons: false,
    newTabCallback: null,
    changeTabCallback: null,
    newTabParams: null
  };
  options = options ? Object.assign(defaults, options) : defaults;
  /**
   * GLOBALS & ICONS
   */
  globalCloseableTabsOverride = options.closableTabs;
  const NAV = this;
  this.newTabCallback = options.newTabCallback;
  this.changeTabCallback = options.changeTabCallback;
  this.SESSION_ID = 1;
  this.parent = options.parent;
  this.preloadPlugins = options.preloadPlugins;
  if (options.defaultFavicons) {
    this.TAB_ICON = "default";
  } else {
    this.TAB_ICON = "clean";
  }
  this.SVG_BACK =
    '<svg height="100%" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"/><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>';
  this.SVG_FORWARD =
    '<svg height="100%" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"/><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg>';
  this.SVG_RELOAD =
    '<svg viewBox="0 0 24 24" fill="none" width="13px"  stroke="#ffffff" transform="rotate(-45)"><g id="bgCarrier" stroke-width="0"></g><g id="tracerCarrier" stroke-linecap="round" stroke-linejoin="round" stroke="#000000" stroke-width="1.6799999999999997"> <path d="M4.39502 12.0014C4.39544 12.4156 4.73156 12.751 5.14577 12.7506C5.55998 12.7502 5.89544 12.4141 5.89502 11.9999L4.39502 12.0014ZM6.28902 8.1116L6.91916 8.51834L6.91952 8.51777L6.28902 8.1116ZM9.33502 5.5336L9.0396 4.84424L9.03866 4.84464L9.33502 5.5336ZM13.256 5.1336L13.4085 4.39927L13.4062 4.39878L13.256 5.1336ZM16.73 7.0506L16.1901 7.57114L16.1907 7.57175L16.73 7.0506ZM17.7142 10.2078C17.8286 10.6059 18.2441 10.8358 18.6422 10.7214C19.0403 10.607 19.2703 10.1915 19.1558 9.79342L17.7142 10.2078ZM17.7091 9.81196C17.6049 10.2129 17.8455 10.6223 18.2464 10.7265C18.6473 10.8307 19.0567 10.5901 19.1609 10.1892L17.7091 9.81196ZM19.8709 7.45725C19.9751 7.05635 19.7346 6.6469 19.3337 6.54272C18.9328 6.43853 18.5233 6.67906 18.4191 7.07996L19.8709 7.45725ZM18.2353 10.7235C18.6345 10.8338 19.0476 10.5996 19.1579 10.2004C19.2683 9.80111 19.034 9.38802 18.6348 9.2777L18.2353 10.7235ZM15.9858 8.5457C15.5865 8.43537 15.1734 8.66959 15.0631 9.06884C14.9528 9.46809 15.187 9.88119 15.5863 9.99151L15.9858 8.5457ZM19.895 11.9999C19.8946 11.5856 19.5585 11.2502 19.1443 11.2506C18.7301 11.251 18.3946 11.5871 18.395 12.0014L19.895 11.9999ZM18.001 15.8896L17.3709 15.4829L17.3705 15.4834L18.001 15.8896ZM14.955 18.4676L15.2505 19.157L15.2514 19.1566L14.955 18.4676ZM11.034 18.8676L10.8815 19.6019L10.8839 19.6024L11.034 18.8676ZM7.56002 16.9506L8.09997 16.4301L8.09938 16.4295L7.56002 16.9506ZM6.57584 13.7934C6.46141 13.3953 6.04593 13.1654 5.64784 13.2798C5.24974 13.3942 5.01978 13.8097 5.13421 14.2078L6.57584 13.7934ZM6.58091 14.1892C6.6851 13.7884 6.44457 13.3789 6.04367 13.2747C5.64277 13.1705 5.23332 13.4111 5.12914 13.812L6.58091 14.1892ZM4.41914 16.544C4.31495 16.9449 4.55548 17.3543 4.95638 17.4585C5.35727 17.5627 5.76672 17.3221 5.87091 16.9212L4.41914 16.544ZM6.05478 13.2777C5.65553 13.1674 5.24244 13.4016 5.13212 13.8008C5.02179 14.2001 5.25601 14.6132 5.65526 14.7235L6.05478 13.2777ZM8.30426 15.4555C8.70351 15.5658 9.11661 15.3316 9.22693 14.9324C9.33726 14.5331 9.10304 14.12 8.70378 14.0097L8.30426 15.4555ZM5.89502 11.9999C5.89379 10.7649 6.24943 9.55591 6.91916 8.51834L5.65889 7.70487C4.83239 8.98532 4.3935 10.4773 4.39502 12.0014L5.89502 11.9999ZM6.91952 8.51777C7.57513 7.50005 8.51931 6.70094 9.63139 6.22256L9.03866 4.84464C7.65253 5.4409 6.47568 6.43693 5.65852 7.70544L6.91952 8.51777ZM9.63045 6.22297C10.7258 5.75356 11.9383 5.62986 13.1059 5.86842L13.4062 4.39878C11.9392 4.09906 10.4158 4.25448 9.0396 4.84424L9.63045 6.22297ZM13.1035 5.86793C14.2803 6.11232 15.3559 6.7059 16.1901 7.57114L17.27 6.53006C16.2264 5.44761 14.8807 4.70502 13.4085 4.39927L13.1035 5.86793ZM16.1907 7.57175C16.9065 8.31258 17.4296 9.21772 17.7142 10.2078L19.1558 9.79342C18.8035 8.5675 18.1557 7.44675 17.2694 6.52945L16.1907 7.57175ZM19.1609 10.1892L19.8709 7.45725L18.4191 7.07996L17.7091 9.81196L19.1609 10.1892ZM18.6348 9.2777L15.9858 8.5457L15.5863 9.99151L18.2353 10.7235L18.6348 9.2777ZM18.395 12.0014C18.3963 13.2363 18.0406 14.4453 17.3709 15.4829L18.6312 16.2963C19.4577 15.0159 19.8965 13.5239 19.895 11.9999L18.395 12.0014ZM17.3705 15.4834C16.7149 16.5012 15.7707 17.3003 14.6587 17.7786L15.2514 19.1566C16.6375 18.5603 17.8144 17.5643 18.6315 16.2958L17.3705 15.4834ZM14.6596 17.7782C13.5643 18.2476 12.3517 18.3713 11.1842 18.1328L10.8839 19.6024C12.3508 19.9021 13.8743 19.7467 15.2505 19.157L14.6596 17.7782ZM11.1865 18.1333C10.0098 17.8889 8.93411 17.2953 8.09997 16.4301L7.02008 17.4711C8.06363 18.5536 9.40936 19.2962 10.8815 19.6019L11.1865 18.1333ZM8.09938 16.4295C7.38355 15.6886 6.86042 14.7835 6.57584 13.7934L5.13421 14.2078C5.48658 15.4337 6.13433 16.5545 7.02067 17.4718L8.09938 16.4295ZM5.12914 13.812L4.41914 16.544L5.87091 16.9212L6.58091 14.1892L5.12914 13.812ZM5.65526 14.7235L8.30426 15.4555L8.70378 14.0097L6.05478 13.2777L5.65526 14.7235Z" fill="#ffffff"></path> </g><g id="iconCarrier"> <path d="M4.39502 12.0014C4.39544 12.4156 4.73156 12.751 5.14577 12.7506C5.55998 12.7502 5.89544 12.4141 5.89502 11.9999L4.39502 12.0014ZM6.28902 8.1116L6.91916 8.51834L6.91952 8.51777L6.28902 8.1116ZM9.33502 5.5336L9.0396 4.84424L9.03866 4.84464L9.33502 5.5336ZM13.256 5.1336L13.4085 4.39927L13.4062 4.39878L13.256 5.1336ZM16.73 7.0506L16.1901 7.57114L16.1907 7.57175L16.73 7.0506ZM17.7142 10.2078C17.8286 10.6059 18.2441 10.8358 18.6422 10.7214C19.0403 10.607 19.2703 10.1915 19.1558 9.79342L17.7142 10.2078ZM17.7091 9.81196C17.6049 10.2129 17.8455 10.6223 18.2464 10.7265C18.6473 10.8307 19.0567 10.5901 19.1609 10.1892L17.7091 9.81196ZM19.8709 7.45725C19.9751 7.05635 19.7346 6.6469 19.3337 6.54272C18.9328 6.43853 18.5233 6.67906 18.4191 7.07996L19.8709 7.45725ZM18.2353 10.7235C18.6345 10.8338 19.0476 10.5996 19.1579 10.2004C19.2683 9.80111 19.034 9.38802 18.6348 9.2777L18.2353 10.7235ZM15.9858 8.5457C15.5865 8.43537 15.1734 8.66959 15.0631 9.06884C14.9528 9.46809 15.187 9.88119 15.5863 9.99151L15.9858 8.5457ZM19.895 11.9999C19.8946 11.5856 19.5585 11.2502 19.1443 11.2506C18.7301 11.251 18.3946 11.5871 18.395 12.0014L19.895 11.9999ZM18.001 15.8896L17.3709 15.4829L17.3705 15.4834L18.001 15.8896ZM14.955 18.4676L15.2505 19.157L15.2514 19.1566L14.955 18.4676ZM11.034 18.8676L10.8815 19.6019L10.8839 19.6024L11.034 18.8676ZM7.56002 16.9506L8.09997 16.4301L8.09938 16.4295L7.56002 16.9506ZM6.57584 13.7934C6.46141 13.3953 6.04593 13.1654 5.64784 13.2798C5.24974 13.3942 5.01978 13.8097 5.13421 14.2078L6.57584 13.7934ZM6.58091 14.1892C6.6851 13.7884 6.44457 13.3789 6.04367 13.2747C5.64277 13.1705 5.23332 13.4111 5.12914 13.812L6.58091 14.1892ZM4.41914 16.544C4.31495 16.9449 4.55548 17.3543 4.95638 17.4585C5.35727 17.5627 5.76672 17.3221 5.87091 16.9212L4.41914 16.544ZM6.05478 13.2777C5.65553 13.1674 5.24244 13.4016 5.13212 13.8008C5.02179 14.2001 5.25601 14.6132 5.65526 14.7235L6.05478 13.2777ZM8.30426 15.4555C8.70351 15.5658 9.11661 15.3316 9.22693 14.9324C9.33726 14.5331 9.10304 14.12 8.70378 14.0097L8.30426 15.4555ZM5.89502 11.9999C5.89379 10.7649 6.24943 9.55591 6.91916 8.51834L5.65889 7.70487C4.83239 8.98532 4.3935 10.4773 4.39502 12.0014L5.89502 11.9999ZM6.91952 8.51777C7.57513 7.50005 8.51931 6.70094 9.63139 6.22256L9.03866 4.84464C7.65253 5.4409 6.47568 6.43693 5.65852 7.70544L6.91952 8.51777ZM9.63045 6.22297C10.7258 5.75356 11.9383 5.62986 13.1059 5.86842L13.4062 4.39878C11.9392 4.09906 10.4158 4.25448 9.0396 4.84424L9.63045 6.22297ZM13.1035 5.86793C14.2803 6.11232 15.3559 6.7059 16.1901 7.57114L17.27 6.53006C16.2264 5.44761 14.8807 4.70502 13.4085 4.39927L13.1035 5.86793ZM16.1907 7.57175C16.9065 8.31258 17.4296 9.21772 17.7142 10.2078L19.1558 9.79342C18.8035 8.5675 18.1557 7.44675 17.2694 6.52945L16.1907 7.57175ZM19.1609 10.1892L19.8709 7.45725L18.4191 7.07996L17.7091 9.81196L19.1609 10.1892ZM18.6348 9.2777L15.9858 8.5457L15.5863 9.99151L18.2353 10.7235L18.6348 9.2777ZM18.395 12.0014C18.3963 13.2363 18.0406 14.4453 17.3709 15.4829L18.6312 16.2963C19.4577 15.0159 19.8965 13.5239 19.895 11.9999L18.395 12.0014ZM17.3705 15.4834C16.7149 16.5012 15.7707 17.3003 14.6587 17.7786L15.2514 19.1566C16.6375 18.5603 17.8144 17.5643 18.6315 16.2958L17.3705 15.4834ZM14.6596 17.7782C13.5643 18.2476 12.3517 18.3713 11.1842 18.1328L10.8839 19.6024C12.3508 19.9021 13.8743 19.7467 15.2505 19.157L14.6596 17.7782ZM11.1865 18.1333C10.0098 17.8889 8.93411 17.2953 8.09997 16.4301L7.02008 17.4711C8.06363 18.5536 9.40936 19.2962 10.8815 19.6019L11.1865 18.1333ZM8.09938 16.4295C7.38355 15.6886 6.86042 14.7835 6.57584 13.7934L5.13421 14.2078C5.48658 15.4337 6.13433 16.5545 7.02067 17.4718L8.09938 16.4295ZM5.12914 13.812L4.41914 16.544L5.87091 16.9212L6.58091 14.1892L5.12914 13.812ZM5.65526 14.7235L8.30426 15.4555L8.70378 14.0097L6.05478 13.2777L5.65526 14.7235Z" fill="#ffffff"></path> </g></svg>';
  this.SVG_FAVICON =
    '<svg height="100%" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"/><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>';
  this.SVG_ADD =
    '<svg height="100%" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"/><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/></svg>';
  this.SVG_CLEAR =
    '<svg height="100%" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/><path d="M0 0h24v24H0z" fill="none"/></svg>';
  this.SVG_MUTE =
    '<svg fill="#ffffff" width="13px" height="13px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" stroke="#ffffff"><g stroke-width="0"></g><g stroke-linecap="round" stroke-linejoin="round"></g><g><path fill-rule="evenodd" d="M12 3.75a.75.75 0 00-1.255-.555L5.46 8H2.75A1.75 1.75 0 001 9.75v4.5c0 .966.784 1.75 1.75 1.75h2.71l5.285 4.805A.75.75 0 0012 20.25V3.75zM6.255 9.305l4.245-3.86v13.11l-4.245-3.86a.75.75 0 00-.505-.195h-3a.25.25 0 01-.25-.25v-4.5a.25.25 0 01.25-.25h3a.75.75 0 00.505-.195z"></path><path d="M16.28 8.22a.75.75 0 10-1.06 1.06L17.94 12l-2.72 2.72a.75.75 0 101.06 1.06L19 13.06l2.72 2.72a.75.75 0 101.06-1.06L20.06 12l2.72-2.72a.75.75 0 00-1.06-1.06L19 10.94l-2.72-2.72z"></path></g></svg>';
  this.SVG_UNMUTE =
    '<svg fill="#ffffff" width="13px" height="13px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" stroke="#ffffff"><g stroke-width="0"></g><g stroke-linecap="round" stroke-linejoin="round"></g><g><path fill-rule="evenodd" d="M11.553 3.064A.75.75 0 0112 3.75v16.5a.75.75 0 01-1.255.555L5.46 16H2.75A1.75 1.75 0 011 14.25v-4.5C1 8.784 1.784 8 2.75 8h2.71l5.285-4.805a.75.75 0 01.808-.13zM10.5 5.445l-4.245 3.86a.75.75 0 01-.505.195h-3a.25.25 0 00-.25.25v4.5c0 .138.112.25.25.25h3a.75.75 0 01.505.195l4.245 3.86V5.445z"></path><path d="M18.718 4.222a.75.75 0 011.06 0c4.296 4.296 4.296 11.26 0 15.556a.75.75 0 01-1.06-1.06 9.5 9.5 0 000-13.436.75.75 0 010-1.06z"></path><path d="M16.243 7.757a.75.75 0 10-1.061 1.061 4.5 4.5 0 010 6.364.75.75 0 001.06 1.06 6 6 0 000-8.485z"></path></g></svg>';
  /**
   * ADD ELEMENTS
   */
  if (options.showAddTabButton) {
    $("#nav-body-tabs").append(
      '<i id="nav-tabs-add" class="nav-icons" title="' +
        Locales.get("core.addTab") +
        '"><svg width="13px" height="13px" viewBox="0 -0.5 9 9" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#000000"><g></g><g stroke-linecap="round" stroke-linejoin="round"></g><g><defs> </defs> <g id="Page-1" stroke-width="0.00009" fill="none" fill-rule="evenodd"> <g id="Dribbble-Light-Preview" transform="translate(-345.000000, -206.000000)" fill="#ffffff"> <g id="icons" transform="translate(56.000000, 160.000000)"> <polygon id="plus_mini-[#ffffff]" points="298 49 298 51 294.625 51 294.625 54 292.375 54 292.375 51 289 51 289 49 292.375 49 292.375 46 294.625 46 294.625 49"> </polygon> </g> </g> </g> </g></svg></i>'
    );
  }
  if (options.showUrlBar) {
    $("#nav-body-ctrls").append(
      '<div class="nav-ctrls-url-wrapper"><input id="nav-ctrls-url" type="text" title="' +
        Locales.get("core.urlBar") +
        '"/></div>'
    );
  }
  /**
   * ADD CORE STYLE
   */
  if (options.verticalTabs) {
    $("head").append(
      '<style id="nav-core-styles">#nav-body-tabs,#nav-body-views,.nav-tabs-tab{display:flex;align-items:center;}#nav-body-tabs{overflow:auto;min-height:30px;flex-direction:column;}#nav-ctrls-url{box-sizing:border-box;}.nav-tabs-tab{min-width:60px;width:100%;min-height:20px;}.nav-icons{fill:#000;width:24px;height:24px}.nav-icons.disabled{pointer-events:none;opacity:.5}#nav-ctrls-url{flex:1;height:24px}.nav-views-view{flex:0 1;width:0;height:0}.nav-views-view.active{flex:1;width:100%;height:100%}.nav-tabs-favicon{align-content:flex-start}.nav-tabs-title{flex:1;cursor:default;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.nav-tabs-close{align-content:flex-end}@keyframes nav-spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}</style>'
    );
  } else {
    $("head").append(
      '<style id="nav-core-styles">#nav-body-tabs,#nav-body-views,.nav-tabs-tab{display:flex;align-items:center}#nav-body-tabs{overflow:auto;min-height:30px;}#nav-ctrls-url{box-sizing:border-box;}.nav-tabs-tab{min-width:60px;width:180px;min-height:20px;}.nav-icons{fill:#000;width:24px;height:24px}.nav-icons.disabled{pointer-events:none;opacity:.5}#nav-ctrls-url{flex:1;height:24px}.nav-views-view{flex:0 1;width:0;height:0;visibility:hidden;pointer-events:none;}.nav-views-view.active{flex:1;width:100%;height:100%;visibility:visible;pointer-events:auto;}.nav-tabs-favicon{align-content:flex-start}.nav-tabs-title{flex:1;cursor:default;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.nav-tabs-close{align-content:flex-end}.nav-tabs-mute{align-content:flex-end}@keyframes nav-spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}</style>'
    );
  }

  // switch active view and tab on click
  //

  $("#collapse-tooltip-button").on("click", function () {
    // This function is called after the animation completes
    if (!$("#nav-body-ctrls").hasClass("open")) {
      // If #nav-body-ctrls is visible after toggle
      $("#collapse-tooltip-button").addClass("active");
      $("#nav-body-ctrls").css("display", "block");
      setTimeout(() => {
        $("#nav-body-ctrls").css("opacity", 1);
      }, 50);

      $("#nav-body-ctrls").addClass("open");
      // $("#collapse-tooltip-button").children("svg").css('transform', 'translate(-50%, -50%) rotate(180deg);');
    } else {
      // If #nav-body-ctrls is hidden after toggle
      $("#collapse-tooltip-button").removeClass("active");
      $("#nav-body-ctrls").css("opacity", 0);
      setTimeout(() => {
        $("#nav-body-ctrls").css("display", "none");
      }, 300);
      $("#nav-body-ctrls").removeClass("open");
      // $("#collapse-tooltip-button").children("svg").css('transform', 'translate(-50%, -50%) rotate(0deg);');
    }
  });

  $("#nav-body-tabs")
    .on("click", ".nav-tabs-tab", function (e) {
      if (e.altKey) {
        let tabParent;
        if (e.target.classList.contains("nav-tabs-tab")) {
          tabParent = e.target;
        } else if (e.target.parentElement.classList.contains("nav-tabs-tab")) {
          tabParent = e.target.parentElement;
        } else if (
          e.target.parentElement.parentElement.classList.contains(
            "nav-tabs-tab"
          )
        ) {
          tabParent = e.target.parentElement.parentElement;
        }

        NAV.splitTabs($(".nav-tabs-tab.active")[0], tabParent);
      } else {
        $(".nav-views-view.active").css("flex-basis", "");
        $(".splitter").remove();
        $(".context-tabItem, .nav-tabs-tab, .nav-views-view").removeClass(
          "active"
        );

        var sessionID = $(this).data("session");

        var session = $(
          '.context-tabItem[data-session="' +
            sessionID +
            '"], .nav-tabs-tab[data-session="' +
            sessionID +
            '"], .nav-views-view[data-session="' +
            sessionID +
            '"]'
        );
        session.addClass("active");

        (NAV.changeTabCallback || (() => {}))(session[1]);
        NAV._updateUrl(session[1].getURL());
        NAV._updateCtrls();
      }
      //cl
      // close tab and view
      //
    })
    .on("click", ".nav-tabs-close", function () {
      var sessionID = $(this).parent(".nav-tabs-tab").data("session");
      NAV.closeTab(sessionID);

      if (overflowTabs.length <= 0) {
        $("#showOverFlow-tooltip-button").addClass("hidden");
        $("#tabListContainer").css("opacity", "0");
        $("#reload-tooltip-button").css("right", "405px");
      }
      return false;
    })
    .on("click", ".nav-tabs-mute", function (e) {
      let parent;
      if (
        e.target.parentElement.parentElement.classList.contains("nav-tabs-tab")
      ) {
        parent = e.target.parentElement.parentElement;
      } else if (
        e.target.parentElement.parentElement.parentElement.classList.contains(
          "nav-tabs-tab"
        )
      ) {
        parent = e.target.parentElement.parentElement.parentElement;
      } else {
        parent =
          e.target.parentElement.parentElement.parentElement.parentElement;
      }

      NAV.handleMuteButton(parent.getAttribute("data-session"));
      e.stopPropagation();
    });
  //
  //add overflowTabs Events
  //
  $("#tabListContainer")
    .on("click", ".context-tabItem", function (e) {
      if (e.altKey) {
        let tabParent;
        if (e.target.classList.contains("context-tabItem")) {
          tabParent = e.target;
        } else if (
          e.target.parentElement.classList.contains("context-tabItem")
        ) {
          tabParent = e.target.parentElement;
        } else if (
          e.target.parentElement.parentElement.classList.contains(
            "context-tabItem"
          )
        ) {
          tabParent = e.target.parentElement.parentElement;
        }

        NAV.splitTabs($(".nav-views-view.active")[0], tabParent);
      } else {
        $(".nav-views-view.active").css("flex-basis", "");
        $(".splitter").remove();
        $(".context-tabItem, .nav-tabs-tab, .nav-views-view").removeClass(
          "active"
        );

        var sessionID = $(this).data("session");

        var session = $(
          '.context-tabItem[data-session="' +
            sessionID +
            '"], .nav-tabs-tab[data-session="' +
            sessionID +
            '"], .nav-views-view[data-session="' +
            sessionID +
            '"]'
        );
        session.addClass("active");

        (NAV.changeTabCallback || (() => {}))(session[0]);
        NAV._updateUrl(session[0].getURL());
        NAV._updateCtrls();
      }

      //cl
      // close tab and view
      //
    })
    .on("click", ".nav-tabs-close", function () {
      var sessionID = $(this).parent(".context-tabItem").data("session");
      NAV.closeTab(sessionID);
      let singleTab = overflowTabs.findIndex((obj) => obj.id === sessionID);

      if (singleTab !== -1) {
        overflowTabs.splice(singleTab, 1);
      }

      if (overflowTabs.length <= 0) {
        $("#showOverFlow-tooltip-button").addClass("hidden");
        $("#tabListContainer").css("opacity", "0");
        $("#reload-tooltip-button").css("right", "405px");
      }

      return false;
    })
    .on("click", ".nav-tabs-mute", function (e) {
      let parent;
      if (
        e.target.parentElement.parentElement.classList.contains(
          "context-tabItem"
        )
      ) {
        parent = e.target.parentElement.parentElement;
      } else if (
        e.target.parentElement.parentElement.parentElement.classList.contains(
          "context-tabItem"
        )
      ) {
        parent = e.target.parentElement.parentElement.parentElement;
      } else {
        parent =
          e.target.parentElement.parentElement.parentElement.parentElement;
      }

      NAV.handleMuteButton(parent.getAttribute("data-session"));
      e.stopPropagation();
    });
  //
  // add a tab, default to darkorbit.com
  //
  $("#nav-body-tabs").on("click", "#nav-tabs-add", function () {
    let params;
    if (typeof options.newTabParams === "function") {
      params = options.newTabParams();
    } else if (options.newTabParams instanceof Array) {
      params = options.newTabParams;
    }

    if (Config.get("onNewTab") == "homepage") {
      params = [
        Config.get("homepage"),
        {
          close: options.closableTabs,
          icon: NAV.TAB_ICON
        }
      ];
    }

    NAV.newTab(...params);
  });
  //
  // go back
  //
  $(".topbar-btn-group-ForwardPrevious").on(
    "click",
    "#prev-top-button",
    function () {
      NAV.back();
    }
  );
  //
  // go forward
  //
  $(".topbar-btn-group-ForwardPrevious").on(
    "click",
    "#next-top-button",
    function () {
      NAV.forward();
    }
  );
  //
  // reload page
  //
  $("#reload-tooltip-button").on("click", function () {
    if (!$("body").hasClass("waiting")) {
      NAV.reload();
    } else {
      NAV.stop();
    }
  });
  //
  // highlight address input text on first select
  //
  $("#nav-ctrls-url").on("focus", function (e) {
    $(this)
      .one("mouseup", function () {
        $(this).select();
        return false;
      })
      .select();
  });
  //
  // load or search address on enter / shift+enter
  //
  $("#nav-ctrls-url").keyup(function (e) {
    if (e.keyCode == 13) {
      if (e.shiftKey) {
        NAV.newTab(this.value, {
          close: options.closableTabs,
          icon: NAV.TAB_ICON
        });
      } else {
        if ($(".nav-tabs-tab").length) {
          NAV.handleUserAgent(this.value);
          NAV.changeTab(this.value);
        } else {
          NAV.newTab(this.value, {
            close: options.closableTabs,
            icon: NAV.TAB_ICON
          });
        }
      }
    }
  });

  let controls = document.getElementById("nav-body-ctrls");
  let SeachButton = document.createElement("button");
  SeachButton.classList.add("topbar-button");
  SeachButton.id = "topbar-search-button";
  SeachButton.innerHTML =
    '<svg width="13px" height="13px" viewBox="-0.5 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M22 11.8201C22 9.84228 21.4135 7.90885 20.3147 6.26436C19.2159 4.61987 17.6542 3.33813 15.8269 2.58126C13.9996 1.82438 11.9889 1.62637 10.0491 2.01223C8.10927 2.39808 6.32748 3.35052 4.92896 4.74904C3.53043 6.14757 2.578 7.92935 2.19214 9.86916C1.80629 11.809 2.00436 13.8197 2.76123 15.6469C3.51811 17.4742 4.79985 19.036 6.44434 20.1348C8.08883 21.2336 10.0222 21.8201 12 21.8201" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path> <path d="M2 11.8201H22" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path> <path d="M12 21.8201C10.07 21.8201 8.5 17.3401 8.5 11.8201C8.5 6.30007 10.07 1.82007 12 1.82007C13.93 1.82007 15.5 6.30007 15.5 11.8201" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path> <path d="M18.3691 21.6901C20.3021 21.6901 21.8691 20.1231 21.8691 18.1901C21.8691 16.2571 20.3021 14.6901 18.3691 14.6901C16.4361 14.6901 14.8691 16.2571 14.8691 18.1901C14.8691 20.1231 16.4361 21.6901 18.3691 21.6901Z" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path> <path d="M22.9998 22.8202L20.8398 20.6702" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>';
  SeachButton.title = Locales.get("core.search");
  SeachButton.addEventListener("click", (e) => {
    NAV.handleUserAgent(document.getElementById("nav-ctrls-url").value);
    NAV.changeTab(document.getElementById("nav-ctrls-url").value);
  });
  controls.appendChild(SeachButton);
  /**
   * FUNCTIONS
   */

  this.generateErrorPage = function (validationURL, errorCode, errorDetails) {
    let errorPage = `<!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>${Locales.get("errorPage.title")}</title>
        
          <style>
            body {
              font-family: sans-serif;
              margin: 0;
              padding: 20px;
              height: 100vh;
              align-items: center;
            }
        
            h1 {
              font-size: 16px;
            }
        
            p {
              margin-top: 10px;
              font-size: 11px;
            }

            span {
                color: red;
            }
          </style>
        </head>
        <body>
          <h1>${Locales.get("errorPage.body.title")}</h1>
          <p>${Locales.get("errorPage.body.message")}</p>
          <p>URL : ${validationURL}</p>
          <p>${Locales.get("errorPage.body.detail")} : </p>
          <p>${Locales.get(
            "errorPage.body.detail.errorCode"
          )} : <span>${errorCode}</span></p>
          <p>${Locales.get(
            "errorPage.body.detail.message"
          )} : <span>${errorDetails}</span></p>
        </body>
        </html>`;
    return errorPage;
  };
  //
  // update controls like back, forward, etc...
  //

  // Fonction pour vérifier si les onglets rentrent dans le conteneur
  this._updateCtrls = function () {
    webview = $(".nav-views-view.active")[0];
    if (!webview) {
      $("#prev-top-button").addClass("disabled");
      $("#next-top-button").addClass("disabled");
      $("#reload-tooltip-button").addClass("disabled");
      return;
    }
    try {
      if (webview.canGoBack()) {
        $("#prev-top-button").removeClass("disabled");
      } else {
        $("#prev-top-button").addClass("disabled");
      }
      if (webview.canGoForward()) {
        $("#next-top-button").removeClass("disabled");
      } else {
        $("#next-top-button").addClass("disabled");
      }

      if (
        webview.obfullscreenEnabled === true ||
        typeof webview.obfullscreenEnabled === "undefined"
      ) {
        $("#fullscreen-tooltip-button").removeClass("disabled");
      } else if (webview.obfullscreenEnabled === false) {
        $("#fullscreen-tooltip-button").addClass("disabled");
      }
    } catch (e) {
      console.warn(e);
    }

    if (webview.isLoading()) {
      this._loading();
    } else {
      this._stopLoading();
    }
  }; //:_updateCtrls()
  //
  // start loading animations
  //
  this._loading = function (tab) {
    tab = tab || null;

    if (tab == null) {
      tab = $(".nav-tabs-tab.active");
    }

    if (
      !tab.find(".animated-border-box").length &&
      !tab.hasClass("context-tabItem")
    ) {
      tab.prepend('<div class="animated-border-box"></div>');
    }

    //tab.find('.nav-tabs-favicon').css('animation', 'nav-spin 2s linear infinite');
    $("#reload-tooltip-button").html(this.SVG_CLEAR);

    $("body").addClass("waiting");
  }; //:_loading()
  //
  // stop loading animations
  //
  this._stopLoading = function (tab) {
    tab = tab || null;

    if (tab == null) {
      tab = $(".nav-tabs-tab.active");
    }

    //tab.find('.nav-tabs-favicon').css('animation', '');

    if (tab.find(".animated-border-box").length) {
      tab.find(".animated-border-box").remove();
    }
    $("body").removeClass("waiting");
    $("#reload-tooltip-button").html(this.SVG_RELOAD);
  }; //:_stopLoading()
  //
  // set audible button
  //
  this._setAudibleState = function (tab, state) {
    tab = tab || null;

    if (tab == null) {
      tab = $(".nav-tabs-tab.active");
    }

    var muteButton = tab.find(".nav-tabs-mute")[0];

    if (state == true) {
      muteButton.classList.remove("hidden");
    } else {
      muteButton.classList.add("hidden");
    }
  }; //:_setAudibleState()
  this._createTab = async function (type, url, options, id) {
    return new Promise((resolve) => {
      if (!id) {
        SESSION_ID = this.SESSION_ID;
      } else {
        SESSION_ID = id;
      }
      if (type == "normal") {
        if (id) {
          if (options.active) {
            var tab =
              '<span class="nav-tabs-tab active" data-session="' +
              SESSION_ID +
              '">';
          } else {
            var tab =
              '<span class="nav-tabs-tab" data-session="' + SESSION_ID + '">';
          }
        } else {
          var tab =
            '<span class="nav-tabs-tab active" data-session="' +
            SESSION_ID +
            '">';
        }

        // favicon
        if (options.icon == "clean") {
          tab +=
            '<i class="nav-tabs-favicon nav-icons">' +
            this.SVG_FAVICON +
            "</i>";
        } else if (options.icon === "default") {
          tab += '<img class="nav-tabs-favicon nav-icons" src=""/>';
        } else {
          tab +=
            '<img class="nav-tabs-favicon nav-icons" src="' +
            options.icon +
            '"/>';
        }
        // title
        if (options.title == "default") {
          tab += '<i class="nav-tabs-title"> . . . </i>';
        } else {
          tab += '<i class="nav-tabs-title">' + options.title + "</i>";
        }
        //mute button
        tab +=
          '<i class="nav-tabs-mute nav-icons hidden">' +
          this.SVG_UNMUTE +
          "</i>";
        // close
        if (options.close && globalCloseableTabsOverride) {
          tab +=
            '<i class="nav-tabs-close nav-icons">' + this.SVG_CLEAR + "</i>";
        }
        // finish tab
        tab += "</span>";
        // add tab to correct position

        if (options.position === "last") {
          $("#nav-tabs-add").before(tab);
        } else if (options.position === "after" && options.tabID) {
          $('.nav-tabs-tab[data-session="' + options.tabID + '"]').after(tab);
        }

        if (overflowTabs.length <= 0) {
          $("#showOverFlow-tooltip-button").addClass("hidden");
          $("#reload-tooltip-button").css("right", "405px");
        }

        UiUtils.makeElementDraggable(
          $('.nav-tabs-tab[data-session="' + SESSION_ID + '"]')[0],
          (e) => {
            if (e.type == "dragstart") {
              e.cancelAnimation();
            }
          }
        );
      } else {
        if (overflowTabs.length == 0) {
          $("#showOverFlow-tooltip-button").removeClass("hidden");
          $("#reload-tooltip-button").css("right", "387px");
        }
        overflowTabs.push({ url: url, options: options, id: SESSION_ID });

        $(".context-tabItem, .nav-tabs-tab").removeClass("active");

        if (id) {
          if (options.active) {
            var tab =
              '<div class="context-tabItem active" data-session="' +
              SESSION_ID +
              '">';
          } else {
            var tab =
              '<div class="context-tabItem" data-session="' + SESSION_ID + '">';
          }
        } else {
          var tab =
            '<div class="context-tabItem active" data-session="' +
            SESSION_ID +
            '">';
        }

        // favicon
        if (options.icon == "clean") {
          tab += '<i class="icon">' + this.SVG_FAVICON + "</i>";
        } else if (options.icon === "default") {
          tab += '<img class="icon" src=""/>';
        } else {
          tab += '<img class="icon" src="' + options.icon + '"/>';
        }
        // title
        if (options.title == "default") {
          tab += '<i class="title"> . . . </i>';
        } else {
          tab += '<i class="title">' + options.title + "</i>";
        }
        //mute button
        tab +=
          '<i class="nav-tabs-mute nav-icons hidden">' +
          this.SVG_UNMUTE +
          "</i>";
        // close
        if (options.close && globalCloseableTabsOverride) {
          tab +=
            '<i class="nav-tabs-close nav-icons">' + this.SVG_CLEAR + "</i>";
        }
        // finish tab
        tab += "</div>";
        // add tab to correct position

        if (options.position === "last") {
          $("#tabListContainer").append(tab);
        } else if (options.position === "after" && options.tabID) {
          $('.context-tabItem[data-session="' + options.tabID + '"]').after(
            tab
          );
        }

        UiUtils.makeElementDraggable(
          $('.context-tabItem[data-session="' + SESSION_ID + '"]')[0],
          (e) => {
            if (e.type == "dragstart") {
              e.cancelAnimation();
            }

            if (e.type == "dragend") {
            }

            if (e.type == "dragend-secondary") {
            }

            if (e.type == "dragenter") {
              try {
                let tabElement = e.element;

                if (tabElement.className !== "context-tabItem") {
                  tabElement.className = "context-tabItem";

                  let icon =
                    tabElement.getElementsByClassName("nav-tabs-favicon")[0];
                  icon.className = "icon";

                  let title =
                    tabElement.getElementsByClassName("nav-tabs-title")[0];
                  title.className = "title";

                  tabElement.outerHTML = tabElement.outerHTML
                    .replace(/<span/g, "<div")
                    .replace(/<\/span>/g, "</div>");
                }
              } catch (e) {}
            }

            if (e.type == "dragenter-secondary") {
              let tabElement = e.element;
              if (tabElement.className !== "nav-tabs-tab") {
                try {
                  tabElement.className = "nav-tabs-tab";

                  let icon = tabElement.getElementsByClassName("icon")[0];
                  icon.className = "nav-tabs-favicon nav-icons";

                  let title = tabElement.getElementsByClassName("title")[0];
                  title.className = "nav-tabs-title";

                  tabElement.outerHTML = tabElement.outerHTML
                    .replace(/<div/g, "<span")
                    .replace(/<\/div>/g, "</span>");
                } catch (e) {}
              }
            }
          }
        );
      }
      resolve();
    });
  };
  //
  // auto add http protocol to url input or do a search
  //
  this._purifyUrl = function (url) {
    if (
      urlRegex({
        strict: false,
        exact: true
      }).test(url)
    ) {
      url = url.match(/^https?:\/\/.*/) ? url : "http://" + url;
    } else {
      url = !url.match(/^[a-zA-Z]+:\/\//)
        ? "https://duckduckgo.com/?q=" + url.replace(" ", "+")
        : url;
    }
    return url;
  }; //:_purifyUrl()
  //
  // set the color of the tab based on the favicon
  //
  this._setTabColor = function (url, currtab) {}; //:_setTabColor()
  //
  // add event listeners to current webview
  //
  this._addEvents = function (sessionID, options) {
    let currtab = $('.nav-tabs-tab[data-session="' + sessionID + '"]');
    let webview = $('.nav-views-view[data-session="' + sessionID + '"]');

    if (currtab.length <= 0) {
      currtab = $('.context-tabItem[data-session="' + sessionID + '"]');
    }

    webview.on("dom-ready", function () {
      webview[0].send("setViewID", {
        sessionID,
        partition: webview.attr("partition"),
        ipcProcessName: NAV.parent.ipcRouter.processName,
        preloadPlugins: Config.getTempItem("preloadPlugins")
      });

      document.getElementById("loading-overlay").style.display = "none";
      NAV._updateUrl(webview[0].getURL(), true);
    });
    webview.on("focus", function () {
      if (webview[0].isCurrentlyAudible() == true) {
        NAV._setAudibleState(currtab, true);
      } else {
        NAV._setAudibleState(currtab, false);
      }
    });
    webview.on("page-title-updated", function () {
      if (
        typeof tabsInfos[sessionID] !== "undefined" &&
        tabsInfos[sessionID] !== null
      ) {
        if (typeof tabsInfos[sessionID].title !== "undefined") {
          const modifiedTitle = `${
            tabsInfos[sessionID].title
          } | ${webview[0].getTitle()}`;
          currtab
            .find(".nav-tabs-title, .title")
            .html('<div class="slideText">' + modifiedTitle + "</div>");
          currtab.find(".nav-tabs-title, .title").attr("title", modifiedTitle);
        }
      } else {
        if (options.title == "default") {
          currtab
            .find(".nav-tabs-title, .title")
            .html('<div class="slideText">' + webview[0].getTitle() + "</div>");
          currtab
            .find(".nav-tabs-title, .title")
            .attr("title", webview[0].getTitle());
        }
      }
    });
    webview.on("did-start-loading", function () {
      NAV._loading(currtab);
    });
    webview.on("did-stop-loading", function () {
      NAV._stopLoading(currtab);
    });
    webview.on("enter-html-full-screen", function () {
      $(".nav-views-view.active").siblings().not("script").hide();
      $(".nav-views-view.active").parents().not("script").siblings().hide();
    });
    webview.on("leave-html-full-screen", function () {
      $(".nav-views-view.active").siblings().not("script").show();
      $(".nav-views-view.active").parents().siblings().not("script").show();
    });
    webview.on("load-commit", function (res) {
      NAV._updateCtrls();
    });
    webview[0].addEventListener("close", function (e) {
      e.preventDefault();
      let tabLength = document.querySelectorAll(".nav-tabs-tab").length;
      if (tabLength <= 1) {
        if (Config.get("onNewTab") == "homepage") {
          NAV.newTab(Config.get("homepage"));
        } else if (Config.get("onNewTab") == "newTab") {
          NAV.newTab(newTabURL);
        }
      }
      NAV.closeTab(sessionID);
    });
    webview[0].addEventListener("will-navigate", (res) => {
      if (!res.url) {
        logger.error("Erreur lors de la navigation: URL non valide");
        return;
      }
      NAV.handleUserAgent(res.url);
    });
    webview[0].addEventListener("did-navigate", (res) => {
      NAV._stopLoading(currtab);

      if (!res.url) {
        logger.error("Erreur lors de la navigation: URL non valide");
        return;
      }

      let sess = res.target.getAttribute("data-session");

      currentTabs = currentTabs.map((tab) => {
        if (tab.id == sess) {
          tab.url = res.url;
        }
        return tab;
      });

      NAV._updateUrl(res.url);
    });
    webview[0].addEventListener("did-fail-load", (res) => {
      if (res.errorCode !== -3) {
        webview[0].loadURL(
          `data:text/html;charset=utf-8,${this.generateErrorPage(
            res.validatedURL,
            res.errorCode,
            res.errorDescription
          )}`
        );
      }
      NAV._updateUrl(res.validatedUrl);
    });
    webview[0].addEventListener("did-navigate-in-page", (res) => {
      if (!res.url) {
        logger.error(
          "Erreur lors de la navigation dans la page: URL non valide"
        );
        return;
      }
      NAV.handleUserAgent(res.url);
      NAV._updateUrl(res.url);
    });
    webview[0].addEventListener("new-window", (res) => {
      if (!res.url) {
        logger.error(
          "Erreur lors de l'ouverture d'une nouvelle fenêtre: URL non valide"
        );
        return;
      }
      if (
        !(
          options.newWindowFrameNameBlacklistExpression instanceof RegExp &&
          options.newWindowFrameNameBlacklistExpression.test(res.frameName)
        )
      ) {
        let fromSession = document
          .getElementById("nav-body-views")
          .getElementsByClassName("active")[0]
          .getAttribute("partition");
        let parentViewID = document
          .getElementById("nav-body-views")
          .getElementsByClassName("active")[0]
          .getAttribute("data-session");

        if (res.url == "about:blank") {
          res.preventDefault();
          return;
        }

        NAV.newTab(res.url, {
          icon: NAV.TAB_ICON,
          partition: fromSession,
          position: "after",
          tabID: parentViewID
        });
      }
    });
    webview[0].addEventListener("page-favicon-updated", (res) => {
      if (!res.favicons || res.favicons.length === 0) {
        logger.error(
          "Erreur lors de la mise à jour du favicon: Favicon non valide"
        );
        return;
      }
      if (
        typeof tabsInfos[sessionID] !== "undefined" &&
        tabsInfos[sessionID] !== null
      ) {
        if (typeof tabsInfos[sessionID].rankIcon !== "undefined") {
          let rankFav = currtab.hasClass("context-tabItem")
            ? currtab.find("img")
            : currtab.find(".nav-tabs-favicon");
          rankFav.attr("src", tabsInfos[sessionID].rankIcon);
          rankFav.addClass("rank-icon");
        }
      } else {
        let currFav = currtab.hasClass("context-tabItem")
          ? currtab.find("img")
          : currtab.find(".nav-tabs-favicon");

        if (currFav[0] && currFav[0].nodeName !== "IMG") {
          let newFav = document.createElement("img");
          newFav.classList.add("nav-tabs-favicon", "nav-icons");
          newFav.src = res.favicons[0];

          currFav.replaceWith(newFav);
        } else {
          currFav.attr("src", res.favicons[0]);
        }
      }
    });
    webview[0].addEventListener("did-fail-load", (res) => {
      if (
        res.validatedURL == $("#nav-ctrls-url").val() &&
        res.errorCode != -3
      ) {
        webview[0].executeJavaScript(
          "document.body.innerHTML=" +
            '<div style="background-color:whitesmoke;padding:40px;margin:20px;font-family:consolas;">' +
            "<h2 align=center>Oops, this page failed to load correctly.</h2>" +
            "<p align=center><i>ERROR [ " +
            res.errorCode +
            ", " +
            res.errorDescription +
            " ]</i></p>" +
            "<br/><hr/>" +
            "<h4>Try this</h4>" +
            '<li type=circle>Check your spelling - <b>"' +
            res.validatedURL +
            '".</b></li><br/>' +
            '<li type=circle><a href="javascript:location.reload();">Refresh</a> the page.</li><br/>' +
            '<li type=circle>Perform a <a href=javascript:location.href="https://duckduckgo.com/?q=' +
            res.validatedURL +
            '">search</a> instead.</li><br/>' +
            "</div>"
        );
      }
    });
    return webview[0];
  }; //:_addEvents()
  //
  ///Determine user-agent to use whith url
  //
  this._determineUserAgent = (url) => {
    if (
      url.includes("darkorbit.com") ||
      url.includes("sas.bpsecure.com") ||
      url.includes("pvexgalaxy.space")
    ) {
      return Config.get("gameVersion");
    } else {
      return Config.get("defaultUserAgent");
    }
  };
  //
  // update #nav-ctrls-url to given url or active tab's url
  //
  this._updateUrl = async function (url) {
    url = url || null;
    urlInput = $("#nav-ctrls-url");
    let webview = $(".nav-views-view.active")[0];

    const waitForWebview = async () => {
      try {
        let title = webview.getTitle();
        return title;
      } catch (e) {
        return await new Promise((resolve, reject) => {
          const callback = () => {
            setTimeout(() => {
              webview.removeEventListener("dom-ready", callback);
              let currtab =
                $(
                  '.nav-tabs-tab[data-session="' +
                    webview.getAttribute("data-session") +
                    '"]'
                ).length <= 0
                  ? $(
                      '.context-tabItem[data-session="' +
                        webview.getAttribute("data-session") +
                        '"]'
                    )
                  : $(
                      '.nav-tabs-tab[data-session="' +
                        webview.getAttribute("data-session") +
                        '"]'
                    );

              let currTitle = currtab.hasClass("context-tabItem")
                ? currtab.find("title")
                : currtab.find(".nav-tabs-title");
              resolve(currTitle.innerText);
            }, 500);
          };

          webview.addEventListener("dom-ready", callback);
        });
      }
    };

    if (url != null) {
      if (url.startsWith("file://")) {
        url = await waitForWebview();
      } else if (url.startsWith("data:text/html")) {
        url = Locales.get("errorPage.title");
      }
    } else {
      if ($(".nav-views-view").length) {
        url = webview ? webview.getURL() : await waitForWebview();
      } else {
        url = "";
      }
    }
    urlInput.off("blur");
    if (!urlInput.is(":focus")) {
      urlInput.prop("value", url);
      urlInput.data("last", url);
    } else {
      urlInput.on("blur", function () {
        // if url not edited
        if (urlInput.val() == urlInput.data("last")) {
          urlInput.prop("value", url);
          urlInput.data("last", url);
        }
        urlInput.off("blur");
      });
    }
  }; //:_updateUrl()
  async function checkTabsFit() {
    const overTabs = $(".context-tabItem");
    const tabs = $("#nav-body-tabs").find(".nav-tabs-tab");
    const topContainerWidth = $("#nav-body-tabs").innerWidth();

    const coverflowTabs = [];
    const normalTabsToRecreate = [];
    let currentWidth = 0;

    tabs.each(function (index, tab) {
      currentWidth += parseInt($(tab).css("min-width"));

      if (currentWidth + 110 > topContainerWidth) {
        coverflowTabs.push(tab);
      }
    });

    overTabs.each(function (index, tab) {
      if (currentWidth + 110 < topContainerWidth) {
        normalTabsToRecreate.push(tab);
      }
    });

    const recreateNormalTabs = async () => {
      for (const tab of normalTabsToRecreate) {
        let options = [];
        const currentTitle = $(tab).find(".title")[0].innerText;
        const id = $(tab).attr("data-session");
        options.position = "last";
        options.title = currentTitle;
        options.close = true;
        options.icon = $(tab).find(".icon")[0].src;
        if ($(tab).hasClass("active")) {
          options.active = true;
        }
        $(tab).remove();
        await NAV._createTab("normal", null, options, id);
      }
    };

    const createCoverflowTabs = async () => {
      for (const tabToRemove of coverflowTabs) {
        let options = [];
        const currentTitle =
          $(tabToRemove).find(".nav-tabs-title")[0].innerText;
        const id = $(tabToRemove).attr("data-session");
        options.position = "last";
        options.title = currentTitle;
        options.close = true;
        options.icon = $(tabToRemove).find(".nav-tabs-favicon")[0].src;
        if ($(tabToRemove).hasClass("active")) {
          options.active = true;
        }
        $(tabToRemove).remove();
        await NAV._createTab("list", null, options, id);
      }
    };

    if (normalTabsToRecreate.length > 0) {
      await recreateNormalTabs();
    }

    if (coverflowTabs.length > 0) {
      await createCoverflowTabs();
    }

    if ($(".context-tabItem").length < 0) {
      $("#showOverFlow-tooltip-button").addClass("hidden");
      $("#reload-tooltip-button").css("right", "405px");
    }
  }

  // Ajouter un écouteur d'événement pour le redimensionnement de la fenêtre
  var resizeId;
  $(window).on("resize", (e) => {
    clearTimeout(resizeId);
    resizeId = setTimeout(() => {
      checkTabsFit();
    }, 200);
  });
} //:Navigation()
function insertAfter(newNode, existingNode) {
  existingNode.parentNode.insertBefore(newNode, existingNode.nextSibling);
}

function makeDraggable(splitter, leftPanel, rightPanel) {
  let isResizing = false;

  let view1ID = leftPanel.getAttribute("data-session");
  let view2ID = rightPanel.getAttribute("data-session");

  // Check if overlay already exists, if not create one
  let overlay = document.getElementById("resizeOverlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "resizeOverlay";
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.zIndex = "1";
    overlay.style.display = "none";
    document.body.appendChild(overlay);
  }

  splitter.addEventListener("mousedown", (event) => {
    isResizing = true;
    overlay.style.display = "block"; // Show the overlay
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", stopResizing);
  });

  function handleMouseMove(event) {
    if (isResizing) {
      // Get the screen coordinates
      const screenX = event.screenX;

      // Convert screen coordinates to client coordinates
      const containerRect = document
        .getElementById("nav-body-views")
        .getBoundingClientRect();
      const containerOffset = containerRect.left + window.screenX;
      const containerWidth = containerRect.width;
      // Subtract the window's screenX from the screenX
      const clientX = screenX - window.screenX;

      // Calculate the new widths
      const leftWidth = clientX - containerOffset;
      const rightWidth = containerWidth - leftWidth;

      // Ensure the splitter stays within the bounds of the container
      if (leftWidth > 0 && rightWidth > 0) {
        if (view1ID < view2ID) {
          leftPanel.style.flexBasis = `${leftWidth}px`;
          rightPanel.style.flexBasis = `${rightWidth}px`;
        } else {
          leftPanel.style.flexBasis = `${rightWidth}px`;
          rightPanel.style.flexBasis = `${leftWidth}px`;
        }
      }
    }
  }

  function stopResizing() {
    isResizing = false;
    overlay.style.display = "none"; // Hide the overlay
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", stopResizing);
  }
}

/**
 * PROTOTYPES
 */
//
// create a new tab and view with an url and optional id
//

Navigation.prototype.newTab = function (url, options) {
  var defaults = {
    id: null, // null, 'yourIdHere'
    node: false,
    webviewAttributes: {},
    icon: "clean", // 'default', 'clean', 'c:\location\to\image.png'
    title: "default", // 'default', 'your title here'
    close: true,
    readonlyUrl: false,
    partition: `persist:dosession${this.SESSION_ID}`,
    preload: "../../TabsLink/Link.js",
    contextMenu: true,
    newTabCallback: this.newTabCallback,
    changeTabCallback: this.changeTabCallback,
    position: "last",
    tabID: null,
    cookies: null
  };
  options = options ? Object.assign(defaults, options) : defaults;

  $(".nav-views-view.active").css("flex-basis", "");
  $(".splitter").remove();
  $(".context-tabItem, .nav-tabs-tab, .nav-views-view").removeClass("active");

  return new Promise(async (resolve) => {
    if (options.position == "after" && options.tabID) {
      if (typeof tabsInfos[options.tabID] !== "undefined") {
        tabsInfos[this.SESSION_ID] = tabsInfos[options.tabID];
      }
    } else {
      for (const [key, value] of Object.entries(tabsGroupColors)) {
        if (value === false) {
          selectedColor = key;
          tabsGroupColors[key] = true;
          break;
        }
      }
    }

    if (typeof options.newTabCallback === "function") {
      let result = options.newTabCallback(this.SESSION_ID, url, options);
      if (!result) {
        return null;
      }
      if (result.url) {
        url = result.url;
      }
      if (result.options) {
        options = result.options;
      }
      if (typeof result.postTabOpenCallback === "function") {
        options.postTabOpenCallback = result.postTabOpenCallback;
      }
    }

    $(".splitter").remove();

    let tabsLength = $("#nav-body-tabs").find(".nav-tabs-tab").length;

    let topContainerWidth = $("#nav-body-tabs").width();

    if (tabsLength > 1 && tabsLength * 60 + 110 > topContainerWidth) {
      await this._createTab("list", url, options);
    } else {
      await this._createTab("normal", url, options);
    }
    // add webview

    let composedWebviewTag = `<webview class="nav-views-view active" partition="${
      options.partition
    }" preload="${options.preload}"  data-session="${
      this.SESSION_ID
    }" src="${this._purifyUrl(
      url
    )}" webpreferences="backgroundThrottling=false,offscreen=true"`;

    composedWebviewTag += ` data-readonly="${
      options.readonlyUrl ? "true" : "false"
    }"`;
    if (options.id) {
      composedWebviewTag += ` id=${options.id}`;
    }
    if (options.node) {
      composedWebviewTag += " nodeintegration";
    }
    if (options.webviewAttributes) {
      Object.keys(options.webviewAttributes).forEach((key) => {
        composedWebviewTag += ` ${key}="${options.webviewAttributes[key]}"`;
      });
    }
    $("#nav-body-views").append(`${composedWebviewTag}></webview>`);
    // enable reload button
    $("#reload-tooltip-button").removeClass("disabled");

    let currentTab = { id: this.SESSION_ID, url, options };

    currentTabs.push(currentTab);
    // update url and add events
    this._updateUrl(this._purifyUrl(url));
    let newWebview = this._addEvents(this.SESSION_ID++, options);
    if (typeof options.postTabOpenCallback === "function") {
      options.postTabOpenCallback(newWebview);
    }
    (this.changeTabCallback || (() => {}))(newWebview);

    await this.parent.ipcRouter.waitForProcessRegister(currentTab.id);

    currentTab.webview = newWebview;

    resolve(currentTab);
  });
}; //:newTab()
//
// change current or specified tab and view
//
Navigation.prototype.changeTab = function (url, id, userAgent) {
  id = id || null;
  userAgent = userAgent || null;

  let activeView;

  if (id == null) {
    activeView = $(".nav-views-view.active");
  } else {
    activeView = $("#" + id);
  }

  if (activeView.length) {
    activeView.attr("src", this._purifyUrl(url));
  } else {
    logger.error(
      '[electron-navigation][func "changeTab();"]: Cannot find the ID "' +
        id +
        '"'
    );
  }
}; //:changeTab()
//
// Change Mute Button Status
//
Navigation.prototype.handleMuteButton = function (id) {
  id = id || null;

  var session;
  var webContents;

  if (id == null) {
    session = $(".nav-tabs-tab.active, .context-tabItem.active");
    webContents = $(".nav-views-view.active")[0];
  } else {
    if ($("#" + id).length) {
      var sessionID = $("#" + id).data("session");
      session = $(".context-tabItem, .nav-tabs-tab").filter(
        '[data-session="' + sessionID + '"]'
      );
      webContents = $('.nav-views-view[data-session="' + sessionID + '"]')[0];
    } else {
      session = $(".context-tabItem, .nav-tabs-tab").filter(
        '[data-session="' + id + '"]'
      );
      webContents = $('.nav-views-view[data-session="' + id + '"]')[0];
    }
  }

  var muteButton = session.find(".nav-tabs-mute")[0];

  if (session.hasClass("muted")) {
    session.removeClass("muted");
    muteButton.innerHTML =
      '<svg fill="#ffffff" width="13px" height="13px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" stroke="#ffffff"><g stroke-width="0"></g><g stroke-linecap="round" stroke-linejoin="round"></g><g><path fill-rule="evenodd" d="M11.553 3.064A.75.75 0 0112 3.75v16.5a.75.75 0 01-1.255.555L5.46 16H2.75A1.75 1.75 0 011 14.25v-4.5C1 8.784 1.784 8 2.75 8h2.71l5.285-4.805a.75.75 0 01.808-.13zM10.5 5.445l-4.245 3.86a.75.75 0 01-.505.195h-3a.25.25 0 00-.25.25v4.5c0 .138.112.25.25.25h3a.75.75 0 01.505.195l4.245 3.86V5.445z"></path><path d="M18.718 4.222a.75.75 0 011.06 0c4.296 4.296 4.296 11.26 0 15.556a.75.75 0 01-1.06-1.06 9.5 9.5 0 000-13.436.75.75 0 010-1.06z"></path><path d="M16.243 7.757a.75.75 0 10-1.061 1.061 4.5 4.5 0 010 6.364.75.75 0 001.06 1.06 6 6 0 000-8.485z"></path></g></svg>';
    if (!webContents.isCurrentlyAudible()) {
      muteButton.classList.add("hidden");
    }
    webContents.setAudioMuted(false);
  } else {
    session.addClass("muted");
    muteButton.innerHTML =
      '<svg fill="#ffffff" width="13px" height="13px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" stroke="#ffffff"><g stroke-width="0"></g><g stroke-linecap="round" stroke-linejoin="round"></g><g><path fill-rule="evenodd" d="M12 3.75a.75.75 0 00-1.255-.555L5.46 8H2.75A1.75 1.75 0 001 9.75v4.5c0 .966.784 1.75 1.75 1.75h2.71l5.285 4.805A.75.75 0 0012 20.25V3.75zM6.255 9.305l4.245-3.86v13.11l-4.245-3.86a.75.75 0 00-.505-.195h-3a.25.25 0 01-.25-.25v-4.5a.25.25 0 01.25-.25h3a.75.75 0 00.505-.195z"></path><path d="M16.28 8.22a.75.75 0 10-1.06 1.06L17.94 12l-2.72 2.72a.75.75 0 101.06 1.06L19 13.06l2.72 2.72a.75.75 0 101.06-1.06L20.06 12l2.72-2.72a.75.75 0 00-1.06-1.06L19 10.94l-2.72-2.72z"></path></g></svg>';
    muteButton.classList.remove("hidden");
    webContents.setAudioMuted(true);
  }
}; //:handleMuteButton()
//
// Change useragent
//
Navigation.prototype.handleUserAgent = function (url, id) {
  id = id || null;

  let activeView;

  if (id == null) {
    activeView = $(".nav-views-view.active");
  } else {
    activeView = $('.nav-views-view[data-session="' + id + '"]');
  }

  let userAgent = this._determineUserAgent(url);

  activeView.attr("useragent", userAgent);
  activeView[0].setUserAgent(userAgent);
};
//
// close current or specified tab and view
//
Navigation.prototype.closeTab = function (id) {
  id = id || null;

  var session;
  if (id == null) {
    session = $(
      ".context-tabItem.active, .nav-tabs-tab.active, .nav-views-view.active"
    );
  } else {
    if ($("#" + id).length) {
      var sessionID = $("#" + id).data("session");
      session = $(".context-tabItem, .nav-tabs-tab, .nav-views-view").filter(
        '[data-session="' + sessionID + '"]'
      );
    } else {
      var sessionID = id;
      session = $(".context-tabItem, .nav-tabs-tab, .nav-views-view").filter(
        '[data-session="' + sessionID + '"]'
      );
    }
  }

  session.css("flex-basis", "");

  currentTabs = currentTabs.filter((tab) => tab.id !== id);
  if (typeof tabsInfos[id] !== "undefined") {
    tabsInfos[id] = undefined;
  }
  let sessionIsActive = session.hasClass("active");
  session.remove();

  if (sessionIsActive) {
    $(".splitter").remove();
    this.prevTab();
  }

  this.parent.ipcRouter.main.removePreloadIPCProcess(
    session.attr("data-session"),
    this.parent.ipcRouter.processName
  );

  let tabsLength = $("#nav-body-tabs").find(".nav-tabs-tab").length;
  let topContainerWidth = $("#nav-body-tabs").width();
  if (tabsLength <= 1 || tabsLength * 60 + 90 <= topContainerWidth) {
    // Si c'est le cas, et s'il y a des onglets dans overflowTabs
    if (overflowTabs.length > 0) {
      // Prendre le premier onglet de overflowTabs
      const tabToRecreate = overflowTabs.shift();

      var tabToRemove = $(".context-tabItem").filter(
        '[data-session="' + tabToRecreate.id + '"]'
      );

      var currentTitle = tabToRemove.find(".title")[0]
        ? tabToRemove.find(".title")[0].innerText
        : "";

      const oldIcon = tabToRemove.find(".icon")[0];

      tabToRecreate.options.title = currentTitle;

      tabToRecreate.options.icon = oldIcon ? oldIcon.src : "";

      if (tabToRemove.hasClass("active")) {
        tabToRecreate.options.active = true;
      }

      tabToRemove.remove();

      this._createTab(
        "normal",
        tabToRecreate.url,
        tabToRecreate.options,
        tabToRecreate.id
      );
    }
  }

  let tabLength = document.querySelectorAll(".nav-tabs-tab").length;
  if (tabLength <= 0) {
    if (Config.get("onNewTab") == "homepage") {
      this.newTab(Config.get("homepage"));
    } else if (Config.get("onNewTab") == "newTab") {
      this.newTab(newTabURL);
    }
  }
}; //:closeTab()
//
//Move tab to new index
//
Navigation.prototype.moveTab = function (tab, index) {
  // On récupère la div à déplacer
  const tabs = Array.from(document.querySelectorAll(".nav-tabs-tab"));
  // On récupère la liste des divs tabs

  tabs.splice(index, 0, tab);

  tab.setAttribute("data-oldpos", "oldposition");

  // On met à jour l'index de la div
  tab.dataset.index = index;
}; //:moveTab()
//
//Split views
//
Navigation.prototype.splitTabs = function (tab1, tab2) {
  // Get the list of tab elements
  const tabs = [
    ...Array.from(document.querySelectorAll(".nav-tabs-tab")),
    ...Array.from(document.querySelectorAll(".context-tabItem"))
  ];
  const activeTabs = tabs.filter((tab) =>
    tab.classList.contains("active")
  ).length;

  if (activeTabs <= 1) {
    const tab1Index = tabs.indexOf(tab1);
    const tab2Index = tabs.indexOf(tab2);

    // Ensure valid tab indices
    if (tab1Index === -1 || tab2Index === -1) {
      console.error("Invalid tab elements provided.", tab1Index, tab2Index);
      return;
    }

    // Move tab2 to the position after tab1
    this.moveTab(tab2, tab1Index + 1);

    const view1 = document.querySelector(
      `.nav-views-view[data-session="${tab1.getAttribute("data-session")}"]`
    );
    const view2 = document.querySelector(
      `.nav-views-view[data-session="${tab2.getAttribute("data-session")}"]`
    );

    if (!view2) {
      console.error("Failed to find the view associated with tab2.");
      return;
    }

    tab2.classList.add("active");
    view2.classList.add("active");

    const splitter = document.createElement("div");
    splitter.classList.add("splitter");

    const navBodyViews = document.querySelector("#nav-body-views");

    // Remove existing splitter if present
    const existingSplitter = navBodyViews.querySelector(".splitter");
    if (existingSplitter) {
      navBodyViews.removeChild(existingSplitter);
    }

    // Insert splitter based on the order of the tabs
    const orderedViews = Array.from(
      navBodyViews.querySelectorAll(".nav-views-view")
    );
    const view1Index = orderedViews.indexOf(view1);
    const view2Index = orderedViews.indexOf(view2);

    if (view1Index < view2Index) {
      insertAfter(splitter, view1);
    } else {
      navBodyViews.insertBefore(splitter, view1);
    }

    makeDraggable(splitter, view1, view2);
  }
};
// Helper function to insert an element after another
function insertAfter(newNode, existingNode) {
  existingNode.parentNode.insertBefore(newNode, existingNode.nextSibling);
}
//
// go back on current or specified view
//
Navigation.prototype.back = function (id) {
  id = id || null;

  if (id == null) {
    $(".nav-views-view.active")[0].goBack();
  } else {
    if ($("#" + id).length) {
      $("#" + id)[0].goBack();
    } else {
      logger.error(
        '[electron-navigation][func "back();"]: Cannot find the ID "' + id + '"'
      );
    }
  }
}; //:back()
//
// go forward on current or specified view
//
Navigation.prototype.forward = function (id) {
  id = id || null;
  if (id == null) {
    $(".nav-views-view.active")[0].goForward();
  } else {
    if ($("#" + id).length) {
      $("#" + id)[0].goForward();
    } else {
      logger.error(
        '[electron-navigation][func "forward();"]: Cannot find the ID "' +
          id +
          '"'
      );
    }
  }
}; //:forward()
//
// reload current or specified view
//
Navigation.prototype.reload = function (id) {
  id = id || null;
  if (id == null) {
    let webview = $(".nav-views-view.active")[0];
    this.handleUserAgent(webview.getURL());
    webview.reload();
  } else {
    if ($("#" + id).length) {
      $("#" + id)[0].reload();
    } else {
      $('.nav-views-view[data-session="' + id + '"]')[0].reload();
    }
  }
}; //:reload()
//
// stop loading current or specified view
//
Navigation.prototype.stop = function (id) {
  id = id || null;
  if (id == null) {
    $(".nav-views-view.active")[0].stop();
  } else {
    if ($("#" + id).length) {
      $("#" + id)[0].stop();
    } else {
      logger.error(
        '[electron-navigation][func "stop();"]: Cannot find the ID "' + id + '"'
      );
    }
  }
}; //:stop()
//
// listen for a message from webview
//
Navigation.prototype.listen = function (id, callback) {
  let webview = null;

  //check id
  if ($("#" + id).length) {
    webview = document.getElementById(id);
  } else {
    logger.error(
      '[electron-navigation][func "listen();"]: Cannot find the ID "' + id + '"'
    );
  }

  // listen for message
  if (webview != null) {
    try {
      webview.addEventListener("ipc-message", (event) => {
        callback(event.channel, event.args, webview);
      });
    } catch (e) {
      webview.addEventListener("dom-ready", function (event) {
        webview.addEventListener("ipc-message", (event) => {
          callback(event.channel, event.args, webview);
        });
      });
    }
  }
}; //:listen()
//
// send message to webview
//
Navigation.prototype.send = function (tabID, channel, args) {
  let webview =
    document.querySelectorAll('webview[data-session="' + tabID + '"]')[0] ||
    document
      .getElementById("nav-body-views")
      .getElementsByClassName("active")[0];

  // check id
  if (!webview) {
    logger.error(
      '[electron-navigation][func "send();"]: Cannot find the ID "' +
        tabID +
        '"'
    );
  }

  // send a message
  if (webview != null) {
    try {
      webview.addEventListener("dom-ready", function (event) {
        webview.send(channel, args);
      });
    } catch (e) {}
  }
}; //:send()
//
// send message to all webviews
//
Navigation.prototype.sendToAll = function (channel, args) {
  return new Promise(function (resolve, reject) {
    let webviews = document.querySelectorAll("webview");
    let result = [];
    // check id
    if (!webviews) {
      logger.error(
        '[electron-navigation][func "send();"]: Cannot find the ID "' +
          tabID +
          '"'
      );
      reject(
        '[electron-navigation][func "send();"]: Cannot find the ID "' +
          tabID +
          '"'
      );
    }

    for (let i = 0; i < webviews.length; i++) {
      try {
        result.push(webviews[i].getAttribute("data-session"));
        webviews[i].addEventListener("dom-ready", function (event) {
          webviews[i].send(channel, args);
        });
        if (i == webviews.length - 1) {
          resolve(result);
        }
      } catch (e) {
        logger.error(
          '[electron-navigation][func "sendToAll();"]: Cannot send to All'
        );
        reject(e);
      }
    }
  });
}; //:sendToAll()
//
// open developer tools of current or ID'd webview
//
Navigation.prototype.openDevTools = function (id) {
  id = id || null;
  let webview = null;

  // check id
  if (id == null) {
    webview = $(".nav-views-view.active")[0];
  } else {
    if ($("#" + id).length) {
      webview = document.getElementById(id);
    } else {
      logger.error(
        '[electron-navigation][func "openDevTools();"]: Cannot find the ID "' +
          id +
          '"'
      );
    }
  }

  // open dev tools
  if (webview != null) {
    try {
      webview.openDevTools();
    } catch (e) {
      webview.addEventListener("dom-ready", function (event) {
        webview.openDevTools();
      });
    }
  }
}; //:openDevTools()
//
// print current or specified tab and view
//
Navigation.prototype.printTab = function (id, opts) {
  id = id || null;
  let webview = null;

  // check id
  if (id == null) {
    webview = $(".nav-views-view.active")[0];
  } else {
    if ($("#" + id).length) {
      webview = document.getElementById(id);
    } else {
      logger.error(
        '[electron-navigation][func "printTab();"]: Cannot find the ID "' +
          id +
          '"'
      );
    }
  }

  // print
  if (webview != null) {
    webview.print(opts || {});
  }
};
//:nextTab()
//
// toggle next available tab
//
Navigation.prototype.nextTab = function () {
  var tabs = [
    ...$(".nav-tabs-tab").toArray(),
    ...$(".context-tabItem").toArray()
  ];
  var activeTabIndex =
    tabs.indexOf($(".nav-tabs-tab.active")[0]) ||
    tabs.indexOf($(".context-tabItem.active")[0]);
  var nexti = activeTabIndex + 1;
  if (nexti > tabs.length - 1) nexti = 0;
  $($(".nav-tabs-tab")[nexti]).trigger("click");
  return false;
}; //:nextTab()
//:prevTab()
//
// toggle previous available tab
//
Navigation.prototype.prevTab = function () {
  // Récupère tous les onglets dans un tableau
  var tabs = [
    ...$(".nav-tabs-tab").toArray(),
    ...$(".context-tabItem").toArray()
  ];

  // Trouve l'index de l'onglet actif
  var activeTabIndex = tabs.findIndex((tab) => $(tab).hasClass("active"));

  // Si aucun onglet actif n'est trouvé, retourne au dernier onglet
  if (activeTabIndex === -1) {
    $(tabs[tabs.length - 1]).trigger("click");
    return tabs[tabs.length - 1]; // Retourne toujours un onglet
  }

  // Calcule l'index du prochain onglet
  var nextIndex = activeTabIndex + 1;

  // Si le prochain index dépasse la taille des onglets, revient au dernier onglet
  if (nextIndex >= tabs.length) {
    var prevIndex = (activeTabIndex - 1 + tabs.length) % tabs.length;
    $(tabs[prevIndex]).trigger("click");
    return tabs[prevIndex]; // Retourne le dernier disponible (précédent dans ce cas)
  }

  // Active le prochain onglet
  $(tabs[nextIndex]).trigger("click");
  return tabs[nextIndex]; // Retourne le prochain onglet
}; //:prevTab()
// go to a tab by index or keyword
//
Navigation.prototype.goToTab = function (index) {
  $activeTabAndView = $(
    "#nav-body-tabs .nav-tabs-tab.active, #nav-body-views .nav-views-view.active"
  );

  if (index == "previous") {
    $tabAndViewToActivate = $activeTabAndView.prev(
      "#nav-body-tabs .nav-tabs-tab, #nav-body-views .nav-views-view"
    );
  } else if (index == "next") {
    $tabAndViewToActivate = $activeTabAndView.next(
      "#nav-body-tabs .nav-tabs-tab, #nav-body-views .nav-views-view"
    );
  } else if (index == "last") {
    $tabAndViewToActivate = $(
      "#nav-body-tabs .nav-tabs-tab:last-of-type, #nav-body-views .nav-views-view:last-of-type"
    );
  } else {
    $tabAndViewToActivate = $(
      "#nav-body-tabs .nav-tabs-tab:nth-of-type(" +
        index +
        "), #nav-body-views .nav-views-view:nth-of-type(" +
        index +
        ")"
    );
  }

  if ($tabAndViewToActivate.length) {
    $("#nav-ctrls-url").blur();
    $activeTabAndView.removeClass("active");
    $tabAndViewToActivate.addClass("active");

    this._updateUrl();
    this._updateCtrls();
  }
}; //:goToTab()
Navigation.prototype.setTabInfos = function (tabID, infos, group) {
  tabsInfos[tabID] = infos;
}; //:setTabInfos()
Navigation.prototype.saveState = async function () {
  await this.parent.stateRecover.saveTabState(currentTabs, tabsInfos);
  await Config.set("savedState", true);
}; //:saveState()
Navigation.prototype.resumeState = async function () {
  return new Promise(async (resolve, reject) => {
    try {
      // Tentative de récupération des onglets enregistrés
      let rawTabs;
      try {
        rawTabs = await this.parent.userDatasModel.getSavedTabs();
        if (!rawTabs) {
          Config.set("savedState", false);
          reject("Aucun onglet enregistré trouvé.");
        }
      } catch (error) {
        reject(
          "Erreur lors de la récupération des onglets enregistrés : " +
            error.message
        );
      }

      let tabs = rawTabs.tabs;
      tabsInfos =
        typeof tabsInfos === "Array" && tabsInfos.length > 0
          ? [...rawTabs.tabsInfos]
          : [];

      // Tentative de recréation des onglets
      try {
        tabs.forEach(async (tab) => {
          let userAgent = this._determineUserAgent(tab.url);

          tab.options.webviewAttributes = { useragent: userAgent };

          await this.parent.stateRecover.restoreCookies(tab);
          await this.newTab(tab.url, tab.options);
        });
      } catch (tabError) {
        reject(
          "Erreur lors de la recréation des onglets : " + tabError.message
        );
      }

      // Mise à jour de l'état de stockage
      try {
        Config.set("savedState", false);
        this.parent.userDatasModel.removeSavedTabs();
        resolve(true);
      } catch (stateError) {
        reject(
          "Erreur lors de la mise à jour de l'état de stockage : " +
            stateError.message
        );
      }
    } catch (error) {
      // Gestion centralisée des erreurs
      console.error("Une erreur est survenue dans resumeState: ", error);

      Config.set("savedState", false);
      this.parent.userDatasModel.removeSavedTabs();

      reject();
      // Gérer l'erreur comme nécessaire
    }
  });
}; //:resumeState()
Navigation.prototype.getTab = function (id) {
  let returnTab;
  if (!id) {
    id = document
      .getElementById("nav-body-views")
      .getElementsByClassName("active")[0]
      .getAttribute("data-session");
  }
  currentTabs.map((tab) => {
    if (tab.id == id) {
      returnTab = tab;
      returnTab.id = parseInt(id);
    }
  });
  return returnTab;
};

Navigation.prototype.getCurrentTab = function () {
  return $(".nav-views-view.active")[0];
};

Navigation.prototype.getViewById = function (id) {
  return $(`.nav-views-view[data-session="${id}"]`)[0];
};
/**
 * MODULE EXPORTS
 */
module.exports = Navigation;
