import { useState } from "react";
import { Search, UsersRound, X } from "lucide-react";
import { useDispatch } from "react-redux";
import { api } from "../lib/api.js";
import { createGroup } from "../features/chat/chatSlice.js";
import { Avatar } from "./Avatar.jsx";

export function GroupModal({ onClose }) {
  const dispatch = useDispatch();
  const [name, setName] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState([]);

  const search = async (value) => {
    setQuery(value);
    if (!value.trim()) {
      setResults([]);
      return;
    }
    const { data } = await api.get("/users/search", { params: { q: value } });
    setResults(data.users);
  };

  const toggle = (user) => {
    setSelected((items) => (
      items.some((item) => item.id === user.id)
        ? items.filter((item) => item.id !== user.id)
        : [...items, user]
    ));
  };

  const submit = async (event) => {
    event.preventDefault();
    await dispatch(createGroup({
      name,
      memberIds: selected.map((user) => user.id)
    }));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-30 grid place-items-center bg-black/30 px-4">
      <section className="w-full max-w-lg rounded-lg bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#17202a]">New group</h2>
          <button className="rounded-lg p-2 hover:bg-[#edf1f5]" type="button" onClick={onClose} aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-[#465564]">Group name</span>
            <span className="flex items-center gap-2 rounded-lg border border-[#cbd5df] px-3">
              <UsersRound className="h-4 w-4 text-[#657484]" />
              <input
                className="min-h-11 w-full outline-none"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </span>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-[#465564]">Members</span>
            <span className="flex items-center gap-2 rounded-lg border border-[#cbd5df] px-3">
              <Search className="h-4 w-4 text-[#657484]" />
              <input
                className="min-h-11 w-full outline-none"
                value={query}
                onChange={(event) => search(event.target.value)}
              />
            </span>
          </label>

          {selected.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selected.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => toggle(user)}
                  className="rounded-lg bg-[#e6f2f3] px-2 py-1 text-sm font-medium text-[#195b63]"
                >
                  {user.name}
                </button>
              ))}
            </div>
          )}

          <div className="max-h-52 overflow-auto rounded-lg border border-[#e0e6ed] scrollbar-thin">
            {results.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => toggle(user)}
                className="flex w-full items-center gap-3 border-b border-[#edf1f5] px-3 py-2 text-left last:border-b-0 hover:bg-[#f6f7f9]"
              >
                <Avatar user={user} size="sm" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-[#17202a]">{user.name}</span>
                  <span className="block truncate text-xs text-[#657484]">{user.email}</span>
                </span>
              </button>
            ))}
          </div>

          <button
            className="min-h-11 w-full rounded-lg bg-[#17202a] px-4 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            disabled={!name.trim()}
          >
            Create Group
          </button>
        </form>
      </section>
    </div>
  );
}

