import clsx from "clsx";

const variants = {
  primary: "premium-btn premium-btn-primary",
  secondary: "premium-btn premium-btn-secondary",
  outline: "premium-btn premium-btn-outline",
  ghost: "premium-btn premium-btn-ghost",
  danger: "premium-btn premium-btn-danger",
};

const sizes = {
  sm: "premium-btn-sm",
  md: "premium-btn-md",
  lg: "premium-btn-lg",
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  icon,
  iconRight,
  loading = false,
  disabled = false,
  fullWidth = false,
  className,
  type = "button",
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={clsx(
        variants[variant] || variants.primary,
        sizes[size] || sizes.md,
        fullWidth && "w-full",
        loading && "is-loading",
        className,
      )}
      {...props}
    >
      <span className="premium-btn-fill" aria-hidden="true" />
      <span className="premium-btn-content">
        {loading ? <span className="premium-btn-spinner" aria-hidden="true" /> : icon}
        <span>{children}</span>
        {!loading && iconRight}
      </span>
    </button>
  );
}
