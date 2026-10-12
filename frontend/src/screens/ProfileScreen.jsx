import { useEffect, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Heart,
  LockKeyhole,
  LogOut,
  Mail,
  MapPin,
  Package,
  Pencil,
  Phone,
  Save,
  ShieldCheck,
  ShoppingBag,
  UserRound,
  X,
} from "lucide-react";
import { useStore } from "@/lib/store";
import UpdatePasswordScreen from "./UpdatePasswordScreen.jsx";
import "../styles/ProfileScreen.css";

// Keep this false until your store and backend explicitly support phone edits.
// The supplied ProfileScreen only passed name and email to updateProfile().
const ENABLE_PHONE_UPDATES = false;

const cleanProfile = (user) => ({
  name: user?.name ?? "",
  email: user?.email ?? "",
  phone: user?.phone ?? "",
});

const getInitials = (name) => {
  const parts = String(name || "ShopVibe")
    .trim()
    .split(/\s+/);
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
};

function ProfileField({ icon: Icon, id, label, hint, ...props }) {
  return (
    <div className="svpr-field">
      <label htmlFor={id}>{label}</label>
      <div className="svpr-input-wrap">
        <Icon size={18} aria-hidden="true" />
        <input id={id} {...props} />
      </div>
      {hint && <small>{hint}</small>}
    </div>
  );
}

export default function ProfileScreen() {
  const {
    user,
    updateProfile,
    resendVerification,
    logout,
    setPage,
    orders = [],
    wishlist = [],
    cart = [],
    refreshOrders,
    showToast,
  } = useStore();

  const [editing, setEditing] = useState(false);
  const [passwordScreenOpen, setPasswordScreenOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(() => cleanProfile(user));

  useEffect(() => {
    if (!editing) setForm(cleanProfile(user));
  }, [user?.name, user?.email, user?.phone, editing]);

  useEffect(() => {
    if (!user || typeof refreshOrders !== "function") return;
    Promise.resolve(refreshOrders()).catch(() => {
      // The orders page can show its own API feedback.
    });
  }, [Boolean(user), refreshOrders]);

  const savedOrders = Array.isArray(orders) ? orders : [];
  const savedWishlist = Array.isArray(wishlist) ? wishlist : [];
  const savedCart = Array.isArray(cart) ? cart : [];
  const cartCount = savedCart.reduce(
    (total, item) => total + (Number(item?.quantity) || 0),
    0,
  );
  const verified = Boolean(user?.isEmailVerified ?? user?.emailVerified);

  const stats = [
    {
      label: "Orders",
      value: savedOrders.length,
      page: "orders",
      icon: Package,
    },
    {
      label: "Wishlist",
      value: savedWishlist.length,
      page: "wishlist",
      icon: Heart,
    },
    { label: "In cart", value: cartCount, page: "cart", icon: ShoppingBag },
  ];

  const shortcuts = [
    {
      label: "My orders",
      detail: "Purchases & tracking",
      icon: Package,
      action: () => setPage("orders"),
    },
    {
      label: "Wishlist",
      detail: "Your saved favourites",
      icon: Heart,
      action: () => setPage("wishlist"),
    },
    {
      label: "Shipping addresses",
      detail: "Delivery destinations",
      icon: MapPin,
      action: () => setPage("addresses"),
    },
    {
      label: "Update password",
      detail: "Account security",
      icon: LockKeyhole,
      action: openPasswordScreen,
    },
  ];

  function openPasswordScreen() {
    setPasswordScreenOpen(true);
    if (typeof window !== "undefined")
      window.scrollTo({ top: 0, behavior: "auto" });
  }

  function closePasswordScreen() {
    setPasswordScreenOpen(false);
    if (typeof window !== "undefined")
      window.scrollTo({ top: 0, behavior: "auto" });
  }

  function startEditing() {
    setError("");
    setForm(cleanProfile(user));
    setEditing(true);
  }

  function cancelEditing() {
    setError("");
    setEditing(false);
    setForm(cleanProfile(user));
  }

  async function handleSave(event) {
    event.preventDefault();
    if (saving) return;

    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    const phone = form.phone.trim();

    if (name.length < 2) {
      setError("Please enter your full name (at least 2 characters).");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (phone && phone.replace(/\D/g, "").length < 10) {
      setError("Please enter a valid phone number, or leave it empty.");
      return;
    }

    setError("");
    setSaving(true);
    try {
      // Preserve the original API payload unless phone editing is explicitly enabled.
      const result = await updateProfile(
        ENABLE_PHONE_UPDATES ? { name, email, phone } : { name, email },
      );
      if (result?.success === false)
        throw new Error(result.message || "Unable to update profile.");
      setEditing(false);
      if (typeof showToast === "function")
        showToast("Profile updated successfully", "success");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to update profile.";
      setError(message);
      if (typeof showToast === "function") showToast(message, "error");
    } finally {
      setSaving(false);
    }
  }

  async function resendEmailVerification() {
    if (verifying) return;
    setVerifying(true);
    try {
      const result = await resendVerification();
      if (result?.success === false)
        throw new Error(result.message || "Could not send verification email.");
      if (typeof showToast === "function")
        showToast("Verification email requested", "success");
    } catch (err) {
      if (typeof showToast === "function") {
        showToast(
          err instanceof Error
            ? err.message
            : "Could not send verification email.",
          "error",
        );
      }
    } finally {
      setVerifying(false);
    }
  }

  // This is a separate full-screen React component. It is opened locally so
  // you do not need to modify the app's existing setPage() router to use it.
  if (passwordScreenOpen) {
    return <UpdatePasswordScreen onBack={closePasswordScreen} />;
  }

  return (
    <main className="svpr-page">
      <div className="svpr-shell">
        <header className="svpr-heading">
          <div>
            <span className="svpr-overline">
              <span className="svpr-dot" /> MY SHOPVIBE ACCOUNT
            </span>
            <h1>
              Profile <span>& settings.</span>
            </h1>
            <p>Everything about your account, organised in one place.</p>
          </div>
          <span className="svpr-heading-mark">
            <ShieldCheck size={17} /> Account center
          </span>
        </header>

        <div className="svpr-layout">
          <aside
            className="svpr-profile-card"
            aria-label="Your profile summary"
          >
            <div className="svpr-cover" aria-hidden="true">
              <div className="svpr-cover-ring" />
            </div>
            <div className="svpr-identity-body">
              <div className="svpr-identity-row">
                <div className="svpr-avatar" aria-label="Account initials">
                  {getInitials(user?.name)}
                </div>
                <span
                  className={`svpr-verify-badge ${verified ? "is-verified" : "is-pending"}`}
                >
                  <CheckCircle2 size={13} />{" "}
                  {verified ? "Verified" : "Unverified"}
                </span>
              </div>

              <h2>{user?.name || "ShopVibe member"}</h2>
              <p className="svpr-member-caption">
                Your personal shopping space
              </p>

              <div className="svpr-contact-lines">
                <div>
                  <Mail size={16} />
                  <span>{user?.email || "Email not added"}</span>
                </div>
                <div>
                  <Phone size={16} />
                  <span>{user?.phone || "Phone not added"}</span>
                </div>
              </div>

              <button
                className="svpr-primary-button svpr-edit-trigger"
                onClick={editing ? cancelEditing : startEditing}
                type="button"
              >
                {editing ? <X size={17} /> : <Pencil size={17} />}
                {editing ? "Cancel editing" : "Edit profile"}
                {!editing && <ArrowRight size={17} />}
              </button>

              <div className="svpr-stats" aria-label="Shopping summary">
                {stats.map(({ label, value, page, icon: Icon }) => (
                  <button
                    type="button"
                    key={page}
                    onClick={() => setPage(page)}
                  >
                    <Icon size={17} aria-hidden="true" />
                    <strong>{value}</strong>
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <div className="svpr-content">
            {editing ? (
              <section
                className="svpr-panel svpr-edit-panel"
                aria-labelledby="svpr-edit-title"
              >
                <div className="svpr-panel-heading">
                  <div>
                    <span className="svpr-overline">ACCOUNT DETAILS</span>
                    <h2 id="svpr-edit-title">Edit your profile</h2>
                    <p>
                      Keep your contact information accurate and up to date.
                    </p>
                  </div>
                  <div className="svpr-heading-icon">
                    <UserRound size={21} />
                  </div>
                </div>

                <form onSubmit={handleSave} noValidate>
                  <div className="svpr-edit-fields">
                    <ProfileField
                      icon={UserRound}
                      id="svpr-name"
                      label="Full name"
                      placeholder="Your full name"
                      autoComplete="name"
                      value={form.name}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, name: e.target.value }))
                      }
                      required
                    />
                    <ProfileField
                      icon={Mail}
                      id="svpr-email"
                      type="email"
                      label="Email address"
                      placeholder="you@example.com"
                      autoComplete="email"
                      value={form.email}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, email: e.target.value }))
                      }
                      required
                    />
                    <div className="svpr-field-full">
                      <ProfileField
                        icon={Phone}
                        id="svpr-phone"
                        type="tel"
                        label="Phone number (optional)"
                        placeholder="+91 98765 43210"
                        autoComplete="tel"
                        disabled={!ENABLE_PHONE_UPDATES}
                        value={form.phone}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            phone: e.target.value,
                          }))
                        }
                        hint="Phone updates are currently read-only until supported by your API."
                      />
                    </div>
                  </div>

                  <div className="svpr-edit-note">
                    <ShieldCheck size={17} /> Changes to your email may require
                    verification again.
                  </div>
                  {error && (
                    <div className="svpr-form-error" role="alert">
                      {error}
                    </div>
                  )}
                  <div className="svpr-form-actions">
                    <button
                      className="svpr-secondary-button"
                      type="button"
                      onClick={cancelEditing}
                      disabled={saving}
                    >
                      Cancel
                    </button>
                    <button
                      className="svpr-primary-button"
                      type="submit"
                      disabled={saving}
                    >
                      <Save size={17} />{" "}
                      {saving ? "Saving changes..." : "Save changes"}
                    </button>
                  </div>
                </form>
              </section>
            ) : (
              <section
                className="svpr-panel"
                aria-labelledby="svpr-quick-title"
              >
                <div className="svpr-panel-heading">
                  <div>
                    <span className="svpr-overline">QUICK ACCESS</span>
                    <h2 id="svpr-quick-title">What would you like to do?</h2>
                    <p>Jump straight to the account features you use most.</p>
                  </div>
                  <div className="svpr-heading-icon">
                    <ArrowRight size={21} />
                  </div>
                </div>

                <div className="svpr-shortcut-grid">
                  {shortcuts.map(({ label, detail, icon: Icon, action }) => (
                    <button
                      className="svpr-shortcut"
                      type="button"
                      onClick={action}
                      key={label}
                    >
                      <span className="svpr-shortcut-icon">
                        <Icon size={20} />
                      </span>
                      <span className="svpr-shortcut-copy">
                        <strong>{label}</strong>
                        <small>{detail}</small>
                      </span>
                      <ChevronRight
                        size={18}
                        className="svpr-shortcut-chevron"
                      />
                    </button>
                  ))}
                </div>
              </section>
            )}

            <section
              className="svpr-security-panel"
              aria-label="Security settings"
            >
              <div className="svpr-security-icon">
                <LockKeyhole size={23} />
              </div>
              <div>
                <span className="svpr-overline">ACCOUNT PROTECTION</span>
                <h2>Keep your account secure.</h2>
                <p>
                  Change your password anytime from a dedicated secure screen.
                </p>
                {!verified && (
                  <button
                    type="button"
                    className="svpr-verify-action"
                    onClick={resendEmailVerification}
                    disabled={verifying}
                  >
                    {verifying ? "Sending..." : "Resend verification email"}
                  </button>
                )}
              </div>
              <button
                className="svpr-security-link"
                type="button"
                onClick={openPasswordScreen}
              >
                Update password <ArrowRight size={17} />
              </button>
            </section>
          </div>
        </div>

        <footer className="svpr-footer">
          <span>
            <ShieldCheck size={17} /> Account management · ShopVibe
          </span>
          <button type="button" onClick={() => logout()}>
            <LogOut size={17} /> Sign out
          </button>
        </footer>
      </div>
    </main>
  );
}
