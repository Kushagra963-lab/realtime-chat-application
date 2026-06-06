export function Avatar({ user, label, size = "md" }) {
  const display = user?.name ?? label ?? "User";
  const initials = display
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const sizeClass = size === "sm" ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm";

  if (user?.avatarUrl) {
    return (
      <img
        alt=""
        src={user.avatarUrl}
        className={`${sizeClass} rounded-lg object-cover`}
      />
    );
  }

  return (
    <div className={`${sizeClass} grid shrink-0 place-items-center rounded-lg bg-[#1f6f78] font-semibold text-white`}>
      {initials}
    </div>
  );
}

