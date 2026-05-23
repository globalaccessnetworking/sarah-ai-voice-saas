// ResolutionChainTriage.tsx — TRIAGE VERSION: Numbered steps + Linked Records two-column layout
// Matches screenshot: Left=Resolution Path (numbered 1-6), Right=Linked Records panel
import { useParams } from 'react-router-dom';
import { getCallById, calls } from '../../data/mockData';
import { BackButton } from '../shared/Breadcrumb';
import GreenActionButton from '../shared/GreenActionButton';

interface ResolutionStep {
  num: number;
  title: string;
  statusLabel: string;
  statusColor: string;
  desc: string;
  circleColor: string;
}

function buildSteps(call: ReturnType<typeof getCallById>): ResolutionStep[] {
  if (!call) return [];
  const isEscalated = call.status === 'Escalated';
  return [
    {
      num: 1, title: 'Intake', statusLabel: 'Complete', statusColor: '#10b981', circleColor: '#10b981',
      desc: `AI received call at ${call.timestamp}`,
    },
    {
      num: 2, title: 'Classification', statusLabel: 'Complete', statusColor: '#10b981', circleColor: '#10b981',
      desc: `${call.category} — ${call.priority} — ${call.priority === 'P3' ? 'Medium' : call.priority === 'P2' ? 'High' : call.priority === 'P4' ? 'Low' : 'Critical'}`,
    },
    {
      num: 3, title: 'Routing', statusLabel: 'Complete', statusColor: '#10b981', circleColor: '#10b981',
      desc: isEscalated ? 'AI routed for human review' : 'AI auto-handled',
    },
    {
      num: 4, title: 'Action', statusLabel: isEscalated ? 'Pending' : 'Complete', statusColor: isEscalated ? '#f97316' : '#10b981', circleColor: isEscalated ? '#f97316' : '#10b981',
      desc: isEscalated ? `Escalated: ${call.escalationReason}` : 'Resolved by AI',
    },
    {
      num: 5, title: 'Verification', statusLabel: isEscalated ? 'Awaiting' : 'Complete', statusColor: isEscalated ? '#6b7280' : '#10b981', circleColor: isEscalated ? '#374151' : '#10b981',
      desc: isEscalated ? 'Pending field verification' : 'SMS confirmation sent',
    },
    {
      num: 6, title: 'Closure', statusLabel: isEscalated ? 'Open' : 'Complete', statusColor: isEscalated ? '#6b7280' : '#10b981', circleColor: isEscalated ? '#374151' : '#10b981',
      desc: isEscalated ? 'Awaiting resolution' : 'Case closed in system',
    },
  ];
}

export default function ResolutionChainTriage() {
  const { category: catId, subtype: subtypeId, callId } = useParams();
  const call = callId ? getCallById(callId) : calls[0];

  if (!call) return <div className="text-gray-500 p-8">Call not found</div>;

  const backPath = `/triage/${catId}/${subtypeId}/${call.callId}/nlp`;
  const auditPath = `/triage/${catId}/${subtypeId}/${call.callId}/nlp/resolution/audit`;

  const steps = buildSteps(call);
  const ticketNum = `#${Math.floor(20000 + Math.random() * 15000)}`;

  return (
    <div className="space-y-4">
      <BackButton label="← NLP Analysis" to={backPath} />
      <div>
        <h2 className="text-xl font-bold text-white">Resolution Chain — {call.callId}</h2>
        <p className="text-sm mt-0.5" style={{ color: '#6b7280' }}>{call.caller} • {call.category} • {call.area}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Left: Resolution Path */}
        <div className="rounded-lg p-5 bg-[#111827] border border-gray-800 rounded-xl">
          <h3 className="text-sm font-semibold text-white mb-5">Resolution Path</h3>
          <div className="relative">
            {/* Vertical connector line */}
            <div
              className="absolute"
              style={{ left: 15, top: 20, bottom: 8, width: 2, backgroundColor: '#1f2937', zIndex: 0 }}
            />
            <div className="space-y-0">
              {steps.map((step, i) => (
                <div key={step.num} className="flex items-start gap-4 pb-5 relative">
                  {/* Numbered circle */}
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 z-10"
                    style={{
                      backgroundColor: step.circleColor + '22',
                      color: step.circleColor,
                      border: `2px solid ${step.circleColor}`,
                    }}
                  >
                    {step.num}
                  </div>
                  {/* Content */}
                  <div className="flex-1 pt-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">{step.title}</span>
                      <span className="text-xs font-bold" style={{ color: step.statusColor }}>
                        — {step.statusLabel}
                      </span>
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
              {
                label: 'Complaint Ticket',
                value: ticketNum,
                sub: 'Filed in system',
                valueColor: '#10b981',
              },
              {
                label: 'Dispatch Order',
                value: call.status === 'Escalated' ? 'Pending' : 'Assigned',
                sub: 'Field team assigned',
                valueColor: call.status === 'Escalated' ? '#f97316' : '#10b981',
              },
              {
                label: 'Photo Evidence',
                value: call.whatsappImage ? '1 image' : '0 images',
                sub: call.whatsappImage ? 'Submitted via WhatsApp' : 'No photo provided',
                valueColor: call.whatsappImage ? '#10b981' : '#6b7280',
              },
              {
                label: 'Caller History',
                value: `${call.priorComplaints} prior calls`,
                sub: call.priorComplaints > 0 ? 'Repeat caller' : 'Recent: Nil',
                valueColor: call.priorComplaints > 0 ? '#f97316' : '#d1d5db',
              },
              {
                label: 'Cost Record',
                value: `PKR ${call.costSaved} saved`,
                sub: 'AI system tracked',
                valueColor: '#10b981',
              },
            ].map(({ label, value, sub, valueColor }) => (
              <div
                key={label}
                className="flex items-start justify-between py-3"
                style={{ borderBottom: '1px solid #1a2030' }}
              >
                <div>
                  <p className="text-xs font-semibold" style={{ color: '#6b7280' }}>{label}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#4b5563' }}>{sub}</p>
                </div>
                <span className="text-sm font-bold text-right" style={{ color: valueColor }}>{value}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-4">
            <GreenActionButton label="View Full Audit Trail →" to={auditPath} />
          </div>
        </div>
      </div>
    </div>
  );
}
