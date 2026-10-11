import { Suspense } from "react";
import Link from "next/link";
import { desc, ilike, or } from "drizzle-orm";
import { connection } from "next/server";
import { getDb } from "@/db";
import { blogs } from "@/db/schema";
async function BlogsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  await connection();
  const search = (await searchParams).filter?.trim() ?? "";
  const filter = search.replace(/[\\%_]/g, "\\$&");
  const allBlogs = await getDb().query.blogs.findMany({
    where: search
      ? or(
          ilike(blogs.title, "%" + filter + "%"),
          ilike(blogs.author, "%" + filter + "%"),
        )
      : undefined,
    orderBy: [desc(blogs.likes), desc(blogs.id)],
    with: { user: { columns: { id: true, name: true, username: true } } },
  });
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">THE COMMUNITY LIBRARY</p>
          <h1>Blogs</h1>
          <p className="muted">Find a new perspective. Save it for later.</p>
        </div>
        <Link className="button" href="/blogs/new">
          Share a blog
        </Link>
      </div>
      <form action="/blogs" className="mb-8 flex gap-3">
        <label className="sr-only" htmlFor="filter">
          Search blogs
        </label>
        <input
          id="filter"
          name="filter"
          className="input flex-1"
          placeholder="Search title or author…"
          data-testid="filter-input"
          defaultValue={search}
        />
        <button className="button secondary" data-testid="search-button">
          Search
        </button>
      </form>
      <div data-testid="blogs-list" className="grid gap-4 sm:grid-cols-2">
        {allBlogs.map((blog) => (
          <article key={blog.id} className="card">
            <p className="mb-3 text-xs font-semibold text-emerald-700">
              {blog.likes} likes
            </p>
            <h2 className="mb-2 text-xl font-semibold">
              <Link href={"/blogs/" + blog.id}>{blog.title}</Link>
            </h2>
            <p className="muted">By {blog.author}</p>
            <p className="mt-4 text-sm text-slate-500">
              Shared by{" "}
              <Link href={"/users/" + encodeURIComponent(blog.user.username)}>
                {blog.user.name}
              </Link>
            </p>
          </article>
        ))}
        {!allBlogs.length && (
          <p className="card col-span-full muted">
            {search
              ? "No blogs match your search."
              : "No blogs yet. Share the first one."}
          </p>
        )}
      </div>
    </>
  );
}

export default function Page(props: Parameters<typeof BlogsPage>[0]) {
  return (
    <Suspense
      fallback={
        <p role="status" className="muted">
          Loading…
        </p>
      }
    >
      <BlogsPage {...props} />
    </Suspense>
  );
}
