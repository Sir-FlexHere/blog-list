import "server-only";
import { cache } from "react";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/db";
import { users } from "@/db/schema";

export const currentUser = cache(async () => {
  await connection();
  const session = await auth();
  const id = Number(session?.user?.id);
  if (!Number.isSafeInteger(id) || id < 1) return null;
  const [user] = await getDb()
    .select({
      id: users.id,
      name: users.name,
      username: users.username,
      token: users.token,
    })
    .from(users)
    .where(eq(users.id, id));
  return user ?? null;
});
export async function requireUser() {
  const user = await currentUser();
  if (!user) redirect("/login");
  return user;
}
