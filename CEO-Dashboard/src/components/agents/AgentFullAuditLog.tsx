// AgentFullAuditLog.tsx — Complete System Audit Log from agent call path
import { useParams } from 'react-router-dom';
import { getCallById, calls } from '../../data/mockData';
import { BackButton } from '../shared/Breadcrumb';

export default function AgentFullAuditLog() {
  const { agentId, callId } = useParams();
  const call = callId ? getCallById(callId) : calls[0];
  if (!call) return <div className="text-gray-500 p-8">Call not found</div>;

  const backPath = `/agents/${agentId}/calls/${call.callId}/nlp/resolution`;
  const t = call.timestamp;
  const phone = `0312-${Math.floor(5000000 + Math.random() * 999999)}`;
  const smsPhone = `0312-${Math.floor(5000000 + Math.random() * 999999)}`;
  const ticketRef = `#${Math.floor(20000 + Math.random() * 55000)}`;
  const doRef = `DO-${Math.floor(1000 + Math.random() * 8000)}`;
  const zone = `${call.district} Zone ${Math.floor(1 + Math.random() * 12)}`;
  const quality = `${Math.floor(60 + Math.random() * 30)}`;
  const compliance = `${Math.floor(85 + Math.random() * 10)}.${Math.floor(Math.random() * 9)}`;

  const steps: { time: string; title: string; detail: string; system: string; dotColor: string }[] = [
    { time: t, title: 'Call received', detail: `Incoming from ${phone}, routed to AI queue`, system: 'PBX Gateway', dotColor: '#10b981' },
    { time: t, title: 'AI engaged', detail: `Language detected: ${call.language}, confidence ${Math.floor(90 + Math.random() * 9)}.${Math.floor(Math.random() * 9)}%`, system: 'SP-NLU-v4.0', dotColor: '#10b981' },
    { time: t, title: 'NLP processing', detail: `Entities extracted: ${call.category === 'Hazardous Waste' ? 'overflowing, bin, smell' : 'sweeper, absent, dirty'}`, system: 'SP-NLU-v4.0', dotColor: '#10b981' },
    { time: t, title: 'Category classified', detail: `${call.category} — confidence ${Math.floor(70 + Math.random() * 20)}.${Math.floor(Math.random() * 9)}%`, system: 'SP-Triage v4.7', dotColor: '#10b981' },
    { time: t, title: 'Urgency assessed', detail: `${call.priority} — ${call.priority === 'P4' ? 'Low' : call.priority === 'P3' ? 'Medium' : 'High'} — sentiment ${call.sentiment} (${call.sentimentScore.toFixed(2)})`, system: 'SP-Triage v4.7', dotColor: '#10b981' },
    { time: t, title: 'Routed to human', detail: `Transferred to ${call.escalationAssignedTo || 'Amir Hassan'} — warm handoff completed`, system: 'AI Resolution Engine', dotColor: '#10b981' },
    { time: t, title: 'Ticket created', detail: `Ref ${ticketRef}, ${doRef} assigned to ${zone}`, system: 'Complaint Management', dotColor: '#3b82f6' },
    { time: t, title: 'SMS confirmation', detail: `Sent to ${smsPhone}: complaint registered, ref provided`, system: 'Notification Service', dotColor: '#3b82f6' },
    { time: t, title: 'Quality score logged', detail: `Call quality: ${quality}%, compliance: ${compliance}%`, system: 'QA Engine', dotColor: '#3b82f6' },
    { time: t, title: 'Cost computed', detail: `Call cost: PKR ${Math.floor(0.02 * call.costSaved)}, savings: PKR ${call.costSaved} vs human baseline`, system: 'Finance Module', dotColor: '#3b82f6' },
  ];

  return (
    <div className="space-y-4">
      <BackButton label="← Resolution Chain" to={backPath} />

      <div className="rounded-lg p-6 bg-[#111827] border border-gray-800 rounded-xl">
        <h2 className="text-lg font-bold text-white mb-6">Complete System Audit Log</h2>
        <div className="relative">
          <div className="absolute" style={{ left: 7, top: 12, bottom: 12, width: 2, backgroundColor: '#1f2937' }} />
          <div className="space-y-0">
            {steps.map((step, i) => (
              <div key={i} className="flex items-start gap-5 pb-5 relative">
                <div className="w-4 h-4 rounded-full flex-shrink-0 mt-1 z-10" style={{ backgroundColor: step.dotColor, border: `2px solid ${step.dotColor}44` }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono" style={{ color: '#6b7280' }}>{step.time}</span>
                    <span className="text-sm font-bold text-white">{step.title}</span>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>{step.detail}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#4b5563' }}>System: {step.system}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
