import React, { createContext, useContext, useState } from "react";
import {
  UI_TRANSLATIONS,
  AVAILABLE_LANGUAGES
} from "../constants/translations";
import { storage } from "../utils/storage";
import { STORAGE_KEYS } from "../constants/storageKeys";

const LanguageContext = createContext({
  language: "en",
  displayCode: "EN",
  availableLanguages: AVAILABLE_LANGUAGES,
  setLanguage: () => {},
  t: (key, fallback) => key,
  caJurisdictionState: "Karnataka",
  setCaJurisdictionState: () => {}
});

export const LanguageProvider = ({ children }) => {
  const [availableLanguages] = useState(AVAILABLE_LANGUAGES);

  const [caJurisdictionState, setCaJurisdictionStateInternal] = useState(() => {
    return storage.get("zd_ca_state", "Karnataka");
  });

  const [language, setLanguageState] = useState(() => {
    try {
      const saved = storage.get(STORAGE_KEYS.LANGUAGE);
      if (saved && typeof saved === "string") {
        const s = saved.toLowerCase().trim();
        if (["en", "hi", "te", "kn", "mr"].includes(s)) return s;
      }
    } catch {}
    return "en";
  });

  const setLanguage = (langCode) => {
    if (!langCode) return;
    const code = String(langCode).toLowerCase().trim();
    if (["en", "hi", "te", "kn", "mr"].includes(code)) {
      setLanguageState(code);
      storage.set(STORAGE_KEYS.LANGUAGE, code);
    }
  };

  const setCaJurisdictionState = (stateName) => {
    setCaJurisdictionStateInternal(stateName);
    storage.set("zd_ca_state", stateName);
  };

  const t = (key, fallback = "") => {
    const langDict = UI_TRANSLATIONS[language] || UI_TRANSLATIONS.en;
    if (langDict && langDict[key] !== undefined) {
      return langDict[key];
    }
    if (UI_TRANSLATIONS.en && UI_TRANSLATIONS.en[key] !== undefined) {
      return UI_TRANSLATIONS.en[key];
    }
    return fallback || key;
  };

  const currentLangObj = availableLanguages.find((l) => l.code === language);
  const displayCode = currentLangObj ? currentLangObj.displayCode : "EN";

  return (
    <LanguageContext.Provider
      value={{
        language,
        displayCode,
        availableLanguages,
        setLanguage,
        t,
        caJurisdictionState,
        setCaJurisdictionState
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
export default LanguageProvider;
