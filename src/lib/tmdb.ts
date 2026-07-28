// Small server-side TMDB wrapper. The API key stays on the server; the client
// only ever talks to our own /api/tmdb/search route.

const API = "https://api.themoviedb.org/3";
export const TMDB_IMG = "https://image.tmdb.org/t/p";

export function posterUrl(path: string | null, size: "w185" | "w342" | "w500" = "w342") {
  return path ? `${TMDB_IMG}/${size}${path}` : null;
}

export type TmdbResult = {
  tmdbId: number;
  title: string;
  year: number | null;
  posterUrl: string | null;
  overview: string | null;
  director: string | null;
};

export function tmdbConfigured(): boolean {
  return Boolean(process.env.TMDB_API_KEY);
}

function yearFromDate(date: string | null | undefined): number | null {
  if (!date) return null;
  const y = Number(date.slice(0, 4));
  return Number.isFinite(y) && y > 0 ? y : null;
}

export async function searchMovies(query: string): Promise<TmdbResult[]> {
  const key = process.env.TMDB_API_KEY;
  if (!key || !query.trim()) return [];

  const url = `${API}/search/movie?query=${encodeURIComponent(
    query,
  )}&include_adult=false&language=en-US&page=1&api_key=${key}`;

  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) return [];

  const data = (await res.json()) as {
    results?: Array<{
      id: number;
      title: string;
      release_date?: string;
      poster_path: string | null;
      overview?: string;
    }>;
  };

  const base = (data.results ?? []).slice(0, 8).map((m) => ({
    tmdbId: m.id,
    title: m.title,
    year: yearFromDate(m.release_date),
    posterUrl: posterUrl(m.poster_path, "w342"),
    overview: m.overview?.trim() || null,
  }));

  // Director isn't in search results, so look it up per result (in parallel)
  // to help tell same-title films and remakes apart.
  return Promise.all(
    base.map(async (m) => ({ ...m, director: await getDirector(m.tmdbId) })),
  );
}

export async function getDirector(tmdbId: number): Promise<string | null> {
  const key = process.env.TMDB_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch(`${API}/movie/${tmdbId}/credits?api_key=${key}`, {
      next: { revalidate: 0 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      crew?: Array<{ job: string; name: string }>;
    };
    const director = data.crew?.find((c) => c.job === "Director");
    return director?.name ?? null;
  } catch {
    return null;
  }
}

// Runtime isn't in search results, so we fetch it once when a movie is added.
export async function getRuntime(tmdbId: number): Promise<number | null> {
  const key = process.env.TMDB_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch(`${API}/movie/${tmdbId}?language=en-US&api_key=${key}`, {
      next: { revalidate: 0 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { runtime?: number | null };
    return data.runtime && data.runtime > 0 ? data.runtime : null;
  } catch {
    return null;
  }
}
