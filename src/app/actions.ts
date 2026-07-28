"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db, isDbConfigured } from "@/db";
import { movies, reviews, weeks } from "@/db/schema";
import { getRuntime } from "@/lib/tmdb";
import { isHost } from "@/lib/hosts";

function requireDb() {
  if (!isDbConfigured) {
    throw new Error(
      "The database isn't set up yet. Add DATABASE_URL and run the migration (see README).",
    );
  }
}

function cleanName(name: unknown): string {
  return typeof name === "string" ? name.trim().slice(0, 40) : "";
}

// The Monday (local date) that "this week" belongs to, as YYYY-MM-DD.
function mondayOf(d: Date): string {
  const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = copy.getDay(); // 0 Sun ... 6 Sat
  const diff = (day + 6) % 7; // days since Monday
  copy.setDate(copy.getDate() - diff);
  const y = copy.getFullYear();
  const m = String(copy.getMonth() + 1).padStart(2, "0");
  const dd = String(copy.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

export type ActionResult = { ok: true } | { ok: false; error: string };

// Lets the client decide whether to show the Spin button without shipping the
// host list to every browser. The spin action re-checks server-side anyway.
export async function checkHost(name: string): Promise<boolean> {
  return isHost(cleanName(name));
}

// --- Add a movie to the pool -------------------------------------------------
export async function addMovie(input: {
  name: string;
  title: string;
  tmdbId?: number | null;
  year?: number | null;
  posterUrl?: string | null;
  overview?: string | null;
}): Promise<ActionResult> {
  requireDb();
  const addedBy = cleanName(input.name);
  const title = input.title?.trim();
  if (!addedBy) return { ok: false, error: "Set your name first." };
  if (!title) return { ok: false, error: "Give the movie a title." };

  // If we have a TMDB id, grab the runtime too (one extra lookup).
  let runtime: number | null = null;
  if (input.tmdbId) {
    runtime = await getRuntime(input.tmdbId);
  }

  await db.insert(movies).values({
    title: title.slice(0, 200),
    tmdbId: input.tmdbId ?? null,
    year: input.year ?? null,
    posterUrl: input.posterUrl ?? null,
    overview: input.overview ?? null,
    runtime,
    addedBy,
    status: "pool",
  });

  revalidatePath("/");
  return { ok: true };
}

// --- Spin the wheel (host only) ---------------------------------------------
export type SpinResult =
  | { ok: true; movieId: string; title: string; index: number }
  | { ok: false; error: string };

export async function spinWheel(input: {
  name: string;
  poolIds: string[]; // ids in the order the client is showing them
}): Promise<SpinResult> {
  requireDb();
  const name = cleanName(input.name);
  if (!isHost(name)) {
    return { ok: false, error: "Only a host can spin the wheel." };
  }

  const pool = await db.select().from(movies).where(eq(movies.status, "pool"));
  if (pool.length === 0) {
    return { ok: false, error: "Nothing on the wheel yet — add some movies." };
  }

  const poolIdSet = new Set(pool.map((m) => m.id));
  // Prefer the exact list the client is showing so the animation lands right.
  const displayed = input.poolIds.filter((id) => poolIdSet.has(id));
  const candidates = displayed.length > 0 ? displayed : pool.map((m) => m.id);

  const winnerId = candidates[Math.floor(Math.random() * candidates.length)];
  const winner = pool.find((m) => m.id === winnerId)!;
  const index = input.poolIds.indexOf(winnerId); // -1 if client is out of date

  // Retire the previous pick, promote the winner, record the week.
  // (neon-http has no interactive transactions; these run sequentially, which
  // is fine for a low-traffic club app.)
  await db.update(movies).set({ status: "watched" }).where(eq(movies.status, "current"));
  await db.update(movies).set({ status: "current" }).where(eq(movies.id, winnerId));
  await db.insert(weeks).values({
    movieId: winnerId,
    weekOf: mondayOf(new Date()),
    spunBy: name,
  });

  revalidatePath("/");
  revalidatePath("/history");
  return { ok: true, movieId: winnerId, title: winner.title, index };
}

// --- Add a review ------------------------------------------------------------
export async function addReview(input: {
  movieId: string;
  name: string;
  rating?: number | null; // 1-10, or null
  body?: string | null;
  letterboxdUrl?: string | null;
}): Promise<ActionResult> {
  requireDb();
  const author = cleanName(input.name);
  if (!author) return { ok: false, error: "Set your name first." };

  const rating =
    typeof input.rating === "number" && input.rating >= 1 && input.rating <= 10
      ? Math.round(input.rating)
      : null;
  const body = input.body?.trim() || null;
  const url = input.letterboxdUrl?.trim() || null;

  if (rating === null && !body && !url) {
    return { ok: false, error: "Add a rating, some words, or a Letterboxd link." };
  }
  if (url && !/^https?:\/\/(www\.)?(letterboxd\.com|boxd\.it)\//i.test(url)) {
    return { ok: false, error: "That doesn't look like a Letterboxd link." };
  }

  await db.insert(reviews).values({
    movieId: input.movieId,
    author,
    rating,
    body: body?.slice(0, 4000) ?? null,
    letterboxdUrl: url,
  });

  revalidatePath(`/movie/${input.movieId}`);
  revalidatePath("/history");
  return { ok: true };
}

// --- Housekeeping (host only) ------------------------------------------------
export async function markWatched(input: {
  name: string;
  movieId: string;
}): Promise<ActionResult> {
  requireDb();
  if (!isHost(cleanName(input.name))) {
    return { ok: false, error: "Only a host can do that." };
  }
  await db.update(movies).set({ status: "watched" }).where(eq(movies.id, input.movieId));
  revalidatePath("/");
  revalidatePath(`/movie/${input.movieId}`);
  return { ok: true };
}

export async function removeMovie(input: {
  name: string;
  movieId: string;
}): Promise<ActionResult> {
  requireDb();
  if (!isHost(cleanName(input.name))) {
    return { ok: false, error: "Only a host can remove movies." };
  }
  // Only allow removing pool movies (keep history intact).
  await db
    .delete(movies)
    .where(and(eq(movies.id, input.movieId), eq(movies.status, "pool")));
  revalidatePath("/");
  return { ok: true };
}
