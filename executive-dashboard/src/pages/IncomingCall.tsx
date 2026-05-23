import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Phone } from 'lucide-react';

const IncomingCall = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Automatically transition to dashboard after 5 seconds to simulate an answered call
    const timer = setTimeout(() => {
      navigate('/dashboard');
    }, 5000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
      {/* Header (Simplified) */}
      <div className="absolute top-0 w-full p-8 flex items-center bg-black/20">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-accent-orange rounded-lg flex items-center justify-center font-bold text-xl">SP</div>
          <div className="text-left">
            <h1 className="text-lg font-bold leading-none">Suthra Punjab · AI Voice Call Center</h1>
            <p className="text-xs text-gray-400 mt-1">1139 Helpline · Lahore Pilot</p>
          </div>
        </div>
      </div>

      <div className="relative flex flex-col items-center space-y-12">
        {/* Pulsing Radar Animation */}
        <div className="relative w-48 h-48 flex items-center justify-center">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              initial={{ scale: 0.8, opacity: 0.5 }}
              animate={{ 
                scale: [0.8, 2.2], 
                opacity: [0.5, 0] 
              }}
              transition={{ 
                duration: 2.5, 
                repeat: Infinity, 
                delay: i * 0.8, 
                ease: "easeOut" 
              }}
              className="absolute w-full h-full border-2 border-accent-emerald/30 rounded-full"
            />
          ))}
          
          <div className="relative z-10 w-24 h-24 bg-background border-4 border-accent-emerald rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.3)]">
            <Phone size={40} className="text-accent-emerald rotate-[135deg]" />
          </div>
        </div>

        {/* Call Info */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center space-y-4"
        >
          <h2 className="text-3xl font-bold tracking-tight">Incoming Call</h2>
          <div className="space-y-1">
            <p className="text-2xl font-mono text-white/90 font-medium">+92 321 4457891</p>
            <p className="text-gray-400 text-sm">Muhammad Farooq · Johar Town, Block D</p>
          </div>
          
          <div className="pt-8">
            <div className="flex items-center justify-center gap-3">
              <motion.div 
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-2 h-2 bg-accent-emerald rounded-full"
              />
              <span className="text-xs font-semibold text-accent-emerald uppercase tracking-[0.2em] animate-pulse">
                AI Agent answering...
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default IncomingCall;
