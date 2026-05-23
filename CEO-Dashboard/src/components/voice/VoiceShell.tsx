// VoiceShell.tsx — Persistent layout: Sidebar + TopBar + content area
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

export default function VoiceShell() {
  return (
    <div className="flex h-screen overflow-hidden relative" style={{ backgroundColor: '#0b0f19' }}>
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 z-10 relative">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
