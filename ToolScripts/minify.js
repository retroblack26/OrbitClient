const fs = require("fs");
const path = require("path");
const JavaScriptObfuscator = require("javascript-obfuscator");
const terser = require("terser");

const sourceDir = "../"; // Directory containing files
const outputDir = "./distM"; // Directory to save processed files
const excludedDirs = ["node_modules", "ToolScripts", "dist"]; // Excluded directories
const excludedFiles = ["minifyOnly1.js", "minifyOnly2.js"]; // Files to be minified but not obfuscated

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Obfuscation configuration
const obfuscationOptions = {
  compact: true,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.75,
  numbersToExpressions: true,
  simplify: true,
  splitStrings: true,
  stringArray: true,
  stringArrayThreshold: 0.75,
  stringArrayEncoding: ["rc4"], // Adds RC4 encoding for strings
  stringArrayRotate: true,
  transformObjectKeys: true,
  deadCodeInjection: true,
  deadCodeInjectionThreshold: 0.4,
  renameGlobals: true, // Prevent renaming of globals
  unicodeEscapeSequence: false,
  ignoreRequireImports: true, // Prevent obfuscation of require imports
  reservedNames: ["^ipcRouter$", "^main$", "^core$"] // Preserve parts of ipcRouter references
};

// Function to check if a directory is excluded
const isExcludedDir = (dirPath) => {
  if (dirPath.startsWith(".")) return true;
  return excludedDirs.some((excludedDir) =>
    dirPath.includes(path.resolve(sourceDir, excludedDir))
  );
};

// Function to check if a file should be minified but not obfuscated
const isExcludedFile = (filePath) => {
  if (
    filePath.endsWith(".db") ||
    filePath.startsWith(".") ||
    filePath.endsWith(".sql") ||
    filePath.endsWith(".code-workspace")
  ) {
    return true;
  }
  return excludedFiles.includes(path.basename(filePath));
};

// Function to check if a file is IPCFunctions.js
const isIPCFunctionsFile = (filePath) => filePath.endsWith("IPCFunctions.js");

// Function to preprocess ipcRouter lines
const preprocessCode = (code) => {
  const ipcPattern = /(this\.)?ipcRouter\.\w+\.\w+/g; // Match ipcRouter patterns
  return code.replace(
    ipcPattern,
    (match) => `/*IPC_MARKER_START*/${match}/*IPC_MARKER_END*/`
  );
};

// Function to post-process ipcRouter lines
const postprocessCode = (code) => {
  return code
    .replace(/\/\*IPC_MARKER_START\*\//g, "")
    .replace(/\/\*IPC_MARKER_END\*\//g, "");
};

// Recursive function to process files
const processFilesRecursively = (currentDir, outputDir) => {
  if (isExcludedDir(currentDir)) {
    console.log(`Skipping excluded directory: ${currentDir}`);
    return;
  }

  fs.readdirSync(currentDir).forEach((item) => {
    if (isExcludedFile(item)) {
      console.log(`Skipping excluded file: ${item}`);
      return;
    }

    const itemPath = path.join(currentDir, item);
    const outputItemPath = path.join(
      outputDir,
      path.relative(sourceDir, itemPath)
    );

    if (fs.lstatSync(itemPath).isDirectory()) {
      if (!isExcludedDir(itemPath)) {
        if (!fs.existsSync(outputItemPath)) {
          fs.mkdirSync(outputItemPath, { recursive: true });
        }
        processFilesRecursively(itemPath, outputDir);
      }
    } else if (item.endsWith(".js")) {
      console.log(`Processing: ${itemPath}`);
      let code = fs.readFileSync(itemPath, "utf8");

      if (isExcludedFile(itemPath)) {
        console.log(`Minifying (not obfuscating): ${itemPath}`);
        terser
          .minify(code)
          .then((result) => {
            fs.writeFileSync(outputItemPath, result.code, "utf8");
            console.log(`Minified file saved: ${outputItemPath}`);
          })
          .catch((err) => {
            console.error(`Error minifying ${itemPath}:`, err);
          });
      } else {
        if (isIPCFunctionsFile(itemPath)) {
          console.log(`Preprocessing IPCFunctions.js: ${itemPath}`);
          code = preprocessCode(code);
        }

        console.log(`Obfuscating: ${itemPath}`);
        const obfuscationResult = JavaScriptObfuscator.obfuscate(
          code,
          obfuscationOptions
        );
        let obfuscatedCode = obfuscationResult.getObfuscatedCode();

        if (isIPCFunctionsFile(itemPath)) {
          console.log(`Postprocessing IPCFunctions.js: ${itemPath}`);
          obfuscatedCode = postprocessCode(obfuscatedCode);
        }

        fs.writeFileSync(outputItemPath, obfuscatedCode, "utf8");
        console.log(`Obfuscated file saved: ${outputItemPath}`);
      }
    } else {
      console.log(`Copying: ${itemPath}`);
      fs.copyFileSync(itemPath, outputItemPath);
      console.log(`Copied file saved: ${outputItemPath}`);
    }
  });
};

// Start the processing
processFilesRecursively(path.resolve(sourceDir), path.resolve(outputDir));
