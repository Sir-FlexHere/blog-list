import { cookies } from "next/headers";
import { FlashNotice } from "./notifications";
export async function ServerFlash() {
  const value = (await cookies()).get("blog-notification")?.value;
  let notice: { id: string; message: string } | null = null;
  try {
    if (value) notice = JSON.parse(value);
  } catch {
    /* Ignore malformed cookies. */
  }
  return <FlashNotice notice={notice} />;
}
