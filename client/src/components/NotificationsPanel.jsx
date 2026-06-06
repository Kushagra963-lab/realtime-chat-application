import { Bell, CheckCheck, X } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { closeNotifications, markAllNotificationsRead } from "../features/notifications/notificationsSlice.js";

export function NotificationsPanel() {
  const dispatch = useDispatch();
  const { items, open } = useSelector((state) => state.notifications);
  const unread = items.filter((item) => !item.readAt).length;

  if (!open) {
    return null;
  }

  return (
    <aside className="fixed right-4 top-4 z-20 flex max-h-[calc(100vh-2rem)] w-[min(380px,calc(100vw-2rem))] flex-col rounded-lg border border-[#d8dee6] bg-white shadow-xl">
      <header className="flex items-center justify-between border-b border-[#e0e6ed] px-4 py-3">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-[#1f6f78]" />
          <h2 className="font-semibold text-[#17202a]">Notifications</h2>
          {unread > 0 && (
            <span className="rounded-lg bg-[#f97316] px-2 py-0.5 text-xs font-semibold text-white">{unread}</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            className="rounded-lg p-2 hover:bg-[#edf1f5]"
            type="button"
            onClick={() => dispatch(markAllNotificationsRead())}
            aria-label="Mark all read"
            title="Mark all read"
          >
            <CheckCheck className="h-4 w-4" />
          </button>
          <button
            className="rounded-lg p-2 hover:bg-[#edf1f5]"
            type="button"
            onClick={() => dispatch(closeNotifications())}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-auto scrollbar-thin">
        {items.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-[#657484]">No notifications</p>
        ) : (
          items.map((item) => (
            <article key={item.id} className="border-b border-[#edf1f5] px-4 py-3 last:border-b-0">
              <div className="flex items-start gap-3">
                <span className={`mt-1 h-2 w-2 rounded-full ${item.readAt ? "bg-[#cbd5df]" : "bg-[#f97316]"}`} />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-3 text-sm text-[#17202a]">{item.text}</p>
                  <time className="mt-1 block text-xs text-[#657484]">
                    {new Date(item.createdAt).toLocaleString()}
                  </time>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </aside>
  );
}

