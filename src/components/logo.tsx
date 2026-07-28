// The club mark: a little spin-wheel with a pointer, a nod to the Monday spin.
// Uses currentColor so it can be tinted by the surrounding text color.
export function Logo({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      style={{ display: "block" }}
    >
      {/* pointer */}
      <path d="M12 1.4l2 3.4h-4z" fill="currentColor" />
      {/* rim */}
      <circle cx="12" cy="13.4" r="8.4" stroke="currentColor" strokeWidth="1.6" />
      {/* spokes */}
      <path
        d="M12 5v16.8M3.6 13.4h16.8M6.06 7.46l11.88 11.88M17.94 7.46L6.06 19.34"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.45"
      />
      {/* hub */}
      <circle cx="12" cy="13.4" r="1.7" fill="currentColor" />
    </svg>
  );
}
