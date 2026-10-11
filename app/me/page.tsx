import { Suspense } from "react";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { readingList } from "@/db/schema";
import { requireUser } from "@/lib/current-user";
import { ActionButton } from "@/components/action-button";
import { generateToken, markRead } from "@/app/actions";
async function MePage() {
  const user = await requireUser();
  const entries = await getDb().query.readingList.findMany({
    where: eq(readingList.userId, user.id),
    with: { blog: true },
    orderBy: readingList.id,
  });
  const unread = entries.filter((entry) => !entry.read);
  const read = entries.filter((entry) => entry.read);
  return (
    <>
      <p className="eyebrow">YOUR PERSONAL SPACE</p>
      <h1>My dashboard</h1>
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <section data-testid="user-profile" className="card">
          <h2 className="section-title">Profile</h2>
          <p data-testid="user-name" className="text-xl font-semibold">
            {user.name}
          </p>
          <p data-testid="user-username" className="muted">
            {user.username}
          </p>
        </section>
        <section data-testid="api-token-section" className="card">
          <h2 className="section-title">API token</h2>
          {user.token ? (
            <div data-testid="token-display">
              <code
                data-testid="api-token"
                className="mb-4 block break-all rounded-lg bg-slate-100 p-3 text-xs"
              >
                {user.token}
              </code>
            </div>
          ) : (
            <p data-testid="no-token-message" className="muted mb-4">
              No API token generated yet.
            </p>
          )}
          <ActionButton action={generateToken} testId="generate-token-button">
            {user.token ? "Regenerate API token" : "Generate API token"}
          </ActionButton>
          <p className="mt-3 text-xs muted">
            Keep your token private. Regenerating it invalidates the previous
            token.
          </p>
        </section>
      </div>
      <section data-testid="reading-list-section" className="mt-10">
        <h2 className="section-title">My reading list</h2>
        {!entries.length && (
          <p className="muted mb-6" data-testid="empty-reading-list">
            Your reading list is empty. Explore the blogs to get started.
          </p>
        )}
        <div className="grid gap-6 md:grid-cols-2">
          <section className="card" data-testid="unread-section">
            <h3 className="section-title">
              Unread <span className="muted">({unread.length})</span>
            </h3>
            {!unread.length && (
              <p className="muted" data-testid="no-unread-blogs">
                No unread blogs.
              </p>
            )}
            <ul className="space-y-5">
              {unread.map((entry) => (
                <li key={entry.id}>
                  <Link
                    href={"/blogs/" + entry.blog.id}
                    className="font-semibold"
                  >
                    {entry.blog.title}
                  </Link>
                  <p className="muted mb-3 text-sm">{entry.blog.author}</p>
                  <ActionButton
                    action={markRead.bind(null, entry.id)}
                    testId={"mark-read-" + entry.id}
                    className="button secondary"
                  >
                    Mark as Read
                  </ActionButton>
                </li>
              ))}
            </ul>
          </section>
          <section className="card" data-testid="read-section">
            <h3 className="section-title">
              Read <span className="muted">({read.length})</span>
            </h3>
            {!read.length && <p className="muted">No finished reads yet.</p>}
            <ul className="space-y-5">
              {read.map((entry) => (
                <li key={entry.id}>
                  <Link
                    href={"/blogs/" + entry.blog.id}
                    className="font-semibold"
                  >
                    {entry.blog.title}
                  </Link>
                  <p className="muted text-sm">{entry.blog.author}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </section>
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
      <MePage />
    </Suspense>
  );
}
