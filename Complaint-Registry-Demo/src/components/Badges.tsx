// Shared badge components for Status and Sentiment

interface StatusBadgeProps { status: string }
export function StatusBadge({ status }: StatusBadgeProps) {
  const s = (status || '').toLowerCase();
  if (s === 'resolved') return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border bg-emerald-500/10 text-emerald-400 border-emerald-500/25">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />Resolved
    </span>
  );
  if (s === 'unresolved') return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border bg-rose-500/10 text-rose-400 border-rose-500/25">
      <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />Unresolved
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border bg-amber-500/10 text-amber-400 border-amber-500/25">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />Pending
    </span>
  );
}

interface SentimentBadgeProps { sentiment: string | null }
export function SentimentBadge({ sentiment }: SentimentBadgeProps) {
  const s = (sentiment || '').toLowerCase();
  if (s === 'frustrated') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border bg-orange-500/10 text-orange-400 border-orange-500/20">
      🔥 Frustrated
    </span>
  );
  if (s === 'abusive') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border bg-red-500/10 text-red-400 border-red-500/20">
      ⚠️ Abusive
    </span>
  );
  if (s === 'calm') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
      😊 Calm
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border bg-white/5 text-gray-500 border-white/10">
      · · ·
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  const p = (priority || 'normal').toLowerCase();
  if (p === 'high' || p === 'urgent') return (
    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">{priority}</span>
  );
  if (p === 'low') return (
    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">{priority}</span>
  );
  return (
    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/5 text-gray-500 border border-white/10">{priority || 'Normal'}</span>
  );
}
