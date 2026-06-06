import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true
    },
    message: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message"
    },
    type: {
      type: String,
      enum: ["message", "mention", "system"],
      default: "message"
    },
    text: {
      type: String,
      required: true
    },
    readAt: Date
  },
  { timestamps: true }
);

NotificationSchema.index({ user: 1, readAt: 1, createdAt: -1 });

export const Notification = mongoose.model("Notification", NotificationSchema);

