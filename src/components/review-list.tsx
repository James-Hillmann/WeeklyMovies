"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useName } from "./name-provider";
import { StarInput } from "./star-input";
import { Stars } from "./stars";
import { Avatar } from "./avatar";
import { editReview } from "@/app/actions";

export type ReviewView = {
  id: string;
  author: string;
  avatarUrl: string | null;
  rating: number | null;
  body: string | null;
  isSpoiler: boolean;
  letterboxdUrl: string | null;
  createdAt: string; // ISO
  editedAt: string | null; // ISO or null
};

function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function fullDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ReviewList({ reviews }: { reviews: ReviewView[] }) {
  if (reviews.length === 0) {
    return (
      <p className="text-sm text-[var(--muted)] mb-5">
        No reviews yet. Be the first once you&apos;ve watched it.
      </p>
    );
  }
  const reviewerNames = reviews.map((r) => r.author);
  return (
    <ul className="space-y-4 mb-6">
      {reviews.map((r) => (
        <ReviewItem key={r.id} review={r} reviewerNames={reviewerNames} />
      ))}
    </ul>
  );
}

function ReviewItem({
  review,
  reviewerNames,
}: {
  review: ReviewView;
  reviewerNames: string[];
}) {
  const { name } = useName();
  const router = useRouter();
  const me = name?.trim().toLowerCase() ?? "";
  const mine = !!me && me === review.author.trim().toLowerCase();
  // Spoilers auto-reveal for people who have already seen the movie: the
  // review's author, and anyone who has reviewed this movie themselves.
  const seenIt =
    mine ||
    (!!me && reviewerNames.some((n) => n.trim().toLowerCase() === me));

  const [editing, setEditing] = useState(false);
  const [mode, setMode] = useState<"write" | "letterboxd">(
    review.letterboxdUrl && review.rating == null && !review.body ? "letterboxd" : "write",
  );
  const [rating, setRating] = useState<number | null>(review.rating);
  const [body, setBody] = useState(review.body ?? "");
  const [isSpoiler, setIsSpoiler] = useState(review.isSpoiler);
  const [url, setUrl] = useState(review.letterboxdUrl ?? "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);

  function reset() {
    setRating(review.rating);
    setBody(review.body ?? "");
    setIsSpoiler(review.isSpoiler);
    setUrl(review.letterboxdUrl ?? "");
    setErr(null);
    setEditing(false);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!name) return;
    setBusy(true);
    setErr(null);
    const payload =
      mode === "write"
        ? { reviewId: review.id, name, rating, body, isSpoiler, letterboxdUrl: null }
        : { reviewId: review.id, name, rating: null, body: null, letterboxdUrl: url };
    const result = await editReview(payload);
    setBusy(false);
    if (result.ok) {
      setEditing(false);
      router.refresh();
    } else {
      setErr(result.error);
    }
  }

  return (
    <li className="card p-3">
      <div className="flex items-center gap-2">
        <Avatar name={review.author} url={review.avatarUrl} size={28} />
        <span className="font-medium text-sm">{review.author}</span>
        <span className="text-xs text-[var(--muted)] ml-auto flex items-center gap-2">
          <span>
            {shortDate(review.createdAt)}
            {review.editedAt && (
              <span title={`Edited ${fullDate(review.editedAt)}`}> (edited)</span>
            )}
          </span>
          {mine && !editing && (
            <button
              className="underline underline-offset-2 hover:text-[var(--foreground)]"
              onClick={() => setEditing(true)}
            >
              Edit
            </button>
          )}
        </span>
      </div>

      {!editing ? (
        <>
          {review.rating != null && (
            <div className="mt-1">
              <Stars rating={review.rating} />
            </div>
          )}
          {review.body &&
            (review.isSpoiler && !revealed && !seenIt ? (
              <button
                type="button"
                onClick={() => setRevealed(true)}
                className="mt-2 w-full text-left text-sm rounded-md border px-3 py-2 text-[var(--muted)] hover:bg-[var(--hover)]"
              >
                ⚠ Spoiler. Click to show.
              </button>
            ) : (
              <p className="text-sm mt-2 whitespace-pre-wrap">
                {review.isSpoiler && (
                  <span className="text-xs text-[var(--muted)]">⚠ Spoiler · </span>
                )}
                {review.body}
              </p>
            ))}
          {review.letterboxdUrl && (
            <a
              className="link text-sm mt-2 inline-block"
              href={review.letterboxdUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Read on Letterboxd
            </a>
          )}
        </>
      ) : (
        <form onSubmit={save} className="mt-2">
          <div className="flex gap-1 mb-3 text-sm">
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
              {body.trim() && (
                <label className="flex items-center gap-2 mt-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSpoiler}
                    onChange={(e) => setIsSpoiler(e.target.checked)}
                  />
                  Contains spoilers
                </label>
              )}
            </>
          ) : (
            <input
              className="input"
              placeholder="https://letterboxd.com/you/film/…"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          )}

          <div className="mt-3 flex items-center gap-2">
            <button type="submit" className="btn btn-accent" disabled={busy}>
              {busy ? "Saving…" : "Save"}
            </button>
            <button type="button" className="btn" onClick={reset} disabled={busy}>
              Cancel
            </button>
            {err && <span className="text-sm text-[var(--muted)]">{err}</span>}
          </div>
        </form>
      )}
    </li>
  );
}
