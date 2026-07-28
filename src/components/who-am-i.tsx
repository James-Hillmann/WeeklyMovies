"use client";

import { useState } from "react";
import { useName } from "./name-provider";
import { NameDialog } from "./name-dialog";

// Header identity control: a small monogram avatar + your name. Click to change.
export function WhoAmI() {
  const { name, ready } = useName();
  const [open, setOpen] = useState(false);
  const initial = name?.trim().charAt(0).toUpperCase() ?? "";

  return (
    <>
      <button
        className="flex items-center gap-2 text-sm hover:opacity-80 transition-opacity"
        onClick={() => setOpen(true)}
        title="Set or change your name"
      >
        {!ready ? (
          // Stable-size placeholder so the header doesn't jump before we read
          // the saved name.
          <span style={{ width: 22, height: 22 }} />
        ) : name ? (
          <>
            <span
              aria-hidden
              className="inline-flex items-center justify-center rounded-full shrink-0"
              style={{
                width: 22,
                height: 22,
                background: "var(--accent)",
                color: "var(--accent-ink)",
                fontSize: 11,
                fontWeight: 600,
                lineHeight: 1,
              }}
            >
              {initial}
            </span>
            <span>{name}</span>
          </>
        ) : (
          <>
            <span
              aria-hidden
              className="inline-flex rounded-full shrink-0"
              style={{ width: 22, height: 22, border: "1.5px solid var(--accent)" }}
            />
            <span className="text-[var(--accent)]">set your name</span>
          </>
        )}
      </button>
      <NameDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
