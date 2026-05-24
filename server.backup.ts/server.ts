import express from "express";
import { createServer as createViteServer } from "vite";
import { v4 as uuidv4 } from "uuid";
import CryptoJS from "crypto-js";
import path from "path";
import multer from "multer";
import archiver from "archiver";
// @ts-ignore
import zipEncrypted from "archiver-zip-encrypted";
import crypto from "crypto";
import PDFDocument from "pdfkit";
import { PassThrough } from "stream";
import fs from "fs";

archiver.registerFormat('zip-encrypted', zipEncrypted);

const PORT = 3000;
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "ppkpt-unsri-secret-key-2024";

// INIT DATABASE BIASA (JSON File)
const DB_FILE = path.join(process.cwd(), "database.json");
const UPLOADS_DIR = path.join(process.cwd(), "uploads");
const EXPORTS_DIR = path.join(process.cwd(), "exports");

[DB_FILE, UPLOADS_DIR, EXPORTS_DIR].forEach(dir => {
  if (dir !== DB_FILE && !fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

interface Database {
  reports: any[];
  users: any[];
  audit_logs: any[];
  settings: any;
}

const defaultDb: Database = {
  reports: [],
  users: [
    { id: "admin-default", username: "admin", password: "password", role: "admin" }
  ],
  audit_logs: [],
  settings: {
    sla_pending: 7,
    sla_investigating: 30,
    sla_recommended: 7,
    sla_resolved: 7,
    max_upload_size_mb: 10,
    categories: [
      "Kekerasan Fisik",
      "Kekerasan Psikis",
      "Kekerasan Seksual",
      "Perundungan (Bullying)",
      "Intoleransi",
      "Pelecehan Seksual via Media Elektronik",
      "Lainnya"
    ]
  }
};

if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify(defaultDb, null, 2), 'utf-8');
}

const getDb = (): Database => {
  try {
    const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    if (!db.settings) {
      db.settings = defaultDb.settings;
      saveDb(db);
    }
    return db;
  } catch {
    return defaultDb;
  }
};

const saveDb = (db: Database) => {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
};

const upload = multer({ 
  storage: multer.diskStorage({
    destination: UPLOADS_DIR,
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `evidence-${Date.now()}-${uuidv4()}${ext}`);
    }
  }),
  limits: { fileSize: 500 * 1024 * 1024 } // Large fixed limit, accurate limit enforced by sizeLimitMiddleware
});

const sizeLimitMiddleware = (req: any, res: any, next: any) => {
  const db = getDb();
  const maxMb = db.settings?.max_upload_size_mb || 10;
  const maxSize = maxMb * 1024 * 1024;
  const contentLength = parseInt(req.headers['content-length'] || '0');
  
  // Adding 5MB overhead for form data fields apart from the file
  if (contentLength > maxSize + (5 * 1024 * 1024)) {
    return res.status(413).json({ error: `File terlalu besar. Maksimum upload adalah ${maxMb} MB.` });
  }
  next();
};

const encrypt = (text: string | null | undefined) => {
  if (!text) return null;
  return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
};

const decrypt = (ciphertext: string | null | undefined) => {
  if (!ciphertext) return null;
  const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};

async function startServer() {
  const app = express();
  app.use(express.json());

  // Static serving for downloads
  app.use('/downloads/exports', express.static(EXPORTS_DIR));
  app.use('/downloads/evidence', express.static(UPLOADS_DIR));

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString(), db_type: "local_json" });
  });

  app.post("/api/reports", sizeLimitMiddleware, upload.single("evidence"), async (req, res) => {
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

      let evidence_url = req.file ? req.file.filename : null;

      const generateTrackingCode = () => {
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        let code = "PPK-";
        for (let i = 0; i < 4; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
        return code;
      };

      const db = getDb();
      let tracking_code = generateTrackingCode();
      while (db.reports.some(r => r.tracking_code === tracking_code)) {
        tracking_code = generateTrackingCode();
      }

      const id = uuidv4();
      
      db.reports.push({
        id,
        tracking_code,
        reporter_name: is_anonymous === 'true' ? null : encrypt(reporter_name),
        reporter_contact: is_anonymous === 'true' ? null : encrypt(reporter_contact),
        reporter_identity_number: is_anonymous === 'true' ? null : encrypt(reporter_identity_number),
        is_anonymous: is_anonymous === 'true' ? 1 : 0,
        victim_name: encrypt(victim_name),
        category,
        incident_date,
        incident_location,
        chronology,
        evidence_url,
        status: 'PENDING',
        created_at: new Date().toISOString(),
        assigned_to: null
      });

      saveDb(db);

      res.status(201).json({ success: true, tracking_code, message: "Laporan berhasil dikirim." });
    } catch (error: any) {
      console.error("Upload Error:", error);
      res.status(500).json({ error: error.message || "Gagal mengirim laporan" });
    }
  });

  app.get("/api/reports/track/:code", async (req, res) => {
    try {
      const db = getDb();
      const report = db.reports.find(r => r.tracking_code === req.params.code);
      if (!report) return res.status(404).json({ error: "Kode tracking tidak ditemukan" });
      res.json({ 
        tracking_code: report.tracking_code, 
        status: report.status, 
        created_at: report.created_at,
        nomor_sk_sanksi: report.nomor_sk_sanksi,
        tanggal_sk_sanksi: report.tanggal_sk_sanksi
      });
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const db = getDb();
      const user = db.users.find(u => u.username === username && u.password === password);
      
      if (!user) return res.status(401).json({ error: "Invalid credentials" });
      res.json({ id: user.id, username: user.username, role: user.role });
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.get("/api/admin/reports", async (req, res) => {
    try {
      const { userId, role } = req.query;
      const db = getDb();
      
      let reports = db.reports.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      if (role === 'satgas') {
        reports = reports.filter(r => r.assigned_to === userId);
      } else if (role !== 'admin') {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const decryptedReports = reports.map((r: any) => {
         let victimName = decrypt(r.victim_name) || "";
         if (role === 'admin' && victimName) {
            victimName = victimName.split(" ").map((p: string) => p.charAt(0) + '*'.repeat(Math.max(1, p.length - 1))).join(" ");
         }
         const reportLogs = db.audit_logs.filter(l => l.report_id === r.id);
         const lastUpdated = reportLogs.length > 0 
           ? reportLogs.reduce((latest, current) => new Date(current.created_at) > new Date(latest.created_at) ? current : latest).created_at
           : r.created_at;

         return {
           ...r,
           reporter_name: decrypt(r.reporter_name),
           reporter_contact: decrypt(r.reporter_contact),
           reporter_identity_number: decrypt(r.reporter_identity_number),
           victim_name: victimName,
           last_updated_at: lastUpdated
         };
      });
      res.json(decryptedReports);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.patch("/api/admin/reports/:id/status", sizeLimitMiddleware, upload.fields([
    { name: 'file_ringkasan_kasus', maxCount: 1 },
    { name: 'file_surat_rekomendasi', maxCount: 1 },
    { name: 'file_sk_sanksi', maxCount: 1 }
  ]), async (req, res) => {
    try {
      const { status, catatan_petugas, user_id_satgas, identitas_korban, identitas_saksi, tanggal_surat_rekomendasi, nomor_sk_sanksi, tanggal_sk_sanksi } = req.body;
      const reportId = req.params.id;

      if (!catatan_petugas || !user_id_satgas) {
        return res.status(400).json({ error: "Catatan petugas dan ID Satgas wajib diisi." });
      }

      const db = getDb();
      const report = db.reports.find(r => r.id === reportId);
      if (!report) return res.status(404).json({ error: "Report not found" });

      const prevStatus = report.status;
      report.status = status;

      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      if (status === 'RECOMMENDED') {
        report.identitas_korban = encrypt(identitas_korban || '');
        report.identitas_saksi = encrypt(identitas_saksi || '');
        report.tanggal_surat_rekomendasi = tanggal_surat_rekomendasi;
        
        if (files?.['file_ringkasan_kasus']?.[0]) {
          report.file_ringkasan_kasus = files['file_ringkasan_kasus'][0].filename;
        }
        if (files?.['file_surat_rekomendasi']?.[0]) {
          report.file_surat_rekomendasi = files['file_surat_rekomendasi'][0].filename;
        }
      }

      if (status === 'RESOLVED') {
        report.nomor_sk_sanksi = nomor_sk_sanksi;
        report.tanggal_sk_sanksi = tanggal_sk_sanksi;
        
        if (files?.['file_sk_sanksi']?.[0]) {
          report.file_sk_sanksi = files['file_sk_sanksi'][0].filename;
        }
      }

      db.audit_logs.push({
        id: uuidv4(),
        report_id: reportId,
        user_id_satgas,
        action: "UPDATE_STATUS",
        previous_status: prevStatus,
        new_status: status,
        catatan_petugas,
        created_at: new Date().toISOString()
      });

      saveDb(db);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.get("/api/admin/reports/:id/logs", async (req, res) => {
    try {
      const db = getDb();
      const logs = db.audit_logs
        .filter(l => l.report_id === req.params.id && l.action !== 'EXPORT_ZIP')
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        
      const formattedLogs = logs.map(l => {
        const user = db.users.find(u => u.id === l.user_id_satgas);
        return {
          ...l,
          officer_name: user?.username || 'Unknown'
        };
      });
      res.json(formattedLogs);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.patch("/api/admin/reports/:id/assign", async (req, res) => {
    try {
      const { assigned_to, user_id_admin } = req.body;
      const reportId = req.params.id;

      if (!assigned_to || !user_id_admin) {
        return res.status(400).json({ error: "ID Satgas dan ID Admin wajib diisi." });
      }

      const db = getDb();
      const report = db.reports.find(r => r.id === reportId);
      if (!report) return res.status(404).json({ error: "Report not found" });

      report.assigned_to = assigned_to;

      db.audit_logs.push({
        id: uuidv4(),
        report_id: reportId,
        user_id_satgas: user_id_admin,
        action: "ASSIGN_SATGAS",
        previous_status: report.status,
        new_status: report.status,
        catatan_petugas: "Admin menugaskan satgas",
        created_at: new Date().toISOString()
      });

      saveDb(db);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.post("/api/admin/reports/:id/export", async (req, res) => {
    try {
      const { password, username } = req.body;
      const reportId = req.params.id;
      const db = getDb();

      const user = db.users.find(u => u.username === username && u.password === password);
      if (!user) return res.status(401).json({ error: "Konfirmasi password gagal. Akses ditolak." });

      const report = db.reports.find(r => r.id === reportId);
      if (!report) return res.status(404).json({ error: "Laporan tidak ditemukan." });

      const logs = db.audit_logs
        .filter(l => l.report_id === reportId && l.action !== 'EXPORT_ZIP')
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        .map(l => ({ ...l, officer_name: db.users.find(u => u.id === l.user_id_satgas)?.username || 'Unknown' }));

      const zipPassword = crypto.randomBytes(6).toString('hex').toUpperCase();
      const zipFileName = `Export-${report.tracking_code}-${Date.now()}.zip`;
      const exportPath = path.join(EXPORTS_DIR, zipFileName);
      
      const zipDocPromises = new Promise<void>(async (resolve, reject) => {
        try {
          const archive = archiver('zip-encrypted', {
            zlib: { level: 9 },
            encryptionMethod: 'aes256',
            password: zipPassword
          });

          const output = fs.createWriteStream(exportPath);
          archive.pipe(output);
          output.on('close', resolve);
          archive.on('error', reject);

          const doc = new PDFDocument({ margin: 50 });
          const pdfBuffers: Buffer[] = [];
          doc.on('data', chunk => pdfBuffers.push(chunk));
          const pdfPromise = new Promise<Buffer>(res => doc.on('end', () => res(Buffer.concat(pdfBuffers))));

          doc.fontSize(20).text('LAPORAN RESMI PPKPT FASILKOM UNSRI', { align: 'center' }).moveDown();
          doc.fontSize(10).text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, { align: 'right' }).moveDown();
          doc.fontSize(12).font('Helvetica-Bold').text('INFORMASI LAPORAN');
          doc.font('Helvetica').fontSize(10);
          doc.text(`Kode Tracking: ${report.tracking_code}`);
          doc.text(`Status: ${report.status}`);
          doc.text(`Tanggal Lapor: ${report.created_at || '-'}`).moveDown();
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
          doc.text(`Lokasi Kejadian: ${report.incident_location}`).moveDown();
          doc.fontSize(12).font('Helvetica-Bold').text('KRONOLOGI');
          doc.font('Helvetica').fontSize(10).text(report.chronology, { align: 'justify' }).moveDown();
          doc.fontSize(12).font('Helvetica-Bold').text('RIWAYAT PENANGANAN');
          doc.font('Helvetica').fontSize(10);
          logs.forEach((log, index) => {
            doc.text(`${index + 1}. [${log.created_at}] ${log.previous_status || 'START'} -> ${log.new_status || log.action}`);
            doc.text(`   Catatan: ${log.catatan_petugas || '-'}`, { indent: 15 });
            doc.text(`   Petugas: ${log.officer_name || 'System'}`, { indent: 15 }).moveDown(0.5);
          });
          doc.end();

          const pdfBuffer = await pdfPromise;
          archive.append(pdfBuffer, { name: 'Ringkasan/Laporan-Resmi-PPKPT.pdf' });
          archive.append(`LAPORAN PPKPT FASILKOM UNSRI\nKODE: ${report.tracking_code}\n... (Lihat PDF untuk detail lengkap)`, { name: 'Ringkasan/Ringkasan-Singkat.txt' });

          if (report.evidence_url) {
            const evidencePath = path.join(UPLOADS_DIR, report.evidence_url);
            if (fs.existsSync(evidencePath)) {
              archive.file(evidencePath, { name: `Bukti_Digital/BUKTI-UTAMA${path.extname(report.evidence_url)}` });
            }
          }

          archive.append(logs.map(l => `[${l.created_at}] ${l.action}: ${l.previous_status} -> ${l.new_status} | Petugas: ${l.officer_name} | Catatan: ${l.catatan_petugas}`).join('\n'), { name: 'Log/Audit-Trail-Lengkap.txt' });
          await archive.finalize();
        } catch (e) {
          reject(e);
        }
      });

      await zipDocPromises;

      res.json({ 
        success: true, 
        zip_password: zipPassword,
        download_url: `/downloads/exports/${zipFileName}`
      });
    } catch (error: any) {
      console.error("ZIP Generation Error:", error);
      res.status(500).json({ error: error.message || "Gagal membuat file ZIP." });
    }
  });

  app.get("/api/admin/users", async (req, res) => {
    try {
      const db = getDb();
      res.json(db.users.map(u => ({ id: u.id, username: u.username, role: u.role })));
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.get("/api/admin/settings", async (req, res) => {
    try {
      const db = getDb();
      res.json(db.settings || defaultDb.settings);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.patch("/api/admin/settings", async (req, res) => {
    try {
      const db = getDb();
      db.settings = { ...db.settings, ...req.body };
      saveDb(db);
      res.json({ success: true, settings: db.settings });
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.post("/api/admin/users", async (req, res) => {
    try {
      const { username, password, role } = req.body;
      const db = getDb();
      if (db.users.some(u => u.username === username)) {
        return res.status(400).json({ error: "Username sudah digunakan." });
      }
      
      const id = uuidv4();
      db.users.push({ id, username, password, role: role || 'satgas' });
      saveDb(db);
      res.status(201).json({ success: true, id });
    } catch (error) {
      res.status(400).json({ error: "Terjadi kesalahan." });
    }
  });

  app.patch("/api/admin/users/:id", async (req, res) => {
    try {
      const { username, password, role } = req.body;
      const db = getDb();
      const user = db.users.find(u => u.id === req.params.id);
      if (!user) return res.status(404).json({ error: "User not found" });

      if (username) user.username = username;
      if (role) user.role = role;
      if (password) user.password = password;
      
      saveDb(db);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: "Gagal memperbarui user." });
    }
  });

  app.delete("/api/admin/users/:id", async (req, res) => {
    try {
      const db = getDb();
      db.users = db.users.filter(u => u.id !== req.params.id);
      saveDb(db);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Gagal menghapus user." });
    }
  });

  app.use("/api", (err: any, req: any, res: any, next: any) => {
    console.error("API Error:", err);
    res.status(500).json({ error: err.message || "Internal Server Error" });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
