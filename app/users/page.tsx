import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { getDb } from "@/db";
async function UsersPage() {
  await connection();
  const users = await getDb().query.users.findMany({
    columns: { id: true, name: true, username: true },
    with: { blogs: { columns: { id: true } } },
  });
  return (
    <>
      <p className="eyebrow">CURIOUS MINDS</p>
      <h1>Users</h1>
      <p className="muted mb-8">
        Meet the people sharing their favorite reads.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {users.map((user) => (
          <article className="card" key={user.id}>
            <h2 className="text-xl font-semibold">
              <Link href={"/users/" + encodeURIComponent(user.username)}>
                {user.name}
              </Link>
            </h2>
            <p className="muted">@{user.username}</p>
            <p className="mt-4 text-sm">{user.blogs.length} blogs shared</p>
          </article>
        ))}
      </div>
      {!users.length && <p className="card muted">No users yet.</p>}
    </>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <p role="status" className="muted">
          Loading…
        </p>
      }
    >
      <UsersPage />
    </Suspense>
  );
}
