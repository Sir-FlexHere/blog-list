"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <section className="card">
      <h1>Something went wrong</h1>
      <p className="muted my-4">
        Please try again. If the problem continues, check the server
        configuration.
      </p>
      <button onClick={reset} className="button">
        Try again
      </button>
    </section>
  );
}
