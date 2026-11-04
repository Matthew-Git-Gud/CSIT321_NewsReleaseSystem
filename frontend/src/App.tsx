import {
  useEffect,
  useState,
} from "react";

import "./styles/App.css";

import AppRoutes from "./routes/AppRoutes";
import {
  DEFAULT_ACCENT_COLOUR,
  isAccentColour,
  type AccentColour,
} from "./constants/appearance";
import { useAuth } from "./context/AuthContext";

type Theme = "light" | "dark";

const THEME_STORAGE_KEY =
  "news-release-theme";
const ACCENT_STORAGE_KEY =
  "news-release-accent-colour";

function App() {
  const { user } = useAuth();
  const [theme, setTheme] =
    useState<Theme>(() =>
      localStorage.getItem(
        THEME_STORAGE_KEY,
      ) === "dark"
        ? "dark"
        : "light",
    );

  const [accentColour, setAccentColour] =
    useState<AccentColour>(() => {
      const savedAccent = localStorage.getItem(
        ACCENT_STORAGE_KEY,
      );

      return isAccentColour(savedAccent)
        ? savedAccent
        : DEFAULT_ACCENT_COLOUR;
    });

  useEffect(() => {
    document.documentElement.dataset.theme =
      theme;

    localStorage.setItem(
      THEME_STORAGE_KEY,
      theme,
    );
  }, [theme]);

  useEffect(() => {
    document.documentElement.dataset.accentColour =
      accentColour;

    localStorage.setItem(
      ACCENT_STORAGE_KEY,
      accentColour,
    );
  }, [accentColour]);

  useEffect(() => {
    // A new sign-in adopts the colour saved for that account. Guests retain
    // their last local choice until they select a preference after signing in.
    if (isAccentColour(user?.accent_colour)) {
      setAccentColour(user.accent_colour);
    }
  }, [user?.accent_colour]);

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
      accentColour={accentColour}
      onAccentColourChange={setAccentColour}
    />
  );
}

export default App;
