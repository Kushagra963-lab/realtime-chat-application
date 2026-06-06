import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { Notification } from "../models/Notification.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { serializeNotification } from "../utils/serializers.js";

export const notificationsRouter = Router();

notificationsRouter.use(requireAuth);

notificationsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ notifications: notifications.map(serializeNotification) });
  })
);

notificationsRouter.patch(
  "/:id/read",
  asyncHandler(async (req, res) => {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { $set: { readAt: new Date() } },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({ notification: serializeNotification(notification) });
  })
);

notificationsRouter.patch(
  "/read-all",
  asyncHandler(async (req, res) => {
    const result = await Notification.updateMany(
      { user: req.user._id, readAt: { $exists: false } },
      { $set: { readAt: new Date() } }
    );

    res.json({ updated: result.modifiedCount });
  })
);

