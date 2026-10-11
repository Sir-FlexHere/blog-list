import { Suspense } from "react";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getDb } from "@/db";
import { blogs } from "@/db/schema";
import { requireUser } from "@/lib/current-user";
import { BlogForm } from "@/components/forms";
async function EditBlog({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id < 1) notFound();
  const blog = await getDb().query.blogs.findFirst({ where: eq(blogs.id, id) });
  if (!blog || blog.userId !== user.id) notFound();
  return (
    <section className="mx-auto max-w-xl">
      <h1>Edit blog</h1>
      <div className="card mt-6">
        <BlogForm blog={blog} />
      </div>
    </section>
  );
}

export default function Page(props: Parameters<typeof EditBlog>[0]) {
  return (
    <Suspense
      fallback={
        <p role="status" className="muted">
          Loading…
        </p>
      }
    >
      <EditBlog {...props} />
    </Suspense>
  );
}
