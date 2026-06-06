import { Search, Send, UsersRound } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  addOptimisticMessage,
  clearUnread,
  fetchMessages,
  markMessageFailed,
  receiveMessage,
  searchMessages
} from "../features/chat/chatSlice.js";
import { STATIC_DEMO } from "../lib/demo.js";
import { getSocket } from "../lib/socket.js";
import { Avatar } from "./Avatar.jsx";

function messageTime(value) {
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function ChatWindow() {
  const dispatch = useDispatch();
  const listRef = useRef(null);
  const typingTimer = useRef(null);
  const { user } = useSelector((state) => state.auth);
  const {
    activeConversationId,
    conversations,
    messagesByConversation,
    searchResults,
    typingByConversation
  } = useSelector((state) => state.chat);
  const [body, setBody] = useState("");
  const [search, setSearch] = useState("");
  const [latency, setLatency] = useState(null);

  const conversation = conversations.find((item) => item.id === activeConversationId);
  const messages = messagesByConversation[activeConversationId] ?? [];

  const typingUsers = useMemo(() => {
    const typing = typingByConversation[activeConversationId] ?? {};
    return Object.keys(typing)
      .filter((userId) => userId !== user?.id)
      .map((userId) => conversation?.members.find((member) => member.user?.id === userId)?.user?.name)
      .filter(Boolean);
  }, [activeConversationId, conversation, typingByConversation, user?.id]);

  useEffect(() => {
    if (activeConversationId) {
      dispatch(fetchMessages(activeConversationId));
      dispatch(clearUnread(activeConversationId));
      const socket = getSocket();
      socket?.emit("conversation:join", { conversationId: activeConversationId });
    }
  }, [activeConversationId, dispatch]);

  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth"
    });
  }, [messages.length, activeConversationId]);

  const submit = (event) => {
    event.preventDefault();
    const trimmed = body.trim();
    if (!trimmed || !activeConversationId) return;

    const socket = getSocket();
    const clientId = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const optimisticMessage = {
      id: clientId,
      clientId,
      conversation: activeConversationId,
      sender: user,
      body: trimmed,
      createdAt,
      updatedAt: createdAt,
      optimistic: true
    };

    dispatch(addOptimisticMessage({
      conversationId: activeConversationId,
      message: optimisticMessage
    }));
    setBody("");
    setLatency(null);
    socket?.emit("typing:stop", { conversationId: activeConversationId });

    if (STATIC_DEMO) {
      window.setTimeout(() => {
        setLatency(42);
        dispatch(receiveMessage({
          conversationId: activeConversationId,
          clientId,
          message: {
            ...optimisticMessage,
            id: `demo-${clientId}`,
            optimistic: false
          }
        }));
      }, 90);
      return;
    }

    const sentAt = performance.now();
    socket?.emit(
      "message:send",
      { conversationId: activeConversationId, body: trimmed, clientId },
      (ack) => {
        setLatency(Math.round(performance.now() - sentAt));
        if (!ack?.ok) {
          dispatch(markMessageFailed({ conversationId: activeConversationId, clientId }));
          return;
        }
        dispatch(receiveMessage({
          conversationId: activeConversationId,
          clientId,
          message: ack.message
        }));
      }
    );
  };

  const onBodyChange = (value) => {
    setBody(value);
    const socket = getSocket();
    if (!activeConversationId || !socket) return;
    socket.emit("typing:start", { conversationId: activeConversationId });
    window.clearTimeout(typingTimer.current);
    typingTimer.current = window.setTimeout(() => {
      socket.emit("typing:stop", { conversationId: activeConversationId });
    }, 900);
  };

  const runSearch = (event) => {
    event.preventDefault();
    dispatch(searchMessages(search));
  };

  if (!conversation) {
    return (
      <section className="grid h-full min-h-0 flex-1 place-items-center bg-[#f6f7f9] p-6">
        <div className="max-w-sm text-center">
          <UsersRound className="mx-auto h-10 w-10 text-[#657484]" />
          <h2 className="mt-3 text-lg font-semibold text-[#17202a]">Select a conversation</h2>
        </div>
      </section>
    );
  }

  return (
    <section className="flex h-full min-h-0 flex-1 flex-col bg-[#f6f7f9]">
      <header className="border-b border-[#d8dee6] bg-white px-4 py-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold text-[#17202a]">{conversation.name}</h1>
            <p className="truncate text-sm text-[#657484]">
              {conversation.members.length} member{conversation.members.length === 1 ? "" : "s"}
              {latency !== null ? ` · ${latency} ms ack` : ""}
            </p>
          </div>

          <form className="flex min-h-10 w-full items-center gap-2 rounded-lg border border-[#cbd5df] px-3 lg:w-[360px]" onSubmit={runSearch}>
            <Search className="h-4 w-4 text-[#657484]" />
            <input
              className="w-full bg-transparent outline-none"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search messages"
            />
          </form>
        </div>

        {searchResults.length > 0 && (
          <div className="mt-3 grid gap-2 border-t border-[#edf1f5] pt-3">
            {searchResults.slice(0, 4).map((message) => (
              <button
                key={message.id}
                className="truncate rounded-lg bg-[#edf1f5] px-3 py-2 text-left text-sm text-[#465564] hover:bg-[#e0e6ed]"
                type="button"
              >
                {message.sender?.name}: {message.body}
              </button>
            ))}
          </div>
        )}
      </header>

      <div ref={listRef} className="min-h-0 flex-1 overflow-auto px-4 py-5 scrollbar-thin">
        <div className="mx-auto flex max-w-4xl flex-col gap-3">
          {messages.map((message) => {
            const mine = message.sender?.id === user?.id;
            return (
              <article key={message.id} className={`flex gap-3 ${mine ? "justify-end" : "justify-start"}`}>
                {!mine && <Avatar user={message.sender} size="sm" />}
                <div className={`max-w-[min(72%,680px)] rounded-lg px-3 py-2 shadow-sm ${
                  mine ? "bg-[#1f6f78] text-white" : "border border-[#e0e6ed] bg-white text-[#17202a]"
                }`}>
                  {!mine && (
                    <p className="mb-1 text-xs font-semibold text-[#1f6f78]">{message.sender?.name}</p>
                  )}
                  <p className="whitespace-pre-wrap break-words text-sm leading-6">{message.body}</p>
                  <p className={`mt-1 text-right text-[11px] ${mine ? "text-white/75" : "text-[#657484]"}`}>
                    {message.failed ? "Failed" : message.optimistic ? "Sending" : messageTime(message.createdAt)}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <footer className="border-t border-[#d8dee6] bg-white px-4 py-3">
        <div className="mx-auto max-w-4xl">
          <div className="mb-2 h-5 text-sm text-[#657484]">
            {typingUsers.length > 0 ? `${typingUsers.join(", ")} typing` : ""}
          </div>
          <form className="flex items-end gap-3" onSubmit={submit}>
            <textarea
              className="max-h-36 min-h-12 flex-1 resize-none rounded-lg border border-[#cbd5df] px-3 py-3 outline-none focus:border-[#1f6f78]"
              value={body}
              onChange={(event) => onBodyChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  submit(event);
                }
              }}
              rows={1}
            />
            <button
              className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-[#17202a] text-white hover:bg-[#263545] disabled:cursor-not-allowed disabled:opacity-60"
              type="submit"
              disabled={!body.trim()}
              aria-label="Send"
              title="Send"
            >
              <Send className="h-5 w-5" />
            </button>
          </form>
        </div>
      </footer>
    </section>
  );
}
