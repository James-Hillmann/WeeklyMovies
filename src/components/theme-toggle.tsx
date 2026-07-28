"use client";

import { useEffect, useState } from "react";

const KEY = "weeklymovies.theme";

// Light is the default. "Dim" is the warm low-glare dark mode. The choice is
// saved per device and applied before paint by the inline script in layout.
export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const isDark =
      document.documentElement.getAttribute("data-theme") === "dark";
    setDark(isDark);
    setReady(true);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
    try {
      window.localStorage.setItem(KEY, next ? "dark" : "light");
    } catch {
      // ignore
    }
  }

  return (
    <button
      onClick={toggle}
      className="text-sm hover:underline underline-offset-4"
      title={dark ? "Switch to light" : "Switch to dim"}
      aria-label="Toggle light and dim mode"
    >
      {!ready ? <span className="text-[var(--muted)]">…</span> : dark ? "Light" : "Dim"}
    </button>
  );
}
