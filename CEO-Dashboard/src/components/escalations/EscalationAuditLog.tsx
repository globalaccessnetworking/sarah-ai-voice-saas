// EscalationAuditLog.tsx — Full Audit Log in Escalation Queue path
// Breadcrumb: Escalation Queue › CALL-XXXX › Escalation Analysis › Agent Handoff › Resolution › Audit
// Title: "Audit Trail — CALL-XXXX" / "Complete System Audit Log"
import { useParams } from 'react-router-dom';
import { getEscalationByCallId, getCallById, escalations, calls } from '../../data/mockData';
import { BackButton } from '../shared/Breadcrumb';

export default function EscalationAuditLog() {
  const { callId } = useParams();
  const esc = callId ? getEscalationByCallId(callId) : escalations[0];
  const call = callId ? getCallById(callId) : calls[0];
  if (!esc) return <div className="text-gray-500 p-8">Escalation not found</div>;

  const backPath = `/escalations/${esc.callId}/analysis/handoff/resolution`;
  const t = esc.time;
  const callerPhone = `0${Math.floor(300 + (parseInt(esc.callId.replace(/\D/g, ''), 10) % 20))}-${Math.floor(10000000 + (parseInt(esc.callId.replace(/\D/g, ''), 10) * 7919) % 89999999)}`;
  const ticketRef = call ? `#${(parseInt(call.id, 10) * 2547 + 10000) % 90000 + 10000}` : `#${Math.floor(40000 + Math.random() * 50000)}`;
  const distName = esc.area.split(' ')[0];
  const zone = `${esc.caller.split(' ')[1] || distName} Zone ${Math.floor(1 + (parseInt(esc.callId.replace(/\D/g, ''), 10) % 12))}`;
  const savings = call?.costSaved ?? 159;
  const callCost = Math.floor(savings * 0.15);
  const quality = `${Math.floor(70 + (parseInt(esc.callId.replace(/\D/g, ''), 10) % 25))}.${Math.floor(parseInt(esc.callId.replace(/\D/g, ''), 10) % 9)}`;
  const compliance = `${Math.floor(88 + (parseInt(esc.callId.replace(/\D/g, ''), 10) % 10))}.${Math.floor(parseInt(esc.callId.replace(/\D/g, ''), 10) % 9)}`;
  const lang = call?.language ?? 'English';
  const langConfidence = `${Math.floor(80 + (parseInt(esc.callId.replace(/\D/g, ''), 10) % 18))}.${Math.floor(parseInt(esc.callId.replace(/\D/g, ''), 10) % 9)}`;
  const catConfidence = `${Math.floor(75 + (parseInt(esc.callId.replace(/\D/g, ''), 10) % 20))}.${Math.floor(parseInt(esc.callId.replace(/\D/g, ''), 10) % 9)}`;

  const priority = esc.urgency === 'P3' ? 'Medium' : esc.urgency === 'P2' ? 'High' : 'Low';
  const keywords = call?.category === 'Drain Blockage' ? 'overflowing, bin, smell'
    : call?.category === 'Missed Collection' ? 'sweeper, absent, dirty'
    : call?.category === 'Street Sweeping' ? 'overflowing, bin, smell'
    : 'waste, area, complaint';

  const steps: { time: string; title: string; detail: string; system: string; dotColor: string }[] = [
    { time: t, title: 'Call received', detail: `Incoming from ${callerPhone}, routed to AI queue`, system: 'PBX Gateway', dotColor: '#10b981' },
    { time: t, title: 'AI engaged', detail: `Language detected: ${lang}, confidence ${langConfidence}%`, system: 'SP-Voice-v3.2', dotColor: '#10b981' },
    { time: t, title: 'NLP processing', detail: `Entities extracted: ${keywords}`, system: 'SP-NLU-v2.9', dotColor: '#10b981' },
    { time: t, title: 'Category classified', detail: `${esc.category} — confidence ${catConfidence}%`, system: 'SP-Triage-v1.1', dotColor: '#10b981' },
    { time: t, title: 'Urgency assessed', detail: `${esc.urgency} — ${priority} — sentiment: ${esc.callerSentiment} (${esc.callerSentiment === 'Happy' ? '0.70' : esc.callerSentiment === 'Neutral' ? '0.10' : '-0.60'})`, system: 'SP-Triage-v4.1', dotColor: '#10b981' },
    { time: t, title: 'Escalated to human', detail: `Reason: ${esc.reason} → ${esc.assignedTo}`, system: 'AI Resolution Engine', dotColor: '#10b981' },
    { time: t, title: 'Ticket created', detail: `Ref ${ticketRef}, assigned to ${zone}`, system: 'Complaint Management', dotColor: '#3b82f6' },
    { time: t, title: 'SMS confirmation', detail: `Sent to ${callerPhone}: complaint registered, ref provided`, system: 'Notification Service', dotColor: '#3b82f6' },
    { time: t, title: 'Quality score logged', detail: `Call quality: ${quality}%, compliance: ${compliance}%`, system: 'QA Engine', dotColor: '#3b82f6' },
    { time: t, title: 'Cost computed', detail: `Call cost: PKR ${callCost}, savings: PKR ${savings}`, system: 'Finance Module', dotColor: '#3b82f6' },
  ];

  return (
    <div className="space-y-4">
      <BackButton label="← Resolution Chain" to={backPath} />

      <div className="rounded-lg p-6 bg-[#111827] border border-gray-800 rounded-xl">
        <h2 className="text-lg font-bold text-white mb-1">Audit Trail — {esc.callId}</h2>
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
