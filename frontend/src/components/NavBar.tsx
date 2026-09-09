import {
  Link,
  NavLink,
} from "react-router-dom";

import ThemeToggle from "./ThemeToggle";

import {
  menuByRole,
} from "../data/menuConfig";

import {
  useAuth,
} from "../context/AuthContext";

import "../styles/NavBar.css";

type NavbarProps = {
  theme: "light" | "dark";
  onToggleTheme: () => void;
};

function NavBar({
  theme,
  onToggleTheme,
}: NavbarProps) {
  const {
    user,
    role,
    signOut,
  } = useAuth();

  const menuItems =
    menuByRole[role];

  const handleSignOut =
    async () => {
      try {
        await signOut();
      } catch (error) {
        console.error(
          "Unable to sign out:",
          error,
        );
      }
    };

  return (
    <header className="navbar">
      <div className="navbar-inner">

        <Link
          className="navbar-brand"
          to="/"
        >
          News Release
          <br />
          System
        </Link>

        <nav
          className="navbar-links"
          aria-label="Main navigation"
        >
          {menuItems.map(
            (item) => {
              /*
               * Hash links such as
               * /#categories are page
               * sections rather than
               * actual React routes.
               */
              const isHashLink =
                item.path.includes(
                  "#",
                );

              if (isHashLink) {
                return (
                  <a
                    key={item.path}
                    className="navbar-link"
                    href={item.path}
                  >
                    {item.label}
                  </a>
                );
              }

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={
                    item.path === "/"
                  }
                  className={({
                    isActive,
                  }) =>
                    isActive
                      ? "navbar-link active"
                      : "navbar-link"
                  }
                >
                  {item.label}
                </NavLink>
              );
            },
          )}
        </nav>

        <div className="navbar-actions">
          <ThemeToggle
            theme={theme}
            onToggle={
              onToggleTheme
            }
          />

          {user ? (
            <>
              <span className="navbar-user">
                Hi,{" "}
                {user.full_name ||
                  user.username}
              </span>

              <button
                type="button"
                className="navbar-signout"
                onClick={
                  handleSignOut
                }
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                className="navbar-login"
                to="/login"
              >
                Sign in
              </Link>

              <Link
                className="navbar-register"
                to="/register"
              >
                Join
              </Link>
            </>
          )}
        </div>

      </div>
    </header>
  );
}

export default NavBar;