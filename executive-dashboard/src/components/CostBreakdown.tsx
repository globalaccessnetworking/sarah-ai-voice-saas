import { motion } from 'framer-motion';

const CostBreakdown = () => {
  return (
    <div className="bg-[#131A2B] border border-white/5 rounded-2xl p-5 flex flex-col justify-between">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <h3 className="text-xs font-black text-accent-orange uppercase tracking-widest">
          Call Cost Intelligence
        </h3>
        <div className="border border-accent-emerald/30 bg-accent-emerald/10 text-accent-emerald text-[9px] px-2 py-1 rounded font-bold uppercase tracking-wider">
          Live Optimization
        </div>
      </div>

      {/* Cost Comparison */}
      <div className="flex justify-between items-end mb-8">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">
            AI Execution Cost
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-black text-accent-emerald leading-none tracking-tighter">
              PKR 4.2
            </span>
            <span className="text-xs text-gray-500 font-bold">/call</span>
          </div>
        </div>

        <div className="flex flex-col items-end text-right">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">
            Legacy Human Cost
          </span>
          <span className="text-2xl font-black text-red-500 line-through leading-none opacity-80">
            PKR 35.0
          </span>
          <span className="text-[9px] text-red-500/70 font-bold uppercase mt-1">
            Manual Entry Avg.
          </span>
        </div>
      </div>

      {/* Efficiency Multiplier */}
      <div className="flex justify-between items-end mb-4">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">
            Efficiency Multiplier
          </span>
          <span className="text-xl font-black text-white tracking-tight">
            8.3x <span className="text-accent-emerald">CHEAPER</span>
          </span>
        </div>
        <div className="bg-accent-emerald/10 text-accent-emerald px-3 py-1 rounded font-black text-xs">
          88% SAVED
        </div>
      </div>

      {/* 🔥 FIXED: Cleanly Separated Progress Bar Section */}
      <div className="mt-2 flex flex-col gap-2">
        <span className="text-[9px] font-black text-accent-emerald uppercase tracking-[0.2em]">
          System Optimization Target Reached
        </span>
        <div className="w-full h-1.5 bg-gray-800/50 rounded-full overflow-hidden border border-white/5">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: '88%' }}
            transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
            className="h-full bg-accent-emerald rounded-full"
          />
        </div>
      </div>
    </div>
  );
};

export default CostBreakdown;