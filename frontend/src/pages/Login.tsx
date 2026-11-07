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
            <section className="appeal-prompt" aria-labelledby="appeal-prompt-title">
              <span className="appeal-kicker">Account status</span>
              <h2 id="appeal-prompt-title">Your account is suspended</h2>
              <p>
                You can ask an administrator to review this decision.
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
            </section>
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
              <div className="appeal-heading">
                <span className="appeal-kicker">Account review</span>
                <h2>Request a suspension review</h2>
                <p>
                  Explain why you believe the suspension should be reviewed.
                  Your appeal will be sent to an administrator.
                </p>
              </div>

              <div className="appeal-reason-group">
                <div className="appeal-label-row">
                  <label htmlFor="appeal-reason">Appeal reason</label>
                  <span aria-live="polite">{appealReason.length}/2000</span>
                </div>

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
                  aria-describedby="appeal-guidance"
                  disabled={
                    appealLoading
                  }
                  required
                />

                <small id="appeal-guidance">
                  Please include enough detail for the administrator to understand your request.
                </small>
              </div>

              {appealError && (
                <p className="form-error" role="alert">
                  {appealError}
                </p>
              )}

              <div className="appeal-form-actions">
                <button
                  type="button"
                  className="appeal-cancel-button"
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
