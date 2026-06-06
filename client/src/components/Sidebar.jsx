import { Bell, LogOut, MessageCirclePlus, Search, UsersRound } from "lucide-react";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../features/auth/authSlice.js";
import { createDirect, setActiveConversation } from "../features/chat/chatSlice.js";
import { toggleNotifications } from "../features/notifications/notificationsSlice.js";
import { api } from "../lib/api.js";
import { demoUsers, STATIC_DEMO } from "../lib/demo.js";
import { Avatar } from "./Avatar.jsx";
import { GroupModal } from "./GroupModal.jsx";

export function Sidebar() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { conversations, activeConversationId } = useSelector((state) => state.chat);
  const notifications = useSelector((state) => state.notifications.items);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const unread = notifications.filter((notification) => !notification.readAt).length;

  const searchUsers = async (value) => {
    setQuery(value);
    if (!value.trim()) {
      setUsers([]);
      return;
    }
    if (STATIC_DEMO) {
      const normalized = value.toLowerCase();
      setUsers(demoUsers.filter((candidate) => (
        candidate.id !== user?.id
        && `${candidate.name} ${candidate.email}`.toLowerCase().includes(normalized)
      )));
      return;
    }
    const { data } = await api.get("/users/search", { params: { q: value } });
    setUsers(data.users);
  };

  const startDirect = async (memberId) => {
    await dispatch(createDirect(memberId));
    setQuery("");
    setUsers([]);
  };

  return (
    <aside className="flex h-full min-h-0 w-full flex-col border-r border-[#d8dee6] bg-white md:w-[360px]">
      <header className="border-b border-[#e0e6ed] p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar user={user} />
            <div className="min-w-0">
              <p className="truncate font-semibold text-[#17202a]">{user?.name}</p>
              <p className="truncate text-xs text-[#657484]">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              className="relative rounded-lg p-2 hover:bg-[#edf1f5]"
              type="button"
              onClick={() => dispatch(toggleNotifications())}
              aria-label="Notifications"
              title="Notifications"
            >
              <Bell className="h-5 w-5" />
              {unread > 0 && (
                <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-[#f97316]" />
              )}
            </button>
            <button
              className="rounded-lg p-2 hover:bg-[#edf1f5]"
              type="button"
              onClick={() => dispatch(logout())}
              aria-label="Log out"
              title="Log out"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <label className="flex min-h-10 flex-1 items-center gap-2 rounded-lg border border-[#cbd5df] px-3">
            <Search className="h-4 w-4 text-[#657484]" />
            <input
              className="w-full outline-none"
              placeholder="Find people"
              value={query}
              onChange={(event) => searchUsers(event.target.value)}
            />
          </label>
          <button
            className="rounded-lg bg-[#17202a] p-2.5 text-white hover:bg-[#263545]"
            type="button"
            onClick={() => setShowGroupModal(true)}
            aria-label="New group"
            title="New group"
          >
            <UsersRound className="h-5 w-5" />
          </button>
        </div>
      </header>

      {users.length > 0 && (
        <div className="border-b border-[#e0e6ed] bg-[#f9fafb]">
          {users.map((candidate) => (
            <button
              key={candidate.id}
              className="flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-[#edf1f5]"
              type="button"
              onClick={() => startDirect(candidate.id)}
            >
              <Avatar user={candidate} size="sm" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-[#17202a]">{candidate.name}</span>
                <span className="block truncate text-xs text-[#657484]">{candidate.email}</span>
              </span>
              <MessageCirclePlus className="h-4 w-4 text-[#657484]" />
            </button>
          ))}
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-auto scrollbar-thin">
        {conversations.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-[#657484]">No conversations yet</p>
        ) : (
          conversations.map((conversation) => {
            const isActive = conversation.id === activeConversationId;
            const peer = conversation.type === "direct"
              ? conversation.members.find((member) => member.user?.id !== user?.id)?.user
              : null;

            return (
              <button
                key={conversation.id}
                className={`flex w-full items-center gap-3 border-b border-[#edf1f5] px-4 py-3 text-left transition ${
                  isActive ? "bg-[#e6f2f3]" : "hover:bg-[#f6f7f9]"
                }`}
                type="button"
                onClick={() => dispatch(setActiveConversation(conversation.id))}
              >
                <Avatar user={peer} label={conversation.name} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate font-medium text-[#17202a]">{conversation.name}</span>
                    {peer?.status === "online" && (
                      <span className="h-2 w-2 rounded-full bg-[#16a34a]" />
                    )}
                  </span>
                  <span className="block truncate text-sm text-[#657484]">
                    {conversation.lastMessage?.body ?? "Start the conversation"}
                  </span>
                </span>
                {conversation.unreadCount > 0 && (
                  <span className="rounded-lg bg-[#f97316] px-2 py-0.5 text-xs font-semibold text-white">
                    {conversation.unreadCount}
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>

      {showGroupModal && <GroupModal onClose={() => setShowGroupModal(false)} />}
    </aside>
  );
}
