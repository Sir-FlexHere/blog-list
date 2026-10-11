import Link from "next/link";
export default function NotFound() {
  return (
    <section className="card">
      <h1>Page not found</h1>
      <p className="muted my-4">This page may have been removed.</p>
      <Link href="/blogs" className="button">
        Explore blogs
      </Link>
    </section>
  );
}
