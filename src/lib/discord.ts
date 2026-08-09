import { formatRuntime } from "./format";

// Discord webhook posting. Plain, no emoji. When a Discord bot token is set we
// also pull each person's profile photo so posts are dressed in their Discord
// identity (names stay their website names).

// Every embed uses the site's accent color so posts read as one consistent brand.
const BRICK = 0x9c3b2e;

// Pick the webhook by which database we're talking to, so a spin on the
// throwaway test DB can never land in the real channel.
function webhookUrl(): string | null {
  const isTest = (process.env.DATABASE_URL ?? "").includes("weeklymovies_test");
  const url = isTest
    ? process.env.DISCORD_WEBHOOK_URL_TEST
    : process.env.DISCORD_WEBHOOK_URL;
  return url && url.trim() ? url.trim() : null;
}

// website name → Discord user id (DISCORD_USER_MAP="nathan:111,maxx:222").
function discordId(name: string): string | null {
  const raw = process.env.DISCORD_USER_MAP ?? "";
  const target = name.trim().toLowerCase();
  for (const entry of raw.split(",")) {
    const i = entry.indexOf(":");
    if (i === -1) continue;
    const n = entry.slice(0, i).trim().toLowerCase();
    const id = entry.slice(i + 1).trim();
    if (n === target && /^\d{5,25}$/.test(id)) return id;
  }
  return null;
}

type Profile = { iconUrl?: string };

// Small in-process cache so we don't refetch a profile on every post.
const profileCache = new Map<string, { at: number; profile: Profile }>();
const PROFILE_TTL = 60 * 60 * 1000; // 1h

// Look up a person's Discord avatar by their website name. Needs
// DISCORD_BOT_TOKEN (the bot doesn't need to be in your server); returns {}
// if there's no token, no mapping, or the lookup fails.
async function profileFor(name: string): Promise<Profile> {
  const id = discordId(name);
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!id || !token) return {};

  const cached = profileCache.get(id);
  if (cached && Date.now() - cached.at < PROFILE_TTL) return cached.profile;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`https://discord.com/api/v10/users/${id}`, {
      headers: { Authorization: `Bot ${token}` },
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return {};
    const u = (await res.json()) as { avatar: string | null };
    const iconUrl = u.avatar
      ? `https://cdn.discordapp.com/avatars/${id}/${u.avatar}.${
          u.avatar.startsWith("a_") ? "gif" : "png"
        }?size=128`
      : undefined;
    const profile: Profile = { iconUrl };
    profileCache.set(id, { at: Date.now(), profile });
    return profile;
  } catch {
    return {};
  }
}

// The Discord avatar URL for a website name, or null. Used by the site UI to
// show profile photos (monogram is the fallback).
export async function avatarForName(name: string): Promise<string | null> {
  return (await profileFor(name)).iconUrl ?? null;
}

async function send(payload: unknown): Promise<void> {
  const url = webhookUrl();
  if (!url) return; // not configured → no-op
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timer);
  } catch {
    // A Discord hiccup should never break a spin or a review.
  }
}

function trim(s: string | null | undefined, n: number): string | undefined {
  const t = s?.trim();
  if (!t) return undefined;
  return t.length > n ? t.slice(0, n - 1).trimEnd() + "…" : t;
}

export async function announcePick(movie: {
  title: string;
  year: number | null;
  runtime: number | null;
  posterUrl: string | null;
  overview: string | null;
  addedBy: string;
}): Promise<void> {
  const profile = await profileFor(movie.addedBy);
  const rt = formatRuntime(movie.runtime);

  await send({
    embeds: [
      {
        author: {
          name: `${movie.addedBy}'s pick`,
          ...(profile.iconUrl ? { icon_url: profile.iconUrl } : {}),
        },
        title: movie.year ? `${movie.title} (${movie.year})` : movie.title,
        description: trim(movie.overview, 400),
        color: BRICK,
        fields: rt ? [{ name: "Runtime", value: rt, inline: true }] : [],
        // Large poster (a higher-res crop than the small thumbnail) for the pick.
        image: movie.posterUrl
          ? { url: movie.posterUrl.replace("/w342/", "/w500/") }
          : undefined,
      },
    ],
  });
}

// Custom star emojis for ratings, e.g. DISCORD_EMOJI_STAR="<:star_full:123...>".
// All three must be set (full, half, empty) or we fall back to text stars, so
// the row never mixes image emojis with plain characters.
function starEmojiSet(): { full: string; half: string; empty: string } | null {
  const full = process.env.DISCORD_EMOJI_STAR?.trim();
  const half = process.env.DISCORD_EMOJI_STAR_HALF?.trim();
  const empty = process.env.DISCORD_EMOJI_STAR_EMPTY?.trim();
  const ok = (s?: string) => !!s && /^<a?:\w+:\d+>$/.test(s);
  if (ok(full) && ok(half) && ok(empty)) {
    return { full: full!, half: half!, empty: empty! };
  }
  return null;
}

function stars(rating: number): string {
  // 1-10 → out of 5 with a half star (e.g. 9 → four and a half stars).
  const outOfFive = rating / 2;
  const full = Math.floor(outOfFive);
  const half = outOfFive - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);

  const emoji = starEmojiSet();
  if (emoji) {
    return (
      emoji.full.repeat(full) +
      (half ? emoji.half : "") +
      emoji.empty.repeat(empty)
    );
  }
  return "★".repeat(full) + (half ? "½" : "") + "☆".repeat(empty);
}

export async function announceReview(input: {
  author: string;
  movieTitle: string;
  movieYear: number | null;
  posterUrl: string | null;
  rating: number | null;
  body: string | null;
  isSpoiler?: boolean;
  letterboxdUrl: string | null;
}): Promise<void> {
  const profile = await profileFor(input.author);

  const parts: string[] = [];
  if (input.rating != null) parts.push(`${stars(input.rating)}  **${input.rating}/10**`);
  const body = trim(input.body, 800);
  if (body) {
    if (input.isSpoiler) {
      // The rating shows; the comment hides behind Discord's native spoiler
      // bar (escape any || in the text so it can't break out early).
      parts.push(`⚠ Spoiler\n||${body.replaceAll("||", "\\|\\|")}||`);
    } else {
      parts.push(body);
    }
  }
  if (input.letterboxdUrl) parts.push(`[Letterboxd review](${input.letterboxdUrl})`);

  await send({
    embeds: [
      {
        author: {
          name: input.author,
          ...(profile.iconUrl ? { icon_url: profile.iconUrl } : {}),
        },
        title: input.movieYear
          ? `${input.movieTitle} (${input.movieYear})`
          : input.movieTitle,
        description: parts.join("\n\n") || undefined,
        color: BRICK,
        thumbnail: input.posterUrl ? { url: input.posterUrl } : undefined,
      },
    ],
  });
}
