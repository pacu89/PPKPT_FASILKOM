-- schema untuk Supabase (jalankan di SQL Editor Supabase)

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'satgas'
);

CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sla_pending INTEGER DEFAULT 7,
  sla_investigating INTEGER DEFAULT 30,
  sla_recommended INTEGER DEFAULT 7,
  sla_resolved INTEGER DEFAULT 7,
  max_upload_size_mb INTEGER DEFAULT 10,
  categories JSONB DEFAULT '["Kekerasan Fisik", "Kekerasan Psikis", "Kekerasan Seksual", "Perundungan (Bullying)", "Intoleransi", "Pelecehan Seksual via Media Elektronik", "Lainnya"]'::jsonb
);

CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_code TEXT UNIQUE NOT NULL,
  reporter_name TEXT,
  reporter_contact TEXT,
  reporter_identity_number TEXT,
  is_anonymous BOOLEAN DEFAULT FALSE,
  victim_name TEXT,
  category TEXT,
  incident_date TEXT,
  incident_location TEXT,
  chronology TEXT,
  evidence_url TEXT,
  status TEXT DEFAULT 'PENDING',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  identitas_korban TEXT,
  identitas_saksi TEXT,
  tanggal_surat_rekomendasi TEXT,
  file_ringkasan_kasus TEXT,
  file_surat_rekomendasi TEXT,
  nomor_sk_sanksi TEXT,
  tanggal_sk_sanksi TEXT,
  file_sk_sanksi TEXT
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
  user_id_satgas UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT,
  previous_status TEXT,
  new_status TEXT,
  catatan_petugas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert Default Admin User
INSERT INTO users (username, password, role) VALUES ('admin', 'password', 'admin') ON CONFLICT DO NOTHING;
-- Insert Default Settings
INSERT INTO settings (sla_pending) VALUES (7);
