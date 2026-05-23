// AgentCallLog.tsx — Agent's personal call log with exact SP-ticket IDs + correct click path
// Original goes: CallLog row click → NLP Analysis directly (breadcrumb shows Agent > Name > Call Log > CALL-ID)
import { useParams, useNavigate } from 'react-router-dom';
import { getAgentById, agents } from '../../data/mockData';
import { BackButton } from '../shared/Breadcrumb';

// Realistic per-agent call datasets matching original format
const AGENT_CALLS: Record<string, {
  time: string; caller: string; area: string; ticket: string; duration: string;
  category: string; status: 'Resolved' | 'Escalated'; callId: string;
}[]> = {
  'AG-001': [
    { time: '09:35', caller: 'Waqar Younis', area: 'Thokar Niaz Baig', ticket: 'SP-TAX-52127', duration: '2:25', category: 'Illegal Dumping', status: 'Resolved', callId: 'CALL-3000' },
    { time: '07:03', caller: 'Asad Iqbal', area: 'Bahria Town', ticket: 'SP-LAY-56059', duration: '3:07', category: 'Hazardous Waste', status: 'Resolved', callId: 'CALL-2999' },
    { time: '16:19', caller: 'Nadia Perveen', area: 'Askari 10', ticket: 'SP-RAW-80384', duration: '1:20', category: 'Drain Blockage', status: 'Escalated', callId: 'CALL-2998' },
    { time: '15:53', caller: 'Nadia Perveen', area: 'EME Society', ticket: 'SP-ATT-51578', duration: '5:07', category: 'Illegal Dumping', status: 'Resolved', callId: 'CALL-2997' },
    { time: '18:04', caller: 'Usman Tariq', area: 'Sundar Industrial', ticket: 'SP-HAF-88250', duration: '7:26', category: 'Missed Collection', status: 'Resolved', callId: 'CALL-2996' },
    { time: '15:88', caller: 'Sana Javed', area: 'Bahria Town', ticket: 'SP-HAF-93488', duration: '0:47', category: 'Overflowing Bin', status: 'Escalated', callId: 'CALL-2995' },
    { time: '08:25', caller: 'Hassan Ali', area: 'Ichra', ticket: 'SP-KHU-35584', duration: '7:28', category: 'Dead Animal', status: 'Resolved', callId: 'CALL-2994' },
    { time: '16:14', caller: 'Kashif Mehmood', area: 'Bahria Town', ticket: 'SP-KHU-30629', duration: '4:59', category: 'Missed Collection', status: 'Resolved', callId: 'CALL-2993' },
    { time: '08:12', caller: 'Fatima Bibi', area: 'Wahdat Road', ticket: 'SP-TAX-99021', duration: '4:43', category: 'Missed Collection', status: 'Resolved', callId: 'CALL-2992' },
    { time: '16:25', caller: 'Bilal Hussain', area: 'Anarkali', ticket: 'SP-SIA-94531', duration: '2:22', category: 'Construction Debris', status: 'Resolved', callId: 'CALL-2991' },
  ],
};

// Generate generic call list for agents without specific data
function generateCallsForAgent(agentId: string) {
  const categories = ['Missed Collection', 'Street Sweeping', 'Drain Blockage', 'Illegal Dumping', 'Overflowing Bin', 'Dead Animal'];
  const areas = ['Model Town', 'Johar Town', 'Cantt', 'DHA Phase 5', 'Gulberg III', 'Shadman', 'Iqbal Town'];
  const prefixes = ['SP-LAH', 'SP-KHU', 'SP-RAW', 'SP-TAX', 'SP-GUJ', 'SP-MUL', 'SP-SIA'];
  const callers = ['Ahmed Khan', 'Sara Bibi', 'Tariq Javed', 'Hina Malik', 'Asad Ali', 'Zainab Noor', 'Bilal Hussain', 'Fatima Asif'];
  return Array.from({ length: 10 }, (_, i) => ({
    time: `${String(Math.floor(8 + Math.random() * 12)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
    caller: callers[i % callers.length],
    area: areas[i % areas.length],
    ticket: `${prefixes[i % prefixes.length]}-${Math.floor(10000 + Math.random() * 89999)}`,
    duration: `${Math.floor(1 + Math.random() * 8)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
    category: categories[i % categories.length],
    status: (i % 5 === 2 ? 'Escalated' : 'Resolved') as 'Resolved' | 'Escalated',
    callId: `CALL-${2980 + i}`,
  }));
}

export default function AgentCallLog() {
  const { agentId } = useParams();
  const navigate = useNavigate();
  const agent = agentId ? getAgentById(agentId) : agents[0];
  if (!agent) return <div className="text-gray-500 p-8">Agent not found</div>;

  const callList = AGENT_CALLS[agent.id] || generateCallsForAgent(agent.id);

  return (
    <div className="space-y-4">
      <BackButton label={`← ${agent.name}`} to={`/agents/${agent.id}`} />

      <div>
        <h2 className="text-xl font-bold text-white">Call Log — {agent.name}</h2>
        <p className="text-sm mt-0.5" style={{ color: '#6b7280' }}>Recent call assignments and resolutions</p>
      </div>

      <div className="rounded-lg overflow-hidden bg-[#111827] border border-gray-800 rounded-xl">
        {callList.map((call, i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-5 py-3.5 cursor-pointer transition-all"
            style={{ borderBottom: '1px solid #1a2030' }}
            
            
            // Original goes directly to NLP Analysis, not Call Detail
            onClick={() => navigate(`/agents/${agent.id}/calls/${call.callId}/nlp`)}
          >
            {/* Time */}
            <span className="text-xs font-mono w-12 flex-shrink-0" style={{ color: '#6b7280' }}>{call.time}</span>
            {/* Name + Area + Ticket */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">{call.caller} — {call.category}</p>
              <p className="text-xs" style={{ color: '#6b7280' }}>{call.area} • {call.ticket} • {call.duration}</p>
            </div>
            {/* Status badge */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-sm"
                style={{ backgroundColor: call.status === 'Resolved' ? '#10b981' : '#ef4444', color: '#fff' }}
              >
                {call.status}
              </span>
              <span style={{ color: '#374151' }}>—</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
