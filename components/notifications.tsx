"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
type Notice = { message: string; kind: "success" | "error" };
const NotificationContext = createContext<
  (message: string, kind?: Notice["kind"]) => void
>(() => {});
export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [notice, setNotice] = useState<Notice | null>(null);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notify = useCallback(
    (message: string, kind: Notice["kind"] = "success") => {
      if (timeout.current) clearTimeout(timeout.current);
      setNotice({ message, kind });
      timeout.current = setTimeout(() => setNotice(null), 6000);
    },
    [],
  );
  useEffect(
    () => () => {
      if (timeout.current) clearTimeout(timeout.current);
    },
    [],
  );
  return (
    <NotificationContext.Provider value={notify}>
      {notice && (
        <div
          role={notice.kind === "error" ? "alert" : "status"}
          data-testid="notification"
          className={
            "fixed right-4 top-4 z-50 max-w-sm rounded-xl border p-4 shadow-lg " +
            (notice.kind === "error"
              ? "border-red-200 bg-red-50 text-red-900"
              : "border-emerald-200 bg-emerald-50 text-emerald-950")
          }
        >
          {notice.message}
          <button
            aria-label="Dismiss notification"
            className="ml-4 text-current"
            onClick={() => setNotice(null)}
          >
            ×
          </button>
        </div>
      )}
      {children}
    </NotificationContext.Provider>
  );
}
export const useNotification = () => useContext(NotificationContext);
export function FlashNotice({
  notice,
}: {
  notice: { id: string; message: string } | null;
}) {
  const notify = useNotification();
  useEffect(() => {
    if (notice && sessionStorage.getItem("last-blog-notice") !== notice.id) {
      sessionStorage.setItem("last-blog-notice", notice.id);
      notify(notice.message);
    }
  }, [notice, notify]);
  return null;
}
