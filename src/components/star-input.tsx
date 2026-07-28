"use client";

import { useState } from "react";

// Clickable 5-star input with half-star support (stored as 1-10).
export function StarInput({
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
