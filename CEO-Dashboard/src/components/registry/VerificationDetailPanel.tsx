import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, MapPin, CheckCircle2 } from 'lucide-react';

interface VerificationRecord {
  id: string;
  refTicket: string;
  timestamp: string;
  citizenName: string;
  phone: string;
  status: string;
  snippet: string;
  address?: string;
  confidenceScore: number;
  transcript: { speaker: 'AI' | 'Citizen', text: string }[];
}

interface VerificationDetailPanelProps {
  isOpen: boolean;
  onClose: () => void;
  record: VerificationRecord | null;
}

export default function VerificationDetailPanel({ isOpen, onClose, record }: VerificationDetailPanelProps) {
  if (!isOpen || !record) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Confirmed': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'Denied': return 'text-red-400 bg-red-500/10 border-red-500/20';
      default: return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Panel */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
          className="relative w-full max-w-xl h-full shadow-2xl flex flex-col"
          style={{ backgroundColor: '#111827', borderLeft: '1px solid #1f2937' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #1f2937', backgroundColor: '#0d1117' }}>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  {record.id}
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono border border-slate-700">Ref: {record.refTicket}</span>
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusColor(record.status)}`}>
                  {record.status}
                </span>
              </div>
              <p className="text-sm text-gray-500 flex items-center gap-2">
                <Clock size={14} /> {record.timestamp}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Section 1: Field Worker Evidence */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-white border-b border-gray-800 pb-2 flex items-center justify-between">
                Field Worker Evidence
                <span className="text-xs text-gray-500 font-mono">Uploaded 22 Oct, 11:45 AM</span>
              </h3>
              <div className="rounded-lg border border-gray-800 overflow-hidden bg-[#0b0f19] relative h-48 group">
                <div className="absolute inset-0 opacity-40 mix-blend-overlay" style={{
                  backgroundImage: 'url("https://images.unsplash.com/photo-1616680214084-22670de1bc82?q=80&w=1000&auto=format&fit=crop")',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }} />
                {/* Mock evidence placeholder content */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f19] via-transparent to-transparent opacity-80" />
                <div className="absolute bottom-3 left-3 flex items-center gap-2 text-xs text-white bg-black/60 px-2 py-1 rounded backdrop-blur">
                  <MapPin size={12} className="text-emerald-400" /> Site Cleared
                </div>
              </div>
            </div>

            {/* Section 2: Verification Transcript */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-white border-b border-gray-800 pb-2">Verification Transcript</h3>
              <div className="rounded-lg bg-[#0b0f19] border border-gray-800 p-4 space-y-3 font-mono text-[13px]">
                {record.transcript.map((line, idx) => (
                  <div key={idx} className="flex flex-col gap-1">
                    <span className={`font-semibold ${line.speaker === 'AI' ? 'text-teal-400' : 'text-indigo-400'}`}>
                      {line.speaker === 'AI' ? 'AI Voice Agent' : record.citizenName}
                    </span>
                    <p className="text-gray-300 leading-snug break-words">
                      "{line.text}"
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 3: Audit Match */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-white border-b border-gray-800 pb-2">Audit Match</h3>
              <div className="rounded-lg bg-[#0b0f19] border border-gray-800 p-5">
                <div className="flex justify-between items-end mb-2">
                  <p className="text-sm text-gray-400">Verification Confidence Score</p>
                  <p className={`text-xl font-bold ${record.confidenceScore >= 90 ? 'text-emerald-500' : record.confidenceScore >= 70 ? 'text-yellow-500' : 'text-red-500'}`}>
                    {record.confidenceScore}%
                  </p>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden flex">
                  <div 
                    className={`h-2 rounded-full ${record.confidenceScore >= 90 ? 'bg-emerald-500' : record.confidenceScore >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                    style={{ width: `${record.confidenceScore}%` }} 
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Footer actions */}
          <div className="px-6 py-4 bg-[#0d1117] border-t border-gray-800 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded text-sm font-semibold text-white bg-gray-800 hover:bg-white/5 transition-colors border border-gray-700 transition-colors"
            >
              Close Record
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
