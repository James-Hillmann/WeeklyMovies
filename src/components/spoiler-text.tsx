"use client";

import { useState } from "react";
import { useName } from "./name-provider";

// A comment hidden behind a click-to-reveal bar. Auto-reveals for people who
// have already seen the movie: the review's author, and anyone who has
// reviewed this movie themselves.
export function SpoilerText({
  text,
  author,
  reviewerNames,
}: {
  text: string;
  author: string;
  reviewerNames: string[];
}) {
  const { name } = useName();
  const [clicked, setClicked] = useState(false);

  const me = name?.trim().toLowerCase() ?? "";
  const autoRevealed =
    !!me &&
    (me === author.trim().toLowerCase() ||
      reviewerNames.some((n) => n.trim().toLowerCase() === me));
  const revealed = clicked || autoRevealed;

  if (!revealed) {
    return (
      <button
        type="button"
        onClick={() => setClicked(true)}
        className="mt-1 w-full text-left text-sm rounded-md border px-3 py-2 text-[var(--muted)] hover:bg-[var(--hover)]"
      >
        ⚠ Spoiler. Click to show.
      </button>
    );
  }
  return (
    <p className="text-sm mt-1 whitespace-pre-wrap">
      <span className="text-xs text-[var(--muted)]">⚠ Spoiler · </span>
      {text}
    </p>
  );
}
