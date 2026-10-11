import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { users } from "@/db/schema";
export async function GET(request: Request) {
  const match = /^Bearer ([a-f0-9]{64})$/i.exec(
    request.headers.get("authorization") ?? "",
  );
  if (!match) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const [user] = await getDb()
    .select({ id: users.id, username: users.username, name: users.name })
    .from(users)
    .where(eq(users.token, match[1]));
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return Response.json(user, { headers: { "Cache-Control": "no-store" } });
}
