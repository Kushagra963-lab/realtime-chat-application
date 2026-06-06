import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { fetchConversations } from "../features/chat/chatSlice.js";
import { fetchNotifications } from "../features/notifications/notificationsSlice.js";
import { useSocketEvents } from "../hooks/useSocketEvents.js";
import { ChatWindow } from "./ChatWindow.jsx";
import { NotificationsPanel } from "./NotificationsPanel.jsx";
import { Sidebar } from "./Sidebar.jsx";

export function ChatLayout() {
  const dispatch = useDispatch();
  useSocketEvents();

  useEffect(() => {
    dispatch(fetchConversations());
    dispatch(fetchNotifications());
  }, [dispatch]);

  return (
    <main className="flex h-screen min-h-0 bg-[#f6f7f9]">
      <div className="hidden min-h-0 md:flex">
        <Sidebar />
      </div>
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <div className="flex h-[42vh] min-h-0 md:hidden">
          <Sidebar />
        </div>
        <ChatWindow />
      </div>
      <NotificationsPanel />
    </main>
  );
}

