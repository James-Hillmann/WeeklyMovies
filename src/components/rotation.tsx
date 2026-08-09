import { Avatar } from "./avatar";

// The rotation lineup under the reel: who has already had a movie picked this
// pass (dimmed, slashed, struck-through name) and who is still in the running.
// When everyone has gone, the pass resets and all strikes clear.
export type RotationView = {
  name: string;
  picked: boolean;
  avatarUrl: string | null;
};

export function Rotation({ entries }: { entries: RotationView[] }) {
  if (entries.length < 2) return null;

  return (
    <div className="mt-6">
      <ul className="flex flex-wrap justify-center gap-x-5 gap-y-3">
        {entries.map((e) => (
          <li key={e.name} className="flex flex-col items-center w-14">
            <span className="relative inline-block">
              <span className={e.picked ? "block opacity-40" : "block"}>
                <Avatar name={e.name} url={e.avatarUrl} size={36} />
              </span>
              {e.picked && (
                <span
                  aria-hidden
                  className="absolute rounded-full"
                  style={{
                    left: -3,
                    right: -3,
                    top: "50%",
                    height: 2.5,
                    background: "var(--accent)",
                    transform: "rotate(-45deg)",
                  }}
                />
              )}
            </span>
            <span
              className={
                e.picked
                  ? "text-xs mt-1 line-through text-[var(--muted)]"
                  : "text-xs mt-1"
              }
            >
              {e.name}
            </span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-[var(--muted)] text-center mt-2">
        Everyone gets a turn before anyone repeats.
      </p>
    </div>
  );
}
