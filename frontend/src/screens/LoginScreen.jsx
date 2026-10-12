import { useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { useStore } from "@/lib/store";
import "../styles/LoginScreen.css";

const sleep = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

// Visual progress indicators, not separate backend security-check API calls.
const checks = ["Credentials", "Session setup", "Account access"];

const benefits = [
  "Pick up where you left off",
  "Keep your wishlist and orders together",
  "Enjoy a faster checkout experience",
];

export default function LoginScreen() {
  const { login, setPage, showToast } = useStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [phase, setPhase] = useState("idle");
  const [step, setStep] = useState(-1);
  const [error, setError] = useState("");
  const didNavigate = useRef(false);

  const isAuthenticating = phase === "auth";

  function handleFieldChange(setter, value) {
    setter(value);
    if (error || phase === "error") {
      setError("");
      setPhase("idle");
      setStep(-1);
    }
  }

  function finishLogin() {
    if (didNavigate.current) return;
    didNavigate.current = true;
    // Keep checkout intent from the original login flow.
    const next = window.sessionStorage.getItem("shopvibe_after_login");
    window.sessionStorage.removeItem("shopvibe_after_login");
    setPage(next === "checkout" ? "checkout" : "home");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (isAuthenticating || phase === "success") return;

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      setError("Email and password are required.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setError("");
    setStep(-1);
    setPhase("auth");

    try {
      // Capture early rejections immediately while the visual sequence runs.
      const resultPromise = Promise.resolve()
        .then(() => login(normalizedEmail, password))
        .then(
          () => ({ ok: true }),
          (caughtError) => ({ ok: false, error: caughtError }),
        );

      await sleep(300);
      setStep(0);
      await sleep(450);
      setStep(1);
      await sleep(450);
      setStep(2);

      const result = await Promise.all([resultPromise, sleep(350)]);
      const authResult = result[0];
      if (!authResult.ok) throw authResult.error;

      setPhase("success");
      await sleep(850);
      finishLogin();
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Incorrect email or password.";

      setError(message);
      setStep(-1);
      setPhase("error");
      showToast(message, "error");
    }
  }

  return (
    <main className="sv-login-page">
      <div className={`sv-login-layout sv-login-phase-${phase}`}>
        {/* LEFT: matches the black ShopVibe brand panel on Sign Up / Forgot */}
        <aside
          className="sv-login-showcase"
          aria-label="ShopVibe account benefits"
        >
          <div
            className="sv-login-decor sv-login-decor-one"
            aria-hidden="true"
          />
          <div
            className="sv-login-decor sv-login-decor-two"
            aria-hidden="true"
          />

          <div className="sv-login-brand">
            <span className="sv-login-brand-icon" aria-hidden="true">
              <ShoppingBag size={23} strokeWidth={2} />
            </span>
            <strong>
              Shop<span>Vibe</span>
            </strong>
          </div>

          <div className="sv-login-showcase-main">
            <span className="sv-login-showcase-eyebrow">
              <span className="sv-login-live-dot" aria-hidden="true" />
              YOUR SHOPPING SPACE
            </span>
            <h1>
              Welcome <span>back.</span>
            </h1>
            <p>
              Everything you love about shopping, all in one place. Sign in and
              continue your ShopVibe experience.
            </p>

            <div className={`sv-login-security sv-login-security-${phase}`}>
              <div className="sv-login-security-orb" aria-hidden="true">
                <span>
                  {phase === "success" ? (
                    <Check size={32} />
                  ) : phase === "error" ? (
                    <span className="sv-login-error-symbol">!</span>
                  ) : (
                    <LockKeyhole size={30} strokeWidth={1.8} />
                  )}
                </span>
              </div>
              <div className="sv-login-security-copy">
                <strong>
                  {phase === "auth"
                    ? "Signing you in…"
                    : phase === "success"
                      ? "You’re signed in"
                      : phase === "error"
                        ? "Please try again"
                        : "Your account, your space"}
                </strong>
                <small>
                  {phase === "auth"
                    ? "Connecting to your ShopVibe account"
                    : phase === "success"
                      ? "You’re ready to explore"
                      : phase === "error"
                        ? "Check your credentials and retry"
                        : "A smooth way back to your cart and wishlist"}
                </small>
              </div>
            </div>

            {phase === "auth" || phase === "success" ? (
              <div
                className="sv-login-progress"
                aria-label="Sign in progress"
                aria-live="polite"
              >
                {checks.map((label, index) => {
                  const complete = phase === "success";
                  const active = phase === "auth" && step === index;
                  return (
                    <div
                      className={`sv-login-progress-step${complete ? " is-complete" : ""}${active ? " is-active" : ""}`}
                      key={label}
                    >
                      <span aria-hidden="true">
                        {complete ? (
                          <Check size={13} />
                        ) : (
                          String(index + 1).padStart(2, "0")
                        )}
                      </span>
                      <strong>{label}</strong>
                      {active && (
                        <span
                          className="sv-login-progress-pulse"
                          aria-hidden="true"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <ul className="sv-login-benefits">
                {benefits.map((benefit) => (
                  <li key={benefit}>
                    <CheckCircle2
                      size={19}
                      strokeWidth={1.9}
                      aria-hidden="true"
                    />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="sv-login-showcase-bottom">
            <span className="sv-login-showcase-line" />
            SHOPVIBE · MADE FOR THE WAY YOU SHOP
          </div>
        </aside>

        {/* RIGHT: simple white form panel, native inputs, pure CSS */}
        <section
          className="sv-login-form-panel"
          aria-labelledby="sv-login-heading"
        >
          <div className="sv-login-form-wrap">
            <div className="sv-login-mobile-brand" aria-label="ShopVibe">
              <span className="sv-login-brand-icon" aria-hidden="true">
                <ShoppingBag size={21} />
              </span>
              <strong>
                Shop<span>Vibe</span>
              </strong>
            </div>

            <div className="sv-login-form-topline">
              <span className="sv-login-kicker">SHOPVIBE MEMBER ACCESS</span>
              <button
                type="button"
                className="sv-login-home-link"
                onClick={() => setPage("home")}
                disabled={isAuthenticating}
              >
                Browse store <ArrowRight size={15} aria-hidden="true" />
              </button>
            </div>

            {phase === "success" ? (
              <div
                className="sv-login-success-panel"
                role="status"
                aria-live="polite"
              >
                <span className="sv-login-success-icon" aria-hidden="true">
                  <Check size={30} strokeWidth={2.5} />
                </span>
                <h2 id="sv-login-heading">
                  You're <span>in!</span>
                </h2>
                <p>
                  Your account is ready. We're taking you to your next ShopVibe
                  page.
                </p>
                {/* <button
                  type="button"
                  className="sv-login-submit"
                  onClick={finishLogin}
                >
                  Continue SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSsshopping{" "}
                  <ArrowRight size={19} aria-hidden="true" />
                </button> */}
              </div>
            ) : (
              <>
                <div className="sv-login-heading">
                  <h2 id="sv-login-heading">
                    Sign in to <span>ShopVibe.</span>
                  </h2>
                  <p>
                    Enter your details to access your account, orders and
                    wishlist.
                  </p>
                </div>

                <form
                  className="sv-login-form"
                  onSubmit={handleSubmit}
                  noValidate
                >
                  <div className="sv-login-field">
                    <label htmlFor="sv-login-email">Email address</label>
                    <div
                      className={`sv-login-input-wrap${error ? " is-invalid" : ""}`}
                    >
                      <Mail size={19} strokeWidth={1.9} aria-hidden="true" />
                      <input
                        id="sv-login-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        inputMode="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(event) =>
                          handleFieldChange(setEmail, event.target.value)
                        }
                        aria-invalid={Boolean(error)}
                        aria-describedby={error ? "sv-login-error" : undefined}
                        disabled={isAuthenticating}
                        required
                      />
                    </div>
                  </div>

                  <div className="sv-login-field">
                    <div className="sv-login-label-row">
                      <label htmlFor="sv-login-password">Password</label>
                      <button
                        type="button"
                        className="sv-login-forgot-link"
                        onClick={() => setPage("forgot")}
                        disabled={isAuthenticating}
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div
                      className={`sv-login-input-wrap${error ? " is-invalid" : ""}`}
                    >
                      <LockKeyhole
                        size={19}
                        strokeWidth={1.9}
                        aria-hidden="true"
                      />
                      <input
                        id="sv-login-password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(event) =>
                          handleFieldChange(setPassword, event.target.value)
                        }
                        aria-invalid={Boolean(error)}
                        aria-describedby={error ? "sv-login-error" : undefined}
                        disabled={isAuthenticating}
                        required
                      />
                      <button
                        type="button"
                        className="sv-login-visibility"
                        onClick={() => setShowPassword((value) => !value)}
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                        aria-pressed={showPassword}
                      >
                        {showPassword ? (
                          <EyeOff size={19} />
                        ) : (
                          <Eye size={19} />
                        )}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <p
                      className="sv-login-error"
                      id="sv-login-error"
                      role="alert"
                    >
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="sv-login-submit"
                    disabled={isAuthenticating}
                    aria-busy={isAuthenticating}
                  >
                    {isAuthenticating ? (
                      <>
                        <span className="sv-login-spinner" aria-hidden="true" />
                        Signing you in…
                      </>
                    ) : (
                      <>
                        Sign in <ArrowRight size={19} aria-hidden="true" />
                      </>
                    )}
                  </button>
                </form>

                <div className="sv-login-divider">
                  <span>NEW TO SHOPVIBE?</span>
                </div>

                <div className="sv-login-signup-row">
                  <span>Don't have an account?</span>
                  <button
                    type="button"
                    onClick={() => setPage("register")}
                    disabled={isAuthenticating}
                  >
                    Create account
                  </button>
                </div>

                {/* <button
                  type="button"
                  className="sv-login-guest"
                  onClick={() => setPage("home")}
                  disabled={isAuthenticating}
                >
                  Continue shopping as guest{" "}
                  <ArrowRight size={17} aria-hidden="true" />
                </button> */}

                <div className="sv-login-trust">
                  <ShieldCheck size={17} aria-hidden="true" />
                  <span>ShopVibe account sign-in</span>
                  <Sparkles size={16} aria-hidden="true" />
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
