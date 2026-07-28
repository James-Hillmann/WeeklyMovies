import { db, isDbConfigured } from "@/db";
import { movies, reviews, weeks, type Movie, type Review, type Week } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

// --- Reads used by server components. All return empty/null when the DB
// isn't configured yet, so pages can render a setup notice instead of erroring.

export async function getCurrentMovie(): Promise<Movie | null> {
  if (!isDbConfigured) return null;
  const rows = await db
    .select()
    .from(movies)
    .where(eq(movies.status, "current"))
    .limit(1);
  return rows[0] ?? null;
}

export async function getPool(): Promise<Movie[]> {
  if (!isDbConfigured) return [];
  return db
    .select()
    .from(movies)
    .where(eq(movies.status, "pool"))
    .orderBy(desc(movies.createdAt));
}

export async function getMovie(id: string): Promise<Movie | null> {
  if (!isDbConfigured) return null;
  const rows = await db.select().from(movies).where(eq(movies.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getReviews(movieId: string): Promise<Review[]> {
  if (!isDbConfigured) return [];
  return db
    .select()
    .from(reviews)
    .where(eq(reviews.movieId, movieId))
    .orderBy(desc(reviews.createdAt));
}

export type HistoryEntry = {
  week: Week;
  movie: Movie;
  reviews: Review[];
};

// Past picks, newest first, each with its movie and any reviews.
export async function getHistory(): Promise<HistoryEntry[]> {
  if (!isDbConfigured) return [];

  const rows = await db
    .select({ week: weeks, movie: movies })
    .from(weeks)
    .innerJoin(movies, eq(weeks.movieId, movies.id))
    .orderBy(desc(weeks.spunAt));

  const entries: HistoryEntry[] = [];
  for (const row of rows) {
    const rv = await db
      .select()
      .from(reviews)
      .where(eq(reviews.movieId, row.movie.id))
      .orderBy(desc(reviews.createdAt));
    entries.push({ week: row.week, movie: row.movie, reviews: rv });
  }
  return entries;
}

export async function getReviewsForMovie(movieId: string): Promise<Review[]> {
  return getReviews(movieId);
}
