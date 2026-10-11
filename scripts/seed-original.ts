import dotenv from "dotenv";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, and } from "drizzle-orm";
import { users, blogs, readingList } from "../db/schema";
dotenv.config({ path: ".env.local", quiet: true });
const username = process.argv[2];
if (!username || !process.env.DATABASE_URL)
  throw new Error(
    "Usage: npm run db:seed -- YOUR_REGISTERED_USERNAME (configure .env.local first)",
  );
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);
try {
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, username));
  if (!user)
    throw new Error(
      "Register your account first. This script does not create credentials.",
    );
  const originals = [
    {
      title: "Introduction to React",
      author: "Elias",
      url: "https://react.dev",
      likes: 15,
    },
    {
      title: "Learning Next.js",
      author: "John",
      url: "https://nextjs.org",
      likes: 25,
    },
    {
      title: "JavaScript Basics",
      author: "David",
      url: "https://javascript.info",
      likes: 10,
    },
  ];
  await db.transaction(async (tx) => {
    for (const original of originals) {
      const [existing] = await tx
        .select({ id: blogs.id })
        .from(blogs)
        .where(and(eq(blogs.userId, user.id), eq(blogs.url, original.url)));
      if (existing) continue;
      const [blog] = await tx
        .insert(blogs)
        .values({ ...original, userId: user.id })
        .returning({ id: blogs.id });
      await tx.insert(readingList).values({ userId: user.id, blogId: blog.id });
    }
  });
  console.log("Original example blogs imported for the selected creator.");
} finally {
  await pool.end();
}
