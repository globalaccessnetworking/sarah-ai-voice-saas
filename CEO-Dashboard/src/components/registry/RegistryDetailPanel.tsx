import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Clock, CheckCircle2, User, Phone, Image as ImageIcon, Zap } from 'lucide-react';

interface RecordDetails {
  id: string;
  asteriskId?: string;
  timestamp: string;
  customerName?: string;
  phone: string;
  address: string;
  landmark?: string;
  lat: string;
  lng: string;
  hasImage: boolean;
  hasVoice: boolean;
  snippet: string;
  sentiment?: string;
  status: string;
}

interface RegistryDetailPanelProps {
  isOpen: boolean;
  onClose: () => void;
  record: RecordDetails | null;
}

export default function RegistryDetailPanel({ isOpen, onClose, record }: RegistryDetailPanelProps) {
  if (!isOpen || !record) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Resolved': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'Unresolved': return 'text-red-400 bg-red-500/10 border-red-500/20';
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
                  {record.asteriskId && <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono border border-slate-700">{record.asteriskId}</span>}
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
            
            {/* Citizen Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-white border-b border-gray-800 pb-2">Citizen Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-[#0b0f19] border border-gray-800 flex items-center gap-3">
                  <div className="p-2 rounded bg-indigo-500/10 text-indigo-400">
                    <Phone size={16} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Phone Number</p>
                    <p className="text-sm font-medium text-gray-200">{record.phone}</p>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-[#0b0f19] border border-gray-800 flex items-center gap-3">
                  <div className="p-2 rounded bg-teal-500/10 text-teal-400">
                    <User size={16} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Customer Name</p>
                    <p className="text-sm font-medium text-gray-200">{record.customerName || 'Verified Citizen'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Geographical Location */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-white border-b border-gray-800 pb-2">Geographical Location</h3>
              <div className="rounded-lg bg-[#0b0f19] border border-gray-800 p-4">
                <div className="flex items-start gap-3">
                  <MapPin className="text-red-400 mt-1" size={18} />
                  <div>
                    <p className="text-sm font-medium text-gray-200 mb-1">{record.address}</p>
                    {record.landmark && <p className="text-xs text-gray-400 mb-1.5">Landmark: {record.landmark}</p>}
                    <p className="text-xs font-mono text-gray-500">LAT: {record.lat} | LNG: {record.lng}</p>
                  </div>
                </div>
                {/* Mock Map View */}
                <div className="w-full h-32 mt-4 rounded border border-gray-800 bg-[#1f2937] flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at center, #374151 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
                  <MapPin className="text-red-500 relative z-10" size={32} />
                  <div className="absolute -bottom-8 w-24 h-8 bg-red-500/20 blur-xl rounded-full" />
                </div>
              </div>
            </div>

            {/* AI Transcript & Summary */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-white border-b border-gray-800 pb-2">AI Triage Summary</h3>
              <div className="rounded-lg bg-[#0b0f19] border border-emerald-500/20 p-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-10">
                  <Zap size={64} />
                </div>
                <p className="text-sm text-gray-300 leading-relaxed mb-4 relative z-10">
                  "Hello, the main solid waste bin outside our society gate hasn't been cleared for three days. {record.snippet}"
                </p>
                <div className="flex gap-2">
                  <span className="px-2 py-1 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs">Intent: File Complaint</span>
                  {record.sentiment && (
                    <span className={`px-2 py-1 rounded text-xs border ${
                      record.sentiment === 'Angry' || record.sentiment === 'Frustrated' || record.sentiment === 'Urgent'
                        ? 'bg-red-500/10 text-red-500 border-red-500/20' 
                        : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                    }`}>
                      Sentiment: {record.sentiment}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Evidence Attached */}
            {record.hasImage && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-white border-b border-gray-800 pb-2 flex justify-between items-center">
                  Evidence Attached
                  <span className="text-xs bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20">Sp-Vision-Verified</span>
                </h3>
                <div className="rounded-lg border border-gray-800 overflow-hidden bg-[#0b0f19] flex items-center justify-center py-10 relative">
                  <ImageIcon className="text-gray-700" size={48} />
                  <div className="absolute bottom-2 right-2 text-xs text-gray-500">Image_8821.jpg</div>
                </div>
              </div>
            )}

          </div>

          {/* Footer actions */}
          <div className="px-6 py-4 bg-[#0d1117] border-t border-gray-800 flex justify-end gap-3">
            <button className="px-4 py-2 rounded text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
              Print Record
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded text-sm font-semibold text-white bg-gray-800 hover:bg-white/5 transition-colors border border-gray-700 transition-colors"
            >
              Close Panel
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
