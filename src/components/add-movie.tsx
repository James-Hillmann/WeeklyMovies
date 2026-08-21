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
  // A picked search result being confirmed in the popout before it's added.
  const [selected, setSelected] = useState<TmdbResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [needName, setNeedName] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  // Escape backs out of the confirm popout (unless a save is in flight).
  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) backToSearch();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, busy]);

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
      setSelected(null);
      setMsg(`Added “${movie.title}” to the reel.`);
    } else {
      setMsg(result.error);
    }
  }

  function backToSearch() {
    setSelected(null);
    // Let the popout unmount before refocusing the search box.
    requestAnimationFrame(() => inputRef.current?.focus());
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
            ref={inputRef}
            className="input"
            placeholder="Movie title…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => results.length && setOpen(true)}
          />
          <button
            type="submit"
            className="btn btn-accent whitespace-nowrap"
            disabled={busy || !query.trim()}
          >
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
                  onClick={() => {
                    setSelected(r);
                    setOpen(false);
                    setMsg(null);
                  }}
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
                        {[
                          r.year ? String(r.year) : null,
                          r.director ? `dir. ${r.director}` : null,
                        ]
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

      {/* Confirm popout: check it's the right film before it joins the reel. */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-5"
          style={{ background: "rgba(31,29,26,0.35)" }}
          onClick={() => !busy && backToSearch()}
        >
          <div
            className="card w-full max-w-md p-5"
            role="dialog"
            aria-modal="true"
            aria-label={`Add ${selected.title} to the reel?`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {selected.posterUrl ? (
                <img
                  src={selected.posterUrl}
                  alt={`${selected.title} poster`}
                  width={104}
                  height={156}
                  className="rounded-md border object-cover shrink-0"
                  style={{ width: 104, height: 156 }}
                />
              ) : (
                <div
                  className="rounded-md border shrink-0 flex items-center justify-center text-center p-2"
                  style={{
                    width: 104,
                    height: 156,
                    background: "var(--poster-fallback)",
                    color: "var(--muted)",
                    fontSize: 12,
                    lineHeight: 1.25,
                  }}
                >
                  {selected.title}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h2 className="text-xl leading-tight">{selected.title}</h2>
                {(selected.year || selected.director) && (
                  <div className="text-sm text-[var(--muted)] mt-1">
                    {[
                      selected.year ? String(selected.year) : null,
                      selected.director ? `dir. ${selected.director}` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                )}
                {selected.cast.length > 0 && (
                  <div className="text-sm text-[var(--muted)] mt-0.5">
                    Starring {selected.cast.join(", ")}
                  </div>
                )}
                {selected.overview && (
                  <p className="text-sm mt-2 line-clamp-4">{selected.overview}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button className="btn" onClick={backToSearch} disabled={busy}>
                Back to search
              </button>
              <button
                className="btn btn-accent"
                onClick={() => submit(selected)}
                disabled={busy}
              >
                {busy ? "Adding…" : "Add to the reel"}
              </button>
            </div>
          </div>
        </div>
      )}

      <NameDialog open={needName} onClose={() => setNeedName(false)} />
    </div>
  );
}
