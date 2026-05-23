import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import KpiCard from '../../shared/KpiCard';
import OutboundDetailPanel from './OutboundDetailPanel';
import { Play, Pause, Plus, Rocket, BarChart2, FileSpreadsheet, X as XIcon } from 'lucide-react';

const mockCampaigns = [
  {
    id: '#CAM-0042',
    name: 'Feedback Survey - DHA Phase 5',
    status: 'Active',
    records: 5000,
    reached: 3245,
    failed: 125,
    unresolved: 80,
    handleTime: '01:14',
    queue: 'Q_SURVEY_DHA',
    priority: 'P2 (Normal)',
    dateRange: '23 Oct 2026 - 25 Oct 2026',
  },
  {
    id: '#CAM-0043',
    name: 'Complaint Verification Callback',
    status: 'Active',
    records: 2500,
    reached: 1900,
    failed: 300,
    unresolved: 15,
    handleTime: '00:45',
    queue: 'Q_VERIFY_MASTER',
    priority: 'P1 (High)',
    dateRange: 'Continuous Stream',
  },
  {
    id: '#CAM-0044',
    name: 'Noise Pollution Notification',
    status: 'Paused',
    records: 12000,
    reached: 4000,
    failed: 850,
    unresolved: 0,
    handleTime: '00:22',
    queue: 'Q_ALERT_BROADCAST',
    priority: 'P3 (Low)',
    dateRange: '20 Oct 2026 - 30 Oct 2026',
  },
  {
    id: '#CAM-0045',
    name: 'Field Worker Follow-ups',
    status: 'Scheduled',
    records: 800,
    reached: 0,
    failed: 0,
    unresolved: 0,
    handleTime: '00:00',
    queue: 'Q_WORKER_CHECK',
    priority: 'P2 (Normal)',
    dateRange: '24 Oct 2026',
  },
  {
    id: '#CAM-0046',
    name: 'Dengue Awareness Broadcast',
    status: 'Completed',
    records: 45000,
    reached: 42100,
    failed: 2900,
    unresolved: 0,
    handleTime: '00:35',
    queue: 'Q_HEALTH_AWARE',
    priority: 'P1 (Critical)',
    dateRange: '01 Oct 2026 - 15 Oct 2026',
  }
];

export default function OutboundHud() {
  const [campaigns, setCampaigns] = useState(mockCampaigns);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [showNewCampaignModal, setShowNewCampaignModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New Campaign Form State
  const [newCampName, setNewCampName] = useState("");
  const [newCampQueue, setNewCampQueue] = useState("Q_VERIFY_MASTER (General Verification)");
  const [newCampPriority, setNewCampPriority] = useState("P2 (Normal)");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleLaunchCampaign = () => {
    if (!newCampName.trim() || !selectedFile) {
      // Basic validation UI feedback
      return;
    }

    const newCampaign = {
      id: `#CAM-00${Math.floor(Math.random() * 50) + 47}`,
      name: newCampName,
      status: 'Scheduled',
      // Dummy records assumption based on CSV size
      records: Math.floor(Math.random() * 8000) + 500,
      reached: 0,
      failed: 0,
      unresolved: 0,
      handleTime: '00:00',
      queue: newCampQueue.split(' ')[0],
      priority: newCampPriority,
      dateRange: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    };

    setCampaigns(prev => [newCampaign, ...prev]);
    setShowNewCampaignModal(false);
    setSelectedFile(null);
    setNewCampName('');
    setNewCampQueue("Q_VERIFY_MASTER (General Verification)");
    setNewCampPriority("P2 (Normal)");
  };

  const updateStatus = (id: string, newStatus: string) => {
    setCampaigns(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
  };

  const statusColors: Record<string, string> = {
    'Active': 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    'Paused': 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
    'Scheduled': 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
    'Completed': 'bg-gray-500/20 text-gray-400 border border-gray-500/30',
  };

  return (
    <div className="space-y-6 relative">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Rocket size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Outbound HUD</h1>
            <p className="text-sm cursor-text" style={{ color: '#9ca3af' }}>
              Heads-up display for voice notification and verification campaigns.
            </p>
          </div>
        </div>
        
        <button 
          onClick={() => setShowNewCampaignModal(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors font-medium text-sm border border-emerald-500 shadow-lg shadow-emerald-500/20"
        >
          <Plus size={16}/> Start New Campaign
        </button>
      </div>

      {/* KPI Ribbon using exactly <KpiCard /> */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Total Active Campaigns" value="2" valueColor="#10b981" />
        <KpiCard label="Overall Reach Rate" value="84.2%" valueColor="#3b82f6" />
        <KpiCard label="Avg Campaign Duration" value="3.4 Days" valueColor="#a855f7" />
        <KpiCard label="Scheduled Upcoming" value="1" valueColor="#eab308" />
      </div>

      {/* Main Table Container STRICT constraints */}
      <div className="bg-[#111827] border border-gray-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="text-xs uppercase bg-[#0d1117] text-gray-400 border-b border-gray-800">
              <tr>
                <th className="px-4 py-4 font-semibold">Campaign ID & Name</th>
                <th className="px-4 py-4 font-semibold">Status</th>
                <th className="px-4 py-4 font-semibold text-right">Records</th>
                <th className="px-4 py-4 font-semibold text-right">Reached</th>
                <th className="px-6 py-4 font-semibold">Progress Track</th>
                <th className="px-4 py-4 font-semibold text-center">Avg. Handle Time</th>
                <th className="px-4 py-4 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((item, i) => {
                const progress = item.records > 0 ? Math.round((item.reached / item.records) * 100) : 0;
                
                return (
                  <motion.tr 
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.2 }}
                    className="border-b border-gray-800 hover:bg-white/5 transition-colors cursor-pointer"
                    onClick={() => setSelectedRecord(item)}
                  >
                    <td className="px-4 py-4 whitespace-nowrap">
                      <p className="font-semibold text-white flex gap-2 items-center">
                        {item.id}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">{item.name}</p>
                    </td>

                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[item.status]}`}>
                        {item.status}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-right font-mono text-gray-300">
                      {item.records.toLocaleString()}
                    </td>

                    <td className="px-4 py-4 text-right font-mono text-emerald-400">
                      {item.reached.toLocaleString()}
                    </td>

                    <td className="px-6 py-4 w-64">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-[#0b0f19] rounded-full h-2 border border-gray-800 overflow-hidden">
                           <div 
                             className="h-full bg-emerald-500 rounded-full" 
                             style={{ width: `${progress}%` }} 
                           />
                        </div>
                        <span className="text-xs font-mono text-gray-400 w-8">{progress}%</span>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-center font-mono text-gray-400">
                      {item.handleTime}
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {item.status === 'Paused' || item.status === 'Scheduled' ? (
                          <button 
                            onClick={(e) => { e.stopPropagation(); updateStatus(item.id, 'Active'); }}
                            className="p-1.5 rounded-md text-emerald-500 hover:bg-emerald-500/10 transition-colors bg-emerald-500/5 border border-emerald-500/10"
                            title="Play Campaign"
                          >
                            <Play size={16} />
                          </button>
                        ) : item.status === 'Active' ? (
                          <button 
                            onClick={(e) => { e.stopPropagation(); updateStatus(item.id, 'Paused'); }}
                            className="p-1.5 rounded-md text-orange-400 hover:bg-orange-500/10 transition-colors bg-orange-500/5 border border-orange-500/10"
                            title="Pause Campaign"
                          >
                            <Pause size={16} />
                          </button>
                        ) : (
                           <button 
                            onClick={(e) => { e.stopPropagation(); }}
                            className="p-1.5 rounded-md text-gray-500 hover:text-white transition-colors"
                            title="View Metrics"
                          >
                            <BarChart2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* --- Pagination Footer --- */}
        <div className="px-6 py-4 border-t border-gray-800 bg-[#0d1117] flex items-center justify-between">
          <p className="text-sm text-gray-500">Showing 1 to 5 of 12 active campaigns</p>
          <div className="flex items-center gap-1">
            <button className="px-3 py-1.5 rounded text-sm text-gray-400 border border-gray-800 hover:bg-white/5 transition-colors">Previous</button>
            <button className="px-3 py-1.5 rounded text-sm bg-gray-800 text-white border border-gray-800">1</button>
            <button className="px-3 py-1.5 rounded text-sm text-gray-400 border border-gray-800 hover:bg-white/5 transition-colors">2</button>
            <span className="px-2 text-gray-500">...</span>
            <button className="px-3 py-1.5 rounded text-sm text-gray-400 border border-gray-800 hover:bg-white/5 transition-colors">Next</button>
          </div>
        </div>
      </div>

      {/* Slide-over Panel strict architectural copy */}
      <OutboundDetailPanel 
        isOpen={selectedRecord !== null}
        onClose={() => setSelectedRecord(null)}
        record={selectedRecord}
      />

      {/* New Campaign Creation Modal */}
      <AnimatePresence>
        {showNewCampaignModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowNewCampaignModal(false)}
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg bg-[#111827] border border-gray-800 p-6 rounded-xl shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <h2 className="text-xl font-bold text-white mb-1">Launch Outbound Campaign</h2>
              <p className="text-sm text-gray-400 mb-6">Configure mass voice broadcast and triage logic.</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Campaign Name</label>
                  <input 
                    type="text" 
                    value={newCampName}
                    onChange={(e) => setNewCampName(e.target.value)}
                    placeholder="e.g. Complaint Verification Callback"
                    className="w-full bg-[#0b0f19] border border-gray-700 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono"
                  />
                  {!newCampName && showNewCampaignModal && <p className="text-xs text-red-400 mt-1">* Required</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Target Audience List (CSV Upload)</label>
                  
                  {/* Hidden Input */}
                  <input 
                    type="file" 
                    accept=".csv, .xlsx" 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={handleFileChange} 
                  />

                  {!selectedFile ? (
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full border-2 border-dashed border-gray-700 hover:border-emerald-500/50 bg-[#0b0f19] rounded-lg p-6 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer group"
                    >
                      <Rocket className="text-gray-500 group-hover:text-emerald-500 transition-colors" size={24} />
                      <p className="text-sm text-gray-400">Drag & drop your CSV contacts or <span className="text-emerald-500 font-medium">browse</span></p>
                    </div>
                  ) : (
                    <div className="w-full border border-emerald-500/30 bg-emerald-500/5 rounded-lg p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded bg-emerald-500/10 text-emerald-400">
                          <FileSpreadsheet size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-emerald-400">{selectedFile.name}</p>
                          <p className="text-xs text-gray-500">Ready for processing</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                           setSelectedFile(null);
                           if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                        className="p-1.5 rounded-md text-gray-400 hover:text-red-400 hover:bg-white/5 transition-colors"
                      >
                        <XIcon size={16} />
                      </button>
                    </div>
                  )}
                  {!selectedFile && showNewCampaignModal && <p className="text-xs text-red-400 mt-1">* CSV File Required</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Routing Queue Configuration</label>
                  <select 
                    value={newCampQueue}
                    onChange={(e) => setNewCampQueue(e.target.value)}
                    className="w-full bg-[#0b0f19] border border-gray-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all appearance-none cursor-pointer"
                  >
                    <option>Q_VERIFY_MASTER (General Verification)</option>
                    <option>Q_SURVEY_DHA (Feedback Collection)</option>
                    <option>Q_ALERT_BROADCAST (Emergency Push)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Network Trunk Priority</label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="priority" checked={newCampPriority === 'P3 (Low)'} onChange={() => setNewCampPriority('P3 (Low)')} className="text-emerald-500 bg-[#0b0f19] border-gray-700 focus:ring-emerald-500" />
                      <span className="text-sm text-gray-300">P3 (Low)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="priority" checked={newCampPriority === 'P2 (Normal)'} onChange={() => setNewCampPriority('P2 (Normal)')} className="text-emerald-500 bg-[#0b0f19] border-gray-700 focus:ring-emerald-500" />
                      <span className="text-sm text-gray-300">P2 (Normal)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="priority" checked={newCampPriority === 'P1 (Critical)'} onChange={() => setNewCampPriority('P1 (Critical)')} className="text-emerald-500 bg-[#0b0f19] border-gray-700 focus:ring-emerald-500" />
                      <span className="text-sm text-gray-300 text-red-400 font-medium">P1 (Critical)</span>
                    </label>
                  </div>
                </div>

              </div>

              <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-800">
                <button 
                  onClick={() => {
                    setShowNewCampaignModal(false);
                    setSelectedFile(null); // Reset on close
                  }}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white bg-transparent border border-gray-700 hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleLaunchCampaign}
                  disabled={!newCampName.trim() || !selectedFile}
                  className={`px-6 py-2 rounded-lg text-sm font-medium text-white transition-colors ${
                    !newCampName.trim() || !selectedFile ? 'bg-gray-600 cursor-not-allowed opacity-50' : 'bg-emerald-600 hover:bg-emerald-500'
                  }`}
                >
                  Launch Campaign
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
