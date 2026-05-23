// TriageEngine.tsx — AI Triage Engine main view
import { useNavigate } from 'react-router-dom';
import { categories } from '../../data/mockData';
import KpiCard from '../shared/KpiCard';

export default function TriageEngine() {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      {/* KPI Ribbon */}
      <div className="grid grid-cols-5 gap-3">
        <KpiCard label="Classifier Version" value="v4.2.1" valueColor="#a855f7" />
        <KpiCard label="Avg Confidence" value="84.9%" valueColor="#10b981" />
        <KpiCard label="Misclassification" value="1.5%" valueColor="#ef4444" />
        <KpiCard label="Top Sentiment" value="Neutral" valueColor="#3b82f6" />
        <KpiCard label="AI Handled" value="86.5%" valueColor="#10b981" />
      </div>

      {/* Category Classification Performance */}
      <div className="rounded-lg overflow-hidden bg-[#111827] border border-gray-800 rounded-xl">
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #1f2937' }}>
          <h3 className="text-sm font-semibold text-white">Category Classification Performance</h3>
        </div>
        <div className="overflow-y-auto" style={{ maxHeight: 380 }}>
          {categories.map(cat => {
            const escColor = cat.escalationRate > 12 ? '#ef4444' : '#6b7280';
            return (
              <div
                key={cat.id}
                className="flex items-center gap-4 px-5 py-3 cursor-pointer transition-all"
                style={{ borderBottom: '1px solid #1a2030' }}
                
                
                onClick={() => navigate(`/triage/${cat.id}`)}
              >
                {/* Name */}
                <div style={{ width: 200, flexShrink: 0 }}>
                  <p className="text-sm font-semibold text-white">{cat.name}</p>
                  <p className="text-xs" style={{ color: '#6b7280' }}>{cat.callsPerDay} calls/day</p>
                </div>
                {/* Progress bar */}
                <div className="flex-1 rounded-full h-1.5" style={{ backgroundColor: '#1f2937' }}>
                  <div className="h-1.5 rounded-full" style={{ width: `${cat.confidence}%`, backgroundColor: '#a855f7' }} />
                </div>
                {/* Metrics */}
                <div className="flex items-center gap-6 flex-shrink-0">
                  <span className="text-sm font-bold w-12 text-right" style={{ color: '#a855f7' }}>{cat.confidence}%</span>
                  <span className="text-sm w-10 text-right" style={{ color: '#6b7280' }}>{cat.avgDuration}s</span>
                  <span className="text-sm w-12 text-right" style={{ color: '#10b981' }}>{cat.resolutionRate}%</span>
                  <span className="text-sm w-10 text-right font-medium" style={{ color: escColor }}>{cat.escalationRate}%</span>
                  <span style={{ color: '#374151' }}>→</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Classification Pipeline */}
      <div className="rounded-lg p-5 bg-[#111827] border border-gray-800 rounded-xl">
        <h3 className="text-sm font-semibold text-white mb-4">AI Classification Pipeline</h3>
        <div className="flex items-center gap-2">
          {[
            { title: 'Voice → Text', sub: 'STT Engine', val: '98.9%', color: '#10b981' },
            { title: 'NLU Parse', sub: 'SP-NLU-v2.8', val: '94.7%', color: '#10b981' },
            { title: 'Intent Match', sub: 'SP-Triage-v4.1', val: '83.1%', color: '#10b981' },
            { title: 'Route Decision', sub: 'Rule Engine', val: '243ms', color: '#3b82f6' },
            { title: 'Response Gen', sub: 'SP-Voice v3.2', val: '97.2%', color: '#10b981' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 flex-1">
              <div className="flex-1 rounded-lg p-3 text-center" style={{ backgroundColor: '#1a2030' }}>
                <p className="text-xs font-semibold" style={{ color: item.color }}>{item.title}</p>
                <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>{item.sub}</p>
                <p className="text-lg font-bold mt-1 text-white">{item.val}</p>
              </div>
              {i < 4 && <span style={{ color: '#374151', fontSize: 20 }}>→</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
