// Shown when DATABASE_URL isn't set yet, so the app renders something helpful
// instead of crashing on first run.
export function SetupNotice() {
  return (
    <div className="card p-5">
      <h2 className="text-lg mb-2">Finish setup</h2>
      <p className="text-sm text-[var(--muted)] mb-3">
        The database isn&apos;t connected yet. Once it is, this page becomes the
        movie reel.
      </p>
      <ol className="text-sm list-decimal pl-5 space-y-1">
        <li>
          Add a <code>DATABASE_URL</code> (a Neon Postgres connection string) to{" "}
          <code>.env.local</code>.
        </li>
        <li>
          Run <code>npm run db:push</code> to create the tables.
        </li>
        <li>
          Optionally add <code>TMDB_API_KEY</code> (posters) and{" "}
          <code>HOST_NAMES</code> (who can spin).
        </li>
      </ol>
      <p className="text-sm text-[var(--muted)] mt-3">
        See the README for the full walkthrough.
      </p>
    </div>
  );
}
