import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  LockKeyhole,
  Mail,
  ShoppingBag,
} from "lucide-react";
import { api } from "@/lib/api";
import { useStore } from "@/lib/store";
import "../styles/ForgotPasswordScreen.css";

const recoverySteps = [
  "Enter the email linked to your account",
  "Look for the password reset email",
  "Follow the link to choose a new password",
];

export default function ForgotPasswordScreen() {
  const { setPage, showToast } = useStore();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    if (loading) return;

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError("Please enter your email address.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setError("");
    setMessage("");
    setLoading(true);

    try {
      // Preserve the existing backend endpoint and payload.
      const response = await api("/forgot/password", {
        method: "POST",
        body: { email: normalizedEmail },
      });

      setMessage(
        response?.message ||
          "If the account exists, a password reset link was sent.",
      );
    } catch (caughtError) {
      const errorMessage =
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to request a password reset. Please try again.";
      setError(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="sv-forgot-page">
      <div className="sv-forgot-layout">
        {/* LEFT SIDE — BRANDING */}
        <aside
          className="sv-forgot-showcase"
          aria-label="ShopVibe account recovery information"
        >
          <div
            className="sv-forgot-decor sv-forgot-decor-one"
            aria-hidden="true"
          />
          <div
            className="sv-forgot-decor sv-forgot-decor-two"
            aria-hidden="true"
          />

          <div className="sv-forgot-brand">
            <span className="sv-forgot-brand-icon" aria-hidden="true">
              <ShoppingBag size={23} strokeWidth={2} />
            </span>
            <strong>
              Shop<span>Vibe</span>
            </strong>
          </div>

          <div className="sv-forgot-showcase-content">
            <span className="sv-forgot-eyebrow">
              <span className="sv-forgot-live-dot" />
              ACCOUNT RECOVERY
            </span>
            <div className="sv-forgot-large-icon" aria-hidden="true">
              <LockKeyhole size={32} strokeWidth={1.8} />
            </div>
            <h1>
              Back in <span>control.</span>
            </h1>
            <p>
              Forgot your password? Follow a few simple steps to get back to
              your ShopVibe account.
            </p>

            <ol className="sv-forgot-steps">
              {recoverySteps.map((step, index) => (
                <li key={step}>
                  <span className="sv-forgot-step-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <p className="sv-forgot-showcase-footer">
            <span aria-hidden="true" /> SHOPVIBE · ACCOUNT SUPPORT
          </p>
        </aside>

        {/* RIGHT SIDE — RESET FORM */}
        <section
          className="sv-forgot-form-panel"
          aria-labelledby="sv-forgot-title"
        >
          <div className="sv-forgot-form-wrap">
            <div className="sv-forgot-mobile-brand" aria-label="ShopVibe">
              <span className="sv-forgot-brand-icon" aria-hidden="true">
                <ShoppingBag size={20} />
              </span>
              <strong>
                Shop<span>Vibe</span>
              </strong>
            </div>

            <button
              type="button"
              className="sv-forgot-back"
              onClick={() => setPage("login")}
            >
              <ArrowLeft size={17} aria-hidden="true" />
              Back to sign in
            </button>

            <div className="sv-forgot-heading">
              <span className="sv-forgot-kicker">PASSWORD ASSISTANCE</span>
              <h2 id="sv-forgot-title">
                Forgot your <span>password?</span>
              </h2>
              <p>
                Enter your account email and we’ll send you a link to reset your
                password.
              </p>
            </div>

            <form className="sv-forgot-form" onSubmit={submit} noValidate>
              <div className="sv-forgot-field">
                <label htmlFor="sv-forgot-email">Email address</label>
                <div
                  className={`sv-forgot-input-wrap${error ? " is-invalid" : ""}`}
                >
                  <Mail size={19} strokeWidth={1.9} aria-hidden="true" />
                  <input
                    id="sv-forgot-email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    inputMode="email"
                    required
                    autoFocus
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      setError("");
                      setMessage("");
                    }}
                    placeholder="you@example.com"
                    aria-invalid={Boolean(error)}
                    aria-describedby={
                      error ? "sv-forgot-error" : "sv-forgot-hint"
                    }
                    disabled={loading}
                  />
                </div>
                {error ? (
                  <p
                    className="sv-forgot-error"
                    id="sv-forgot-error"
                    role="alert"
                  >
                    {error}
                  </p>
                ) : (
                  <p className="sv-forgot-field-hint" id="sv-forgot-hint">
                    Use the email address you registered with.
                  </p>
                )}
              </div>

              {message && (
                <div
                  className="sv-forgot-success"
                  role="status"
                  aria-live="polite"
                >
                  <CheckCircle2 size={20} strokeWidth={2} aria-hidden="true" />
                  <div>
                    <strong>Request received</strong>
                    <p>{message}</p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="sv-forgot-submit"
                disabled={loading}
                aria-busy={loading}
              >
                {loading ? (
                  <>
                    <span className="sv-forgot-spinner" aria-hidden="true" />
                    Sending reset link…
                  </>
                ) : (
                  <>
                    Send reset link
                    <ArrowRight size={19} aria-hidden="true" />
                  </>
                )}
              </button>
            </form>

            <div className="sv-forgot-bottom">
              <span>Remembered your password?</span>
              <button type="button" onClick={() => setPage("login")}>
                Sign in
              </button>
            </div>
            <button
              type="button"
              className="sv-forgot-guest"
              onClick={() => setPage("home")}
            >
              Continue shopping as guest
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
