import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api } from "../../lib/api.js";
import { demoNotifications, STATIC_DEMO } from "../../lib/demo.js";

export const fetchNotifications = createAsyncThunk("notifications/fetch", async () => {
  if (STATIC_DEMO) {
    return demoNotifications;
  }
  const { data } = await api.get("/notifications");
  return data.notifications;
});

export const markAllNotificationsRead = createAsyncThunk("notifications/readAll", async () => {
  if (STATIC_DEMO) {
    return demoNotifications.length;
  }
  const { data } = await api.patch("/notifications/read-all");
  return data.updated;
});

const notificationsSlice = createSlice({
  name: "notifications",
  initialState: {
    items: [],
    open: false
  },
  reducers: {
    toggleNotifications(state) {
      state.open = !state.open;
    },
    closeNotifications(state) {
      state.open = false;
    },
    receiveNotification(state, action) {
      if (!state.items.some((item) => item.id === action.payload.id)) {
        state.items.unshift(action.payload);
      }
    },
    resetNotifications() {
      return notificationsSlice.getInitialState();
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.items = action.payload;
      })
      .addCase(markAllNotificationsRead.fulfilled, (state) => {
        state.items = state.items.map((item) => ({
          ...item,
          readAt: item.readAt ?? new Date().toISOString()
        }));
      });
  }
});

export const {
  closeNotifications,
  receiveNotification,
  resetNotifications,
  toggleNotifications
} = notificationsSlice.actions;

export default notificationsSlice.reducer;
