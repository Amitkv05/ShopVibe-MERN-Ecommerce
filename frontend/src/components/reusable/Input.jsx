import clsx from "clsx";
export default function Input({ label, error, hint, leftIcon, rightIcon, className, id, ...props }) {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    return (<div className="flex flex-col gap-1.5">
      {label && (<label htmlFor={inputId} className="text-sm font-medium text-gray-700">
          {label}
        </label>)}
      <div className="relative">
        {leftIcon && (<span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
            {leftIcon}
          </span>)}
        <input id={inputId} className={clsx("w-full bg-gray-50 border rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400", "outline-none transition-all duration-200", "focus:bg-white focus:border-violet-500 focus:ring-3 focus:ring-violet-100", error
            ? "border-red-400 focus:border-red-400 focus:ring-red-100"
            : "border-gray-200 hover:border-gray-300", leftIcon && "pl-10", rightIcon && "pr-10", className)} {...props}/>
        {rightIcon && (<span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
            {rightIcon}
          </span>)}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
    </div>);
}
