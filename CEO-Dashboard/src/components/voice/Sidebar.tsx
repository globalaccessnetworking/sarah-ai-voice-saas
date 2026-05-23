// Sidebar.tsx — Left navigation matching exact original design
import { useLocation, useNavigate } from 'react-router-dom';
import { ClipboardList, ShieldCheck, Rocket } from 'lucide-react';

const navItems = [
  {
    path: '/',
    label: 'Live Call Monitor',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.79 19.79 19.79 0 01.11 1.1 2 2 0 012 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14z"/>
      </svg>
    ),
    activeColor: '#ec4899',
  },
  {
    path: '/triage',
    label: 'AI Triage Engine',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
      </svg>
    ),
    activeColor: '#a855f7',
  },
  {
    path: '/agents',
    label: 'Agent Performance',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
    ),
    activeColor: '#a855f7',
  },
  {
    path: '/analytics',
    label: 'Call Analytics',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
    ),
    activeColor: '#3b82f6',
  },
  {
    path: '/escalations',
    label: 'Escalation Queue',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    ),
    activeColor: '#eab308',
  },
  {
    path: '/cost',
    label: 'Cost & ROI',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
      </svg>
    ),
    activeColor: '#f97316',
  },
  {
    path: '/registry',
    label: 'Complaint Registry',
    icon: <ClipboardList size={18} strokeWidth={2} />,
    activeColor: '#14b8a6', /* teal-500 */
  },
  {
    path: '/verifications',
    label: 'Verification Registry',
    icon: <ShieldCheck size={18} strokeWidth={2} />,
    activeColor: '#0ea5e9', /* sky-500 */
  },
  {
    path: '/outbound',
    label: 'Outbound HUD',
    icon: <Rocket size={18} strokeWidth={2} />,
    activeColor: '#6366f1', /* indigo-500 */
  },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <aside
      className="flex flex-col h-full"
      style={{ width: 200, backgroundColor: '#0d1117', borderRight: '1px solid #1f2937', flexShrink: 0 }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5" style={{ borderBottom: '1px solid #1f2937' }}>
        <div
          className="flex items-center justify-center w-9 h-9 rounded-lg text-sm font-bold text-white"
          style={{ backgroundColor: '#10b981', flexShrink: 0 }}
        >
          SP
        </div>
        <div>
          <p className="text-sm font-semibold text-white leading-tight">AI Voice Center</p>
          <p className="text-xs leading-tight" style={{ color: '#6b7280' }}>Call Triage & Analytics</p>
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-3">
        {navItems.map(item => {
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm transition-all duration-150 text-left"
              style={{
                color: active ? item.activeColor : '#6b7280',
                borderLeft: active ? `3px solid ${item.activeColor}` : '3px solid transparent',
                backgroundColor: active ? 'rgba(255,255,255,0.04)' : 'transparent',
              }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.color = '#9ca3af'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'; } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.color = '#6b7280'; e.currentTarget.style.backgroundColor = 'transparent'; } }}
            >
              <span style={{ color: active ? item.activeColor : '#4b5563' }}>{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom Live Badge */}
      <div
        className="px-4 py-3 flex items-center gap-2"
        style={{ borderTop: '1px solid #1f2937' }}
      >
        <span className="live-dot w-2 h-2 rounded-full inline-block" style={{ backgroundColor: '#10b981', flexShrink: 0 }} />
        <span className="text-xs" style={{ color: '#6b7280' }}>LIVE • 150→20 agents</span>
      </div>
    </aside>
  );
}
