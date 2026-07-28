// The wheel is host-only. HOST_NAMES is a comma-separated list of display
// names allowed to spin (e.g. "james,alex"). Compared case-insensitively.
// This is honor-system only (names aren't verified), which is fine for a
// small private friend group.

function hostList(): string[] {
  return (process.env.HOST_NAMES ?? "")
    .split(",")
    .map((n) => n.trim().toLowerCase())
    .filter(Boolean);
}

export function isHost(name: string | null | undefined): boolean {
  if (!name) return false;
  const hosts = hostList();
  // If nobody configured a host list, let anyone spin so the app still works
  // out of the box. Set HOST_NAMES to lock it down.
  if (hosts.length === 0) return true;
  return hosts.includes(name.trim().toLowerCase());
}

export function hostsConfigured(): boolean {
  return hostList().length > 0;
}
