class NewTabMiddleware {
  constructor(locales, serverListElement, searchCallback, ipcRouter) {
    this.locales = locales;
    this.ipcRouter = ipcRouter;
    this.serverListElement = serverListElement;
    this.searchCallback = searchCallback;
  }

  match(url) {
    const regex = /^file:\/\/.*\/newTab\/newTab\.html$/;
    return regex.test(url);
  }

  async handle() {
    this.initUi();
    this.createServerElement();
  }

  initUi() {
    try {
      this.discordButton = document.getElementById("discordButton");
      this.githubButton = document.getElementById("githubButton");
      this.serverListTitle = document.getElementById("bar-title");
      this.submitServerButton = document.getElementById("submitServerButton");
      this.searchInput = document.getElementById("searchInput");
      this.searchButton = document.getElementById("searchBtn");
      this.updateNoteContent = document
        .querySelector(".caracterContent")
        .querySelector(".content");

      //const updateNote = document.createElement("p");
      //updateNote.innerHTML = this.locales["updateNote.beta1"];

      const lastUpdateNote = document.createElement("p");
      lastUpdateNote.innerHTML = this.locales["updateNote.version2"];

      this.updateNoteContent.appendChild(lastUpdateNote);
      //this.updateNoteContent.appendChild(updateNote);

      this.searchInput.placeholder = this.locales["newTab.searchInput"];
      this.searchButton.innerText = this.locales["newTab.searchButton"];

      this.searchButton.addEventListener("click", (e) => {
        this.searchCallback(this.searchInput.value);
      });

      this.searchInput.addEventListener("keyup", (event) => {
        if (event.key === "Enter" || event.keyCode === 13) {
          this.searchCallback(this.searchInput.value);
        }
      });

      this.discordButton.firstChild.insertAdjacentText(
        "afterend",
        this.locales["newTab.discordButton"]
      );
      this.githubButton.firstChild.insertAdjacentText(
        "afterend",
        this.locales["newTab.githubButton"]
      );

      this.serverListTitle.innerText = this.locales["newTab.serverListTitle"];

      this.submitServerButton.innerText =
        this.locales["newTab.submitServerButton"];

      document.head.getElementsByTagName("title")[0].innerText =
        this.locales["newTab.title"];
    } catch (e) {
      console.error("Error initializing UI elements:", e);
    }
  }

  createServerElement() {
    try {
      let serverElement = document.createElement("div");
      serverElement.innerHTML = this.serverListElement;

      document
        .querySelector(".privateServers")
        .appendChild(serverElement.firstChild);

      document.querySelectorAll(".site-btn").forEach((button) => {
        button.addEventListener("click", () => {
          this.ipcRouter.redirectWebview(
            button.getAttribute("data-url"),
            sessionStorage.getItem("viewID")
          );
        });
      });

      document.querySelectorAll(".img-overlay, .arrow").forEach((site) => {
        site.addEventListener("click", function () {
          let siteContainer = this.parentElement;
          if (siteContainer.classList.contains("expanded")) {
            siteContainer.classList.remove("expanded");
          } else {
            // Remove 'expanded' from all other sites
            document
              .querySelectorAll(".site.expanded")
              .forEach((expandedSite) => {
                expandedSite.classList.remove("expanded");
              });
            // Add 'expanded' to the clicked site
            siteContainer.classList.add("expanded");
          }
        });
      });
    } catch (e) {
      console.error("Failed to create server element:", e);
    }
  }
}
module.exports = NewTabMiddleware;
