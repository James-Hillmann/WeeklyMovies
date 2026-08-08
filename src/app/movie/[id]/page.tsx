import Link from "next/link";
import { notFound } from "next/navigation";
import { getMovie, getReviews } from "@/lib/queries";
import { isDbConfigured } from "@/db";
import { avatarForName } from "@/lib/discord";
import { Poster } from "@/components/poster";
import { Avatar } from "@/components/avatar";
import { WatchProviders } from "@/components/watch-providers";
import { getWatchProviders, watchRegion } from "@/lib/tmdb";
import { ReviewForm } from "@/components/review-form";
import { ReviewList, type ReviewView } from "@/components/review-list";
import { SetupNotice } from "@/components/setup-notice";
import { formatRuntime } from "@/lib/format";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  pool: "On the reel",
  current: "This week's pick",
  watched: "Watched",
};

export default async function MoviePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!isDbConfigured) return <SetupNotice />;

  const { id } = await params;
  const movie = await getMovie(id);
  if (!movie) notFound();

  const watch = movie.tmdbId ? await getWatchProviders(movie.tmdbId) : null;
  const reviews = await getReviews(id);
  // Resolve the requester's + each reviewer's Discord photo once.
  const names = [...new Set([movie.addedBy, ...reviews.map((r) => r.author)])];
  const avatars = new Map(
    await Promise.all(
      names.map(
        async (n) => [n.trim().toLowerCase(), await avatarForName(n)] as const,
      ),
    ),
  );
  const reviewViews: ReviewView[] = reviews.map((r) => ({
    id: r.id,
    author: r.author,
    avatarUrl: avatars.get(r.author.trim().toLowerCase()) ?? null,
    rating: r.rating,
    body: r.body,
    letterboxdUrl: r.letterboxdUrl,
    createdAt: new Date(r.createdAt).toISOString(),
    editedAt: r.editedAt ? new Date(r.editedAt).toISOString() : null,
  }));

  return (
    <div className="space-y-8">
      <Link href="/" className="text-sm link">
        ← Back
      </Link>

      <div className="card p-5">
        <div className="flex gap-5">
          <Poster src={movie.posterUrl} title={movie.title} width={120} height={180} />
          <div className="min-w-0 flex-1">
            <span className="text-xs border rounded-full px-2 py-0.5 text-[var(--muted)]">
              {STATUS_LABEL[movie.status] ?? movie.status}
            </span>
            <h1 className="text-2xl mt-2 leading-tight">{movie.title}</h1>
            <div className="text-sm text-[var(--muted)] mt-1">
              {[movie.year, formatRuntime(movie.runtime)].filter(Boolean).join(" · ")}
            </div>
            <div className="flex items-center gap-2 mt-3">
              <Avatar
                name={movie.addedBy}
                url={avatars.get(movie.addedBy.trim().toLowerCase()) ?? null}
                size={24}
              />
              <span className="text-sm">
                <span className="text-[var(--muted)]">Requested by </span>
                {movie.addedBy}
              </span>
            </div>

            {movie.overview && (
              <p className="text-sm mt-3">{movie.overview}</p>
            )}
          </div>
        </div>
      </div>

      {watch && watch.stream.length > 0 && (
        <section>
          <h2 className="text-lg mb-3">
            Streaming{" "}
            <span className="text-sm font-normal text-[var(--muted)]">
              ({watchRegion()})
            </span>
          </h2>
          <div className="card p-4">
            <WatchProviders info={watch} />
          </div>
        </section>
      )}

      <section>
        <h2 className="text-lg mb-3">
          Reviews{" "}
          <span className="text-sm font-normal text-[var(--muted)]">
            ({reviews.length})
          </span>
        </h2>

        <ReviewList reviews={reviewViews} />

        <ReviewForm movieId={movie.id} />
      </section>
    </div>
  );
}
