export const STATIC_DEMO = import.meta.env.VITE_STATIC_DEMO === "true";

const now = new Date();
const minutesAgo = (minutes) => new Date(now.getTime() - minutes * 60 * 1000).toISOString();

export const demoUser = {
  id: "u-kushagra",
  name: "Kushagra Singh",
  email: "kushagra@example.com",
  avatarUrl: "",
  status: "online",
  lastSeen: minutesAgo(0),
  provider: "local"
};

export const demoUsers = [
  demoUser,
  {
    id: "u-maya",
    name: "Maya Shah",
    email: "maya@example.com",
    avatarUrl: "",
    status: "online",
    lastSeen: minutesAgo(1)
  },
  {
    id: "u-aarav",
    name: "Aarav Mehta",
    email: "aarav@example.com",
    avatarUrl: "",
    status: "online",
    lastSeen: minutesAgo(3)
  },
  {
    id: "u-riya",
    name: "Riya Kapoor",
    email: "riya@example.com",
    avatarUrl: "",
    status: "offline",
    lastSeen: minutesAgo(42)
  },
  {
    id: "u-dev",
    name: "Dev Patel",
    email: "dev@example.com",
    avatarUrl: "",
    status: "online",
    lastSeen: minutesAgo(7)
  }
];

const member = (user, role = "member") => ({
  user,
  role,
  joinedAt: minutesAgo(120)
});

export const demoConversations = [
  {
    id: "c-product",
    type: "group",
    name: "Product War Room",
    avatarUrl: "",
    members: [
      member(demoUser, "owner"),
      member(demoUsers[1]),
      member(demoUsers[2]),
      member(demoUsers[3]),
      member(demoUsers[4])
    ],
    unreadCount: 2,
    lastMessage: {
      body: "Socket acknowledgements are staying under the target in local tests.",
      sender: "u-dev",
      createdAt: minutesAgo(2)
    },
    createdAt: minutesAgo(1600),
    updatedAt: minutesAgo(2)
  },
  {
    id: "c-maya",
    type: "direct",
    name: "Maya Shah",
    avatarUrl: "",
    members: [member(demoUser), member(demoUsers[1])],
    unreadCount: 0,
    lastMessage: {
      body: "The GitHub Pages demo is live and the full stack is deploy-ready.",
      sender: "u-maya",
      createdAt: minutesAgo(18)
    },
    createdAt: minutesAgo(1300),
    updatedAt: minutesAgo(18)
  },
  {
    id: "c-standup",
    type: "group",
    name: "Engineering Standup",
    avatarUrl: "",
    members: [member(demoUser, "owner"), member(demoUsers[2]), member(demoUsers[4])],
    unreadCount: 0,
    lastMessage: {
      body: "Redis adapter support is wired for horizontal scale.",
      sender: "u-aarav",
      createdAt: minutesAgo(55)
    },
    createdAt: minutesAgo(920),
    updatedAt: minutesAgo(55)
  }
];

export const demoMessages = {
  "c-product": [
    {
      id: "m-1",
      conversation: "c-product",
      sender: demoUsers[1],
      body: "Group chat, direct messages, unread notifications, and search are wired into the same state flow.",
      createdAt: minutesAgo(35),
      updatedAt: minutesAgo(35)
    },
    {
      id: "m-2",
      conversation: "c-product",
      sender: demoUser,
      body: "Nice. Keep the UI compact and work-focused so it feels like a real chat workspace.",
      createdAt: minutesAgo(28),
      updatedAt: minutesAgo(28)
    },
    {
      id: "m-3",
      conversation: "c-product",
      sender: demoUsers[4],
      body: "Socket acknowledgements are staying under the target in local tests.",
      createdAt: minutesAgo(2),
      updatedAt: minutesAgo(2)
    }
  ],
  "c-maya": [
    {
      id: "m-4",
      conversation: "c-maya",
      sender: demoUsers[1],
      body: "The GitHub Pages demo is live and the full stack is deploy-ready.",
      createdAt: minutesAgo(18),
      updatedAt: minutesAgo(18)
    }
  ],
  "c-standup": [
    {
      id: "m-5",
      conversation: "c-standup",
      sender: demoUsers[2],
      body: "Redis adapter support is wired for horizontal scale.",
      createdAt: minutesAgo(55),
      updatedAt: minutesAgo(55)
    }
  ]
};

export const demoNotifications = [
  {
    id: "n-1",
    conversation: "c-product",
    message: "m-3",
    type: "message",
    text: "Dev: Socket acknowledgements are staying under the target in local tests.",
    readAt: null,
    createdAt: minutesAgo(2)
  },
  {
    id: "n-2",
    conversation: "c-product",
    message: "m-2",
    type: "mention",
    text: "Maya mentioned search and notification coverage.",
    readAt: null,
    createdAt: minutesAgo(14)
  }
];

export function createDemoConversation({ name, memberIds = [] }) {
  const selectedMembers = demoUsers.filter((user) => memberIds.includes(user.id));
  const createdAt = new Date().toISOString();

  return {
    id: `c-demo-${Date.now()}`,
    type: "group",
    name,
    avatarUrl: "",
    members: [member(demoUser, "owner"), ...selectedMembers.map((user) => member(user))],
    unreadCount: 0,
    lastMessage: null,
    createdAt,
    updatedAt: createdAt
  };
}

export function createDemoDirect(memberId) {
  const peer = demoUsers.find((user) => user.id === memberId) ?? demoUsers[1];
  const createdAt = new Date().toISOString();

  return {
    id: `c-direct-${peer.id}`,
    type: "direct",
    name: peer.name,
    avatarUrl: "",
    members: [member(demoUser), member(peer)],
    unreadCount: 0,
    lastMessage: null,
    createdAt,
    updatedAt: createdAt
  };
}

export function searchDemoMessages(query) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];

  return Object.values(demoMessages)
    .flat()
    .filter((message) => message.body.toLowerCase().includes(normalized));
}

