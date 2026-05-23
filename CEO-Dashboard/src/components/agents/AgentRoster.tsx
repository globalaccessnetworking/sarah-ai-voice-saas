// AgentRoster.tsx — Agent Performance main view (Tab 3) — matches original exactly
import { useNavigate } from 'react-router-dom';
import { agents } from '../../data/mockData';
import KpiCard from '../shared/KpiCard';

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { bg: string; color: string }> = {
    'On Call': { bg: '#10b981', color: '#fff' },
    'Available': { bg: '#3b82f6', color: '#fff' },
    'Break': { bg: '#374151', color: '#9ca3af' },
  };
  const style = cfg[status] || cfg['Break'];
  return (
    <span className="text-xs font-bold px-2 py-1 rounded-sm" style={{ backgroundColor: style.bg, color: style.color }}>
      {status}
    </span>
  );
}

export default function AgentRoster() {
  const navigate = useNavigate();
  const onCall = agents.filter(a => a.status === 'On Call').length;
  const available = agents.filter(a => a.status === 'Available').length;
  const onBreak = agents.filter(a => a.status === 'Break').length;
  const avgSat = (agents.reduce((sum, a) => sum + a.satisfaction, 0) / agents.length).toFixed(1);

  return (
    <div className="space-y-4">
      {/* KPI Ribbon — matches original 5-card layout */}
      <div className="grid grid-cols-5 gap-3">
        <KpiCard label="Total Agents" value={20} valueColor="#10b981" />
        <KpiCard label="On Call" value={onCall} valueColor="#10b981" />
        <KpiCard label="Available" value={available} valueColor="#3b82f6" />
        <KpiCard label="On Break" value={onBreak} valueColor="#6b7280" />
        <KpiCard label="Avg Satisfaction" value={`${avgSat}/5`} valueColor="#f97316" />
      </div>

      {/* Roster */}
      <div className="rounded-lg overflow-hidden bg-[#111827] border border-gray-800 rounded-xl">
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #1f2937' }}>
          <h3 className="text-sm font-semibold text-white">Agent Roster — {onCall} Active</h3>
          <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>Reduced from 150 → 20 with AI automation</p>
          {/* Column headers */}
          <div className="flex items-center gap-4 mt-3 px-0" style={{ color: '#6b7280', fontSize: 11 }}>
            <div className="w-9 flex-shrink-0" />
            <div className="w-44 flex-shrink-0">AGENT</div>
            <div className="flex-1">STATUS</div>
            <div className="w-10 text-right flex-shrink-0">CALLS</div>
            <div className="w-14 text-right flex-shrink-0">RATING</div>
            <div className="w-16 text-right flex-shrink-0">RESOL%</div>
            <div className="w-14 text-right flex-shrink-0">SHIFT</div>
            <div className="w-4 flex-shrink-0" />
          </div>
        </div>
        <div className="overflow-y-auto" style={{ maxHeight: 440 }}>
          {agents.map(agent => (
            <div
              key={agent.id}
              className="flex items-center gap-4 px-5 py-3 cursor-pointer transition-all"
              style={{ borderBottom: '1px solid #1a2030' }}
              
              
              onClick={() => navigate(`/agents/${agent.id}`)}
            >
              {/* Avatar */}
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ backgroundColor: agent.avatarColor + '33', color: agent.avatarColor, border: `1.5px solid ${agent.avatarColor}55` }}
              >
                {agent.initials}
              </div>
              {/* Name + spec */}
              <div className="w-44 flex-shrink-0">
                <p className="text-sm font-semibold text-white">{agent.name}</p>
                <p className="text-xs" style={{ color: '#6b7280' }}>{agent.specialization}</p>
              </div>
              {/* Status */}
              <div className="flex-1">
                <StatusBadge status={agent.status} />
              </div>
              {/* Metrics — match original column order */}
              <div className="flex items-center flex-shrink-0" style={{ gap: 0 }}>
                <span className="text-sm font-bold w-10 text-right" style={{ color: '#d1d5db' }}>{agent.callsToday}</span>
                <span className="text-sm font-bold w-14 text-right" style={{ color: '#f97316' }}>{agent.satisfaction}/5</span>
                <span className="text-sm font-bold w-16 text-right" style={{ color: '#10b981' }}>{agent.resolution}%</span>
                <span className="text-sm w-14 text-right" style={{ color: '#6b7280' }}>{agent.shift}</span>
                <span className="ml-2" style={{ color: '#374151' }}>→</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
