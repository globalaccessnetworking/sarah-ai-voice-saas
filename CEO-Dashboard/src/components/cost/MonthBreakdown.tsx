// MonthBreakdown.tsx — REWRITTEN to match original exactly:
// Title: "Jan — Cost Breakdown"
// 4 KPI cards: OLD COST | NEW COST | SAVING | AI RATE
// Single "View Full Cost Breakdown →" green button (no table — that's in CostDetail)
import { useParams } from 'react-router-dom';
import { BackButton } from '../shared/Breadcrumb';
import GreenActionButton from '../shared/GreenActionButton';

const MONTHS: Record<string, { label: string; shortLabel: string; oldCost: string; newCost: string; saving: string; aiRate: string }> = {
  jan: { label: 'January', shortLabel: 'Jan', oldCost: 'PKR 6.8M', newCost: 'PKR 1.8M', saving: 'PKR 4.9M', aiRate: '83.7%' },
  feb: { label: 'February', shortLabel: 'Feb', oldCost: 'PKR 6.8M', newCost: 'PKR 1.8M', saving: 'PKR 4.9M', aiRate: '84.5%' },
  mar: { label: 'March', shortLabel: 'Mar', oldCost: 'PKR 6.8M', newCost: 'PKR 1.8M', saving: 'PKR 5.0M', aiRate: '85.0%' },
  apr: { label: 'April', shortLabel: 'Apr', oldCost: 'PKR 6.8M', newCost: 'PKR 1.8M', saving: 'PKR 5.0M', aiRate: '85.5%' },
  may: { label: 'May', shortLabel: 'May', oldCost: 'PKR 6.8M', newCost: 'PKR 1.9M', saving: 'PKR 4.9M', aiRate: '86.0%' },
  jun: { label: 'June', shortLabel: 'Jun', oldCost: 'PKR 6.8M', newCost: 'PKR 1.9M', saving: 'PKR 4.9M', aiRate: '86.5%' },
  jul: { label: 'July', shortLabel: 'Jul', oldCost: 'PKR 6.8M', newCost: 'PKR 1.9M', saving: 'PKR 4.9M', aiRate: '87.0%' },
  aug: { label: 'August', shortLabel: 'Aug', oldCost: 'PKR 6.8M', newCost: 'PKR 1.9M', saving: 'PKR 4.9M', aiRate: '87.5%' },
  sep: { label: 'September', shortLabel: 'Sep', oldCost: 'PKR 6.8M', newCost: 'PKR 1.9M', saving: 'PKR 4.9M', aiRate: '88.0%' },
  oct: { label: 'October', shortLabel: 'Oct', oldCost: 'PKR 6.8M', newCost: 'PKR 1.9M', saving: 'PKR 5.0M', aiRate: '88.5%' },
  nov: { label: 'November', shortLabel: 'Nov', oldCost: 'PKR 6.8M', newCost: 'PKR 1.9M', saving: 'PKR 5.0M', aiRate: '89.0%' },
  dec: { label: 'December', shortLabel: 'Dec', oldCost: 'PKR 6.8M', newCost: 'PKR 1.9M', saving: 'PKR 5.0M', aiRate: '89.5%' },
};

export default function MonthBreakdown() {
  const { month } = useParams();
  const m = MONTHS[month || 'jan'] || MONTHS['jan'];

  return (
    <div className="space-y-4">
      <BackButton label="← Monthly Overview" to="/cost" />

      {/* Title: "Jan — Cost Breakdown" */}
      <h2 className="text-xl font-bold text-white">{m.shortLabel} — Cost Breakdown</h2>

      {/* 4 KPI cards: OLD COST | NEW COST | SAVING | AI RATE */}
      <div className="grid grid-cols-4 gap-3">
        <div className="rounded-lg p-4 text-center bg-[#111827] border border-gray-800 rounded-xl">
          <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#6b7280' }}>Old Cost</p>
          <p className="text-2xl font-bold" style={{ color: '#ef4444' }}>{m.oldCost}</p>
        </div>
        <div className="rounded-lg p-4 text-center bg-[#111827] border border-gray-800 rounded-xl">
          <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#6b7280' }}>New Cost</p>
          <p className="text-2xl font-bold" style={{ color: '#10b981' }}>{m.newCost}</p>
        </div>
        <div className="rounded-lg p-4 text-center bg-[#111827] border border-gray-800 rounded-xl">
          <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#6b7280' }}>Saving</p>
          <p className="text-2xl font-bold" style={{ color: '#10b981' }}>{m.saving}</p>
        </div>
        <div className="rounded-lg p-4 text-center bg-[#111827] border border-gray-800 rounded-xl">
          <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#6b7280' }}>AI Rate</p>
          <p className="text-2xl font-bold" style={{ color: '#3b82f6' }}>{m.aiRate}</p>
        </div>
      </div>

      {/* Single action button — goes to Cost Detail */}
      <GreenActionButton label="View Full Cost Breakdown →" to={`/cost/month/${month}/detail`} />
    </div>
  );
}
