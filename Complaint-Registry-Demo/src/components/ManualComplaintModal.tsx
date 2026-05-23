import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Send } from 'lucide-react';
import type { Toast } from './ToastContainer';

const BASE = import.meta.env.PROD ? (import.meta.env.VITE_BACKEND_URL || '') : '';

interface ManualComplaintModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (toast: Omit<Toast, 'id'>) => void;
  districts: string[];
}

export function ManualComplaintModal({ isOpen, onClose, onSuccess, districts }: ManualComplaintModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const formData = new FormData(e.currentTarget);
    const payload = {
      name: formData.get('name'),
      phone: formData.get('phone'),
      asterisk_number: formData.get('asterisk_id'), // Mapped properly to backend expecting asterisk_number
      district: formData.get('district'),
      address: formData.get('address'),
      issue: formData.get('issue'),
      source: 'manual_demo',
    };

    try {
      const res = await fetch(`${BASE}/api/complaints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        onSuccess({
          type: 'success',
          message: 'Manual Complaint Registered',
          sub: `${payload.name} — ${payload.district}`,
        });
        onClose();
      } else {
        throw new Error('Failed to submit');
      }
    } catch {
      onSuccess({ type: 'error', message: 'Registration failed. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={!isSubmitting ? onClose : undefined}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            {/* Modal */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0d1321] border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
                <div>
                  <h2 className="text-lg font-bold text-white">Register Manual Complaint</h2>
                  <p className="text-xs text-gray-500 uppercase tracking-widest mt-0.5">Minister Demo Override</p>
                </div>
                <button
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Citizen Name</label>
                    <input required name="name" type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:border-accent-orange/50 outline-none transition-colors" placeholder="e.g. Ali Khan" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Phone Number</label>
                    <input required name="phone" type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:border-accent-orange/50 outline-none transition-colors font-mono" placeholder="03XXXXXXXXX" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-accent-emerald uppercase tracking-wider flex items-center gap-2">
                    Asterisk ID / Outbound Number
                    <span className="bg-accent-emerald/20 text-accent-emerald px-1.5 py-0.5 rounded text-[9px]">Optional</span>
                  </label>
                  <input name="asterisk_id" type="text" className="w-full bg-accent-emerald/5 border border-accent-emerald/20 rounded-xl px-3 py-2.5 text-sm focus:border-accent-emerald/50 outline-none transition-colors font-mono" placeholder="For Voice Verification..." />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">District</label>
                    <select required name="district" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:border-accent-orange/50 outline-none transition-colors appearance-none">
                      <option value="" disabled selected>Select District</option>
                      {districts.map(d => <option key={d} value={d} className="bg-[#0d1321]">{d}</option>)}
                      <option value="Lahore" className="bg-[#0d1321]">Lahore</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Address</label>
                    <input name="address" type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:border-accent-orange/50 outline-none transition-colors" placeholder="Street, Area..." />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Issue Description</label>
                  <textarea required name="issue" rows={3} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:border-accent-orange/50 outline-none transition-colors resize-none" placeholder="Describe the complaint..." />
                </div>

                {/* Footer Actions */}
                <div className="pt-4 flex items-center justify-end gap-3 border-t border-white/10 mt-6">
                  <button type="button" onClick={onClose} disabled={isSubmitting} className="px-4 py-2 rounded-xl text-sm font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold bg-accent-orange text-white hover:bg-accent-orange/90 disabled:opacity-50 transition-colors shadow-lg shadow-accent-orange/20">
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Submit Complaint
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
