export function serializeUser(user) {
  if (!user) return null;
  if (typeof user.toPublicJSON === "function") {
    return user.toPublicJSON();
  }
  return {
    id: user._id?.toString() ?? user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl ?? "",
    status: user.status ?? "offline",
    lastSeen: user.lastSeen,
    provider: user.provider
  };
}

export function serializeConversation(conversation, currentUserId, unreadCount = 0) {
  const currentId = currentUserId?.toString();
  const members = conversation.members.map((member) => ({
    user: serializeUser(member.user),
    role: member.role,
    mutedUntil: member.mutedUntil,
    joinedAt: member.joinedAt
  }));

  const directPeer = conversation.type === "direct"
    ? members.find((member) => member.user?.id !== currentId)?.user
    : null;

  return {
    id: conversation._id.toString(),
    type: conversation.type,
    name: conversation.type === "direct" ? directPeer?.name ?? "Direct message" : conversation.name,
    avatarUrl: conversation.type === "direct" ? directPeer?.avatarUrl ?? "" : conversation.avatarUrl,
    members,
    lastMessage: conversation.lastMessage,
    unreadCount,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt
  };
}

export function serializeMessage(message) {
  return {
    id: message._id.toString(),
    conversation: message.conversation?._id?.toString?.() ?? message.conversation?.toString?.(),
    sender: serializeUser(message.sender),
    body: message.body,
    clientId: message.clientId,
    attachments: message.attachments ?? [],
    readBy: (message.readBy ?? []).map((read) => ({
      user: read.user?.toString?.() ?? read.user,
      readAt: read.readAt
    })),
    createdAt: message.createdAt,
    updatedAt: message.updatedAt
  };
}

export function serializeNotification(notification) {
  return {
    id: notification._id.toString(),
    user: notification.user?.toString?.() ?? notification.user,
    conversation: notification.conversation?.toString?.() ?? notification.conversation,
    message: notification.message?.toString?.() ?? notification.message,
    type: notification.type,
    text: notification.text,
    readAt: notification.readAt,
    createdAt: notification.createdAt
  };
}
