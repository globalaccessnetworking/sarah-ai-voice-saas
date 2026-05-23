// RoiProjection.tsx — REWRITTEN to match original exactly:
// Title: "ROI Projection — Year 2+"
// Back: ← Cost Detail
// Two columns: "3-Year Projection" | "AI Maturity Forecast"
import { useParams } from 'react-router-dom';
import { BackButton } from '../shared/Breadcrumb';

export default function RoiProjection() {
  const { month } = useParams();
  const backPath = `/cost/month/${month}/detail`;

  return (
    <div className="space-y-4">
      <BackButton label="← Cost Detail" to={backPath} />

      <h2 className="text-xl font-bold text-white">ROI Projection — Year 2+</h2>

      <div className="grid grid-cols-2 gap-4">
        {/* Left: 3-Year Projection */}
        <div className="rounded-lg p-5 bg-[#111827] border border-gray-800 rounded-xl">
          <h3 className="text-sm font-semibold text-white mb-5">3-Year Projection</h3>
          {[
            { label: 'Year 1 Savings', value: 'PKR 58.2M', color: '#10b981' },
            { label: 'Year 2 Savings', value: 'PKR 64.2M', color: '#10b981' },
            { label: 'Year 3 Savings', value: 'PKR 67.8M', color: '#10b981' },
            { label: 'Cumulative', value: 'PKR 190.3M', color: '#10b981', bold: true },
            { label: 'ROI', value: '~1,200%', color: '#10b981', bold: true },
          ].map(({ label, value, color, bold }) => (
            <div key={label} className="flex justify-between py-2.5" style={{ borderBottom: '1px solid #1a2030' }}>
              <span className="text-sm" style={{ color: '#6b7280' }}>{label}</span>
              <span className={`text-sm ${bold ? 'font-bold' : ''}`} style={{ color }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Right: AI Maturity Forecast */}
        <div className="rounded-lg p-5 bg-[#111827] border border-gray-800 rounded-xl">
          <h3 className="text-sm font-semibold text-white mb-5">AI Maturity Forecast</h3>
          {[
            { label: 'Current AI Rate', value: '85.5%', color: '#3b82f6' },
            { label: '6-Month Target', value: '92%', color: '#3b82f6' },
            { label: '12-Month Target', value: '96%', color: '#3b82f6' },
            { label: 'Agents at 95%', value: '12-15', color: '#10b981', bold: true },
            { label: 'Cost at Scale', value: 'PKR 1.43M/mo', color: '#10b981', bold: true },
          ].map(({ label, value, color, bold }) => (
            <div key={label} className="flex justify-between py-2.5" style={{ borderBottom: '1px solid #1a2030' }}>
              <span className="text-sm" style={{ color: '#6b7280' }}>{label}</span>
              <span className={`text-sm ${bold ? 'font-bold' : ''}`} style={{ color }}>{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
