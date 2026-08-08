import type { WatchInfo, WatchProvider } from "@/lib/tmdb";

// Shows the subscription streaming services a movie is on (data from JustWatch,
// via TMDB). Rent/buy are intentionally omitted. Renders nothing if it isn't
// streaming anywhere. Presentational, so it works in server components.
export function WatchProviders({
  info,
  compact = false,
}: {
  info: WatchInfo;
  compact?: boolean;
}) {
  if (!info.stream.length) return null;

  if (compact) {
    return (
      <div className="flex items-center gap-2 mt-2">
        <span className="text-xs text-[var(--muted)]">Streaming on</span>
        {info.stream.slice(0, 6).map((p) => (
          <Logo key={p.name} p={p} size={24} />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 flex-wrap">
        {info.stream.map((p) => (
          <Logo key={p.name} p={p} size={34} />
        ))}
      </div>
      <p className="text-xs text-[var(--muted)] mt-3">
        Availability from JustWatch
        {info.link && (
          <>
            {" · "}
            <a className="link" href={info.link} target="_blank" rel="noopener noreferrer">
              all options
            </a>
          </>
        )}
      </p>
    </div>
  );
}

function Logo({ p, size }: { p: WatchProvider; size: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={p.logoUrl}
      alt={p.name}
      title={p.name}
      width={size}
      height={size}
      className="rounded-md shrink-0"
      style={{ width: size, height: size }}
    />
  );
}
