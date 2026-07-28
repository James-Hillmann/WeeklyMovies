import Link from "next/link";
import { notFound } from "next/navigation";
import { getMovie, getReviews } from "@/lib/queries";
import { isDbConfigured } from "@/db";
import { Poster } from "@/components/poster";
import { Stars } from "@/components/stars";
import { ReviewForm } from "@/components/review-form";
import { SetupNotice } from "@/components/setup-notice";
import { formatRuntime } from "@/lib/format";
import type { Review } from "@/db/schema";

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
          <div className="text-sm text-[var(--muted)] mt-2">added by {movie.addedBy}</div>
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
        {reviews.length === 0 ? (
          <p className="text-sm text-[var(--muted)] mb-5">
            No reviews yet. Be the first once you&apos;ve watched it.
          </p>
        ) : (
          <ul className="space-y-4 mb-6">
            {reviews.map((r) => (
              <ReviewItem key={r.id} review={r} />
            ))}
          </ul>
        )}

        <ReviewForm movieId={movie.id} />
      </section>
    </div>
  );
}

function ReviewItem({ review }: { review: Review }) {
  const when = new Date(review.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  return (
    <li className="card p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-sm">{review.author}</span>
        <span className="text-xs text-[var(--muted)]">{when}</span>
      </div>
      {review.rating != null && (
        <div className="mt-1">
          <Stars rating={review.rating} />
        </div>
      )}
      {review.body && <p className="text-sm mt-2 whitespace-pre-wrap">{review.body}</p>}
      {review.letterboxdUrl && (
        <a
          className="link text-sm mt-2 inline-block"
          href={review.letterboxdUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Read on Letterboxd
        </a>
      )}
    </li>
  );
}
