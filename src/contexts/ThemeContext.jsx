import React, { createContext, useContext, useEffect, useState } from "react";
import { STORAGE_KEYS } from "../constants/storageKeys";
import { storage } from "../utils/storage";

const ThemeContext = createContext({
  theme: "light",
  setTheme: () => {}
});

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
    return storage.get(STORAGE_KEYS.THEME, "light");
  });

  useEffect(() => {
    const activeTheme = theme || "light";
    document.documentElement.setAttribute("data-theme", activeTheme);
    document.body.setAttribute("data-theme", activeTheme);
    storage.set(STORAGE_KEYS.THEME, activeTheme);
  }, [theme]);

  const setTheme = (nextTheme) => {
    setThemeState(nextTheme);
    storage.set(STORAGE_KEYS.THEME, nextTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
export default ThemeProvider;
