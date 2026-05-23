// EscalationResolutionChain.tsx — Resolution Chain in Escalation Queue path
// Breadcrumb: Escalation Queue › CALL-XXXX › Escalation Analysis › Agent Handoff › Resolution
// Back: ← NLP Analysis   Right: View Full Audit Trail →
import { useParams } from 'react-router-dom';
import { getEscalationByCallId, getCallById, escalations, calls } from '../../data/mockData';
import { BackButton } from '../shared/Breadcrumb';
import GreenActionButton from '../shared/GreenActionButton';

export default function EscalationResolutionChain() {
  const { callId } = useParams();
  const esc = callId ? getEscalationByCallId(callId) : escalations[0];
  const call = callId ? getCallById(callId) : calls[0];
  if (!esc) return <div className="text-gray-500 p-8">Escalation not found</div>;

  const backPath = `/escalations/${esc.callId}/analysis/handoff`;
  const auditPath = `/escalations/${esc.callId}/analysis/handoff/resolution/audit`;

  const priority = esc.urgency === 'P1' ? 'Critical' : esc.urgency === 'P2' ? 'High' : esc.urgency === 'P3' ? 'Medium' : 'Low';
  const ticketRef = call ? `#${(parseInt(call.id, 10) * 2547 + 10000) % 90000 + 10000}` : '#56001';
  const photoCount = call?.whatsappImage ? '1 images' : '0 images';
  const priorCalls = `${esc.priorCalls} prior calls`;
  const savings = call?.costSaved ?? 159;

  const steps = [
    { num: 1, title: 'Intake', statusLabel: 'Complete', statusColor: '#10b981', circleColor: '#10b981', desc: `AI received call at ${esc.time}` },
    { num: 2, title: 'Classification', statusLabel: 'Complete', statusColor: '#10b981', circleColor: '#10b981', desc: `${esc.category} — ${esc.urgency} — ${priority}` },
    { num: 3, title: 'Routing', statusLabel: 'Complete', statusColor: '#10b981', circleColor: '#10b981', desc: 'AI auto-handled' },
    { num: 4, title: 'Action', statusLabel: 'Pending', statusColor: '#f97316', circleColor: '#f97316', desc: `Escalated: ${esc.reason}` },
    { num: 5, title: 'Verification', statusLabel: 'Awaiting', statusColor: '#6b7280', circleColor: '#374151', desc: 'Pending field verification' },
    { num: 6, title: 'Closure', statusLabel: 'Open', statusColor: '#6b7280', circleColor: '#374151', desc: 'Awaiting resolution' },
  ];

  return (
    <div className="space-y-4">
      <BackButton label="← NLP Analysis" to={backPath} />
      <div>
        <h2 className="text-xl font-bold text-white">Resolution Chain — {esc.callId}</h2>
        <p className="text-sm mt-0.5" style={{ color: '#6b7280' }}>{esc.caller} • {esc.category} • {esc.area}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Left: Resolution Path — numbered steps */}
        <div className="rounded-lg p-5 bg-[#111827] border border-gray-800 rounded-xl">
          <h3 className="text-sm font-semibold text-white mb-5">Resolution Path</h3>
          <div className="relative">
            <div className="absolute" style={{ left: 15, top: 20, bottom: 8, width: 2, backgroundColor: '#1f2937', zIndex: 0 }} />
            <div className="space-y-0">
              {steps.map(step => (
                <div key={step.num} className="flex items-start gap-4 pb-5 relative">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 z-10"
                    style={{ backgroundColor: step.circleColor + '22', color: step.circleColor, border: `2px solid ${step.circleColor}` }}
                  >
                    {step.num}
                  </div>
                  <div className="flex-1 pt-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">{step.title}</span>
                      <span className="text-xs font-bold" style={{ color: step.statusColor }}>— {step.statusLabel}</span>
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Linked Records */}
        <div className="rounded-lg p-5 flex flex-col bg-[#111827] border border-gray-800 rounded-xl">
          <h3 className="text-sm font-semibold text-white mb-4">Linked Records</h3>
          <div className="space-y-0 flex-1">
            {[
              { label: 'Complaint Ticket', sub: 'Filed in system', value: ticketRef, valueColor: '#10b981' },
              { label: 'Dispatch Order', sub: 'Field team assigned', value: 'Pending', valueColor: '#f97316' },
              { label: 'Photo Evidence', sub: 'Before/after required', value: photoCount, valueColor: call?.whatsappImage ? '#10b981' : '#6b7280' },
              { label: 'Caller History', sub: `Repeat: ${esc.repeatCaller ? 'Yes' : 'No'}`, value: priorCalls, valueColor: esc.priorCalls > 0 ? '#f97316' : '#d1d5db' },
              { label: 'Cost Record', sub: 'vs human baseline', value: `PKR ${savings} saved`, valueColor: '#10b981' },
            ].map(({ label, sub, value, valueColor }) => (
              <div key={label} className="flex items-start justify-between py-3" style={{ borderBottom: '1px solid #1a2030' }}>
                <div>
                  <p className="text-xs font-semibold" style={{ color: '#6b7280' }}>{label}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#4b5563' }}>{sub}</p>
                </div>
                <span className="text-sm font-bold text-right" style={{ color: valueColor }}>{value}</span>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <GreenActionButton label="View Full Audit Trail →" to={auditPath} />
          </div>
        </div>
      </div>
    </div>
  );
}
