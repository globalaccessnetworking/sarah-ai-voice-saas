import { motion } from 'framer-motion';
import { ClipboardList } from 'lucide-react';
import { cn } from '../lib/utils';

const ClassificationEngine = ({ metadata: _metadata }: { metadata?: any }) => {
  const mvpCategories = [
    { label: 'Missed Collection', probability: 94, isPrimary: true },
    { label: 'Illegal Dumping', probability: 3, isPrimary: false },
    { label: 'Overflowing Bin', probability: 2, isPrimary: false },
    { label: 'Street Sweeping', probability: 1, isPrimary: false },
  ];

  return (
    <div className="card-container p-6 space-y-6 flex-1">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">AI Classification Engine</h3>
        <div className="flex items-center gap-2 px-2 py-0.5 bg-accent-orange/10 rounded border border-accent-orange/20">
          <div className="w-1.5 h-1.5 bg-accent-orange rounded-full animate-pulse" />
          <span className="text-[9px] text-accent-orange font-black uppercase tracking-widest">Inference Active</span>
        </div>
      </div>

      <div className="space-y-5">
        {mvpCategories.map((cat, idx) => (
          <div key={cat.label} className="grid grid-cols-[120px_1fr_40px] items-center gap-4">
            <span className={cn(
              "text-[11px] uppercase tracking-wider",
              cat.isPrimary ? "text-accent-orange font-bold" : "text-gray-500 font-medium"
            )}>
              {cat.label}
            </span>
            
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${cat.probability}%` }}
                transition={{ duration: 1.5, delay: idx * 0.1, ease: "easeOut" }}
                className={cn(
                  "h-full rounded-full",
                  cat.isPrimary ? "bg-accent-orange" : "bg-white/10"
                )}
              />
            </div>

            <span className={cn(
              "text-[10px] font-mono text-right",
              cat.isPrimary ? "text-accent-orange font-black" : "text-gray-600"
            )}>
              {cat.probability}%
            </span>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-[#1A1510] border border-accent-orange/30 rounded-xl p-4 flex gap-3 items-start shadow-[0_0_20px_rgba(249,115,22,0.05)]">
        <div className="p-2 bg-accent-orange/10 rounded-lg border border-accent-orange/20 text-accent-orange shrink-0">
          <ClipboardList size={18} />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <p className="text-[10px] text-accent-orange font-black uppercase tracking-widest">Complaint Registered</p>
            <div className="w-1 h-1 bg-accent-orange/40 rounded-full" />
          </div>
          <p className="text-[10px] font-mono text-gray-500 leading-none">
            ID: SP-2026-04821 • Priority: Standard • ETA: 24h
          </p>
        </div>
      </div>
    </div>
  );
};

export default ClassificationEngine;
