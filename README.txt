# OrbitClient 2.0 Beta (Open Source)

OrbitClient is an optimized, fully customizable client for DarkOrbit, now **open-source** and ready for community-driven development!

---

## 🚀 Features
- **Complete client rewrite in Object-Oriented Programming (OOP)** for better performance and scalability.
- **Modular architecture** allowing future plugin integration.
- **Bookmark system** with a redesigned favorites bar.
- **Enhanced transitions and animations** for smoother interactions.
- **Language corrections** + new **Mexican Spanish** localization.

---

## 🛠️ Installation
### Prerequisites
- **Node.js** and **npm** must be installed.

### Steps to Install
1. **Clone the repository:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/OrbitClient.git
   ```
2. **Navigate to the project directory:**
   ```bash
   cd path/to/OrbitClient
   ```
3. **Install dependencies:**
   ```bash
   npm install
   ```

---

## ▶️ Running the App
To start the application, run:
```bash
npm run start
```

**Tip:** To enable **developer mode** (automatically opens DevTools, adds logs, and element inspector), set the following environment variable in the `Main.js` file:
```javascript
process.env.ELECTRON_IS_DEV = 1;
```
Or run the app with this variable set in the terminal:
```bash
ELECTRON_IS_DEV=1 npm run start
```

---

## 🔨 Building the Application
Build the client for different platforms using the following commands:

- **Windows:**
   ```bash
   npm run buildWin
   ```
- **MacOS:**
   ```bash
   npm run buildMac
   ```
- **Linux (Debian):**
   ```bash
   npm run buildLinux
   ```

**Note:** In certain cases, you may need to add the extra argument `--openssl_fips=''` to the build command to ensure compatibility:
```bash
npm run buildMac --openssl_fips=''
```

The built application will appear in the `dist` directory.
Build the client for different platforms using the following commands:

- **Windows:**
   ```bash
   npm run buildWin
   ```
- **MacOS:**
   ```bash
   npm run buildMac
   ```
- **Linux (Debian):**
   ```bash
   npm run buildLinux
   ```

The built application will appear in the `dist` directory.

---

## 🚧 Obfuscation & Publishing
To prepare for distribution and secure your code:

1. **Navigate to the ToolScripts directory:**
   ```bash
   cd ToolScripts
   ```
2. **Run the minify script to obfuscate the code and copy files:**
   ```bash
   node minify.js
   ```
3. **Navigate to the output directory (`dist`) and build the app for your platform:**
   ```bash
   cd dist
   npm run buildWin  # or buildMac / buildLinux
   ```

The final app will be available in `distM/dist`.

---

## 🌐 Localization
OrbitClient supports multi-language localization using **DeepL API**. 

**Don't forget to add your free DeepL API key** to `translator.js` to make it work. 
Get your free API key here: [DeepL Free API Subscription](https://www.deepl.com/pro-api?cta=header-pro-api/)

Manage translations with the following script:
OrbitClient supports multi-language localization using **DeepL API**. Manage translations with the following script:
```bash
node translator.js <command>
```

### Available Commands:
- **Add a new translation key:**
   ```bash
   node translator.js add <key> "<value>"
   ```
- **Remove a translation key:**
   ```bash
   node translator.js remove <key>
   ```
- **Fill missing translations:**
   ```bash
   node translator.js fill-missing [<key>]
   ```
- **Verify translations:**
   ```bash
   node translator.js verify
   ```
- **Add a new language:**
   ```bash
   node translator.js add-lang <langCode> <deepLCode> [sourceLang]
   ```

---

## 🧑‍💻 Contribution & Support
- Contributions are welcome! Feel free to fork the project and submit a pull request.
- For questions or development discussions, join the **#⌨coding** channel on Discord.

🔗 **Official Website:** [OrbitClient](https://orbitclient.online)  
📥 **Download the latest build:** [Download Page](https://orbitclient.online/downloads/latest/)

