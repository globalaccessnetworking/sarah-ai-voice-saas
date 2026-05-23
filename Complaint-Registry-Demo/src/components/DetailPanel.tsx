import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Phone, User, FileText, Calendar, ShieldCheck } from 'lucide-react';
import type { Complaint } from '../lib/api';
import { StatusBadge, SentimentBadge, PriorityBadge } from './Badges';
import { AudioPlayer } from './AudioPlayer';

function formatDate(dateStr: string) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-PK', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

interface DetailPanelProps {
  complaint: Complaint | null;
  playingId: string | null;
  onPlay: (id: string) => void;
  onPause: () => void;
  onClose: () => void;
  onStatusChange: (id: number, status: string) => void;
}

export function DetailPanel({ complaint, playingId, onPlay, onPause, onClose, onStatusChange }: DetailPanelProps) {
  return (
    <AnimatePresence>
      {complaint && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />

          {/* Slide-in Panel */}
          <motion.aside
            key="panel"
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed right-0 top-0 h-screen w-full max-w-md bg-[#0d1321] border-l border-white/[0.07] z-50 overflow-y-auto"
          >
            {/* Panel Header */}
            <div className="sticky top-0 bg-[#0d1321]/95 backdrop-blur-sm border-b border-white/[0.06] px-6 py-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Complaint Detail</p>
                <h2 className="text-lg font-bold text-accent-orange font-mono mt-0.5">
                  {complaint.ticket_id || `#${complaint.id}`}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-all"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-5">

              {/* Status Row */}
              <div className="flex items-center gap-2 flex-wrap">
                <StatusBadge status={complaint.status} />
                <PriorityBadge priority={complaint.priority} />
                <SentimentBadge sentiment={complaint.sentiment} />
              </div>

              {/* Status Actions */}
              <div className="glass-card p-4 space-y-3">
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Change Status</p>
                <div className="flex gap-2 flex-wrap">
                  {['Resolved', 'Unresolved', 'Pending'].map((s) => (
                    <button
                      key={s}
                      onClick={() => onStatusChange(complaint.id, s)}
                      disabled={complaint.status.toLowerCase() === s.toLowerCase()}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all disabled:opacity-40 disabled:cursor-not-allowed
                        ${s === 'Resolved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' : ''}
                        ${s === 'Unresolved' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20' : ''}
                        ${s === 'Pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20' : ''}
                      `}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recording */}
              {complaint.recording_id && (
                <div className="glass-card p-4 flex items-center gap-4">
                  <AudioPlayer
                    recordingId={complaint.recording_id}
                    isPlaying={playingId === complaint.recording_id}
                    onPlay={onPlay}
                    onPause={onPause}
                  />
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Call Recording</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {playingId === complaint.recording_id ? '▶ Playing...' : 'Tap to play'}
                    </p>
                  </div>
                </div>
              )}

              {/* Citizen Info */}
              <div className="glass-card overflow-hidden">
                <div className="px-4 py-2.5 border-b border-white/[0.05] flex items-center gap-2">
                  <User size={12} className="text-gray-500" />
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Citizen</span>
                </div>
                <div className="p-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] text-gray-600 uppercase font-bold mb-1">Name</p>
                    <p className="text-[15px] font-semibold text-gray-200 leading-tight pt-0.5" dir="rtl">{complaint.name || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-600 uppercase font-bold mb-1">Phone</p>
                    <p className="text-sm font-mono text-gray-200 flex items-center gap-1.5">
                      <Phone size={12} className="text-gray-600" />
                      {complaint.phone || '—'}
                    </p>
                  </div>
                  {complaint.asterisk_number && (
                    <div className="col-span-2 bg-accent-emerald/5 border border-accent-emerald/10 rounded-lg p-2.5">
                      <p className="text-[10px] text-accent-emerald/70 uppercase font-bold mb-1">Asterisk ID</p>
                      <p className="text-sm font-mono text-accent-emerald flex items-center gap-1.5">
                        <ShieldCheck size={12} />
                        {complaint.asterisk_number}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Issue */}
              <div className="glass-card overflow-hidden">
                <div className="px-4 py-2.5 border-b border-white/[0.05] flex items-center gap-2">
                  <FileText size={12} className="text-gray-500" />
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Issue</span>
                </div>
                <div className="p-4">
                  <p className="text-[15px] text-gray-300 leading-relaxed pt-1" dir="rtl">{complaint.issue || '—'}</p>
                </div>
              </div>

              {/* Location */}
              <div className="glass-card overflow-hidden">
                <div className="px-4 py-2.5 border-b border-white/[0.05] flex items-center gap-2">
                  <MapPin size={12} className="text-gray-500" />
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Location</span>
                </div>
                <div className="p-4 space-y-3">
                  {[
                    { label: 'District', value: complaint.district },
                    { label: 'Address', value: complaint.address },
                    { label: 'Landmark', value: complaint.landmark },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-[10px] text-gray-600 uppercase font-bold mb-0.5">{label}</p>
                      <p className="text-[15px] text-gray-300 leading-tight pt-0.5" dir="rtl">{value || '—'}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer timestamp */}
              <div className="flex items-center gap-2 text-[11px] text-gray-700 pt-1 border-t border-white/[0.05]">
                <Calendar size={12} />
                <span>Registered: {formatDate(complaint.created_at)}</span>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
