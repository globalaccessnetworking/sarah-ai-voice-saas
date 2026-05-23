import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  FileText, Clock, CheckCircle2, Search, MapPin,
  PhoneCall, Loader2, RefreshCw, LogOut, Edit3,
  Trash2, AlertTriangle, Droplets, Zap, Building,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useComplaints } from '../hooks/useComplaints';
import { updateComplaintStatus, dispatchAsteriskVerification, getRecordingUrl, type Complaint } from '../lib/api';
import { StatusBadge, SentimentBadge } from '../components/Badges';
import { DetailPanel } from '../components/DetailPanel';
import { ToastContainer, type Toast } from '../components/ToastContainer';
import { ManualComplaintModal } from '../components/ManualComplaintModal';
import { EditComplaintModal } from '../components/EditComplaintModal';

// ── Helpers ────────────────────────────────────────────────────────────────────
function formatDateShort(d: string) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-PK', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

function getIssueIcon(issue: string | null) {
  const t = (issue || '').toLowerCase();
  if (t.includes('kachra') || t.includes('garbage') || t.includes('waste') || t.includes('litter'))
    return <Trash2 className="w-4 h-4 text-amber-500 flex-shrink-0" />;
  if (t.includes('manhole') || t.includes('sewage') || t.includes('drain'))
    return <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0" />;
  if (t.includes('water') || t.includes('pani'))
    return <Droplets className="w-4 h-4 text-blue-400 flex-shrink-0" />;
  if (t.includes('bijli') || t.includes('light') || t.includes('electric'))
    return <Zap className="w-4 h-4 text-yellow-400 flex-shrink-0" />;
  if (t.includes('road') || t.includes('sadak') || t.includes('street'))
    return <Building className="w-4 h-4 text-violet-400 flex-shrink-0" />;
  return <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />;
}

// ── Stat Card ──────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, glow, onClick, active }: {
  label: string; value: string; icon: React.ReactNode;
  glow: string; onClick?: () => void; active?: boolean;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`glass-card-hover p-5 text-left transition-all duration-300 w-full ${active ? `ring-1 ${glow}` : ''}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-3xl font-bold font-outfit tabular-nums text-white">{value}</p>
          <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest font-bold">{label}</p>
        </div>
        <div className="p-2.5 rounded-xl bg-white/5">{icon}</div>
      </div>
    </motion.button>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function RegistryPage() {
  const navigate = useNavigate();

  // ── Filters ──
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [districtFilter, setDistrictFilter] = useState('all');

  // ── Detail Panel & Modal ──
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [editingComplaint, setEditingComplaint] = useState<Complaint | null>(null);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  // ── Toasts ──
  const [toasts, setToasts] = useState<Toast[]>([]);
  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
  }, []);

  // ── FIX 2: Audio state lifted OUT of row components ──
  // playingId = recording_id of the currently playing audio (NOT complaint.id)
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handlePlay = useCallback((recordingId: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    const audio = new Audio(getRecordingUrl(recordingId));
    audio.onended = () => setPlayingId(null);
    audio.onerror = () => setPlayingId(null);
    audioRef.current = audio;
    audio.play().catch(() => setPlayingId(null));
    setPlayingId(recordingId);
  }, []);

  const handlePause = useCallback(() => {
    audioRef.current?.pause();
    setPlayingId(null);
  }, []);

  // ── FIX 3: Asterisk Dispatch state ──
  const [dispatchingId, setDispatchingId] = useState<number | null>(null);

  const handleDispatch = async (e: React.MouseEvent, complaint: Complaint) => {
    e.stopPropagation();
    if (dispatchingId !== null) return;
    setDispatchingId(complaint.id);
    try {
      const ok = await dispatchAsteriskVerification(complaint.id);
      if (ok) {
        addToast({
          type: 'success',
          message: `Verification Call Dispatched`,
          sub: `→ ${complaint.phone || complaint.asterisk_number || 'N/A'}`,
        });
      } else {
        addToast({ type: 'error', message: 'Dispatch failed. Retry.', sub: undefined });
      }
    } catch {
      addToast({ type: 'error', message: 'Network error during dispatch.', sub: undefined });
    } finally {
      setDispatchingId(null);
    }
  };

  // ── Polling (new complaint toast callback) ──
  const handleNewComplaint = useCallback((c: Complaint) => {
    addToast({
      type: 'info',
      message: `🟢 New Complaint — ${c.ticket_id || `#${c.id}`}`,
      sub: c.district ? `District: ${c.district}` : undefined,
    });
  }, [addToast]);

  const { complaints, stats, districts, isLoading, lastUpdated, refetch } = useComplaints({
    search, status: statusFilter, district: districtFilter,
    pollInterval: 3000,
    onNewComplaint: handleNewComplaint,
  });

  const handleManualSuccess = (toastData: Omit<Toast, 'id'>) => {
    addToast(toastData);
    refetch();
  };

  // ── Status Update ──
  const handleStatusChange = async (id: number, status: string) => {
    try {
      await updateComplaintStatus(id, status);
      if (selectedComplaint?.id === id) {
        setSelectedComplaint((prev) => prev ? { ...prev, status } : prev);
      }
      addToast({ type: 'success', message: `Status → ${status}`, sub: undefined });
      refetch();
    } catch {
      addToast({ type: 'error', message: 'Status update failed.', sub: undefined });
    }
  };

  // ── Logout ──
  const handleLogout = () => {
    localStorage.removeItem('sp_cr_auth');
    navigate('/login');
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* ── Header ── */}
      <header className="h-16 border-b border-white/[0.06] bg-black/30 backdrop-blur-md flex items-center justify-between px-6 shrink-0 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-accent-orange rounded-xl flex items-center justify-center font-bold text-sm font-outfit shadow-lg shadow-accent-orange/30">
            SP
          </div>
          <div>
            <h1 className="text-sm font-bold leading-none">Suthra Punjab · Live Complaint Registry</h1>
            <p className="text-[10px] text-gray-500 mt-0.5 uppercase tracking-widest">1139 Helpline · Government of Punjab</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Live pulsing indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <div className="w-2 h-2 rounded-full bg-emerald-400 live-dot" />
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Live · 3s</span>
          </div>

          {lastUpdated && (
            <span className="text-[10px] text-gray-600 hidden md:block font-mono">
              Last sync: {lastUpdated.toLocaleTimeString()}
            </span>
          )}

          <button
            onClick={() => setIsManualModalOpen(true)}
            className="hidden sm:block px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors text-gray-300 hover:text-white"
          >
            + Manual Complaint
          </button>

          <button
            onClick={() => refetch()}
            className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-all border border-transparent hover:border-white/10"
          >
            <LogOut size={13} />
            Logout
          </button>
        </div>
      </header>

      <main className="flex-1 p-6 space-y-6 max-w-[1600px] mx-auto w-full">

        {/* ── Stat Cards ── */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
        >
          {([
            { label: 'Total Complaints', value: stats.total, icon: <FileText size={20} className="text-violet-400" />, glow: 'ring-violet-500/30', filter: 'all' },
            { label: 'Pending Verification', value: stats.pending, icon: <Clock size={20} className="text-amber-400" />, glow: 'ring-amber-500/30', filter: 'pending' },
            { label: 'Resolved', value: stats.resolved, icon: <CheckCircle2 size={20} className="text-emerald-400" />, glow: 'ring-emerald-500/30', filter: 'resolved' },
          ] as const).map((card) => (
            <motion.div key={card.label} variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}>
              <StatCard
                label={card.label} value={card.value} icon={card.icon} glow={card.glow}
                onClick={() => setStatusFilter(card.filter)} active={statusFilter === card.filter}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* ── Search & Filters ── */}
        <div className="glass-card p-3 flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
            <input
              type="text"
              placeholder="Search ticket, name, phone, issue..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm placeholder:text-gray-600 focus:outline-none focus:border-accent-orange/50 transition-colors"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-accent-orange/50 transition-colors w-full md:w-40"
          >
            <option value="all">All Status</option>
            <option value="pending">⏳ Pending</option>
            <option value="resolved">✅ Resolved</option>
            <option value="unresolved">❌ Unresolved</option>
          </select>

          <select
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-accent-orange/50 transition-colors w-full md:w-44"
          >
            <option value="all">All Districts</option>
            {districts.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>

          <span className="text-[10px] text-gray-700 font-mono ml-auto whitespace-nowrap hidden lg:block">
            {complaints.length} records
          </span>
        </div>

        {/* ── Table ── */}
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.05] bg-white/[0.02]">
                  {['Ticket ID', 'Registered', 'Name', 'Asterisk ID', 'Location', 'Issue', 'Sentiment', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-gray-600 uppercase tracking-widest whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading && complaints.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="h-48 text-center">
                      <div className="flex flex-col items-center gap-3 text-gray-600">
                        <div className="w-10 h-10 border-2 border-accent-orange/20 border-t-accent-orange rounded-full animate-spin" />
                        <p className="text-xs font-bold uppercase tracking-widest">Syncing Registry...</p>
                      </div>
                    </td>
                  </tr>
                ) : complaints.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="h-48 text-center text-gray-600">
                      <FileText className="w-8 h-8 mx-auto mb-3 opacity-20" />
                      <p className="text-sm">No complaints found</p>
                    </td>
                  </tr>
                ) : complaints.map((c) => (
                  // FIX 2: key={c.id} uses the STABLE DB integer ID.
                  // React reconciles by updating the existing DOM node, never unmounting it.
                  <tr
                    key={c.id}
                    onClick={() => setSelectedComplaint(c)}
                    className="border-b border-white/[0.04] hover:bg-white/[0.025] cursor-pointer transition-colors group"
                  >
                    {/* Ticket ID */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-mono text-[11px] font-bold text-accent-orange bg-accent-orange/5 border border-accent-orange/15 px-2 py-1 rounded-md">
                        {c.ticket_id || `#${c.id}`}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3 text-[11px] text-gray-500 font-mono whitespace-nowrap">
                      {formatDateShort(c.created_at)}
                    </td>

                    {/* Name */}
                    <td className="px-4 py-3 text-left" dir="rtl">
                      <p className="text-[15px] font-bold text-gray-200 max-w-[110px] truncate" dir="auto">{c.name || '—'}</p>
                    </td>

                    {/* Asterisk ID */}
                    <td className="px-4 py-3">
                      {c.asterisk_number ? (
                        <span className="font-mono text-sm font-medium text-accent-emerald flex items-center gap-1.5 bg-accent-emerald/5 border border-accent-emerald/10 px-2.5 py-1 rounded-lg w-fit">
                          {c.asterisk_number}
                        </span>
                      ) : (
                        <span className="text-[11px] text-gray-600">—</span>
                      )}
                    </td>

                    {/* Location */}
                    <td className="px-4 py-3">
                      <div className="flex items-start justify-start gap-1.5 max-w-[130px]" dir="rtl">
                        <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                        <div className="text-right">
                          <p className="text-[14px] font-medium text-gray-300 truncate leading-tight">{c.district || '—'}</p>
                          {c.address && (
                            <p className="text-[11px] text-gray-500 truncate max-w-[110px] mt-0.5 leading-tight">{c.address}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Issue */}
                    <td className="px-4 py-3 max-w-[160px]">
                      <div className="flex items-start justify-start gap-1.5" dir="rtl">
                        <div className="mt-0.5">{getIssueIcon(c.issue)}</div>
                        <p className="text-[14px] text-gray-300 truncate leading-tight text-right">{c.issue || '—'}</p>
                      </div>
                    </td>

                    {/* Sentiment */}
                    <td className="px-4 py-3"><SentimentBadge sentiment={c.sentiment} /></td>

                    {/* Status */}
                    <td className="px-4 py-3"><StatusBadge status={c.status} /></td>



                    {/* Actions */}
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingComplaint(c);
                          }}
                          title="Edit Complaint"
                          className="flex items-center justify-center w-7 h-7 rounded-lg border transition-all bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      {/* FIX 3: Asterisk Dispatch Button with loading state */}
                      <button
                        onClick={(e) => handleDispatch(e, c)}
                        disabled={dispatchingId !== null}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide border transition-all
                          bg-accent-orange/10 text-accent-orange border-accent-orange/20
                          hover:bg-accent-orange/20 hover:border-accent-orange/40
                          disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                      >
                        {dispatchingId === c.id ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Dispatching...
                          </>
                        ) : (
                          <>
                            <PhoneCall className="w-4 h-4" />
                            Verify
                          </>
                        )}
                      </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table footer */}
          <div className="px-4 py-2.5 border-t border-white/[0.04] flex items-center justify-between">
            <span className="text-[10px] text-gray-700 font-mono">{complaints.length} complaints · live db</span>
            <span className="text-[10px] text-gray-700 font-mono">Auto-refreshing every 3s</span>
          </div>
        </div>
      </main>

      {/* ── Detail Slide-in Panel ── */}
      <DetailPanel
        complaint={selectedComplaint}
        playingId={playingId}
        onPlay={handlePlay}
        onPause={handlePause}
        onClose={() => setSelectedComplaint(null)}
        onStatusChange={handleStatusChange}
      />

      <ManualComplaintModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        onSuccess={handleManualSuccess}
        districts={districts}
      />

      <EditComplaintModal
        isOpen={editingComplaint !== null}
        onClose={() => setEditingComplaint(null)}
        onSuccess={handleManualSuccess}
        districts={districts}
        complaint={editingComplaint}
      />

      {/* ── Toast Notifications ── */}
      <ToastContainer toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((t) => t.id !== id))} />
    </div>
  );
}
