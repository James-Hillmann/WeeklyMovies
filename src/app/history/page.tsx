import Link from "next/link";
import { getHistory } from "@/lib/queries";
import { isDbConfigured } from "@/db";
import { Poster } from "@/components/poster";
import { Stars } from "@/components/stars";
import { SetupNotice } from "@/components/setup-notice";
import { formatWeekOf } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  if (!isDbConfigured) return <SetupNotice />;

  const history = await getHistory();

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
          Nothing here yet. Spin the wheel to start the record.
        </p>
      ) : (
        <ul className="space-y-4">
          {history.map(({ week, movie, reviews }) => {
            const rated = reviews.filter((r) => r.rating != null);
            const avg =
              rated.length > 0
                ? rated.reduce((s, r) => s + (r.rating ?? 0), 0) / rated.length
                : null;
            return (
              <li key={week.id} className="card p-4 flex gap-4">
                <Link href={`/movie/${movie.id}`} className="shrink-0">
                  <Poster src={movie.posterUrl} title={movie.title} width={80} height={120} />
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

                  {avg != null && (
                    <div className="flex items-center gap-2 mt-1">
                      <Stars rating={avg} />
                      <span className="text-sm text-[var(--muted)]">
                        {avg.toFixed(1)}/10 · {rated.length}{" "}
                        {rated.length === 1 ? "rating" : "ratings"}
                      </span>
                    </div>
                  )}

                  {reviews.length === 0 ? (
                    <p className="text-sm text-[var(--muted)] mt-2">No reviews yet.</p>
                  ) : (
                    <ul className="mt-2 space-y-1">
                      {reviews.slice(0, 4).map((r) => (
                        <li key={r.id} className="text-sm">
                          <span className="font-medium">{r.author}</span>
                          {r.body ? (
                            <span className="text-[var(--muted)]">: {r.body}</span>
                          ) : r.letterboxdUrl ? (
                            <a
                              className="link ml-1"
                              href={r.letterboxdUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Letterboxd
                            </a>
                          ) : null}
                        </li>
                      ))}
                      {reviews.length > 4 && (
                        <li className="text-sm">
                          <Link href={`/movie/${movie.id}`} className="link">
                            + {reviews.length - 4} more
                          </Link>
                        </li>
                      )}
                    </ul>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
