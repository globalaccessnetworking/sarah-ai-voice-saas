import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Users, ChevronRight, Activity, ShieldAlert } from 'lucide-react';
import { cn } from '../lib/utils';

export interface ActiveRoom {
  id: string;
  roomName: string;
  participantCount: number;
  callerName: string;
  callerPhone: string;
  startedAt: string;
  metadata?: any;
}

interface ActiveCallsListProps {
  onSelectRoom: (room: ActiveRoom) => void;
  selectedRoomId: string | null;
}

const ActiveCallsList = ({ onSelectRoom, selectedRoomId }: ActiveCallsListProps) => {
  const [rooms, setRooms] = useState<ActiveRoom[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRooms = async () => {
    try {
      const resp = await fetch('/api/executive/active-rooms');
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      setRooms(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch rooms:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(fetchRooms, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col h-full bg-[#0b0f19] border-r border-white/5 w-64 shrink-0">
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center justify-between w-full mb-2">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-white">
            Live Channels
          </h2>
          {error ? (
            <span className="text-[10px] bg-red-500/10 text-red-500 px-2 py-0.5 rounded font-bold flex items-center gap-1">
              <ShieldAlert size={10} />
              OFFLINE
            </span>
          ) : (
            <span className="text-[10px] bg-red-500/20 text-red-500 px-2 py-0.5 rounded font-bold">
              {rooms.length} Active
            </span>
          )}
        </div>
        <p className="text-[10px] text-gray-500 font-medium">Select a channel to monitor real-time</p>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
        <AnimatePresence mode="popLayout">
          {loading && (rooms?.length === 0) ? (
            <div className="p-10 text-center">
              <Activity className="mx-auto text-gray-700 animate-spin mb-2" size={20} />
              <p className="text-[10px] text-gray-600 uppercase tracking-widest">Scanning Networks...</p>
            </div>
          ) : rooms.length === 0 ? (
            <div className="p-10 text-center border border-dashed border-white/5 rounded-xl m-4">
              <Phone className="mx-auto text-gray-800 mb-2" size={20} />
              <p className="text-[10px] text-gray-600 uppercase tracking-widest font-bold">No Active Calls</p>
            </div>
          ) : (
            rooms.map((room) => (
              <motion.button
                key={room.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onClick={() => onSelectRoom(room)}
                className={cn(
                  "w-full text-left p-4 rounded-xl transition-all group relative overflow-hidden",
                  selectedRoomId === room.id
                    ? "bg-accent-emerald/10 border border-accent-emerald/30 shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                    : "bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-white/10"
                )}
              >
                {selectedRoomId === room.id && (
                  <motion.div 
                    layoutId="active-indicator"
                    className="absolute left-0 top-0 bottom-0 w-1 bg-accent-emerald shadow-[0_0_10px_rgba(16,185,129,0.8)]"
                  />
                )}
                
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <span className={cn(
                      "text-xs font-black tracking-wide",
                      selectedRoomId === room.id ? "text-white" : "text-gray-300"
                    )}>
                      {room.callerName}
                    </span>
                    <ChevronRight size={14} className={cn(
                      "transition-transform",
                      selectedRoomId === room.id ? "text-accent-emerald rotate-90" : "text-gray-700 group-hover:text-gray-500"
                    )} />
                  </div>
                  
                  <div className="flex items-center gap-2 text-[10px] font-mono text-gray-500">
                    <Phone size={10} />
                    {room.callerPhone}
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent-emerald animate-pulse" />
                      <span className="text-[10px] font-bold text-accent-emerald/80 uppercase tracking-tighter">
                        Live Monitoring
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-gray-600 font-bold">
                      <Users size={10} />
                      {room.participantCount}
                    </div>
                  </div>
                </div>
              </motion.button>
            ))
          )}
        </AnimatePresence>
      </div>

      <div className="p-4 border-t border-white/5 bg-black/20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent-orange/10 flex items-center justify-center border border-accent-orange/20">
            <Activity size={16} className="text-accent-orange" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-black text-white uppercase tracking-wider">Security Active</p>
            <p className="text-[8px] text-gray-500 font-bold uppercase tracking-tighter">Stealth Subscriber Protocol</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActiveCallsList;
