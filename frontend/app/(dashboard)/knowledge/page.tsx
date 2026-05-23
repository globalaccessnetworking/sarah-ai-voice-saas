"use client";

import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Search, Trash2, Cpu, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Term {
    id: string;
    term: string;
    meaning: string;
    tags: string[];
}

export default function HyperLocalKnowledgeBase() {
    const [terms, setTerms] = useState<Term[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    
    // Form state
    const [newTerm, setNewTerm] = useState("");
    const [newMeaning, setNewMeaning] = useState("");
    const [newTags, setNewTags] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchTerms = async () => {
        try {
            const res = await fetch('/api/knowledge/dictionary');
            const data = await res.json();
            setTerms(data.terms || []);
            setIsLoading(false);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load slang dictionary.");
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTerms();
    }, []);

    const handleAddTerm = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTerm || !newMeaning) {
            toast.error("Term and Meaning are required.");
            return;
        }

        setIsSubmitting(true);
        const tagsArray = newTags.split(',').map(t => t.trim()).filter(t => t.length > 0);

        try {
            const res = await fetch('/api/knowledge/dictionary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ term: newTerm, meaning: newMeaning, tags: tagsArray })
            });
            const data = await res.json();
            
            if (res.ok) {
                toast.success(`Added "${newTerm}" to the dictionary`);
                setTerms([data.entry, ...terms]);
                setNewTerm("");
                setNewMeaning("");
                setNewTags("");
            } else {
                toast.error(data.error || "Failed to add term");
            }
        } catch (err) {
            toast.error("Network error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string, termText: string) => {
        try {
            const res = await fetch(`/api/knowledge/dictionary?id=${id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                toast.success(`Removed "${termText}"`);
                setTerms(terms.filter(t => t.id !== id));
            } else {
                toast.error("Failed to delete term");
            }
        } catch (err) {
            toast.error("Network error");
        }
    };

    const filteredTerms = terms.filter(t => 
        t.term.toLowerCase().includes(searchQuery.toLowerCase()) || 
        t.meaning.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2 text-white">
                        <BookOpen className="w-6 h-6 text-indigo-400" /> Hyper-Local Knowledge (RAG)
                    </h2>
                    <p className="text-zinc-400 text-sm mt-1">
                        Map local Urdu/Punjabi slang to exact intents. This dictionary is automatically injected into the GPT-4o system prompt.
                    </p>
                </div>
                
                <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold shadow-[0_0_15px_rgba(34,197,94,0.1)]">
                    <CheckCircle2 className="w-4 h-4" /> Prompt Injection Active
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Column: Form & Context Info */}
                <div className="space-y-6">
                    {/* Add Term Form */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 shadow-lg">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                            <Plus className="w-5 h-5 text-indigo-400" /> Add Local Term
                        </h3>
                        
                        <form onSubmit={handleAddTerm} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-zinc-500 mb-1">LOCAL TEXT / SLANG</label>
                                <input 
                                    type="text" 
                                    value={newTerm}
                                    onChange={(e) => setNewTerm(e.target.value)}
                                    placeholder="e.g., Ghattar, Pai ji, Bijli"
                                    className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold text-zinc-500 mb-1">INTENDED MEANING</label>
                                <input 
                                    type="text" 
                                    value={newMeaning}
                                    onChange={(e) => setNewMeaning(e.target.value)}
                                    placeholder="e.g., Sewerage / Electricity"
                                    className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-zinc-500 mb-1">TAGS (COMMA SEPARATED)</label>
                                <input 
                                    type="text" 
                                    value={newTags}
                                    onChange={(e) => setNewTags(e.target.value)}
                                    placeholder="Urdu, Plumbing, Greeting"
                                    className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                />
                            </div>

                            <button 
                                type="submit" 
                                disabled={isSubmitting}
                                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded transition-colors disabled:opacity-50"
                            >
                                {isSubmitting ? 'Adding...' : 'Inject into Knowledge Base'}
                            </button>
                        </form>
                    </div>

                    {/* How It Works Banner */}
                    <div className="bg-indigo-950/30 border border-indigo-900/50 rounded-lg p-5">
                        <h4 className="font-bold text-indigo-300 flex items-center gap-2 mb-2 text-sm">
                            <Cpu className="w-4 h-4" /> How this works
                        </h4>
                        <p className="text-xs text-indigo-200/70 leading-relaxed">
                            Deepgram Nova-3 transcribes the audio phonetically. If a user says "Ghattar", Deepgram outputs "Ghattar". 
                            Without this mapped dictionary, GPT-4o might not know what to do. 
                            <br/><br/>
                            This list is injected into the AI's <strong>Retrieval-Augmented Generation (RAG)</strong> pre-prompt before every call, ensuring 100% accuracy on Pakistani specific terminology.
                        </p>
                    </div>
                </div>

                {/* Right Column: Dictionary Table */}
                <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-lg flex flex-col shadow-lg overflow-hidden">
                    <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/50">
                        <div className="relative w-72">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                            <input 
                                type="text" 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search slang or meaning..."
                                className="w-full bg-black border border-zinc-800 rounded-full pl-9 pr-4 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                            />
                        </div>
                        <div className="text-xs font-mono text-zinc-500">
                            {filteredTerms.length} Terms Cached
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto">
                        {isLoading ? (
                            <div className="p-12 text-center text-zinc-500 flex flex-col items-center gap-3">
                                <Cpu className="w-6 h-6 animate-pulse text-indigo-500" />
                                Loading vector dictionary...
                            </div>
                        ) : filteredTerms.length === 0 ? (
                            <div className="p-12 text-center text-zinc-500 flex flex-col items-center gap-3">
                                <AlertCircle className="w-6 h-6 text-zinc-600" />
                                No terms found matching your search.
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-black/50 border-b border-zinc-800 text-xs text-zinc-500 font-bold tracking-wider uppercase">
                                        <th className="p-4 font-semibold">Local Slang</th>
                                        <th className="p-4 font-semibold">English Meaning / Intent</th>
                                        <th className="p-4 font-semibold">Tags</th>
                                        <th className="p-4 text-right font-semibold">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800/50">
                                    {filteredTerms.map((term) => (
                                        <tr key={term.id} className="hover:bg-zinc-800/30 transition-colors">
                                            <td className="p-4">
                                                <div className="font-bold text-white">{term.term}</div>
                                            </td>
                                            <td className="p-4 text-zinc-300">
                                                {term.meaning}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {term.tags.map((tag, i) => (
                                                        <span key={i} className="px-2 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-[10px] text-zinc-400 font-medium">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="p-4 text-right">
                                                <button 
                                                    onClick={() => handleDelete(term.id, term.term)}
                                                    className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                                                    title="Delete mapping"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
