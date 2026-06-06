import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    passwordHash: {
      type: String,
      select: false
    },
    googleId: {
      type: String,
      index: true,
      sparse: true
    },
    avatarUrl: {
      type: String,
      default: ""
    },
    provider: {
      type: String,
      enum: ["local", "google"],
      default: "local"
    },
    status: {
      type: String,
      enum: ["online", "offline"],
      default: "offline"
    },
    lastSeen: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

UserSchema.index({ name: "text", email: "text" });

UserSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id.toString(),
    name: this.name,
    email: this.email,
    avatarUrl: this.avatarUrl,
    status: this.status,
    lastSeen: this.lastSeen,
    provider: this.provider
  };
};

export const User = mongoose.model("User", UserSchema);

