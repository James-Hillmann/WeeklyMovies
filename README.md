# Weekly Movies

A tiny site for a friend group's movie club. Add movies to a shared list, and
every Monday a host spins a reel to pick what everyone watches that week. After
watching, drop a Letterboxd link or leave a rating and a few words.

It replaces the old "fill in a Word doc + spin something + post in Discord"
routine with one shared page.

## How it works

- **Pick a name** (top right, shown as a little monogram). No accounts or
  passwords. Your name is saved on your device and attached to what you add and
  review. Fine for a private group.
- **Add movies.** Search by title and the poster, year, runtime, and director
  fill in from TMDB (the director helps tell remakes apart) — or just type a
  title if you don't have a key set up. They land in the pool "on the reel".
- **Undo a mistake.** Whoever added a movie can remove it (a "remove" link on its
  card) while it's still on the reel; hosts can remove any. Once a movie has been
  picked it stays, so History is never lost.
- **Spin the reel.** Only hosts see the Spin button — the names in `HOST_NAMES`,
  plus a built-in `admin` login (see below). The reel scrolls like a slot machine
  and lands on a movie, which becomes *This week's pick* and gets recorded in
  History. The result isn't shown until the reel actually lands (no spoilers).
- **Share to Discord.** After a spin, the roller gets a "Copy Discord message"
  button that copies a formatted announcement (with the poster) to paste in your
  channel.
- **Fair picking.** The reel goes through everyone who has a movie on it before
  anyone repeats, in a random order each pass, and it never lands on the same
  person two weeks in a row (unless they're the only one left).
- **Review.** On a movie's page, paste a Letterboxd link or leave a star rating
  (out of 10) and a note. You can **edit your own reviews** later — they show a
  Discord-style "(edited)" with the time on hover.
- **History** keeps every past pick with its ratings and reviews.
- **Light / dim.** A sun/moon toggle in the header switches between the warm
  paper theme and a low-glare dark mode. Your choice is remembered per device.

> Heads up: names are honor-system (they aren't verified), so "your own review"
> or "movies you added" really means "under your name" — and anyone can type
> `admin`. That's intentional for a small trusted group — only share the link
> with your friends; it isn't a security boundary.

## Tech

Next.js (App Router), TypeScript, Tailwind CSS, Drizzle ORM, Neon Postgres, and
TMDB. Deploys to Vercel.

## Local setup

```bash
npm install
cp .env.example .env.local   # then fill in the values below
npm run db:push              # creates the tables in your database
npm run dev
```

### Environment variables

| Variable        | Required | What it's for                                                        |
| --------------- | -------- | -------------------------------------------------------------------- |
| `DATABASE_URL`  | Yes      | Neon Postgres connection string.                                     |
| `TMDB_API_KEY`  | No       | Free TMDB v3 key for posters, metadata, and directors. Blank = plain titles. |
| `HOST_NAMES`    | No       | Comma-separated names allowed to spin and manage the reel (e.g. `james,alex`), case-insensitive. Blank = anyone can spin. |

**Admin login:** the name `admin` is always a host, baked into the code — no
config needed. Set your name to `admin` for quick edits (spin, remove any movie),
on both local and the deployed site.

**Get a database:** create a free project at [neon.tech](https://neon.tech) and
copy its connection string, or provision Neon from the Vercel Marketplace.

**Get a TMDB key:** sign up at
[themoviedb.org](https://www.themoviedb.org/settings/api) and request an API key
(the v3 "API Key").

If `DATABASE_URL` isn't set, the app still runs and shows a short setup notice
instead of crashing.

## A safe place to test spins

Spinning, adding, and reviewing all write to whatever database `DATABASE_URL`
points at — including on `npm run dev`. To experiment without touching real
data, there's a throwaway database (`weeklymovies_test`, a separate database in
the same Neon project). Its connection string lives in `.env.testdb`
(gitignored).

| Script                | Does                                                         |
| --------------------- | ------------------------------------------------------------ |
| `npm run dev:test`    | Run the dev server against the throwaway test database       |
| `npm run db:push:test`| Apply schema changes to the test database                    |
| `npm run db:reset:test`| Reset the test DB to a clean copy of your real movie list (no picks/reviews) |

`npm run dev` always uses your real database — use `dev:test` when you just want
to try things out.

## Deploy to Vercel

1. Push this repo to GitHub and import it at
   [vercel.com/new](https://vercel.com/new) (or run `vercel`).
2. Add a **Neon** database from the project's Storage/Marketplace tab (leave the
   env-var prefix blank so it's named exactly `DATABASE_URL`). Add `TMDB_API_KEY`
   and `HOST_NAMES` under **Settings → Environment Variables**, scoped to
   **Production**.
3. Create the tables against the production database:
   ```bash
   vercel env pull .env.local   # pulls DATABASE_URL locally
   npm run db:push
   ```
4. **Redeploy** — environment variables only take effect on a new deployment
   (`vercel --prod` or the dashboard's Redeploy). Then share the URL.

## Handy scripts

| Script               | Does                                     |
| -------------------- | ---------------------------------------- |
| `npm run dev`        | Local dev server (real database)         |
| `npm run dev:test`   | Local dev server (throwaway test database) |
| `npm run build`      | Production build                         |
| `npm run db:push`    | Sync the schema to your database         |
| `npm run db:studio`  | Open Drizzle Studio to browse the data   |
| `npm run db:reset:test` | Reset the throwaway test database      |
