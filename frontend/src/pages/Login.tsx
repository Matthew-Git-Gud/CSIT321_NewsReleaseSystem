import {
  type FormEvent,
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import "../styles/Auth.css";

import ThemeToggle from "../components/ThemeToggle";

import {
  AuthError,
} from "../services/auth";

import {
  submitAppeal,
} from "../services/appeals";

import {
  useAuth,
} from "../context/AuthContext";

type LoginProps = {
  theme: "light" | "dark";
  onToggleTheme: () => void;
};

function Login({
  theme,
  onToggleTheme,
}: LoginProps) {
  const { signIn } = useAuth();
  const navigate = useNavigate();

  // =========================
  // LOGIN STATE
  // =========================

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  // =========================
  // APPEAL STATE
  // =========================

  const [
    appealToken,
    setAppealToken,
  ] = useState<string | null>(
    null,
  );

  const [
    showAppealForm,
    setShowAppealForm,
  ] = useState(false);

  const [
    appealReason,
    setAppealReason,
  ] = useState("");

  const [
    appealLoading,
    setAppealLoading,
  ] = useState(false);

  const [
    appealError,
    setAppealError,
  ] = useState("");

  const [
    appealSuccess,
    setAppealSuccess,
  ] = useState("");

  // =========================
  // LOGIN
  // =========================

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    // Clear old appeal information
    // whenever another login is attempted.
    setAppealToken(null);
    setShowAppealForm(false);
    setAppealError("");
    setAppealSuccess("");
    setAppealReason("");

    try {
      const user =
        await signIn(
          email,
          password,
        );

      if (user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/");
      }
    } catch (requestError) {
      // =========================
      // SUSPENDED ACCOUNT
      // =========================

      if (
        requestError instanceof
          AuthError &&
        requestError.suspended
      ) {
        setError(
          requestError.message,
        );

        if (
          requestError.canAppeal &&
          requestError.appealToken
        ) {
          setAppealToken(
            requestError.appealToken,
          );
        }

        return;
      }

      // =========================
      // NORMAL LOGIN ERROR
      // =========================

      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to sign in",
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // SUBMIT APPEAL
  // =========================

  const handleAppealSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!appealToken) {
      setAppealError(
        "Your appeal session has expired. Please sign in again.",
      );

      return;
    }

    const reason =
      appealReason.trim();

    if (!reason) {
      setAppealError(
        "Please explain why you are appealing your suspension.",
      );

      return;
    }

    try {
      setAppealLoading(true);
      setAppealError("");
      setAppealSuccess("");

      const result =
        await submitAppeal(
          appealToken,
          reason,
        );

      setAppealSuccess(
        result.message,
      );

      setAppealReason("");

      // Appeal token should not
      // be reused after submission.
      setAppealToken(null);

      setShowAppealForm(false);
    } catch (requestError) {
      setAppealError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to submit appeal",
      );
    } finally {
      setAppealLoading(false);
    }
  };

  return (
    <main className="auth-page">
      {/* =========================
          BACK BUTTON
      ========================= */}

      <button
        className="auth-back"
        type="button"
        onClick={() =>
          navigate(-1)
        }
      >
        ← Back
      </button>

      {/* =========================
          THEME CONTROL
      ========================= */}

      <div className="auth-theme-control">
        <ThemeToggle
          theme={theme}
          onToggle={
            onToggleTheme
          }
        />
      </div>

      <section className="auth-card">
        {/* =========================
            BRAND
        ========================= */}

        <Link
          className="brand auth-brand"
          to="/"
        >
          News Release System
        </Link>

        {/* =========================
            HEADING
        ========================= */}

        <div className="auth-heading">
          <p className="eyebrow">
            Welcome back
          </p>

          <h1>
            Sign in to your account.
          </h1>

          <p>
            Access your saved
            stories, comments and
            personalised news.
          </p>
        </div>

        {/* =========================
            LOGIN FORM
        ========================= */}

        <form
          className="auth-form"
          onSubmit={
            handleSubmit
          }
        >
          <label
            htmlFor="login-email"
          >
            Email
          </label>

          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(
                event.target.value,
              )
            }
            placeholder="you@example.com"
            autoComplete="email"
            disabled={loading}
            required
          />

          <label
            htmlFor="login-password"
          >
            Password
          </label>

          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(event) =>
              setPassword(
                event.target.value,
              )
            }
            placeholder="Enter your password"
            autoComplete="current-password"
            disabled={loading}
            required
          />

          {error && (
            <p className="form-error">
              {error}
            </p>
          )}

          <button
            className="primary-button auth-submit"
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Signing in..."
              : "Sign in"}
          </button>
        </form>

        {/* =========================
            SUSPENDED ACCOUNT
            APPEAL PROMPT
        ========================= */}

        {appealToken &&
          !showAppealForm && (
            <div className="appeal-prompt">
              <p>
                Your account is
                currently suspended.
              </p>

              <button
                type="button"
                className="primary-button"
                onClick={() => {
                  setShowAppealForm(
                    true,
                  );

                  setAppealError(
                    "",
                  );
                }}
              >
                Appeal Suspension
              </button>
            </div>
          )}

        {/* =========================
            APPEAL FORM
        ========================= */}

        {appealToken &&
          showAppealForm && (
            <form
              className="appeal-form"
              onSubmit={
                handleAppealSubmit
              }
            >
              <h2>
                Suspension Appeal
              </h2>

              <p>
                Explain why you
                believe your account
                suspension should be
                reviewed.
              </p>

              <div className="form-group">
                <label
                  htmlFor="appeal-reason"
                >
                  Appeal reason
                </label>

                <textarea
                  id="appeal-reason"
                  value={
                    appealReason
                  }
                  onChange={(
                    event,
                  ) =>
                    setAppealReason(
                      event.target
                        .value,
                    )
                  }
                  placeholder="Explain your appeal..."
                  rows={6}
                  maxLength={2000}
                  disabled={
                    appealLoading
                  }
                  required
                />

                <small>
                  {
                    appealReason.length
                  }
                  /2000
                </small>
              </div>

              {appealError && (
                <p className="form-error">
                  {appealError}
                </p>
              )}

              <div className="report-form-actions">
                <button
                  type="button"
                  disabled={
                    appealLoading
                  }
                  onClick={() => {
                    setShowAppealForm(
                      false,
                    );

                    setAppealError(
                      "",
                    );
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={
                    appealLoading ||
                    !appealReason.trim()
                  }
                >
                  {appealLoading
                    ? "Submitting..."
                    : "Submit Appeal"}
                </button>
              </div>
            </form>
          )}

        {/* =========================
            APPEAL SUCCESS
        ========================= */}

        {appealSuccess && (
          <div className="form-success">
            <p>
              {appealSuccess}
            </p>

            <p>
              An administrator will
              review your appeal.
            </p>
          </div>
        )}

        {/* =========================
            REGISTER LINK
        ========================= */}

        <p className="auth-switch">
          Don't have an account?

          <button
            type="button"
            onClick={() =>
              navigate(
                "/register",
              )
            }
          >
            Sign up
          </button>
        </p>
      </section>
    </main>
  );
}

export default Login;