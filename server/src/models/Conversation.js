import mongoose from "mongoose";

const ConversationMemberSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    role: {
      type: String,
      enum: ["owner", "admin", "member"],
      default: "member"
    },
    mutedUntil: Date,
    joinedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const ConversationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["direct", "group"],
      required: true
    },
    name: {
      type: String,
      trim: true,
      maxlength: 100
    },
    avatarUrl: {
      type: String,
      default: ""
    },
    members: {
      type: [ConversationMemberSchema],
      validate: [(members) => members.length > 0, "Conversation requires members"]
    },
    lastMessage: {
      body: String,
      sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
      createdAt: Date
    }
  },
  { timestamps: true }
);

ConversationSchema.index({ "members.user": 1, updatedAt: -1 });
ConversationSchema.index({ name: "text" });

export const Conversation = mongoose.model("Conversation", ConversationSchema);

