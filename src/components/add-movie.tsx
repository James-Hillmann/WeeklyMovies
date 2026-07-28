"use client";

import { useEffect, useRef, useState } from "react";
import { useName } from "./name-provider";
import { NameDialog } from "./name-dialog";
import { addMovie } from "@/app/actions";
import type { TmdbResult } from "@/lib/tmdb";

export function AddMovie() {
  const { name } = useName();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TmdbResult[]>([]);
  const [tmdbOn, setTmdbOn] = useState(true);
  const [open, setOpen] = useState(false); // results dropdown
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [needName, setNeedName] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  // Debounced search against our own TMDB proxy.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/tmdb/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setTmdbOn(Boolean(data.configured));
        setResults(data.results ?? []);
        setOpen(true);
      } catch {
        setResults([]);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  // Close dropdown on outside click.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function submit(movie: {
    title: string;
    tmdbId?: number | null;
    year?: number | null;
    posterUrl?: string | null;
    overview?: string | null;
  }) {
    if (!name) {
      setNeedName(true);
      return;
    }
    setBusy(true);
    setMsg(null);
    const result = await addMovie({ name, ...movie });
    setBusy(false);
    if (result.ok) {
      setQuery("");
      setResults([]);
      setOpen(false);
      setMsg(`Added “${movie.title}” to the reel.`);
    } else {
      setMsg(result.error);
    }
  }

  return (
    <div className="card p-4">
      <h2 className="text-lg mb-1">Add a movie</h2>
      <p className="text-sm text-[var(--muted)] mb-3">
        {tmdbOn
          ? "Search for a film, or just type a title and hit Add."
          : "Type a movie title and hit Add."}
      </p>

      <div ref={boxRef} className="relative">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (query.trim()) submit({ title: query.trim() });
          }}
          className="flex gap-2"
        >
          <input
            className="input"
            placeholder="Movie title…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => results.length && setOpen(true)}
          />
          <button type="submit" className="btn btn-accent whitespace-nowrap" disabled={busy || !query.trim()}>
            Add
          </button>
        </form>

        {open && results.length > 0 && (
          <ul className="absolute z-20 mt-1 w-full card overflow-hidden p-0">
            {results.map((r) => (
              <li key={r.tmdbId}>
                <button
                  type="button"
                  className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-[var(--hover)]"
                  onClick={() => submit(r)}
                  disabled={busy}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {r.posterUrl ? (
                    <img
                      src={r.posterUrl}
                      alt=""
                      width={34}
                      height={51}
                      className="rounded object-cover"
                      style={{ width: 34, height: 51 }}
                    />
                  ) : (
                    <span
                      className="rounded"
                      style={{
                        width: 34,
                        height: 51,
                        background: "var(--poster-fallback)",
                        display: "inline-block",
                      }}
                    />
                  )}
                  <span className="min-w-0">
                    <span className="block truncate">{r.title}</span>
                    {(r.year || r.director) && (
                      <span className="block text-xs text-[var(--muted)] truncate">
                        {[r.year ? String(r.year) : null, r.director ? `dir. ${r.director}` : null]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {msg && <p className="mt-3 text-sm text-[var(--muted)]">{msg}</p>}

      <NameDialog open={needName} onClose={() => setNeedName(false)} />
    </div>
  );
}
