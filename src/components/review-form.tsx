"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useName } from "./name-provider";
import { NameDialog } from "./name-dialog";
import { addReview } from "@/app/actions";

type Mode = "write" | "letterboxd";

export function ReviewForm({ movieId }: { movieId: string }) {
  const { name } = useName();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("write");
  const [rating, setRating] = useState<number | null>(null);
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [needName, setNeedName] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name) {
      setNeedName(true);
      return;
    }
    setBusy(true);
    setMsg(null);
    const payload =
      mode === "write"
        ? { movieId, name, rating, body }
        : { movieId, name, letterboxdUrl: url };
    const result = await addReview(payload);
    setBusy(false);
    if (result.ok) {
      setRating(null);
      setBody("");
      setUrl("");
      setMsg("Posted. Thanks!");
      router.refresh();
    } else {
      setMsg(result.error);
    }
  }

  return (
    <div className="card p-4">
      <h3 className="text-base mb-3">What&apos;d you think?</h3>

      <div className="flex gap-1 mb-4 text-sm">
        <button
          type="button"
          className={`btn ${mode === "write" ? "btn-accent" : ""}`}
          onClick={() => setMode("write")}
        >
          Rate &amp; review
        </button>
        <button
          type="button"
          className={`btn ${mode === "letterboxd" ? "btn-accent" : ""}`}
          onClick={() => setMode("letterboxd")}
        >
          Letterboxd link
        </button>
      </div>

      <form onSubmit={submit}>
        {mode === "write" ? (
          <>
            <div className="mb-3">
              <StarInput value={rating} onChange={setRating} />
            </div>
            <textarea
              className="input"
              rows={3}
              placeholder="A line or two about it (optional)…"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </>
        ) : (
          <input
            className="input"
            placeholder="https://letterboxd.com/you/film/…"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        )}

        <div className="mt-3 flex items-center gap-3">
          <button type="submit" className="btn btn-accent" disabled={busy}>
            {busy ? "Posting…" : "Post"}
          </button>
          {msg && <span className="text-sm text-[var(--muted)]">{msg}</span>}
        </div>
      </form>

      <NameDialog open={needName} onClose={() => setNeedName(false)} />
    </div>
  );
}

// Clickable 5-star input with half-star support (stored as 1-10).
function StarInput({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const shown = hover ?? value ?? 0;

  return (
    <div className="flex items-center gap-2">
      <div className="flex" onMouseLeave={() => setHover(null)}>
        {[0, 1, 2, 3, 4].map((i) => {
          const fill = Math.max(0, Math.min(1, shown / 2 - i));
          return (
            <span key={i} className="relative" style={{ width: 26, height: 26 }}>
              {/* left half = i*2+1, right half = i*2+2 */}
              <button
                type="button"
                className="absolute inset-y-0 left-0 w-1/2 z-10"
                aria-label={`${i * 2 + 1} out of 10`}
                onMouseEnter={() => setHover(i * 2 + 1)}
                onClick={() => onChange(i * 2 + 1)}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 w-1/2 z-10"
                aria-label={`${i * 2 + 2} out of 10`}
                onMouseEnter={() => setHover(i * 2 + 2)}
                onClick={() => onChange(i * 2 + 2)}
              />
              <StarSvg fill={fill} />
            </span>
          );
        })}
      </div>
      <span className="text-sm text-[var(--muted)]">
        {value ? `${value}/10` : "tap to rate"}
      </span>
      {value != null && (
        <button
          type="button"
          className="text-xs text-[var(--muted)] underline underline-offset-2"
          onClick={() => onChange(null)}
        >
          clear
        </button>
      )}
    </div>
  );
}

function StarSvg({ fill }: { fill: number }) {
  const id = `si-${Math.round(fill * 100)}`;
  const path =
    "M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.9 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9L12 2.5z";
  return (
    <svg width={26} height={26} viewBox="0 0 24 24" style={{ display: "block" }}>
      <defs>
        <linearGradient id={id}>
          <stop offset={`${fill * 100}%`} stopColor="var(--accent)" />
          <stop offset={`${fill * 100}%`} stopColor="transparent" />
        </linearGradient>
      </defs>
      <path
        d={path}
        fill={`url(#${id})`}
        stroke="var(--accent)"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
