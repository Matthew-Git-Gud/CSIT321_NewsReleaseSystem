import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import MainLayout from "../layouts/MainLayout";
import ProtectedRoute from "../components/ProtectedRoute";

import Home from "../pages/Home";
import Login from "../pages/Login";
import Register from "../pages/Register";

import PersonalisedFeed from "../pages/PersonalisedFeed";
import PublishArticle from "../pages/PublishArticle";
import MyArticles from "../pages/MyArticles";
import EditArticle from "../pages/EditArticle";
import SavedArticles from "../pages/SavedArticles";
import ArticleView from "../pages/ArticleView";
import Preferences from "../pages/Preferences";

import AdminDashboard from "../pages/AdminDashboard";
import UserManagement from "../pages/UserManagement";
import AdminEditArticle from "../pages/AdminEditArticle";

import { ROLES } from "../constants/roles";

type Theme =
  | "light"
  | "dark";

type AppRoutesProps = {
  theme: Theme;

  onToggleTheme:
  () => void;
};

function AppRoutes({
  theme,
  onToggleTheme,
}: AppRoutesProps) {
  return (
    <BrowserRouter>
      <Routes>

        {/* =========================
            MAIN LAYOUT
        ========================= */}

        <Route
          element={
            <MainLayout
              theme={theme}
              onToggleTheme={
                onToggleTheme
              }
            />
          }
        >

          {/* =========================
              PUBLIC
          ========================= */}

          <Route
            path="/"
            element={<Home />}
          />

          <Route
            path="/articles/:articleId"
            element={
              <ArticleView />
            }
          />

          {/* =========================
              REGISTERED USER
          ========================= */}

          <Route
            path="/feed"
            element={
              <ProtectedRoute
                allowedRoles={[
                  ROLES.REGISTERED,
                ]}
              >
                <PersonalisedFeed />
              </ProtectedRoute>
            }
          />

          <Route
            path="/publish"
            element={
              <ProtectedRoute
                allowedRoles={[
                  ROLES.REGISTERED,
                ]}
              >
                <PublishArticle />
              </ProtectedRoute>
            }
          />

          <Route
            path="/articles/:articleId/edit"
            element={
              <ProtectedRoute
                allowedRoles={[
                  ROLES.REGISTERED,
                ]}
              >
                <EditArticle />
              </ProtectedRoute>
            }
          />

          <Route
            path="/my-articles"
            element={
              <ProtectedRoute
                allowedRoles={[
                  ROLES.REGISTERED,
                ]}
              >
                <MyArticles />
              </ProtectedRoute>
            }
          />

          <Route
            path="/saved"
            element={
              <ProtectedRoute
                allowedRoles={[
                  ROLES.REGISTERED,
                ]}
              >
                <SavedArticles />
              </ProtectedRoute>
            }
          />

          <Route
            path="/preferences"
            element={
              <ProtectedRoute
                allowedRoles={[
                  ROLES.REGISTERED,
                ]}
              >
                <Preferences />
              </ProtectedRoute>
            }
          />

          {/* =========================
              ADMIN
          ========================= */}

          <Route
            path="/admin"
            element={
              <ProtectedRoute
                allowedRoles={[
                  ROLES.ADMIN,
                ]}
              >
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/users"
            element={
              <ProtectedRoute
                allowedRoles={[
                  ROLES.ADMIN,
                ]}
              >
                <UserManagement />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route
          path="/admin/articles/:articleId/edit"
          element={
            <ProtectedRoute
              allowedRoles={[
                ROLES.ADMIN,
              ]}
            >
              <AdminEditArticle />
            </ProtectedRoute>
          }
        />

        {/* =========================
            AUTH PAGES
        ========================= */}

        <Route
          path="/login"
          element={
            <Login
              theme={theme}
              onToggleTheme={
                onToggleTheme
              }
            />
          }
        />

        <Route
          path="/register"
          element={
            <Register
              theme={theme}
              onToggleTheme={
                onToggleTheme
              }
            />
          }
        />

        {/* =========================
            UNKNOWN ROUTE
        ========================= */}

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;