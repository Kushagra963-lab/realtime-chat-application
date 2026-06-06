import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice.js";
import chatReducer from "../features/chat/chatSlice.js";
import notificationsReducer from "../features/notifications/notificationsSlice.js";
import { DEMO_STORAGE_KEY, STATIC_DEMO } from "../lib/demo.js";

function readDemoState() {
  if (!STATIC_DEMO) return undefined;

  try {
    const saved = localStorage.getItem(DEMO_STORAGE_KEY);
    if (!saved) return undefined;
    const parsed = JSON.parse(saved);
    if (parsed?.version !== 3) return undefined;
    return {
      chat: parsed.chat,
      notifications: parsed.notifications
    };
  } catch {
    return undefined;
  }
}

export const store = configureStore({
  reducer: {
    auth: authReducer,
    chat: chatReducer,
    notifications: notificationsReducer
  },
  preloadedState: readDemoState()
});

if (STATIC_DEMO) {
  store.subscribe(() => {
    const state = store.getState();
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify({
      version: 3,
      chat: state.chat,
      notifications: state.notifications
    }));
  });
}
