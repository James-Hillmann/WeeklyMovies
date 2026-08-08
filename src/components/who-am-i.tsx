"use client";

import { useEffect, useState } from "react";
import { useName } from "./name-provider";
import { NameDialog } from "./name-dialog";
import { getAvatar } from "@/app/actions";

// Header identity control: your Discord photo (or a monogram fallback) + name.
// Click to change your name.
export function WhoAmI() {
  const { name, ready } = useName();
  const [open, setOpen] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);
  const initial = name?.trim().charAt(0).toUpperCase() ?? "";

  useEffect(() => {
    let alive = true;
    setAvatar(null);
    if (name) getAvatar(name).then((url) => alive && setAvatar(url));
    return () => {
      alive = false;
    };
  }, [name]);

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
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatar}
                alt=""
                width={22}
                height={22}
                className="rounded-full shrink-0 object-cover"
                style={{ width: 22, height: 22 }}
              />
            ) : (
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
            )}
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
