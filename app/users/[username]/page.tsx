import { Suspense } from "react";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { getDb } from "@/db";
import { users } from "@/db/schema";
async function UserPage({ params }: { params: Promise<{ username: string }> }) {
  await connection();
  const { username } = await params;
  const user = await getDb().query.users.findFirst({
    where: eq(users.username, username),
    columns: { id: true, name: true, username: true },
    with: { blogs: true },
  });
  if (!user) notFound();
  return (
    <>
      <h1>{user.name}</h1>
      <p className="muted">@{user.username}</p>
      <section className="card mt-8">
        <h2 className="section-title">Shared blogs</h2>
        <ul className="space-y-4">
          {user.blogs.map((blog) => (
            <li key={blog.id}>
              <Link href={"/blogs/" + blog.id}>{blog.title}</Link>
            </li>
          ))}
        </ul>
        {!user.blogs.length && <p className="muted">No shared blogs yet.</p>}
      </section>
    </>
  );
}

export default function Page(props: Parameters<typeof UserPage>[0]) {
  return (
    <Suspense
      fallback={
        <p role="status" className="muted">
          Loading…
        </p>
      }
    >
      <UserPage {...props} />
    </Suspense>
  );
}
