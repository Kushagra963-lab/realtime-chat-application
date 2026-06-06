import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import { Router } from "express";
import { z } from "zod";
import { env } from "../config/env.js";
import { requireAuth } from "../middleware/auth.js";
import { User } from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { signAuthToken } from "../utils/jwt.js";
import { serializeUser } from "../utils/serializers.js";

export const authRouter = Router();

const credentialsSchema = z.object({
  email: z.string().email().transform((email) => email.toLowerCase()),
  password: z.string().min(8)
});

const registerSchema = credentialsSchema.extend({
  name: z.string().min(2).max(80)
});

authRouter.post(
  "/register",
  asyncHandler(async (req, res) => {
    const input = registerSchema.parse(req.body);
    const existing = await User.findOne({ email: input.email });

    if (existing) {
      return res.status(409).json({ message: "Email is already registered" });
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await User.create({
      name: input.name,
      email: input.email,
      passwordHash,
      provider: "local"
    });

    res.status(201).json({
      user: serializeUser(user),
      token: signAuthToken(user)
    });
  })
);

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const input = credentialsSchema.parse(req.body);
    const user = await User.findOne({ email: input.email }).select("+passwordHash");

    if (!user || !user.passwordHash) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);
    if (!passwordMatches) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    res.json({
      user: serializeUser(user),
      token: signAuthToken(user)
    });
  })
);

authRouter.get("/me", requireAuth, (req, res) => {
  res.json({ user: serializeUser(req.user) });
});

authRouter.get("/google", (req, res) => {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.GOOGLE_OAUTH_REDIRECT) {
    return res.status(400).json({ message: "Google OAuth is not configured" });
  }

  const client = new OAuth2Client(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET, env.GOOGLE_OAUTH_REDIRECT);
  const url = client.generateAuthUrl({
    access_type: "offline",
    scope: ["profile", "email"],
    prompt: "select_account"
  });

  res.redirect(url);
});

authRouter.get(
  "/google/callback",
  asyncHandler(async (req, res) => {
    if (!req.query.code) {
      return res.status(400).json({ message: "Missing Google OAuth code" });
    }

    const client = new OAuth2Client(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET, env.GOOGLE_OAUTH_REDIRECT);
    const { tokens } = await client.getToken(req.query.code.toString());
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: env.GOOGLE_CLIENT_ID
    });
    const profile = ticket.getPayload();

    const user = await User.findOneAndUpdate(
      { email: profile.email.toLowerCase() },
      {
        $set: {
          name: profile.name,
          email: profile.email.toLowerCase(),
          avatarUrl: profile.picture,
          googleId: profile.sub,
          provider: "google"
        }
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    const token = signAuthToken(user);
    const redirectUrl = new URL("/oauth/callback", env.CLIENT_URL);
    redirectUrl.searchParams.set("token", token);
    res.redirect(redirectUrl.toString());
  })
);

