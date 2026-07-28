import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  date,
} from "drizzle-orm/pg-core";

// A movie someone added to the club. Status walks: pool -> current -> watched.
export const movies = pgTable("movies", {
  id: uuid("id").primaryKey().defaultRandom(),
  tmdbId: integer("tmdb_id"),
  title: text("title").notNull(),
  year: integer("year"),
  posterUrl: text("poster_url"),
  runtime: integer("runtime"),
  overview: text("overview"),
  addedBy: text("added_by").notNull(),
  // 'pool' = waiting on the wheel, 'current' = this week's pick, 'watched' = done
  status: text("status").notNull().default("pool"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// One row per weekly spin, so we keep a history of what got picked when.
export const weeks = pgTable("weeks", {
  id: uuid("id").primaryKey().defaultRandom(),
  movieId: uuid("movie_id")
    .notNull()
    .references(() => movies.id, { onDelete: "cascade" }),
  weekOf: date("week_of").notNull(), // the Monday this pick belongs to
  spunBy: text("spun_by").notNull(),
  spunAt: timestamp("spun_at", { withTimezone: true }).notNull().defaultNow(),
});

// A member's take on a movie: a Letterboxd link, an in-app rating + text, or both.
export const reviews = pgTable("reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  movieId: uuid("movie_id")
    .notNull()
    .references(() => movies.id, { onDelete: "cascade" }),
  author: text("author").notNull(),
  rating: integer("rating"), // 1-10 (half-stars stored as odd/even out of 10), nullable
  body: text("body"),
  letterboxdUrl: text("letterboxd_url"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  // null until the author edits it (shown as Discord-style "(edited)").
  editedAt: timestamp("edited_at", { withTimezone: true }),
});

export type Movie = typeof movies.$inferSelect;
export type NewMovie = typeof movies.$inferInsert;
export type Week = typeof weeks.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;
