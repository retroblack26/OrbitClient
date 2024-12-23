const axios = require("axios");
const fs = require("fs");
const path = require("path");

// -----------------------------------------------------------------------------
// CONFIGURATION
// -----------------------------------------------------------------------------

// Replace this with your DeepL API key
const apiKey = "YOUR_DEEPL_API_KEY";

// DeepL API endpoint
const apiUrl = "https://api-free.deepl.com/v2/translate";

// Languages you want to translate to (your custom codes)
const languages = [
  "fr",
  "es",
  "de",
  "hy",
  "bg",
  "es-CL",
  "es-CO",
  "es-MX",
  "cs",
  "da",
  "en",
  "el",
  "uk",
  "fi",
  "hu",
  "it",
  "ja",
  "ko",
  "nl",
  "no-NO",
  "es-PE",
  "pl",
  "pt",
  "pt-BR",
  "ro",
  "ru",
  "sk",
  "sv",
  "tr",
  "ve"
];

// Language file mapping (if you need to map to different file names)
const langFileObject = {
  "es-CL": "cl_CL",
  "es-CO": "co_CO",
  "es-PE": "pe_PE",
  "no-NO": "no_NO",
  "es-MX": "es_MX",
  cs: "cs_CZ",
  da: "da_DK",
  el: "el_GR",
  en: "en_US",
  uk: "en_UK",
  ja: "ja_JP",
  ko: "ko_KR",
  "pt-BR": "pt_BR",
  sv: "sv_SE",
  hy: "ar_AR"
};

// Directory containing the .lang JSON files
const LOCALES_DIR = path.join(__dirname, "../../locales");

/**
 * Map your local language code --> DeepL recognized code
 */
const deepLLanguageMap = {
  // Standard
  fr: "FR",
  es: "ES",
  de: "DE",
  bg: "BG",
  cs: "CS",
  da: "DA",
  en: "EN",
  el: "EL",
  uk: "EN-GB",
  fi: "FI",
  hu: "HU",
  it: "IT",
  ja: "JA",
  ko: "KO",
  nl: "NL",
  pl: "PL",
  pt: "PT",
  ro: "RO",
  ru: "RU",
  sk: "SK",
  sv: "SV",
  tr: "TR",

  // Aliases for specialized locales
  "pt-BR": "PT-BR",
  "no-NO": "NB", // Norwegian Bokmål
  "es-CL": "ES",
  "es-CO": "ES",
  "es-PE": "ES",

  // If "hy" is Armenian and DeepL doesn't support it, fallback to e.g. 'EN'
  hy: "EN",

  // Example for Venezuelan Spanish
  ve: "ES"
};

/**
 * A small helper that normalizes a language code to a recognized DeepL target code.
 */
function getDeepLTargetLang(langCode) {
  if (deepLLanguageMap[langCode]) {
    return deepLLanguageMap[langCode];
  }

  // If there's a dash or underscore, try splitting
  const parts = langCode.split(/[-_]/);
  if (parts.length > 1 && deepLLanguageMap[parts[0]]) {
    return deepLLanguageMap[parts[0]];
  }

  // Fallback to EN
  console.warn(
    `No DeepL mapping found for "${langCode}". Falling back to "EN".`
  );
  return "EN";
}

// -----------------------------------------------------------------------------
// HELPER FUNCTIONS
// -----------------------------------------------------------------------------

/**
 * Get the file path for a given language code.
 */
function getFilePathForLang(lang) {
  if (langFileObject[lang]) {
    return path.join(LOCALES_DIR, `${langFileObject[lang]}.lang`);
  } else {
    // Fallback pattern: xx_XX.lang
    return path.join(LOCALES_DIR, `${lang}_${lang.toUpperCase()}.lang`);
  }
}

/**
 * Load the JSON from a language file. If it doesn't exist, returns {}.
 */
function loadLanguageData(lang) {
  const filePath = getFilePathForLang(lang);

  if (!fs.existsSync(filePath)) {
    return {};
  }

  try {
    const fileContent = fs.readFileSync(filePath, "utf8");
    return JSON.parse(fileContent);
  } catch (err) {
    console.error(`Error parsing JSON for ${lang}:`, err);
    return {};
  }
}

/**
 * Write data to a language file as JSON (pretty printed).
 */
function writeLanguageData(lang, data) {
  const filePath = getFilePathForLang(lang);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
}

/**
 * Translate a single text to a specific language using DeepL API.
 */
async function translateText(text, localLangCode) {
  const deepLCode = getDeepLTargetLang(localLangCode);

  try {
    const response = await axios.post(apiUrl, null, {
      params: {
        auth_key: apiKey,
        text,
        target_lang: deepLCode
      }
    });

    return response.data.translations[0].text;
  } catch (error) {
    console.error(
      `Error translating "${text}" to ${localLangCode} (DeepL code: ${deepLCode}): ${error.message}`
    );
    return null; // Return null so we can handle it gracefully
  }
}

/**
 * Translate a value into all configured languages (using our local codes).
 */
async function translateValueForAllLanguages(key, originalValue) {
  const translations = {};

  for (const lang of languages) {
    const translatedText = await translateText(originalValue, lang);
    if (translatedText !== null) {
      translations[lang] = translatedText;
      console.log(
        `Translation successful: ${key} -> [${lang}]: ${translatedText}`
      );
    } else {
      // Could not translate for some reason, fallback to original text
      translations[lang] = originalValue;
    }
  }

  return translations;
}

// -----------------------------------------------------------------------------
// MAIN COMMANDS
// -----------------------------------------------------------------------------

/**
 * ADD COMMAND:
 * Add a new key with a given original value. Then auto-translate to all
 * other languages and write to each locale file.
 */
async function addKeyValue(key, value) {
  const translations = await translateValueForAllLanguages(key, value);
  for (const lang of languages) {
    const langData = loadLanguageData(lang);
    langData[key] = translations[lang];
    writeLanguageData(lang, langData);
    console.log(`Added/Updated key "${key}" in ${lang} file.`);
  }
  console.log("Translations successfully added to language files.");
}

/**
 * REMOVE COMMAND:
 * Remove a specific key from all locale files.
 */
function removeKeyFromAllFiles(key) {
  for (const lang of languages) {
    const langData = loadLanguageData(lang);
    if (Object.prototype.hasOwnProperty.call(langData, key)) {
      delete langData[key];
      writeLanguageData(lang, langData);
      console.log(`Removed key "${key}" from ${lang}`);
    }
  }
  console.log(`Key "${key}" removed from all locale files (where it existed).`);
}

/**
 * FILL-MISSING COMMAND:
 * Find keys that are missing in any locale. For each missing key, pick a source
 * translation from a locale that has it, then translate to the missing locale(s).
 * If a specific key is given, only fill that one; otherwise fill all.
 */
async function fillMissingKeys(optionalKey) {
  // 1. Gather all keys from all languages
  const allKeys = new Set();
  const allData = {};

  for (const lang of languages) {
    const data = loadLanguageData(lang);
    allData[lang] = data;
    Object.keys(data).forEach((k) => allKeys.add(k));
  }

  // If user provided a single key, we only want to fill that key
  let keysToCheck = allKeys;
  if (optionalKey) {
    keysToCheck = new Set([optionalKey]);
  }

  // 2. For each key, see which languages are missing it
  for (const key of keysToCheck) {
    const localesWithKey = [];
    const localesMissingKey = [];
    for (const lang of languages) {
      if (allData[lang][key] !== undefined) {
        localesWithKey.push(lang);
      } else {
        localesMissingKey.push(lang);
      }
    }

    // If key doesn't exist in ANY locale, we skip
    if (localesWithKey.length === 0) {
      console.warn(`Key "${key}" does not exist in ANY locale. Skipping...`);
      continue;
    }

    // 3. Choose a source locale that already has the key
    const sourceLocale = localesWithKey[0];
    const sourceText = allData[sourceLocale][key];

    // 4. Translate for each missing locale
    for (const missingLang of localesMissingKey) {
      try {
        console.log(
          `Translating key "${key}" from ${sourceLocale} to ${missingLang}...`
        );
        const translatedValue = await translateText(sourceText, missingLang);
        if (translatedValue !== null) {
          allData[missingLang][key] = translatedValue;
          writeLanguageData(missingLang, allData[missingLang]);
          console.log(
            `Filled missing key "${key}" in ${missingLang} using source from ${sourceLocale}.`
          );
        }
      } catch (error) {
        console.error(
          `Error filling missing key "${key}" for ${missingLang}: ${error.message}`
        );
      }
    }
  }

  console.log("Done filling missing keys.");
}

// -----------------------------------------------------------------------------
// NEW: VERIFY COMMAND (CHECKS FOR ISSUES, INCLUDING DUPLICATE KEYS)
// -----------------------------------------------------------------------------

/**
 * A helper that checks if a file has the same key repeated multiple times.
 * Even though JSON parse discards duplicates, we scan the raw text to spot them.
 */
function checkForDuplicateKeysInRawFile(lang) {
  const filePath = getFilePathForLang(lang);
  if (!fs.existsSync(filePath)) {
    return []; // No file, no duplicates
  }

  const rawContent = fs.readFileSync(filePath, "utf8");
  // Simple regex to capture "key": (someValue).
  // This won't handle all edge cases (like keys with escaped quotes) but is generally fine for typical .lang files.
  const keyRegex = /"([^"]+)"\s*:/g;

  const foundKeys = new Set();
  const duplicates = [];

  let match;
  while ((match = keyRegex.exec(rawContent)) !== null) {
    const capturedKey = match[1];
    if (foundKeys.has(capturedKey)) {
      duplicates.push(capturedKey);
    } else {
      foundKeys.add(capturedKey);
    }
  }

  return duplicates;
}

/**
 * VERIFY COMMAND:
 * 1) Checks for missing translations
 * 2) Checks for empty or null translations
 * 3) Checks for duplicate keys within the same file (doublons)
 *
 * Feel free to expand or modify this logic to your needs.
 */
function verifyTranslations() {
  console.log("Verifying translations in all language files...\n");

  // Load data for all languages
  const allData = {};
  for (const lang of languages) {
    allData[lang] = loadLanguageData(lang);
  }

  // Collect a global set of all keys
  const allKeys = new Set();
  for (const lang of languages) {
    Object.keys(allData[lang]).forEach((k) => allKeys.add(k));
  }

  let issuesFound = false;

  // 1) Check for missing translations
  for (const key of allKeys) {
    const missingLocales = languages.filter(
      (lang) => allData[lang][key] === undefined
    );
    if (missingLocales.length > 0) {
      issuesFound = true;
      console.warn(
        `Key "${key}" is missing in locales: ${missingLocales.join(", ")}`
      );
    }
  }

  // 2) Check for empty or null translations
  for (const lang of languages) {
    const data = allData[lang];
    for (const [key, value] of Object.entries(data)) {
      if (value === null || value === "") {
        issuesFound = true;
        console.warn(`Empty or null translation: key "${key}" in ${lang}`);
      }
    }
  }

  // 3) Check for duplicate keys (doublons) in raw file
  for (const lang of languages) {
    const duplicates = checkForDuplicateKeysInRawFile(lang);
    if (duplicates.length > 0) {
      issuesFound = true;
      console.warn(
        `Duplicates found in ${lang} file: ${duplicates.join(", ")}`
      );
    }
  }

  // (Optional) You could add further checks here:
  // e.g., verify placeholders, ensure translations are not identical to source, etc.

  if (!issuesFound) {
    console.log("No translation issues found!\n");
  } else {
    console.log("\nVerification completed. Issues (if any) are listed above.");
  }
}

/**
 * Add a new language and translate all existing keys to the new language.
 * @param {string} langCode - The language code (e.g., "es-MX").
 * @param {string} deepLCode - The corresponding DeepL language code (e.g., "ES").
 * @param {string} sourceLang - The source language to translate from (default is 'en').
 */
async function addLanguage(langCode, deepLCode, sourceLang = "en") {
  if (!langCode || !deepLCode) {
    console.error("Both language code and DeepL code are required.");
    return;
  }

  // Check if the language already exists
  if (languages.includes(langCode)) {
    console.warn(`Language "${langCode}" already exists.`);
    return;
  }

  // Add the new language
  languages.push(langCode);
  deepLLanguageMap[langCode] = deepLCode;

  console.log(`Language "${langCode}" added with DeepL code "${deepLCode}".`);

  // Load existing keys from the source language
  const sourceData = loadLanguageData(sourceLang);
  const newLanguageData = {};

  console.log(
    `Translating ${
      Object.keys(sourceData).length
    } keys from ${sourceLang} to ${langCode}...`
  );

  // Translate all keys for the new language
  for (const [key, value] of Object.entries(sourceData)) {
    try {
      const translatedValue = await translateText(value, langCode);
      newLanguageData[key] = translatedValue || value;
      console.log(`Translated "${key}" to ${langCode}.`);
    } catch (error) {
      console.error(
        `Error translating key "${key}" to ${langCode}: ${error.message}`
      );
      newLanguageData[key] = value; // Fallback to original value if translation fails
    }
  }

  // Write translated data to the new language file
  writeLanguageData(langCode, newLanguageData);
  console.log(`Translation for ${langCode} completed and saved.`);
}

// -----------------------------------------------------------------------------
// CLI HANDLER
// -----------------------------------------------------------------------------

async function main() {
  // Commands:
  //   node translator.js add <key> "<value>"
  //   node translator.js remove <key>
  //   node translator.js fill-missing [<key>]
  //   node translator.js verify
  const command = process.argv[2];
  const key = process.argv[3];
  const value = process.argv[4];

  switch (command) {
    case "add":
      if (!key || !value) {
        console.error('Usage: node translator.js add <key> "<value>"');
        process.exit(1);
      }
      await addKeyValue(key, value);
      break;

    case "remove":
      if (!key) {
        console.error("Usage: node translator.js remove <key>");
        process.exit(1);
      }
      removeKeyFromAllFiles(key);
      break;

    case "fill-missing":
      // If no key is provided, fill all missing keys
      await fillMissingKeys(key /* can be undefined or the string key */);
      break;

    case "verify":
      verifyTranslations();
      break;

    case "add-lang":
      const sourceLang = process.argv[5] ? process.argv[5] : undefined;

      if (!key || !value) {
        console.error(
          "Usage: node translator.js add-lang <langCode> <deepLCode> [sourceLang]"
        );
        process.exit(1);
      }
      await addLanguage(key, value, sourceLang);
      break;

    default:
      console.error(
        "Unknown command.\nUsage:\n" +
          '  node translator.js add <key> "<value>"\n' +
          "  node translator.js remove <key>\n" +
          "  node translator.js fill-missing [<key>]\n" +
          "  node translator.js verify\n" +
          "  node translator.js add-lang <langCode> <deepLCode> [sourceLang]\n"
      );
      process.exit(1);
  }
}

// Only run main if called directly from the command line
if (require.main === module) {
  main().catch((err) => {
    console.error("An error occurred:", err);
    process.exit(1);
  });
}
