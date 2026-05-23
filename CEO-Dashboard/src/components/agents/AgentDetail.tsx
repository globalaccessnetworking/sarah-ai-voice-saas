// AgentDetail.tsx — Agent detail with weekly chart + top categories
import { useParams, useNavigate } from 'react-router-dom';
import { getAgentById, agents } from '../../data/mockData';
import { BackButton } from '../shared/Breadcrumb';
import GreenActionButton from '../shared/GreenActionButton';
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip } from 'recharts';

export default function AgentDetail() {
  const { agentId } = useParams();
  const navigate = useNavigate();
  const agent = agentId ? getAgentById(agentId) : agents[0];
  if (!agent) return <div className="text-gray-500 p-8">Agent not found</div>;

  const weeklyChartData = agent.weeklyData.map((v, i) => ({ day: `D${i + 1}`, calls: v }));
  const maxCalls = Math.max(...agent.topCategories.map(c => c.calls));

  return (
    <div className="space-y-4">
      <BackButton label="← All Agents" to="/agents" />

      {/* Agent Header */}
      <div className="flex items-center gap-4">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-base font-bold"
          style={{ backgroundColor: agent.avatarColor + '33', color: agent.avatarColor, border: `2px solid ${agent.avatarColor}55` }}
        >
          {agent.initials}
        </div>
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-white">{agent.name}</h2>
            <span className="text-xs font-bold px-2 py-1 rounded-sm" style={{ backgroundColor: '#10b981', color: '#fff' }}>
              {agent.status}
            </span>
          </div>
          <p className="text-sm" style={{ color: '#6b7280' }}>{agent.specialization} • {agent.shift} Shift</p>
        </div>
      </div>

      {/* 6-Card KPI */}
      <div className="grid grid-cols-6 gap-3">
        <div className="rounded-lg p-4 text-center bg-[#111827] border border-gray-800 rounded-xl">
          <p className="text-xs tracking-widest uppercase mb-1" style={{ color: '#6b7280' }}>Calls Today</p>
          <p className="text-xl font-bold" style={{ color: '#3b82f6' }}>{agent.callsToday}</p>
        </div>
        <div className="rounded-lg p-4 text-center bg-[#111827] border border-gray-800 rounded-xl">
          <p className="text-xs tracking-widest uppercase mb-1" style={{ color: '#6b7280' }}>Avg Handle</p>
          <p className="text-xl font-bold" style={{ color: '#f97316' }}>{agent.avgHandle}</p>
        </div>
        <div className="rounded-lg p-4 text-center bg-[#111827] border border-gray-800 rounded-xl">
          <p className="text-xs tracking-widest uppercase mb-1" style={{ color: '#6b7280' }}>Satisfaction</p>
          <p className="text-xl font-bold" style={{ color: '#f97316' }}>{agent.satisfaction}/5</p>
        </div>
        <div className="rounded-lg p-4 text-center bg-[#111827] border border-gray-800 rounded-xl">
          <p className="text-xs tracking-widest uppercase mb-1" style={{ color: '#6b7280' }}>Resolution</p>
          <p className="text-xl font-bold" style={{ color: '#10b981' }}>{agent.resolution}%</p>
        </div>
        <div className="rounded-lg p-4 text-center bg-[#111827] border border-gray-800 rounded-xl">
          <p className="text-xs tracking-widest uppercase mb-1" style={{ color: '#6b7280' }}>Escalations</p>
          <p className="text-xl font-bold" style={{ color: '#ef4444' }}>{agent.escalations}</p>
        </div>
        <div className="rounded-lg p-4 text-center bg-[#111827] border border-gray-800 rounded-xl">
          <p className="text-xs tracking-widest uppercase mb-1" style={{ color: '#6b7280' }}>Specialization</p>
          <p className="text-sm font-bold" style={{ color: '#a855f7' }}>{agent.specialization}</p>
        </div>
      </div>

      {/* Two panels */}
      <div className="grid grid-cols-2 gap-4">
        {/* Weekly Performance Chart */}
        <div className="rounded-lg p-5 bg-[#111827] border border-gray-800 rounded-xl">
          <h3 className="text-sm font-semibold text-white mb-4">Weekly Performance</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={weeklyChartData} barSize={28}>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} />
              
              <Bar dataKey="calls" fill="#10b981" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs mt-2" style={{ color: '#6b7280' }}>
            Today: {agent.callsToday} calls, {Math.round(agent.callsToday * agent.resolution / 100)} resolved, {agent.satisfaction}/5 avg
          </p>
        </div>

        {/* Top Categories */}
        <div className="rounded-lg p-5 bg-[#111827] border border-gray-800 rounded-xl">
          <h3 className="text-sm font-semibold text-white mb-4">Top Categories Handled</h3>
          <div className="space-y-3">
            {agent.topCategories.map(cat => (
              <div key={cat.name} className="flex items-center gap-3">
                <span className="text-sm flex-1" style={{ color: '#d1d5db' }}>{cat.name}</span>
                <div className="w-28 rounded-full h-1.5" style={{ backgroundColor: '#1f2937' }}>
                  <div className="h-1.5 rounded-full" style={{ width: `${(cat.calls / maxCalls) * 100}%`, backgroundColor: '#3b82f6' }} />
                </div>
                <span className="text-xs w-14 text-right" style={{ color: '#6b7280' }}>{cat.calls} calls</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <GreenActionButton label="View Call Log →" to={`/agents/${agent.id}/calls`} />
    </div>
  );
}
