import { getDb } from "@/db";
import { blogs, readingList, users } from "@/db/schema";
export async function DELETE() {
  if (process.env.NODE_ENV === "production")
    return Response.json({ error: "Forbidden" }, { status: 403 });
  if (process.env.ALLOW_TEST_RESET !== "true")
    return Response.json(
      {
        error:
          "Testing endpoints require ALLOW_TEST_RESET=true on an isolated test database.",
      },
      { status: 403 },
    );
  await getDb().transaction(async (tx) => {
    await tx.delete(readingList);
    await tx.delete(blogs);
    await tx.delete(users);
  });
  return Response.json({ message: "Database reset" });
}
