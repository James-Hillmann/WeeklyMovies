# Weekly Movies

A tiny site for a friend group's movie club. Add movies to a shared list, and
every Monday a host spins a wheel to pick what everyone watches that week. After
watching, drop a Letterboxd link or leave a rating and a few words.

It replaces the old "fill in a Word doc + spin something + post in Discord"
routine with one shared page.

## How it works

- **Pick a name** (top right). No accounts or passwords. Your name is saved on
  your device and attached to what you add and review. Fine for a private group.
- **Add movies.** Search by title (posters and details come from TMDB) or just
  type a title. They land in the pool "on the wheel".
- **Spin the wheel.** Only people listed in `HOST_NAMES` see the Spin button.
  Spinning promotes a random movie to *This week's pick* and records it in
  History.
- **Review.** On a movie's page, paste a Letterboxd link or leave a star rating
  (out of 10) and a note.
- **History** keeps every past pick with its ratings and reviews.

> Heads up: the name and host list are honor-system (names aren't verified).
> That's intentional for a small trusted group. Only share the link with your
> friends; it isn't a security boundary.

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
| `TMDB_API_KEY`  | No       | Free TMDB v3 key for posters + metadata. Blank = plain titles.       |
| `HOST_NAMES`    | No       | Comma-separated names allowed to spin (e.g. `james,alex`). Blank = anyone can spin. |

**Get a database:** create a free project at [neon.tech](https://neon.tech) and
copy its connection string, or provision Neon from the Vercel Marketplace.

**Get a TMDB key:** sign up at
[themoviedb.org](https://www.themoviedb.org/settings/api) and request an API key
(the v3 "API Key").

If `DATABASE_URL` isn't set, the app still runs and shows a short setup notice
instead of crashing.

## Deploy to Vercel

1. Push this repo to GitHub and import it at
   [vercel.com/new](https://vercel.com/new) (or run `vercel`).
2. Add a **Neon** database from the project's Storage/Marketplace tab. It sets
   `DATABASE_URL` for you. Add `TMDB_API_KEY` and `HOST_NAMES` under
   **Settings → Environment Variables**.
3. Create the tables against the production database:
   ```bash
   vercel env pull .env.local   # pulls DATABASE_URL locally
   npm run db:push
   ```
4. Deploy (`vercel --prod`) and share the URL with your friends.

## Handy scripts

| Script              | Does                                        |
| ------------------- | ------------------------------------------- |
| `npm run dev`       | Local dev server                            |
| `npm run build`     | Production build                            |
| `npm run db:push`   | Sync the schema to your database            |
| `npm run db:studio` | Open Drizzle Studio to browse the data      |
