// AgentHandoff.tsx — REWRITTEN to match original exactly:
// LEFT: "Handoff Timeline" with 6 numbered green circle steps
// RIGHT: "Agent Performance on This Call" with Agent/Handle Time/Satisfaction/Resolution/Note + "View Full Call Detail →"
import { useParams } from 'react-router-dom';
import { getEscalationByCallId, escalations } from '../../data/mockData';
import { BackButton } from '../shared/Breadcrumb';
import GreenActionButton from '../shared/GreenActionButton';

export default function AgentHandoff() {
  const { callId } = useParams();
  const esc = callId ? getEscalationByCallId(callId) : escalations[0];
  if (!esc) return <div className="text-gray-500 p-8">Escalation not found</div>;

  const resolutionPath = `/escalations/${esc.callId}/analysis/handoff/resolution`;

  // Handoff Timeline — 6 numbered steps (all green)
  const timelineSteps = [
    { title: 'AI call started', desc: 'Automated greeting + intake' },
    { title: 'Issue detected', desc: `Category: ${esc.category}; Urgency: ${esc.urgency} — Medium` },
    { title: 'Escalation triggered', desc: `Reason: ${esc.reason}` },
    { title: 'Agent assigned', desc: `${esc.assignedTo} picked up` },
    { title: 'Context transferred', desc: 'AI transcript + NLU entities passed to agent console' },
    { title: 'In progress', desc: 'Agent handling' },
  ];

  const handleMins = `${Math.floor(2 + esc.conversationTurns / 3)} min`;
  const satisfaction = esc.callerSentiment === 'Happy' ? '5/5' : esc.callerSentiment === 'Neutral' ? '4/5' : '3/5';

  return (
    <div className="space-y-4">
      <BackButton label="← Escalation Analysis" to={`/escalations/${esc.callId}/analysis`} />
      <h2 className="text-xl font-bold text-white">Agent Handoff — {esc.callId}</h2>

      <div className="grid grid-cols-2 gap-4">
        {/* Left: Handoff Timeline — numbered steps with green circles */}
        <div className="rounded-lg p-5 bg-[#111827] border border-gray-800 rounded-xl">
          <h3 className="text-sm font-semibold text-white mb-5">Handoff Timeline</h3>
          <div className="relative">
            <div className="absolute" style={{ left: 15, top: 20, bottom: 8, width: 2, backgroundColor: '#1f2937', zIndex: 0 }} />
            <div className="space-y-0">
              {timelineSteps.map((step, i) => (
                <div key={i} className="flex items-start gap-4 pb-5 relative">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 z-10"
                    style={{ backgroundColor: '#10b981' + '22', color: '#10b981', border: '2px solid #10b981' }}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="text-sm font-semibold text-white">{step.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Agent Performance on This Call */}
        <div className="rounded-lg p-5 flex flex-col bg-[#111827] border border-gray-800 rounded-xl">
          <h3 className="text-sm font-semibold text-white mb-4">Agent Performance on This Call</h3>

          <div className="space-y-0 flex-1">
            {[
              { label: 'Agent', value: esc.assignedTo, valueColor: '#d1d5db' },
              { label: 'Handle Time', value: handleMins, valueColor: '#10b981' },
              { label: 'Caller Satisfaction', value: satisfaction, valueColor: '#10b981' },
              { label: 'Resolution', value: 'Escalated', valueColor: '#f97316' },
            ].map(({ label, value, valueColor }) => (
              <div key={label} className="flex justify-between py-3" style={{ borderBottom: '1px solid #1a2030' }}>
                <span className="text-sm" style={{ color: '#6b7280' }}>{label}</span>
                <span className="text-sm font-bold" style={{ color: valueColor }}>{value}</span>
              </div>
            ))}

            {/* Note with green text */}
            <div className="py-3">
              <span className="text-sm" style={{ color: '#6b7280' }}>Note</span>
              <p className="text-xs mt-1" style={{ color: '#10b981' }}>Context from AI reduced handle time by ~40%</p>
            </div>
          </div>

          <div className="mt-4">
            <GreenActionButton label="View Full Call Detail →" to={resolutionPath} />
          </div>
        </div>
      </div>
    </div>
  );
}
