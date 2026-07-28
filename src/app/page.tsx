import Link from "next/link";
import { isDbConfigured } from "@/db";
import { getCurrentMovie, getPool } from "@/lib/queries";
import { Wheel } from "@/components/wheel";
import { AddMovie } from "@/components/add-movie";
import { PoolList } from "@/components/pool-list";
import { Poster } from "@/components/poster";
import { SetupNotice } from "@/components/setup-notice";
import { formatRuntime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Home() {
  if (!isDbConfigured) {
    return <SetupNotice />;
  }

  const [current, pool] = await Promise.all([getCurrentMovie(), getPool()]);

  return (
    <div className="space-y-12">
      {/* This week's pick */}
      <section>
        <h2 className="text-lg mb-3">This week&apos;s pick</h2>
        {current ? (
          <div className="card p-4 flex gap-4">
            <Link href={`/movie/${current.id}`} className="shrink-0">
              <Poster src={current.posterUrl} title={current.title} width={120} height={180} />
            </Link>
            <div className="min-w-0">
              <Link
                href={`/movie/${current.id}`}
                className="text-xl hover:underline underline-offset-2"
                style={{ fontFamily: "var(--font-serif)" }}
              >
                {current.title}
              </Link>
              <div className="text-sm text-[var(--muted)] mt-0.5">
                {[current.year, formatRuntime(current.runtime)].filter(Boolean).join(" · ")}
              </div>
              <div className="text-sm text-[var(--muted)]">
                Requested by {current.addedBy}
              </div>
              {current.overview && (
                <p className="text-sm mt-2 line-clamp-3">{current.overview}</p>
              )}
              <Link href={`/movie/${current.id}`} className="link text-sm inline-block mt-3">
                Watched it? Leave your review
              </Link>
            </div>
          </div>
        ) : (
          <div className="card p-5 text-center text-[var(--muted)]">
            No pick yet this week. Give the reel a spin.
          </div>
        )}
      </section>

      {/* The reel */}
      <section>
        <h2 className="text-lg mb-1 text-center">The reel</h2>
        <p className="text-sm text-[var(--muted)] text-center mb-5">
          Every Monday, Maxx spins to pick what we watch.
        </p>
        <Wheel
          pool={pool.map((m) => ({
            id: m.id,
            title: m.title,
            posterUrl: m.posterUrl,
          }))}
        />
      </section>

      {/* Add a movie */}
      <section>
        <AddMovie />
      </section>

      {/* The pool */}
      <PoolList
        pool={pool.map((m) => ({
          id: m.id,
          title: m.title,
          year: m.year,
          posterUrl: m.posterUrl,
          addedBy: m.addedBy,
        }))}
      />
    </div>
  );
}
