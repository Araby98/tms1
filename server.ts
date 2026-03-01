import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "db.json");

// ── Types ──
interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  grade: string;
  region: string;
  fromProvince: string;
  role: string;
}

interface TransferWish {
  id: string;
  userId: string;
  fromProvince: string;
  toProvince: string;
  createdAt: string;
  matchedTransferId?: string;
}

interface TransferRequest {
  id: string;
  type: string;
  status: string;
  createdAt: string;
  participants: { userId: string; fromProvince: string; toProvince: string }[];
}

interface Notification {
  id: string;
  userId: string;
  message: string;
  createdAt: string;
  read: boolean;
}

interface DB {
  users: User[];
  wishes: TransferWish[];
  transfers: TransferRequest[];
  notifications: Notification[];
}

// ── JSON file persistence ──
const loadDB = (): DB => {
  if (!fs.existsSync(DB_PATH)) {
    const empty: DB = { users: [], wishes: [], transfers: [], notifications: [] };
    fs.writeFileSync(DB_PATH, JSON.stringify(empty, null, 2));
    return empty;
  }
  return JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
};

const saveDB = (db: DB) => {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
};

// Seed admin
const seedAdmin = (db: DB) => {
  if (!db.users.some((u) => u.email === "admin@mouvement.ma")) {
    db.users.push({
      id: "admin-default-001",
      firstName: "Admin",
      lastName: "Système",
      email: "admin@mouvement.ma",
      password: "admin123",
      grade: "administrateur",
      region: "Rabat-Salé-Kénitra",
      fromProvince: "Rabat",
      role: "admin",
    });
    saveDB(db);
  }
};

// ── Auto-match logic ──
const tryAutoMatch = (db: DB, newWish: TransferWish): TransferRequest | null => {
  const available = db.wishes.filter((w) => !w.matchedTransferId && w.id !== newWish.id);

  // Mutual match
  const mutual = available.find(
    (w) => w.fromProvince === newWish.toProvince && w.toProvince === newWish.fromProvince
  );
  if (mutual) {
    const transfer: TransferRequest = {
      id: crypto.randomUUID(),
      type: "mutual",
      status: "pending",
      createdAt: new Date().toISOString(),
      participants: [
        { userId: newWish.userId, fromProvince: newWish.fromProvince, toProvince: newWish.toProvince },
        { userId: mutual.userId, fromProvince: mutual.fromProvince, toProvince: mutual.toProvince },
      ],
    };
    db.transfers.push(transfer);
    newWish.matchedTransferId = transfer.id;
    mutual.matchedTransferId = transfer.id;
    saveDB(db);
    return transfer;
  }

  // Cycle match (3-way)
  for (const wishB of available) {
    if (wishB.fromProvince !== newWish.toProvince) continue;
    const wishC = available.find(
      (w) => w.id !== wishB.id && w.fromProvince === wishB.toProvince && w.toProvince === newWish.fromProvince
    );
    if (wishC) {
      const transfer: TransferRequest = {
        id: crypto.randomUUID(),
        type: "cycle",
        status: "pending",
        createdAt: new Date().toISOString(),
        participants: [
          { userId: newWish.userId, fromProvince: newWish.fromProvince, toProvince: newWish.toProvince },
          { userId: wishB.userId, fromProvince: wishB.fromProvince, toProvince: wishB.toProvince },
          { userId: wishC.userId, fromProvince: wishC.fromProvince, toProvince: wishC.toProvince },
        ],
      };
      db.transfers.push(transfer);
      newWish.matchedTransferId = transfer.id;
      wishB.matchedTransferId = transfer.id;
      wishC.matchedTransferId = transfer.id;
      saveDB(db);
      return transfer;
    }
  }

  return null;
};

// ── Express app ──
const app = express();
app.use(cors());
app.use(express.json());

const db = loadDB();
seedAdmin(db);

// ── Auth routes ──
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  const user = db.users.find((u) => u.email === email);
  if (!user) return res.status(401).json({ error: "Utilisateur introuvable" });
  if (user.password !== password) return res.status(401).json({ error: "Mot de passe incorrect" });
  const unread = db.notifications.filter((n) => n.userId === user.id && !n.read);
  res.json({ user, unreadNotifications: unread });
});

app.post("/api/signup", (req, res) => {
  const userData = req.body;
  if (db.users.find((u) => u.email === userData.email)) {
    return res.status(400).json({ error: "Cet email est déjà utilisé" });
  }
  const newUser: User = { ...userData, id: crypto.randomUUID(), role: "user" };
  db.users.push(newUser);
  saveDB(db);
  res.json({ user: newUser });
});

// ── Users routes ──
app.get("/api/users", (_req, res) => {
  res.json(db.users);
});

app.put("/api/users/:id", (req, res) => {
  const idx = db.users.findIndex((u) => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "User not found" });
  if (req.body.email && req.body.email !== db.users[idx].email) {
    if (db.users.find((u) => u.email === req.body.email)) {
      return res.status(400).json({ error: "Cet email est déjà utilisé" });
    }
  }
  db.users[idx] = { ...db.users[idx], ...req.body };
  saveDB(db);
  res.json({ user: db.users[idx] });
});

// ── Wishes routes ──
app.get("/api/wishes", (req, res) => {
  const userId = req.query.userId as string | undefined;
  res.json(userId ? db.wishes.filter((w) => w.userId === userId) : db.wishes);
});

app.post("/api/wishes", (req, res) => {
  const { userId, fromProvince, toProvince } = req.body;
  const exists = db.wishes.some(
    (w) => w.userId === userId && w.fromProvince === fromProvince && w.toProvince === toProvince && !w.matchedTransferId
  );
  if (exists) return res.status(400).json({ error: "Wish already exists" });

  const wish: TransferWish = {
    id: crypto.randomUUID(),
    userId,
    fromProvince,
    toProvince,
    createdAt: new Date().toISOString(),
  };
  db.wishes.push(wish);
  saveDB(db);

  const match = tryAutoMatch(db, wish);
  res.json({ wish, match });
});

app.put("/api/wishes/:id", (req, res) => {
  const idx = db.wishes.findIndex((w) => w.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Wish not found" });
  db.wishes[idx] = { ...db.wishes[idx], ...req.body };
  saveDB(db);
  res.json({ wish: db.wishes[idx] });
});

app.delete("/api/wishes/:id", (req, res) => {
  db.wishes = db.wishes.filter((w) => w.id !== req.params.id);
  saveDB(db);
  res.json({ success: true });
});

// ── Transfers routes ──
app.get("/api/transfers", (req, res) => {
  const userId = req.query.userId as string | undefined;
  if (userId) {
    res.json(db.transfers.filter((t) => t.participants.some((p) => p.userId === userId)));
  } else {
    res.json(db.transfers);
  }
});

app.put("/api/transfers/:id", (req, res) => {
  const idx = db.transfers.findIndex((t) => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Transfer not found" });
  db.transfers[idx] = { ...db.transfers[idx], ...req.body };
  saveDB(db);
  res.json({ transfer: db.transfers[idx] });
});

// ── Notifications routes ──
app.get("/api/notifications", (req, res) => {
  const userId = req.query.userId as string;
  res.json(db.notifications.filter((n) => n.userId === userId));
});

app.post("/api/notifications", (req, res) => {
  const notification: Notification = req.body;
  db.notifications.push(notification);
  saveDB(db);
  res.json({ notification });
});

app.put("/api/notifications/mark-read", (req, res) => {
  const { userId } = req.body;
  db.notifications.forEach((n) => {
    if (n.userId === userId) n.read = true;
  });
  saveDB(db);
  res.json({ success: true });
});

// ── Start server ──
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`✅ Backend running at http://localhost:${PORT}`);
  console.log(`📁 Data stored in ${DB_PATH}`);
});
