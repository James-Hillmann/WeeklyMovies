import { asc, eq } from "drizzle-orm";
import { db, isDbConfigured } from "@/db";
import { movies, weeks } from "@/db/schema";

// The shuffled round-robin "pass": everyone with a movie on the reel goes once,
// in a random order, before anyone repeats. This module is the single source of
// truth for that logic; the picker (spinWheel) and the rotation display both
// use it so they can never disagree.

export type PassState = {
  // Pool people who have been picked this pass (lowercased). Drives eligibility.
  passSoFar: Set<string>;
  // Everyone picked this pass in pick order (lowercased), INCLUDING people who
  // no longer have movies on the reel. Drives the strikethrough display.
  struck: string[];
  // Most recent pick overall (lowercased), used to avoid back-to-back repeats.
  lastPerson: string | null;
};

// poolPeople: lowercased names of people with movies on the reel.
// picks: lowercased names of past picks, oldest first.
export function computePass(poolPeople: string[], picks: string[]): PassState {
  const poolSet = new Set(poolPeople);
  const passSoFar = new Set<string>();
  let struck: string[] = [];

  for (const p of picks) {
    if (poolSet.has(p)) {
      if (passSoFar.has(p)) {
        // Saw a repeat before the pass filled (pool changed mid-cycle): treat
        // it as the start of a new pass.
        passSoFar.clear();
        struck = [];
      }
      passSoFar.add(p);
      if (!struck.includes(p)) struck.push(p);
      if (passSoFar.size === poolSet.size) {
        // Pass complete: everyone has gone, all strikes clear.
        passSoFar.clear();
        struck = [];
      }
    } else {
      // Picked this pass but has no movies on the reel anymore. Doesn't affect
      // eligibility math, but stays visible (struck) until the pass resets.
      if (!struck.includes(p)) struck.push(p);
    }
  }

  return {
    passSoFar,
    struck,
    lastPerson: picks.length ? picks[picks.length - 1] : null,
  };
}

export type RotationEntry = {
  name: string; // display casing
  picked: boolean;
};

// The lineup for the home page: struck people first (in pick order), then
// everyone still waiting for a turn (alphabetical).
export async function getRotation(): Promise<RotationEntry[]> {
  if (!isDbConfigured) return [];

  const pool = await db
    .select({ addedBy: movies.addedBy })
    .from(movies)
    .where(eq(movies.status, "pool"));
  const history = await db
    .select({ person: movies.addedBy })
    .from(weeks)
    .innerJoin(movies, eq(weeks.movieId, movies.id))
    .orderBy(asc(weeks.spunAt));

  // Remember a display casing for each lowercased name.
  const displayName = new Map<string, string>();
  for (const h of history) displayName.set(h.person.trim().toLowerCase(), h.person.trim());
  for (const m of pool) displayName.set(m.addedBy.trim().toLowerCase(), m.addedBy.trim());

  const poolPeople = [...new Set(pool.map((m) => m.addedBy.trim().toLowerCase()))];
  const picks = history.map((h) => h.person.trim().toLowerCase());
  const { struck } = computePass(poolPeople, picks);

  const struckSet = new Set(struck);
  const waiting = poolPeople.filter((p) => !struckSet.has(p)).sort();

  return [
    ...struck.map((p) => ({ name: displayName.get(p) ?? p, picked: true })),
    ...waiting.map((p) => ({ name: displayName.get(p) ?? p, picked: false })),
  ];
}
