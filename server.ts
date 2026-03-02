import express from "express";
import cors from "cors";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "data.db");

// ── SQLite setup ──
const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// ── Create tables ──
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    firstName TEXT NOT NULL,
    lastName TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    grade TEXT NOT NULL,
    region TEXT NOT NULL,
    fromProvince TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user'
  );

  CREATE TABLE IF NOT EXISTS wishes (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    fromProvince TEXT NOT NULL,
    toProvince TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    matchedTransferId TEXT,
    FOREIGN KEY (userId) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS transfers (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS transfer_participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transferId TEXT NOT NULL,
    userId TEXT NOT NULL,
    fromProvince TEXT NOT NULL,
    toProvince TEXT NOT NULL,
    FOREIGN KEY (transferId) REFERENCES transfers(id),
    FOREIGN KEY (userId) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    message TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    read INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (userId) REFERENCES users(id)
  );
`);

// ── Seed admin ──
const adminExists = db.prepare("SELECT id FROM users WHERE email = ?").get("admin@mouvement.ma");
if (!adminExists) {
  db.prepare(
    "INSERT INTO users (id, firstName, lastName, email, password, grade, region, fromProvince, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).run("admin-default-001", "Admin", "Système", "admin@mouvement.ma", "admin123", "administrateur", "Rabat-Salé-Kénitra", "Rabat", "admin");
}

// ── Prepared statements ──
const stmts = {
  getUserByEmail: db.prepare("SELECT * FROM users WHERE email = ?"),
  getUserById: db.prepare("SELECT * FROM users WHERE id = ?"),
  getAllUsers: db.prepare("SELECT * FROM users"),
  insertUser: db.prepare("INSERT INTO users (id, firstName, lastName, email, password, grade, region, fromProvince, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"),
  updateUser: db.prepare("UPDATE users SET firstName=?, lastName=?, email=?, password=?, grade=?, region=?, fromProvince=?, role=? WHERE id=?"),

  getWishesByUser: db.prepare("SELECT * FROM wishes WHERE userId = ?"),
  getAllWishes: db.prepare("SELECT * FROM wishes"),
  getAvailableWishes: db.prepare("SELECT * FROM wishes WHERE matchedTransferId IS NULL AND id != ?"),
  insertWish: db.prepare("INSERT INTO wishes (id, userId, fromProvince, toProvince, createdAt) VALUES (?, ?, ?, ?, ?)"),
  updateWishMatch: db.prepare("UPDATE wishes SET matchedTransferId = ? WHERE id = ?"),
  deleteWish: db.prepare("DELETE FROM wishes WHERE id = ?"),
  checkWishExists: db.prepare("SELECT id FROM wishes WHERE userId = ? AND fromProvince = ? AND toProvince = ? AND matchedTransferId IS NULL"),

  insertTransfer: db.prepare("INSERT INTO transfers (id, type, status, createdAt) VALUES (?, ?, ?, ?)"),
  getTransferById: db.prepare("SELECT * FROM transfers WHERE id = ?"),
  getAllTransfers: db.prepare("SELECT * FROM transfers"),
  updateTransfer: db.prepare("UPDATE transfers SET type=?, status=?, createdAt=? WHERE id=?"),

  insertParticipant: db.prepare("INSERT INTO transfer_participants (transferId, userId, fromProvince, toProvince) VALUES (?, ?, ?, ?)"),
  getParticipants: db.prepare("SELECT userId, fromProvince, toProvince FROM transfer_participants WHERE transferId = ?"),
  getTransfersByUser: db.prepare("SELECT DISTINCT transferId FROM transfer_participants WHERE userId = ?"),

  getNotificationsByUser: db.prepare("SELECT * FROM notifications WHERE userId = ?"),
  getUnreadNotifications: db.prepare("SELECT * FROM notifications WHERE userId = ? AND read = 0"),
  insertNotification: db.prepare("INSERT INTO notifications (id, userId, message, createdAt, read) VALUES (?, ?, ?, ?, 0)"),
  markNotificationsRead: db.prepare("UPDATE notifications SET read = 1 WHERE userId = ?"),
};

// ── Helpers ──
const buildTransfer = (row: any) => {
  const participants = stmts.getParticipants.all(row.id);
  return { ...row, participants };
};

const buildNotification = (row: any) => ({
  ...row,
  read: !!row.read,
});

// ── Auto-match logic ──
const tryAutoMatch = (newWish: any): any | null => {
  const available = stmts.getAvailableWishes.all(newWish.id) as any[];

  // Mutual match
  const mutual = available.find(
    (w) => w.fromProvince === newWish.toProvince && w.toProvince === newWish.fromProvince
  );
  if (mutual) {
    const transferId = crypto.randomUUID();
    const now = new Date().toISOString();
    const insertMatch = db.transaction(() => {
      stmts.insertTransfer.run(transferId, "mutual", "pending", now);
      stmts.insertParticipant.run(transferId, newWish.userId, newWish.fromProvince, newWish.toProvince);
      stmts.insertParticipant.run(transferId, mutual.userId, mutual.fromProvince, mutual.toProvince);
      stmts.updateWishMatch.run(transferId, newWish.id);
      stmts.updateWishMatch.run(transferId, mutual.id);
    });
    insertMatch();
    return buildTransfer(stmts.getTransferById.get(transferId));
  }

  // Cycle match (3-way)
  for (const wishB of available) {
    if (wishB.fromProvince !== newWish.toProvince) continue;
    const wishC = available.find(
      (w: any) => w.id !== wishB.id && w.fromProvince === wishB.toProvince && w.toProvince === newWish.fromProvince
    );
    if (wishC) {
      const transferId = crypto.randomUUID();
      const now = new Date().toISOString();
      const insertMatch = db.transaction(() => {
        stmts.insertTransfer.run(transferId, "cycle", "pending", now);
        stmts.insertParticipant.run(transferId, newWish.userId, newWish.fromProvince, newWish.toProvince);
        stmts.insertParticipant.run(transferId, wishB.userId, wishB.fromProvince, wishB.toProvince);
        stmts.insertParticipant.run(transferId, wishC.userId, wishC.fromProvince, wishC.toProvince);
        stmts.updateWishMatch.run(transferId, newWish.id);
        stmts.updateWishMatch.run(transferId, wishB.id);
        stmts.updateWishMatch.run(transferId, wishC.id);
      });
      insertMatch();
      return buildTransfer(stmts.getTransferById.get(transferId));
    }
  }

  return null;
};

// ── Express app ──
const app = express();
app.use(cors());
app.use(express.json());

// ── Auth routes ──
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  const user = stmts.getUserByEmail.get(email) as any;
  if (!user) return res.status(401).json({ error: "Utilisateur introuvable" });
  if (user.password !== password) return res.status(401).json({ error: "Mot de passe incorrect" });
  const unread = (stmts.getUnreadNotifications.all(user.id) as any[]).map(buildNotification);
  res.json({ user, unreadNotifications: unread });
});

app.post("/api/signup", (req, res) => {
  const userData = req.body;
  const exists = stmts.getUserByEmail.get(userData.email);
  if (exists) return res.status(400).json({ error: "Cet email est déjà utilisé" });
  const id = crypto.randomUUID();
  stmts.insertUser.run(id, userData.firstName, userData.lastName, userData.email, userData.password, userData.grade, userData.region, userData.fromProvince, "user");
  const newUser = stmts.getUserById.get(id);
  res.json({ user: newUser });
});

// ── Users routes ──
app.get("/api/users", (_req, res) => {
  res.json(stmts.getAllUsers.all());
});

app.put("/api/users/:id", (req, res) => {
  const user = stmts.getUserById.get(req.params.id) as any;
  if (!user) return res.status(404).json({ error: "User not found" });
  if (req.body.email && req.body.email !== user.email) {
    if (stmts.getUserByEmail.get(req.body.email)) {
      return res.status(400).json({ error: "Cet email est déjà utilisé" });
    }
  }
  const updated = { ...user, ...req.body };
  stmts.updateUser.run(updated.firstName, updated.lastName, updated.email, updated.password, updated.grade, updated.region, updated.fromProvince, updated.role, req.params.id);
  res.json({ user: stmts.getUserById.get(req.params.id) });
});

// ── Wishes routes ──
app.get("/api/wishes", (req, res) => {
  const userId = req.query.userId as string | undefined;
  res.json(userId ? stmts.getWishesByUser.all(userId) : stmts.getAllWishes.all());
});

app.post("/api/wishes", (req, res) => {
  const { userId, fromProvince, toProvince } = req.body;
  const exists = stmts.checkWishExists.get(userId, fromProvince, toProvince);
  if (exists) return res.status(400).json({ error: "Wish already exists" });

  const wish = {
    id: crypto.randomUUID(),
    userId,
    fromProvince,
    toProvince,
    createdAt: new Date().toISOString(),
  };
  stmts.insertWish.run(wish.id, wish.userId, wish.fromProvince, wish.toProvince, wish.createdAt);

  const match = tryAutoMatch(wish);
  res.json({ wish, match });
});

app.put("/api/wishes/:id", (req, res) => {
  const wish = db.prepare("SELECT * FROM wishes WHERE id = ?").get(req.params.id) as any;
  if (!wish) return res.status(404).json({ error: "Wish not found" });
  if (req.body.matchedTransferId !== undefined) {
    stmts.updateWishMatch.run(req.body.matchedTransferId, req.params.id);
  }
  res.json({ wish: db.prepare("SELECT * FROM wishes WHERE id = ?").get(req.params.id) });
});

app.delete("/api/wishes/:id", (req, res) => {
  stmts.deleteWish.run(req.params.id);
  res.json({ success: true });
});

// ── Transfers routes ──
app.get("/api/transfers", (req, res) => {
  const userId = req.query.userId as string | undefined;
  if (userId) {
    const transferIds = (stmts.getTransfersByUser.all(userId) as any[]).map((r) => r.transferId);
    const transfers = transferIds.map((id) => buildTransfer(stmts.getTransferById.get(id)));
    res.json(transfers);
  } else {
    res.json((stmts.getAllTransfers.all() as any[]).map(buildTransfer));
  }
});

app.put("/api/transfers/:id", (req, res) => {
  const transfer = stmts.getTransferById.get(req.params.id) as any;
  if (!transfer) return res.status(404).json({ error: "Transfer not found" });
  const updated = { ...transfer, ...req.body };
  stmts.updateTransfer.run(updated.type, updated.status, updated.createdAt, req.params.id);
  res.json({ transfer: buildTransfer(stmts.getTransferById.get(req.params.id)) });
});

// ── Notifications routes ──
app.get("/api/notifications", (req, res) => {
  const userId = req.query.userId as string;
  res.json((stmts.getNotificationsByUser.all(userId) as any[]).map(buildNotification));
});

app.post("/api/notifications", (req, res) => {
  const n = req.body;
  stmts.insertNotification.run(n.id, n.userId, n.message, n.createdAt);
  res.json({ notification: buildNotification(db.prepare("SELECT * FROM notifications WHERE id = ?").get(n.id)) });
});

app.put("/api/notifications/mark-read", (req, res) => {
  const { userId } = req.body;
  stmts.markNotificationsRead.run(userId);
  res.json({ success: true });
});

// ── Start server ──
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`✅ Backend running at http://localhost:${PORT}`);
  console.log(`📁 SQLite database at ${DB_PATH}`);
});
