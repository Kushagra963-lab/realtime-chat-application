import { Server } from "socket.io";
import { allowedOrigins } from "../config/env.js";
import { User } from "../models/User.js";
import { Conversation } from "../models/Conversation.js";
import { Message } from "../models/Message.js";
import { Notification } from "../models/Notification.js";
import { createMessageAndNotifications, findMemberConversation } from "../utils/chat.js";
import { verifyAuthToken } from "../utils/jwt.js";

const onlineSocketsByUser = new Map();

export function createSocketServer(httpServer) {
  return new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      credentials: true
    },
    transports: ["websocket", "polling"],
    pingTimeout: 20000,
    pingInterval: 25000
  });
}

export function registerSocketHandlers(io) {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) {
        return next(new Error("Authentication required"));
      }

      const payload = verifyAuthToken(token.toString());
      const user = await User.findById(payload.sub);

      if (!user) {
        return next(new Error("User not found"));
      }

      socket.user = user;
      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", async (socket) => {
    const userId = socket.user._id.toString();
    const currentCount = onlineSocketsByUser.get(userId) ?? 0;
    onlineSocketsByUser.set(userId, currentCount + 1);

    socket.join(`user:${userId}`);

    if (currentCount === 0) {
      await User.findByIdAndUpdate(userId, { status: "online", lastSeen: new Date() });
      socket.broadcast.emit("presence:update", { userId, status: "online", lastSeen: new Date() });
    }

    const conversations = await Conversation.find({ "members.user": socket.user._id }).select("_id");
    conversations.forEach((conversation) => {
      socket.join(`conversation:${conversation._id.toString()}`);
    });

    socket.emit("socket:ready", {
      userId,
      conversationIds: conversations.map((conversation) => conversation._id.toString())
    });

    socket.on("conversation:join", async ({ conversationId }, ack) => {
      try {
        const conversation = await findMemberConversation(conversationId, socket.user._id);
        if (!conversation) {
          throw new Error("Conversation not found");
        }
        socket.join(`conversation:${conversation._id.toString()}`);
        ack?.({ ok: true });
      } catch (error) {
        ack?.({ ok: false, message: error.message });
      }
    });

    socket.on("message:send", async (payload, ack) => {
      const receivedAt = Date.now();
      try {
        const { conversation, message, notifications } = await createMessageAndNotifications({
          conversationId: payload.conversationId,
          senderId: socket.user._id,
          body: payload.body,
          clientId: payload.clientId
        });

        io.to(`conversation:${conversation._id.toString()}`).emit("message:new", {
          conversationId: conversation._id.toString(),
          clientId: payload.clientId,
          message
        });

        notifications.forEach((notification) => {
          io.to(`user:${notification.user}`).emit("notification:new", notification);
        });

        ack?.({
          ok: true,
          message,
          receivedAt,
          acknowledgedAt: Date.now()
        });
      } catch (error) {
        ack?.({ ok: false, message: error.message, receivedAt });
      }
    });

    socket.on("typing:start", async ({ conversationId }) => {
      const conversation = await findMemberConversation(conversationId, socket.user._id);
      if (conversation) {
        socket.to(`conversation:${conversation._id.toString()}`).emit("typing:update", {
          conversationId: conversation._id.toString(),
          userId,
          isTyping: true
        });
      }
    });

    socket.on("typing:stop", async ({ conversationId }) => {
      const conversation = await findMemberConversation(conversationId, socket.user._id);
      if (conversation) {
        socket.to(`conversation:${conversation._id.toString()}`).emit("typing:update", {
          conversationId: conversation._id.toString(),
          userId,
          isTyping: false
        });
      }
    });

    socket.on("message:read", async ({ conversationId, messageIds = [] }, ack) => {
      try {
        const conversation = await findMemberConversation(conversationId, socket.user._id);
        if (!conversation) {
          throw new Error("Conversation not found");
        }

        await Message.updateMany(
          {
            _id: { $in: messageIds },
            conversation: conversation._id,
            "readBy.user": { $ne: socket.user._id }
          },
          { $push: { readBy: { user: socket.user._id, readAt: new Date() } } }
        );
        await Notification.updateMany(
          { user: socket.user._id, conversation: conversation._id, readAt: { $exists: false } },
          { $set: { readAt: new Date() } }
        );
        socket.to(`conversation:${conversationId}`).emit("message:read", {
          conversationId,
          messageIds,
          userId
        });
        ack?.({ ok: true });
      } catch (error) {
        ack?.({ ok: false, message: error.message });
      }
    });

    socket.on("disconnect", async () => {
      const nextCount = Math.max((onlineSocketsByUser.get(userId) ?? 1) - 1, 0);

      if (nextCount === 0) {
        onlineSocketsByUser.delete(userId);
        const lastSeen = new Date();
        await User.findByIdAndUpdate(userId, { status: "offline", lastSeen });
        socket.broadcast.emit("presence:update", { userId, status: "offline", lastSeen });
      } else {
        onlineSocketsByUser.set(userId, nextCount);
      }
    });
  });
}
