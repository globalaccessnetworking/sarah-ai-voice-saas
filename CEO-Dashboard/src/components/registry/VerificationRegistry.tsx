import { useState } from 'react';
import { motion } from 'framer-motion';
import KpiCard from '../shared/KpiCard';
import VerificationDetailPanel from './VerificationDetailPanel';
import { Check, X, Clock, ShieldCheck } from 'lucide-react';

const initialData = [
  {
    id: '#VR-1092',
    refTicket: 'SP-8821',
    timestamp: '23 Oct 2026, 09:12 AM',
    citizenName: 'Ahmad M.',
    phone: '0300-1234567',
    status: 'Confirmed',
    address: 'House 12, Street 4, Gulberg III',
    snippet: '"Yes, the waste bin was cleared this morning. Thank you." - AI Verified',
    confidenceScore: 96,
    transcript: [
      { speaker: 'AI' as const, text: 'Hello Ahmad. We are calling from Suthra Punjab. Our field team reported that your garbage issue at House 12 has been resolved. Can you confirm?' },
      { speaker: 'Citizen' as const, text: 'Yes, I saw the truck this morning. They cleared everything.' },
      { speaker: 'AI' as const, text: 'Thank you for verifying. Have a wonderful day!' }
    ]
  },
  {
    id: '#VR-1093',
    refTicket: 'SP-8830',
    timestamp: '23 Oct 2026, 09:45 AM',
    citizenName: 'Rehman G.',
    phone: '0301-5551122',
    status: 'Denied',
    address: 'Sector 5, DHA Phase 1',
    snippet: '"No, the debris is still blocking the road." - Verification Failed',
    confidenceScore: 82,
    transcript: [
      { speaker: 'AI' as const, text: 'Hello Rehman. Records show the debris blocking Sector 5 was removed. Is this correct?' },
      { speaker: 'Citizen' as const, text: 'No, absolutely not. The debris is exactly where it was yesterday.' },
      { speaker: 'AI' as const, text: 'I apologize for the inaccuracy. I am re-opening ticket SP-8830 and escalating this to the regional supervisor immediately.' }
    ]
  },
  {
    id: '#VR-1094',
    refTicket: 'SP-8835',
    timestamp: '23 Oct 2026, 10:30 AM',
    citizenName: 'Hassan A.',
    phone: '0321-4449988',
    status: 'Unreachable',
    address: 'Ferozepur Road',
    snippet: 'Call went to voicemail. Pending retry callback scheduled.',
    confidenceScore: 0,
    transcript: [
      { speaker: 'AI' as const, text: 'Initiating standard verification call...' },
      { speaker: 'AI' as const, text: 'No answer received. Voicemail detected. Terminating and queuing 2-hour retry block.' }
    ]
  },
  {
    id: '#VR-1095',
    refTicket: 'SP-8841',
    timestamp: '23 Oct 2026, 11:15 AM',
    citizenName: 'Fatima S.',
    phone: '0345-7773322',
    status: 'Confirmed',
    address: 'Model Town, Block C',
    snippet: '"Yes, the supervisor contacted me and the worker was reprimanded."',
    confidenceScore: 99,
    transcript: [
      { speaker: 'AI' as const, text: 'Good morning Fatima. I am verifying ticket SP-8841 regarding unauthorized tips. Did a supervisor contact you?' },
      { speaker: 'Citizen' as const, text: 'Yes they did. The issue is resolved and the worker apologized.' },
      { speaker: 'AI' as const, text: 'Excellent. Closing verification loop.' }
    ]
  },
  {
    id: '#VR-1096',
    refTicket: 'SP-8850',
    timestamp: '23 Oct 2026, 01:20 PM',
    citizenName: 'Tariq M.',
    phone: '0311-2228833',
    status: 'Confirmed',
    address: 'Main Boulevard, Allama Iqbal Town',
    snippet: '"The manhole cover is replaced, totally fixed."',
    confidenceScore: 92,
    transcript: [
      { speaker: 'Citizen' as const, text: 'Hello?' },
      { speaker: 'AI' as const, text: 'Hello Tariq, was the open manhole issue resolved at the Main Boulevard?' },
      { speaker: 'Citizen' as const, text: 'Yes, the new cover was installed perfectly.' }
    ]
  }
];

export default function VerificationRegistry() {
  const [verifications, setVerifications] = useState(initialData);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  const updateStatus = (id: string, newStatus: string) => {
    setVerifications(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
  };

  const statusColors: Record<string, string> = {
    'Confirmed': 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    'Unreachable': 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
    'Denied': 'bg-red-500/20 text-red-400 border border-red-500/30',
  };

  return (
    <div className="space-y-6 relative">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Verification Registry</h1>
            <p className="text-sm" style={{ color: '#9ca3af' }}>Post-resolution citizen follow-ups and evidence audits</p>
          </div>
        </div>
      </div>

      {/* KPI Ribbon */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Total Verifications" value="8,902" valueColor="#3b82f6" />
        <KpiCard label="Confirmed Resolved" value="7,411" valueColor="#10b981" />
        <KpiCard label="Citizen Denied" value="384" valueColor="#ef4444" />
        <KpiCard label="Pending Contact" value="1,107" valueColor="#eab308" />
      </div>

      {/* Main Table Container */}
      <div className="rounded-lg overflow-hidden bg-[#111827] border border-gray-800 rounded-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="text-xs uppercase bg-[#0d1117] text-gray-400 border-b border-gray-800">
              <tr>
                <th className="px-4 py-3 font-semibold">ID & Time</th>
                <th className="px-4 py-3 font-semibold">Ref Ticket #</th>
                <th className="px-4 py-3 font-semibold">Citizen Contact</th>
                <th className="px-4 py-3 font-semibold">Verification Status</th>
                <th className="px-4 py-3 font-semibold">AI Call Snippet</th>
                <th className="px-4 py-3 font-semibold text-center">Quick Actions</th>
              </tr>
            </thead>
            <tbody>
              {verifications.map((item, i) => (
                <motion.tr 
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.2 }}
                  className="border-b border-gray-800 hover:bg-white/5 transition-colors cursor-pointer"
                  onClick={() => setSelectedRecord(item)}
                >
                  <td className="px-4 py-4 whitespace-nowrap">
                    <p className="font-semibold text-white">{item.id}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{item.timestamp}</p>
                  </td>
                  
                  <td className="px-4 py-4">
                    <span className="text-[11px] bg-slate-800 text-slate-300 px-2 py-1 rounded font-mono border border-slate-700">
                      {item.refTicket}
                    </span>
                  </td>

                  <td className="px-4 py-4">
                    <p className="font-semibold text-gray-200">{item.citizenName}</p>
                    <p className="text-xs text-gray-500 mt-0.5 font-medium">{item.phone}</p>
                  </td>

                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[item.status]}`}>
                      {item.status}
                    </span>
                  </td>

                  <td className="px-4 py-4">
                    <p className="text-sm text-gray-300 max-w-[280px] truncate" title={item.snippet}>
                      {item.snippet}
                    </p>
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); updateStatus(item.id, 'Confirmed'); }}
                        className="p-1.5 rounded-md text-gray-400 hover:text-emerald-500 hover:bg-emerald-500/10 transition-colors"
                        title="Mark Verified"
                      >
                        <Check size={16} strokeWidth={2} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); updateStatus(item.id, 'Denied'); }}
                        className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                        title="Re-open Ticket"
                      >
                        <X size={16} strokeWidth={2} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); updateStatus(item.id, 'Unreachable'); }}
                        className="p-1.5 rounded-md text-gray-400 hover:text-yellow-500 hover:bg-yellow-500/10 transition-colors"
                        title="Queue Callback"
                      >
                        <Clock size={16} strokeWidth={2} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* --- Pagination Footer --- */}
        <div className="px-6 py-4 border-t border-gray-800 bg-[#0d1117] flex items-center justify-between">
          <p className="text-sm text-gray-500">Showing 1 to 5 of 8,902 entries</p>
          <div className="flex items-center gap-1">
            <button className="px-3 py-1.5 rounded text-sm text-gray-400 border border-gray-800 hover:bg-white/5 transition-colors">Previous</button>
            <button className="px-3 py-1.5 rounded text-sm bg-gray-800 text-white border border-gray-800">1</button>
            <button className="px-3 py-1.5 rounded text-sm text-gray-400 border border-gray-800 hover:bg-white/5 transition-colors">2</button>
            <button className="px-3 py-1.5 rounded text-sm text-gray-400 border border-gray-800 hover:bg-white/5 transition-colors">3</button>
            <span className="px-2 text-gray-500">...</span>
            <button className="px-3 py-1.5 rounded text-sm text-gray-400 border border-gray-800 hover:bg-white/5 transition-colors">1,780</button>
            <button className="px-3 py-1.5 rounded text-sm text-gray-400 border border-gray-800 hover:bg-white/5 transition-colors">Next</button>
          </div>
        </div>
      </div>

      {/* Slide-over Panel */}
      <VerificationDetailPanel 
        isOpen={selectedRecord !== null}
        onClose={() => setSelectedRecord(null)}
        record={selectedRecord}
      />

    </div>
  );
}
