// CallAnalytics.tsx — Tab 4: District call volume table
import { useNavigate } from 'react-router-dom';
import { districts } from '../../data/mockData';
import KpiCard from '../shared/KpiCard';

export default function CallAnalytics() {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      {/* KPI Ribbon */}
      <div className="grid grid-cols-6 gap-3">
        <KpiCard label="Daily Volume" value="~3,000" valueColor="#a855f7" />
        <KpiCard label="AI Handled" value="88.5%" valueColor="#a855f7" />
        <KpiCard label="Avg Response" value="1m" valueColor="#10b981" />
        <KpiCard label="Districts" value="40" valueColor="#10b981" />
        <KpiCard label="Peak Hour" value="10:00" valueColor="#f97316" />
        <KpiCard label="Repeat Rate" value="6.9%" valueColor="#ef4444" />
      </div>

      {/* District Table */}
      <div className="rounded-lg overflow-hidden bg-[#111827] border border-gray-800 rounded-xl">
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #1f2937' }}>
          <h3 className="text-sm font-semibold text-white">District Call Volume</h3>
        </div>
        {/* Column headers */}
        <div className="grid px-5 py-2" style={{ gridTemplateColumns: '160px 1fr 60px 60px 60px 60px 24px', borderBottom: '1px solid #1f2937', color: '#6b7280', fontSize: 11 }}>
          <span>DISTRICT</span>
          <span></span>
          <span className="text-right">TOTAL</span>
          <span className="text-right">AI</span>
          <span className="text-right">RATING</span>
          <span className="text-right">ESC%</span>
          <span></span>
        </div>
        <div className="overflow-y-auto" style={{ maxHeight: 420 }}>
          {districts.map(dist => {
            const escColor = dist.escalationRate >= 18 ? '#ef4444' : dist.escalationRate >= 12 ? '#f97316' : '#6b7280';
            return (
              <div
                key={dist.id}
                className="flex items-center gap-4 px-5 py-3 cursor-pointer transition-all"
                style={{ borderBottom: '1px solid #1a2030', gridTemplateColumns: '160px 1fr 60px 60px 60px 60px 24px' }}
                
                
                onClick={() => navigate(`/analytics/${dist.id}`)}
              >
                <span className="text-sm font-semibold text-white" style={{ width: 140, flexShrink: 0 }}>{dist.name}</span>
                {/* Bar */}
                <div className="flex-1 rounded-full h-1.5 mx-2" style={{ backgroundColor: '#1f2937' }}>
                  <div className="h-1.5 rounded-full" style={{ width: `${(dist.calls / 326) * 100}%`, backgroundColor: '#3b82f6' }} />
                </div>
                {/* Metrics */}
                <span className="text-sm font-bold w-12 text-right flex-shrink-0" style={{ color: '#3b82f6' }}>{dist.calls}</span>
                <span className="text-sm w-10 text-right flex-shrink-0" style={{ color: '#a855f7' }}>{dist.aiHandled}</span>
                <span className="text-sm w-12 text-right flex-shrink-0" style={{ color: '#f97316' }}>{dist.rating}/5</span>
                <span className="text-sm w-10 text-right flex-shrink-0 font-medium" style={{ color: escColor }}>{dist.escalationRate}%</span>
                <span style={{ color: '#374151' }}>→</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
