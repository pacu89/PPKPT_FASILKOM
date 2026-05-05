import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import { v4 as uuidv4 } from "uuid";
import CryptoJS from "crypto-js";
import path from "path";
import fs from "fs";
import multer from "multer";
import archiver from "archiver";
// @ts-ignore
import zipEncrypted from "archiver-zip-encrypted";
import crypto from "crypto";
import PDFDocument from "pdfkit";

// Register the encrypted zip format
archiver.registerFormat('zip-encrypted', zipEncrypted);

// Configuration
const PORT = 3000;
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "ppkpt-unsri-secret-key-2024";
const db = new Database("ppkpt.db");

// Secure Uploads Directory (Not in public/dist)
const UPLOAD_DIR = path.join(process.cwd(), "secure_uploads");
const EXPORT_DIR = path.join(process.cwd(), "exports");

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}
if (!fs.existsSync(EXPORT_DIR)) {
  fs.mkdirSync(EXPORT_DIR, { recursive: true });
}

// Multer Configuration for Secure Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Encryption Helpers
const encrypt = (text: string) => {
  if (!text) return null;
  return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
};

const decrypt = (ciphertext: string) => {
  if (!ciphertext) return null;
  const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};

// Database Initialization
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT DEFAULT 'satgas'
  );

  CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    tracking_code TEXT UNIQUE,
    reporter_name TEXT, -- Encrypted
    reporter_contact TEXT, -- Encrypted
    reporter_identity_number TEXT, -- Encrypted (NIM/NIP)
    is_anonymous INTEGER DEFAULT 0,
    victim_name TEXT, -- Encrypted
    category TEXT,
    incident_date TEXT,
    incident_location TEXT,
    chronology TEXT,
    evidence_url TEXT,
    status TEXT DEFAULT 'PENDING', -- PENDING, INVESTIGATING, RESOLVED, REJECTED
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    report_id TEXT,
    user_id_satgas TEXT,
    action TEXT,
    previous_status TEXT,
    new_status TEXT,
    catatan_petugas TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(report_id) REFERENCES reports(id),
    FOREIGN KEY(user_id_satgas) REFERENCES users(id)
  );
`);

// Migration: Ensure all required columns exist in 'reports' table
try {
  const columns = db.prepare("PRAGMA table_info(reports)").all();
  const existingColumns = columns.map((col: any) => col.name);
  
  const requiredColumns = [
    { name: 'category', type: 'TEXT' },
    { name: 'evidence_url', type: 'TEXT' },
    { name: 'reporter_identity_number', type: 'TEXT' },
    { name: 'assigned_to', type: 'TEXT' }
  ];

  requiredColumns.forEach(col => {
    if (!existingColumns.includes(col.name)) {
      db.exec(`ALTER TABLE reports ADD COLUMN ${col.name} ${col.type};`);
      console.log(`Migration: Added '${col.name}' column to 'reports' table.`);
    }
  });

  // Migration for audit_logs table
  const auditLogsColumns = db.prepare("PRAGMA table_info(audit_logs)").all();
  const existingAuditColumns = auditLogsColumns.map((col: any) => col.name);
  
  const requiredAuditColumns = [
    { name: 'user_id_satgas', type: 'TEXT' },
    { name: 'catatan_petugas', type: 'TEXT' },
    { name: 'previous_status', type: 'TEXT' },
    { name: 'new_status', type: 'TEXT' }
  ];

  requiredAuditColumns.forEach(col => {
    if (!existingAuditColumns.includes(col.name)) {
      db.exec(`ALTER TABLE audit_logs ADD COLUMN ${col.name} ${col.type};`);
      console.log(`Migration: Added '${col.name}' column to 'audit_logs' table.`);
    }
  });

  // Ensure admin user has admin role
  db.prepare("UPDATE users SET role = 'admin' WHERE username = 'admin'").run();
} catch (err) {
  console.error("Migration error:", err);
}

// Seed Admin User if not exists
const adminExists = db.prepare("SELECT * FROM users WHERE username = ?").get("admin");
if (!adminExists) {
  db.prepare("INSERT INTO users (id, username, password, role) VALUES (?, ?, ?, ?)").run(
    uuidv4(),
    "admin",
    "admin123", // In production, use bcrypt
    "admin"
  );
}

// Seed Default Satgas User if not exists
const satgasExists = db.prepare("SELECT * FROM users WHERE username = ?").get("satgas1");
if (!satgasExists) {
  db.prepare("INSERT INTO users (id, username, password, role) VALUES (?, ?, ?, ?)").run(
    uuidv4(),
    "satgas1",
    "satgas123", // In production, use bcrypt
    "satgas"
  );
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // --- API ROUTES ---

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // Submit Report (Multipart Form Data)
  app.post("/api/reports", upload.single("evidence"), (req, res) => {
    console.log("Received report submission request");
    try {
      const {
        reporter_name,
        reporter_contact,
        reporter_identity_number,
        is_anonymous,
        victim_name,
        category,
        incident_date,
        incident_location,
        chronology
      } = req.body;

      const evidence_url = req.file ? req.file.filename : null;

      const id = uuidv4();
      
      // Generate unique 8-character tracking code (e.g., PPK-XXXX)
      const generateTrackingCode = () => {
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Avoid ambiguous chars
        let code = "PPK-";
        for (let i = 0; i < 4; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
      };

      let tracking_code = generateTrackingCode();
      
      // Ensure uniqueness
      let exists = db.prepare("SELECT 1 FROM reports WHERE tracking_code = ?").get(tracking_code);
      while (exists) {
        tracking_code = generateTrackingCode();
        exists = db.prepare("SELECT 1 FROM reports WHERE tracking_code = ?").get(tracking_code);
      }

      const stmt = db.prepare(`
        INSERT INTO reports (
          id, tracking_code, reporter_name, reporter_contact, 
          reporter_identity_number, is_anonymous, victim_name, 
          category, incident_date, incident_location, chronology, evidence_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        id,
        tracking_code,
        is_anonymous === 'true' ? null : encrypt(reporter_name),
        is_anonymous === 'true' ? null : encrypt(reporter_contact),
        is_anonymous === 'true' ? null : encrypt(reporter_identity_number),
        is_anonymous === 'true' ? 1 : 0,
        encrypt(victim_name),
        category,
        incident_date,
        incident_location,
        chronology,
        evidence_url
      );

      res.status(201).json({ 
        success: true, 
        tracking_code,
        message: "Laporan berhasil dikirim. Simpan kode tracking Anda." 
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Gagal mengirim laporan" });
    }
  });

  // Track Report
  app.get("/api/reports/track/:code", (req, res) => {
    const report = db.prepare("SELECT tracking_code, status, created_at FROM reports WHERE tracking_code = ?").get(req.params.code);
    if (!report) return res.status(404).json({ error: "Kode tracking tidak ditemukan" });
    res.json(report);
  });

  // Admin Login (Simplified for demo)
  app.post("/api/auth/login", (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE username = ? AND password = ?").get(username, password);
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    res.json({ id: user.id, username: user.username, role: user.role });
  });

  // Get All Reports (Satgas Only)
  app.get("/api/admin/reports", (req, res) => {
    const { userId, role } = req.query;
    
    let reports;
    if (role === 'admin') {
      reports = db.prepare("SELECT * FROM reports ORDER BY created_at DESC").all();
    } else if (role === 'satgas') {
      reports = db.prepare("SELECT * FROM reports WHERE assigned_to = ? ORDER BY created_at DESC").all(userId);
    } else {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const decryptedReports = reports.map((r: any) => ({
      ...r,
      reporter_name: decrypt(r.reporter_name),
      reporter_contact: decrypt(r.reporter_contact),
      reporter_identity_number: decrypt(r.reporter_identity_number),
      victim_name: decrypt(r.victim_name)
    }));
    res.json(decryptedReports);
  });

  // Update Status (Satgas Only)
  app.patch("/api/admin/reports/:id/status", (req, res) => {
    const { status, catatan_petugas, user_id_satgas } = req.body;
    const reportId = req.params.id;

    if (!catatan_petugas || !user_id_satgas) {
      return res.status(400).json({ error: "Catatan petugas dan ID Satgas wajib diisi." });
    }

    const report = db.prepare("SELECT status FROM reports WHERE id = ?").get(reportId);
    if (!report) return res.status(404).json({ error: "Report not found" });

    const updateStmt = db.prepare("UPDATE reports SET status = ? WHERE id = ?");
    const logStmt = db.prepare("INSERT INTO audit_logs (id, report_id, user_id_satgas, action, previous_status, new_status, catatan_petugas) VALUES (?, ?, ?, ?, ?, ?, ?)");

    const transaction = db.transaction(() => {
      updateStmt.run(status, reportId);
      logStmt.run(uuidv4(), reportId, user_id_satgas, "UPDATE_STATUS", report.status, status, catatan_petugas);
    });

    transaction();
    res.json({ success: true });
  });

  // Get Audit Logs
  app.get("/api/admin/reports/:id/logs", (req, res) => {
    const logs = db.prepare(`
      SELECT al.*, u.username as officer_name 
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id_satgas = u.id
      WHERE al.report_id = ? 
      ORDER BY al.created_at ASC
    `).all(req.params.id);
    res.json(logs);
  });

  // Assign Satgas
  app.patch("/api/admin/reports/:id/assign", (req, res) => {
    const { assigned_to, user_id_admin } = req.body;
    const reportId = req.params.id;

    if (!assigned_to || !user_id_admin) {
      return res.status(400).json({ error: "ID Satgas dan ID Admin wajib diisi." });
    }

    const report = db.prepare("SELECT status FROM reports WHERE id = ?").get(reportId);
    if (!report) return res.status(404).json({ error: "Report not found" });

    const updateStmt = db.prepare("UPDATE reports SET assigned_to = ? WHERE id = ?");
    const logStmt = db.prepare("INSERT INTO audit_logs (id, report_id, user_id_satgas, action, previous_status, new_status, catatan_petugas) VALUES (?, ?, ?, ?, ?, ?, ?)");

    const transaction = db.transaction(() => {
      updateStmt.run(assigned_to, reportId);
      logStmt.run(uuidv4(), reportId, user_id_admin, "ASSIGN_SATGAS", report.status, report.status, "Admin menugaskan satgas");
    });

    transaction();
    res.json({ success: true });
  });

  // Export Report as Encrypted ZIP (Step-up Auth)
  app.post("/api/admin/reports/:id/export", async (req, res) => {
    const { password, username } = req.body;
    const reportId = req.params.id;

    // 1. Verify Step-up Auth (Re-verify admin password)
    const user = db.prepare("SELECT * FROM users WHERE username = ? AND password = ?").get(username, password);
    if (!user) return res.status(401).json({ error: "Konfirmasi password gagal. Akses ditolak." });

    // 2. Fetch Report Data
    const report: any = db.prepare("SELECT * FROM reports WHERE id = ?").get(reportId);
    if (!report) return res.status(404).json({ error: "Laporan tidak ditemukan." });

    // 3. Fetch Audit Logs for PDF
    const logs: any[] = db.prepare(`
      SELECT al.*, u.username as officer_name 
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id_satgas = u.id
      WHERE al.report_id = ? 
      ORDER BY al.created_at ASC
    `).all(reportId);

    try {
      const zipPassword = crypto.randomBytes(6).toString('hex').toUpperCase(); // 12 chars
      const zipFileName = `Export-${report.tracking_code}-${Date.now()}.zip`;
      const zipPath = path.join(EXPORT_DIR, zipFileName);
      
      const output = fs.createWriteStream(zipPath);
      const archive = archiver('zip-encrypted', {
        zlib: { level: 9 },
        encryptionMethod: 'aes256',
        password: zipPassword
      });

      output.on('close', () => {
        // Log the export action
        db.prepare("INSERT INTO audit_logs (id, report_id, user_id_satgas, action, catatan_petugas) VALUES (?, ?, ?, ?, ?)")
          .run(uuidv4(), reportId, user.id, "EXPORT_ZIP", `Laporan diekspor sebagai ZIP terenkripsi dengan folder terorganisir.`);
        
        res.json({ 
          success: true, 
          zip_password: zipPassword,
          download_url: `/api/admin/download-export/${zipFileName}`
        });
      });

      archive.on('error', (err) => { throw err; });
      archive.pipe(output);

      // --- GENERATE PDF REPORT ---
      const doc = new PDFDocument({ margin: 50 });
      const pdfBuffers: Buffer[] = [];
      doc.on('data', (chunk) => pdfBuffers.push(chunk));
      
      const pdfPromise = new Promise<Buffer>((resolve) => {
        doc.on('end', () => resolve(Buffer.concat(pdfBuffers)));
      });

      // PDF Content
      doc.fontSize(20).text('LAPORAN RESMI PPKPT FASILKOM UNSRI', { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, { align: 'right' });
      doc.moveDown();

      doc.fontSize(12).font('Helvetica-Bold').text('INFORMASI LAPORAN');
      doc.font('Helvetica').fontSize(10);
      doc.text(`Kode Tracking: ${report.tracking_code}`);
      doc.text(`Status: ${report.status}`);
      doc.text(`Tanggal Lapor: ${report.created_at}`);
      doc.moveDown();

      doc.fontSize(12).font('Helvetica-Bold').text('IDENTITAS PELAPOR');
      doc.font('Helvetica').fontSize(10);
      if (report.is_anonymous) {
        doc.text('Status: ANONIM');
      } else {
        doc.text(`Nama: ${decrypt(report.reporter_name)}`);
        doc.text(`NIM/NIP: ${decrypt(report.reporter_identity_number)}`);
        doc.text(`Kontak: ${decrypt(report.reporter_contact)}`);
      }
      doc.moveDown();

      doc.fontSize(12).font('Helvetica-Bold').text('DETAIL KEJADIAN');
      doc.font('Helvetica').fontSize(10);
      doc.text(`Kategori: ${report.category}`);
      doc.text(`Korban: ${decrypt(report.victim_name)}`);
      doc.text(`Tanggal Kejadian: ${report.incident_date}`);
      doc.text(`Lokasi Kejadian: ${report.incident_location}`);
      doc.moveDown();

      doc.fontSize(12).font('Helvetica-Bold').text('KRONOLOGI');
      doc.font('Helvetica').fontSize(10);
      doc.text(report.chronology, { align: 'justify' });
      doc.moveDown();

      doc.fontSize(12).font('Helvetica-Bold').text('RIWAYAT PENANGANAN');
      doc.font('Helvetica').fontSize(10);
      logs.forEach((log, index) => {
        doc.text(`${index + 1}. [${log.created_at}] ${log.previous_status || 'START'} -> ${log.new_status || log.action}`);
        doc.text(`   Catatan: ${log.catatan_petugas || '-'}`, { indent: 15 });
        doc.text(`   Petugas: ${log.officer_name || 'System'}`, { indent: 15 });
        doc.moveDown(0.5);
      });

      doc.end();
      const pdfBuffer = await pdfPromise;

      // --- ORGANIZE ZIP STRUCTURE ---
      
      // 1. Ringkasan Folder
      archive.append(pdfBuffer, { name: 'Ringkasan/Laporan-Resmi-PPKPT.pdf' });
      
      // Add plain text version as backup
      const chronologyContent = `LAPORAN PPKPT FASILKOM UNSRI\nKODE: ${report.tracking_code}\n... (Lihat PDF untuk detail lengkap)`;
      archive.append(chronologyContent, { name: 'Ringkasan/Ringkasan-Singkat.txt' });

      // 2. Bukti_Digital Folder
      if (report.evidence_url) {
        const evidencePath = path.join(UPLOAD_DIR, report.evidence_url);
        if (fs.existsSync(evidencePath)) {
          const ext = path.extname(report.evidence_url);
          archive.file(evidencePath, { name: `Bukti_Digital/BUKTI-UTAMA${ext}` });
        }
      }

      // 3. Log Folder
      const logContent = logs.map(l => `[${l.created_at}] ${l.action}: ${l.previous_status} -> ${l.new_status} | Petugas: ${l.officer_name} | Catatan: ${l.catatan_petugas}`).join('\n');
      archive.append(logContent, { name: 'Log/Audit-Trail-Lengkap.txt' });

      await archive.finalize();
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Gagal membuat file ZIP." });
    }
  });

  // Download Exported ZIP
  app.get("/api/admin/download-export/:filename", (req, res) => {
    const filePath = path.join(EXPORT_DIR, req.params.filename);
    if (!fs.existsSync(filePath)) return res.status(404).send("File not found");
    
    res.download(filePath, (err) => {
      if (!err) {
        // Optional: Delete file after download to keep it secure
        // fs.unlinkSync(filePath);
      }
    });
  });

  // --- USER MANAGEMENT ROUTES ---

  // Get All Users
  app.get("/api/admin/users", (req, res) => {
    const users = db.prepare("SELECT id, username, role FROM users").all();
    res.json(users);
  });

  // Create User
  app.post("/api/admin/users", (req, res) => {
    const { username, password, role } = req.body;
    try {
      const id = uuidv4();
      db.prepare("INSERT INTO users (id, username, password, role) VALUES (?, ?, ?, ?)")
        .run(id, username, password, role || 'satgas');
      res.status(201).json({ success: true, id });
    } catch (error) {
      res.status(400).json({ error: "Username sudah digunakan." });
    }
  });

  // Update User
  app.patch("/api/admin/users/:id", (req, res) => {
    const { username, password, role } = req.body;
    const userId = req.params.id;
    try {
      if (password) {
        db.prepare("UPDATE users SET username = ?, password = ?, role = ? WHERE id = ?")
          .run(username, password, role, userId);
      } else {
        db.prepare("UPDATE users SET username = ?, role = ? WHERE id = ?")
          .run(username, role, userId);
      }
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: "Gagal memperbarui user." });
    }
  });

  // Delete User
  app.delete("/api/admin/users/:id", (req, res) => {
    const userId = req.params.id;
    // Prevent deleting the last admin if necessary, but for now simple delete
    db.prepare("DELETE FROM users WHERE id = ?").run(userId);
    res.json({ success: true });
  });

  // Global Error Handler for API
  app.use("/api", (err: any, req: any, res: any, next: any) => {
    console.error("API Error:", err);
    res.status(500).json({ error: err.message || "Internal Server Error" });
  });

  // --- VITE MIDDLEWARE ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
