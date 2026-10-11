import Link from "next/link";
import { currentUser } from "@/lib/current-user";
import { logout } from "@/app/actions";
export async function Navigation() {
  const user = await currentUser();
  return (
    <nav
      aria-label="Main navigation"
      className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-3 px-6 py-5 text-sm"
    >
      <Link
        href="/"
        aria-label="home"
        className="mr-auto text-lg font-bold tracking-tight"
      >
        Blog List<span className="text-emerald-700">.</span>
      </Link>
      <Link href="/blogs">blogs</Link>
      <Link href="/users">users</Link>
      {user ? (
        <>
          <Link href="/blogs/new">new blog</Link>
          <Link href="/me">me</Link>
          <form action={logout}>
            <button className="font-semibold text-slate-600">Logout</button>
          </form>
        </>
      ) : (
        <>
          <Link href="/login">login</Link>
          <Link href="/register">register</Link>
        </>
      )}
    </nav>
  );
}
