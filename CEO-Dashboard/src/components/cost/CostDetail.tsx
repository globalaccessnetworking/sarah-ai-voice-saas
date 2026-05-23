// CostDetail.tsx — NEW page matching original "Cost Detail — Jan"
// Breadcrumb: Cost & ROI › Monthly Breakdown › Cost Detail
// Back: ← Jan
// Two columns: "Old Model (150 Agents)" red | "New Model (20 Agents + AI)" green
// Bottom: "View ROI Projection →" green button
import { useParams } from 'react-router-dom';
import { BackButton } from '../shared/Breadcrumb';
import GreenActionButton from '../shared/GreenActionButton';

const MONTH_LABELS: Record<string, string> = {
  jan: 'Jan', feb: 'Feb', mar: 'Mar', apr: 'Apr', may: 'May', jun: 'Jun',
  jul: 'Jul', aug: 'Aug', sep: 'Sep', oct: 'Oct', nov: 'Nov', dec: 'Dec',
};

// Per-month data with slight variations
function getMonthData(month: string) {
  const idx = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'].indexOf(month);
  const base = idx >= 0 ? idx : 0;
  const oldSalary = (5.8 + base * 0.01).toFixed(1);
  const oldInfra = (0.5 + base * 0.005).toFixed(1);
  const oldTraining = (0.2).toFixed(1);
  const oldTotal = (parseFloat(oldSalary) + parseFloat(oldInfra) + parseFloat(oldTraining)).toFixed(1);
  const newSalary = (1.1).toFixed(1);
  const newAI = (0.8 + base * 0.01).toFixed(1);
  const newInfra = (0.2).toFixed(1);
  const newTotal = (parseFloat(newSalary) + parseFloat(newAI) + parseFloat(newInfra)).toFixed(1);
  return { oldSalary, oldInfra, oldTraining, oldTotal, newSalary, newAI, newInfra, newTotal };
}

export default function CostDetail() {
  const { month } = useParams();
  const monthKey = month || 'jan';
  const label = MONTH_LABELS[monthKey] || 'Jan';
  const d = getMonthData(monthKey);

  return (
    <div className="space-y-4">
      <BackButton label={`← ${label}`} to={`/cost/month/${monthKey}`} />

      <h2 className="text-xl font-bold text-white">Cost Detail — {label}</h2>

      {/* Two-column panels */}
      <div className="grid grid-cols-2 gap-4">
        {/* Left: Old Model (150 Agents) */}
        <div className="rounded-lg p-5 bg-[#111827] border border-gray-800 rounded-xl">
          <h3 className="text-sm font-bold mb-5" style={{ color: '#d1d5db' }}>Old Model (150 Agents)</h3>
          {[
            { label: 'Agent Salaries', value: `PKR ${d.oldSalary}M`, color: '#ef4444' },
            { label: 'Infrastructure', value: `PKR ${d.oldInfra}M`, color: '#ef4444' },
            { label: 'Training', value: `PKR ${d.oldTraining}M`, color: '#ef4444' },
            { label: 'Total Monthly', value: `PKR ${d.oldTotal}M`, color: '#ef4444', bold: true },
          ].map(({ label, value, color, bold }) => (
            <div key={label} className="flex justify-between py-2.5" style={{ borderBottom: '1px solid #1a2030' }}>
              <span className="text-sm" style={{ color: '#6b7280' }}>{label}</span>
              <span className={`text-sm ${bold ? 'font-bold' : ''}`} style={{ color }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Right: New Model (20 Agents + AI) */}
        <div className="rounded-lg p-5 bg-[#111827] border border-gray-800 rounded-xl">
          <h3 className="text-sm font-bold mb-5" style={{ color: '#d1d5db' }}>New Model (20 Agents + AI)</h3>
          {[
            { label: 'Agent Salaries', value: `PKR ${d.newSalary}M`, color: '#10b981' },
            { label: 'AI Platform', value: `PKR ${d.newAI}M`, color: '#10b981' },
            { label: 'Infrastructure', value: `PKR ${d.newInfra}M`, color: '#10b981' },
            { label: 'Total Monthly', value: `PKR ${d.newTotal}M`, color: '#10b981', bold: true },
          ].map(({ label, value, color, bold }) => (
            <div key={label} className="flex justify-between py-2.5" style={{ borderBottom: '1px solid #1a2030' }}>
              <span className="text-sm" style={{ color: '#6b7280' }}>{label}</span>
              <span className={`text-sm ${bold ? 'font-bold' : ''}`} style={{ color }}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Action button → ROI Projection */}
      <GreenActionButton label="View ROI Projection →" to={`/cost/month/${monthKey}/detail/projection`} />
    </div>
  );
}
