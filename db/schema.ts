import { relations, sql } from "drizzle-orm";
import {
  pgTable,
  serial,
  varchar,
  integer,
  boolean,
  timestamp,
  unique,
  check,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 200 }).notNull(),
  passwordHash: varchar("password_hash", { length: 100 }).notNull(),
  token: varchar("token", { length: 100 }).unique(),
});
export const blogs = pgTable(
  "blogs",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 300 }).notNull(),
    author: varchar("author", { length: 200 }).notNull(),
    url: varchar("url", { length: 2000 }).notNull(),
    likes: integer("likes").notNull().default(0),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [check("likes_nonnegative", sql`${table.likes} >= 0`)],
);
export const readingList = pgTable(
  "reading_list",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    blogId: integer("blog_id")
      .notNull()
      .references(() => blogs.id, { onDelete: "cascade" }),
    read: boolean("read").notNull().default(false),
  },
  (table) => [
    unique("reading_list_user_blog_unique").on(table.userId, table.blogId),
  ],
);
export const usersRelations = relations(users, ({ many }) => ({
  blogs: many(blogs),
  readingList: many(readingList),
}));
export const blogsRelations = relations(blogs, ({ one, many }) => ({
  user: one(users, { fields: [blogs.userId], references: [users.id] }),
  readingList: many(readingList),
}));
export const readingListRelations = relations(readingList, ({ one }) => ({
  user: one(users, { fields: [readingList.userId], references: [users.id] }),
  blog: one(blogs, { fields: [readingList.blogId], references: [blogs.id] }),
}));
