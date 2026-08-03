"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useName } from "./name-provider";
import { Poster } from "./poster";
import { checkHost, removeMovie } from "@/app/actions";

type PoolMovie = {
  id: string;
  title: string;
  year: number | null;
  posterUrl: string | null;
  addedBy: string;
};

export function PoolList({ pool }: { pool: PoolMovie[] }) {
  const { name } = useName();
  const router = useRouter();
  const [isHost, setIsHost] = useState(false);

  useEffect(() => {
    let alive = true;
    if (name) checkHost(name).then((ok) => alive && setIsHost(ok));
    else setIsHost(false);
    return () => {
      alive = false;
    };
  }, [name]);

  if (pool.length === 0) return null;

  const myName = name?.trim().toLowerCase() ?? "";

  async function remove(id: string) {
    if (!name) return;
    await removeMovie({ name, movieId: id });
    router.refresh();
  }

  return (
    <section>
      <h2 className="text-lg mb-3">
        On the reel{" "}
        <span className="text-[var(--muted)] text-sm font-normal">
          ({pool.length})
        </span>
      </h2>
      <ul className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {pool.map((m) => (
          <li key={m.id} className="card overflow-hidden">
            <Link href={`/movie/${m.id}`} className="block">
              <Poster src={m.posterUrl} title={m.title} fluid />
            </Link>
            <div className="p-2">
              <Link href={`/movie/${m.id}`} className="text-sm hover:underline underline-offset-2">
                {m.title}
                {m.year ? ` (${m.year})` : ""}
              </Link>
              <div className="text-xs text-[var(--muted)] mt-0.5">added by {m.addedBy}</div>
              {(isHost || m.addedBy.trim().toLowerCase() === myName) && (
                <button
                  className="text-xs text-[var(--muted)] underline underline-offset-2 mt-1"
                  onClick={() => remove(m.id)}
                >
                  remove
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
