import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { NameProvider } from "@/components/name-provider";
import { WhoAmI } from "@/components/who-am-i";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "@/components/logo";

// Applies the saved theme before the page paints, so there's no flash.
const themeScript = `(function(){try{if(localStorage.getItem('weeklymovies.theme')==='dark'){document.documentElement.setAttribute('data-theme','dark');}}catch(e){}})();`;

export const metadata: Metadata = {
  title: "Weekly Movies",
  description:
    "Our little movie club. Add movies, spin the reel every Monday, and share what you thought.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        <NameProvider>
          <header className="border-b">
            <div className="mx-auto w-full max-w-2xl px-5 py-4 flex items-center justify-between gap-4">
              <Link
                href="/"
                className="flex items-center gap-2 text-xl"
                style={{ fontFamily: "var(--font-serif)" }}
              >
                <span className="text-[var(--accent)]">
                  <Logo size={24} />
                </span>
                Weekly Movies
              </Link>
              <nav className="flex items-center gap-4 text-sm">
                <Link href="/" className="hover:underline underline-offset-4">
                  Home
                </Link>
                <Link href="/history" className="hover:underline underline-offset-4">
                  History
                </Link>
                <WhoAmI />
                <span className="-mr-1.5">
                  <ThemeToggle />
                </span>
              </nav>
            </div>
          </header>

          <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-8">{children}</main>

          <footer className="border-t">
            <div className="mx-auto w-full max-w-2xl px-5 py-5 text-sm text-[var(--muted)]">
              A movie a week. Spin on Mondays, watch by Sunday, tell everyone what you thought.
            </div>
          </footer>
        </NameProvider>
      </body>
    </html>
  );
}
