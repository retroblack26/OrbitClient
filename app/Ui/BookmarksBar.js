const { ModalPopUp } = require("./Modal");
const UIUtils = require("../Utils/UiUtils");
const Utils = require("../Utils/Utils");
const Locales = require("../Locales");
const Config = new (require("../Models/Config"))();
const ImageCache = new (require("../Utils/ImageCache"))();

class BookmarksBar {
  constructor(core) {
    this.core = core;
    this._init().then(() => {
      this.reloadBookmarksBar();
    });
  }

  show() {
    this.bookmarksButton.classList.add("active");
    this.element.parentElement.style.display = "flex";

    setTimeout(() => {
      this.element.parentElement.classList.add("open");
    }, 0);

    if (Config.get("ui").bookmarksHidden == true) {
      Config.set("ui", { bookmarksHidden: false });
    }
  }

  hide() {
    this.bookmarksButton.classList.remove("active");

    this.element.parentElement.classList.remove("open");

    setTimeout(() => {
      this.element.parentElement.style.display = "none";
    }, 300);

    if (Config.get("ui").bookmarksHidden == false) {
      Config.set("ui", { bookmarksHidden: true });
    }
  }
  async _init() {
    this.element = await this._createBar();

    this.bookmarksButton = document.getElementById("bookmarks-tooltip-button");
    let bookmarks = this.element.parentElement;

    if (
      Config.get("ui").bookmarksHidden == false &&
      (await this.core.bookmarksModel.count()) > 0
    ) {
      this.show();
    }

    this.element.addBookmarkButton.addEventListener("click", (e) => {
      this.showBookmarkModal();
    });

    this.bookmarksButton.addEventListener("click", () => {
      // This function is called after the animation completes
      if (!bookmarks.classList.contains("open")) {
        this.show();
        /*    // If #nav-body-ctrls is visible after toggle
                   this.classList.add('active');
                   bookmarks.style.display = 'flex';
                   bookmarks.classList.add('open');
    */
        // Assuming store.set is part of a library that doesn't depend on jQuery
      } else {
        this.hide();
        // If #nav-body-ctrls is hidden after toggle
        /*   this.classList.remove('active');
                  bookmarks.style.display = 'none';
                  bookmarks.classList.remove('open');
                  Config.set('ui', { bookmarksHidden: true })
  
                  // For resetting the SVG transformation
                  if (collapseButtonSvg) {
                      collapseButtonSvg.style.transform = 'translate(-50%, -50%) rotate(0deg)';
                  } */
      }
    });
  }

  async removeBookmark(id) {
    let bookmark = await this.core.bookmarksModel.find(id);

    if (bookmark) {
      ImageCache.removeImage(bookmark.icon);
    }

    this.core.bookmarksModel.delete(id);
    let bookmarkElement =
      document.querySelectorAll('.single-bookmark[data-id="' + id + '"]')[0] ||
      document.querySelector('.context-Item[data-id="' + id + '"]');
    bookmarkElement.remove();
    this.reloadBookmarksBar(true);
    this.checkBookmarksFit();
  }

  _createBar() {
    return new Promise((resolve, reject) => {
      let content = `	<div id="nav-body-bookmarks">
		<button id="addBookmark-btn" data-locale="{'addBookmark.tooltip.button':'title'}" title="add bookmark"
			style="left: 4px;">
			<svg width="7px" height="7px" viewBox="0 0 32 32" version="1.1" xmlns="http://www.w3.org/2000/svg"
				xmlns:xlink="http://www.w3.org/1999/xlink" fill="#000000">
				<g stroke-width="0"></g>
				<g stroke-linecap="round" stroke-linejoin="round"></g>
				<g>
					<g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" sketch:type="MSPage">
						<g id="Icon-Set-Filled" sketch:type="MSLayerGroup"
							transform="translate(-362.000000, -1037.000000)" fill="#ffffff">
							<path
								d="M390,1049 L382,1049 L382,1041 C382,1038.79 380.209,1037 378,1037 C375.791,1037 374,1038.79 374,1041 L374,1049 L366,1049 C363.791,1049 362,1050.79 362,1053 C362,1055.21 363.791,1057 366,1057 L374,1057 L374,1065 C374,1067.21 375.791,1069 378,1069 C380.209,1069 382,1067.21 382,1065 L382,1057 L390,1057 C392.209,1057 394,1055.21 394,1053 C394,1050.79 392.209,1049 390,1049"
								id="plus" sketch:type="MSShapeGroup"> </path>
						</g>
					</g>
				</g>
			</svg>
		</button>
		<div id="bookmarks-container"></div>
		<button class="bookmark-topbar-button topbar-button hidden pop-comp-ele" id="more-bookmarks-button"
			data-locale="{'bookmarks.tooltip.button':'title'}" data-popover-target="#overflowBookmarksContainer"
			title="Afficher les signets">
			<svg width="16px" height="32px" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" fill="#000000">
				<g stroke-width="0"></g>
				<g stroke-linecap="round" stroke-linejoin="round"></g>
				<g>
					<path fill="#ffffff"
						d="M13.7,6.3C13.5,6.1,13.3,6,13,6H5C4.7,6,4.5,6.1,4.3,6.3c-0.4,0.4-0.4,1,0,1.4l4,4C8.5,11.9,8.7,12,9,12 s0.5-0.1,0.7-0.3l4-4C14.1,7.3,14.1,6.7,13.7,6.3L13.7,6.3z">
					</path>
				</g>
			</svg>
		</button>
	</div>`;

      document
        .getElementById("nav-body-ctrls")
        .insertAdjacentHTML("afterend", content);

      resolve({
        container: document.getElementById("bookmarks-container"),
        parentElement: document.getElementById("nav-body-bookmarks"),
        addBookmarkButton: document.getElementById("addBookmark-btn"),
        moreBookmarkButton: document.getElementById("more-bookmarks-button")
      });
    });
  }

  async _createBookmarkButton(bookmark, type = "normal") {
    return new Promise((resolve) => {
      let bookmarkContainer = this.element.container;
      let bookmarkElementClass = "single-bookmark";
      let bookmarkElement = document.createElement("div");

      if (this.element.parentElement.classList.contains("open")) {
        if (
          type !== "list" &&
          UIUtils.checkElementsFitContainer(
            this.element.container,
            document.querySelectorAll(".single-bookmark")
          ) == false
        ) {
          type = "list";
        }
        if (type == "list") {
          bookmarkElementClass = "context-Item";
          bookmarkElement.id = "context-bookmark";

          this.element.moreBookmarkButton.classList.remove("hidden");
        }
      }

      bookmarkElement.classList.add(bookmarkElementClass);
      bookmarkElement.setAttribute("data-id", bookmark.id);

      if (type !== "list") {
        if (bookmarkContainer.childElementCount == 0) {
          bookmarkElement.classList.add("impair");
        } else {
          if (bookmarkContainer.lastChild.classList.contains("impair")) {
            bookmarkElement.classList.add("pair");
          } else {
            bookmarkElement.classList.add("impair");
          }
        }
      } else {
        bookmarkContainer = document.getElementById(
          "overflowBookmarksContainer"
        );
      }

      let bookmarkIconContainer = document.createElement("div");
      bookmarkIconContainer.classList.add("icon");
      let bookmarkIcon = document.createElement("img");

      bookmarkIcon.src = bookmark.icon ? bookmark.icon : "icons/star.svg";

      let bookmarkTitle = document.createElement("div");
      bookmarkTitle.classList.add("title");
      bookmarkTitle.innerHTML = `<div class="slideText">${bookmark.title}</div>`;
      bookmarkTitle.title = bookmark.title;

      bookmarkIconContainer.appendChild(bookmarkIcon);
      bookmarkElement.appendChild(bookmarkIconContainer);
      bookmarkElement.appendChild(bookmarkTitle);

      bookmarkContainer.appendChild(bookmarkElement);

      bookmarkElement.addEventListener("click", async (e) => {
        let bookmarkEl = await this.core.bookmarksModel.find(bookmark.id);
        this.core.navigation.handleUserAgent(bookmarkEl.url);
        this.core.navigation.getCurrentTab().loadURL(bookmarkEl.url);
      });

      this.resizeId = null;
      window.addEventListener("resize", () => {
        clearTimeout(this.resizeId);
        this.resizeId = setTimeout(() => {
          this.checkBookmarksFit();
        }, 200);
      });

      UIUtils.makeElementDraggable(bookmarkElement, (event) => {
        const { type, draggedTabIndex, targetTabIndex, element, tabs } = event;
        if (type === "dragenter") {
          this.updateBookmarkClasses(element.parentElement.children);
          this.core.bookmarksModel.update(
            tabs[draggedTabIndex].getAttribute("data-id"),
            { position: targetTabIndex }
          );
          this.core.bookmarksModel.update(
            tabs[targetTabIndex].getAttribute("data-id"),
            { position: draggedTabIndex }
          );
        }
      });

      if (this.element.parentElement.style.display !== "none") {
        UIUtils.blinkElement(bookmarkElement, 1, 500);
      } else {
        UIUtils.blinkElement(this.bookmarksButton, 1, 500);
      }
      resolve();
    });
  }

  updateTitleBookmarkButton(id, title) {
    let bookmarkElement =
      this.element.container.querySelector(
        '.single-bookmark[data-id="' + id + '"]'
      ) || document.querySelector('#context-bookmark[data-id="' + id + '"]');
    bookmarkElement.querySelector(".title").innerHTML = title;
  }

  async checkBookmarksFit() {
    if (this.element.parentElement.classList.contains("open") === true) {
      const overBookmarks = document.querySelectorAll("#context-bookmark");
      const singleBookmarks = document.querySelectorAll(
        "#nav-body-bookmarks .single-bookmark"
      );
      const topContainer = this.element.container;
      const topContainerWidth = topContainer.clientWidth;

      const coverflowBookmarks = [];
      const normalBookmarksToRecreate = [];
      let currentWidth = 4;

      singleBookmarks.forEach((bookmark) => {
        currentWidth += parseInt(window.getComputedStyle(bookmark).minWidth);

        if (currentWidth >= topContainerWidth) {
          coverflowBookmarks.push(bookmark);
        }
      });

      overBookmarks.forEach((bookmark) => {
        if (currentWidth < topContainerWidth) {
          normalBookmarksToRecreate.push(bookmark);
        }
      });

      const recreateNormalBookmarks = async () => {
        for (const bookmark of normalBookmarksToRecreate) {
          await this._createBookmarkButton(
            await this.core.bookmarksModel.find(
              bookmark.getAttribute("data-id")
            )
          );
          bookmark.remove();
        }

        if (document.querySelectorAll("#context-bookmark").length <= 0) {
          this.element.moreBookmarkButton.classList.add("hidden");
        }
      };

      const createCoverflowBookmarks = async () => {
        for (const bookmark of coverflowBookmarks) {
          await this._createBookmarkButton(
            await this.core.bookmarksModel.find(
              bookmark.getAttribute("data-id")
            ),
            "list"
          );
          bookmark.remove();
        }
      };

      if (normalBookmarksToRecreate.length > 0) {
        await recreateNormalBookmarks();
      }

      if (coverflowBookmarks.length > 0) {
        this.element.moreBookmarkButton.classList.remove("hidden");
        await createCoverflowBookmarks();
      }
    }
  }

  updateBookmarkClasses(tabs) {
    for (let i = 0; i < tabs.length; i++) {
      if (i % 2 === 0) {
        tabs[i].classList.remove("pair");
        tabs[i].classList.add("impair");
      } else {
        tabs[i].classList.remove("impair");
        tabs[i].classList.add("pair");
      }
    }
  }

  _removeBookmarkButton(id) {
    new ModalPopUp({
      message: Locales.get("modal.bookmarks.delete.message"),
      buttons: [
        { text: Locales.get("modal.button.confirm"), type: "btn-green" },
        { text: Locales.get("modal.button.cancel"), type: "btn-red" }
      ],
      type: "info",
      size: "small"
    })
      .popUp()
      .then((result) => {
        if (result.buttonIndex == 0) {
          this.removeBookmark(id);
        } else {
          return false;
        }
      });
  }

  _updateBookmarkUrlAttribute(bookmark, url) {
    if (!bookmark || !url) {
      throw new Error("Arguments missing or invalid bookmark");
    }

    bookmark.setAttribute("url", url);
  }

  async reloadBookmarksBar(soft) {
    if (!soft) {
      let bookmarkElements = document.querySelectorAll(".single-bookmark");

      if (bookmarkElements.length > 0) {
        bookmarkElements.forEach((element) => {
          element.remove();
        });
      }
      for (let bookmark of await this.core.bookmarksModel.getSortedBookmarks()) {
        this._createBookmarkButton(bookmark);
      }
    } else {
      let bookmarksContainer = this.element.container;
      for (let i = 0; i < bookmarksContainer.children.length; i++) {
        if (i % 2 === 0) {
          bookmarksContainer.children[i].classList.remove("pair");
          bookmarksContainer.children[i].classList.add("impair");
        } else {
          bookmarksContainer.children[i].classList.remove("impair");
          bookmarksContainer.children[i].classList.add("pair");
        }
      }
    }
  }

  async addBookmark(values) {
    if (await this.core.bookmarksModel.contains(values.currentPage)) {
      return;
    }
    let title, icon;
    let elements = document.querySelectorAll(
      '[data-session="' + values.values[0].viewID + '"]'
    );
    let webview = elements[1];
    let tab = elements[0];

    if (webview) {
      title = webview.getTitle();
      try {
        icon = tab.querySelector(".nav-tabs-favicon").src;
      } catch (error) {
        console.log(error);
      }
    }
    let bookmark = {
      title: title,
      icon: icon,
      url: values.currentPage,
      position: 0
    };

    bookmark.id = await this.core.bookmarksModel.create(bookmark);

    if (bookmark.id == 1) {
      this.show();
      setTimeout(() => {
        this.hide();
      }, 3000);
    }

    this._createBookmarkButton(bookmark);

    ImageCache.downloadImage(bookmark.icon).then((result) => {
      this.core.bookmarksModel.update(bookmark.id, { icon: result.filePath });
    });
  }

  showBookmarkModal(data) {
    let options = {
      title: data
        ? Locales.get("modal.addBookmark.modify")
        : Locales.get("addBookmark.tooltip.button"),
      icon: "icons/star.svg",
      close: true,
      width: "225px",
      inputs: [
        {
          label: Locales.get("modal.addBookmark.input.title"),
          type: "text",
          name: "title",
          required: true
        },
        {
          label: Locales.get("modal.addBookmark.input.url"),
          type: "text",
          name: "url",
          placeholder: "URL",
          required: true
        }
      ],
      buttons: [
        {
          text: Locales.get("modal.button.confirm"),
          type: "btn-green"
        },
        {
          text: Locales.get("modal.button.cancel"),
          type: "btn-red",
          role: "abort"
        }
      ]
    };

    if (data) {
      options.inputs[0].value = data.title;
      options.inputs[1].value = data.url;
    }

    new ModalPopUp(options).popUp().then(async (result) => {
      //add logic to create or modify a bookmark
      if (result.buttonIndex == 0) {
        if (data) {
          this.core.bookmarksModel.update(data.id, {
            title: result.inputsData[0].title,
            url: result.inputsData[1].url
          });
          this.updateTitleBookmarkButton(data.id, result.inputsData[0].title);
        } else {
          let icon;
          if (Utils.isValidURL(result.inputsData[1].url)) {
            icon = await ImageCache.downloadImage(
              result.inputsData[1].url + "/favicon.ico"
            );
          }
          let bookmark = {
            title: result.inputsData[0].title,
            url: result.inputsData[1].url,
            icon: icon.filePath
          };
          let bookmarkID = await this.core.bookmarksModel.create(bookmark);
          bookmark.id = bookmarkID;
          await this._createBookmarkButton(bookmark);
        }
      }
    });
  }
}

module.exports = BookmarksBar;
