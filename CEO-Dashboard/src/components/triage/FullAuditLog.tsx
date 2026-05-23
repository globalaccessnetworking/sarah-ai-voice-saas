// FullAuditLog.tsx — Complete System Audit Log (deepest level in Triage chain)
// Matches screenshot: 10 detailed steps with subsystem names + phone numbers
import { useParams } from 'react-router-dom';
import { getCallById, calls } from '../../data/mockData';
import { BackButton } from '../shared/Breadcrumb';

interface AuditStep {
  time: string;
  title: string;
  detail: string;
  system: string;
  dotColor: 'green' | 'blue';
}

function buildAuditSteps(call: ReturnType<typeof getCallById>): AuditStep[] {
  if (!call) return [];
  const t = call.timestamp;
  const phone = `0312-${Math.floor(5000000 + Math.random() * 999999)}`;
  const smsPhone = `0312-${Math.floor(5000000 + Math.random() * 999999)}`;
  const ticketRef = `#${Math.floor(20000 + Math.random() * 15000)}`;
  const zone = `${call.district} Zone ${Math.floor(1 + Math.random() * 12)}`;
  const quality = `${Math.floor(60 + Math.random() * 30)}`;
  const compliance = `${Math.floor(85 + Math.random() * 10)}.${Math.floor(Math.random() * 9)}`;
  const conf = `${Math.floor(88 + Math.random() * 9)}.${Math.floor(Math.random() * 9)}`;
  const catConf = `${Math.floor(70 + Math.random() * 20)}.${Math.floor(Math.random() * 9)}`;

  return [
    {
      time: t, title: 'Call received',
      detail: `Incoming from ${phone}, routed to AI queue`,
      system: 'PBX Gateway', dotColor: 'green',
    },
    {
      time: t, title: 'AI engaged',
      detail: `Language detected: ${call.language}, confidence ${conf}%`,
      system: 'SP-NLU-v4.0', dotColor: 'green',
    },
    {
      time: t, title: 'NLP processing',
      detail: `Entities extracted: ${call.category === 'Missed Collection' ? 'sweeper, absent, dirty' : call.category === 'Street Sweeping' ? 'street, dirt, unswept' : call.category === 'Dead Animal' ? 'carcass, road, smell' : 'waste, illegal, road'}`,
      system: 'SP-NLU-v4.0', dotColor: 'green',
    },
    {
      time: t, title: 'Category classified',
      detail: `${call.category} — confidence ${catConf}%`,
      system: 'SP-Triage v4.7', dotColor: 'green',
    },
    {
      time: t, title: 'Urgency assessed',
      detail: `${call.priority} — ${call.priority === 'P3' ? 'Medium' : call.priority === 'P2' ? 'High' : call.priority === 'P4' ? 'Low' : 'Critical'} — sentiment ${call.sentiment} (${call.sentimentScore.toFixed(2)})`,
      system: 'SP-Triage v4.7', dotColor: 'green',
    },
    call.status === 'Escalated'
      ? {
          time: t, title: 'Escalated to human',
          detail: `Reason: ${call.escalationReason} → ${call.escalationAssignedTo}`,
          system: 'AI Resolution Engine', dotColor: 'green' as const,
        }
      : {
          time: t, title: 'AI resolved',
          detail: `Complaint confirmed and registered in system`,
          system: 'AI Resolution Engine', dotColor: 'green' as const,
        },
    {
      time: t, title: 'Ticket created',
      detail: `Ref ${ticketRef}, assigned to ${zone}`,
      system: 'Complaint Management', dotColor: 'blue',
    },
    {
      time: t, title: 'SMS confirmation',
      detail: `Sent to ${smsPhone}: complaint registered, ref provided`,
      system: 'Notification Service', dotColor: 'blue',
    },
    {
      time: t, title: 'Quality score logged',
      detail: `Call quality: ${quality}%, compliance: ${compliance}%`,
      system: 'QA Engine', dotColor: 'blue',
    },
    {
      time: t, title: 'Cost computed',
      detail: `Call cost: PKR ${Math.floor(0.02 * call.costSaved)}, savings: PKR ${call.costSaved}`,
      system: 'Finance Module', dotColor: 'blue',
    },
  ];
}

const dotColors = { green: '#10b981', blue: '#3b82f6' };

export default function FullAuditLog() {
  const { category: catId, subtype: subtypeId, callId } = useParams();
  const call = callId ? getCallById(callId) : calls[0];

  if (!call) return <div className="text-gray-500 p-8">Call not found</div>;

  const backPath = `/triage/${catId}/${subtypeId}/${call.callId}/nlp/resolution`;
  const steps = buildAuditSteps(call);

  return (
    <div className="space-y-4">
      <BackButton label="← Resolution Chain" to={backPath} />

      <div className="rounded-lg p-6 bg-[#111827] border border-gray-800 rounded-xl">
        <h2 className="text-lg font-bold text-white mb-6">Complete System Audit Log</h2>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute" style={{ left: 7, top: 12, bottom: 12, width: 2, backgroundColor: '#1f2937' }} />

          <div className="space-y-0">
            {steps.map((step, i) => (
              <div key={i} className="flex items-start gap-5 pb-5 relative">
                {/* Dot */}
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0 mt-1 z-10"
                  style={{
                    backgroundColor: dotColors[step.dotColor],
                    border: `2px solid ${dotColors[step.dotColor]}44`,
                  }}
                />
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono" style={{ color: '#6b7280' }}>{step.time}</span>
                        <span className="text-sm font-bold text-white">{step.title}</span>
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>{step.detail}</p>
                      <p className="text-xs mt-0.5" style={{ color: '#4b5563' }}>System: {step.system}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
