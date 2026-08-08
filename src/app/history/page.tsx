import Link from "next/link";
import { getHistory } from "@/lib/queries";
import { isDbConfigured } from "@/db";
import { avatarForName } from "@/lib/discord";
import { Poster } from "@/components/poster";
import { Stars } from "@/components/stars";
import { Avatar } from "@/components/avatar";
import { SetupNotice } from "@/components/setup-notice";
import { formatWeekOf } from "@/lib/format";

export const dynamic = "force-dynamic";

function shortDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default async function HistoryPage() {
  if (!isDbConfigured) return <SetupNotice />;

  const history = await getHistory();

  // Resolve each reviewer's Discord photo once.
  const names = [
    ...new Set(history.flatMap((h) => h.reviews.map((r) => r.author))),
  ];
  const avatars = new Map(
    await Promise.all(
      names.map(
        async (n) => [n.trim().toLowerCase(), await avatarForName(n)] as const,
      ),
    ),
  );
  const avatarOf = (name: string) => avatars.get(name.trim().toLowerCase()) ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl">History</h1>
        <p className="text-sm text-[var(--muted)] mt-1">
          Every movie we&apos;ve spun, newest first.
        </p>
      </div>

      {history.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">
          Nothing here yet. Spin the reel to start the record.
        </p>
      ) : (
        <ul className="space-y-5">
          {history.map(({ week, movie, reviews }) => {
            const rated = reviews.filter((r) => r.rating != null);
            const avg =
              rated.length > 0
                ? rated.reduce((s, r) => s + (r.rating ?? 0), 0) / rated.length
                : null;
            const shown = reviews.slice(0, 6);
            return (
              <li key={week.id} className="card p-4">
                {/* header */}
                <div className="flex gap-4">
                  <Link href={`/movie/${movie.id}`} className="shrink-0">
                    <Poster src={movie.posterUrl} title={movie.title} width={72} height={108} />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-[var(--muted)]">
                      Week of {formatWeekOf(week.weekOf)} · picked by {week.spunBy}
                    </div>
                    <Link
                      href={`/movie/${movie.id}`}
                      className="text-lg hover:underline underline-offset-2"
                      style={{ fontFamily: "var(--font-serif)" }}
                    >
                      {movie.title}
                      {movie.year ? ` (${movie.year})` : ""}
                    </Link>
                    {avg != null ? (
                      <div className="flex items-center gap-2 mt-1">
                        <Stars rating={avg} size={15} />
                        <span className="text-sm text-[var(--muted)]">
                          {avg.toFixed(1)}/10 · {rated.length}{" "}
                          {rated.length === 1 ? "rating" : "ratings"}
                        </span>
                      </div>
                    ) : (
                      <div className="text-sm text-[var(--muted)] mt-1">No ratings yet</div>
                    )}
                  </div>
                </div>

                {/* reviews */}
                {reviews.length === 0 ? (
                  <p className="text-sm text-[var(--muted)] mt-3 border-t pt-3">
                    No reviews yet.
                  </p>
                ) : (
                  <ul className="mt-3 border-t divide-y">
                    {shown.map((r) => (
                      <li key={r.id} className="flex gap-3 py-3">
                        <Avatar name={r.author} url={avatarOf(r.author)} size={30} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm">{r.author}</span>
                            {r.rating != null && <Stars rating={r.rating} size={13} />}
                            <span className="text-xs text-[var(--muted)] ml-auto">
                              {shortDate(r.createdAt)}
                              {r.editedAt ? " (edited)" : ""}
                            </span>
                          </div>
                          {r.body && (
                            <p className="text-sm mt-1 whitespace-pre-wrap">{r.body}</p>
                          )}
                          {r.letterboxdUrl && (
                            <a
                              className="link text-sm mt-1 inline-block"
                              href={r.letterboxdUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Letterboxd review
                            </a>
                          )}
                        </div>
                      </li>
                    ))}
                    {reviews.length > shown.length && (
                      <li className="py-3">
                        <Link href={`/movie/${movie.id}`} className="link text-sm">
                          + {reviews.length - shown.length} more{" "}
                          {reviews.length - shown.length === 1 ? "review" : "reviews"}
                        </Link>
                      </li>
                    )}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
