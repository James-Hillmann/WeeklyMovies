import Image from "next/image";

// A movie poster with a graceful fallback when there's no image (e.g. a
// free-typed title with no TMDB match). Two modes:
//   - fixed:  pass width & height (used in the hero)
//   - fluid:  pass `fluid` to fill the container at a 2:3 poster ratio (grid)
export function Poster({
  src,
  title,
  width,
  height,
  fluid = false,
  className = "",
}: {
  src: string | null;
  title: string;
  width?: number;
  height?: number;
  fluid?: boolean;
  className?: string;
}) {
  if (fluid) {
    return (
      <div className={`relative w-full ${className}`} style={{ aspectRatio: "2 / 3" }}>
        {src ? (
          <Image
            src={src}
            alt={`${title} poster`}
            fill
            sizes="(max-width: 640px) 45vw, 220px"
            className="object-cover"
          />
        ) : (
          <Fallback title={title} />
        )}
      </div>
    );
  }

  if (src) {
    return (
      <Image
        src={src}
        alt={`${title} poster`}
        width={width}
        height={height}
        className={`object-cover ${className}`}
        style={{ width, height }}
      />
    );
  }
  return (
    <div className={className} style={{ width, height, position: "relative" }}>
      <Fallback title={title} />
    </div>
  );
}

function Fallback({ title }: { title: string }) {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center text-center p-2"
      style={{ background: "#efe9df", color: "var(--muted)", fontSize: 13, lineHeight: 1.25 }}
    >
      <span>{title}</span>
    </div>
  );
}
