
import express from "express";
import cors from "cors";
import sqlite3 from "sqlite3";
import multer from "multer";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { existsSync, mkdirSync, copyFileSync } from "fs";
import { createServer } from "http";
import { Server } from "socket.io";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3001;
let server = null;

// Socket.IO Setup
const io = new Server(httpServer, {
    cors: {
        origin: "*", // Allow all origins for this demo
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.raw({ type: 'image/jpeg', limit: '10mb' }));

// CONFIGURATION FOR RENDER DISKS (PERSISTENCE)
const DATA_DIR = process.env.DATA_DIR || __dirname;
if (DATA_DIR !== __dirname) {
    console.log("!!! RUNNING IN PERSISTENT MODE !!!");
}

// File upload configuration
const uploadsDir = join(DATA_DIR, "uploads");
if (!existsSync(uploadsDir)) {
  mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({ storage });
app.use("/uploads", express.static(uploadsDir));

// SQLite database setup
const dbName = "courses.db";
const sourceDbPath = join(__dirname, dbName);
const targetDbPath = join(DATA_DIR, dbName);

if (DATA_DIR !== __dirname && !existsSync(targetDbPath) && existsSync(sourceDbPath)) {
    try {
        copyFileSync(sourceDbPath, targetDbPath);
        console.log("Database copied successfully.");
    } catch (err) {
        console.error("Error copying database:", err);
    }
}

const db = new sqlite3.Database(targetDbPath, (err) => {
  if (err) {
    console.error("Database error:", err);
  } else {
    console.log("Connected to SQLite database");
    db.run('PRAGMA encoding = "UTF-8"');
    initializeDatabase();
  }
});

function initializeDatabase() {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, username TEXT UNIQUE NOT NULL, password TEXT NOT NULL, name TEXT NOT NULL, role TEXT NOT NULL, createdAt DATETIME DEFAULT CURRENT_TIMESTAMP)`);
    
    // Seed default users if table is empty
    db.get("SELECT count(*) as count FROM users", [], (err, row) => {
        if (!err && row && row.count === 0) {
            console.log("Seeding default users...");
            const stmt = db.prepare("INSERT INTO users (id, username, password, name, role) VALUES (?, ?, ?, ?, ?)");
            stmt.run("1", "student", "student", "Студент Иванов", "student");
            stmt.run("2", "teacher", "teacher", "Преподаватель Петров", "teacher");
            stmt.run("3", "admin", "admin123", "Администратор Системы", "admin");
            stmt.finalize();
        }
    });
    
    db.run(`CREATE TABLE IF NOT EXISTS user_settings (username TEXT PRIMARY KEY, groupId TEXT, curatedGroups TEXT)`);
    db.run(`CREATE TABLE IF NOT EXISTS courses (id TEXT PRIMARY KEY, title TEXT NOT NULL, duration TEXT, totalHours INTEGER DEFAULT 0, teacherName TEXT, specialization TEXT, year INTEGER, targetGroup TEXT, createdAt DATETIME DEFAULT CURRENT_TIMESTAMP)`);
    db.run(`CREATE TABLE IF NOT EXISTS contents (id TEXT PRIMARY KEY, courseId TEXT NOT NULL, title TEXT NOT NULL, kind TEXT CHECK(kind IN ('theory', 'assignment')), description TEXT, hours INTEGER DEFAULT 0, teacherFile TEXT, FOREIGN KEY(courseId) REFERENCES courses(id) ON DELETE CASCADE)`);
    db.run(`CREATE TABLE IF NOT EXISTS enrollments (id TEXT PRIMARY KEY, username TEXT NOT NULL, courseId TEXT NOT NULL, enrolledAt DATETIME DEFAULT CURRENT_TIMESTAMP, status TEXT CHECK(status IN ('pending', 'active', 'rejected')) DEFAULT 'pending', UNIQUE(username, courseId))`);
    db.run(`CREATE TABLE IF NOT EXISTS reminders (id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT, specialization TEXT NOT NULL, year INTEGER NOT NULL, teacherName TEXT NOT NULL, reminderDate DATETIME, category TEXT CHECK(category IN ('exam','attention','other')), createdAt DATETIME DEFAULT CURRENT_TIMESTAMP)`);
    db.run(`CREATE TABLE IF NOT EXISTS completedContent (id TEXT PRIMARY KEY, username TEXT NOT NULL, courseId TEXT NOT NULL, contentId TEXT NOT NULL, completedAt DATETIME DEFAULT CURRENT_TIMESTAMP, studentFile TEXT, UNIQUE(username, courseId, contentId))`);
    db.run(`CREATE TABLE IF NOT EXISTS grades (id TEXT PRIMARY KEY, username TEXT NOT NULL, courseId TEXT NOT NULL, contentId TEXT NOT NULL, grade INTEGER, status TEXT DEFAULT 'pending', comment TEXT, gradedAt DATETIME DEFAULT CURRENT_TIMESTAMP, UNIQUE(username, courseId, contentId))`);
    
    // Room State (Persist only metadata, not the stream)
    db.run(`CREATE TABLE IF NOT EXISTS room_state (courseId TEXT PRIMARY KEY, isActive INTEGER DEFAULT 0, isChatLocked INTEGER DEFAULT 0, isScreenSharing INTEGER DEFAULT 0)`);
    db.run(`CREATE TABLE IF NOT EXISTS room_messages (id TEXT PRIMARY KEY, courseId TEXT NOT NULL, username TEXT NOT NULL, role TEXT NOT NULL, text TEXT NOT NULL, createdAt DATETIME DEFAULT CURRENT_TIMESTAMP)`);
  });
}

// Helpers
function generateId() { return Math.random().toString(36).slice(2, 9); }
function runAsync(sql, params = []) { return new Promise((resolve, reject) => db.run(sql, params, function (err) { if (err) reject(err); else resolve({ id: this.lastID, changes: this.changes }); })); }
function getAsync(sql, params = []) { return new Promise((resolve, reject) => db.get(sql, params, (err, row) => { if (err) reject(err); else resolve(row); })); }
function allAsync(sql, params = []) { return new Promise((resolve, reject) => db.all(sql, params, (err, rows) => { if (err) reject(err); else resolve(rows); })); }

// --- SOCKET.IO SIGNALING LOGIC ---
io.on("connection", (socket) => {
    socket.on("join-room", (courseId, userId) => {
        socket.join(courseId);
        // Notify others (mainly teacher) that someone joined
        socket.to(courseId).emit("user-connected", socket.id);
    });

    socket.on("leave-room", (courseId) => {
        socket.leave(courseId);
        socket.to(courseId).emit("user-disconnected", socket.id);
    });

    // WebRTC Signaling
    socket.on("offer", (payload) => {
        // payload: { target: socketId, sdp: RTCSessionDescription, caller: socketId }
        io.to(payload.target).emit("offer", payload);
    });

    socket.on("answer", (payload) => {
        // payload: { target: socketId, sdp: RTCSessionDescription, caller: socketId }
        io.to(payload.target).emit("answer", payload);
    });

    socket.on("ice-candidate", (payload) => {
        // payload: { target: socketId, candidate: RTCIceCandidate }
        io.to(payload.target).emit("ice-candidate", payload);
    });

    socket.on("sharing-started", (courseId) => {
        socket.to(courseId).emit("sharing-started", socket.id);
    });

    socket.on("sharing-stopped", (courseId) => {
        socket.to(courseId).emit("sharing-stopped");
    });
    
    // New: Request stream (Student asks Teacher for stream)
    socket.on("request-stream", (courseId, studentSocketId) => {
        socket.to(courseId).emit("request-stream", studentSocketId);
    });
    
    // Chat via Socket for lower latency and single source of truth
    socket.on("send-message", async (courseId, message) => {
        // 1. Save to DB
        try {
            const id = message.id || generateId();
            await runAsync("INSERT INTO room_messages (id, courseId, username, role, text, createdAt) VALUES (?, ?, ?, ?, ?, ?)", 
                [id, courseId, message.username, message.role, message.text, message.createdAt || new Date().toISOString()]);
        } catch (e) {
            console.error("Error saving chat message to DB:", e);
        }

        // 2. Broadcast
        io.to(courseId).emit("receive-message", message);
    });
});

// REST API ROUTES
app.post("/api/login", async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await getAsync("SELECT * FROM users WHERE username = ? AND password = ?", [username, password]);
        if (user) { const { password, ...u } = user; res.json(u); } else { res.status(401).json({ error: "Invalid credentials" }); }
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ... [User/Course/Content/Enrollment Routes] ...
app.get("/api/users", async (req, res) => { try { res.json(await allAsync("SELECT id, username, name, role FROM users ORDER BY name")); } catch (e) { res.status(500).json({ error: e.message }); } });
app.post("/api/users", async (req, res) => { try { const { username, password, name, role } = req.body; const id = generateId(); await runAsync("INSERT INTO users (id, username, password, name, role) VALUES (?, ?, ?, ?, ?)", [id, username, password, name, role]); res.status(201).json({ id, username, name, role }); } catch (e) { res.status(500).json({ error: e.message }); } });
app.delete("/api/users/:id", async (req, res) => { try { await runAsync("DELETE FROM users WHERE id = ?", [req.params.id]); res.json({ success: true }); } catch (e) { res.status(500).json({ error: e.message }); } });
app.get("/api/settings/:username", async (req, res) => { try { const row = await getAsync("SELECT * FROM user_settings WHERE username = ?", [req.params.username]); if (row) { let curatedGroups = []; try { if (row.curatedGroups) curatedGroups = JSON.parse(row.curatedGroups); } catch (e) {} res.json({ ...row, curatedGroups }); } else { res.json({ groupId: null, curatedGroups: [] }); } } catch (e) { res.status(500).json({ error: e.message }); } });
app.post("/api/settings", async (req, res) => { try { const { username, groupId, curatedGroups } = req.body; const curatedJson = curatedGroups ? JSON.stringify(curatedGroups) : null; const existing = await getAsync("SELECT * FROM user_settings WHERE username = ?", [username]); if (existing) { await runAsync("UPDATE user_settings SET groupId = ?, curatedGroups = ? WHERE username = ?", [groupId !== undefined ? groupId : existing.groupId, curatedGroups !== undefined ? curatedJson : existing.curatedGroups, username]); } else { await runAsync("INSERT INTO user_settings (username, groupId, curatedGroups) VALUES (?, ?, ?)", [username, groupId, curatedJson]); } res.json({ success: true }); } catch (e) { res.status(500).json({ error: e.message }); } });
app.get("/api/courses", async (req, res) => { try { const rows = await allAsync("SELECT * FROM courses ORDER BY createdAt DESC"); res.json(rows); } catch (e) { res.status(500).json({ error: e.message }); } });
app.get("/api/courses/:id", async (req, res) => { try { const { id } = req.params; const course = await getAsync("SELECT * FROM courses WHERE id = ?", [id]); if (!course) return res.status(404).json({ error: "Course not found" }); course.contents = await allAsync("SELECT * FROM contents WHERE courseId = ?", [id]); res.json(course); } catch (e) { res.status(500).json({ error: e.message }); } });
app.post("/api/courses", async (req, res) => { try { const { title, totalHours, teacherName, specialization, year, targetGroup } = req.body; const id = generateId(); await runAsync("INSERT INTO courses (id, title, totalHours, teacherName, specialization, year, targetGroup) VALUES (?, ?, ?, ?, ?, ?, ?)", [id, title, totalHours || 0, teacherName, specialization || null, year || null, targetGroup || null]); await runAsync("INSERT OR IGNORE INTO room_state (courseId, isActive, isChatLocked) VALUES (?, 0, 0)", [id]); const course = await getAsync("SELECT * FROM courses WHERE id = ?", [id]); course.contents = []; res.status(201).json(course); } catch (e) { res.status(500).json({ error: e.message }); } });
app.delete("/api/courses/:id", async (req, res) => { try { await runAsync("DELETE FROM courses WHERE id = ?", [req.params.id]); res.json({ success: true }); } catch (e) { res.status(500).json({ error: e.message }); } });
app.post("/api/courses/:courseId/contents", upload.single("file"), async (req, res) => { try { const id = generateId(); await runAsync("INSERT INTO contents (id, courseId, title, kind, description, hours, teacherFile) VALUES (?, ?, ?, ?, ?, ?, ?)", [id, req.params.courseId, req.body.title, req.body.kind, req.body.description, Number(req.body.hours), req.file ? `/uploads/${req.file.filename}` : null]); res.status(201).json({}); } catch (e) { res.status(500).json({ error: e.message }); } });
app.post("/api/enrollments", async (req, res) => { try { const id = generateId(); await runAsync("INSERT INTO enrollments (id, username, courseId, status) VALUES (?, ?, ?, ?)", [id, req.body.username, req.body.courseId, 'pending']); res.status(201).json({ success: true }); } catch (e) { res.status(500).json({ error: e.message }); } });
app.get("/api/enrollments/pending", async (req, res) => { try { res.json(await allAsync(`SELECT e.*, c.title as courseTitle FROM enrollments e JOIN courses c ON e.courseId = c.id WHERE e.status = 'pending' ORDER BY e.enrolledAt DESC`)); } catch (e) { res.status(500).json({ error: e.message }); } });
app.post("/api/enrollments/:id/approve", async (req, res) => { try { await runAsync("UPDATE enrollments SET status = 'active' WHERE id = ?", [req.params.id]); res.json({ success: true }); } catch (e) { res.status(500).json({ error: e.message }); } });
app.post("/api/enrollments/:id/reject", async (req, res) => { try { await runAsync("DELETE FROM enrollments WHERE id = ?", [req.params.id]); res.json({ success: true }); } catch (e) { res.status(500).json({ error: e.message }); } });
app.get("/api/enrollments/:username/:courseId", async (req, res) => { try { const enrollment = await getAsync("SELECT * FROM enrollments WHERE username = ? AND courseId = ?", [req.params.username, req.params.courseId]); res.json({ enrolled: !!enrollment, status: enrollment ? enrollment.status : null }); } catch (e) { res.status(500).json({ error: e.message }); } });
app.get("/api/reminders/:specialization/:year", async (req, res) => { try { res.json(await allAsync("SELECT * FROM reminders WHERE specialization = ? AND year = ? ORDER BY reminderDate DESC", [req.params.specialization, parseInt(req.params.year)])); } catch (e) { res.status(500).json({ error: e.message }); } });
app.post("/api/reminders", async (req, res) => { try { const id = generateId(); await runAsync("INSERT INTO reminders (id, title, description, specialization, year, teacherName, reminderDate, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [id, req.body.title, req.body.description, req.body.specialization, req.body.year, req.body.teacherName, req.body.reminderDate, req.body.category]); res.status(201).json({}); } catch (e) { res.status(500).json({ error: e.message }); } });
app.delete("/api/reminders/:id", async (req, res) => { try { await runAsync("DELETE FROM reminders WHERE id = ?", [req.params.id]); res.json({ success: true }); } catch (e) { res.status(500).json({ error: e.message }); } });
app.post("/api/submissions", upload.single("file"), async (req, res) => { try { const { username, courseId, contentId } = req.body; const id = generateId(); await runAsync("INSERT OR REPLACE INTO completedContent (id, username, courseId, contentId, studentFile) VALUES (?, ?, ?, ?, ?)", [id, username, courseId, contentId, req.file ? `/uploads/${req.file.filename}` : null]); res.json({ success: true }); } catch (e) { res.status(500).json({ error: e.message }); } });
app.get("/api/submissions/:contentId", async (req, res) => { try { res.json(await allAsync("SELECT * FROM completedContent WHERE contentId = ?", [req.params.contentId])); } catch (e) { res.status(500).json({ error: e.message }); } });
app.get("/api/progress/:username/:courseId", async (req, res) => { try { res.json(await allAsync("SELECT * FROM completedContent WHERE username = ? AND courseId = ?", [req.params.username, req.params.courseId])); } catch (e) { res.status(500).json({ error: e.message }); } });

// --- ROOM REST API ---
app.get("/api/room/:courseId", async (req, res) => {
    try {
        const { courseId } = req.params;
        let room = await getAsync("SELECT * FROM room_state WHERE courseId = ?", [courseId]);
        if (!room) {
             await runAsync("INSERT OR IGNORE INTO room_state (courseId, isActive, isChatLocked, isScreenSharing) VALUES (?, 0, 0, 0)", [courseId]);
             room = { courseId, isActive: 0, isChatLocked: 0, isScreenSharing: 0 };
        }
        res.json(room);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/room/:courseId/update", async (req, res) => {
    try {
        const { courseId } = req.params;
        const { isActive, isChatLocked, isScreenSharing } = req.body;
        const updates = []; const params = [];
        if (isActive !== undefined) { updates.push("isActive = ?"); params.push(isActive); }
        if (isChatLocked !== undefined) { updates.push("isChatLocked = ?"); params.push(isChatLocked); }
        if (isScreenSharing !== undefined) { updates.push("isScreenSharing = ?"); params.push(isScreenSharing); }
        params.push(courseId);
        if (updates.length > 0) {
            await runAsync(`UPDATE room_state SET ${updates.join(", ")} WHERE courseId = ?`, params);
            // Broadcast state change via Socket
            io.to(courseId).emit("room-state-changed", req.body);
        }
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get("/api/room/:courseId/messages", async (req, res) => {
    try { res.json(await allAsync("SELECT * FROM room_messages WHERE courseId = ? ORDER BY createdAt ASC", [req.params.courseId])); } catch (e) { res.status(500).json({ error: e.message }); }
});

// REMOVED DUPLICATE BROADCAST FROM HERE, MOVED TO SOCKET HANDLER
app.post("/api/room/:courseId/message", async (req, res) => {
    // This endpoint can still exist for logging or external access, 
    // but the client should NOT call it for live chat to avoid double messages.
    // We will just save to DB here if called, but not emit socket event.
    try {
        const { username, role, text } = req.body;
        const id = generateId();
        await runAsync("INSERT INTO room_messages (id, courseId, username, role, text) VALUES (?, ?, ?, ?, ?)", [id, req.params.courseId, username, role, text]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// STATIC
const distPath = join(__dirname, 'dist');
if (existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get(/.*/, (req, res) => {
    if (req.path.startsWith('/api/')) return res.status(404).json({ error: "API route not found" });
    res.sendFile(join(distPath, 'index.html'));
  });
}

if (!server) { 
    server = httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`)); 
}

export default app;
