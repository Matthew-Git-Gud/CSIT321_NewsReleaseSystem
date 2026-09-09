import {
  useEffect,
  useState,
} from "react";

import "./styles/App.css";

import AppRoutes from "./routes/AppRoutes";

type Theme = "light" | "dark";

const THEME_STORAGE_KEY =
  "news-release-theme";

function App() {
  const [theme, setTheme] =
    useState<Theme>(() =>
      localStorage.getItem(
        THEME_STORAGE_KEY,
      ) === "dark"
        ? "dark"
        : "light",
    );

  useEffect(() => {
    document.documentElement.dataset.theme =
      theme;

    localStorage.setItem(
      THEME_STORAGE_KEY,
      theme,
    );
  }, [theme]);

  const toggleTheme = () => {
    setTheme((currentTheme) =>
      currentTheme === "light"
        ? "dark"
        : "light",
    );
  };

  return (
    <AppRoutes
      theme={theme}
      onToggleTheme={toggleTheme}
    />
  );
}

export default App;