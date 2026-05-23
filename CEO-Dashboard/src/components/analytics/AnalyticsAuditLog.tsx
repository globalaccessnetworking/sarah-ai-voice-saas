// AnalyticsAuditLog.tsx — Full Audit Log for Call Analytics path
// Title format: "Audit Trail — CALL-XXXX" (matches original exactly)
// Subtitle: "Complete System Audit Log"
import { useParams } from 'react-router-dom';
import { getCallById, calls } from '../../data/mockData';
import { BackButton } from '../shared/Breadcrumb';

export default function AnalyticsAuditLog() {
  const { district: distId, area: areaName, callId } = useParams();
  const call = callId ? getCallById(callId) : calls[0];
  if (!call) return <div className="text-gray-500 p-8">Call not found</div>;

  const backPath = `/analytics/${distId}/${areaName}/${call.callId}/nlp/resolution`;
  const t = call.timestamp;
  const callerPhone = `0${Math.floor(300 + Math.random() * 15)}-${Math.floor(1000000 + Math.random() * 8999999)}`;
  const smsPhone = callerPhone;
  const ticketRef = `#${(parseInt(call.id, 10) * 2547 + 10000) % 90000 + 10000}`;
  const distName = call.district || 'Lahore';
  const zone = `${distName} Zone ${Math.floor(1 + (parseInt(call.id, 10) % 12))}`;
  const quality = `${Math.floor(70 + (parseInt(call.id, 10) % 25))}.${Math.floor(parseInt(call.id, 10) % 9)}`;
  const compliance = `${Math.floor(85 + (parseInt(call.id, 10) % 12))}.${Math.floor(parseInt(call.id, 10) % 9)}`;
  const callCost = Math.floor(call.costSaved * 0.15);

  const isEscalated = call.status === 'Escalated';
  const escalationAgent = call.escalationAssignedTo || 'Tariq Mahmood';
  const escalationReason = call.escalationReason || 'Language barrier';

  const steps: { time: string; title: string; detail: string; system: string; dotColor: string }[] = [
    {
      time: t, title: 'Call received',
      detail: `Incoming from ${callerPhone}, routed to AI queue`,
      system: 'PBX Gateway', dotColor: '#10b981',
    },
    {
      time: t, title: 'AI engaged',
      detail: `Language detected: ${call.language}, confidence ${(88 + parseInt(call.id, 10) % 10).toFixed(1)}%`,
      system: 'SP-NLU-v2.9', dotColor: '#10b981',
    },
    {
      time: t, title: 'NLP processing',
      detail: `Entities extracted: ${call.category === 'Drain Blockage' ? 'overflowing, bin, smell' : call.category === 'Missed Collection' ? 'sweeper, absent, dirty' : call.category === 'Hazardous Waste' ? 'chemical, toxic, hazard' : 'waste, area, complaint'}`,
      system: 'SP-NLU-v2.9', dotColor: '#10b981',
    },
    {
      time: t, title: 'Category classified',
      detail: `${call.category} — confidence ${(70 + parseInt(call.id, 10) % 20).toFixed(1)}%`,
      system: 'SP-Triage-v1.1', dotColor: '#10b981',
    },
    {
      time: t, title: 'Urgency assessed',
      detail: `${call.priority} — ${call.priority === 'P3' ? 'Medium' : call.priority === 'P2' ? 'High' : 'Low'} — sentiment: ${call.sentiment} (${call.sentimentScore.toFixed(2)})`,
      system: 'SP-Triage-v4.1', dotColor: '#10b981',
    },
    isEscalated
      ? {
        time: t, title: 'Escalated to human',
        detail: `Reason: ${escalationReason} → ${escalationAgent}`,
        system: 'AI Resolution Engine', dotColor: '#10b981',
      }
      : {
        time: t, title: 'AI resolved',
        detail: `Scheduled and confirmed. Complaint auto-handled end-to-end.`,
        system: 'AI Resolution Engine', dotColor: '#10b981',
      },
    {
      time: t, title: 'Ticket created',
      detail: `Ref ${ticketRef}, assigned to ${zone}`,
      system: 'Complaint Management', dotColor: '#3b82f6',
    },
    {
      time: t, title: 'SMS confirmation',
      detail: `Sent to ${smsPhone}: complaint registered, ref provided`,
      system: 'Notification Service', dotColor: '#3b82f6',
    },
    {
      time: t, title: 'Quality score logged',
      detail: `Call quality: ${quality}%, compliance: ${compliance}%`,
      system: 'QA Engine', dotColor: '#3b82f6',
    },
    {
      time: t, title: 'Cost computed',
      detail: `Call cost: PKR ${callCost}, savings: PKR ${call.costSaved}`,
      system: 'Finance Module', dotColor: '#3b82f6',
    },
  ];

  return (
    <div className="space-y-4">
      <BackButton label="← Resolution Chain" to={backPath} />

      <div className="rounded-lg p-6 bg-[#111827] border border-gray-800 rounded-xl">
        {/* Title matches original: "Audit Trail — CALL-XXXX" */}
        <h2 className="text-lg font-bold text-white mb-1">Audit Trail — {call.callId}</h2>
        <p className="text-sm mb-6" style={{ color: '#6b7280' }}>Complete System Audit Log</p>

        <div className="relative">
          <div className="absolute" style={{ left: 7, top: 12, bottom: 12, width: 2, backgroundColor: '#1f2937' }} />
          <div className="space-y-0">
            {steps.map((step, i) => (
              <div key={i} className="flex items-start gap-5 pb-5 relative">
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0 mt-0.5 z-10"
                  style={{ backgroundColor: step.dotColor, border: `2px solid ${step.dotColor}44` }}
                />
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
