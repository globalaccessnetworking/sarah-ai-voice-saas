// EscalationQueue.tsx — Tab 5: Escalation Queue main view
import { useNavigate } from 'react-router-dom';
import { escalations } from '../../data/mockData';
import KpiCard from '../shared/KpiCard';

const REASONS = [
  { label: 'Low confidence', value: 7, color: '#ef4444' },
  { label: 'Caller requested human', value: 5, color: '#ef4444' },
  { label: 'Complex multi-issue', value: 6, color: '#ef4444' },
  { label: 'Repeat complaint >3x', value: 8, color: '#ef4444' },
];

function PriorityBadge({ p }: { p: string }) {
  const colors: Record<string, string> = { P1: '#ef4444', P2: '#f97316', P3: '#3b82f6', P4: '#6b7280' };
  return (
    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: colors[p] + '22', color: colors[p], border: `1px solid ${colors[p]}44` }}>
      {p}
    </span>
  );
}

export default function EscalationQueue() {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      {/* KPI Ribbon */}
      <div className="grid grid-cols-5 gap-3">
        <KpiCard label="Queue Size" value={escalations.length} valueColor="#ef4444" />
        <KpiCard label="Escalation Rate" value="19.5%" valueColor="#f97316" />
        <KpiCard label="Avg Wait Time" value="38s" valueColor="#3b82f6" />
        <KpiCard label="Resolution Rate" value="77%" valueColor="#10b981" />
        <KpiCard label="High Urgency" value="3%" valueColor="#ef4444" />
      </div>

      {/* Escalation Reasons Breakdown */}
      <div className="rounded-lg p-5 bg-[#111827] border border-gray-800 rounded-xl">
        <h3 className="text-sm font-semibold text-white mb-4">Escalation Reasons Breakdown</h3>
        <div className="grid grid-cols-4 gap-3">
          {REASONS.map(r => (
            <div key={r.label} className="rounded-lg p-4 text-center" style={{ backgroundColor: '#1a2030' }}>
              <p className="text-xs mb-2" style={{ color: '#6b7280' }}>{r.label}</p>
              <p className="text-2xl font-bold" style={{ color: r.color }}>{r.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Escalation Queue List */}
      <div className="rounded-lg overflow-hidden bg-[#111827] border border-gray-800 rounded-xl">
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #1f2937' }}>
          <h3 className="text-sm font-semibold text-white">Escalation Queue</h3>
        </div>
        <div className="overflow-y-auto" style={{ maxHeight: 380 }}>
          {escalations.map(esc => (
            <div
              key={esc.callId}
              className="flex items-center gap-4 px-5 py-3.5 cursor-pointer transition-all"
              style={{ borderBottom: '1px solid #1a2030' }}
              
              
              onClick={() => navigate(`/escalations/${esc.callId}`)}
            >
              {/* Time */}
              <span className="text-xs w-10 flex-shrink-0 font-mono" style={{ color: '#6b7280' }}>{esc.time}</span>
              {/* Name + reason */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">{esc.caller} — {esc.category}</p>
                <p className="text-xs" style={{ color: '#ef4444' }}>{esc.reason}</p>
              </div>
              {/* Priority + agent */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <PriorityBadge p={esc.urgency} />
                <span className="text-sm" style={{ color: '#6b7280' }}>{esc.assignedTo}</span>
                <span style={{ color: '#374151' }}>→</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
