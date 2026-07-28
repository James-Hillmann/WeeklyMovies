// Renders a 1-10 rating as five stars (each star = 2 points, halves allowed).
// Pure/presentational — safe in server or client components.
export function Stars({ rating, size = 16 }: { rating: number; size?: number }) {
  const clamped = Math.max(0, Math.min(10, rating));
  const outOfFive = clamped / 2; // 0..5

  return (
    <span
      className="inline-flex items-center align-middle"
      aria-label={`${clamped} out of 10`}
      title={`${clamped}/10`}
    >
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.max(0, Math.min(1, outOfFive - i)); // 0..1 for this star
        return <Star key={i} fill={fill} size={size} />;
      })}
    </span>
  );
}

function Star({ fill, size }: { fill: number; size: number }) {
  const gradId = `star-${Math.round(fill * 100)}-${size}`;
  const path =
    "M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.9 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9L12 2.5z";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{ display: "block" }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId}>
          <stop offset={`${fill * 100}%`} stopColor="var(--accent)" />
          <stop offset={`${fill * 100}%`} stopColor="transparent" />
        </linearGradient>
      </defs>
      <path
        d={path}
        fill={`url(#${gradId})`}
        stroke="var(--accent)"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
