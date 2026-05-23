// AnalyticsResolutionChain.tsx — Resolution Chain in Analytics call path
// Same two-column numbered steps design as original
// Back: ← NLP Analysis   Right panel: View Full Audit Trail →
import { useParams } from 'react-router-dom';
import { getCallById, calls } from '../../data/mockData';
import { BackButton } from '../shared/Breadcrumb';
import GreenActionButton from '../shared/GreenActionButton';

export default function AnalyticsResolutionChain() {
  const { district: distId, area: areaName, callId } = useParams();
  const call = callId ? getCallById(callId) : calls[0];
  if (!call) return <div className="text-gray-500 p-8">Call not found</div>;

  const backPath = `/analytics/${distId}/${areaName}/${call.callId}/nlp`;
  const auditPath = `/analytics/${distId}/${areaName}/${call.callId}/nlp/resolution/audit`;

  const isEscalated = call.status === 'Escalated';
  const priority = call.priority === 'P1' ? 'Critical' : call.priority === 'P2' ? 'High' : call.priority === 'P3' ? 'Medium' : 'Low';
  const ticketNum = `#${(parseInt(call.id, 10) * 2547 + 10000) % 90000 + 10000}`;
  const satisfactionScore = call.repeatCaller ? '2/5' : '3/5';

  const steps = [
    { num: 1, title: 'Intake', statusLabel: 'Complete', statusColor: '#10b981', circleColor: '#10b981', desc: `AI received call at ${call.timestamp}` },
    { num: 2, title: 'Classification', statusLabel: 'Complete', statusColor: '#10b981', circleColor: '#10b981', desc: `${call.category} — ${call.priority} — ${priority}` },
    { num: 3, title: 'Routing', statusLabel: 'Complete', statusColor: '#10b981', circleColor: '#10b981', desc: isEscalated ? 'AI auto-handled' : 'AI auto-handled' },
    {
      num: 4, title: 'Action',
      statusLabel: isEscalated ? 'Pending' : 'Complete',
      statusColor: isEscalated ? '#f97316' : '#10b981',
      circleColor: isEscalated ? '#f97316' : '#10b981',
      desc: isEscalated ? `Escalated: ${call.escalationReason || 'Language barrier'}` : 'Scheduled — ticket dispatched',
    },
    {
      num: 5, title: 'Verification',
      statusLabel: isEscalated ? 'Awaiting' : 'Complete',
      statusColor: isEscalated ? '#6b7280' : '#10b981',
      circleColor: isEscalated ? '#374151' : '#10b981',
      desc: isEscalated ? 'Pending field verification' : 'Double-tap verified',
    },
    {
      num: 6, title: 'Closure',
      statusLabel: isEscalated ? 'Open' : 'Closed',
      statusColor: isEscalated ? '#6b7280' : '#10b981',
      circleColor: isEscalated ? '#374151' : '#10b981',
      desc: isEscalated ? 'Awaiting resolution' : `Satisfaction: ${satisfactionScore}`,
    },
  ];

  return (
    <div className="space-y-4">
      <BackButton label="← NLP Analysis" to={backPath} />
      <div>
        <h2 className="text-xl font-bold text-white">Resolution Chain — {call.callId}</h2>
        <p className="text-sm mt-0.5" style={{ color: '#6b7280' }}>{call.caller} • {call.category} • {call.area}</p>
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

        {/* Right: Linked Records + View Full Audit Trail */}
        <div className="rounded-lg p-5 flex flex-col bg-[#111827] border border-gray-800 rounded-xl">
          <h3 className="text-sm font-semibold text-white mb-4">Linked Records</h3>
          <div className="space-y-0 flex-1">
            {[
              { label: 'Complaint Ticket', sub: 'Filed in system', value: ticketNum, valueColor: '#10b981' },
              { label: 'Dispatch Order', sub: 'Field team assigned', value: isEscalated ? 'Pending' : `DO-${Math.abs(parseInt(call.id, 10) * 1337) % 8000 + 1000}`, valueColor: isEscalated ? '#f97316' : '#10b981' },
              { label: 'Photo Evidence', sub: 'Before/after required', value: call.whatsappImage ? '3 images' : '0 images', valueColor: call.whatsappImage ? '#10b981' : '#6b7280' },
              { label: 'Caller History', sub: `Repeat: ${call.repeatCaller ? 'Yes' : 'No'}`, value: `${call.priorComplaints} prior calls`, valueColor: call.priorComplaints > 0 ? '#f97316' : '#d1d5db' },
              { label: 'Cost Record', sub: 'vs human baseline', value: `PKR ${call.costSaved} saved`, valueColor: '#10b981' },
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
