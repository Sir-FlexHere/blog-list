import { hash } from "bcryptjs";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { validateUser } from "@/lib/validation";
export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production")
    return Response.json({ error: "Forbidden" }, { status: 403 });
  if (process.env.ALLOW_TEST_RESET !== "true")
    return Response.json(
      { error: "Testing endpoints disabled" },
      { status: 403 },
    );
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (
    !body ||
    typeof body !== "object" ||
    !("username" in body) ||
    !("name" in body) ||
    !("password" in body) ||
    typeof body.username !== "string" ||
    typeof body.name !== "string" ||
    typeof body.password !== "string"
  )
    return Response.json(
      { error: "username, name and password are required" },
      { status: 400 },
    );
  const values = { username: body.username.trim(), name: body.name.trim() };
  const errors = validateUser(values, body.password, body.password);
  if (Object.keys(errors).length)
    return Response.json({ errors }, { status: 400 });
  const [user] = await getDb()
    .insert(users)
    .values({ ...values, passwordHash: await hash(body.password, 12) })
    .onConflictDoNothing()
    .returning({ id: users.id, username: users.username, name: users.name });
  if (!user)
    return Response.json(
      { error: "Username is already taken" },
      { status: 409 },
    );
  return Response.json(user, { status: 201 });
}
