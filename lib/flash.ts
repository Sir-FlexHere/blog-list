import "server-only";
import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";
export async function flash(message: string) {
  (await cookies()).set(
    "blog-notification",
    JSON.stringify({ id: randomUUID(), message }),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 10,
    },
  );
}
