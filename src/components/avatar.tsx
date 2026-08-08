// A person's Discord photo, or a monogram fallback. Presentational (no hooks),
// so it works in server components.
export function Avatar({
  name,
  url,
  size = 28,
}: {
  name: string;
  url?: string | null;
  size?: number;
}) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        width={size}
        height={size}
        className="rounded-full shrink-0 object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      aria-hidden
      className="inline-flex items-center justify-center rounded-full shrink-0"
      style={{
        width: size,
        height: size,
        background: "var(--accent)",
        color: "var(--accent-ink)",
        fontSize: Math.max(10, Math.round(size * 0.42)),
        fontWeight: 600,
        lineHeight: 1,
      }}
    >
      {name.trim().charAt(0).toUpperCase()}
    </span>
  );
}
