import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import KpiCard from '../shared/KpiCard';
import RegistryDetailPanel from './RegistryDetailPanel';
import { MapPin, Image as ImageIcon, PlayCircle, Check, X, Clock, RotateCcw, Plus } from 'lucide-react';

// Highly realistic mock data
const initialData = [
  {
    id: '#SP-8821',
    asteriskId: 'AST-10042',
    timestamp: '22 Oct 2026, 10:45 AM',
    customerName: 'Ahmad M.',
    phone: '0300-1234567',
    address: 'House 12, Street 4, Gulberg III',
    landmark: 'MDA Office',
    lat: '31.5204',
    lng: '74.3587',
    hasImage: true,
    hasVoice: true,
    snippet: 'Citizen reporting overflowing bin at main gate for 3 days...',
    sentiment: 'Frustrated',
    status: 'Pending',
  },
  {
    id: '#SP-8822',
    asteriskId: 'AST-10045',
    timestamp: '22 Oct 2026, 11:02 AM',
    customerName: 'Zainab F.',
    phone: '0333-9876543',
    address: 'Block E, Johar Town Area',
    landmark: 'Emporium Mall Backside',
    lat: '31.4697',
    lng: '74.2728',
    hasImage: false,
    hasVoice: true,
    snippet: 'Missed solid waste collection vehicle schedule this morning.',
    sentiment: 'Neutral',
    status: 'Resolved',
  },
  {
    id: '#SP-8830',
    asteriskId: 'AST-10051',
    timestamp: '22 Oct 2026, 01:15 PM',
    customerName: 'Rehman G.',
    phone: '0301-5551122',
    address: 'Sector 5, DHA Phase 1',
    landmark: 'National Hospital',
    lat: '31.4752',
    lng: '74.3805',
    hasImage: true,
    hasVoice: true,
    snippet: 'Heavy debris blocking the service lane adjacent to park.',
    sentiment: 'Angry',
    status: 'Unresolved',
  },
  {
    id: '#SP-8835',
    asteriskId: 'AST-10066',
    timestamp: '22 Oct 2026, 02:30 PM',
    customerName: 'Hassan A.',
    phone: '0321-4449988',
    address: 'Ferozepur Road (Near Metro Station)',
    landmark: 'Qaddafi Stadium',
    lat: '31.4981',
    lng: '74.3216',
    hasImage: true,
    hasVoice: false,
    snippet: 'Illegal dumping identified at the back of commercial plaza.',
    sentiment: 'Frustrated',
    status: 'Pending',
  },
  {
    id: '#SP-8841',
    asteriskId: 'AST-10078',
    timestamp: '22 Oct 2026, 04:10 PM',
    customerName: 'Fatima S.',
    phone: '0345-7773322',
    address: 'Model Town, Block C',
    landmark: 'Model Town Park Gate 2',
    lat: '31.4883',
    lng: '74.3255',
    hasImage: false,
    hasVoice: true,
    snippet: 'Sanitary worker demanded unauthorized tip for regular collection.',
    sentiment: 'Angry',
    status: 'Resolved',
  },
  {
    id: '#SP-8850',
    asteriskId: 'AST-10088',
    timestamp: '22 Oct 2026, 05:45 PM',
    customerName: 'Tariq M.',
    phone: '0311-2228833',
    address: 'Main Boulevard, Allama Iqbal Town',
    landmark: 'Moon Market',
    lat: '31.5102',
    lng: '74.2881',
    hasImage: true,
    hasVoice: true,
    snippet: 'Open manhole posing severe hazard to pedestrians and traffic.',
    sentiment: 'Urgent',
    status: 'Pending',
  }
];

export default function ComplaintRegistry() {
  const [complaints, setComplaints] = useState(initialData);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [showManualModal, setShowManualModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const updateStatus = (id: string, newStatus: string) => {
    setComplaints(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
  };

  const statusColors: Record<string, string> = {
    'Resolved': 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    'Pending': 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
    'Unresolved': 'bg-red-500/20 text-red-400 border border-red-500/30',
  };

  return (
    <div className="space-y-6 relative">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Complaint Registry</h1>
          <p className="text-sm" style={{ color: '#9ca3af' }}>Master log and manual status overrides</p>
        </div>
        
        <button 
          onClick={() => setShowManualModal(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors font-medium text-sm border border-emerald-500"
        >
          <Plus size={16}/> Log Manual Complaint
        </button>
      </div>

      {/* KPI Ribbon */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Total Logged" value="14,204" valueColor="#3b82f6" />
        <KpiCard label="Action Required" value="1,842" valueColor="#ef4444" />
        <KpiCard label="Pending Verification" value="655" valueColor="#eab308" />
        <KpiCard label="Manually Overridden" value="230" valueColor="#a855f7" />
      </div>

      {/* Main Table Container */}
      <div className="rounded-lg overflow-hidden bg-[#111827] border border-gray-800 rounded-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="text-xs uppercase bg-[#0d1117] text-gray-400 border-b border-gray-800">
              <tr>
                <th className="px-4 py-3 font-semibold">Ticket & Time</th>
                <th className="px-4 py-3 font-semibold">Citizen Info</th>
                <th className="px-4 py-3 font-semibold">Location</th>
                <th className="px-4 py-3 font-semibold">AI Analysis</th>
                <th className="px-4 py-3 font-semibold text-center">Status</th>
                <th className="px-4 py-3 font-semibold text-center">Quick Actions</th>
              </tr>
            </thead>
            <tbody>
              {complaints.map((item, i) => (
                <motion.tr 
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.2 }}
                  className="border-b border-gray-800 hover:bg-white/5 transition-colors cursor-pointer"
                  onClick={() => setSelectedRecord(item)}
                >
                  <td className="px-4 py-4 whitespace-nowrap">
                    <p className="font-semibold text-white flex items-center gap-2">
                      {item.id}
                      <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono border border-slate-700">{item.asteriskId}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{item.timestamp}</p>
                  </td>
                  
                  <td className="px-4 py-4">
                    <p className="font-semibold text-gray-200">{item.customerName}</p>
                    <p className="text-xs text-gray-400 mt-0.5 font-medium">{item.phone}</p>
                  </td>

                  <td className="px-4 py-4">
                    <p className="font-medium text-gray-300 max-w-[160px] truncate">{item.address}</p>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">Near {item.landmark}</p>
                    <div className="flex items-center gap-1 text-[11px] text-teal-500/80 mt-1 font-mono">
                      <MapPin size={12} className="text-teal-500" />
                      <span>{item.lat}, {item.lng}</span>
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex items-center mb-1">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider font-bold ${
                        item.sentiment === 'Angry' || item.sentiment === 'Frustrated' || item.sentiment === 'Urgent' 
                          ? 'bg-red-500/10 text-red-500 border border-red-500/20' 
                          : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                        }`}>
                        {item.sentiment}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300 max-w-[220px] truncate" title={item.snippet}>
                      {item.snippet}
                    </p>
                  </td>

                  <td className="px-4 py-4 text-center">
                    <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[item.status]}`}>
                      {item.status}
                    </span>
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); updateStatus(item.id, 'Resolved'); }}
                        className="p-1.5 rounded-md text-gray-400 hover:text-emerald-500 hover:bg-emerald-500/10 transition-colors"
                        title="Mark Resolved"
                      >
                        <Check size={16} strokeWidth={2} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); updateStatus(item.id, 'Unresolved'); }}
                        className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                        title="Mark Unresolved"
                      >
                        <X size={16} strokeWidth={2} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); updateStatus(item.id, 'Pending'); }}
                        className="p-1.5 rounded-md text-gray-400 hover:text-yellow-500 hover:bg-yellow-500/10 transition-colors"
                        title="Set Pending"
                      >
                        <Clock size={16} strokeWidth={2} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); updateStatus(item.id, 'Pending'); }}
                        className="p-1.5 rounded-md text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 transition-colors"
                        title="Reset"
                      >
                        <RotateCcw size={16} strokeWidth={2} />
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
          <p className="text-sm text-gray-500">Showing 1 to 6 of 245 entries</p>
          <div className="flex items-center gap-1">
            <button className="px-3 py-1.5 rounded text-sm text-gray-400 border border-gray-800 hover:bg-white/5 transition-colors">Previous</button>
            <button className="px-3 py-1.5 rounded text-sm bg-gray-800 text-white border border-gray-800">1</button>
            <button className="px-3 py-1.5 rounded text-sm text-gray-400 border border-gray-800 hover:bg-white/5 transition-colors">2</button>
            <button className="px-3 py-1.5 rounded text-sm text-gray-400 border border-gray-800 hover:bg-white/5 transition-colors">3</button>
            <span className="px-2 text-gray-500">...</span>
            <button className="px-3 py-1.5 rounded text-sm text-gray-400 border border-gray-800 hover:bg-white/5 transition-colors">41</button>
            <button className="px-3 py-1.5 rounded text-sm text-gray-400 border border-gray-800 hover:bg-white/5 transition-colors">Next</button>
          </div>
        </div>
      </div>

      {/* Slide-over Panel connecting strictly to RegistryDetailPanel */}
      <RegistryDetailPanel 
        isOpen={selectedRecord !== null}
        onClose={() => setSelectedRecord(null)}
        record={selectedRecord}
      />

      {/* Manual Entry Modal */}
      <AnimatePresence>
        {showManualModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowManualModal(false)}
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg bg-[#111827] border border-gray-800 p-6 rounded-xl shadow-2xl"
            >
              <h2 className="text-xl font-bold text-white mb-1">Manual Complaint Entry</h2>
              <p className="text-sm text-gray-400 mb-6">Log an issue directly into the master registry</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Phone Number</label>
                  <input 
                    type="text" 
                    placeholder="0300-XXXXXXX"
                    className="w-full bg-[#0b0f19] border border-gray-700 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Area / Address</label>
                  <input 
                    type="text" 
                    placeholder="Enter complete geolocation details"
                    className="w-full bg-[#0b0f19] border border-gray-700 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Issue Category</label>
                  <select className="w-full bg-[#0b0f19] border border-gray-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all appearance-none cursor-pointer">
                    <option>Solid Waste (Missed Collection)</option>
                    <option>Dead Animal Removal</option>
                    <option>Open Manhole</option>
                    <option>Illegal Flushing / Sweeping</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Assign Priority</label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="priority" className="text-emerald-500 bg-[#0b0f19] border-gray-700 focus:ring-emerald-500" />
                      <span className="text-sm text-gray-300">P3 (Normal)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="priority" className="text-emerald-500 bg-[#0b0f19] border-gray-700 focus:ring-emerald-500" />
                      <span className="text-sm text-gray-300">P2 (High)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="priority" className="text-emerald-500 bg-[#0b0f19] border-gray-700 focus:ring-emerald-500" />
                      <span className="text-sm text-gray-300 text-red-400 font-medium">P1 (Critical)</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Additional Notes</label>
                  <textarea 
                    rows={3}
                    placeholder="Enter explicit administrative notes..."
                    className="w-full bg-[#0b0f19] border border-gray-700 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all resize-none"
                  ></textarea>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-800">
                <button 
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white bg-transparent border border-gray-700 hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => setShowManualModal(false)}
                  className="px-6 py-2 rounded-lg text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 transition-colors"
                >
                  Submit Complaint
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
