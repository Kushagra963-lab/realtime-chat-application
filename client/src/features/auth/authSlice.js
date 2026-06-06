import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api, setAuthToken } from "../../lib/api.js";
import { demoUser, STATIC_DEMO } from "../../lib/demo.js";
import { disconnectSocket } from "../../lib/socket.js";

const token = localStorage.getItem("chat_token");

export const register = createAsyncThunk("auth/register", async (payload) => {
  if (STATIC_DEMO) {
    return { user: { ...demoUser, name: payload.name || demoUser.name, email: payload.email }, token: "demo-token" };
  }
  const { data } = await api.post("/auth/register", payload);
  return data;
});

export const login = createAsyncThunk("auth/login", async (payload) => {
  if (STATIC_DEMO) {
    return { user: { ...demoUser, email: payload.email || demoUser.email }, token: "demo-token" };
  }
  const { data } = await api.post("/auth/login", payload);
  return data;
});

export const fetchMe = createAsyncThunk("auth/fetchMe", async () => {
  if (STATIC_DEMO) {
    return { user: demoUser };
  }
  const { data } = await api.get("/auth/me");
  return data;
});

const authSlice = createSlice({
  name: "auth",
  initialState: {
    token: STATIC_DEMO ? "demo-token" : token,
    user: STATIC_DEMO ? demoUser : null,
    status: STATIC_DEMO ? "authenticated" : token ? "loading" : "idle",
    error: ""
  },
  reducers: {
    acceptOAuthToken(state, action) {
      state.token = action.payload;
      state.status = "loading";
      state.error = "";
      setAuthToken(action.payload);
    },
    logout(state) {
      state.token = null;
      state.user = null;
      state.status = "idle";
      state.error = "";
      setAuthToken(null);
      disconnectSocket();
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(register.pending, (state) => {
        state.status = "loading";
        state.error = "";
      })
      .addCase(register.fulfilled, (state, action) => {
        state.status = "authenticated";
        state.user = action.payload.user;
        state.token = action.payload.token;
        setAuthToken(action.payload.token);
      })
      .addCase(register.rejected, (state, action) => {
        state.status = "error";
        state.error = action.error.message;
      })
      .addCase(login.pending, (state) => {
        state.status = "loading";
        state.error = "";
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = "authenticated";
        state.user = action.payload.user;
        state.token = action.payload.token;
        setAuthToken(action.payload.token);
      })
      .addCase(login.rejected, (state, action) => {
        state.status = "error";
        state.error = action.error.message;
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.status = "authenticated";
        state.user = action.payload.user;
      })
      .addCase(fetchMe.rejected, (state) => {
        state.status = "idle";
        state.user = null;
        state.token = null;
        setAuthToken(null);
      });
  }
});

export const { acceptOAuthToken, logout } = authSlice.actions;
export default authSlice.reducer;
