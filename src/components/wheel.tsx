"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useName } from "./name-provider";
import { checkHost, spinWheel, commitPick } from "@/app/actions";
import { formatRuntime } from "@/lib/format";

type PoolMovie = { id: string; title: string; posterUrl: string | null };

type WonInfo = {
  title: string;
  year: number | null;
  runtime: number | null;
  posterUrl: string | null;
  addedBy: string;
};

// The Design 3 ("hype") Discord message the roller copies into the channel.
// Bare URLs so Discord shows the poster inline; `-#` renders as small subtext.
function discordMessage(won: WonInfo): string {
  const titlePart = won.year ? `**${won.title}** (${won.year})` : `**${won.title}**`;
  const meta = [formatRuntime(won.runtime), `requested by ${won.addedBy}`]
    .filter(Boolean)
    .join(" · ");
  const lines = [
    "**THE REEL HAS SPOKEN**",
    `This week we're watching ${titlePart}`,
    `-# ${meta}`,
    "Watch by Sunday, then rate it on the site.",
  ];
  if (won.posterUrl) lines.push(won.posterUrl);
  return lines.join("\n");
}

const CARD_W = 116;
const CARD_H = 174;
const GAP = 12;
const ITEM = CARD_W + GAP;
const SPIN_MS = 4500;

// How many times to repeat the strip so there's a long, satisfying scroll.
const loopsFor = (n: number) => Math.max(3, Math.ceil(28 / Math.max(1, n)));

export function Wheel({ pool }: { pool: PoolMovie[] }) {
  const { name } = useName();
  const router = useRouter();
  const [canSpin, setCanSpin] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [translate, setTranslate] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [won, setWon] = useState<WonInfo | null>(null);
  const [copied, setCopied] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  // While spinning/landed we render a frozen snapshot so a background refresh
  // (which removes the winner from the pool) can't snap the reel away.
  const [spinPool, setSpinPool] = useState<PoolMovie[] | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  const active = spinPool ?? pool;
  const n = active.length;
  const reps = loopsFor(n) + 1;

  useEffect(() => {
    let alive = true;
    if (!name) {
      setCanSpin(false);
      return;
    }
    checkHost(name).then((ok) => alive && setCanSpin(ok));
    return () => {
      alive = false;
    };
  }, [name]);

  async function spin() {
    if (!name || spinning || pool.length === 0) return;

    const snapshot = pool; // freeze the current pool for the whole animation
    setSpinPool(snapshot);
    setSpinning(true);
    setMsg(null);
    setWon(null);
    setCopied(false);
    setShowRaw(false);

    const poolIds = snapshot.map((m) => m.id);
    const result = await spinWheel({ name, poolIds });

    if (!result.ok) {
      setSpinning(false);
      setSpinPool(null);
      setMsg(result.error);
      return;
    }

    const winnerInfo: WonInfo = {
      title: result.title,
      year: result.year,
      runtime: result.runtime,
      posterUrl: result.posterUrl,
      addedBy: result.addedBy,
    };

    if (result.index < 0) {
      // Client was out of date; just commit + reveal + refresh (no animation).
      await commitPick({ name, movieId: result.movieId });
      setSpinning(false);
      setSpinPool(null);
      setWon(winnerInfo);
      router.refresh();
      return;
    }

    const vw = viewportRef.current?.offsetWidth ?? 640;
    const nn = snapshot.length;
    const loops = loopsFor(nn);
    const center = vw / 2 - CARD_W / 2;
    const winnerIndex = result.index;

    // Center the winner in the first strip, then scroll `loops` strips further
    // so it glides past and lands on the identical poster.
    const startX = center - winnerIndex * ITEM;
    const targetX = center - (loops * nn + winnerIndex) * ITEM;

    setAnimating(false);
    setTranslate(startX);
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        setAnimating(true);
        setTranslate(targetX);
      }),
    );

    // Commit + reveal only once the reel has landed. Committing here (not
    // before) is what keeps the "This week's pick" hero from spoiling early.
    // We keep the frozen snapshot so the reel stays parked on the winner.
    window.setTimeout(async () => {
      await commitPick({ name, movieId: result.movieId });
      setSpinning(false);
      setWon(winnerInfo);
      router.refresh();
    }, SPIN_MS + 150);
  }

  async function copyMessage() {
    if (!won) return;
    const text = discordMessage(won);
    let ok = false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        ok = true;
      }
    } catch {
      ok = false;
    }
    if (!ok) {
      // Fallback for browsers/contexts where the async clipboard is blocked.
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        ok = document.execCommand("copy");
        document.body.removeChild(ta);
      } catch {
        ok = false;
      }
    }
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } else {
      // Last resort: show the text so it can be selected and copied by hand.
      setShowRaw(true);
    }
  }

  if (n === 0) {
    return (
      <div className="card p-6 text-center">
        <p className="text-[var(--muted)]">
          Nothing on the reel yet. Add some movies below.
        </p>
      </div>
    );
  }

  const cards = [];
  for (let r = 0; r < reps; r++) {
    for (let i = 0; i < n; i++) {
      const m = active[i];
      cards.push(
        <div
          key={`${r}-${m.id}`}
          className="shrink-0 rounded-md overflow-hidden border"
          style={{ width: CARD_W, height: CARD_H }}
        >
          {m.posterUrl ? (
            // Plain <img>, eager-loaded, so every frame is painted before the
            // scroll reaches it (next/image lazy-loads and flashed white).
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={m.posterUrl}
              alt=""
              width={CARD_W}
              height={CARD_H}
              draggable={false}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-center p-1"
              style={{
                background: "var(--poster-fallback)",
                color: "var(--muted)",
                fontSize: 12,
                lineHeight: 1.2,
              }}
            >
              {m.title}
            </div>
          )}
        </div>,
      );
    }
  }

  return (
    <div className="flex flex-col items-center">
      <div
        ref={viewportRef}
        className="relative w-full overflow-hidden rounded-lg border"
        style={{ height: CARD_H + 24, background: "var(--card)" }}
      >
        <div
          className="flex items-center absolute top-0"
          style={{
            height: CARD_H + 24,
            gap: GAP,
            transform: `translateX(${translate}px)`,
            transition: animating
              ? `transform ${SPIN_MS}ms cubic-bezier(0.12, 0.75, 0.08, 1)`
              : "none",
            willChange: "transform",
          }}
        >
          {cards}
        </div>

        {/* edge fades */}
        <div
          className="pointer-events-none absolute inset-y-0 left-0"
          style={{ width: 56, background: "linear-gradient(to right, var(--card), transparent)" }}
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0"
          style={{ width: 56, background: "linear-gradient(to left, var(--card), transparent)" }}
        />

        {/* center slot marker */}
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-md"
          style={{ width: CARD_W + 8, height: CARD_H + 8, border: "2px solid var(--accent)" }}
        />
        <div
          className="pointer-events-none absolute left-1/2 -translate-x-1/2"
          style={{
            top: 0,
            width: 0,
            height: 0,
            borderLeft: "8px solid transparent",
            borderRight: "8px solid transparent",
            borderTop: "12px solid var(--accent)",
          }}
        />
        <div
          className="pointer-events-none absolute left-1/2 -translate-x-1/2"
          style={{
            bottom: 0,
            width: 0,
            height: 0,
            borderLeft: "8px solid transparent",
            borderRight: "8px solid transparent",
            borderBottom: "12px solid var(--accent)",
          }}
        />
      </div>

      <div className="mt-5 text-center min-h-[2.5rem]">
        {won ? (
          <p className="mb-2">
            This week&apos;s pick: <strong>{won.title}</strong>
          </p>
        ) : null}
        <div className="flex items-center justify-center gap-2">
          {canSpin ? (
            <button className="btn btn-accent" onClick={spin} disabled={spinning}>
              {spinning ? "Spinning…" : won ? "Spin again" : "Spin the reel"}
            </button>
          ) : name ? (
            <p className="text-sm text-[var(--muted)]">
              Waiting on a host to spin this week&apos;s pick.
            </p>
          ) : (
            <p className="text-sm text-[var(--muted)]">
              Set your name up top. Hosts get the spin button.
            </p>
          )}
          {won && !spinning && (
            <button className="btn" onClick={copyMessage}>
              {copied ? "Copied!" : "Copy Discord message"}
            </button>
          )}
        </div>
        {won && showRaw && (
          <div className="mt-3 text-left">
            <p className="text-xs text-[var(--muted)] mb-1">
              Couldn&apos;t copy automatically — select all and copy this:
            </p>
            <textarea
              readOnly
              className="input font-mono text-xs"
              rows={5}
              value={discordMessage(won)}
              onFocus={(e) => e.currentTarget.select()}
            />
          </div>
        )}
        {msg && !won && <p className="mt-2 text-sm text-[var(--muted)]">{msg}</p>}
      </div>
    </div>
  );
}
