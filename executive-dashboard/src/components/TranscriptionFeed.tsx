import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  useTracks,
  useDataChannel,
  type TrackReference,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import { Radio, Bot, User, Volume2, VolumeX, Clock, ChevronDown, MapPin, Phone } from 'lucide-react';
import { cn } from '../lib/utils';
import { type ActiveRoom } from './ActiveCallsList';

interface TranscriptionFeedProps {
  call: ActiveRoom;
}

interface TextStreamData {
  id: string;
  text?: string;
  timestamp?: number;
  participant?: any;
  [key: string]: any;
}

interface FeedItem extends TextStreamData {
  id: string;
  participant?: any;
  text?: string;
  english_translation?: string;
  firstReceivedTime?: number;
  info?: any;
  attributes?: any;
  isAuthoritative?: boolean;
}

const TranscriptionFeed = ({ call }: TranscriptionFeedProps) => {
  const [timer, setTimer] = useState("00:00");
  const [isMuted, setIsMuted] = useState(true);
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const [feed, setFeed] = useState<FeedItem[]>([]);

  // WILDCARD DATA CHANNEL: Catches the complete translated sentences
  useDataChannel("bilingual_sync", (msg: any) => {
    try {
      const dataString = new TextDecoder().decode(msg.payload);
      const parsed = JSON.parse(dataString);
      
      if (parsed.type === "bilingual_sync" || parsed.english_text || parsed.urdu_text) {
        setFeed(prev => {
          const newFeed = [...prev];
          const urduMatch = parsed.urdu_text?.trim().substring(0, 15) || "";
          const index = newFeed.findIndex(item => item.text?.trim().startsWith(urduMatch));
          
          if (index !== -1 && urduMatch !== "") {
            newFeed[index] = { ...newFeed[index], english_translation: parsed.english_text };
          } else {
            newFeed.push({
              id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              participant: { identity: parsed.identity || 'system' },
              text: parsed.urdu_text,
              english_translation: parsed.english_text,
              isAuthoritative: true,
              firstReceivedTime: Date.now()
            });
          }
          return newFeed;
        });
      }
    } catch (err) {
      console.error("🔥 PARSE ERROR:", err);
    }
  });

  const remoteTracks = useTracks([Track.Source.Microphone]);
  useEffect(() => {
    remoteTracks.forEach((track: TrackReference) => {
      if (track.publication && 'setSubscribed' in track.publication) {
        (track.publication as any).setSubscribed(!isMuted);
      }
    });
  }, [isMuted, remoteTracks]);

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      const diff = Math.floor((Date.now() - start) / 1000);
      const m = Math.floor(diff / 60).toString().padStart(2, '0');
      const s = (diff % 60).toString().padStart(2, '0');
      setTimer(`${m}:${s}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [call.id]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    // 50px tolerance prevents the UI from fighting the user's scroll
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    setShowJumpToLatest(!isAtBottom);
  };

  const jumpToLatest = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth' // Changed back to smooth for better UX
      });
    }
  };

  // 🔥 FIX: Auto-scroll trigger updated. 
  // It now watches the whole [feed] array and uses a 50ms timeout.
  // This guarantees it scrolls AFTER the English translation physically expands the bubble height!
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!showJumpToLatest) {
        jumpToLatest();
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [feed]);

  return (
    <div className="relative h-full flex flex-col bg-background/50 border-r border-white/5 min-h-0">
      <div className="bg-[#131A2B] border border-white/5 rounded-2xl p-4 mx-4 mt-4 shrink-0 shadow-lg">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white leading-tight">{call.callerName}</h3>
            <p className="text-[10px] font-mono text-gray-500 tracking-wider flex items-center gap-1.5 grayscale opacity-70">
              <Phone size={10} />
              {call.callerPhone}
            </p>
          </div>
          
          <div className="bg-emerald-500/20 text-emerald-500 text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest flex items-center gap-1.5 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            Connected
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 pb-4 border-b border-white/5">
          <div className="flex items-center gap-2 text-gray-400">
            <div className="p-1.5 bg-white/5 rounded-lg border border-white/5">
              <MapPin size={12} className="text-gray-500" />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-tighter text-gray-600">Origin Point</span>
              <span className="text-[10px] font-bold text-gray-300">Johar Town, Block D, Lahore</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <div className="p-1.5 bg-white/5 rounded-lg border border-white/5">
              <Clock size={12} className="text-accent-emerald" />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-tighter text-gray-600">Active Duration</span>
              <span className="text-[10px] font-bold text-accent-emerald font-mono">{timer}</span>
            </div>
          </div>
        </div>

        {/* Waveform Layer */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-[3px] h-3">
              {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                <motion.div
                  key={i}
                  animate={{ height: ["40%", "100%", "40%"] }}
                  transition={{ duration: 0.6 + i * 0.1, repeat: Infinity, ease: "easeInOut" }}
                  className="w-0.5 bg-accent-orange/60 rounded-full"
                />
              ))}
            </div>
            <span className="text-[9px] font-black text-accent-orange uppercase tracking-[0.2em] opacity-80">Sync Activity Detected</span>
          </div>
          
          <button 
            onClick={() => setIsMuted(!isMuted)}
            className={cn(
              "p-1.5 rounded-lg border transition-all",
              isMuted 
                ? "bg-white/5 border-white/10 text-gray-600" 
                : "bg-accent-orange/20 border-accent-orange/40 text-accent-orange"
            )}
          >
            {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
        </div>
      </div>

      <div className="p-3 border-b border-white/5 flex items-center justify-between bg-black/20 shrink-0">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Real-Time Data Matrix</h3>
        <div className="flex items-center gap-2 px-2 py-0.5 bg-accent-emerald/10 rounded border border-accent-emerald/20">
          <div className="w-1.5 h-1.5 bg-accent-emerald rounded-full animate-pulse" />
          <span className="text-[9px] text-accent-emerald font-black uppercase tracking-widest">Live Sync</span>
        </div>
      </div>

      {/* 🔥 FIX: Removed custom-scrollbar and injected visible Tailwind scrollbars. Added pb-32 for bottom breathing room. */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 pb-32 space-y-8 bg-radial-at-t from-white/[0.02] to-transparent min-h-0 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full"
      >
        <AnimatePresence mode="popLayout">
          {feed.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-20 grayscale">
              <Radio size={48} className="text-gray-500 animate-pulse" />
              <p className="text-[10px] font-black uppercase tracking-[0.3em]">Waiting for transmission...</p>
            </div>
          ) : (
            feed.map((seg, idx) => {
              const participant = seg.participant || seg.info?.participant;
              const identity = (participant?.identity || '').toLowerCase();
              const isAgent = (identity.startsWith('agent') || identity.includes('sarah') || identity.includes('telephony')) && !identity.includes('sip_');
              const speakerType = isAgent ? 'ai' : 'citizen';
              const urduText = seg.text?.trim() || "";
              const englishTranslation = seg.english_translation || seg.attributes?.['lk.translation'] || seg.info?.attributes?.['lk.translation'] || "";
              const timeStr = new Date(seg.firstReceivedTime || idx * 1000 + Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              return (
                <motion.div
                  layout
                  key={seg.id || idx}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className={cn(
                    "flex flex-col space-y-2",
                    speakerType === 'ai' ? "items-start" : "items-end"
                  )}
                >
                  <div className="flex items-center gap-2 px-1">
                      {speakerType === 'ai' ? (
                      <>
                        <Bot size={14} className="text-accent-orange" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Sarah AI</span>
                      </>
                    ) : (
                      <>
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Citizen</span>
                        <User size={14} className="text-accent-emerald" />
                      </>
                    )}
                  </div>

                  <div className={cn(
                    "max-w-[85%] p-4 rounded-2xl relative shadow-lg transition-all",
                    speakerType === 'ai' 
                      ? "bg-[#131A2B] border border-white/5 border-l-2 border-l-accent-orange text-white rounded-tl-sm" 
                      : "bg-[#131A2B] border border-white/5 border-r-2 border-r-accent-emerald text-white rounded-tr-sm"
                  )}>
                    <div className="space-y-4">
                      <p 
                        className={cn(
                          "font-urdu leading-relaxed",
                          speakerType === 'ai' ? "text-2xl text-left" : "text-3xl text-right"
                        )} 
                        dir="rtl"
                      >
                        {urduText}
                      </p>

                      {englishTranslation && (
                        <p className="text-xs text-gray-400 italic border-t border-white/10 pt-3 mt-2 font-medium tracking-wide">
                          {englishTranslation}
                        </p>
                      )}
                    </div>
                    
                    <div className={cn(
                      "absolute -bottom-6 text-[9px] font-black uppercase tracking-widest text-gray-600",
                      speakerType === 'ai' ? "left-1" : "right-1"
                    )}>
                      SYNC_LOG_{timeStr}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {showJumpToLatest && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={jumpToLatest}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-accent-orange text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-2xl flex items-center gap-2 hover:scale-105 transition-transform border border-white/20"
        >
          Jump to Latest
          <ChevronDown size={14} />
        </motion.button>
      )}
    </div>
  );
};

export default TranscriptionFeed;