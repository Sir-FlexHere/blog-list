import { Suspense } from "react";
import Link from "next/link";
import { currentUser } from "@/lib/current-user";
import { BlogForm } from "@/components/forms";
async function NewBlog() {
  const user = await currentUser();
  return (
    <section className="mx-auto max-w-xl">
      <p className="eyebrow">ADD TO THE LIBRARY</p>
      <h1>Share a blog</h1>
      <p className="muted mb-8">
        An article worth reading, from you to the community.
      </p>
      <div className="card">
        {user ? (
          <BlogForm />
        ) : (
          <p>
            You need to{" "}
            <Link href="/login" className="text-emerald-700 underline">
              log in
            </Link>{" "}
            to create a blog.
          </p>
        )}
      </div>
    </section>
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
      <NewBlog />
    </Suspense>
  );
}
