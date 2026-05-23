// DistrictDetail.tsx — Matches original: "Lahore [288 calls] [14 areas]" title + 6 KPIs + 7-Day chart + District Metrics + Area Breakdown Table
import { useParams, useNavigate } from 'react-router-dom';
import { getDistrictById, districts } from '../../data/mockData';
import { BackButton } from '../shared/Breadcrumb';
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip } from 'recharts';

export default function DistrictDetail() {
  const { district: distId } = useParams();
  const navigate = useNavigate();
  const dist = distId ? getDistrictById(distId) : districts[0];
  if (!dist) return <div className="text-gray-500 p-8">District not found</div>;

  const weeklyData = dist.weeklyTrend.map((v, i) => ({ day: `D${i + 1}`, calls: v }));

  return (
    <div className="space-y-4">
      {/* Back button styled as original green pill */}
      <BackButton label="← All Districts" to="/analytics" />

      {/* Title with call count + area count badges — matches "Lahore [288 calls] [14 areas]" */}
      <div className="flex items-center gap-3 flex-wrap">
        <h2 className="text-2xl font-bold text-white">{dist.name}</h2>
        <span className="text-xs font-bold px-2 py-1 rounded-sm" style={{ backgroundColor: '#3b82f6', color: '#fff' }}>
          {dist.calls} calls
        </span>
        <span className="text-xs font-bold px-2 py-1 rounded-sm" style={{ backgroundColor: '#a855f7', color: '#fff' }}>
          {dist.areas.length} areas
        </span>
      </div>

      {/* 6-Card KPI Ribbon — matches original: TOTAL | AI | HUMAN | AVG RESPONSE | SATISFACTION | ESCALATION */}
      <div className="grid grid-cols-6 gap-3">
        {[
          { label: 'Total', value: dist.calls, color: '#a855f7' },
          { label: 'AI', value: dist.aiHandled, color: '#a855f7' },
          { label: 'Human', value: dist.calls - dist.aiHandled, color: '#f97316' },
          { label: 'Avg Response', value: `${Math.floor(1 + Math.random() * 4)}m`, color: '#10b981' },
          { label: 'Satisfaction', value: `${dist.rating}/5`, color: '#f97316' },
          { label: 'Escalation', value: `${dist.escalationRate}%`, color: '#ef4444' },
        ].map(k => (
          <div key={k.label} className="rounded-lg p-4 text-center bg-[#111827] border border-gray-800 rounded-xl">
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#6b7280' }}>{k.label}</p>
            <p className="text-2xl font-bold" style={{ color: k.color }}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* 7-Day Chart (takes 2/3 width) */}
        <div className="col-span-2 rounded-lg p-5 bg-[#111827] border border-gray-800 rounded-xl">
          <h3 className="text-sm font-semibold text-white mb-4">7-Day Volume Trend</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={weeklyData} barSize={52}>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} />
              
              <Bar dataKey="calls" fill="#3b82f6" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* District Metrics (1/3 width) */}
        <div className="rounded-lg p-5 bg-[#111827] border border-gray-800 rounded-xl">
          <h3 className="text-sm font-semibold text-white mb-4">District Metrics</h3>
          {[
            { label: 'Top Category', value: dist.topCategory },
            { label: 'Repeat Rate', value: `${dist.repeatRate}%` },
            { label: 'Assigned Agents', value: dist.assignedAgents },
            { label: 'Areas Covered', value: dist.areas.length },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between py-2.5" style={{ borderBottom: '1px solid #1a2030' }}>
              <span className="text-sm" style={{ color: '#6b7280' }}>{label}</span>
              <span className="text-sm font-bold" style={{ color: '#d1d5db' }}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Area Breakdown Table — matches original with 📍 emoji and column headers */}
      <div className="rounded-lg overflow-hidden bg-[#111827] border border-gray-800 rounded-xl">
        <div className="flex items-center gap-2 px-5 py-4" style={{ borderBottom: '1px solid #1f2937' }}>
          <span>📍</span>
          <h3 className="text-sm font-semibold text-white">Area Breakdown — {dist.name}</h3>
        </div>

        {/* Column headers — match original: AREA | CALLS | AI | WA | 📎 | RATING | ESC% */}
        <div className="flex gap-4 px-5 py-2.5" style={{ borderBottom: '1px solid #1f2937', fontSize: 11, color: '#6b7280' }}>
          <span className="flex-1">AREA</span>
          <span className="w-14 text-right">CALLS</span>
          <span className="w-10 text-right">AI</span>
          <span className="w-10 text-right">WA</span>
          <span className="w-8 text-right">📎</span>
          <span className="w-14 text-right">RATING</span>
          <span className="w-10 text-right">ESC%</span>
          <span className="w-4" />
        </div>

        <div className="overflow-y-auto" style={{ maxHeight: 380 }}>
          {dist.areas.map(area => {
            const escColor = area.escRate >= 15 ? '#ef4444' : area.escRate >= 10 ? '#f97316' : '#6b7280';
            return (
              <div
                key={area.name}
                className="flex items-center gap-4 px-5 py-3 cursor-pointer transition-all"
                style={{ borderBottom: '1px solid #1a2030' }}
                
                
                onClick={() => navigate(`/analytics/${dist.id}/${encodeURIComponent(area.name)}`)}
              >
                <span className="flex-1 text-sm font-semibold text-white">{area.name}</span>
                <span className="w-14 text-right text-sm font-bold" style={{ color: '#3b82f6' }}>{area.calls}</span>
                <span className="w-10 text-right text-sm" style={{ color: '#a855f7' }}>{area.ai}</span>
                <span className="w-10 text-right text-sm" style={{ color: '#16a34a' }}>{area.wa}</span>
                <span className="w-8 text-right text-sm" style={{ color: '#f97316' }}>{area.images}</span>
                <span className="w-14 text-right text-sm font-bold" style={{ color: '#f97316' }}>{area.rating}</span>
                <span className="w-10 text-right text-sm font-medium" style={{ color: escColor }}>{area.escRate}%</span>
                <span className="w-4 text-right text-xs" style={{ color: '#374151' }}>—</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
