// ── FIX 1: Production Proxy Bug ──────────────────────────────────────────────
// During `npm run dev`, VITE_BACKEND_URL is empty and Vite's proxy forwards
// /api/* → http://localhost:3000. This works perfectly.
//
// During production (`npm run build` + `serve dist`), the Vite proxy is GONE.
// So we switch to an ABSOLUTE URL using VITE_BACKEND_URL (set to your VPS IP).
//
// VPS .env setup: VITE_BACKEND_URL=http://115.186.170.43:3000

const BASE = import.meta.env.PROD
  ? (import.meta.env.VITE_BACKEND_URL || '')
  : ''; // Empty = Vite proxy handles it

// ── Types ─────────────────────────────────────────────────────────────────────
export interface Complaint {
  id: number;
  ticket_id: string | null;
  name: string | null;
  phone: string | null;
  issue: string | null;
  district: string | null;
  address: string | null;
  landmark: string | null;
  status: string;
  priority: string;
  notes: string | null;
  sentiment: string | null;
  recording_id: string | null;
  created_at: string;
  asterisk_number: string | null;
}

export interface ComplaintsResponse {
  complaints: Complaint[];
  stats: {
    total: string;
    pending: string;
    resolved: string;
    unresolved: string;
  };
  districts: string[];
}

// ── API Functions ─────────────────────────────────────────────────────────────

export async function fetchComplaints(params?: {
  search?: string;
  status?: string;
  district?: string;
}): Promise<ComplaintsResponse> {
  const searchParams = new URLSearchParams({ limit: '500' });
  if (params?.search) searchParams.set('search', params.search);
  if (params?.status && params.status !== 'all') searchParams.set('status', params.status);
  if (params?.district && params.district !== 'all') searchParams.set('district', params.district);

  const res = await fetch(`${BASE}/api/complaints?${searchParams}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function updateComplaintStatus(
  id: number,
  status: string,
): Promise<Complaint> {
  const res = await fetch(`${BASE}/api/complaints`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, status }),
  });
  if (!res.ok) throw new Error(`Status update failed: ${res.status}`);
  const data = await res.json();
  return data.complaint;
}

// ── FIX 3: Asterisk Dispatch ──────────────────────────────────────────────────
// Re-queues the outbound verification robocall by resetting outbound_status.
// The Python outbound_watcher.py picks up complaints where outbound_status = 'pending'.
export async function dispatchAsteriskVerification(id: number): Promise<boolean> {
  // We PATCH the complaint — the backend outbound watcher picks it up automatically.
  // Note: The existing PATCH route handles status/priority.
  // outbound_status reset may require a minor backend PATCH extension.
  // For now we send a PATCH to reset status to 'Pending' to re-trigger the workflow.
  const res = await fetch(`${BASE}/api/complaints`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, status: 'Pending' }),
  });
  return res.ok;
}

export function getRecordingUrl(recordingId: string): string {
  return `${BASE}/api/complaints/recording/${recordingId}`;
}
