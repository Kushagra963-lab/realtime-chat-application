import mongoose from "mongoose";
import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { Conversation } from "../models/Conversation.js";
import { Message } from "../models/Message.js";
import { Notification } from "../models/Notification.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { findMemberConversation } from "../utils/chat.js";
import { serializeConversation, serializeMessage } from "../utils/serializers.js";

export const conversationsRouter = Router();

conversationsRouter.use(requireAuth);

const groupSchema = z.object({
  name: z.string().min(2).max(100),
  memberIds: z.array(z.string()).default([])
});

conversationsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const conversations = await Conversation.find({ "members.user": req.user._id })
      .populate("members.user")
      .sort({ updatedAt: -1 })
      .limit(100);

    const unreadCounts = await Notification.aggregate([
      { $match: { user: req.user._id, readAt: { $exists: false } } },
      { $group: { _id: "$conversation", count: { $sum: 1 } } }
    ]);

    const unreadByConversation = new Map(
      unreadCounts.map((item) => [item._id.toString(), item.count])
    );

    res.json({
      conversations: conversations.map((conversation) => serializeConversation(
        conversation,
        req.user._id,
        unreadByConversation.get(conversation._id.toString()) ?? 0
      ))
    });
  })
);

conversationsRouter.post(
  "/groups",
  asyncHandler(async (req, res) => {
    const input = groupSchema.parse(req.body);
    const uniqueMemberIds = [...new Set([req.user._id.toString(), ...input.memberIds])]
      .filter((id) => mongoose.Types.ObjectId.isValid(id));

    const conversation = await Conversation.create({
      type: "group",
      name: input.name,
      members: uniqueMemberIds.map((userId) => ({
        user: userId,
        role: userId === req.user._id.toString() ? "owner" : "member"
      }))
    });

    await conversation.populate("members.user");
    res.status(201).json({ conversation: serializeConversation(conversation, req.user._id) });
  })
);

conversationsRouter.post(
  "/direct",
  asyncHandler(async (req, res) => {
    const memberId = z.string().refine((id) => mongoose.Types.ObjectId.isValid(id)).parse(req.body.memberId);

    if (memberId === req.user._id.toString()) {
      return res.status(400).json({ message: "Cannot create a direct conversation with yourself" });
    }

    const existing = await Conversation.findOne({
      type: "direct",
      $and: [
        { "members.user": req.user._id },
        { "members.user": memberId }
      ]
    }).populate("members.user");

    if (existing) {
      return res.json({ conversation: serializeConversation(existing, req.user._id) });
    }

    const conversation = await Conversation.create({
      type: "direct",
      members: [
        { user: req.user._id, role: "member" },
        { user: memberId, role: "member" }
      ]
    });

    await conversation.populate("members.user");
    res.status(201).json({ conversation: serializeConversation(conversation, req.user._id) });
  })
);

conversationsRouter.get(
  "/:id/messages",
  asyncHandler(async (req, res) => {
    const conversation = await findMemberConversation(req.params.id, req.user._id);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const before = req.query.before?.toString();
    const filter = {
      conversation: conversation._id,
      ...(before && mongoose.Types.ObjectId.isValid(before) ? { _id: { $lt: before } } : {})
    };

    const messages = await Message.find(filter)
      .populate("sender")
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ messages: messages.reverse().map(serializeMessage) });
  })
);

conversationsRouter.post(
  "/:id/members",
  asyncHandler(async (req, res) => {
    const memberIds = z.array(z.string()).parse(req.body.memberIds ?? []);
    const conversation = await findMemberConversation(req.params.id, req.user._id);

    if (!conversation || conversation.type !== "group") {
      return res.status(404).json({ message: "Group conversation not found" });
    }

    const currentMember = conversation.members.find(
      (member) => member.user._id.toString() === req.user._id.toString()
    );

    if (!["owner", "admin"].includes(currentMember?.role)) {
      return res.status(403).json({ message: "Only group admins can add members" });
    }

    const existingIds = new Set(conversation.members.map((member) => member.user._id.toString()));
    const membersToAdd = memberIds
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .filter((id) => !existingIds.has(id))
      .map((id) => ({ user: id, role: "member" }));

    conversation.members.push(...membersToAdd);
    await conversation.save();
    await conversation.populate("members.user");

    res.json({ conversation: serializeConversation(conversation, req.user._id) });
  })
);

