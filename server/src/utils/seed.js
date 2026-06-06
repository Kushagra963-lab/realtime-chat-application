import bcrypt from "bcryptjs";
import { connectDatabase, disconnectDatabase } from "../config/database.js";
import { Conversation } from "../models/Conversation.js";
import { Message } from "../models/Message.js";
import { Notification } from "../models/Notification.js";
import { User } from "../models/User.js";

const demoUsers = [
  ["Aarav Mehta", "aarav@example.com"],
  ["Maya Shah", "maya@example.com"],
  ["Riya Kapoor", "riya@example.com"],
  ["Dev Patel", "dev@example.com"],
  ["Kushagra Singh", "kushagra@example.com"]
];

async function seed() {
  await connectDatabase();
  await Promise.all([
    User.deleteMany({ email: { $in: demoUsers.map(([, email]) => email) } }),
    Conversation.deleteMany({ name: /Product War Room|Engineering Standup/ }),
    Message.deleteMany({}),
    Notification.deleteMany({})
  ]);

  const passwordHash = await bcrypt.hash("Password123!", 12);
  const users = await User.insertMany(
    demoUsers.map(([name, email]) => ({ name, email, passwordHash, provider: "local" }))
  );

  const productGroup = await Conversation.create({
    type: "group",
    name: "Product War Room",
    members: users.map((user, index) => ({
      user: user._id,
      role: index === 0 ? "owner" : "member"
    }))
  });

  const engineeringGroup = await Conversation.create({
    type: "group",
    name: "Engineering Standup",
    members: users.slice(1).map((user, index) => ({
      user: user._id,
      role: index === 0 ? "owner" : "member"
    }))
  });

  const message = await Message.create({
    conversation: productGroup._id,
    sender: users[0]._id,
    body: "Welcome to the realtime chat demo. Search, notifications, and sockets are ready.",
    readBy: [{ user: users[0]._id }]
  });

  productGroup.lastMessage = {
    body: message.body,
    sender: users[0]._id,
    createdAt: message.createdAt
  };
  await productGroup.save();
  await engineeringGroup.save();

  console.log("Seeded demo users:");
  users.forEach((user) => console.log(`- ${user.email} / Password123!`));

  await disconnectDatabase();
}

seed().catch(async (error) => {
  console.error(error);
  await disconnectDatabase();
  process.exit(1);
});

