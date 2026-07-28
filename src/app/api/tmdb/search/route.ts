import { NextRequest, NextResponse } from "next/server";
import { searchMovies, tmdbConfigured } from "@/lib/tmdb";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (!tmdbConfigured()) {
    // No key set — tell the client so it can fall back to free-text entry.
    return NextResponse.json({ configured: false, results: [] });
  }
  if (!q) {
    return NextResponse.json({ configured: true, results: [] });
  }

  const results = await searchMovies(q);
  return NextResponse.json({ configured: true, results });
}
