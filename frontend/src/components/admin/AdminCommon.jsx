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
    <section
      className={clsx(
        "rounded-2xl border border-gray-100 bg-white shadow-sm",
        "dark:border-gray-800 dark:bg-gray-900",
        className
      )}
    >
      {(title || subtitle || actions) && (
        <div
          className={clsx(
            "flex flex-col gap-3 border-b border-gray-100 px-5 py-4",
            "sm:flex-row sm:items-center sm:justify-between",
            "dark:border-gray-800"
          )}
        >
          <div>
            {title && (
              <h2 className="font-bold text-gray-900 dark:text-gray-100">
                {title}
              </h2>
            )}

            {subtitle && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {subtitle}
              </p>
            )}
          </div>

          {actions && (
            <div className="flex flex-wrap items-center gap-2">{actions}</div>
          )}
        </div>
      )}

      <div className={clsx("p-5", contentClassName)}>{children}</div>
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
    <label className={clsx("block", className)}>
      {label && (
        <span className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300">
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </span>
      )}

      <input
        {...props}
        required={required}
        aria-invalid={Boolean(error)}
        className={clsx(
          "w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition",
          "bg-white text-gray-900 placeholder:text-gray-400",
          "dark:bg-gray-950 dark:text-gray-100 dark:placeholder:text-gray-500",
          error
            ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100 dark:border-red-700 dark:focus:ring-red-950"
            : "border-gray-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 dark:border-gray-700 dark:focus:border-violet-500 dark:focus:ring-violet-950/50",
          props.disabled &&
            "cursor-not-allowed bg-gray-50 text-gray-400 dark:bg-gray-900 dark:text-gray-600",
          inputClassName,
          props.className
        )}
      />

      {error && (
        <span className="mt-1 block text-xs text-red-500 dark:text-red-400">
          {error}
        </span>
      )}
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
    <label className={clsx("block", className)}>
      {label && (
        <span className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300">
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </span>
      )}

      <textarea
        {...props}
        required={required}
        aria-invalid={Boolean(error)}
        className={clsx(
          "w-full resize-y rounded-xl border px-3 py-2.5 text-sm outline-none transition",
          "bg-white text-gray-900 placeholder:text-gray-400",
          "dark:bg-gray-950 dark:text-gray-100 dark:placeholder:text-gray-500",
          error
            ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100 dark:border-red-700 dark:focus:ring-red-950"
            : "border-gray-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 dark:border-gray-700 dark:focus:border-violet-500 dark:focus:ring-violet-950/50",
          props.disabled &&
            "cursor-not-allowed bg-gray-50 text-gray-400 dark:bg-gray-900 dark:text-gray-600",
          textareaClassName,
          props.className
        )}
      />

      {error && (
        <span className="mt-1 block text-xs text-red-500 dark:text-red-400">
          {error}
        </span>
      )}
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
    <label className={clsx("block", className)}>
      {label && (
        <span className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300">
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </span>
      )}

      <select
        {...props}
        required={required}
        aria-invalid={Boolean(error)}
        className={clsx(
          "w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition",
          "bg-white text-gray-900",
          "dark:bg-gray-950 dark:text-gray-100",
          error
            ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100 dark:border-red-700 dark:focus:ring-red-950"
            : "border-gray-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 dark:border-gray-700 dark:focus:border-violet-500 dark:focus:ring-violet-950/50",
          props.disabled &&
            "cursor-not-allowed bg-gray-50 text-gray-400 dark:bg-gray-900 dark:text-gray-600",
          selectClassName,
          props.className
        )}
      >
        {children}
      </select>

      {error && (
        <span className="mt-1 block text-xs text-red-500 dark:text-red-400">
          {error}
        </span>
      )}
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
      if (event.key === "Escape") {
        onClose?.();
      }
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
      className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose?.();
        }
      }}
    >
      <div
        className={clsx(
          "max-h-[92vh] w-full overflow-auto rounded-3xl bg-white shadow-2xl",
          "dark:border dark:border-gray-800 dark:bg-gray-900",
          wide ? "max-w-5xl" : "max-w-2xl",
          className
        )}
      >
        <div
          className={clsx(
            "sticky top-0 z-10 flex items-center justify-between border-b border-gray-100",
            "bg-white/95 px-5 py-4 backdrop-blur",
            "dark:border-gray-800 dark:bg-gray-900/95"
          )}
        >
          <h2 className="font-bold text-gray-900 dark:text-gray-100">
            {title}
          </h2>

          <button
            type="button"
            onClick={onClose}
            className={clsx(
              "rounded-xl p-2 text-gray-500 transition",
              "hover:bg-gray-100 hover:text-gray-800",
              "focus:outline-none focus:ring-2 focus:ring-violet-300",
              "dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100 dark:focus:ring-violet-800"
            )}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 text-gray-900 dark:text-gray-100">{children}</div>
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
  const toneClass =
    {
      primary:
        "bg-violet-600 text-white hover:bg-violet-700 dark:bg-violet-600 dark:hover:bg-violet-500",
      secondary:
        "bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white",
      danger:
        "bg-red-500 text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-500",
      ghost:
        "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800",
      success:
        "bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500",
    }[tone] ||
    "bg-violet-600 text-white hover:bg-violet-700 dark:hover:bg-violet-500";

  return (
    <button
      {...props}
      type={type || "button"}
      disabled={props.disabled || loading}
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition",
        "focus:outline-none focus:ring-2 focus:ring-violet-300 focus:ring-offset-1",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "dark:focus:ring-violet-800 dark:focus:ring-offset-gray-900",
        toneClass,
        className
      )}
    >
      {loading && <Loader2 size={15} className="animate-spin" />}
      {children}
    </button>
  );
}

export function StatusPill({ children, tone = "neutral", className = "" }) {
  const toneClass =
    {
      neutral:
        "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
      success:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
      warning:
        "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
      danger:
        "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300",
      info:
        "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300",
    }[tone] ||
    "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";

  return (
    <span
      className={clsx(
        "inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold",
        toneClass,
        className
      )}
    >
      {children}
    </span>
  );
}

export function AdminLoading({ label = "Loading…" }) {
  return (
    <div className="flex items-center justify-center gap-2 py-14 text-sm text-gray-500 dark:text-gray-400">
      <Loader2 size={18} className="animate-spin" />
      {label}
    </div>
  );
}

export function AdminEmpty({ message = "No records found." }) {
  return (
    <div className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
      {message}
    </div>
  );
}

export function AdminError({ message, retry }) {
  return (
    <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-300">
      {message}

      {retry && (
        <button
          type="button"
          onClick={retry}
          className="ml-3 font-semibold underline underline-offset-2 hover:no-underline"
        >
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
