import { Suspense } from "react";
import type { Metadata } from "next";
import { Navigation } from "@/components/navigation";
import { NotificationProvider } from "@/components/notifications";
import { ServerFlash } from "@/components/server-flash";
import "./globals.css";
export const metadata: Metadata = {
  title: { default: "Blog List", template: "%s | Blog List" },
  description: "Discover thoughtful writing and keep a personal reading list.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <NotificationProvider>
          <a href="#main" className="sr-only focus:not-sr-only">
            Skip to content
          </a>
          <header className="border-b border-slate-200 bg-white">
            <Suspense fallback={<div className="h-20" />}>
              <Navigation />
            </Suspense>
          </header>
          <Suspense fallback={null}>
            <ServerFlash />
          </Suspense>
          <main id="main" className="mx-auto max-w-5xl px-6 py-12">
            {children}
          </main>
          <footer className="mx-auto max-w-5xl border-t border-slate-200 px-6 py-8 text-sm text-slate-500">
            A place for good writing. Built with Next.js & PostgreSQL.
          </footer>
        </NotificationProvider>
      </body>
    </html>
  );
}
