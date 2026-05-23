import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Phone, Mic, Shield, BarChart3 } from 'lucide-react';

const LoginPage = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      console.log('[Auth] Attempting login to /api/executive/auth...');
      const resp = await fetch('/api/executive/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      console.log('[Auth] Response received:', resp.status, resp.statusText);

      // Check if response is JSON
      const contentType = resp.headers.get('content-type');
      if (!resp.ok || !contentType || !contentType.includes('application/json')) {
        const text = await resp.text();
        console.error('[Auth] Non-JSON or Error Response:', text);
        setError(`Connection Error: ${resp.status} ${resp.statusText}`);
        return;
      }

      const data = await resp.json();

      if (data.success) {
        console.log('[Auth] Login successful!');
        localStorage.setItem('sp_auth', 'true');
        navigate('/');
      } else {
        console.warn('[Auth] Login failed:', data.error);
        setError('Unauthorized: Access Denied');
      }
    } catch (err: any) {
      console.error('[Auth] Fetch Execution Error:', err);
      setError(`Network Failure: ${err.message || 'Server Unreachable'}`);
    }
  };

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
            Enter your secure password to access the live executive monitoring dashboard.
          </p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4 items-center w-full max-w-sm mx-auto">
          <input 
            type="password" 
            placeholder="Enter Password..." 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-[#131A2B] border border-white/10 rounded-xl px-6 py-4 text-white w-full focus:border-accent-orange outline-none transition-colors text-center text-lg tracking-widest"
          />
          <button 
            type="submit"
            className="w-full bg-accent-orange text-white px-10 py-4 rounded-xl font-bold text-lg shadow-2xl shadow-accent-orange/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Enter
          </button>
          
          {error && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-500 text-xs font-black uppercase tracking-widest"
            >
              {error}
            </motion.p>
          )}
        </form>
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

export default LoginPage;
