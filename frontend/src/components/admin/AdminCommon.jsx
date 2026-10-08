import { useEffect } from "react";
import { Loader2, X } from "lucide-react";
import clsx from "clsx";

export function Panel({
  title,
  subtitle,
  actions,
  children,
  className = "",
  contentClassName = "",
}) {
  return (
    <section className={clsx("admin-ui-panel", className)}>
      {(title || subtitle || actions) && (
        <header className="admin-ui-panel-head">
          <div className="admin-ui-panel-copy">
            {title && <h2>{title}</h2>}
            {subtitle && <p>{subtitle}</p>}
          </div>
          {actions && <div className="admin-ui-panel-actions">{actions}</div>}
        </header>
      )}
      <div className={clsx("admin-ui-panel-body", contentClassName)}>
        {children}
      </div>
    </section>
  );
}

export function AdminField({
  label,
  error,
  className = "",
  inputClassName = "",
  required = false,
  ...props
}) {
  return (
    <label className={clsx("admin-ui-field", className)}>
      {label && (
        <span className="admin-ui-field-label">
          {label}
          {required && <b>*</b>}
        </span>
      )}
      <input
        {...props}
        required={required}
        aria-invalid={Boolean(error)}
        className={clsx(
          "admin-ui-input",
          error && "has-error",
          inputClassName,
          props.className,
        )}
      />
      {error && <small className="admin-ui-field-error">{error}</small>}
    </label>
  );
}

export function AdminTextArea({
  label,
  error,
  className = "",
  textareaClassName = "",
  required = false,
  ...props
}) {
  return (
    <label className={clsx("admin-ui-field", className)}>
      {label && (
        <span className="admin-ui-field-label">
          {label}
          {required && <b>*</b>}
        </span>
      )}
      <textarea
        {...props}
        required={required}
        aria-invalid={Boolean(error)}
        className={clsx(
          "admin-ui-input admin-ui-textarea",
          error && "has-error",
          textareaClassName,
          props.className,
        )}
      />
      {error && <small className="admin-ui-field-error">{error}</small>}
    </label>
  );
}

export function AdminSelect({
  label,
  children,
  error,
  className = "",
  selectClassName = "",
  required = false,
  ...props
}) {
  return (
    <label className={clsx("admin-ui-field", className)}>
      {label && (
        <span className="admin-ui-field-label">
          {label}
          {required && <b>*</b>}
        </span>
      )}
      <select
        {...props}
        required={required}
        aria-invalid={Boolean(error)}
        className={clsx(
          "admin-ui-input admin-ui-select",
          error && "has-error",
          selectClassName,
          props.className,
        )}
      >
        {children}
      </select>
      {error && <small className="admin-ui-field-error">{error}</small>}
    </label>
  );
}

export function AdminModal({
  title,
  children,
  onClose,
  wide = false,
  className = "",
}) {
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="admin-ui-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <div className={clsx("admin-ui-modal", wide && "wide", className)}>
        <header className="admin-ui-modal-head">
          <div>
            <small>SHOPVIBE ADMIN</small>
            <h2>{title}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close">
            <X size={19} />
          </button>
        </header>
        <div className="admin-ui-modal-body">{children}</div>
      </div>
    </div>
  );
}

export function AdminButton({
  children,
  tone = "primary",
  loading = false,
  className = "",
  type,
  ...props
}) {
  return (
    <button
      {...props}
      type={type || "button"}
      disabled={props.disabled || loading}
      className={clsx("admin-ui-button", `tone-${tone}`, className)}
    >
      {loading && <Loader2 size={15} className="sv-admcommon-001" />}
      <span>{children}</span>
    </button>
  );
}

export function StatusPill({ children, tone = "neutral", className = "" }) {
  return (
    <span className={clsx("admin-ui-status", `tone-${tone}`, className)}>
      {children}
    </span>
  );
}

export function AdminLoading({ label = "Loading…" }) {
  return (
    <div className="admin-ui-loading">
      <Loader2 size={18} className="sv-admcommon-001" />
      <span>{label}</span>
    </div>
  );
}

export function AdminEmpty({ message = "No records found." }) {
  return (
    <div className="admin-ui-empty">
      <span>—</span>
      <p>{message}</p>
    </div>
  );
}

export function AdminError({ message, retry }) {
  return (
    <div className="admin-ui-error">
      <span>{message}</span>
      {retry && (
        <button type="button" onClick={retry}>
          Retry
        </button>
      )}
    </div>
  );
}

export const money = (value, currency = "INR") =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

export const shortDate = (value) =>
  value ? new Date(String(value)).toLocaleString() : "—";
