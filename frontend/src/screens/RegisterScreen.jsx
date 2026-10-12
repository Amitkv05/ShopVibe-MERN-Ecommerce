import { useState } from "react";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Phone,
  ShoppingBag,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import { useStore } from "@/lib/store";
import "../styles/RegisterScreen.css";

const benefits = [
  "Free shipping on your first order",
  "Exclusive member-only discounts",
  "Early access to new collections",
  "Easy returns & exchanges",
];

function getPasswordStrength(password) {
  if (!password) return { score: 0, label: "" };

  const score = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;

  const labels = ["Weak", "Weak", "Fair", "Good", "Strong"];
  return { score, label: labels[score] };
}

function Field({
  id,
  label,
  icon: Icon,
  error,
  trailing,
  hint,
  ...inputProps
}) {
  return (
    <div className="sv-register-field">
      <label htmlFor={id} className="sv-register-label">
        {label}
      </label>
      <div className={`sv-register-control${error ? " is-invalid" : ""}`}>
        <Icon size={18} strokeWidth={1.9} aria-hidden="true" />
        <input
          id={id}
          aria-invalid={Boolean(error)}
          aria-describedby={
            error ? `${id}-error` : hint ? `${id}-hint` : undefined
          }
          {...inputProps}
        />
        {trailing && <div className="sv-register-trailing">{trailing}</div>}
      </div>
      {error ? (
        <p id={`${id}-error`} className="sv-register-error" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="sv-register-hint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export default function RegisterScreen() {
  const { register, setPage, showToast } = useStore();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirm: "",
  });
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState({});

  const update = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: "", submit: "" }));
  };

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = "Please enter your full name.";

    const email = form.email.trim();
    if (!email) next.email = "Please enter your email address.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      next.email = "Enter a valid email address.";
    }

    if (!form.password) next.password = "Please create a password.";
    else if (form.password.length < 8) {
      next.password = "Use at least 8 characters.";
    }

    if (!form.confirm) next.confirm = "Please confirm your password.";
    else if (form.confirm !== form.password) {
      next.confirm = "Passwords do not match.";
    }

    if (!agreed) next.agreed = "Please accept the terms to continue.";
    return next;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (loading) return;

    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setLoading(true);
    try {
      // Keep the existing backend/store registration contract unchanged.
      await register(
        form.name.trim(),
        form.email.trim().toLowerCase(),
        form.password,
      );
      setPage("profile");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Registration failed";
      setErrors((current) => ({ ...current, submit: message }));
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  const strength = getPasswordStrength(form.password);

  return (
    <main className="sv-register-page">
      <div className="sv-register-layout">
        <aside
          className="sv-register-showcase"
          aria-label="ShopVibe membership benefits"
        >
          <div
            className="sv-register-art sv-register-art-one"
            aria-hidden="true"
          />
          <div
            className="sv-register-art sv-register-art-two"
            aria-hidden="true"
          />
          <div
            className="sv-register-art sv-register-art-three"
            aria-hidden="true"
          />

          <div className="sv-register-showcase-top">
            <span className="sv-register-brand-mark">
              <ShoppingBag size={22} />
            </span>
            <strong>
              Shop<span>Vibe</span>
            </strong>
          </div>

          <div className="sv-register-showcase-body">
            <span className="sv-register-eyebrow">
              <span /> YOUR STYLE, YOUR SPACE
            </span>
            <h1>
              Good things
              <br />
              start <em>here.</em>
            </h1>
            <p>
              Create your free account to save your favorites, discover new
              drops, and enjoy a smoother shopping experience.
            </p>
            <div className="sv-register-benefits">
              {benefits.map((benefit) => (
                <div className="sv-register-benefit" key={benefit}>
                  <CheckCircle size={18} strokeWidth={2} aria-hidden="true" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="sv-register-showcase-bottom">
            <span className="sv-register-showcase-line" />
            <span>DISCOVER MORE. SHOP BETTER.</span>
          </div>
        </aside>

        <section
          className="sv-register-form-panel"
          aria-labelledby="sv-register-title"
        >
          <div className="sv-register-form-wrap">
            <div className="sv-register-mobile-brand">
              <span className="sv-register-brand-mark">
                <ShoppingBag size={20} />
              </span>
              <strong>
                Shop<span>Vibe</span>
              </strong>
            </div>

            <div className="sv-register-heading">
              <span className="sv-register-kicker">JOIN THE COMMUNITY</span>
              <h2 id="sv-register-title">
                Create your account<span>.</span>
              </h2>
              <p>Just a few details and you're ready to shop.</p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="sv-register-form"
              noValidate
            >
              <div className="sv-register-two-fields">
                <Field
                  id="sv-register-name"
                  label="Full name"
                  icon={User}
                  value={form.name}
                  onChange={(event) => update("name", event.target.value)}
                  placeholder="Alex Johnson"
                  autoComplete="name"
                  error={errors.name}
                  required
                />
                <Field
                  id="sv-register-phone"
                  label="Phone number (optional)"
                  icon={Phone}
                  type="tel"
                  value={form.phone}
                  onChange={(event) => update("phone", event.target.value)}
                  placeholder="+91 98765 43210"
                  autoComplete="tel"
                />
              </div>

              <Field
                id="sv-register-email"
                label="Email address"
                icon={Mail}
                type="email"
                value={form.email}
                onChange={(event) => update("email", event.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                error={errors.email}
                required
              />

              <Field
                id="sv-register-password"
                label="Password"
                icon={Lock}
                type={showPw ? "text" : "password"}
                value={form.password}
                onChange={(event) => update("password", event.target.value)}
                placeholder="Minimum 8 characters"
                autoComplete="new-password"
                error={errors.password}
                required
                trailing={
                  <button
                    type="button"
                    className="sv-register-visibility"
                    onClick={() => setShowPw((previous) => !previous)}
                    aria-label={showPw ? "Hide password" : "Show password"}
                    aria-pressed={showPw}
                  >
                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
              />

              {form.password && (
                <div className="sv-register-strength" aria-live="polite">
                  <div className="sv-register-strength-bars" aria-hidden="true">
                    {[1, 2, 3, 4].map((level) => (
                      <span
                        key={level}
                        className={level <= strength.score ? "is-filled" : ""}
                      />
                    ))}
                  </div>
                  <p>
                    Password strength: <strong>{strength.label}</strong>
                  </p>
                </div>
              )}

              <Field
                id="sv-register-confirm"
                label="Confirm password"
                icon={Lock}
                type={showConfirm ? "text" : "password"}
                value={form.confirm}
                onChange={(event) => update("confirm", event.target.value)}
                placeholder="Repeat your password"
                autoComplete="new-password"
                error={errors.confirm}
                required
                trailing={
                  <button
                    type="button"
                    className="sv-register-visibility"
                    onClick={() => setShowConfirm((previous) => !previous)}
                    aria-label={
                      showConfirm
                        ? "Hide confirmed password"
                        : "Show confirmed password"
                    }
                    aria-pressed={showConfirm}
                  >
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
              />

              <div className="sv-register-consent">
                <label
                  className="sv-register-checkbox-row"
                  htmlFor="sv-register-agree"
                >
                  <input
                    id="sv-register-agree"
                    type="checkbox"
                    checked={agreed}
                    onChange={(event) => {
                      setAgreed(event.target.checked);
                      setErrors((current) => ({ ...current, agreed: "" }));
                    }}
                    aria-invalid={Boolean(errors.agreed)}
                    aria-describedby={
                      errors.agreed ? "sv-register-agree-error" : undefined
                    }
                  />
                  <span>
                    I agree to the{" "}
                    <span className="sv-register-policy">Terms of Service</span>{" "}
                    and{" "}
                    <span className="sv-register-policy">Privacy Policy</span>
                  </span>
                </label>
                {errors.agreed && (
                  <p
                    id="sv-register-agree-error"
                    className="sv-register-error"
                    role="alert"
                  >
                    {errors.agreed}
                  </p>
                )}
              </div>

              {errors.submit && (
                <p className="sv-register-submit-error" role="alert">
                  {errors.submit}
                </p>
              )}

              <button
                className="sv-register-submit"
                type="submit"
                disabled={loading}
              >
                <span>
                  {loading ? "Creating account..." : "Create account"}
                </span>
                {loading ? (
                  <span className="sv-register-spinner" aria-hidden="true" />
                ) : (
                  <ArrowRight size={19} />
                )}
              </button>
            </form>

            <div className="sv-register-after-form">
              <p>
                Already have an account?{" "}
                <button type="button" onClick={() => setPage("login")}>
                  Sign in
                </button>
              </p>
              <button
                type="button"
                className="sv-register-guest"
                onClick={() => setPage("home")}
              >
                Continue as guest <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
