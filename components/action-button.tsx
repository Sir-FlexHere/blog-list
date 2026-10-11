"use client";
import { useTransition } from "react";
import { useNotification } from "./notifications";
export function ActionButton({
  action,
  children,
  testId,
  className = "button",
}: {
  action: () => Promise<{ message?: string; error?: string } | void>;
  children: React.ReactNode;
  testId?: string;
  className?: string;
}) {
  const [pending, startTransition] = useTransition();
  const notify = useNotification();
  return (
    <button
      className={className}
      data-testid={testId}
      disabled={pending}
      aria-busy={pending}
      onClick={() =>
        startTransition(async () => {
          try {
            const result = await action();
            if (result?.error) notify(result.error, "error");
            else if (result?.message) notify(result.message);
          } catch (error) {
            if (error instanceof Error && error.message === "NEXT_REDIRECT")
              throw error;
            notify("The operation failed. Please try again.", "error");
          }
        })
      }
    >
      {pending ? "Working…" : children}
    </button>
  );
}
