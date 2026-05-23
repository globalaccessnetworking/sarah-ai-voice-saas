import { motion } from 'framer-motion';
import { Cpu, Network, Database, UserPlus, LayoutDashboard, CheckCircle2 } from 'lucide-react';

const DataSyncedPipeline = () => {
  const steps = [
    { name: "AI Call Engine", icon: Cpu },
    { name: "NLP Pipeline", icon: Network },
    { name: "Complaint DB", icon: Database },
    { name: "Assignment Engine", icon: UserPlus },
    { name: "Suthra Dashboard", icon: LayoutDashboard },
  ];

  return (
    <div className="w-full bg-[#111827] border border-emerald-500/20 rounded-xl p-6 space-y-8 shadow-2xl relative">
      <div className="flex items-center gap-2">
        <CheckCircle2 size={16} className="text-emerald-500" />
        <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-500">
          Data Synced to Suthra Dashboard
        </h3>
      </div>

      <div className="relative flex justify-between items-center px-4 py-4 min-h-[120px]">
        {/* Connecting Line Base */}
        <div className="absolute top-1/2 left-10 right-10 h-[2px] bg-white/10 -translate-y-1/2" />
        
        {/* Animated Flow Line */}
        <motion.div 
          animate={{ x: ["0%", "450%"] }}
          transition={{ duration: 3, ease: "linear", repeat: Infinity }}
          className="absolute top-1/2 left-10 w-20 h-[2px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent -translate-y-1/2 z-0"
        />

        {steps.map((step, idx) => (
          <motion.div
            key={step.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="relative z-10 flex flex-col items-center gap-3"
          >
            <div className="w-14 h-14 rounded-2xl bg-[#0b0f19] border border-emerald-500/30 flex items-center justify-center text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.1)] group hover:border-emerald-500 transition-all duration-300">
              <step.icon size={24} className="group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter text-center max-w-[80px] leading-tight">
              {step.name}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default DataSyncedPipeline;
