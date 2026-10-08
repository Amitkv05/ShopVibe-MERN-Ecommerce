import { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { useStore } from "@/lib/store";

const sleep = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));
const checks = ["Credentials", "Security Check", "Authentication"];

export default function LoginScreen() {
  const { login, setPage, showToast } = useStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [phase, setPhase] = useState("idle");
  const [step, setStep] = useState(-1);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) {
      setError("Email and password are required");
      return;
    }
    setError("");
    setStep(-1);
    setPhase("auth");
    try {
      const authPromise = login(email.trim().toLowerCase(), password);
      await sleep(400);
      setStep(0);
      await sleep(650);
      setStep(1);
      await sleep(650);
      setStep(2);
      await Promise.all([authPromise, sleep(500)]);
      setPhase("success");
      await sleep(850);
      const next = sessionStorage.getItem("shopvibe_after_login");
      sessionStorage.removeItem("shopvibe_after_login");
      setPage(next === "checkout" ? "checkout" : "home");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
      setStep(-1);
      setPhase("idle");
      showToast(message, "error");
    }
  }

  return (
    <div className="secure-login-page">
      <div className="login-aurora login-aurora-a" />
      <div className="login-aurora login-aurora-b" />
      <header className="login-brandbar">
        <button onClick={() => setPage("home")}>SHOPVIBE</button>
        <span>SECURE SHOPPING ACCESS</span>
      </header>
      <main className={`secure-login-card ${phase}`}>
        <section className="secure-login-formside">
          {phase !== "success" ? (
            <form onSubmit={handleSubmit}>
              <div className="login-kicker">Welcome Back</div>
              <h1>Sign in to continue</h1>
              <p>
                Sign in to access your cart, orders, wishlist and account with a
                secure ShopVibe session.
              </p>
              <label>
                <span>Email</span>
                <div className="secure-field">
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    placeholder="you@example.com"
                  />
                  <i>{email ? "✓" : ""}</i>
                </div>
              </label>
              <label>
                <span>Password</span>
                <div className="secure-field">
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type={show ? "text" : "password"}
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShow((v) => !v)}>
                    {show ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>
              {error && <small className="login-error-text">{error}</small>}
              <button
                className={`secure-login-button ${phase === "auth" ? "authenticating" : ""}`}
                disabled={phase === "auth"}
              >
                {phase === "auth" ? (
                  <>
                    <span className="mini-lock">
                      <Lock size={10} />
                    </span>{" "}
                    Authenticating...
                  </>
                ) : (
                  <>
                    Login <span>→</span>
                  </>
                )}
              </button>
              <button
                type="button"
                className="forgot-link"
                onClick={() => setPage("forgot")}
              >
                Forgot password?
              </button>
              <p className="signup-copy">
                Don&apos;t have an account?{" "}
                <button type="button" onClick={() => setPage("register")}>
                  <b>Sign up</b>
                </button>
              </p>
              <button
                type="button"
                className="skip-login"
                onClick={() => setPage("home")}
              >
                Skip login & browse store →
              </button>
            </form>
          ) : (
            <div className="login-success-panel">
              <div className="success-orb">✓</div>
              <h1>Welcome Back!</h1>
              <p>Your ShopVibe account is ready. Continue to the storefront.</p>
              <button onClick={() => setPage("home")}>
                Continue <span>→</span>
              </button>
            </div>
          )}
        </section>
        <aside className="secure-login-visual">
          <div className={`security-orb ${phase}`}>
            <span>{phase === "success" ? "✓" : <Lock size={28} />}</span>
            <i />
            <i />
            <i />
          </div>
          <div className="security-checks">
            {checks.map((label, i) => (
              <div
                key={label}
                className={step >= i || phase === "success" ? "checked" : ""}
              >
                <span>{step >= i || phase === "success" ? "✓" : ""}</span>
                <b>{label}</b>
              </div>
            ))}
          </div>
        </aside>
      </main>
      <footer className="login-footer">
        <span>SECURE COOKIE SESSION</span>
        <span>PROTECTED ACCOUNT ACCESS</span>
      </footer>
    </div>
  );
}
