// TriageTranscript.tsx — Transcript page reached from Triage → Category → Subtype → Call
// Same chat bubble UI but with triage-aware routing
import { useParams } from 'react-router-dom';
import { getCallById, calls } from '../../data/mockData';
import { BackButton } from '../shared/Breadcrumb';
import GreenActionButton from '../shared/GreenActionButton';

export default function TriageTranscript() {
  const { category: catId, subtype: subtypeId, callId } = useParams();
  const call = callId ? getCallById(callId) : calls[0];

  if (!call) return <div className="text-gray-500 p-8">Transcript not found</div>;

  const backPath = `/triage/${catId}/${subtypeId}`;
  const nlpPath = `/triage/${catId}/${subtypeId}/${call.callId}/nlp`;

  return (
    <div className="space-y-4">
      <BackButton label="← Subtype Detail" to={backPath} />

      <div className="rounded-lg overflow-hidden bg-[#111827] border border-gray-800 rounded-xl">
        <div className="px-5 py-3" style={{ borderBottom: '1px solid #1f2937' }}>
          <h2 className="text-base font-semibold text-white">Transcript — {call.callId}</h2>
          <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>{call.caller} • {call.area} • {call.language}</p>
        </div>

        {/* Chat bubbles */}
        <div className="p-4 space-y-4 overflow-y-auto" style={{ maxHeight: 420 }}>
          {call.transcript.map(msg => {
            if (msg.role === 'system') {
              return (
                <div key={msg.id} className="text-center">
                  <span className="text-xs italic px-3 py-1 rounded-full" style={{ color: '#6b7280', backgroundColor: '#1a2030' }}>
                    {msg.text}
                  </span>
                </div>
              );
            }
            if (msg.role === 'citizen') {
              return (
                <div key={msg.id} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1" style={{ backgroundColor: '#374151', color: '#d1d5db' }}>C</div>
                  <div className="max-w-md">
                    <div className="rounded-lg px-4 py-2.5" style={{ backgroundColor: '#1f2937' }}>
                      <p className="text-sm" style={{ color: '#d1d5db' }}>{msg.text}</p>
                    </div>
                    <p className="text-xs mt-1" style={{ color: '#4b5563' }}>{msg.time}</p>
                  </div>
                </div>
              );
            }
            if (msg.role === 'ai') {
              return (
                <div key={msg.id} className="flex items-start gap-3 justify-end">
                  <div className="max-w-md">
                    <div className="rounded-lg px-4 py-2.5" style={{ backgroundColor: '#312e81' }}>
                      <p className="text-sm" style={{ color: '#e0e7ff' }}>{msg.text}</p>
                    </div>
                    <p className="text-xs mt-1 text-right" style={{ color: '#4b5563' }}>{msg.time}</p>
                  </div>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1" style={{ backgroundColor: '#4f46e5', color: '#fff' }}>AI</div>
                </div>
              );
            }
            return (
              <div key={msg.id} className="flex items-start gap-3 justify-end">
                <div className="max-w-md">
                  <div className="rounded-lg px-4 py-2.5" style={{ backgroundColor: '#065f46' }}>
                    <p className="text-xs font-semibold mb-1" style={{ color: '#6ee7b7' }}>{msg.agentName}</p>
                    <p className="text-sm" style={{ color: '#d1fae5' }}>{msg.text}</p>
                  </div>
                  <p className="text-xs mt-1 text-right" style={{ color: '#4b5563' }}>{msg.time}</p>
                </div>
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1" style={{ backgroundColor: '#10b981', color: '#fff' }}>H</div>
              </div>
            );
          })}
        </div>

        <div className="px-4 pb-4">
          <GreenActionButton label="NLP Analysis →" to={nlpPath} />
        </div>
      </div>
    </div>
  );
}
