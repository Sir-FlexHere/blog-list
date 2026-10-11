"use server";
import { randomBytes } from "node:crypto";
import { hash } from "bcryptjs";
import { AuthError } from "next-auth";
import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { blogs, readingList, users } from "@/db/schema";
import { signIn, signOut } from "@/auth";
import { requireUser } from "@/lib/current-user";
import { flash } from "@/lib/flash";
import {
  formValues,
  validateBlog,
  validateUser,
  type FormState,
} from "@/lib/validation";

export async function register(
  _state: FormState,
  data: FormData,
): Promise<FormState> {
  const values = formValues(data, ["username", "name"]);
  const password = String(data.get("password") ?? "");
  const errors = validateUser(
    values,
    password,
    String(data.get("passwordConfirm") ?? ""),
  );
  if (Object.keys(errors).length) return { errors, values };
  const inserted = await getDb()
    .insert(users)
    .values({
      ...(values as { username: string; name: string }),
      passwordHash: await hash(password, 12),
    })
    .onConflictDoNothing({ target: users.username })
    .returning({ id: users.id });
  if (!inserted.length)
    return { values, errors: { username: "Username is already taken." } };
  await flash("Account created. You can now log in.");
  redirect("/login");
}
export async function login(
  _state: FormState,
  data: FormData,
): Promise<FormState> {
  try {
    await signIn("credentials", {
      username: String(data.get("username") ?? ""),
      password: String(data.get("password") ?? ""),
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError)
      return { message: "Invalid username or password." };
    throw error;
  }
  await flash("Logged in successfully.");
  redirect("/");
}
export async function logout() {
  await signOut({ redirect: false });
  await flash("Logged out.");
  redirect("/");
}
export async function saveBlog(
  blogId: number | null,
  _state: FormState,
  data: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const values = formValues(data, ["title", "author", "url"]);
  const errors = validateBlog(values);
  if (Object.keys(errors).length) return { errors, values };
  const fields = {
    title: values.title,
    author: values.author,
    url: values.url,
  };
  if (blogId !== null) {
    const updated = await getDb()
      .update(blogs)
      .set(fields)
      .where(and(eq(blogs.id, blogId), eq(blogs.userId, user.id)))
      .returning({ id: blogs.id });
    if (!updated.length)
      return { values, message: "You can only edit your own blogs." };
  } else {
    await getDb().transaction(async (tx) => {
      const [blog] = await tx
        .insert(blogs)
        .values({ ...fields, userId: user.id })
        .returning({ id: blogs.id });
      await tx.insert(readingList).values({ userId: user.id, blogId: blog.id });
    });
  }
  revalidatePath("/blogs");
  revalidatePath("/me");
  revalidatePath("/users");
  if (blogId !== null) revalidatePath(`/blogs/${blogId}`);
  await flash(
    blogId === null
      ? "Blog created successfully."
      : "Blog updated successfully.",
  );
  redirect(blogId === null ? "/blogs" : `/blogs/${blogId}`);
}
export async function deleteBlog(blogId: number) {
  const user = await requireUser();
  const deleted = await getDb()
    .delete(blogs)
    .where(and(eq(blogs.id, blogId), eq(blogs.userId, user.id)))
    .returning({ id: blogs.id });
  if (!deleted.length) return { error: "You can only delete your own blogs." };
  revalidatePath("/blogs");
  revalidatePath("/me");
  revalidatePath("/users");
  await flash("Blog deleted.");
  redirect("/blogs");
}
export async function likeBlog(blogId: number) {
  await requireUser();
  const updated = await getDb()
    .update(blogs)
    .set({ likes: sql`${blogs.likes} + 1` })
    .where(eq(blogs.id, blogId))
    .returning({ id: blogs.id });
  if (!updated.length) return { error: "Blog not found." };
  revalidatePath("/blogs");
  revalidatePath(`/blogs/${blogId}`);
  return { message: "Like added." };
}
export async function likeBlogFromForm(data: FormData) {
  const id = Number(data.get("id"));
  if (!Number.isSafeInteger(id) || id < 1) throw new Error("Invalid blog id.");
  const result = await likeBlog(id);
  if (result.error) throw new Error(result.error);
  await flash(result.message ?? "Like added.");
}
export async function addToReadingList(blogId: number) {
  const user = await requireUser();
  const [blog] = await getDb()
    .select({ id: blogs.id })
    .from(blogs)
    .where(eq(blogs.id, blogId));
  if (!blog) return { error: "Blog not found." };
  await getDb()
    .insert(readingList)
    .values({ userId: user.id, blogId })
    .onConflictDoNothing();
  revalidatePath("/me");
  revalidatePath(`/blogs/${blogId}`);
  return { message: "Blog saved to your reading list." };
}
export async function markRead(entryId: number) {
  const user = await requireUser();
  const updated = await getDb()
    .update(readingList)
    .set({ read: true })
    .where(and(eq(readingList.id, entryId), eq(readingList.userId, user.id)))
    .returning({ id: readingList.id });
  if (!updated.length) return { error: "Reading list entry not found." };
  revalidatePath("/me");
  return { message: "Marked as read." };
}
export async function generateToken() {
  const user = await requireUser();
  await getDb()
    .update(users)
    .set({ token: randomBytes(32).toString("hex") })
    .where(eq(users.id, user.id));
  revalidatePath("/me");
  return { message: "API token generated. Previous tokens are now invalid." };
}
