import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { cn } from '../lib/utils';

interface Complaint {
  id: number;
  ticket_id: string;
  issue: string;
  district: string;
  status: string;
  createdAt: string;
  priority: string;
}

const SyncTable = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const resp = await fetch('/api/executive/complaints');
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      
      // Ensure data is sorted by createdAt or ID to keep latest on top
      const sorted = (Array.isArray(data) ? data : []).sort((a: any, b: any) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      
      setComplaints(sorted);
    } catch (err) {
      console.error('[SYNC TABLE] Failed to poll complaints:', err);
      // Keep existing data on transient error to avoid flickering
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
    const interval = setInterval(fetchComplaints, 10000); // 10s polling
    return () => clearInterval(interval);
  }, []);

  const getStatusStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'resolved': return 'bg-accent-emerald/10 text-accent-emerald border-accent-emerald/20';
      case 'dispatched': return 'bg-accent-orange/10 text-accent-orange border-accent-orange/20';
      case 'pending': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'in progress': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      default: return 'bg-white/5 text-gray-400 border-white/10';
    }
  };

  return (
    <div className="card-container flex flex-col h-auto min-h-[400px]">
      <div className="p-4 border-b border-white/5 bg-black/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Database size={16} className="text-accent-emerald" />
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Suthra Punjab — Live Dashboard</h3>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-500 font-bold uppercase">Total Registry:</span>
            <span className="text-[10px] text-white font-mono">{complaints.length}</span>
          </div>
          <p className="text-[9px] text-gray-600 font-bold uppercase tracking-tighter">Today: {new Date().toLocaleDateString()}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto max-h-[500px] custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-[#0b0f19] z-10 border-b border-white/5">
            <tr className="bg-white/[0.02]">
              <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Complaint ID</th>
              <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Type</th>
              <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Area</th>
              <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-500 text-right px-8">Status</th>
              <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-500 text-right pr-6">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            <AnimatePresence mode="popLayout">
              {loading && complaints.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-4 h-4 border-2 border-accent-emerald/20 border-t-accent-emerald rounded-full animate-spin" />
                      <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Syncing Records...</p>
                    </div>
                  </td>
                </tr>
              ) : complaints.map((complaint) => (
                <motion.tr 
                  key={complaint.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="group hover:bg-white/[0.03] transition-colors"
                >
                  <td className="p-4">
                    <span className="text-[11px] font-mono font-bold text-gray-300 group-hover:text-white transition-colors">
                      {complaint.ticket_id || `SP-REC-${complaint.id}`}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="text-[11px] font-bold text-white/90">{complaint.issue}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-[11px] font-medium text-gray-400">{complaint.district || 'Lahore'}</span>
                  </td>
                  <td className="p-4 text-right px-8">
                    <div className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest",
                      getStatusStyle(complaint.status)
                    )}>
                      {complaint.status === 'Resolved' ? <CheckCircle2 size={10} /> : 
                       ['Pending', 'New'].includes(complaint.status) ? <AlertCircle size={10} /> : <Clock size={10} />}
                      {complaint.status}
                    </div>
                  </td>
                  <td className="p-4 text-right pr-6">
                    <span className="text-[10px] font-mono text-gray-500">{new Date(complaint.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SyncTable;
