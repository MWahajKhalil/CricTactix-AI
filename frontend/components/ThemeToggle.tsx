"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    // Read initial theme from document element class list (set by inline script)
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className="relative p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800/40 border border-border-color transition-colors duration-150 group"
      aria-label="Toggle Theme Mode"
    >
      <div className="relative h-4 w-4 overflow-hidden">
        {/* Sun Icon (Visible in Light Mode) */}
        <svg
          className="absolute inset-0 h-4 w-4 text-amber-500 transition-all duration-300 transform dark:scale-0 dark:rotate-90 scale-100 rotate-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 3v1m0 16v1m9-9h-1M4 9h-1m14.071-4.071l-.707.707M6.343 17.657l-.707.707m2.828-9.9a5 5 0 117.072 0l-.707.707M17.657 16.343l.707.707M6.343 6.343l.707-.707"
          />
        </svg>
        {/* Moon Icon (Visible in Dark Mode) */}
        <svg
          className="absolute inset-0 h-4 w-4 text-cyan-400 transition-all duration-300 transform dark:scale-100 dark:rotate-0 scale-0 -rotate-90"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      </div>
    </button>
  );
}
