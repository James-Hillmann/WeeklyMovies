"use client";

import { useEffect, useState } from "react";
import { useName } from "./name-provider";

// A tiny modal for entering / changing your display name.
export function NameDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { name, setName } = useName();
  const [value, setValue] = useState(name ?? "");

  useEffect(() => {
    if (open) setValue(name ?? "");
  }, [open, name]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const save = () => {
    if (!value.trim()) return;
    setName(value);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-5"
      style={{ background: "rgba(31,29,26,0.35)" }}
      onClick={onClose}
    >
      <div
        className="card w-full max-w-sm p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg mb-1">What should we call you?</h2>
        <p className="text-sm text-[var(--muted)] mb-4">
          Just a name your friends will recognize. It&apos;s saved on this device.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <input
            autoFocus
            className="input mb-4"
            placeholder="e.g. Sam"
            value={value}
            maxLength={40}
            onChange={(e) => setValue(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <button type="button" className="btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-accent" disabled={!value.trim()}>
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
