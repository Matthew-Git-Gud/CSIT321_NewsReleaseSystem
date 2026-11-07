import AiChatWidget from "../components/AiChatWidget";
import { Outlet } from "react-router-dom";

import Navbar from "../components/NavBar";
import NotificationToast from "../components/NotificationToast";

type Theme = "light" | "dark";

type MainLayoutProps = {
  theme: Theme;
  onToggleTheme: () => void;
  onSignedOut: () => void;
};

function MainLayout({
  theme,
  onToggleTheme,
  onSignedOut,
}: MainLayoutProps) {
  return (
    <>
      <Navbar
        theme={theme}
        onToggleTheme={onToggleTheme}
        onSignedOut={onSignedOut}
      />

      <Outlet />
      <NotificationToast />
      <AiChatWidget />
    </>
  );
}

export default MainLayout;
