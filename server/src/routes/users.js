import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { User } from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { serializeUser } from "../utils/serializers.js";

export const usersRouter = Router();

usersRouter.use(requireAuth);

usersRouter.get(
  "/search",
  asyncHandler(async (req, res) => {
    const q = req.query.q?.toString().trim();
    if (!q) {
      return res.json({ users: [] });
    }

    const users = await User.find({
      _id: { $ne: req.user._id },
      $or: [
        { name: new RegExp(q, "i") },
        { email: new RegExp(q, "i") }
      ]
    })
      .limit(12)
      .sort({ name: 1 });

    res.json({ users: users.map(serializeUser) });
  })
);

