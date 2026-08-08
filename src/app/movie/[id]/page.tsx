import Link from "next/link";
import { notFound } from "next/navigation";
import { getMovie, getReviews } from "@/lib/queries";
import { isDbConfigured } from "@/db";
import { avatarForName } from "@/lib/discord";
import { Poster } from "@/components/poster";
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

  const reviews = await getReviews(id);
  // Resolve each reviewer's Discord photo once.
  const names = [...new Set(reviews.map((r) => r.author))];
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

      <div className="card p-4 flex gap-4">
        <Poster src={movie.posterUrl} title={movie.title} width={120} height={180} />
        <div className="min-w-0">
          <h1 className="text-2xl">{movie.title}</h1>
          <div className="text-sm text-[var(--muted)] mt-1">
            {[movie.year, formatRuntime(movie.runtime)].filter(Boolean).join(" · ")}
          </div>
          <div className="mt-2 text-xs inline-block border rounded-full px-2 py-0.5 text-[var(--muted)]">
            {STATUS_LABEL[movie.status] ?? movie.status}
          </div>
          <div className="text-sm text-[var(--muted)] mt-2">
            requested by {movie.addedBy}
          </div>
        </div>
      </div>

      {movie.overview && <p className="text-sm">{movie.overview}</p>}

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
