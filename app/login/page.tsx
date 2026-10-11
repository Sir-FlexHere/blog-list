import Link from "next/link";
import { LoginForm } from "@/components/forms";
export default function LoginPage() {
  return (
    <section className="mx-auto max-w-md">
      <p className="eyebrow">WELCOME BACK</p>
      <h1>Login</h1>
      <p className="muted mb-8">Your next read is waiting.</p>
      <div className="card">
        <LoginForm />
        <p className="mt-6 text-sm muted">
          New here?{" "}
          <Link href="/register" className="text-emerald-700 underline">
            Create an account
          </Link>
        </p>
      </div>
    </section>
  );
}
