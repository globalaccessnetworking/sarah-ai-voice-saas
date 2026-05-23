import { useState, useEffect } from 'react';
import { 
  LiveKitRoom, 
  RoomAudioRenderer,
} from '@livekit/components-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, User, Bell, Search, Radio, ShieldAlert } from 'lucide-react';
import TranscriptionFeed from '../components/TranscriptionFeed';
import { EngineStats, AnalyticsSummary } from '../components/Metrics';
import DataSyncedPipeline from '../components/DataSyncedPipeline';
import ClassificationEngine from '../components/ClassificationEngine';
import CostBreakdown from '../components/CostBreakdown';
import SyncTable from '../components/SyncTable';
import ActiveCallsList, { type ActiveRoom } from '../components/ActiveCallsList';

const Header = () => (
  <header className="h-16 border-b border-white/5 bg-black/20 flex items-center justify-between px-6 shrink-0">
    <div className="flex items-center gap-8">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-accent-orange rounded-lg flex items-center justify-center font-bold">SP</div>
        <div className="text-left">
          <h1 className="text-sm font-bold leading-none">Suthra Punjab · AI Dash</h1>
          <p className="text-[10px] text-gray-500 mt-0.5">Live Monitoring Active</p>
        </div>
      </div>
    </div>

    <div className="flex items-center gap-4">
      <div className="hidden lg:flex items-center bg-white/5 border border-white/10 rounded-full px-4 py-1.5 focus-within:border-accent-orange/50 transition-colors">
        <Search size={14} className="text-gray-500" />
        <input type="text" placeholder="Search calls..." className="bg-transparent border-none focus:ring-0 text-xs w-48 ml-2" />
      </div>
      <div className="flex items-center gap-2 pr-4 border-r border-white/10">
        <button className="p-2 text-gray-400 hover:bg-white/5 rounded-lg transition-colors relative">
          <Bell size={18} />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-accent-orange rounded-full border border-background" />
        </button>
        <button className="p-2 text-gray-400 hover:bg-white/5 rounded-lg transition-colors">
          <Settings size={18} />
        </button>
      </div>
      <div className="flex items-center gap-3 ml-2">
        <div className="text-right">
          <p className="text-xs font-bold leading-none">CEO Office</p>
          <p className="text-[10px] text-gray-500 mt-1 uppercase font-bold tracking-tighter">Executive Dashboard</p>
        </div>
        <div className="w-9 h-9 bg-accent-orange/20 border border-accent-orange/50 rounded-full flex items-center justify-center text-accent-orange">
          <User size={18} />
        </div>
      </div>
    </div>
  </header>
);

const DashboardContent = ({ call }: { call: ActiveRoom }) => {
  return (
    <div className="flex-1 flex flex-col min-w-0 h-full">
      <Header />
      
      {/* 🔥 FIX 1: Let Flexbox handle height mathematically, preventing the layout blowout */}
      <main className="flex-1 grid grid-cols-[45%_55%] bg-background min-h-0 overflow-hidden">
        {/* Left Column - Transcription */}
        <section className="relative flex flex-col min-h-0 border-r border-white/5 h-full overflow-hidden">
          <TranscriptionFeed call={call} />
        </section>

        {/* Right Column - Analytics & Records */}
        {/* 🔥 FIX 2: Added custom scrollbar styling directly to the right panel */}
        <section className="relative flex flex-col overflow-y-auto p-6 space-y-6 bg-[#0b0f19] h-full pb-24 min-h-0 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
          <EngineStats />
          <AnalyticsSummary metadata={call.metadata} />
          <DataSyncedPipeline />
          <SyncTable />
          <div className="grid grid-cols-2 gap-6 pb-20">
            <ClassificationEngine metadata={call.metadata} />
            <CostBreakdown />
          </div>

          <div className="fixed bottom-6 right-8 pointer-events-none">
            <motion.div 
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="px-3 py-1 bg-accent-emerald/10 border border-accent-emerald/30 rounded-full flex items-center gap-2"
            >
              <div className="w-1.5 h-1.5 bg-accent-emerald rounded-full" />
              <span className="text-[10px] text-accent-emerald font-bold tracking-widest uppercase">Real-Time Sync: 145ms</span>
            </motion.div>
          </div>
        </section>
      </main>
      
      <RoomAudioRenderer />
    </div>
  );
};

const Dashboard = () => {
  const [selectedCall, setSelectedCall] = useState<ActiveRoom | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // --- STABILIZATION V2: Aggressive Detection ---
  const rawUrl = import.meta.env.VITE_LIVEKIT_URL;
  const serverUrl = (!rawUrl || rawUrl.includes('localhost')) 
    ? `http://${window.location.hostname}:7880` 
    : rawUrl;

  useEffect(() => {
    console.log(`[STABILIZATION] Final LiveKit URL: ${serverUrl}`);
  }, [serverUrl]);
  // ----------------------------------------------

  useEffect(() => {
    if (!selectedCall) {
      setToken(null);
      return;
    }

    const fetchToken = async () => {
      try {
        // Safe encoding for "+" symbols in phone numbers
        const resp = await fetch(`/api/executive/token?room=${encodeURIComponent(selectedCall.roomName)}`);
        const data = await resp.json();
        setToken(data.token);
      } catch (err) {
        console.error('Failed to fetch monitor token:', err);
      }
    };

    fetchToken();
  }, [selectedCall]);

  const renderContent = () => {
    if (!selectedCall) {
      return (
        <motion.div 
          key="empty"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex-1 flex flex-col items-center justify-center bg-radial-at-c from-[#111827] to-[#0b0f19]"
        >
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-accent-orange/20 to-accent-emerald/20 rounded-full blur-2xl opacity-50 group-hover:opacity-100 transition duration-1000"></div>
            <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-black/40 border border-white/5 shadow-2xl backdrop-blur-3xl">
              <Radio size={32} className="text-gray-600 animate-pulse" />
            </div>
          </div>
          <h2 className="mt-8 text-xl font-black text-white uppercase tracking-[0.4em]">Ready for Live Stream</h2>
          <p className="mt-2 text-gray-500 font-bold uppercase tracking-widest text-xs">Select a live channel from the registry to begin monitoring</p>
          
          <div className="mt-12 flex items-center gap-4 px-4 py-2 rounded-full border border-white/5 bg-white/[0.02]">
            <div className="flex items-center gap-2">
              <ShieldAlert size={14} className="text-accent-emerald" />
              <span className="text-[10px] font-black text-accent-emerald uppercase tracking-widest">Secure Dashboard Protocol</span>
            </div>
            <div className="w-px h-3 bg-white/10" />
            <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">CEO PRIVACY MODE ACTIVE</span>
          </div>
        </motion.div>
      );
    }

    if (!token) {
      return (
        <motion.div 
          key="loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 flex items-center justify-center bg-[#0b0f19]"
        >
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-2 border-accent-emerald/20 border-t-accent-emerald rounded-full animate-spin" />
            <p className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Authorizing Stealth Connection...</p>
          </div>
        </motion.div>
      );
    }

    return (
      <motion.div 
        key="room"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex-1 flex flex-col min-w-0 h-full overflow-hidden"
      >
        {/* 🔥 FIX 3: Added flex structure to LiveKitRoom to contain its infinite growth */}
        <LiveKitRoom
          token={token}
          serverUrl={serverUrl}
          connect={true}
          audio={false}
          video={false}
          className="flex-1 flex flex-col h-full min-h-0"
        >
          <DashboardContent call={selectedCall} />
        </LiveKitRoom>
      </motion.div>
    );
  };

  return (
    <div className="flex h-screen bg-[#0b0f19] overflow-hidden">
      <ActiveCallsList 
        onSelectRoom={setSelectedCall} 
        selectedRoomId={selectedCall?.id || null} 
      />

      <AnimatePresence mode="wait">
        {renderContent()}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;