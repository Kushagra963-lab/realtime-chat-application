import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api } from "../../lib/api.js";
import {
  createDemoConversation,
  createDemoDirect,
  demoConversations,
  demoMessages,
  searchDemoMessages,
  STATIC_DEMO
} from "../../lib/demo.js";

export const fetchConversations = createAsyncThunk("chat/fetchConversations", async () => {
  if (STATIC_DEMO) {
    return demoConversations;
  }
  const { data } = await api.get("/conversations");
  return data.conversations;
});

export const fetchMessages = createAsyncThunk("chat/fetchMessages", async (conversationId) => {
  if (STATIC_DEMO) {
    return { conversationId, messages: demoMessages[conversationId] ?? [] };
  }
  const { data } = await api.get(`/conversations/${conversationId}/messages`);
  return { conversationId, messages: data.messages };
});

export const createGroup = createAsyncThunk("chat/createGroup", async (payload) => {
  if (STATIC_DEMO) {
    return createDemoConversation(payload);
  }
  const { data } = await api.post("/conversations/groups", payload);
  return data.conversation;
});

export const createDirect = createAsyncThunk("chat/createDirect", async (memberId) => {
  if (STATIC_DEMO) {
    return createDemoDirect(memberId);
  }
  const { data } = await api.post("/conversations/direct", { memberId });
  return data.conversation;
});

export const searchMessages = createAsyncThunk("chat/searchMessages", async (q) => {
  if (STATIC_DEMO) {
    return searchDemoMessages(q);
  }
  const { data } = await api.get("/messages/search", { params: { q } });
  return data.messages;
});

const upsertById = (items, item) => {
  const index = items.findIndex((candidate) => candidate.id === item.id);
  if (index >= 0) {
    items[index] = { ...items[index], ...item };
  } else {
    items.unshift(item);
  }
};

const chatSlice = createSlice({
  name: "chat",
  initialState: {
    conversations: [],
    activeConversationId: null,
    messagesByConversation: {},
    searchResults: [],
    typingByConversation: {},
    presenceByUser: {},
    status: "idle",
    error: ""
  },
  reducers: {
    setActiveConversation(state, action) {
      state.activeConversationId = action.payload;
    },
    addOptimisticMessage(state, action) {
      const { conversationId, message } = action.payload;
      state.messagesByConversation[conversationId] ??= [];
      state.messagesByConversation[conversationId].push(message);
      const conversation = state.conversations.find((item) => item.id === conversationId);
      if (conversation) {
        conversation.lastMessage = {
          body: message.body,
          sender: message.sender?.id,
          createdAt: message.createdAt
        };
        conversation.updatedAt = message.createdAt;
      }
    },
    receiveMessage(state, action) {
      const { conversationId, message, clientId } = action.payload;
      state.messagesByConversation[conversationId] ??= [];
      const messages = state.messagesByConversation[conversationId];
      const optimisticIndex = messages.findIndex((item) => item.clientId && item.clientId === clientId);

      if (optimisticIndex >= 0) {
        messages[optimisticIndex] = message;
      } else if (!messages.some((item) => item.id === message.id)) {
        messages.push(message);
      }

      const conversation = state.conversations.find((item) => item.id === conversationId);
      if (conversation) {
        conversation.lastMessage = {
          body: message.body,
          sender: message.sender?.id,
          createdAt: message.createdAt
        };
        conversation.updatedAt = message.createdAt;
        if (state.activeConversationId !== conversationId) {
          conversation.unreadCount = (conversation.unreadCount ?? 0) + 1;
        }
      }
    },
    markMessageFailed(state, action) {
      const { conversationId, clientId } = action.payload;
      const message = state.messagesByConversation[conversationId]?.find((item) => item.clientId === clientId);
      if (message) {
        message.failed = true;
      }
    },
    setTyping(state, action) {
      const { conversationId, userId, isTyping } = action.payload;
      state.typingByConversation[conversationId] ??= {};
      if (isTyping) {
        state.typingByConversation[conversationId][userId] = true;
      } else {
        delete state.typingByConversation[conversationId][userId];
      }
    },
    updatePresence(state, action) {
      const { userId, status, lastSeen } = action.payload;
      state.presenceByUser[userId] = { status, lastSeen };
      state.conversations.forEach((conversation) => {
        conversation.members.forEach((member) => {
          if (member.user?.id === userId) {
            member.user.status = status;
            member.user.lastSeen = lastSeen;
          }
        });
      });
    },
    clearUnread(state, action) {
      const conversation = state.conversations.find((item) => item.id === action.payload);
      if (conversation) {
        conversation.unreadCount = 0;
      }
    },
    resetChatState() {
      return chatSlice.getInitialState();
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchConversations.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.status = "ready";
        state.conversations = action.payload;
        if (!state.activeConversationId && action.payload[0]) {
          state.activeConversationId = action.payload[0].id;
        }
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.status = "error";
        state.error = action.error.message;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.messagesByConversation[action.payload.conversationId] = action.payload.messages;
      })
      .addCase(createGroup.fulfilled, (state, action) => {
        upsertById(state.conversations, action.payload);
        state.activeConversationId = action.payload.id;
      })
      .addCase(createDirect.fulfilled, (state, action) => {
        upsertById(state.conversations, action.payload);
        state.activeConversationId = action.payload.id;
      })
      .addCase(searchMessages.fulfilled, (state, action) => {
        state.searchResults = action.payload;
      });
  }
});

export const {
  addOptimisticMessage,
  clearUnread,
  markMessageFailed,
  receiveMessage,
  resetChatState,
  setActiveConversation,
  setTyping,
  updatePresence
} = chatSlice.actions;

export default chatSlice.reducer;
