import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import { useStore } from "@/lib/store";
import "../styles/UpdatePasswordScreen.css";

const emptyPasswords = {
  oldPassword: "",
  newPassword: "",
  confirmPassword: "",
};

function PasswordField({ id, label, value, onChange, autoComplete }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="svpw-field">
      <label htmlFor={id}>{label}</label>
      <div className="svpw-input-wrap">
        <LockKeyhole size={18} aria-hidden="true" />
        <input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter password"
          required
        />
        <button
          type="button"
          onClick={() => setVisible((prev) => !prev)}
          aria-label={
            visible
              ? `Hide ${label.toLowerCase()}`
              : `Show ${label.toLowerCase()}`
          }
          aria-pressed={visible}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}

export default function UpdatePasswordScreen({ onBack }) {
  const { changePassword, setPage, showToast } = useStore();
  const [form, setForm] = useState(emptyPasswords);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const passwordRules = [
    { label: "8 or more characters", passed: form.newPassword.length >= 8 },
    {
      label: "Different from current password",
      passed: Boolean(
        form.newPassword &&
        form.oldPassword &&
        form.newPassword !== form.oldPassword,
      ),
    },
    {
      label: "Confirmation matches",
      passed: Boolean(
        form.confirmPassword && form.confirmPassword === form.newPassword,
      ),
    },
  ];

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError("");
    setSuccess(false);
  }

  function back() {
    if (typeof onBack === "function") onBack();
    else setPage("profile");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;
    const { oldPassword, newPassword, confirmPassword } = form;

    if (!oldPassword || !newPassword || !confirmPassword) {
      setError("Please fill in all three password fields.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Your new password must contain at least 8 characters.");
      return;
    }
    if (oldPassword === newPassword) {
      setError(
        "Your new password must be different from your current password.",
      );
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      // Preserves the existing store function signature and backend contract.
      const result = await changePassword(
        oldPassword,
        newPassword,
        confirmPassword,
      );
      if (result?.success === false)
        throw new Error(result.message || "Unable to update password.");
      setForm(emptyPasswords);
      setSuccess(true);
      if (typeof showToast === "function")
        showToast("Password updated successfully", "success");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to update password.";
      setError(message);
      if (typeof showToast === "function") showToast(message, "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="svpw-page">
      <div className="svpw-shell">
        <button className="svpw-back" onClick={back} type="button">
          <ArrowLeft size={18} /> Back to profile
        </button>
        <div className="svpw-layout">
          <section
            className="svpw-brand-panel"
            aria-label="Password security information"
          >
            <div className="svpw-brand">
              <span className="svpw-brand-icon">
                <ShieldCheck size={22} />
              </span>
              <strong>
                Shop<span>Vibe</span>
              </strong>
            </div>
            <div className="svpw-brand-content">
              <span className="svpw-overline">SECURE YOUR ACCOUNT</span>
              <h1>
                Your security.
                <br />
                <span>Our priority.</span>
              </h1>
              <p>
                A strong password helps protect your orders, saved addresses and
                personal information.
              </p>
              <div className="svpw-security-list">
                <div>
                  <span>
                    <Check size={16} />
                  </span>{" "}
                  Use a password you haven't used before
                </div>
                <div>
                  <span>
                    <Check size={16} />
                  </span>{" "}
                  Avoid sharing your password with anyone
                </div>
                <div>
                  <span>
                    <Check size={16} />
                  </span>{" "}
                  Update it if you suspect unusual activity
                </div>
              </div>
            </div>
            <div className="svpw-brand-foot">
              <LockKeyhole size={17} /> Account security settings
            </div>
          </section>
          <section
            className="svpw-form-panel"
            aria-labelledby="svpw-form-title"
          >
            {success ? (
              <div className="svpw-success" role="status">
                <span className="svpw-success-icon">
                  <CheckCircle2 size={38} />
                </span>
                <span className="svpw-overline">PASSWORD UPDATED</span>
                <h2>You're all set.</h2>
                <p>
                  Your password update was successful. Keep your new password
                  private.
                </p>
                <button className="svpw-submit" type="button" onClick={back}>
                  Return to profile <ArrowRight size={18} />
                </button>
              </div>
            ) : (
              <>
                <div className="svpw-form-heading">
                  <span className="svpw-overline">
                    ACCOUNT SETTINGS / SECURITY
                  </span>
                  <div className="svpw-form-icon">
                    <KeyRound size={25} />
                  </div>
                  <h2 id="svpw-form-title">
                    Update password<span>.</span>
                  </h2>
                  <p>
                    Enter your current password and choose a new one to keep
                    your account protected.
                  </p>
                </div>
                <form className="svpw-form" onSubmit={handleSubmit} noValidate>
                  <PasswordField
                    id="svpw-current"
                    label="Current password"
                    value={form.oldPassword}
                    onChange={(v) => setField("oldPassword", v)}
                    autoComplete="current-password"
                  />
                  <PasswordField
                    id="svpw-new"
                    label="New password"
                    value={form.newPassword}
                    onChange={(v) => setField("newPassword", v)}
                    autoComplete="new-password"
                  />
                  <PasswordField
                    id="svpw-confirm"
                    label="Confirm new password"
                    value={form.confirmPassword}
                    onChange={(v) => setField("confirmPassword", v)}
                    autoComplete="new-password"
                  />
                  <div
                    className="svpw-rules"
                    aria-label="Password requirements"
                  >
                    {passwordRules.map((rule) => (
                      <div
                        key={rule.label}
                        className={rule.passed ? "is-met" : ""}
                      >
                        <CheckCircle2 size={15} /> {rule.label}
                      </div>
                    ))}
                  </div>
                  {error && (
                    <div className="svpw-error" role="alert">
                      {error}
                    </div>
                  )}
                  <button
                    type="submit"
                    className="svpw-submit"
                    disabled={submitting}
                  >
                    {submitting ? "Updating password..." : "Save new password"}{" "}
                    <ArrowRight size={18} />
                  </button>
                </form>
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
