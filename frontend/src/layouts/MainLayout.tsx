import { Outlet } from "react-router-dom";

import Navbar from "../components/NavBar";

type Theme = "light" | "dark";

type MainLayoutProps = {
  theme: Theme;
  onToggleTheme: () => void;
};

function MainLayout({
  theme,
  onToggleTheme,
}: MainLayoutProps) {
  return (
    <>
      <Navbar
        theme={theme}
        onToggleTheme={onToggleTheme}
      />

      <Outlet />
    </>
  );
}

export default MainLayout;