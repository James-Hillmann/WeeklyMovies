"use client";

import { useState } from "react";
import { useName } from "./name-provider";
import { NameDialog } from "./name-dialog";

// Header widget: shows your name, or a prompt to set one. Click to change it.
export function WhoAmI() {
  const { name, ready } = useName();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="text-sm hover:underline underline-offset-4"
        onClick={() => setOpen(true)}
        title="Set or change your name"
      >
        {!ready ? (
          <span className="text-[var(--muted)]">…</span>
        ) : name ? (
          <span>
            <span className="text-[var(--muted)]">you&apos;re </span>
            {name}
          </span>
        ) : (
          <span className="text-[var(--accent)]">set your name</span>
        )}
      </button>
      <NameDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
