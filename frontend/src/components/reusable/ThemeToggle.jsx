import { Moon, Sun } from "lucide-react";
import clsx from "clsx";
import { useTheme } from "./ThemeProvider";

export default function ThemeToggle({ floating = false, className = "" }) {
  const { isDark, toggleTheme } = useTheme();
  const label = isDark ? "Switch to light mode" : "Switch to dark mode";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className={clsx(
        "inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 shadow-sm transition hover:bg-gray-50 hover:text-violet-600",
        floating && "fixed right-4 top-4 z-[70]",
        className,
      )}
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
