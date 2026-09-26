import clsx from "clsx";
const variants = {
    primary: "bg-gradient-to-r from-violet-600 to-purple-700 text-white hover:from-violet-700 hover:to-purple-800 shadow-lg shadow-violet-200 active:scale-[0.98]",
    secondary: "bg-gray-900 text-white hover:bg-gray-700 active:scale-[0.98]",
    outline: "border-2 border-violet-600 text-violet-600 hover:bg-violet-50 active:scale-[0.98]",
    ghost: "text-gray-600 hover:bg-gray-100 hover:text-gray-900 active:scale-[0.98]",
    danger: "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-200 active:scale-[0.98]",
    success: "bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-200 active:scale-[0.98]",
};
const sizes = {
    xs: "px-2.5 py-1 text-xs rounded-lg gap-1",
    sm: "px-3.5 py-1.5 text-sm rounded-lg gap-1.5",
    md: "px-5 py-2.5 text-sm rounded-xl gap-2",
    lg: "px-6 py-3 text-base rounded-xl gap-2",
    xl: "px-8 py-4 text-lg rounded-2xl gap-2.5",
};
export default function Button({ variant = "primary", size = "md", loading = false, fullWidth = false, icon, iconRight, children, className, disabled, ...props }) {
    return (<button {...props} disabled={disabled || loading} className={clsx("inline-flex items-center justify-center font-semibold transition-all duration-200 select-none", "disabled:opacity-60 disabled:cursor-not-allowed", variants[variant], sizes[size], fullWidth && "w-full", className)}>
      {loading ? (<span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"/>) : icon ? (<span className="shrink-0">{icon}</span>) : null}
      {children}
      {iconRight && !loading && <span className="shrink-0">{iconRight}</span>}
    </button>);
}
