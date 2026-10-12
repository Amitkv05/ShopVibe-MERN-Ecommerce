import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Edit2,
  Home,
  LoaderCircle,
  MapPin,
  Phone,
  Plus,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { useStore } from "@/lib/store";
import "../styles/AddressScreen.css";

const COUNTRIES = [
  "India",
  "United States",
  "Canada",
  "United Kingdom",
  "Australia",
  "Germany",
  "France",
];

const emptyAddress = () => ({
  name: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  zip: "",
  country: "India",
  isDefault: false,
});

function AddressField({
  label,
  id,
  required = false,
  className = "",
  ...props
}) {
  return (
    <div className={`sv-address-field ${className}`}>
      <label htmlFor={id}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      <input id={id} required={required} {...props} />
    </div>
  );
}

export default function AddressScreen() {
  const {
    addresses,
    addAddress,
    updateAddress,
    removeAddress,
    setDefaultAddress,
    setPage,
    refreshAddresses,
    isLoggedIn,
    showToast,
  } = useStore();

  const savedAddresses = Array.isArray(addresses) ? addresses : [];
  const orderedAddresses = [...savedAddresses].sort(
    (a, b) => Number(Boolean(b.isDefault)) - Number(Boolean(a.isDefault)),
  );

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyAddress);
  const [saving, setSaving] = useState(false);
  const [workingId, setWorkingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [formError, setFormError] = useState("");
  const formRef = useRef(null);

  useEffect(() => {
    if (isLoggedIn) void refreshAddresses();
  }, [isLoggedIn, refreshAddresses]);

  const update = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (formError) setFormError("");
  };

  const revealForm = () => {
    // On small screens, bring the form into view after React renders it.
    if (typeof window !== "undefined" && window.innerWidth <= 860) {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          formRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        });
      });
    }
  };

  const openNew = () => {
    setEditId(null);
    setForm(emptyAddress());
    setFormError("");
    setConfirmDeleteId(null);
    setShowForm(true);
    revealForm();
  };

  const openEdit = (address) => {
    setEditId(address.id);
    setForm({
      name: address.name ?? "",
      phone: address.phone ?? "",
      line1: address.line1 ?? "",
      line2: address.line2 ?? "",
      city: address.city ?? "",
      state: address.state ?? "",
      zip: address.zip ?? "",
      country: address.country || "India",
      isDefault: Boolean(address.isDefault),
    });
    setFormError("");
    setConfirmDeleteId(null);
    setShowForm(true);
    revealForm();
  };

  const closeForm = () => {
    if (saving) return;
    setShowForm(false);
    setEditId(null);
    setForm(emptyAddress());
    setFormError("");
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (saving) return;

    const payload = {
      ...form,
      name: form.name.trim(),
      phone: form.phone.trim(),
      line1: form.line1.trim(),
      line2: form.line2.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      zip: form.zip.trim(),
      country: form.country.trim(),
    };

    if (
      !payload.name ||
      !payload.phone ||
      !payload.line1 ||
      !payload.city ||
      !payload.state ||
      !payload.zip ||
      !payload.country
    ) {
      setFormError("Please complete all required address fields.");
      return;
    }

    setSaving(true);
    setFormError("");
    try {
      if (editId != null) {
        await updateAddress(editId, payload);
      } else {
        await addAddress(payload);
      }
      setShowForm(false);
      setEditId(null);
      setForm(emptyAddress());
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to save address.";
      setFormError(message);
      showToast?.(message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDefault = async (id) => {
    if (workingId != null) return;
    setWorkingId(id);
    try {
      await setDefaultAddress(id);
    } catch (error) {
      showToast?.(
        error instanceof Error
          ? error.message
          : "Unable to update default address.",
        "error",
      );
    } finally {
      setWorkingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (workingId != null) return;
    setWorkingId(id);
    try {
      await removeAddress(id);
      setConfirmDeleteId(null);
      if (editId === id) closeForm();
    } catch (error) {
      showToast?.(
        error instanceof Error ? error.message : "Unable to delete address.",
        "error",
      );
    } finally {
      setWorkingId(null);
    }
  };

  return (
    <main className="sv-address-page">
      <div className="sv-address-glow" aria-hidden="true" />

      <div className="sv-address-shell">
        <nav className="sv-address-crumbs" aria-label="Breadcrumb">
          <button type="button" onClick={() => setPage("profile")}>
            My account
          </button>
          <span aria-hidden="true">/</span>
          <strong>Shipping addresses</strong>
        </nav>

        <header className="sv-address-header">
          <div className="sv-address-heading-wrap">
            <button
              type="button"
              className="sv-address-back"
              onClick={() => setPage("profile")}
              aria-label="Back to profile"
            >
              <ArrowLeft size={19} />
            </button>
            <div>
              <span className="sv-address-eyebrow">MY ACCOUNT / DELIVERY</span>
              <h1>
                Shipping <span>addresses.</span>
              </h1>
              <p>Manage the places where you receive your ShopVibe orders.</p>
            </div>
          </div>
          {isLoggedIn && (
            <button
              type="button"
              className="sv-address-primary sv-address-header-add"
              onClick={openNew}
            >
              <Plus size={18} /> Add new address
            </button>
          )}
        </header>

        <div className="sv-address-overview">
          <div className="sv-address-count-bubble">
            <MapPin size={21} />
          </div>
          <div className="sv-address-count-label">
            <strong>{savedAddresses.length}</strong>
            <span>
              Saved {savedAddresses.length === 1 ? "address" : "addresses"}
            </span>
          </div>
          <div className="sv-address-overview-note">
            <ShieldCheck size={17} /> Your address details are used for order
            delivery.
          </div>
        </div>

        {!isLoggedIn ? (
          <section className="sv-address-auth-card">
            <div className="sv-address-empty-icon">
              <MapPin size={30} />
            </div>
            <h2>Sign in to manage addresses</h2>
            <p>
              Your saved shipping addresses will be available once you sign in.
            </p>
            <button
              className="sv-address-primary"
              type="button"
              onClick={() => setPage("login")}
            >
              Go to sign in <ArrowRight size={17} />
            </button>
          </section>
        ) : (
          <div className="sv-address-content">
            <section
              className="sv-address-list-panel"
              aria-labelledby="sv-address-list-title"
            >
              <div className="sv-address-section-heading">
                <div>
                  <span className="sv-address-eyebrow">
                    YOUR SAVED LOCATIONS
                  </span>
                  <h2 id="sv-address-list-title">Delivery addresses</h2>
                  <p>Set a default address for a faster checkout.</p>
                </div>
                <span className="sv-address-section-count">
                  {String(savedAddresses.length).padStart(2, "0")}
                </span>
              </div>

              {orderedAddresses.length === 0 ? (
                <div className="sv-address-empty">
                  <div className="sv-address-empty-icon">
                    <Home size={28} />
                  </div>
                  <h3>No addresses saved yet</h3>
                  <p>
                    Add a shipping address now so your details are ready at
                    checkout.
                  </p>
                  <button
                    type="button"
                    className="sv-address-primary"
                    onClick={openNew}
                  >
                    <Plus size={17} /> Add your first address
                  </button>
                </div>
              ) : (
                <div className="sv-address-cards">
                  {orderedAddresses.map((address) => (
                    <article
                      key={address.id}
                      className={`sv-address-card ${address.isDefault ? "is-default" : ""}`}
                    >
                      <div className="sv-address-card-top">
                        <div className="sv-address-map-icon">
                          <MapPin size={19} />
                        </div>
                        {address.isDefault && (
                          <span className="sv-address-default-badge">
                            <CheckCircle size={13} /> Default address
                          </span>
                        )}
                      </div>

                      <h3>{address.name}</h3>
                      <address className="sv-address-lines">
                        <span>{address.line1}</span>
                        {address.line2 && <span>{address.line2}</span>}
                        <span>
                          {[address.city, address.state, address.zip]
                            .filter(Boolean)
                            .join(", ")}
                        </span>
                        <span>{address.country}</span>
                      </address>
                      <p className="sv-address-phone">
                        <Phone size={14} /> {address.phone}
                      </p>

                      <div className="sv-address-card-actions">
                        <button
                          type="button"
                          onClick={() => openEdit(address)}
                          disabled={workingId != null || saving}
                        >
                          <Edit2 size={15} /> Edit
                        </button>
                        {!address.isDefault && (
                          <button
                            type="button"
                            onClick={() => void handleDefault(address.id)}
                            disabled={workingId != null || saving}
                          >
                            {workingId === address.id ? (
                              <LoaderCircle
                                className="sv-address-spin"
                                size={15}
                              />
                            ) : (
                              <CheckCircle size={15} />
                            )}
                            Set default
                          </button>
                        )}
                        {!address.isDefault && (
                          <button
                            type="button"
                            className="sv-address-delete-button"
                            aria-label={`Delete address for ${address.name}`}
                            onClick={() => setConfirmDeleteId(address.id)}
                            disabled={workingId != null || saving}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>

                      {confirmDeleteId === address.id && (
                        <div
                          className="sv-address-delete-confirm"
                          role="group"
                          aria-label="Confirm address deletion"
                        >
                          <p>Delete this address?</p>
                          <div>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              disabled={workingId != null}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              className="sv-address-confirm-delete"
                              onClick={() => void handleDelete(address.id)}
                              disabled={workingId != null}
                            >
                              {workingId === address.id ? (
                                <LoaderCircle
                                  className="sv-address-spin"
                                  size={14}
                                />
                              ) : (
                                <Trash2 size={14} />
                              )}
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>

            <aside className="sv-address-aside" ref={formRef}>
              {showForm ? (
                <section
                  className="sv-address-form-card"
                  aria-labelledby="sv-address-form-title"
                >
                  <div className="sv-address-form-header">
                    <div>
                      <span className="sv-address-eyebrow">
                        ADDRESS DETAILS
                      </span>
                      <h2 id="sv-address-form-title">
                        {editId != null ? "Edit address" : "New address"}
                      </h2>
                      <p>Fields marked * are required.</p>
                    </div>
                    <button
                      type="button"
                      className="sv-address-close"
                      onClick={closeForm}
                      disabled={saving}
                      aria-label="Close address form"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <form className="sv-address-form" onSubmit={handleSave}>
                    <div className="sv-address-form-grid">
                      <AddressField
                        label="Full name"
                        id="sv-address-name"
                        required
                        value={form.name}
                        onChange={(e) => update("name", e.target.value)}
                        placeholder="Your full name"
                        autoComplete="name"
                      />
                      <AddressField
                        label="Phone number"
                        id="sv-address-phone"
                        required
                        type="tel"
                        value={form.phone}
                        onChange={(e) => update("phone", e.target.value)}
                        placeholder="+91 98765 43210"
                        autoComplete="tel"
                      />
                      <AddressField
                        className="sv-address-full"
                        label="Address line 1"
                        id="sv-address-line1"
                        required
                        value={form.line1}
                        onChange={(e) => update("line1", e.target.value)}
                        placeholder="House number, street, locality"
                        autoComplete="address-line1"
                      />
                      <AddressField
                        className="sv-address-full"
                        label="Address line 2 (optional)"
                        id="sv-address-line2"
                        value={form.line2}
                        onChange={(e) => update("line2", e.target.value)}
                        placeholder="Apartment, floor, landmark"
                        autoComplete="address-line2"
                      />
                      <AddressField
                        label="City"
                        id="sv-address-city"
                        required
                        value={form.city}
                        onChange={(e) => update("city", e.target.value)}
                        placeholder="New Delhi"
                        autoComplete="address-level2"
                      />
                      <AddressField
                        label="State / Province"
                        id="sv-address-state"
                        required
                        value={form.state}
                        onChange={(e) => update("state", e.target.value)}
                        placeholder="Delhi"
                        autoComplete="address-level1"
                      />
                      <AddressField
                        label="Postal / ZIP code"
                        id="sv-address-zip"
                        required
                        value={form.zip}
                        onChange={(e) => update("zip", e.target.value)}
                        placeholder="110001"
                        autoComplete="postal-code"
                      />
                      <div className="sv-address-field">
                        <label htmlFor="sv-address-country">
                          Country <span aria-hidden="true">*</span>
                        </label>
                        <select
                          id="sv-address-country"
                          value={form.country}
                          onChange={(e) => update("country", e.target.value)}
                          required
                          autoComplete="country-name"
                        >
                          {COUNTRIES.map((country) => (
                            <option key={country} value={country}>
                              {country}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <label className="sv-address-checkbox">
                      <input
                        type="checkbox"
                        checked={form.isDefault}
                        onChange={(e) => update("isDefault", e.target.checked)}
                      />
                      <span>Make this my default shipping address</span>
                    </label>

                    {formError && (
                      <p className="sv-address-form-error" role="alert">
                        {formError}
                      </p>
                    )}

                    <div className="sv-address-form-actions">
                      <button
                        type="button"
                        className="sv-address-secondary"
                        onClick={closeForm}
                        disabled={saving}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="sv-address-primary"
                        disabled={saving}
                      >
                        {saving ? (
                          <LoaderCircle className="sv-address-spin" size={17} />
                        ) : (
                          <CheckCircle size={17} />
                        )}
                        {saving
                          ? "Saving address..."
                          : editId != null
                            ? "Save changes"
                            : "Save address"}
                      </button>
                    </div>
                  </form>
                </section>
              ) : (
                <section className="sv-address-help-card">
                  <div className="sv-address-help-icon">
                    <Home size={27} />
                  </div>
                  <span className="sv-address-eyebrow">SHOPVIBE DELIVERY</span>
                  <h2>
                    Make checkout <span>easier.</span>
                  </h2>
                  <p>
                    Save your shipping details once and select your preferred
                    delivery address whenever you order.
                  </p>
                  <div className="sv-address-help-rule" />
                  <div className="sv-address-help-step">
                    <span>01</span> Add a delivery address
                  </div>
                  <div className="sv-address-help-step">
                    <span>02</span> Choose your default location
                  </div>
                  <div className="sv-address-help-step">
                    <span>03</span> Review it during checkout
                  </div>
                  <button
                    type="button"
                    className="sv-address-primary"
                    onClick={openNew}
                  >
                    <Plus size={17} /> Add another address
                  </button>
                </section>
              )}
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
