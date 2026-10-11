import { RegisterForm } from "@/components/forms";
export default function RegisterPage() {
  return (
    <section className="mx-auto max-w-md">
      <p className="eyebrow">JOIN THE COMMUNITY</p>
      <h1>Register</h1>
      <p className="muted mb-8">
        Save great writing and share your discoveries.
      </p>
      <div className="card">
        <RegisterForm />
      </div>
    </section>
  );
}
