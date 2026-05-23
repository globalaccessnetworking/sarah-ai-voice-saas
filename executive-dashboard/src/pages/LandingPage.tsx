import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Phone, Mic, Shield, BarChart3, Radio } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-12">
      {/* Header */}
      <div className="absolute top-0 w-full p-8 flex justify-between items-center bg-black/20 backdrop-blur-sm border-b border-white/5">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-accent-orange rounded-lg flex items-center justify-center font-bold text-xl">SP</div>
          <div className="text-left">
            <h1 className="text-lg font-bold leading-none">Suthra Punjab · AI Voice Call Center</h1>
            <p className="text-xs text-gray-400 mt-1">1139 Helpline · Lahore Pilot</p>
          </div>
        </div>
        <div className="text-[10px] text-gray-500 uppercase tracking-widest font-medium">MVP Prototype · v0.1</div>
      </div>

      {/* Main Hero */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8 max-w-2xl"
      >
        <div className="flex justify-center">
          <motion.div 
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="w-20 h-20 text-gray-500"
          >
            <Phone size={80} strokeWidth={1} />
          </motion.div>
        </div>
        
        <div className="space-y-4">
          <h2 className="text-5xl font-bold tracking-tight font-outfit">
            AI-Powered <span className="text-accent-orange">1139</span> Helpline
          </h2>
          <p className="text-gray-400 text-lg max-w-lg mx-auto leading-relaxed">
            Watch how an incoming citizen complaint is handled end-to-end by the AI system — 
            from voice call to dashboard entry — with zero human intervention.
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/incoming')}
          className="relative group bg-accent-orange text-white px-10 py-4 rounded-xl font-bold text-lg shadow-2xl shadow-accent-orange/20 overflow-hidden transition-all"
        >
          <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
          <span className="flex items-center gap-3">
            <Radio size={20} className="animate-pulse" />
            Start Live Demo
          </span>
        </motion.button>
      </motion.div>

      {/* Feature Icons */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex items-center gap-8 text-xs font-semibold text-gray-400 uppercase tracking-widest"
      >
        <div className="flex items-center gap-2">
          <Mic size={14} className="text-accent-orange" />
          Urdu Voice
        </div>
        <div className="flex items-center gap-2">
          <Shield size={14} className="text-accent-orange" />
          AI Classification
        </div>
        <div className="flex items-center gap-2">
          <BarChart3 size={14} className="text-accent-orange" />
          Dashboard Sync
        </div>
      </motion.div>
    </div>
  );
};

export default LandingPage;
