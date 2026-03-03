import "dotenv/config";
import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";
import crypto from "crypto";

// ── MySQL connection pool ──
const pool = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "mouvement",
  waitForConnections: true,
  connectionLimit: 10,
});

// ── Initialize database tables ──
const initDB = async () => {
  const conn = await pool.getConnection();
  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        firstName VARCHAR(255) NOT NULL,
        lastName VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        grade VARCHAR(100) NOT NULL,
        region VARCHAR(255) NOT NULL,
        fromProvince VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'user'
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS wishes (
        id VARCHAR(36) PRIMARY KEY,
        userId VARCHAR(36) NOT NULL,
        fromProvince VARCHAR(255) NOT NULL,
        toProvince VARCHAR(255) NOT NULL,
        createdAt VARCHAR(50) NOT NULL,
        matchedTransferId VARCHAR(36) DEFAULT NULL,
        FOREIGN KEY (userId) REFERENCES users(id)
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS transfers (
        id VARCHAR(36) PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        createdAt VARCHAR(50) NOT NULL
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS transfer_participants (
        id INT AUTO_INCREMENT PRIMARY KEY,
        transferId VARCHAR(36) NOT NULL,
        userId VARCHAR(36) NOT NULL,
        fromProvince VARCHAR(255) NOT NULL,
        toProvince VARCHAR(255) NOT NULL,
        FOREIGN KEY (transferId) REFERENCES transfers(id),
        FOREIGN KEY (userId) REFERENCES users(id)
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id VARCHAR(36) PRIMARY KEY,
        userId VARCHAR(36) NOT NULL,
        message TEXT NOT NULL,
        createdAt VARCHAR(50) NOT NULL,
        \`read\` TINYINT NOT NULL DEFAULT 0,
        FOREIGN KEY (userId) REFERENCES users(id)
      )
    `);

    // Seed admin
    const [adminRows] = await conn.query("SELECT id FROM users WHERE email = ?", ["admin@mouvement.ma"]);
    if ((adminRows as any[]).length === 0) {
      await conn.query(
        "INSERT INTO users (id, firstName, lastName, email, password, grade, region, fromProvince, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        ["admin-default-001", "Admin", "Système", "admin@mouvement.ma", "admin123", "administrateur", "Rabat-Salé-Kénitra", "Rabat", "admin"]
      );
    }
  } finally {
    conn.release();
  }
};

// ── Helpers ──
const buildTransfer = async (row: any) => {
  const [participants] = await pool.query(
    "SELECT userId, fromProvince, toProvince FROM transfer_participants WHERE transferId = ?",
    [row.id]
  );
  return { ...row, participants };
};

const buildNotification = (row: any) => ({
  ...row,
  read: !!row.read,
});

// ── Auto-match logic ──
const tryAutoMatch = async (newWish: any): Promise<any | null> => {
  const [availableRows] = await pool.query(
    "SELECT * FROM wishes WHERE matchedTransferId IS NULL AND id != ?",
    [newWish.id]
  );
  const available = availableRows as any[];

  // Mutual match
  const mutual = available.find(
    (w) => w.fromProvince === newWish.toProvince && w.toProvince === newWish.fromProvince
  );
  if (mutual) {
    const transferId = crypto.randomUUID();
    const now = new Date().toISOString();
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query("INSERT INTO transfers (id, type, status, createdAt) VALUES (?, ?, ?, ?)", [transferId, "mutual", "pending", now]);
      await conn.query("INSERT INTO transfer_participants (transferId, userId, fromProvince, toProvince) VALUES (?, ?, ?, ?)", [transferId, newWish.userId, newWish.fromProvince, newWish.toProvince]);
      await conn.query("INSERT INTO transfer_participants (transferId, userId, fromProvince, toProvince) VALUES (?, ?, ?, ?)", [transferId, mutual.userId, mutual.fromProvince, mutual.toProvince]);
      await conn.query("UPDATE wishes SET matchedTransferId = ? WHERE id = ?", [transferId, newWish.id]);
      await conn.query("UPDATE wishes SET matchedTransferId = ? WHERE id = ?", [transferId, mutual.id]);
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
    const [rows] = await pool.query("SELECT * FROM transfers WHERE id = ?", [transferId]);
    return buildTransfer((rows as any[])[0]);
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
      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();
        await conn.query("INSERT INTO transfers (id, type, status, createdAt) VALUES (?, ?, ?, ?)", [transferId, "cycle", "pending", now]);
        await conn.query("INSERT INTO transfer_participants (transferId, userId, fromProvince, toProvince) VALUES (?, ?, ?, ?)", [transferId, newWish.userId, newWish.fromProvince, newWish.toProvince]);
        await conn.query("INSERT INTO transfer_participants (transferId, userId, fromProvince, toProvince) VALUES (?, ?, ?, ?)", [transferId, wishB.userId, wishB.fromProvince, wishB.toProvince]);
        await conn.query("INSERT INTO transfer_participants (transferId, userId, fromProvince, toProvince) VALUES (?, ?, ?, ?)", [transferId, wishC.userId, wishC.fromProvince, wishC.toProvince]);
        await conn.query("UPDATE wishes SET matchedTransferId = ? WHERE id = ?", [transferId, newWish.id]);
        await conn.query("UPDATE wishes SET matchedTransferId = ? WHERE id = ?", [transferId, wishB.id]);
        await conn.query("UPDATE wishes SET matchedTransferId = ? WHERE id = ?", [transferId, wishC.id]);
        await conn.commit();
      } catch (err) {
        await conn.rollback();
        throw err;
      } finally {
        conn.release();
      }
      const [rows] = await pool.query("SELECT * FROM transfers WHERE id = ?", [transferId]);
      return buildTransfer((rows as any[])[0]);
    }
  }

  return null;
};

// ── Express app ──
const app = express();
app.use(cors());
app.use(express.json());

// ── Auth routes ──
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
  const user = (rows as any[])[0];
  if (!user) return res.status(401).json({ error: "Utilisateur introuvable" });
  if (user.password !== password) return res.status(401).json({ error: "Mot de passe incorrect" });
  const [unreadRows] = await pool.query("SELECT * FROM notifications WHERE userId = ? AND `read` = 0", [user.id]);
  res.json({ user, unreadNotifications: (unreadRows as any[]).map(buildNotification) });
});

app.post("/api/signup", async (req, res) => {
  const userData = req.body;
  const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [userData.email]);
  if ((existing as any[]).length > 0) return res.status(400).json({ error: "Cet email est déjà utilisé" });
  const id = crypto.randomUUID();
  await pool.query(
    "INSERT INTO users (id, firstName, lastName, email, password, grade, region, fromProvince, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [id, userData.firstName, userData.lastName, userData.email, userData.password, userData.grade, userData.region, userData.fromProvince, "user"]
  );
  const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [id]);
  res.json({ user: (rows as any[])[0] });
});

// ── Users routes ──
app.get("/api/users", async (_req, res) => {
  const [rows] = await pool.query("SELECT * FROM users");
  res.json(rows);
});

app.put("/api/users/:id", async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [req.params.id]);
  const user = (rows as any[])[0];
  if (!user) return res.status(404).json({ error: "User not found" });
  if (req.body.email && req.body.email !== user.email) {
    const [dup] = await pool.query("SELECT id FROM users WHERE email = ?", [req.body.email]);
    if ((dup as any[]).length > 0) return res.status(400).json({ error: "Cet email est déjà utilisé" });
  }
  const updated = { ...user, ...req.body };
  await pool.query(
    "UPDATE users SET firstName=?, lastName=?, email=?, password=?, grade=?, region=?, fromProvince=?, role=? WHERE id=?",
    [updated.firstName, updated.lastName, updated.email, updated.password, updated.grade, updated.region, updated.fromProvince, updated.role, req.params.id]
  );
  const [result] = await pool.query("SELECT * FROM users WHERE id = ?", [req.params.id]);
  res.json({ user: (result as any[])[0] });
});

// ── Wishes routes ──
app.get("/api/wishes", async (req, res) => {
  const userId = req.query.userId as string | undefined;
  const [rows] = userId
    ? await pool.query("SELECT * FROM wishes WHERE userId = ?", [userId])
    : await pool.query("SELECT * FROM wishes");
  res.json(rows);
});

app.post("/api/wishes", async (req, res) => {
  const { userId, fromProvince, toProvince } = req.body;
  const [existing] = await pool.query(
    "SELECT id FROM wishes WHERE userId = ? AND fromProvince = ? AND toProvince = ? AND matchedTransferId IS NULL",
    [userId, fromProvince, toProvince]
  );
  if ((existing as any[]).length > 0) return res.status(400).json({ error: "Wish already exists" });

  const wish = { id: crypto.randomUUID(), userId, fromProvince, toProvince, createdAt: new Date().toISOString() };
  await pool.query("INSERT INTO wishes (id, userId, fromProvince, toProvince, createdAt) VALUES (?, ?, ?, ?, ?)", [wish.id, wish.userId, wish.fromProvince, wish.toProvince, wish.createdAt]);

  const match = await tryAutoMatch(wish);
  res.json({ wish, match });
});

app.put("/api/wishes/:id", async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM wishes WHERE id = ?", [req.params.id]);
  if ((rows as any[]).length === 0) return res.status(404).json({ error: "Wish not found" });
  if (req.body.matchedTransferId !== undefined) {
    await pool.query("UPDATE wishes SET matchedTransferId = ? WHERE id = ?", [req.body.matchedTransferId, req.params.id]);
  }
  const [result] = await pool.query("SELECT * FROM wishes WHERE id = ?", [req.params.id]);
  res.json({ wish: (result as any[])[0] });
});

app.delete("/api/wishes/:id", async (req, res) => {
  await pool.query("DELETE FROM wishes WHERE id = ?", [req.params.id]);
  res.json({ success: true });
});

// ── Transfers routes ──
app.get("/api/transfers", async (req, res) => {
  const userId = req.query.userId as string | undefined;
  if (userId) {
    const [transferIds] = await pool.query("SELECT DISTINCT transferId FROM transfer_participants WHERE userId = ?", [userId]);
    const transfers = await Promise.all(
      (transferIds as any[]).map(async (r) => {
        const [rows] = await pool.query("SELECT * FROM transfers WHERE id = ?", [r.transferId]);
        return buildTransfer((rows as any[])[0]);
      })
    );
    res.json(transfers);
  } else {
    const [rows] = await pool.query("SELECT * FROM transfers");
    const transfers = await Promise.all((rows as any[]).map(buildTransfer));
    res.json(transfers);
  }
});

app.put("/api/transfers/:id", async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM transfers WHERE id = ?", [req.params.id]);
  const transfer = (rows as any[])[0];
  if (!transfer) return res.status(404).json({ error: "Transfer not found" });
  const updated = { ...transfer, ...req.body };
  await pool.query("UPDATE transfers SET type=?, status=?, createdAt=? WHERE id=?", [updated.type, updated.status, updated.createdAt, req.params.id]);
  const [result] = await pool.query("SELECT * FROM transfers WHERE id = ?", [req.params.id]);
  res.json({ transfer: await buildTransfer((result as any[])[0]) });
});

// ── Notifications routes ──
app.get("/api/notifications", async (req, res) => {
  const userId = req.query.userId as string;
  const [rows] = await pool.query("SELECT * FROM notifications WHERE userId = ?", [userId]);
  res.json((rows as any[]).map(buildNotification));
});

app.post("/api/notifications", async (req, res) => {
  const n = req.body;
  await pool.query("INSERT INTO notifications (id, userId, message, createdAt, `read`) VALUES (?, ?, ?, ?, 0)", [n.id, n.userId, n.message, n.createdAt]);
  const [rows] = await pool.query("SELECT * FROM notifications WHERE id = ?", [n.id]);
  res.json({ notification: buildNotification((rows as any[])[0]) });
});

app.put("/api/notifications/mark-read", async (req, res) => {
  const { userId } = req.body;
  await pool.query("UPDATE notifications SET `read` = 1 WHERE userId = ?", [userId]);
  res.json({ success: true });
});

// ── Start server ──
const PORT = 3001;

initDB().then(() => {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Backend running at http://localhost:${PORT}`);
    console.log(`🐬 Connected to MySQL database: ${process.env.DB_NAME || "mouvement"}`);
  });
}).catch((err) => {
  console.error("❌ Failed to initialize database:", err);
  process.exit(1);
});
