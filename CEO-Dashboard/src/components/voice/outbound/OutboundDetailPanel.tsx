import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Pause, Edit, Bot, PhoneCall, PhoneForwarded, PhoneMissed } from 'lucide-react';

interface OutboundRecord {
  id: string;
  name: string;
  status: string;
  records: number;
  reached: number;
  failed: number;
  unresolved: number;
  handleTime: string;
  queue: string;
  priority: string;
  dateRange: string;
}

interface OutboundDetailPanelProps {
  isOpen: boolean;
  onClose: () => void;
  record: OutboundRecord | null;
}

export default function OutboundDetailPanel({ isOpen, onClose, record }: OutboundDetailPanelProps) {
  if (!isOpen || !record) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'Paused': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      case 'Scheduled': return 'text-sky-400 bg-sky-500/10 border-sky-500/20';
      case 'Completed': return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    }
  };

  const progressPercent = Math.round((record.reached / record.records) * 100);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Panel Container (Matching Exact Structural Parameters) */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
          className="relative w-full max-w-2xl h-full shadow-2xl flex flex-col"
          style={{ backgroundColor: '#111827', borderLeft: '1px solid #1f2937' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #1f2937', backgroundColor: '#0d1117' }}>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  {record.id}
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono border border-slate-700">{record.name}</span>
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusColor(record.status)}`}>
                  {record.status}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-lg text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition-colors bg-emerald-500/5 border border-emerald-500/10">
                <Play size={18} />
              </button>
              <button className="p-2 rounded-lg text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 transition-colors bg-orange-500/5 border border-orange-500/10">
                <Pause size={18} />
              </button>
              <button className="p-2 rounded-lg text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 transition-colors bg-indigo-500/5 border border-indigo-500/10">
                <Edit size={18} />
              </button>
              <div className="w-px h-6 bg-gray-800 mx-1"></div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            
            {/* Section: Overview Track */}
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <h3 className="text-sm font-semibold text-white">Campaign Progress Tracker</h3>
                <span className="text-2xl font-bold text-emerald-500">{progressPercent}%</span>
              </div>
              <div className="w-full bg-[#0b0f19] rounded-full h-3 border border-gray-800 overflow-hidden flex">
                 <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>

            {/* Section: Progress Statistics block */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-white border-b border-gray-800 pb-2">Progress Statistics</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-[#0b0f19] border border-gray-800 flex flex-col gap-1">
                  <div className="flex justify-between items-center mb-1 text-gray-400">
                     <span className="text-xs">Records List</span>
                  </div>
                  <span className="text-xl font-bold text-white">{record.records.toLocaleString()}</span>
                </div>
                <div className="p-4 rounded-lg bg-[#0b0f19] border border-gray-800 flex flex-col gap-1">
                  <div className="flex justify-between items-center mb-1 text-indigo-400">
                     <span className="text-xs">Total Contacts</span>
                     <PhoneCall size={14} />
                  </div>
                  <span className="text-xl font-bold text-white">{(record.records * 0.9).toLocaleString()}</span>
                </div>
                <div className="p-4 rounded-lg bg-[#0b0f19] border border-gray-800 flex flex-col gap-1">
                  <div className="flex justify-between items-center mb-1 text-emerald-400">
                     <span className="text-xs">Reached / Answered</span>
                     <PhoneForwarded size={14} />
                  </div>
                  <span className="text-xl font-bold text-white">{record.reached.toLocaleString()}</span>
                </div>
                <div className="p-4 rounded-lg bg-[#0b0f19] border border-gray-800 flex flex-col gap-1">
                  <div className="flex justify-between items-center mb-1 text-red-500">
                     <span className="text-xs">Failed / Missed</span>
                     <PhoneMissed size={14} />
                  </div>
                  <span className="text-xl font-bold text-white">{record.failed.toLocaleString()}</span>
                </div>
                <div className="p-4 rounded-lg bg-[#0b0f19] border border-gray-800 flex flex-col gap-1">
                  <div className="flex justify-between items-center mb-1 text-orange-400">
                     <span className="text-xs">Unresolved</span>
                  </div>
                  <span className="text-xl font-bold text-white">{record.unresolved.toLocaleString()}</span>
                </div>
                <div className="p-4 rounded-lg bg-[#0b0f19] border border-gray-800 flex flex-col gap-1">
                  <div className="flex justify-between items-center mb-1 text-sky-400">
                     <span className="text-xs">Avg Match Time</span>
                  </div>
                  <span className="text-xl font-bold text-white">{record.handleTime}</span>
                </div>
              </div>
            </div>

            {/* Section: Participating Agents Array */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-white border-b border-gray-800 pb-2">Participating Agents</h3>
              <div className="flex flex-col gap-3">
                {[1, 2, 3].map((num) => (
                  <div key={num} className="p-3 rounded-lg bg-[#0b0f19] border border-gray-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                        <Bot size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-200">Suthra Bot #{num}</p>
                        <p className="text-xs text-gray-500">Load balanced stream</p>
                      </div>
                    </div>
                    <div className="text-right">
                       <p className="text-sm font-bold text-white">{(record.reached / 3).toFixed(0).toLocaleString()}</p>
                       <p className="text-xs text-emerald-500">Calls Handled</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section: Campaign Details (Parameters) */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-white border-b border-gray-800 pb-2">Campaign Parameters</h3>
              <div className="rounded-lg bg-[#0b0f19] border border-gray-800 p-4">
                <table className="w-full text-sm">
                  <tbody>
                    <tr className="border-b border-gray-800 last:border-0">
                      <td className="py-3 text-gray-500">Routing Queue</td>
                      <td className="py-3 text-right font-mono text-gray-300">{record.queue}</td>
                    </tr>
                    <tr className="border-b border-gray-800 last:border-0">
                      <td className="py-3 text-gray-500">Trunk Priority</td>
                      <td className="py-3 text-right font-mono text-gray-300">{record.priority}</td>
                    </tr>
                    <tr className="border-b border-gray-800 last:border-0">
                      <td className="py-3 text-gray-500">Runtime Config</td>
                      <td className="py-3 text-right font-mono text-gray-300">{record.dateRange}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
