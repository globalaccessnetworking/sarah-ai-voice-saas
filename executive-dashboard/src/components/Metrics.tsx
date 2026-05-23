import { Mic, Cpu, Radio, Languages, Smile, HelpCircle, LayoutGrid } from 'lucide-react';
import { motion } from 'framer-motion';

export const EngineStats = () => {
  const engines = [
    { name: "Deepgram", version: "v3", type: "STT Engine", icon: Mic },
    { name: "OpenAI", version: "GPT-4o", type: "LLM", icon: Cpu },
    { name: "UpliftAI", version: "v2.1", type: "TTS Engine", icon: Radio },
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {engines.map((eng, idx) => (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
          key={eng.name} 
          className="card-container p-4 flex items-center gap-4 group hover:border-accent-emerald/30 transition-colors"
        >
          <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-accent-emerald group-hover:scale-110 transition-transform">
            <eng.icon size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-sm tracking-tight">{eng.name}</h4>
              <span className="text-[10px] bg-white/10 px-1.5 rounded font-mono text-gray-400">{eng.version}</span>
            </div>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{eng.type}</p>
          </div>
          <div className="ml-auto w-1.5 h-1.5 bg-accent-emerald rounded-full" />
        </motion.div>
      ))}
    </div>
  );
};

export const AnalyticsSummary = ({ metadata }: { metadata?: any }) => {
  const metrics = [
    { 
      label: "Language", 
      value: metadata?.language || "Urdu", 
      sub: metadata?.language ? "Detected" : "Auto-detecting...", 
      icon: Languages 
    },
    { 
      label: "Sentiment", 
      value: metadata?.sentiment || "Analyzing...", 
      sub: metadata?.sentiment ? "Real-time" : "Processing feed...", 
      icon: Smile 
    },
    { 
      label: "Intent", 
      value: metadata?.intent || "Determining...", 
      sub: metadata?.intent_confidence ? `Confidence: ${metadata.intent_confidence}%` : "Calculating...", 
      icon: HelpCircle 
    },
    { 
      label: "Category", 
      value: metadata?.category || "Classifying...", 
      sub: metadata?.category ? "AI Assigned" : "Segmenting...", 
      icon: LayoutGrid 
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-4">
      {metrics.map((m, idx) => (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 + idx * 0.1 }}
          key={m.label} 
          className="card-container p-4 space-y-3"
        >
          <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{m.label}</div>
          <div className="space-y-0.5">
            <p className="text-lg font-bold font-outfit text-white/90">{m.value}</p>
            <p className="text-[10px] text-gray-500 font-medium">{m.sub}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
};
