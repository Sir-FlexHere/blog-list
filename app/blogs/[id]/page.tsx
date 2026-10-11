import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { connection } from "next/server";
import { getDb } from "@/db";
import { blogs, readingList } from "@/db/schema";
import { currentUser } from "@/lib/current-user";
import { ActionButton } from "@/components/action-button";
import { likeBlogFromForm, addToReadingList, deleteBlog } from "@/app/actions";
async function BlogPage({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id < 1) notFound();
  const [blog, user] = await Promise.all([
    getDb().query.blogs.findFirst({
      where: eq(blogs.id, id),
      with: { user: { columns: { id: true, name: true, username: true } } },
    }),
    currentUser(),
  ]);
  if (!blog) notFound();
  const saved = user
    ? await getDb().query.readingList.findFirst({
        where: and(eq(readingList.blogId, id), eq(readingList.userId, user.id)),
      })
    : undefined;
  return (
    <article data-testid="blog-detail" className="mx-auto max-w-2xl">
      <Link href="/blogs" className="muted">
        ← Back to blogs
      </Link>
      <div className="card mt-6">
        <p className="eyebrow">
          SHARED BY{" "}
          <Link href={"/users/" + encodeURIComponent(blog.user.username)}>
            {blog.user.name}
          </Link>
        </p>
        <h1 data-testid="blog-title">{blog.title}</h1>
        <p data-testid="blog-author" className="muted">
          By {blog.author}
        </p>
        <a
          href={blog.url}
          target="_blank"
          rel="noopener noreferrer"
          className="my-6 block break-all text-emerald-700 underline"
        >
          {blog.url} ↗
        </a>
        <p data-testid="blog-likes" className="mb-5 font-semibold">
          {blog.likes} likes
        </p>
        {user ? (
          <div className="flex flex-wrap gap-3">
            <form action={likeBlogFromForm}>
              <input type="hidden" name="id" value={id} />
              <button className="button" data-testid="like-blog-button">
                Like
              </button>
            </form>
            {saved ? (
              <p className="self-center text-sm text-emerald-700">
                Saved in your reading list
              </p>
            ) : (
              <ActionButton
                action={addToReadingList.bind(null, id)}
                testId="add-to-reading-list-button"
                className="button secondary"
              >
                Add to reading list
              </ActionButton>
            )}
            {user.id === blog.userId && (
              <>
                <Link
                  className="button secondary"
                  href={"/blogs/" + id + "/edit"}
                >
                  Edit
                </Link>
                <ActionButton
                  action={deleteBlog.bind(null, id)}
                  testId="delete-blog-button"
                  className="button danger"
                >
                  Delete
                </ActionButton>
              </>
            )}
          </div>
        ) : (
          <p className="muted">
            <Link href="/login" className="underline">
              Log in
            </Link>{" "}
            to like or save this blog.
          </p>
        )}
      </div>
    </article>
  );
}

export default function Page(props: Parameters<typeof BlogPage>[0]) {
  return (
    <Suspense
      fallback={
        <p role="status" className="muted">
          Loading…
        </p>
      }
    >
      <BlogPage {...props} />
    </Suspense>
  );
}
