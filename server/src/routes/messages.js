import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { Conversation } from "../models/Conversation.js";
import { Message } from "../models/Message.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createMessageAndNotifications, findMemberConversation } from "../utils/chat.js";
import { serializeMessage } from "../utils/serializers.js";

export const messagesRouter = Router();

messagesRouter.use(requireAuth);

messagesRouter.get(
  "/search",
  asyncHandler(async (req, res) => {
    const q = req.query.q?.toString().trim();
    if (!q) {
      return res.json({ messages: [] });
    }

    const memberConversations = await Conversation.find({ "members.user": req.user._id }).select("_id");
    const conversationIds = memberConversations.map((conversation) => conversation._id);

    const messages = await Message.find({
      conversation: { $in: conversationIds },
      $text: { $search: q }
    })
      .populate("sender")
      .sort({ score: { $meta: "textScore" }, createdAt: -1 })
      .limit(30);

    res.json({ messages: messages.map(serializeMessage) });
  })
);

messagesRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const input = z.object({
      conversationId: z.string(),
      body: z.string().min(1),
      clientId: z.string().optional()
    }).parse(req.body);

    const { conversation, message, notifications } = await createMessageAndNotifications({
      conversationId: input.conversationId,
      senderId: req.user._id,
      body: input.body,
      clientId: input.clientId
    });

    const io = req.app.get("io");
    io?.to(`conversation:${conversation._id.toString()}`).emit("message:new", {
      conversationId: conversation._id.toString(),
      message
    });
    notifications.forEach((notification) => {
      io?.to(`user:${notification.user}`).emit("notification:new", notification);
    });

    res.status(201).json({ message });
  })
);

messagesRouter.patch(
  "/read",
  asyncHandler(async (req, res) => {
    const input = z.object({
      conversationId: z.string(),
      messageIds: z.array(z.string()).default([])
    }).parse(req.body);

    const conversation = await findMemberConversation(input.conversationId, req.user._id);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    await Message.updateMany(
      {
        _id: { $in: input.messageIds },
        conversation: conversation._id,
        "readBy.user": { $ne: req.user._id }
      },
      { $push: { readBy: { user: req.user._id, readAt: new Date() } } }
    );

    const result = await Notification.updateMany(
      { user: req.user._id, conversation: conversation._id, readAt: { $exists: false } },
      { $set: { readAt: new Date() } }
    );

    res.json({ updated: result.modifiedCount });
  })
);
