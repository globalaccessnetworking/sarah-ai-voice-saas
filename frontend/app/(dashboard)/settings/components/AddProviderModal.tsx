"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Info } from 'lucide-react';
import { toast } from 'sonner';

interface AddProviderModalProps {
    isOpen: boolean;
    onClose: () => void;
    category: string;
    onSuccess: () => void;
}

export default function AddProviderModal({ isOpen, onClose, category, onSuccess }: AddProviderModalProps) {
    const [name, setName] = useState('');
    const [id, setId] = useState('');
    const [unitType, setUnitType] = useState('tokens'); // 'tokens' or 'minute'
    const [inputPrice, setInputPrice] = useState('0.00');
    const [outputPrice, setOutputPrice] = useState('0.00');
    const [minutePrice, setMinutePrice] = useState('0.00');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !id) {
            toast.error("Name and ID are required");
            return;
        }

        setIsSubmitting(true);
        try {
            const provider: any = {
                id,
                name,
                enabled: true
            };

            if (unitType === 'tokens') {
                provider.input = inputPrice;
                provider.output = outputPrice;
            } else {
                provider.minute = minutePrice;
            }

            const res = await fetch('/api/settings/pricing/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ category, provider })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to add provider");

            toast.success(`Custom ${category} provider added successfully!`);
            onSuccess();
            onClose();
            // Reset form
            setName('');
            setId('');
            setUnitType('tokens');
            setInputPrice('0.00');
            setOutputPrice('0.00');
            setMinutePrice('0.00');
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                    />
                    <div className="fixed inset-0 flex items-center justify-center z-[101] p-4 pointer-events-none">
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl w-full max-w-lg pointer-events-auto overflow-hidden"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-zinc-800">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Plus className="w-5 h-5 text-emerald-500" /> Add Custom {category} Provider
                                </h2>
                                <button onClick={onClose} className="p-1 hover:bg-zinc-800 rounded-md transition-colors text-zinc-400 hover:text-white">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-1.5">Provider Name</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. My Custom LLM"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-1.5">Provider ID</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. my_provider"
                                        value={id}
                                        onChange={(e) => setId(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-emerald-500/50 transition-colors"
                                    />
                                    <p className="text-xs text-zinc-500 mt-1.5 flex items-center gap-1">
                                        <Info className="w-3 h-3" /> Lowercase, no spaces. Must match the provider ID in your agent config.
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-1.5">Pricing Unit</label>
                                    <select 
                                        value={unitType}
                                        onChange={(e) => setUnitType(e.target.value)}
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                                    >
                                        <option value="tokens">Per 1M Tokens</option>
                                        <option value="minute">Per Minute</option>
                                    </select>
                                </div>

                                {unitType === 'tokens' ? (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-zinc-500 mb-1.5 uppercase">Input $ / 1M</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-2.5 text-zinc-500 text-sm">$</span>
                                                <input 
                                                    type="text" 
                                                    value={inputPrice}
                                                    onChange={(e) => setInputPrice(e.target.value)}
                                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 pl-7 text-white font-mono focus:outline-none focus:border-emerald-500/50 transition-colors"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-zinc-500 mb-1.5 uppercase">Output $ / 1M</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-2.5 text-zinc-500 text-sm">$</span>
                                                <input 
                                                    type="text" 
                                                    value={outputPrice}
                                                    onChange={(e) => setOutputPrice(e.target.value)}
                                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 pl-7 text-white font-mono focus:outline-none focus:border-emerald-500/50 transition-colors"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <label className="block text-xs font-semibold text-zinc-500 mb-1.5 uppercase">Price Per Minute</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-2.5 text-zinc-500 text-sm">$</span>
                                            <input 
                                                type="text" 
                                                value={minutePrice}
                                                onChange={(e) => setMinutePrice(e.target.value)}
                                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 pl-7 text-white font-mono focus:outline-none focus:border-emerald-500/50 transition-colors"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="pt-4 border-t border-zinc-800 flex gap-3">
                                    <button 
                                        type="button"
                                        onClick={onClose}
                                        className="flex-1 px-4 py-2.5 rounded-lg border border-zinc-700 text-zinc-300 font-bold hover:bg-zinc-800 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="flex-1 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-lg shadow-emerald-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSubmitting ? 'Adding...' : 'Add Provider'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
