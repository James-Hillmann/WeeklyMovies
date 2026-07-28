// Reset the throwaway test database to a clean pool: copies the current movies
// from the real database, clears all picks/reviews, and marks everything as
// 'pool'. Never touches the real database (read-only there).
//
// Usage: npm run db:reset:test
import { config } from "dotenv";
config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";

const realUrl = process.env.DATABASE_URL;
if (!realUrl) {
  console.error("No DATABASE_URL in .env.local");
  process.exit(1);
}

let testUrl;
try {
  const line = readFileSync(".env.testdb", "utf8")
    .split("\n")
    .find((l) => l.startsWith("DATABASE_URL="));
  testUrl = line.slice("DATABASE_URL=".length).trim();
} catch {
  console.error("No .env.testdb found. Set up the test database first.");
  process.exit(1);
}

const real = neon(realUrl);
const test = neon(testUrl);

const rows = await real.query(
  "select tmdb_id, title, year, poster_url, runtime, overview, added_by, created_at from movies",
);

await test.query("delete from movies"); // cascades weeks + reviews

let n = 0;
for (const r of rows) {
  await test.query(
    "insert into movies (tmdb_id,title,year,poster_url,runtime,overview,added_by,status,created_at) values ($1,$2,$3,$4,$5,$6,$7,'pool',$8)",
    [r.tmdb_id, r.title, r.year, r.poster_url, r.runtime, r.overview, r.added_by, r.created_at],
  );
  n++;
}
console.log(`Test DB reset: ${n} movies, all 'pool', no picks or reviews.`);
