// GreenActionButton.tsx — Full-width green CTA button
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

interface GreenActionButtonProps {
  label: string;
  to: string;
}

export default function GreenActionButton({ label, to }: GreenActionButtonProps) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(to)}
      className="w-full flex items-center justify-between px-6 py-4 rounded-lg text-sm font-semibold transition-all duration-200 mt-4"
      style={{ backgroundColor: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}
      
      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'rgba(16,185,129,0.15)')}
    >
      <span>{label}</span>
      <ArrowRight size={16} />
    </button>
  );
}
