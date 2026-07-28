"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useName } from "./name-provider";
import { checkHost, spinWheel, commitPick } from "@/app/actions";

type PoolMovie = { id: string; title: string; posterUrl: string | null };

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
  const [winner, setWinner] = useState<string | null>(null);
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
    setWinner(null);

    const poolIds = snapshot.map((m) => m.id);
    const result = await spinWheel({ name, poolIds });

    if (!result.ok) {
      setSpinning(false);
      setSpinPool(null);
      setMsg(result.error);
      return;
    }
    if (result.index < 0) {
      // Client was out of date; just reveal + refresh.
      setSpinning(false);
      setSpinPool(null);
      router.refresh();
      setMsg(`This week's pick: ${result.title}`);
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
      setWinner(result.title);
      router.refresh();
    }, SPIN_MS + 150);
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
        {winner ? (
          <p className="mb-2">
            This week&apos;s pick: <strong>{winner}</strong>
          </p>
        ) : null}
        {canSpin ? (
          <button className="btn btn-accent" onClick={spin} disabled={spinning}>
            {spinning ? "Spinning…" : winner ? "Spin again" : "Spin the reel"}
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
        {msg && !winner && <p className="mt-2 text-sm text-[var(--muted)]">{msg}</p>}
      </div>
    </div>
  );
}
