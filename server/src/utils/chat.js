import mongoose from "mongoose";
import { Conversation } from "../models/Conversation.js";
import { Message } from "../models/Message.js";
import { Notification } from "../models/Notification.js";
import { serializeMessage, serializeNotification } from "./serializers.js";

export async function findMemberConversation(conversationId, userId) {
  if (!mongoose.Types.ObjectId.isValid(conversationId)) {
    return null;
  }

  return Conversation.findOne({
    _id: conversationId,
    "members.user": userId
  }).populate("members.user");
}

export async function createMessageAndNotifications({ conversationId, senderId, body, clientId }) {
  const conversation = await findMemberConversation(conversationId, senderId);
  if (!conversation) {
    const error = new Error("Conversation not found");
    error.statusCode = 404;
    throw error;
  }

  const trimmedBody = body?.trim();
  if (!trimmedBody) {
    const error = new Error("Message cannot be empty");
    error.statusCode = 400;
    throw error;
  }

  const message = await Message.create({
    conversation: conversation._id,
    sender: senderId,
    body: trimmedBody,
    clientId,
    readBy: [{ user: senderId, readAt: new Date() }]
  });

  conversation.lastMessage = {
    body: trimmedBody,
    sender: senderId,
    createdAt: message.createdAt
  };
  await conversation.save();

  const recipients = conversation.members
    .map((member) => member.user._id?.toString?.() ?? member.user.toString())
    .filter((memberId) => memberId !== senderId.toString());

  const notifications = recipients.length
    ? await Notification.insertMany(
      recipients.map((recipientId) => ({
        user: recipientId,
        conversation: conversation._id,
        message: message._id,
        type: trimmedBody.includes("@") ? "mention" : "message",
        text: trimmedBody.length > 120 ? `${trimmedBody.slice(0, 117)}...` : trimmedBody
      }))
    )
    : [];

  const populatedMessage = await message.populate("sender");

  return {
    conversation,
    message: serializeMessage(populatedMessage),
    notifications: notifications.map(serializeNotification)
  };
}

