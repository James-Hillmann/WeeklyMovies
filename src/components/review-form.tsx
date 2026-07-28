"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useName } from "./name-provider";
import { NameDialog } from "./name-dialog";
import { addReview } from "@/app/actions";
import { StarInput } from "./star-input";

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
