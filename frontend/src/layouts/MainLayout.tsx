import { Outlet } from "react-router-dom";

import Navbar from "../components/NavBar";
import NotificationToast from "../components/NotificationToast";

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
      <NotificationToast />
    </>
  );
}

export default MainLayout;