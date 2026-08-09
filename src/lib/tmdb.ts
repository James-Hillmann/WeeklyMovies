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

// The best YouTube trailer for a movie, as a watch URL (or null). Prefers an
// official trailer, then any trailer, then a teaser.
export async function getTrailerUrl(tmdbId: number): Promise<string | null> {
  const key = process.env.TMDB_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch(`${API}/movie/${tmdbId}/videos?api_key=${key}`, {
      next: { revalidate: 60 * 60 * 24 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      results?: Array<{ site: string; type: string; official: boolean; key: string }>;
    };
    const yt = (data.results ?? []).filter((v) => v.site === "YouTube" && v.key);
    const pick =
      yt.find((v) => v.type === "Trailer" && v.official) ??
      yt.find((v) => v.type === "Trailer") ??
      yt.find((v) => v.type === "Teaser");
    return pick ? `https://www.youtube.com/watch?v=${pick.key}` : null;
  } catch {
    return null;
  }
}

// Streaming / rent / buy availability (data via JustWatch, per region).
export type WatchProvider = { name: string; logoUrl: string };
export type WatchInfo = {
  stream: WatchProvider[];
  rent: WatchProvider[];
  buy: WatchProvider[];
  link: string | null; // JustWatch page for this title
};

export function watchRegion(): string {
  return (process.env.TMDB_WATCH_REGION || "US").trim().toUpperCase();
}

export async function getWatchProviders(tmdbId: number): Promise<WatchInfo | null> {
  const key = process.env.TMDB_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch(
      `${API}/movie/${tmdbId}/watch/providers?api_key=${key}`,
      { next: { revalidate: 60 * 60 * 24 } }, // availability changes slowly
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      results?: Record<
        string,
        {
          link?: string;
          flatrate?: Array<{ provider_name: string; logo_path: string; display_priority: number }>;
          rent?: Array<{ provider_name: string; logo_path: string; display_priority: number }>;
          buy?: Array<{ provider_name: string; logo_path: string; display_priority: number }>;
        }
      >;
    };
    const region = data.results?.[watchRegion()];
    if (!region) return null;

    const map = (
      arr?: Array<{ provider_name: string; logo_path: string; display_priority: number }>,
    ): WatchProvider[] =>
      (arr ?? [])
        .slice()
        .sort((a, b) => a.display_priority - b.display_priority)
        .map((p) => ({
          name: p.provider_name,
          logoUrl: `${TMDB_IMG}/w92${p.logo_path}`,
        }));

    const info: WatchInfo = {
      stream: map(region.flatrate),
      rent: map(region.rent),
      buy: map(region.buy),
      link: region.link ?? null,
    };
    if (!info.stream.length && !info.rent.length && !info.buy.length) return null;
    return info;
  } catch {
    return null;
  }
}
