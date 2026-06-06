import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    body: {
      type: String,
      required: true,
      trim: true,
      maxlength: 4000
    },
    clientId: {
      type: String,
      index: true
    },
    attachments: [
      {
        url: String,
        name: String,
        mimeType: String,
        size: Number
      }
    ],
    readBy: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User"
        },
        readAt: {
          type: Date,
          default: Date.now
        }
      }
    ]
  },
  { timestamps: true }
);

MessageSchema.index({ body: "text" });
MessageSchema.index({ conversation: 1, createdAt: -1 });

export const Message = mongoose.model("Message", MessageSchema);

