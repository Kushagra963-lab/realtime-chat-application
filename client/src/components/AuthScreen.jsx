import { useState } from "react";
import { Chrome, Loader2, Lock, Mail, UserRound } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { getGoogleOAuthUrl } from "../lib/api.js";
import { login, register } from "../features/auth/authSlice.js";

export function AuthScreen() {
  const dispatch = useDispatch();
  const { status, error } = useSelector((state) => state.auth);
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });

  const isRegister = mode === "register";
  const isLoading = status === "loading";

  const submit = (event) => {
    event.preventDefault();
    const action = isRegister ? register(form) : login({
      email: form.email,
      password: form.password
    });
    dispatch(action);
  };

  return (
    <main className="grid min-h-screen place-items-center bg-[#f6f7f9] px-4 py-8">
      <section className="w-full max-w-md rounded-lg border border-[#d8dee6] bg-white p-6 shadow-sm">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-[#1f6f78]">Realtime Chat</p>
          <h1 className="mt-2 text-2xl font-semibold text-[#17202a]">
            {isRegister ? "Create your workspace" : "Welcome back"}
          </h1>
        </div>

        <form className="space-y-4" onSubmit={submit}>
          {isRegister && (
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-[#465564]">Name</span>
              <span className="flex items-center gap-2 rounded-lg border border-[#cbd5df] bg-white px-3">
                <UserRound className="h-4 w-4 text-[#657484]" />
                <input
                  className="min-h-11 w-full outline-none"
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  required
                  autoComplete="name"
                />
              </span>
            </label>
          )}

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-[#465564]">Email</span>
            <span className="flex items-center gap-2 rounded-lg border border-[#cbd5df] bg-white px-3">
              <Mail className="h-4 w-4 text-[#657484]" />
              <input
                className="min-h-11 w-full outline-none"
                type="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                required
                autoComplete="email"
              />
            </span>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-[#465564]">Password</span>
            <span className="flex items-center gap-2 rounded-lg border border-[#cbd5df] bg-white px-3">
              <Lock className="h-4 w-4 text-[#657484]" />
              <input
                className="min-h-11 w-full outline-none"
                type="password"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                required
                minLength={8}
                autoComplete={isRegister ? "new-password" : "current-password"}
              />
            </span>
          </label>

          {error && (
            <p className="rounded-lg bg-[#fde8e8] px-3 py-2 text-sm text-[#9b1c1c]">{error}</p>
          )}

          <button
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#17202a] px-4 font-semibold text-white transition hover:bg-[#263545] disabled:cursor-not-allowed disabled:opacity-70"
            type="submit"
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isRegister ? "Create Account" : "Sign In"}
          </button>
        </form>

        <a
          className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-[#cbd5df] bg-white px-4 font-semibold text-[#17202a] transition hover:bg-[#f1f4f7]"
          href={getGoogleOAuthUrl()}
        >
          <Chrome className="h-4 w-4" />
          Google
        </a>

        <button
          className="mt-5 w-full text-center text-sm font-medium text-[#1f6f78]"
          type="button"
          onClick={() => setMode(isRegister ? "login" : "register")}
        >
          {isRegister ? "Use an existing account" : "Create a new account"}
        </button>
      </section>
    </main>
  );
}

