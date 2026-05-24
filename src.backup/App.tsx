import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  FileText, 
  Search, 
  Lock, 
  AlertCircle, 
  CheckCircle2, 
  ChevronRight, 
  User, 
  MapPin, 
  Calendar, 
  Clock,
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  LogOut,
  Activity,
  LayoutDashboard,
  Users,
  Settings,
  Bell,
  Menu,
  X,
  Database,
  Fingerprint,
  Briefcase,
  List,
  Phone
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function getWorkingDays(startDateStr: string, endDateStr: string = new Date().toISOString()) {
  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);
  let count = 0;
  let current = new Date(startDate);
  // Setting the time to midnight for accurate day counting
  current.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  
  while (current <= end) {
      let dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          count++;
      }
      current.setDate(current.getDate() + 1);
  }
  return Math.max(0, count - 1); // subtract 1 so day 0 is the start day itself
}

// --- Types ---
type View = 'landing' | 'report' | 'track' | 'admin-login' | 'admin-dashboard';
type AdminTab = 'reports' | 'users' | 'settings_sla' | 'settings_upload' | 'settings_category';
type Status = 'PENDING' | 'INVESTIGATING' | 'RECOMMENDED' | 'RESOLVED' | 'OUT_OF_SCOPE';

interface UserData {
  id: string;
  username: string;
  role: string;
}

interface Report {
  id: string;
  tracking_code: string;
  reporter_name: string | null;
  reporter_contact: string | null;
  reporter_identity_number: string | null;
  is_anonymous: boolean;
  victim_name: string;
  category: string;
  incident_date: string;
  incident_location: string;
  chronology: string;
  evidence_url: string | null;
  status: Status;
  created_at: string;
  last_updated_at: string;
  assigned_to: string | null;
}

interface AuditLog {
  id: string;
  report_id: string;
  user_id_satgas: string;
  action: string;
  previous_status: string;
  new_status: string;
  catatan_petugas: string;
  created_at: string;
  officer_name: string;
}

// --- Components ---

const Button = ({ 
  children, 
  className, 
  variant = 'primary', 
  ...props 
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'navy' }) => {
  const variants = {
    primary: 'bg-unsri-black text-unsri-gold hover:bg-black shadow-lg shadow-unsri-black/10',
    secondary: 'bg-unsri-gold text-unsri-black hover:bg-yellow-400 shadow-lg shadow-unsri-gold/10',
    outline: 'border-2 border-unsri-black/10 text-unsri-black hover:border-unsri-black hover:bg-slate-50',
    ghost: 'text-slate-500 hover:bg-slate-100 hover:text-slate-900',
    navy: 'bg-unsri-navy text-white hover:bg-slate-800 shadow-lg shadow-unsri-navy/10'
  };

  return (
    <button 
      className={cn(
        'px-6 py-3.5 rounded-2xl font-bold transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 text-sm',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

const Input = ({ label, error, sensitive, icon: Icon, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; sensitive?: boolean; icon?: any }) => (
  <div className="space-y-2 w-full">
    <div className="flex items-center justify-between px-1">
      <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
        {Icon && <Icon size={14} className="text-unsri-gold" />}
        {label}
      </label>
      {sensitive && (
        <span className="flex items-center gap-1 text-[9px] font-black text-unsri-gold uppercase tracking-widest bg-unsri-black px-2 py-0.5 rounded-full">
          <Lock size={10} /> Encrypted
        </span>
      )}
    </div>
    <input 
      className={cn(
        "w-full px-5 py-4 rounded-2xl border-2 bg-white focus:ring-4 focus:ring-unsri-gold/10 outline-none transition-all font-medium",
        error ? "border-red-500" : "border-slate-100 focus:border-unsri-gold"
      )}
      {...props}
    />
    {error && <p className="text-xs text-red-500 font-bold ml-1">{error}</p>}
  </div>
);

const TextArea = ({ label, error, sensitive, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; error?: string; sensitive?: boolean }) => (
  <div className="space-y-2 w-full">
    <div className="flex items-center justify-between px-1">
      <label className="text-xs font-black text-slate-500 uppercase tracking-widest">{label}</label>
      {sensitive && (
        <span className="flex items-center gap-1 text-[9px] font-black text-unsri-gold uppercase tracking-widest bg-unsri-black px-2 py-0.5 rounded-full">
          <Lock size={10} /> Encrypted
        </span>
      )}
    </div>
    <textarea 
      className={cn(
        "w-full px-5 py-4 rounded-2xl border-2 bg-white focus:ring-4 focus:ring-unsri-gold/10 outline-none transition-all min-h-[180px] resize-y font-medium",
        error ? "border-red-500" : "border-slate-100 focus:border-unsri-gold"
      )}
      {...props}
    />
    {error && <p className="text-xs text-red-500 font-bold ml-1">{error}</p>}
  </div>
);

const Select = ({ label, options, error, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; options: { value: string; label: string }[]; error?: string }) => (
  <div className="space-y-2 w-full">
    <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">{label}</label>
    <div className="relative">
      <select 
        className={cn(
          "w-full px-5 py-4 rounded-2xl border-2 bg-white focus:ring-4 focus:ring-unsri-gold/10 outline-none transition-all appearance-none font-medium",
          error ? "border-red-500" : "border-slate-100 focus:border-unsri-gold"
        )}
        {...props}
      >
        <option value="" disabled>Pilih Kategori</option>
        {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
      <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
        <ChevronRight size={18} className="rotate-90" />
      </div>
    </div>
    {error && <p className="text-xs text-red-500 font-bold ml-1">{error}</p>}
  </div>
);

const RichTextEditor = ({ label, value, onChange, error, className, placeholder }: { label: string; value: string; onChange: (val: string) => void; error?: string; className?: string; placeholder?: string }) => (
  <div className="space-y-2 w-full">
    <div className="flex items-center justify-between px-1">
      <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
        {label}
      </label>
    </div>
    <div className={cn("bg-white border-2 rounded-2xl overflow-hidden focus-within:border-unsri-gold focus-within:ring-4 focus-within:ring-unsri-gold/10 transition-all", error ? "border-red-500" : "border-slate-100", className)}>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full min-h-[200px] p-6 bg-transparent outline-none resize-y text-sm font-medium"
        placeholder={placeholder || "Tuliskan catatan di sini..."}
      />
    </div>
    {error && <p className="text-xs text-red-500 font-bold ml-1">{error}</p>}
  </div>
);

const FileInput = ({ label, helperText, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; helperText?: string }) => (
  <div className="space-y-1.5 w-full">
    <label className="text-sm font-semibold text-gray-700 ml-1">{label}</label>
    <div className="relative group">
      <input 
        type="file"
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        {...props}
      />
      <div className="w-full px-4 py-6 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 group-hover:bg-unsri-gold/10 group-hover:border-unsri-gold transition-all flex flex-col items-center justify-center gap-2">
        <div className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center text-gray-400 group-hover:text-unsri-black transition-colors">
          <FileText size={20} />
        </div>
        <p className="text-sm font-medium text-gray-600">Klik atau seret file untuk mengunggah bukti</p>
        {helperText && <p className="text-xs text-gray-400">{helperText}</p>}
      </div>
    </div>
  </div>
);

const StatusProgressTracker = ({ reportId }: { reportId: string }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLogs = async () => {
      try {
        const res = await fetch(`/api/admin/reports/${reportId}/logs`);
        const data = await res.json();
        // Filter out EXPORT_ZIP from timeline just in case it exists in legacy data
        setLogs(data.filter((l: any) => l.action !== 'EXPORT_ZIP'));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadLogs();
  }, [reportId]);

  if (loading) return <div className="animate-pulse h-32 bg-slate-50 rounded-[32px]" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-unsri-gold/10 rounded-xl flex items-center justify-center text-unsri-black">
          <Activity size={16} />
        </div>
        <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Riwayat Penanganan Internal</h4>
      </div>
      
      <div className="relative pl-6 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100 before:rounded-full">
        {logs.map((log) => (
          <div key={log.id} className="relative group">
            <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-white border-2 border-unsri-gold shadow-sm group-hover:scale-125 transition-transform" />
            <div className="bg-slate-50/50 p-5 rounded-3xl border border-slate-100 group-hover:bg-white group-hover:shadow-xl group-hover:shadow-slate-200/50 transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  {log.action === 'UPDATE_STATUS' || log.action === 'ASSIGN_SATGAS' ? (
                    <>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{log.previous_status || 'START'}</span>
                      <ChevronRight size={12} className="text-slate-300" />
                      <span className="text-[10px] font-black text-unsri-black uppercase tracking-widest bg-unsri-gold/20 px-2 py-0.5 rounded-lg">{log.new_status || log.action}</span>
                    </>
                  ) : (
                    <span className="text-[10px] font-black text-unsri-black uppercase tracking-widest bg-blue-100 text-blue-600 px-2 py-0.5 rounded-lg">{log.action}</span>
                  )}
                </div>
                <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-1 rounded-lg border border-slate-100 shadow-sm shrink-0">
                  {new Date(log.created_at).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                </span>
              </div>
              <div 
                className="text-sm text-slate-600 font-medium leading-relaxed italic quill-content" 
                dangerouslySetInnerHTML={{ __html: log.catatan_petugas }} 
              />
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2">
                <div className="w-6 h-6 bg-unsri-navy rounded-lg flex items-center justify-center text-unsri-gold text-[10px] font-black">
                  {log.officer_name[0].toUpperCase()}
                </div>
                <p className="text-[10px] text-unsri-black font-black uppercase tracking-widest">Petugas: {log.officer_name}</p>
              </div>
            </div>
          </div>
        ))}
        {logs.length === 0 && (
          <div className="p-8 text-center bg-slate-50/50 rounded-[32px] border border-dashed border-slate-200">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Belum ada aktivitas tercatat</p>
          </div>
        )}
      </div>
    </div>
  );
};

const MaskedContact = ({ contact }: { contact: string | null }) => {
  const [revealed, setRevealed] = useState(false);
  
  if (!contact) return <span className="text-xs text-slate-400 italic">Kontak tidak tersedia</span>;
  
  // Format mask
  const masked = contact.replace(/(\d{4})(\d{3,4})(\d+)?/, '$1-****-****').slice(0, 14); // generic simple mask

  return (
    <div className="flex items-center gap-2 mt-1.5">
      <span className="text-[11px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded flex items-center gap-1.5 border border-slate-200">
        <Phone size={10} />
        {revealed ? contact : masked}
      </span>
      <button 
        onClick={(e) => { e.stopPropagation(); setRevealed(!revealed); }}
        className="text-xs text-unsri-gold hover:text-unsri-navy transition-colors p-1"
        title={revealed ? "Sembunyikan" : "Tampilkan"}
      >
        {revealed ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
      {revealed && (
        <a 
          href={`https://wa.me/${contact.replace(/\D/g, '')}`} 
          target="_blank" 
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-[10px] bg-green-50 text-green-600 border border-green-200 px-2 py-0.5 rounded font-bold hover:bg-green-100 transition-colors"
          title="Hubungi via WhatsApp"
        >
          WhatsApp
        </a>
      )}
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [view, setView] = useState<View>('landing');
  const [trackingCode, setTrackingCode] = useState('');
  const [trackedReport, setTrackedReport] = useState<any>(null);
  const [adminUser, setAdminUser] = useState<any>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [settings, setSettings] = useState<any>({ sla_pending: 7, sla_investigating: 30, sla_recommended: 7, sla_resolved: 7, max_upload_size_mb: 10 });
  const [adminTab, setAdminTab] = useState<AdminTab>('reports');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [successPopup, setSuccessPopup] = useState<{ isOpen: boolean, trackingCode: string }>({ isOpen: false, trackingCode: '' });
  const [exportModal, setExportModal] = useState<{ isOpen: boolean, reportId: string, zipPassword?: string, downloadUrl?: string }>({ isOpen: false, reportId: '' });
  const [logModal, setLogModal] = useState<{ isOpen: boolean, reportId: string }>({ isOpen: false, reportId: '' });
  const [userModal, setUserModal] = useState<{ isOpen: boolean, user?: UserData }>({ isOpen: false });
  const [statusModal, setStatusModal] = useState<{ isOpen: boolean, reportId: string, nextStatus: Status | null, notes: string }>({ isOpen: false, reportId: '', nextStatus: null, notes: '' });
  const [assignModal, setAssignModal] = useState<{ isOpen: boolean, reportId: string }>({ isOpen: false, reportId: '' });
  const [showNotifications, setShowNotifications] = useState(false);

  // Generate notifications
  const userNotifications = adminUser ? reports.filter(r => r.assigned_to === adminUser.id && (r.status === 'PENDING' || r.status === 'INVESTIGATING' || r.status === 'RECOMMENDED')).map(report => {
    const slaSettings: Record<string, number> = {
      PENDING: settings.sla_pending || 7,
      INVESTIGATING: settings.sla_investigating || 30,
      RECOMMENDED: settings.sla_recommended || 7
    };
    const limit = slaSettings[report.status];
    const daysPassed = getWorkingDays(report.last_updated_at || report.created_at);
    
    if (daysPassed > limit) {
      return { id: report.id, type: 'danger', message: `SLA Terlewati: Kasus ${report.tracking_code} telat ${daysPassed - limit} hari.` };
    } else if (daysPassed >= limit - 2) {
      return { id: report.id, type: 'warning', message: `Peringatan SLA: Kasus ${report.tracking_code} tersisa ${limit - daysPassed} hari kerja.` };
    } else if (daysPassed === 0) {
      return { id: report.id, type: 'info', message: `Baru Ditugaskan: Kasus ${report.tracking_code} menanti untuk diproses.` };
    }
    return null;
  }).filter(Boolean) as { id: string, type: 'danger'|'warning'|'info'; message: string }[] : [];

  // Form State
  const [formData, setFormData] = useState({
    reporter_name: '',
    reporter_contact: '',
    reporter_identity_number: '',
    is_anonymous: false,
    victim_name: '',
    category: '',
    incident_date: '',
    incident_location: '',
    chronology: '',
    evidence: null as File | null
  });

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.evidence) {
      const validTypes = ['image/jpeg', 'image/png', 'application/pdf', 'video/mp4'];
      if (!validTypes.includes(formData.evidence.type)) {
        setMessage({ type: 'error', text: 'Tipe file bukti tidak didukung. Harap unggah format JPG, PNG, PDF, atau MP4.' });
        return;
      }
      const maxMb = settings?.max_upload_size_mb || 10;
      if (formData.evidence.size > maxMb * 1024 * 1024) {
        setMessage({ type: 'error', text: `Ukuran file bukti terlalu besar. Maksimal adalah ${maxMb}MB.` });
        return;
      }
    }

    setIsLoading(true);
    try {
      const data = new FormData();
      data.append('reporter_name', formData.reporter_name);
      data.append('reporter_contact', formData.reporter_contact);
      data.append('reporter_identity_number', formData.reporter_identity_number);
      data.append('is_anonymous', String(formData.is_anonymous));
      data.append('victim_name', formData.victim_name);
      data.append('category', formData.category);
      data.append('incident_date', formData.incident_date);
      data.append('incident_location', formData.incident_location);
      data.append('chronology', formData.chronology);
      if (formData.evidence) {
        data.append('evidence', formData.evidence);
      }

      const res = await fetch('/api/reports', {
        method: 'POST',
        body: data
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Terjadi kesalahan pada server.');
      }

      const result = await res.json();
      if (result.success) {
        setSuccessPopup({ isOpen: true, trackingCode: result.tracking_code });
        setFormData({
          reporter_name: '',
          reporter_contact: '',
          reporter_identity_number: '',
          is_anonymous: false,
          victim_name: '',
          category: '',
          incident_date: '',
          incident_location: '',
          chronology: '',
          evidence: null
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Gagal mengirim laporan. Silakan coba lagi.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTrack = async () => {
    if (!trackingCode) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/reports/track/${trackingCode}`);
      const data = await res.json();
      if (data.error) {
        setMessage({ type: 'error', text: data.error });
        setTrackedReport(null);
      } else {
        setTrackedReport(data);
        setMessage(null);
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Gagal melacak laporan.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      const data = await res.json();
      setSettings(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const username = (form.elements.namedItem('username') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (data.error) {
        setMessage({ type: 'error', text: data.error });
      } else {
        setAdminUser(data);
        setView('admin-dashboard');
        loadReports(data);
        loadUsers();
        loadSettings();
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Login gagal.' });
    }
  };

  const loadReports = async (user = adminUser) => {
    if (!user) return;
    try {
      const res = await fetch(`/api/admin/reports?userId=${user.id}&role=${user.role}`);
      const data = await res.json();
      setReports(data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const username = (form.elements.namedItem('username') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;
    const role = (form.elements.namedItem('role') as HTMLSelectElement).value;

    const isEdit = !!userModal.user;
    const url = isEdit ? `/api/admin/users/${userModal.user?.id}` : '/api/admin/users';
    const method = isEdit ? 'PATCH' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role })
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        setUserModal({ isOpen: false });
        loadUsers();
      }
    } catch (err) {
      alert('Gagal menyimpan user.');
    }
  };

  const deleteUser = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus user ini?')) return;
    try {
      await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      loadUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssignSatgas = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const assigned_to = (form.elements.namedItem('assigned_to') as HTMLSelectElement).value;
    
    if (!assigned_to) return;

    try {
      const res = await fetch(`/api/admin/reports/${assignModal.reportId}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          assigned_to, 
          user_id_admin: adminUser.id
        })
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        setAssignModal({ isOpen: false, reportId: '' });
        loadReports();
      }
    } catch (err) {
      alert('Gagal menugaskan satgas.');
    }
  };

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    
    if (!statusModal.nextStatus) return;

    const formData = new FormData(form);
    
    const maxMb = settings?.max_upload_size_mb || 10;
    const maxSize = maxMb * 1024 * 1024;
    const validDocs = ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/pdf'];

    for (const [key, value] of formData.entries()) {
      if (value instanceof File && value.size > 0) {
        if (!validDocs.includes(value.type)) {
          alert(`File yang diunggah harus berformat DOC, DOCX, atau PDF.`);
          return;
        }
        if (value.size > maxSize) {
          alert(`Ukuran file "${value.name}" terlalu besar (${(value.size/1024/1024).toFixed(1)}MB). Maksimal adalah ${maxMb}MB.`);
          return;
        }
      }
    }

    formData.append('status', statusModal.nextStatus);
    formData.append('user_id_satgas', adminUser.id);
    formData.append('catatan_petugas', statusModal.notes);

    try {
      const res = await fetch(`/api/admin/reports/${statusModal.reportId}/status`, {
        method: 'PATCH',
        body: formData
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        setStatusModal({ isOpen: false, reportId: '', nextStatus: null, notes: '' });
        loadReports();
      }
    } catch (err) {
      alert('Gagal memperbarui status.');
    }
  };

  const handleExportZip = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const password = (form.elements.namedItem('confirm_password') as HTMLInputElement).value;
    
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/reports/${exportModal.reportId}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, username: adminUser.username })
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        setExportModal({ ...exportModal, zipPassword: data.zip_password, downloadUrl: data.download_url });
      }
    } catch (err) {
      alert('Gagal mengekspor laporan.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: Status) => {
    switch (status) {
      case 'PENDING': return 'bg-amber-50 text-amber-600 border-amber-200 shadow-sm shadow-amber-500/5';
      case 'INVESTIGATING': return 'bg-blue-50 text-blue-600 border-blue-200 shadow-sm shadow-blue-500/5';
      case 'RECOMMENDED': return 'bg-indigo-50 text-indigo-600 border-indigo-200 shadow-sm shadow-indigo-500/5';
      case 'RESOLVED': return 'bg-emerald-50 text-emerald-600 border-emerald-200 shadow-sm shadow-emerald-500/5';
      case 'OUT_OF_SCOPE': return 'bg-red-50 text-red-600 border-red-200 shadow-sm shadow-red-500/5';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-unsri-gold selection:text-unsri-black">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => setView('landing')}
          >
            <div className="w-12 h-12">
              <img 
                src="/unsri_icon.png" 
                alt="Logo UNSRI" 
                className="w-full h-full object-contain"
              />
            </div>
            <div className="hidden sm:block">
              <h1 className="font-black text-xl leading-tight text-unsri-black tracking-tighter">PPKPT <span className="text-unsri-gold bg-unsri-black px-1.5 rounded">FASILKOM</span></h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold">Universitas Sriwijaya</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {adminUser ? (
              <div className="flex items-center gap-4">
                <div className="hidden md:flex flex-col items-end">
                  <span className="text-xs font-bold text-unsri-black">Satgas Active</span>
                  <span className="text-[10px] text-slate-500">{adminUser.username}</span>
                </div>
                <Button variant="ghost" className="w-10 h-10 p-0 rounded-xl text-red-600 hover:bg-red-50" onClick={() => { setAdminUser(null); setView('landing'); }}>
                  <LogOut size={20} />
                </Button>
              </div>
            ) : (
              <button 
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-unsri-black hover:bg-unsri-gold/10 transition-colors flex items-center gap-2"
                onClick={() => setView('admin-login')}
              >
                <Lock size={16} />
                <span>Portal Satgas</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className={cn(
        "max-w-7xl mx-auto px-4 py-12",
        view === 'landing' ? "max-w-none px-0 py-0" : "max-w-4xl"
      )}>
        <AnimatePresence>
          {successPopup.isOpen && (
            <motion.div
              key="success-popup"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-unsri-black/60 backdrop-blur-sm"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-[40px] p-10 max-w-lg mx-auto w-full shadow-2xl space-y-8 border border-slate-200 text-center relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500" />
                <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 mb-6 shadow-inner">
                  <CheckCircle2 size={48} />
                </div>
                <h3 className="text-3xl font-black text-unsri-black tracking-tight mt-6">Laporan Diterima</h3>
                <p className="text-slate-500 font-medium">Laporan Anda telah berhasil kami terima dan akan segera diproses oleh Satgas. Harap simpan kode tracking berikut untuk memantau status laporan Anda.</p>
                <div className="bg-slate-50 p-6 rounded-3xl border-2 border-dashed border-slate-300">
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Kode Tracking Anda</p>
                   <p className="text-4xl font-black text-unsri-navy tracking-tight">{successPopup.trackingCode}</p>
                </div>
                <Button 
                  onClick={() => {
                    setSuccessPopup({ isOpen: false, trackingCode: '' });
                    setView('landing');
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-600/20 py-4 text-lg"
                >
                  Selesai
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {/* Landing View */}
          {view === 'landing' && (
            <motion.div 
              key="landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative overflow-hidden"
            >
              {/* Hero Section */}
              <div className="relative pt-20 pb-32 px-4 overflow-hidden">
                {/* Background Decorations */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
                  <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[60%] bg-unsri-gold/10 blur-[120px] rounded-full" />
                  <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[60%] bg-unsri-black/5 blur-[120px] rounded-full" />
                </div>

                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
                  <div className="space-y-8 text-left">
                    <motion.div 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-unsri-gold/10 border border-unsri-gold/20 rounded-full text-unsri-black text-xs font-bold uppercase tracking-widest"
                    >
                      <img src="/unsri_icon.png" alt="UNSRI" className="w-3.5 h-3.5 object-contain" />
                      <span>Satgas PPKPT Fasilkom UNSRI</span>
                    </motion.div>

                    <motion.h2 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-6xl sm:text-7xl font-black tracking-tight text-unsri-black leading-[0.9]"
                    >
                      KEADILAN <br />
                      <span className="text-unsri-gold">TANPA</span> <br />
                      <span className="bg-unsri-black text-white px-4 py-1 rounded-2xl inline-block mt-2">KETAKUTAN</span>
                    </motion.h2>

                    <motion.p 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="text-xl text-slate-600 max-w-xl leading-relaxed font-medium"
                    >
                      Fakultas Ilmu Komputer UNSRI berkomitmen penuh melindungi setiap individu dari kekerasan seksual. Laporan Anda adalah langkah awal menuju kampus yang lebih aman.
                    </motion.p>

                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="flex flex-wrap gap-4"
                    >
                      <button 
                        onClick={() => setView('report')}
                        className="px-8 py-5 bg-unsri-black text-unsri-gold rounded-2xl font-black text-lg shadow-2xl shadow-unsri-black/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 group"
                      >
                        <span>Mulai Lapor Sekarang</span>
                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                      </button>
                      <button 
                        onClick={() => setView('track')}
                        className="px-8 py-5 bg-white text-unsri-black border-2 border-unsri-black/10 rounded-2xl font-black text-lg hover:bg-slate-50 transition-all"
                      >
                        Pantau Status
                      </button>
                    </motion.div>
                  </div>

                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4, type: 'spring' }}
                    className="relative hidden lg:block"
                  >
                    <div className="relative z-10 bg-white p-4 rounded-[40px] shadow-2xl border border-slate-200 rotate-3 hover:rotate-0 transition-transform duration-500">
                      <img 
                        src="/gedung-fasilkom.jpg" 
                        alt="Fasilkom UNSRI (Ilustrasi)" 
                        className="rounded-[32px] w-full h-[600px] object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute -bottom-10 -left-10 bg-unsri-gold p-8 rounded-3xl shadow-2xl -rotate-6">
                        <p className="text-4xl font-black text-unsri-black">100%</p>
                        <p className="text-xs font-bold text-unsri-black/60 uppercase tracking-widest">Kerahasiaan Terjamin</p>
                      </div>
                    </div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] border-2 border-dashed border-unsri-gold/30 rounded-full -z-10 animate-[spin_20s_linear_infinite]" />
                  </motion.div>
                </div>
              </div>

              {/* Features Bento Grid */}
              <div className="bg-slate-50 py-32 px-4">
                <div className="max-w-7xl mx-auto space-y-16">
                  <div className="text-center space-y-4">
                    <h3 className="text-3xl font-black text-unsri-black">Sistem Keamanan Berlapis</h3>
                    <p className="text-slate-500 max-w-xl mx-auto">Kami menggunakan standar teknologi terkini untuk memastikan setiap data yang Anda kirimkan aman dan tidak dapat ditembus.</p>
                  </div>

                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 bg-white p-10 rounded-[32px] border border-slate-200 shadow-sm hover:shadow-xl transition-all group">
                      <div className="w-16 h-16 bg-unsri-gold/10 rounded-2xl flex items-center justify-center text-unsri-black mb-6 group-hover:bg-unsri-black group-hover:text-unsri-gold transition-colors">
                        <Lock size={32} />
                      </div>
                      <h4 className="text-2xl font-black mb-4">Enkripsi AES-256</h4>
                      <p className="text-slate-600 leading-relaxed">Seluruh data identitas dan kronologi dienkripsi menggunakan algoritma AES-256 tingkat militer sebelum disimpan di database kami. Hanya Satgas berwenang yang dapat mendekripsi data tersebut.</p>
                    </div>
                    <div className="bg-unsri-black p-10 rounded-[32px] text-unsri-gold shadow-2xl shadow-unsri-black/20 flex flex-col justify-between group">
                      <div className="w-16 h-16 bg-unsri-gold rounded-2xl flex items-center justify-center text-unsri-black mb-6 group-hover:scale-110 transition-transform">
                        <User size={32} />
                      </div>
                      <div>
                        <h4 className="text-2xl font-black mb-4">Opsi Anonim</h4>
                        <p className="text-unsri-gold/70 leading-relaxed">Anda memiliki kendali penuh. Laporkan tanpa memberikan nama atau identitas apapun jika Anda merasa lebih nyaman.</p>
                      </div>
                    </div>
                    <div className="bg-white p-10 rounded-[32px] border border-slate-200 shadow-sm hover:shadow-xl transition-all group">
                      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-unsri-black mb-6 group-hover:bg-unsri-gold transition-colors">
                        <FileText size={32} />
                      </div>
                      <h4 className="text-2xl font-black mb-4">Bukti Digital</h4>
                      <p className="text-slate-600 leading-relaxed">Unggah berbagai format bukti (gambar, video, dokumen) secara aman. File disimpan di server terisolasi.</p>
                    </div>
                    <div className="md:col-span-2 bg-unsri-gold p-10 rounded-[32px] text-unsri-black flex flex-col md:flex-row gap-10 items-center group">
                      <div className="space-y-4 flex-1">
                        <h4 className="text-3xl font-black">Pantau Tanpa Login</h4>
                        <p className="font-bold opacity-70">Gunakan Kode Tracking unik untuk memantau progres penanganan laporan Anda kapan saja tanpa perlu membuat akun.</p>
                        <button 
                          onClick={() => setView('track')}
                          className="px-6 py-3 bg-unsri-black text-unsri-gold rounded-xl font-bold text-sm"
                        >
                          Coba Tracking
                        </button>
                      </div>
                      <div className="w-48 h-48 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md border border-white/30 group-hover:rotate-12 transition-transform">
                        <Search size={80} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Trust Section */}
              <div className="py-24 px-4 text-center">
                <div className="max-w-3xl mx-auto space-y-12">
                  <div className="flex justify-center gap-6 opacity-30">
                    <div className="flex items-center gap-2 font-black text-2xl text-slate-400 opacity-80">
                      <img src="/unsri_icon.png" alt="UNSRI" className="w-8 h-8 object-contain grayscale" /> PPKPT
                    </div>
                  </div>
                  <p className="text-2xl font-medium text-slate-400 italic leading-relaxed">
                    "Membangun lingkungan akademik yang bermartabat, aman, dan inklusif bagi seluruh civitas akademika Fasilkom UNSRI."
                  </p>
                  <div className="pt-8">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.3em]">Patuh Pada</p>
                    <p className="text-sm font-black text-unsri-black mt-2">Permendikbudristek No. 55 Tahun 2024</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Report Form View */}
          {view === 'report' && (
            <motion.div 
              key="report"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="flex items-center gap-4 mb-8">
                <Button variant="ghost" className="p-2" onClick={() => setView('landing')}>
                  <ArrowLeft size={20} />
                </Button>
                <div>
                  <h2 className="text-2xl font-bold">Formulir Pelaporan</h2>
                  <p className="text-sm text-slate-500">Ceritakan apa yang terjadi. Kami di sini untuk mendengarkan.</p>
                </div>
              </div>

              {message && (
                <div className={cn(
                  "p-6 rounded-2xl border flex items-start gap-4",
                  message.type === 'success' ? "bg-unsri-gold/10 border-unsri-gold/20 text-unsri-black" : "bg-red-50 border-red-200 text-red-800"
                )}>
                  {message.type === 'success' ? <CheckCircle2 className="mt-1 shrink-0" /> : <AlertCircle className="mt-1 shrink-0" />}
                  <div className="space-y-2">
                    <p className="font-bold">{message.text}</p>
                    {message.type === 'success' && (
                      <p className="text-sm opacity-80">Harap simpan kode tracking di atas untuk memantau status laporan Anda di masa mendatang.</p>
                    )}
                  </div>
                </div>
              )}

              <form onSubmit={handleReportSubmit} className="space-y-12 bg-white p-8 sm:p-12 rounded-[40px] border border-slate-200 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-unsri-gold" />
                <div className="absolute top-0 right-0 w-32 h-32 bg-circuit -mr-16 -mt-16 rotate-45" />

                {/* Identity Section */}
                <section className="space-y-8">
                  <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                    <div className="w-12 h-12 bg-unsri-gold/10 rounded-2xl flex items-center justify-center text-unsri-black">
                      <Fingerprint size={24} />
                    </div>
                    <div>
                      <h3 className="font-black text-xl text-unsri-black">Identitas Pelapor</h3>
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Langkah 1 dari 2</p>
                    </div>
                  </div>
                  
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative">
                        <input 
                          type="checkbox" 
                          className="peer sr-only"
                          checked={formData.is_anonymous}
                          onChange={(e) => setFormData({...formData, is_anonymous: e.target.checked})}
                        />
                        <div className="w-12 h-6 bg-slate-200 rounded-full peer-checked:bg-unsri-black transition-colors" />
                        <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-6" />
                      </div>
                      <span className="text-sm font-black text-unsri-black uppercase tracking-widest">Laporkan secara Anonim</span>
                    </label>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                      Identitas Anda tidak akan dicatat dalam sistem jika opsi ini diaktifkan. Satgas tetap dapat memproses laporan Anda.
                    </p>
                  </div>

                  {!formData.is_anonymous && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="grid sm:grid-cols-2 gap-6"
                    >
                      <Input 
                        label="Nama Lengkap" 
                        placeholder="Sesuai KTP/KTM"
                        value={formData.reporter_name}
                        onChange={(e) => setFormData({...formData, reporter_name: e.target.value})}
                        sensitive
                        icon={User}
                        required
                      />
                      <Input 
                        label="Nomor Identitas (NIM/NIP)" 
                        placeholder="Contoh: 0902128..."
                        value={formData.reporter_identity_number}
                        onChange={(e) => setFormData({...formData, reporter_identity_number: e.target.value})}
                        sensitive
                        icon={Database}
                        required
                      />
                      <div className="sm:col-span-2">
                        <Input 
                          label="Kontak (WhatsApp/Email)" 
                          placeholder="Untuk koordinasi penanganan"
                          value={formData.reporter_contact}
                          onChange={(e) => setFormData({...formData, reporter_contact: e.target.value})}
                          sensitive
                          icon={Bell}
                          required
                        />
                      </div>
                    </motion.div>
                  )}
                </section>

                {/* Incident Section */}
                <section className="space-y-8">
                  <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                    <div className="w-12 h-12 bg-unsri-gold/10 rounded-2xl flex items-center justify-center text-unsri-black">
                      <AlertCircle size={24} />
                    </div>
                    <div>
                      <h3 className="font-black text-xl text-unsri-black">Detail Kejadian</h3>
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Langkah 2 dari 2</p>
                    </div>
                  </div>
                  
                  <div className="grid sm:grid-cols-2 gap-6">
                    <Select 
                      label="Kategori Kekerasan" 
                      options={(settings.categories || ['Kekerasan Seksual', 'Perundungan (Bullying)', 'Kekerasan Fisik', 'Kekerasan Psikis', 'Intoleransi', 'Pelecehan Seksual via Media Elektronik', 'Lainnya']).map((c: string) => ({ value: c, label: c }))}
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      required
                    />
                    <Input 
                      label="Nama Korban" 
                      placeholder="Nama penyintas"
                      value={formData.victim_name}
                      onChange={(e) => setFormData({...formData, victim_name: e.target.value})}
                      sensitive
                      icon={User}
                      required
                    />
                    <Input 
                      label="Waktu Kejadian" 
                      type="date"
                      value={formData.incident_date}
                      onChange={(e) => setFormData({...formData, incident_date: e.target.value})}
                      required
                    />
                    <Input 
                      label="Lokasi Kejadian" 
                      placeholder="Misal: Gedung Dekanat Lt. 2"
                      value={formData.incident_location}
                      onChange={(e) => setFormData({...formData, incident_location: e.target.value})}
                      required
                      icon={MapPin}
                    />
                    <div className="sm:col-span-2">
                      <TextArea 
                        label="Kronologi Kejadian" 
                        placeholder="Ceritakan kejadian secara detail. Kami menghargai keberanian Anda untuk bercerita."
                        value={formData.chronology}
                        onChange={(e) => setFormData({...formData, chronology: e.target.value})}
                        sensitive
                        required
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <FileInput 
                        label="Unggah Bukti (Opsional)" 
                        accept="image/jpeg,image/png,application/pdf,video/mp4"
                        helperText={formData.evidence ? `File terpilih: ${formData.evidence.name}` : `Format: JPG, PNG, PDF, atau MP4 (Maks. ${settings?.max_upload_size_mb || 10}MB)`}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const validTypes = ['image/jpeg', 'image/png', 'application/pdf', 'video/mp4'];
                            if (!validTypes.includes(file.type)) {
                              setMessage({ type: 'error', text: 'Tipe file tidak didukung. Harap unggah format JPG, PNG, PDF, atau MP4.' });
                              e.target.value = '';
                              return;
                            }
                            const maxMb = settings?.max_upload_size_mb || 10;
                            if (file.size > maxMb * 1024 * 1024) {
                              setMessage({ type: 'error', text: `Ukuran file terlalu besar. Maksimal adalah ${maxMb}MB.` });
                              e.target.value = '';
                              return;
                            }
                            setFormData({...formData, evidence: file});
                            setMessage(null);
                          }
                        }}
                      />
                    </div>
                  </div>
                </section>

                <div className="pt-10 space-y-6">
                  <div className="p-6 bg-unsri-gold/5 rounded-3xl border border-unsri-gold/20 flex gap-4 items-start">
                    <Shield className="text-unsri-gold shrink-0 mt-1" size={24} />
                    <p className="text-sm text-slate-600 leading-relaxed font-medium">
                      Laporan Anda akan diproses secara rahasia oleh Satgas PPKPT Fasilkom UNSRI. Kami menjamin perlindungan bagi pelapor sesuai dengan regulasi yang berlaku.
                    </p>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full py-5 text-xl font-black shadow-2xl shadow-unsri-black/20" 
                    disabled={isLoading}
                  >
                    {isLoading ? "Mengirim Laporan..." : "Kirim Laporan Sekarang"}
                  </Button>
                  <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    Data Anda Aman & Terenkripsi AES-256
                  </p>
                </div>
              </form>
            </motion.div>
          )}

          {/* Track View */}
          {view === 'track' && (
            <motion.div 
              key="track"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto space-y-12"
            >
              <div className="flex items-center gap-6">
                <button 
                  onClick={() => setView('landing')}
                  className="w-14 h-14 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-unsri-black hover:bg-slate-50 transition-all shadow-sm"
                >
                  <ArrowLeft size={24} />
                </button>
                <div>
                  <h2 className="text-4xl font-black text-unsri-black tracking-tight">Pantau Laporan</h2>
                  <p className="text-slate-500 font-medium">Gunakan kode tracking unik Anda untuk melihat progres penanganan.</p>
                </div>
              </div>

              <div className="bg-white p-10 sm:p-12 rounded-[40px] border border-slate-200 shadow-2xl space-y-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-circuit -mr-16 -mt-16 rotate-45 opacity-10" />
                
                <div className="flex flex-col sm:flex-row gap-6 items-end">
                  <div className="flex-1 w-full">
                    <Input 
                      label="Kode Tracking" 
                      placeholder="PPKPT-2024-XXXX"
                      value={trackingCode}
                      onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
                      icon={Search}
                      className="text-2xl font-black tracking-widest placeholder:tracking-normal"
                    />
                  </div>
                  <Button 
                    className="w-full sm:w-auto py-5 px-10 text-lg font-black shadow-xl shadow-unsri-gold/20" 
                    onClick={handleTrack} 
                    disabled={isLoading}
                  >
                    {isLoading ? "Mencari..." : "Cek Status"}
                  </Button>
                </div>

                {message && message.type === 'error' && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-6 bg-red-50 border border-red-100 rounded-3xl flex items-center gap-4 text-red-600"
                  >
                    <AlertCircle size={24} />
                    <p className="font-bold">{message.text}</p>
                  </motion.div>
                )}

                {trackedReport && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="pt-10 border-t border-slate-100 space-y-12"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status Saat Ini</p>
                        <div className={cn(
                          "px-6 py-2 rounded-full border text-sm font-black uppercase tracking-widest inline-block shadow-sm",
                          getStatusColor(trackedReport.status)
                        )}>
                          {trackedReport.status}
                        </div>
                      </div>
                      <div className="text-left sm:text-right space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">ID Laporan</p>
                        <p className="text-2xl font-black text-unsri-black tracking-tighter">{trackedReport.tracking_code}</p>
                      </div>
                    </div>

                    <div className="space-y-8">
                      <div className="flex items-center gap-3">
                        <Activity className="text-unsri-gold" size={24} />
                        <h4 className="text-xl font-black text-unsri-black">Timeline Penanganan</h4>
                      </div>
                      
                      <div className="relative pl-10 space-y-12 before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-1 before:bg-slate-100 before:rounded-full">
                        <div className="relative">
                          <div className="absolute -left-[35px] top-1 w-6 h-6 rounded-full bg-unsri-gold border-4 border-white shadow-lg z-10" />
                          <div className="space-y-2">
                            <p className="text-lg font-black text-unsri-black">Laporan Diterima</p>
                            <p className="text-sm text-slate-500 leading-relaxed font-medium">Sistem telah mencatat laporan Anda dengan aman. Satgas akan segera melakukan verifikasi awal.</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              {new Date(trackedReport.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                          </div>
                        </div>

                        {(trackedReport.status === 'INVESTIGATING' || trackedReport.status === 'RECOMMENDED' || trackedReport.status === 'RESOLVED') && (
                          <div className="relative">
                            <div className="absolute -left-[35px] top-1 w-6 h-6 rounded-full bg-blue-500 border-4 border-white shadow-lg z-10" />
                            <div className="space-y-2">
                              <p className="text-lg font-black text-unsri-black">Dalam Penanganan Secara Internal</p>
                              <p className="text-sm text-slate-500 leading-relaxed font-medium">Satgas sedang menelaah bukti, mengumpulkan pihak terkait, dan menyusun laporan untuk penanganan selanjutnya.</p>
                            </div>
                          </div>
                        )}

                        {(trackedReport.status === 'RECOMMENDED' || trackedReport.status === 'RESOLVED') && (
                          <div className="relative">
                            <div className="absolute -left-[35px] top-1 w-6 h-6 rounded-full bg-indigo-500 border-4 border-white shadow-lg z-10" />
                            <div className="space-y-2">
                              <p className="text-lg font-black text-unsri-black">Rekomendasi Sanksi Disusun</p>
                              <p className="text-sm text-slate-500 leading-relaxed font-medium">Tim Satgas telah menyelesaikan investigasi dan memberikan rekomendasi sanksi kepada pihak universitas, menunggu penerbitan SK.</p>
                            </div>
                          </div>
                        )}

                        {trackedReport.status === 'RESOLVED' && (
                          <div className="relative">
                            <div className="absolute -left-[35px] top-1 w-6 h-6 rounded-full bg-emerald-500 border-4 border-white shadow-lg z-10" />
                            <div className="space-y-4">
                              <div>
                                <p className="text-lg font-black text-unsri-black">Selesai Ditangani</p>
                                <p className="text-sm text-slate-500 leading-relaxed font-medium">Penanganan laporan telah selesai dilakukan dan SK Sanksi telah diterbitkan (jika ada sanksi yang dijatuhkan).</p>
                              </div>
                              
                              {(trackedReport.nomor_sk_sanksi || trackedReport.tanggal_sk_sanksi) && (
                                <div className="bg-slate-50 border border-slate-200 p-6 rounded-3xl space-y-4 shadow-sm">
                                  <h5 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                                    <FileText size={14} className="text-unsri-gold" /> Keputusan Sanksi (SK)
                                  </h5>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nomor SK</p>
                                      <p className="text-sm font-black text-unsri-black mt-1">{trackedReport.nomor_sk_sanksi || '-'}</p>
                                    </div>
                                    <div>
                                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tanggal SK</p>
                                      <p className="text-sm font-black text-unsri-black mt-1">
                                        {trackedReport.tanggal_sk_sanksi ? new Date(trackedReport.tanggal_sk_sanksi).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-8 bg-unsri-navy rounded-[32px] text-white flex gap-6 items-start shadow-2xl shadow-unsri-navy/20">
                      <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0">
                        <Shield className="text-unsri-gold" size={24} />
                      </div>
                      <div className="space-y-2">
                        <p className="font-black text-lg">Keamanan Data Anda</p>
                        <p className="text-sm text-slate-300 leading-relaxed">
                          Untuk alasan kerahasiaan dan keamanan penyintas, detail kronologi dan bukti tidak ditampilkan di halaman publik ini. Jika Anda memerlukan informasi lebih lanjut, silakan hubungi Satgas PPKPT Fasilkom UNSRI melalui jalur resmi.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {/* Admin Login View */}
          {view === 'admin-login' && (
            <motion.div 
              key="admin-login"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-md mx-auto"
            >
              <div className="bg-white p-12 rounded-[48px] border border-slate-200 shadow-2xl space-y-10 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-unsri-gold" />
                <div className="absolute top-0 right-0 w-32 h-32 bg-circuit -mr-16 -mt-16 rotate-45 opacity-10" />

                <div className="text-center space-y-4">
                  <div className="w-20 h-20 bg-transparent flex items-center justify-center mx-auto mb-6">
                    <img src="/unsri_icon.png" alt="UNSRI" className="w-full h-full object-contain" />
                  </div>
                  <h2 className="text-3xl font-black text-unsri-black tracking-tight">Portal Satgas</h2>
                  <p className="text-sm text-slate-500 font-medium">Sistem Manajemen Kasus PPKPT Fasilkom UNSRI</p>
                </div>

                <form onSubmit={handleAdminLogin} className="space-y-6">
                  <Input label="Username" name="username" placeholder="Masukkan username" icon={User} required />
                  <Input label="Password" name="password" type="password" placeholder="••••••••" icon={Shield} required />
                  
                  {message && message.type === 'error' && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-red-50 border border-red-100 rounded-2xl text-xs text-red-600 font-bold flex items-center gap-3"
                    >
                      <AlertCircle size={16} />
                      {message.text}
                    </motion.div>
                  )}

                  <Button type="submit" className="w-full py-5 text-lg font-black shadow-xl shadow-unsri-gold/20">Masuk ke Dashboard</Button>
                </form>

                <div className="pt-4">
                  <Button variant="ghost" className="w-full text-sm font-bold text-slate-400 hover:text-unsri-black" onClick={() => setView('landing')}>
                    Kembali ke Beranda
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Admin Dashboard View */}
          {view === 'admin-dashboard' && adminUser && (
            <motion.div 
              key="admin-dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 z-50 bg-slate-50 flex overflow-hidden"
            >
              {/* Sidebar */}
              <aside className="w-72 bg-unsri-navy text-white flex flex-col shadow-2xl relative z-10">
                <div className="p-8 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12">
                      <img src="/unsri_icon.png" alt="Logo UNSRI" className="w-full h-full object-contain" />
                    </div>
                    <div>
                      <h1 className="font-black text-lg leading-tight tracking-tighter">SATGAS <span className="text-unsri-gold">PPKPT</span></h1>
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Fasilkom UNSRI</p>
                    </div>
                  </div>
                </div>

                <nav className="flex-1 p-6 space-y-2">
                  <button 
                    onClick={() => setAdminTab('reports')}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all",
                      adminTab === 'reports' ? "bg-unsri-gold text-unsri-black shadow-xl shadow-unsri-gold/10" : "text-slate-400 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <LayoutDashboard size={20} />
                    <span>Dashboard Laporan</span>
                  </button>
                  {adminUser?.role === 'admin' && (
                    <button 
                      onClick={() => setAdminTab('users')}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all",
                        adminTab === 'users' ? "bg-unsri-gold text-unsri-black shadow-xl shadow-unsri-gold/10" : "text-slate-400 hover:bg-white/5 hover:text-white"
                      )}
                    >
                      <Users size={20} />
                      <span>Manajemen Satgas</span>
                    </button>
                  )}
                  <div className="pt-6 mt-6 border-t border-white/10">
                    <p className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Sistem</p>
                    {adminUser?.role === 'admin' && (
                      <>
                        <button
                          onClick={() => setAdminTab('settings_sla')}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all",
                            adminTab === 'settings_sla' ? "bg-unsri-gold text-unsri-black shadow-xl shadow-unsri-gold/10" : "text-slate-400 hover:bg-white/5 hover:text-white"
                          )}
                        >
                          <Settings size={20} />
                          <span>Pengaturan SLA</span>
                        </button>
                        <button
                          onClick={() => setAdminTab('settings_upload')}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all",
                            adminTab === 'settings_upload' ? "bg-unsri-gold text-unsri-black shadow-xl shadow-unsri-gold/10" : "text-slate-400 hover:bg-white/5 hover:text-white"
                          )}
                        >
                          <Database size={20} />
                          <span>Maksimal Bukti</span>
                        </button>
                        <button
                          onClick={() => setAdminTab('settings_category')}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all",
                            adminTab === 'settings_category' ? "bg-unsri-gold text-unsri-black shadow-xl shadow-unsri-gold/10" : "text-slate-400 hover:bg-white/5 hover:text-white"
                          )}
                        >
                          <List size={20} />
                          <span>Kategori Kekerasan</span>
                        </button>
                      </>
                    )}
                    <button 
                      onClick={() => { setAdminUser(null); setView('landing'); }}
                      className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold text-red-400 hover:bg-red-500/10 transition-all"
                    >
                      <LogOut size={20} />
                      <span>Keluar Sistem</span>
                    </button>
                  </div>
                </nav>

                <div className="p-6 bg-white/5 border-t border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center font-black text-xs">
                      {adminUser.username[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{adminUser.username}</p>
                      <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{adminUser.role}</p>
                    </div>
                  </div>
                </div>
              </aside>

              {/* Main Content */}
              <main className="flex-1 overflow-y-auto relative">
                {/* Header */}
                <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-slate-200 px-10 py-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-black text-unsri-black">
                      {adminTab === 'reports' ? 'Daftar Laporan Masuk' : adminTab === 'users' ? 'Manajemen Anggota Satgas' : adminTab === 'settings_sla' ? 'Pengaturan SLA Sistem' : adminTab === 'settings_upload' ? 'Pengaturan Maksimal Bukti' : 'Kategori Kekerasan'}
                    </h2>
                    <p className="text-sm text-slate-500 font-medium">Selamat datang kembali, {adminUser.username}.</p>
                  </div>
                  <div className="flex items-center gap-4 relative">
                    <button 
                      onClick={() => setShowNotifications(!showNotifications)}
                      className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-all relative"
                    >
                      <Bell size={20} />
                      {userNotifications.length > 0 && (
                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
                      )}
                    </button>
                    
                    <AnimatePresence>
                      {showNotifications && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute top-14 right-0 w-80 bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-50 flex flex-col"
                        >
                          <div className="p-4 border-b border-slate-100 bg-slate-50 px-6">
                            <h4 className="font-bold text-sm text-unsri-black">Notifikasi Anda</h4>
                            <p className="text-[10px] text-slate-500 font-medium">{userNotifications.length} peringatan aktif</p>
                          </div>
                          <div className="max-h-80 overflow-y-auto">
                            {userNotifications.length === 0 ? (
                              <div className="p-6 text-center text-slate-400 text-sm font-medium">Belum ada notifikasi</div>
                            ) : (
                              <div className="divide-y divide-slate-100">
                                {userNotifications.map((notif, idx) => (
                                  <div key={idx} className={cn(
                                    "p-4 px-6 text-xs font-medium cursor-pointer hover:bg-slate-50 transition-colors flex gap-3 items-start",
                                    notif.type === 'danger' ? 'text-red-600 bg-red-50/30' : notif.type === 'warning' ? 'text-amber-600 bg-amber-50/30' : 'text-blue-600 bg-blue-50/30'
                                  )}>
                                    <div className="mt-0.5">
                                      <AlertCircle size={14} />
                                    </div>
                                    <span className="flex-1 leading-relaxed">{notif.message}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="h-8 w-px bg-slate-200 mx-2" />
                    <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="text-xs font-bold text-slate-600 uppercase tracking-widest hidden sm:inline-block">System Online</span>
                    </div>
                  </div>
                </header>

                <div className="p-10 space-y-10">
                  {adminTab === 'reports' && !statusModal.isOpen && (
                    <>
                      {/* Metric Cards & Chart */}
                      <div className="grid lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 grid sm:grid-cols-2 gap-6">
                          <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm hover:shadow-xl transition-all group">
                            <div className="flex items-center justify-between mb-4">
                              <div className="w-12 h-12 bg-unsri-gold/10 rounded-2xl flex items-center justify-center text-unsri-black group-hover:bg-unsri-gold transition-colors">
                                <FileText size={24} />
                              </div>
                            </div>
                            <p className="text-4xl font-black text-unsri-black">{reports.length}</p>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Total Laporan</p>
                          </div>
                          <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm hover:shadow-xl transition-all group">
                              <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 group-hover:bg-amber-100 transition-colors">
                                  <Clock size={24} />
                                </div>
                              </div>
                            <p className="text-4xl font-black text-unsri-black">{reports.filter(r => r.status === 'PENDING').length}</p>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Menunggu Verifikasi</p>
                          </div>
                          <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm hover:shadow-xl transition-all group">
                              <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-blue-100 transition-colors">
                                  <Activity size={24} />
                                </div>
                              </div>
                            <p className="text-4xl font-black text-unsri-black">{reports.filter(r => r.status === 'INVESTIGATING' || r.status === 'RECOMMENDED').length}</p>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Dalam Penanganan</p>
                          </div>
                          <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm hover:shadow-xl transition-all group">
                              <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:bg-emerald-100 transition-colors">
                                  <CheckCircle2 size={24} />
                                </div>
                              </div>
                            <p className="text-4xl font-black text-unsri-black">{reports.filter(r => r.status === 'RESOLVED').length}</p>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Selesai Ditangani</p>
                          </div>
                        </div>

                        <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm hover:shadow-xl transition-all">
                          <h4 className="text-sm font-black text-unsri-black mb-4 tracking-tighter">Status Penanganan</h4>
                          <div className="h-[220px] w-full flex items-center justify-center">
                            {(() => {
                              const diprosesCount = reports.filter(r => r.status === 'INVESTIGATING' || r.status === 'RECOMMENDED' || r.status === 'RESOLVED').length;
                              const belumDiprosesCount = reports.filter(r => r.status === 'PENDING').length;
                              const totalCount = diprosesCount + belumDiprosesCount;
                              const diprosesPercent = totalCount > 0 ? Math.round((diprosesCount / totalCount) * 100) : 0;
                              const belumDiprosesPercent = totalCount > 0 ? (100 - diprosesPercent) : 0;
                              const pieData = [
                                { name: `Diproses (${diprosesPercent}%)`, value: diprosesCount, color: '#10b981' },
                                { name: `Belum Diproses (${belumDiprosesPercent}%)`, value: belumDiprosesCount, color: '#800000' }
                              ].filter(d => d.value > 0);
                              
                              return (
                                <PieChart width={250} height={220}>
                                  <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                    labelLine={false}
                                    fill="#8884d8"
                                  >
                                    {
                                      pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                      ))
                                    }
                                  </Pie>
                                  <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', color: '#1A1A1A' }} />
                                </PieChart>
                              );
                            })()}
                          </div>
                        </div>
                      </div>

                      {/* Enterprise Table */}
                      <div className="bg-white rounded-[40px] border border-slate-200 shadow-xl overflow-hidden">
                        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                              <input 
                                type="text" 
                                placeholder="Cari laporan (Kode, Nama, Kategori)..." 
                                className="pl-12 pr-6 py-3 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:bg-white focus:border-unsri-gold outline-none transition-all w-80 font-medium text-sm"
                              />
                            </div>
                            <button className="px-6 py-3 bg-slate-50 border-2 border-slate-50 rounded-2xl text-sm font-bold text-slate-600 flex items-center gap-2 hover:bg-slate-100 transition-all">
                              <Briefcase size={18} />
                              <span>Filter Kategori</span>
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                            <button className="p-3 bg-slate-50 rounded-xl text-slate-500 hover:bg-slate-100 transition-all">
                              <Database size={20} />
                            </button>
                            <button className="p-3 bg-slate-50 rounded-xl text-slate-500 hover:bg-slate-100 transition-all">
                              <Settings size={20} />
                            </button>
                          </div>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-50/50">
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Kode Laporan</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Pelapor & Korban</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Kategori</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Satgas</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Tanggal</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Aksi</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {reports.map((report) => (
                                <tr key={report.id} className="group hover:bg-slate-50/80 transition-all">
                                  <td className="px-8 py-6">
                                    <div className="flex items-center gap-3">
                                      <div className="w-2 h-8 bg-unsri-gold rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                                      <span className="font-black text-unsri-black tracking-tighter">{report.tracking_code}</span>
                                    </div>
                                  </td>
                                  <td className="px-8 py-6">
                                    <div className="space-y-1">
                                      <div className="font-bold text-slate-900 flex flex-col items-start gap-0.5">
                                        <div className="flex items-center gap-2">
                                          {report.is_anonymous ? (
                                            <span className="flex items-center gap-1 text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                                              <EyeOff size={10} /> Anonim
                                            </span>
                                          ) : report.reporter_name}
                                        </div>
                                        <MaskedContact contact={report.reporter_contact} />
                                      </div>
                                      <p className="text-xs text-slate-400 font-medium italic mt-1">Korban: {report.victim_name}</p>
                                    </div>
                                  </td>
                                  <td className="px-8 py-6">
                                    <span className="px-3 py-1.5 bg-slate-100 rounded-xl text-[10px] font-black text-slate-600 uppercase tracking-widest border border-slate-200">
                                      {report.category}
                                    </span>
                                  </td>
                                  <td className="px-8 py-6">
                                    <div className={cn(
                                      "px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest inline-block",
                                      getStatusColor(report.status)
                                    )}>
                                      {report.status}
                                    </div>
                                  </td>
                                  <td className="px-8 py-6">
                                    {report.assigned_to ? (
                                      <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                                        {users.find(u => u.id === report.assigned_to)?.username || 'Unknown'}
                                      </span>
                                    ) : (
                                      <span className="text-xs font-medium text-slate-400 italic">Belum ditugaskan</span>
                                    )}
                                  </td>
                                  <td className="px-8 py-6">
                                    <p className="text-xs font-bold text-slate-600">{new Date(report.created_at).toLocaleDateString('id-ID')}</p>
                                    <p className="text-[10px] text-slate-400 font-medium">{new Date(report.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
                                    {(() => {
                                      if (report.status === 'RESOLVED' || report.status === 'OUT_OF_SCOPE') return null;
                                      
                                      const slaSettings: Record<string, number> = {
                                        PENDING: settings.sla_pending || 7,
                                        INVESTIGATING: settings.sla_investigating || 30,
                                        RECOMMENDED: settings.sla_recommended || 7
                                      };
                                      
                                      const limit = slaSettings[report.status];
                                      if (!limit) return null;
                                      
                                      const daysPassed = getWorkingDays(report.last_updated_at || report.created_at);
                                      const late = daysPassed > limit;
                                      const warning = daysPassed >= limit - 2 && !late;
                                      
                                      return (
                                        <div className={cn(
                                          "mt-2 inline-flex items-center gap-1 px-2 py-1 rounded border text-[9px] font-bold uppercase tracking-wider",
                                          late ? "bg-red-50 text-red-600 border-red-200" : warning ? "bg-amber-50 text-amber-600 border-amber-200" : "bg-emerald-50 text-emerald-600 border-emerald-200"
                                        )}>
                                          <AlertCircle size={10} />
                                          {daysPassed}/{limit} Hari Kerja
                                        </div>
                                      );
                                    })()}
                                  </td>
                                  <td className="px-8 py-6 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      {adminUser?.role === 'admin' ? (
                                        <>
                                          <button 
                                            onClick={() => setAssignModal({ isOpen: true, reportId: report.id })}
                                            className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:bg-unsri-gold hover:text-unsri-black transition-all"
                                            title="Tugaskan Satgas"
                                          >
                                            <Users size={18} />
                                          </button>
                                          <button 
                                            onClick={() => setLogModal({ isOpen: true, reportId: report.id })}
                                            className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:bg-unsri-gold hover:text-unsri-black transition-all"
                                            title="Lihat Riwayat & Log"
                                          >
                                            <Clock size={18} />
                                          </button>
                                        </>
                                      ) : (
                                        <>
                                          {report.assigned_to === adminUser?.id && report.status === 'PENDING' && (
                                            <>
                                              <button 
                                                onClick={() => setStatusModal({ isOpen: true, reportId: report.id, nextStatus: 'INVESTIGATING', notes: '' })}
                                                className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:bg-unsri-gold hover:text-unsri-black transition-all"
                                                title="Teruskan ke Investigasi"
                                              >
                                                <Activity size={18} />
                                              </button>
                                              <button 
                                                onClick={() => setStatusModal({ isOpen: true, reportId: report.id, nextStatus: 'OUT_OF_SCOPE', notes: '' })}
                                                className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:bg-red-500 hover:text-white transition-all"
                                                title="Tutup Kasus (Tidak Masuk Lingkup)"
                                              >
                                                <X size={18} />
                                              </button>
                                            </>
                                          )}
                                          {report.assigned_to === adminUser?.id && report.status === 'INVESTIGATING' && (
                                            <button 
                                                onClick={() => setStatusModal({ isOpen: true, reportId: report.id, nextStatus: 'RECOMMENDED', notes: '' })}
                                                className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:bg-indigo-500 hover:text-white transition-all"
                                                title="Kumpulkan Hasil Investigasi"
                                              >
                                                <FileText size={18} />
                                            </button>
                                          )}
                                          {report.assigned_to === adminUser?.id && report.status === 'RECOMMENDED' && (
                                            <button 
                                              onClick={() => setStatusModal({ isOpen: true, reportId: report.id, nextStatus: 'RESOLVED', notes: '' })}
                                              className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:bg-emerald-500 hover:text-white transition-all"
                                              title="Selesaikan Kasus (SK Sanksi)"
                                            >
                                              <CheckCircle2 size={18} />
                                            </button>
                                          )}
                                          {report.assigned_to === adminUser?.id && (
                                            <button 
                                              onClick={() => setExportModal({ isOpen: true, reportId: report.id })}
                                              className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:bg-unsri-black hover:text-unsri-gold transition-all"
                                              title="Ekspor Data"
                                            >
                                              <Database size={18} />
                                            </button>
                                          )}
                                          <button 
                                            onClick={() => setLogModal({ isOpen: true, reportId: report.id })}
                                            className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:bg-unsri-gold hover:text-unsri-black transition-all"
                                            title="Lihat Riwayat & Log"
                                          >
                                            <Clock size={18} />
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        
                        {reports.length === 0 && (
                          <div className="p-20 text-center space-y-4">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mx-auto">
                              <FileText size={40} />
                            </div>
                            <p className="text-slate-400 font-bold">Belum ada laporan yang masuk ke sistem.</p>
                          </div>
                        )}

                        <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Menampilkan {reports.length} Laporan</p>
                          <div className="flex gap-2">
                            <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-400 cursor-not-allowed">Previous</button>
                            <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-400 cursor-not-allowed">Next</button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {adminTab === 'reports' && statusModal.isOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-[40px] p-10 max-w-4xl mx-auto w-full shadow-2xl space-y-8 border border-slate-200"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <button 
                            onClick={() => setStatusModal({ isOpen: false, reportId: '', nextStatus: null })}
                            className="flex items-center gap-2 text-slate-500 hover:text-unsri-black text-sm font-bold mb-4"
                          >
                            <ArrowLeft size={16} /> Kembali ke Daftar Laporan
                          </button>
                          <div className="flex items-center gap-2 text-unsri-gold">
                            <Activity size={18} />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Status Management</span>
                          </div>
                          <h3 className="text-3xl font-black text-unsri-black tracking-tight">Update Progres Laporan</h3>
                          <p className="text-sm font-medium text-slate-500 mt-2">Kode Laporan: <span className="font-bold text-slate-800">{reports.find(r => r.id === statusModal.reportId)?.tracking_code}</span></p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status Saat Ini</p>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-slate-400" />
                            <p className="text-lg font-bold text-slate-600">
                              {reports.find(r => r.id === statusModal.reportId)?.status || 'PENDING'}
                            </p>
                          </div>
                        </div>
                        <div className="p-6 bg-unsri-gold/10 rounded-3xl border border-unsri-gold/20">
                          <p className="text-[10px] font-black text-unsri-gold uppercase tracking-widest mb-1">Status Baru</p>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-unsri-gold animate-pulse" />
                            <p className="text-lg font-black text-unsri-black">{statusModal.nextStatus}</p>
                          </div>
                        </div>
                      </div>

                      <form onSubmit={handleStatusUpdate} className="space-y-8">
                        <div className="relative">
                          <RichTextEditor 
                            label="Catatan Internal Petugas (Wajib)" 
                            value={statusModal.notes}
                            onChange={(val) => setStatusModal({ ...statusModal, notes: val })}
                            placeholder={statusModal.nextStatus === 'INVESTIGATING' ? "Contoh: Tim satgas akan melakukan pemanggilan tertutup kepada pelapor pada [Tanggal] untuk menggali kronologi lebih detail. Harap berkoordinasi dengan pendamping psikologi..." : "Tuliskan catatan internal terkait update status ini..."}
                            className={statusModal.nextStatus === 'INVESTIGATING' ? "min-h-[400px] pt-2 text-lg bg-blue-50 border-blue-200 focus:ring-blue-500/20" : "min-h-[250px] pt-2 text-lg bg-blue-50 border-blue-200 focus:ring-blue-500/20"}
                          />
                        </div>

                        {statusModal.nextStatus === 'RECOMMENDED' && (
                          <div className="space-y-6 p-8 bg-slate-50 border border-slate-200 rounded-[32px]">
                            <h4 className="text-base font-black text-slate-800 uppercase tracking-widest mb-4">Hasil Investigasi</h4>
                            <div className="grid grid-cols-2 gap-6">
                              <Input label="Identitas Korban" name="identitas_korban" placeholder="Nama / NIM" required />
                              <Input label="Identitas Saksi" name="identitas_saksi" placeholder="Nama / NIM Saksi (jika ada)" />
                            </div>
                            <div className="space-y-2">
                               <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Ringkasan Kasus (Dokumen/PDF)</label>
                               <input type="file" name="file_ringkasan_kasus" accept=".doc,.docx,application/pdf" className="w-full text-sm text-slate-500 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-unsri-gold/10 file:text-unsri-black hover:file:bg-unsri-gold/20 leading-loose border border-slate-200 rounded-2xl p-2 bg-white" required />
                            </div>
                            <Input label="Tanggal Surat Rekomendasi Sanksi" name="tanggal_surat_rekomendasi" type="date" required />
                            <div className="space-y-2">
                               <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Upload Surat Rekomendasi Sanksi (Dokumen/PDF)</label>
                               <input type="file" name="file_surat_rekomendasi" accept=".doc,.docx,application/pdf" className="w-full text-sm text-slate-500 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-unsri-gold/10 file:text-unsri-black hover:file:bg-unsri-gold/20 leading-loose border border-slate-200 rounded-2xl p-2 bg-white" required />
                            </div>
                          </div>
                        )}

                        {statusModal.nextStatus === 'RESOLVED' && (
                          <div className="space-y-6 p-8 bg-slate-50 border border-slate-200 rounded-[32px]">
                            <h4 className="text-base font-black text-slate-800 uppercase tracking-widest mb-4">Penyelesaian Kasus</h4>
                            <div className="grid grid-cols-2 gap-6">
                              <Input label="Nomor SK Sanksi" name="nomor_sk_sanksi" placeholder="Nomor Surat Keputusan" required />
                              <Input label="Tanggal Terbit SK Sanksi" name="tanggal_sk_sanksi" type="date" required />
                            </div>
                            <div className="space-y-2">
                               <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Upload SK Sanksi (Dokumen/PDF)</label>
                               <input type="file" name="file_sk_sanksi" accept=".doc,.docx,application/pdf" className="w-full text-sm text-slate-500 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-unsri-gold/10 file:text-unsri-black hover:file:bg-unsri-gold/20 leading-loose border border-slate-200 rounded-2xl p-2 bg-white" required />
                            </div>
                          </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-slate-100">
                          <Button 
                            variant="outline" 
                            className="flex-1 order-2 sm:order-1 py-5" 
                            type="button" 
                            onClick={() => setStatusModal({ isOpen: false, reportId: '', nextStatus: null, notes: '' })}
                          >
                            Batalkan
                          </Button>
                          <Button 
                            className="flex-[2] order-1 sm:order-2 py-5 text-lg" 
                            type="submit"
                          >
                            Konfirmasi & Update Status
                          </Button>
                        </div>
                      </form>
                    </motion.div>
                  )}

                  {adminTab === 'users' && (
                    <div className="space-y-8">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="text-xl font-black text-unsri-black">Anggota Satgas</h3>
                          <p className="text-sm text-slate-500 font-medium">Kelola hak akses dan peran anggota tim.</p>
                        </div>
                        <Button onClick={() => setUserModal({ isOpen: true })} className="shadow-xl shadow-unsri-gold/20">
                          <User size={18} />
                          <span>Tambah Anggota Baru</span>
                        </Button>
                      </div>

                      <div className="grid sm:grid-cols-3 gap-6">
                        {users.map((user) => (
                          <div key={user.id} className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-circuit -mr-12 -mt-12 rotate-45 opacity-0 group-hover:opacity-10 transition-opacity" />
                            <div className="flex items-center gap-4 mb-6">
                              <div className="w-14 h-14 bg-unsri-navy rounded-2xl flex items-center justify-center text-unsri-gold font-black text-xl shadow-lg">
                                {user.username[0].toUpperCase()}
                              </div>
                              <div>
                                <h4 className="font-black text-unsri-black">{user.username}</h4>
                                <span className="px-2 py-0.5 bg-unsri-gold/10 text-unsri-black text-[9px] font-black uppercase tracking-widest rounded-full border border-unsri-gold/20">
                                  {user.role}
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => setUserModal({ isOpen: true, user })}
                                className="flex-1 py-2.5 bg-slate-50 rounded-xl text-xs font-bold text-slate-600 hover:bg-unsri-gold hover:text-unsri-black transition-all"
                              >
                                Edit Profil
                              </button>
                              <button 
                                onClick={() => deleteUser(user.id)}
                                className="px-4 py-2.5 bg-slate-50 rounded-xl text-xs font-bold text-red-400 hover:bg-red-50 hover:text-red-600 transition-all"
                              >
                                Hapus
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {adminTab === 'settings_sla' && (
                    <div className="space-y-8">
                      <div>
                        <h3 className="text-xl font-black text-unsri-black">Pengaturan SLA Sistem</h3>
                        <p className="text-sm text-slate-500 font-medium">Batas maksimum waktu (hari kerja) untuk penyelesaian setiap fase pelaporan.</p>
                      </div>

                      <div className="bg-white p-10 rounded-[32px] border border-slate-200 shadow-sm">
                        <form onSubmit={async (e) => {
                          e.preventDefault();
                          setIsLoading(true);
                          const form = e.target as HTMLFormElement;
                          const newSettings = {
                            ...settings,
                            sla_pending: parseInt((form.elements.namedItem('sla_pending') as HTMLInputElement).value),
                            sla_investigating: parseInt((form.elements.namedItem('sla_investigating') as HTMLInputElement).value),
                            sla_recommended: parseInt((form.elements.namedItem('sla_recommended') as HTMLInputElement).value),
                            sla_resolved: parseInt((form.elements.namedItem('sla_resolved') as HTMLInputElement).value)
                          };
                          
                          try {
                            const res = await fetch('/api/admin/settings', {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify(newSettings)
                            });
                            const data = await res.json();
                            if (data.success) {
                              setSettings(data.settings);
                              alert('Pengaturan SLA berhasil disimpan!');
                            }
                          } catch (err) {
                            alert('Gagal menyimpan pengaturan SLA.');
                          } finally {
                            setIsLoading(false);
                          }
                        }} className="space-y-6 max-w-xl">
                          <Input 
                            label="Fase Verifikasi & Penugasan (Status: Menunggu)" 
                            name="sla_pending" 
                            type="number" 
                            min={1} 
                            defaultValue={settings.sla_pending} 
                            helperText="Maksimum SLA Default: 7 hari kerja" 
                            required 
                          />
                          <Input 
                            label="Fase Investigasi (Status: Ditangani)" 
                            name="sla_investigating" 
                            type="number" 
                            min={1} 
                            defaultValue={settings.sla_investigating} 
                            helperText="Maksimum SLA Default: 30 hari kerja" 
                            required 
                          />
                          <Input 
                            label="Fase Pemberian Rekomendasi" 
                            name="sla_recommended" 
                            type="number" 
                            min={1} 
                            defaultValue={settings.sla_recommended} 
                            helperText="Maksimum SLA Default: 7 hari kerja" 
                            required 
                          />
                          <Input 
                            label="Fase Penyelesaian & Sanksi (Opsional)" 
                            name="sla_resolved" 
                            type="number" 
                            min={1} 
                            defaultValue={settings.sla_resolved} 
                            helperText="Maksimum SLA Default: 7 hari kerja" 
                            required 
                          />

                          <Button type="submit" className="w-full">
                            Simpan Pengaturan SLA
                          </Button>
                        </form>
                      </div>
                    </div>
                  )}

                  {adminTab === 'settings_upload' && (
                    <div className="space-y-8">
                      <div>
                        <h3 className="text-xl font-black text-unsri-black">Ukuran Maksimal Bukti</h3>
                        <p className="text-sm text-slate-500 font-medium">Batas maksimum ukuran file (dalam megabyte) yang dapat diunggah oleh pelapor.</p>
                      </div>

                      <div className="bg-white p-10 rounded-[32px] border border-slate-200 shadow-sm">
                        <form onSubmit={async (e) => {
                          e.preventDefault();
                          setIsLoading(true);
                          const form = e.target as HTMLFormElement;
                          const newSettings = {
                            ...settings,
                            max_upload_size_mb: parseInt((form.elements.namedItem('max_upload_size_mb') as HTMLInputElement).value)
                          };
                          
                          try {
                            const res = await fetch('/api/admin/settings', {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify(newSettings)
                            });
                            const data = await res.json();
                            if (data.success) {
                              setSettings(data.settings);
                              alert('Pengaturan ukuran maksimal bukti berhasil disimpan!');
                            }
                          } catch (err) {
                            alert('Gagal menyimpan pengaturan.');
                          } finally {
                            setIsLoading(false);
                          }
                        }} className="space-y-6 max-w-xl">
                          <Input 
                            label="Ukuran Maksimal Bukti (MB)" 
                            name="max_upload_size_mb" 
                            type="number" 
                            min={1} 
                            defaultValue={settings.max_upload_size_mb || 10} 
                            helperText="Ukuran default: 10 MB. Pengaturan ini akan diaplikasikan di seluruh sistem." 
                            required 
                          />

                          <Button type="submit" className="w-full">
                            Simpan Pengukuran Bukti
                          </Button>
                        </form>
                      </div>
                    </div>
                  )}

                  {adminTab === 'settings_category' && (
                    <div className="space-y-8">
                      <div>
                        <h3 className="text-xl font-black text-unsri-black">Kategori Kekerasan</h3>
                        <p className="text-sm text-slate-500 font-medium">Atur daftar kategori kekerasan yang bisa dipilih pelapor dan satgas dalam sistem pelaporan.</p>
                      </div>

                      <div className="bg-white p-10 rounded-[32px] border border-slate-200 shadow-sm">
                        <form onSubmit={async (e) => {
                          e.preventDefault();
                          setIsLoading(true);
                          const form = e.target as HTMLFormElement;
                          const newSettings = {
                            ...settings,
                            categories: (form.elements.namedItem('categories') as HTMLTextAreaElement).value.split('\n').map(c => c.trim()).filter(c => c.length > 0)
                          };
                          
                          try {
                            const res = await fetch('/api/admin/settings', {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify(newSettings)
                            });
                            const data = await res.json();
                            if (data.success) {
                              setSettings(data.settings);
                              alert('Daftar kategori berhasil diperbarui!');
                            }
                          } catch (err) {
                            alert('Gagal menyimpan kategori.');
                          } finally {
                            setIsLoading(false);
                          }
                        }} className="space-y-6 max-w-xl">
                          <div className="space-y-1.5 w-full">
                            <label className="text-sm font-semibold text-gray-700 ml-1">Kategori Kekerasan (Pisahkan tiap kategori dengan baris baru "Enter")</label>
                            <textarea 
                              name="categories"
                              defaultValue={(settings.categories || []).join('\n')}
                              placeholder="Kekerasan Fisik&#10;Kekerasan Seksual..."
                              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-slate-50 focus:bg-white focus:border-unsri-gold outline-none transition-all resize-none h-64 font-medium"
                              required
                            />
                            <p className="text-xs text-slate-500 mt-2">Daftar kategori ini akan menjadi muara opsi dropdown pada form pelaporan halaman utama.</p>
                          </div>

                          <Button type="submit" className="w-full">
                            Simpan Daftar Kategori
                          </Button>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              </main>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Log Modal */}
      <AnimatePresence>
        {logModal.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[32px] p-8 max-w-2xl w-full shadow-2xl relative border border-slate-200 max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => setLogModal({ isOpen: false, reportId: '' })}
                className="absolute top-6 right-6 w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-200 hover:text-slate-900 transition-colors"
              >
                <X size={16} />
              </button>
              
              <div className="mb-6">
                <h3 className="text-2xl font-black text-unsri-black tracking-tight">Riwayat & Log Sistem</h3>
                <p className="text-sm text-slate-500 font-medium">Log aktivitas komprehensif, termasuk riwayat ekspor dan status.</p>
              </div>

              <StatusProgressTracker reportId={logModal.reportId} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Export Modal */}
      <AnimatePresence>
        {exportModal.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6 border border-slate-200"
            >
              {!exportModal.zipPassword ? (
                <>
                  <div className="text-center space-y-2">
                    <div className="w-16 h-16 bg-unsri-gold/10 rounded-2xl flex items-center justify-center text-unsri-black mx-auto mb-4 border border-unsri-gold/20">
                      <Lock size={32} />
                    </div>
                    <h3 className="text-xl font-bold">Konfirmasi Keamanan</h3>
                    <p className="text-sm text-slate-500">Masukkan password akun Satgas Anda untuk mengonfirmasi ekspor data sensitif.</p>
                  </div>
                  <form onSubmit={handleExportZip} className="space-y-4">
                    <Input label="Password Konfirmasi" name="confirm_password" type="password" required />
                    <div className="flex gap-3">
                      <Button variant="ghost" className="flex-1" type="button" onClick={() => setExportModal({ isOpen: false, reportId: '' })}>Batal</Button>
                      <Button className="flex-1" type="submit" disabled={isLoading}>
                        {isLoading ? "Memproses..." : "Konfirmasi"}
                      </Button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="text-center space-y-6">
                  <div className="w-16 h-16 bg-unsri-gold/10 rounded-2xl flex items-center justify-center text-unsri-black mx-auto mb-4 border border-unsri-gold/20">
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 className="text-xl font-bold">Ekspor Berhasil</h3>
                  <div className="p-6 bg-slate-900 rounded-2xl space-y-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Password ZIP (Hanya Muncul Sekali)</p>
                    <p className="text-3xl font-mono font-bold text-white tracking-wider">{exportModal.zipPassword}</p>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Salin password di atas. Anda akan membutuhkannya untuk membuka file ZIP yang diunduh. File ini menggunakan enkripsi AES-256.
                  </p>
                  <div className="flex flex-col gap-3">
                    <a 
                      href={exportModal.downloadUrl} 
                      className="w-full bg-unsri-black text-unsri-gold py-3 rounded-xl font-bold hover:bg-black transition-colors flex items-center justify-center gap-2"
                      onClick={() => {
                        // Close modal after a short delay to allow download to start
                        setTimeout(() => setExportModal({ isOpen: false, reportId: '' }), 1000);
                      }}
                    >
                      Unduh File ZIP
                    </a>
                    <Button variant="ghost" onClick={() => setExportModal({ isOpen: false, reportId: '' })}>Tutup</Button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* User Modal */}
      <AnimatePresence>
        {userModal.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6 border border-slate-200"
            >
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-unsri-gold/10 rounded-2xl flex items-center justify-center text-unsri-black mx-auto mb-4 border border-unsri-gold/20">
                  <User size={32} />
                </div>
                <h3 className="text-xl font-bold">{userModal.user ? 'Edit User Satgas' : 'Tambah User Satgas'}</h3>
                <p className="text-sm text-slate-500">Kelola kredensial akses untuk anggota Satgas.</p>
              </div>
              <form onSubmit={handleUserSubmit} className="space-y-4">
                <Input 
                  label="Username" 
                  name="username" 
                  defaultValue={userModal.user?.username} 
                  required 
                />
                <Input 
                  label={userModal.user ? "Password Baru (Kosongkan jika tidak diubah)" : "Password"} 
                  name="password" 
                  type="password" 
                  required={!userModal.user} 
                />
                <Select 
                  label="Role" 
                  name="role" 
                  defaultValue={userModal.user?.role || 'satgas'}
                  options={[
                    { value: 'satgas', label: 'Satgas' },
                    { value: 'admin', label: 'Admin' }
                  ]}
                  required
                />
                <div className="flex gap-3 pt-2">
                  <Button variant="ghost" className="flex-1" type="button" onClick={() => setUserModal({ isOpen: false })}>Batal</Button>
                  <Button className="flex-1" type="submit">Simpan</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Status Update Modal */}


      {/* Assign Satgas Modal */}
      <AnimatePresence>
        {assignModal.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white rounded-[40px] p-10 max-w-lg w-full shadow-2xl space-y-8 border border-slate-200"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-unsri-gold">
                    <Users size={18} />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em]">Penugasan</span>
                  </div>
                  <h3 className="text-2xl font-black text-unsri-black tracking-tight">Tugaskan Satgas</h3>
                </div>
                <button 
                  onClick={() => setAssignModal({ isOpen: false, reportId: '' })}
                  className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAssignSatgas} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">Pilih Satgas</label>
                  <select 
                    name="assigned_to" 
                    required 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-unsri-gold focus:border-transparent transition-all"
                    defaultValue={reports.find(r => r.id === assignModal.reportId)?.assigned_to || ''}
                  >
                    <option value="" disabled>Pilih anggota satgas...</option>
                    {users.filter(u => u.role === 'satgas').map(user => (
                      <option key={user.id} value={user.id}>{user.username}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    variant="outline" 
                    className="flex-1 order-2 sm:order-1" 
                    type="button" 
                    onClick={() => setAssignModal({ isOpen: false, reportId: '' })}
                  >
                    Batalkan
                  </Button>
                  <Button 
                    className="flex-[2] order-1 sm:order-2" 
                    type="submit"
                  >
                    Tugaskan
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="mt-20 border-t border-slate-200 bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-4">
          <p className="text-sm font-bold text-slate-900">Satgas PPKPT Fakultas Ilmu Komputer Universitas Sriwijaya</p>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Sistem ini dirancang untuk memberikan perlindungan maksimal bagi penyintas. Seluruh data dienkripsi dan hanya dapat diakses oleh personel Satgas yang berwenang.
          </p>
          <div className="pt-4 flex justify-center gap-6">
            <a href="#" className="text-xs font-bold text-unsri-black hover:underline">Kebijakan Privasi</a>
            <a href="#" className="text-xs font-bold text-unsri-black hover:underline">Panduan Pelaporan</a>
            <a href="#" className="text-xs font-bold text-unsri-black hover:underline">Kontak Darurat</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
