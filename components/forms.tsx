"use client";
import { useActionState, useEffect } from "react";
import { useNotification } from "./notifications";
import { login, register, saveBlog } from "@/app/actions";
import type { FormState } from "@/lib/validation";
function FormFeedback({ state }: { state: FormState }) {
  const notify = useNotification();
  useEffect(() => {
    if (state.message) notify(state.message, "error");
    else if (state.errors && Object.keys(state.errors).length)
      notify("Please correct the highlighted fields.", "error");
  }, [state, notify]);
  return null;
}
function Field({
  name,
  label,
  state,
  type = "text",
  initial = "",
  autoComplete,
}: {
  name: string;
  label: string;
  state: FormState;
  type?: string;
  initial?: string;
  autoComplete?: string;
}) {
  const error = state.errors?.[name];
  return (
    <div className="space-y-2">
      <label htmlFor={name} className="block text-sm font-semibold">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={state.values?.[name] ?? initial}
        autoComplete={autoComplete}
        aria-invalid={!!error}
        aria-describedby={error ? name + "-error" : undefined}
        className="input"
      />
      {error && (
        <p
          id={name + "-error"}
          data-testid={name + "-error"}
          role="alert"
          className="text-sm text-red-700"
        >
          {error}
        </p>
      )}
    </div>
  );
}
export function LoginForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(
    login,
    {},
  );
  return (
    <form action={action} className="space-y-5" noValidate>
      <FormFeedback state={state} />
      <Field
        name="username"
        label="Username"
        state={state}
        autoComplete="username"
      />
      <Field
        name="password"
        label="Password"
        state={state}
        type="password"
        autoComplete="current-password"
      />
      {state.message && (
        <p data-testid="error-message" role="alert" className="text-red-700">
          {state.message}
        </p>
      )}
      <button
        className="button w-full"
        data-testid="login-button"
        disabled={pending}
      >
        {pending ? "Logging in…" : "Login"}
      </button>
    </form>
  );
}
export function RegisterForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(
    register,
    {},
  );
  return (
    <form action={action} className="space-y-5" noValidate>
      <FormFeedback state={state} />
      <Field
        name="username"
        label="Username"
        state={state}
        autoComplete="username"
      />
      <Field name="name" label="Name" state={state} autoComplete="name" />
      <Field
        name="password"
        label="Password"
        state={state}
        type="password"
        autoComplete="new-password"
      />
      <Field
        name="passwordConfirm"
        label="Confirm Password"
        state={state}
        type="password"
        autoComplete="new-password"
      />
      <button
        className="button w-full"
        data-testid="register-button"
        disabled={pending}
      >
        {pending ? "Registering…" : "Register"}
      </button>
    </form>
  );
}
export function BlogForm({
  blog,
}: {
  blog?: { id: number; title: string; author: string; url: string };
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    saveBlog.bind(null, blog?.id ?? null),
    {},
  );
  return (
    <form action={action} className="space-y-5" noValidate>
      <FormFeedback state={state} />
      <Field name="title" label="Title" state={state} initial={blog?.title} />
      <Field
        name="author"
        label="Author"
        state={state}
        initial={blog?.author}
      />
      <Field
        name="url"
        label="URL"
        type="url"
        state={state}
        initial={blog?.url}
      />
      {state.message && (
        <p role="alert" data-testid="error-message" className="text-red-700">
          {state.message}
        </p>
      )}
      <button
        className="button"
        data-testid={blog ? "save-blog-button" : "create-blog-button"}
        disabled={pending}
      >
        {pending ? "Saving…" : blog ? "Save changes" : "Create"}
      </button>
    </form>
  );
}
