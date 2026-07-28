"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useName } from "./name-provider";
import { checkHost, spinWheel } from "@/app/actions";

type PoolMovie = { id: string; title: string };

// Muted, low-saturation segment colors that sit on the paper background.
const SEG_COLORS = [
  "#cbb9a3",
  "#a9bda3",
  "#cba9a1",
  "#b3aac2",
  "#c6c2a0",
  "#a6bcc4",
  "#d0b6ab",
  "#b6c1a6",
];

const SIZE = 320;
const R = SIZE / 2;
const CENTER = R;

function polar(angleDeg: number, radius: number) {
  // angle measured clockwise from the top (12 o'clock)
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: CENTER + radius * Math.cos(rad), y: CENTER + radius * Math.sin(rad) };
}

function segmentPath(start: number, end: number) {
  const a = polar(start, R - 2);
  const b = polar(end, R - 2);
  const large = end - start > 180 ? 1 : 0;
  return `M ${CENTER} ${CENTER} L ${a.x} ${a.y} A ${R - 2} ${R - 2} 0 ${large} 1 ${b.x} ${b.y} Z`;
}

function short(title: string) {
  return title.length > 20 ? title.slice(0, 19) + "…" : title;
}

export function Wheel({ pool }: { pool: PoolMovie[] }) {
  const { name } = useName();
  const router = useRouter();
  const [canSpin, setCanSpin] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [winner, setWinner] = useState<string | null>(null);
  const rotationRef = useRef(0);

  // Ask the server (honor-system) whether this name may spin.
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

  const n = pool.length;
  const segAngle = n > 0 ? 360 / n : 0;

  async function spin() {
    if (!name || spinning || n === 0) return;
    setSpinning(true);
    setMsg(null);
    setWinner(null);

    const poolIds = pool.map((m) => m.id);
    const result = await spinWheel({ name, poolIds });

    if (!result.ok) {
      setSpinning(false);
      setMsg(result.error);
      return;
    }

    // If the winner isn't in our current list (pool changed under us), just
    // refresh to show the new state.
    if (result.index < 0) {
      router.refresh();
      setSpinning(false);
      setMsg(`This week: ${result.title}`);
      return;
    }

    // Land the winner's segment center under the pointer at the top.
    const center = result.index * segAngle + segAngle / 2;
    const jitter = (Math.random() - 0.5) * Math.max(0, segAngle - 8);
    const turns = 5;
    const current = rotationRef.current;
    // Smallest non-negative target congruent to (-center) that adds >= turns.
    const base = 360 * turns + (((-center - (current % 360)) % 360) + 360) % 360;
    const next = current + base - jitter;
    rotationRef.current = next;
    setRotation(next);

    // Reveal after the CSS transition finishes.
    window.setTimeout(() => {
      setSpinning(false);
      setWinner(result.title);
      router.refresh();
    }, 4200);
  }

  if (n === 0) {
    return (
      <div className="card p-6 text-center">
        <p className="text-[var(--muted)]">
          Nothing on the wheel yet — add some movies below.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        {/* pointer */}
        <div
          className="absolute left-1/2 -translate-x-1/2 z-10"
          style={{ top: -2 }}
          aria-hidden
        >
          <div
            style={{
              width: 0,
              height: 0,
              borderLeft: "11px solid transparent",
              borderRight: "11px solid transparent",
              borderTop: "18px solid var(--accent)",
            }}
          />
        </div>

        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: spinning
              ? "transform 4s cubic-bezier(0.15, 0.85, 0.2, 1)"
              : "none",
          }}
        >
          <circle cx={CENTER} cy={CENTER} r={R - 1} fill="#fff" stroke="var(--border)" />
          {pool.map((m, i) => {
            const start = i * segAngle;
            const end = start + segAngle;
            const mid = start + segAngle / 2;
            const labelPos = polar(mid, R * 0.62);
            return (
              <g key={m.id}>
                <path
                  d={segmentPath(start, end)}
                  fill={SEG_COLORS[i % SEG_COLORS.length]}
                  stroke="#fff"
                  strokeWidth="1.5"
                />
                <text
                  x={labelPos.x}
                  y={labelPos.y}
                  fill="#2b2622"
                  fontSize={n > 10 ? 10 : 12}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform={`rotate(${mid}, ${labelPos.x}, ${labelPos.y})`}
                  style={{ pointerEvents: "none" }}
                >
                  {short(m.title)}
                </text>
              </g>
            );
          })}
          <circle cx={CENTER} cy={CENTER} r={16} fill="var(--card)" stroke="var(--border)" />
        </svg>
      </div>

      <div className="mt-5 text-center min-h-[2.5rem]">
        {canSpin ? (
          <button className="btn btn-accent" onClick={spin} disabled={spinning}>
            {spinning ? "Spinning…" : "Spin the wheel"}
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
        {winner && (
          <p className="mt-2">
            This week&apos;s pick: <strong>{winner}</strong>
          </p>
        )}
        {msg && !winner && <p className="mt-2 text-sm text-[var(--muted)]">{msg}</p>}
      </div>
    </div>
  );
}
