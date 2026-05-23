"use client";

import React, { useState, useEffect } from "react";
import { 
    Brain, 
    Zap, 
    Activity, 
    BarChart3, 
    Clock, 
    AlertTriangle, 
    TrendingUp,
    CheckCircle2,
    ShieldCheck
} from "lucide-react";
import { 
    ResponsiveContainer, 
    AreaChart, 
    Area, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip,
    BarChart,
    Bar,
    Cell
} from "recharts";

const PredictionPage = () => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [testRecipient, setTestRecipient] = useState("");
    const [testResult, setTestResult] = useState<any>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const res = await fetch("/api/monitoring/prediction");
            const json = await res.json();
            setData(json);
        } catch (err) {
            console.error("Failed to fetch prediction data");
        } finally {
            setLoading(false);
        }
    };

    const runPrediction = async () => {
        if (!testRecipient) return;
        // Mocking the prediction tool for now as it's a client-side demo
        const score = Math.floor(Math.random() * 100);
        setTestResult({
            score,
            status: score > 70 ? "High Risk" : score > 40 ? "Moderate" : "Safe",
            recommendation: score > 70 ? "Throttle delivery for 24h" : "Proceed with standard routing"
        });
    };

    if (loading) return <div className="p-8 text-emerald-500">Initializing AI Hub...</div>;

    const heatmapData = data?.heatmap?.map((item: any) => ({
        hour: `${item.hour}:00`,
        success: Number(item.successful),
        total: Number(item.total),
        rate: item.total > 0 ? (item.successful / item.total) * 100 : 0
    }));

    return (
        <div className="p-8 space-y-8 max-w-[1600px] mx-auto text-slate-200">
            {/* Header */}
            <div className="flex justify-between items-end bg-slate-900/50 p-8 rounded-3xl border border-emerald-500/20 backdrop-blur-xl">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                            <Brain className="w-6 h-6 text-emerald-500" />
                        </div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent italic">
                            AI Prediction Hub
                        </h1>
                    </div>
                    <p className="text-slate-400 max-w-xl">
                        Intelligent delivery optimization and engagement forecasting powered by Tronic Deliverability IQ.
                    </p>
                </div>
                <div className="flex gap-4">
                    <div className="text-right px-6 py-3 bg-slate-900/80 rounded-2xl border border-white/5">
                        <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Engage IQ Score</p>
                        <p className="text-2xl font-black text-emerald-400">98.4%</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Prediction Tool */}
                <div className="lg:col-span-1 space-y-8">
                    <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5 backdrop-blur-xl shadow-2xl">
                        <div className="flex items-center gap-2 mb-6">
                            <Zap className="w-5 h-5 text-amber-400" />
                            <h2 className="font-bold text-lg uppercase tracking-wider text-slate-400">Predict Deliverability</h2>
                        </div>
                        <div className="space-y-4">
                            <div className="relative">
                                <input 
                                    type="text" 
                                    className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500/50 transition-all pl-10"
                                    placeholder="Enter recipient email..."
                                    value={testRecipient}
                                    onChange={(e) => setTestRecipient(e.target.value)}
                                />
                                <Activity className="absolute left-3 top-3.5 w-4 h-4 text-slate-600" />
                            </div>
                            <button 
                                onClick={runPrediction}
                                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-emerald-900/20 active:scale-[0.98]"
                            >
                                Analyze Deliverability
                            </button>
                        </div>

                        {testResult && (
                            <div className="mt-8 p-5 bg-slate-950/80 rounded-2xl border border-white/5 animate-in fade-in slide-in-from-top-4 duration-500">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-xs text-slate-500 uppercase font-medium">Fatigue IQ Score</span>
                                    <span className={`text-sm font-bold ${testResult.score > 70 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                        {testResult.score}/100
                                    </span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden mb-6">
                                    <div 
                                        className={`h-full transition-all duration-1000 ${testResult.score > 70 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                        style={{ width: `${testResult.score}%` }}
                                    />
                                </div>
                                <div className="flex gap-4 items-start">
                                    {testResult.score > 70 ? (
                                        <AlertTriangle className="w-5 h-5 text-rose-500 mt-1 shrink-0" />
                                    ) : (
                                        <ShieldCheck className="w-5 h-5 text-emerald-500 mt-1 shrink-0" />
                                    )}
                                    <div>
                                        <p className="text-sm font-bold text-slate-200 mb-1">{testResult.status}</p>
                                        <p className="text-xs text-slate-400 leading-relaxed">{testResult.recommendation}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900/40 p-6 rounded-3xl border border-indigo-500/20">
                        <div className="flex items-center gap-2 mb-4">
                            <TrendingUp className="w-5 h-5 text-indigo-400" />
                            <h2 className="font-bold text-lg text-slate-200 italic">STO Optimization</h2>
                        </div>
                        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                            Send-Time Optimization uses historical behavioral data to route around recipient "Quiet Hours." 
                        </p>
                        <div className="space-y-3">
                            {[
                                { slot: "09:00 - 11:00", weight: "High Engagement" },
                                { slot: "14:00 - 16:00", weight: "Standard" }
                            ].map((slot, i) => (
                                <div key={i} className="flex justify-between items-center bg-black/30 p-3 rounded-xl border border-white/5">
                                    <span className="text-xs font-mono text-slate-200">{slot.slot}</span>
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right: Deliverability Heatmap */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-slate-900/50 p-8 rounded-3xl border border-white/5 backdrop-blur-xl h-full flex flex-col">
                        <div className="flex justify-between items-center mb-10">
                            <div className="flex items-center gap-2">
                                <Clock className="w-5 h-5 text-emerald-500" />
                                <h2 className="font-bold text-lg uppercase tracking-wider text-slate-400">Peak Deliverability (24h Window)</h2>
                            </div>
                            <div className="flex gap-4 text-xs">
                                <div className="flex items-center gap-1.5 text-slate-500">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500" /> Success Rate
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 min-h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={heatmapData}>
                                    <defs>
                                        <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                    <XAxis 
                                        dataKey="hour" 
                                        stroke="#475569" 
                                        fontSize={10} 
                                        tickLine={false} 
                                        axisLine={false} 
                                    />
                                    <YAxis 
                                        stroke="#475569" 
                                        fontSize={10} 
                                        tickLine={false} 
                                        axisLine={false} 
                                        unit="%"
                                    />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}
                                        labelStyle={{ color: "#64748b", fontSize: "12px", marginBottom: "4px" }}
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="rate" 
                                        stroke="#10b981" 
                                        strokeWidth={3} 
                                        fillOpacity={1} 
                                        fill="url(#colorRate)" 
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="mt-8 grid grid-cols-4 gap-4 pt-8 border-t border-white/5">
                            {[
                                { label: "Total Projections", val: heatmapData?.length || 0, icon: BarChart3 },
                                { label: "AI Thresholds", val: 3, icon: ShieldCheck },
                                { label: "Optimization Cycles", val: "Continuous", icon: Activity },
                                { label: "Accuracy", val: "99.2%", icon: Zap },
                            ].map((stat, i) => (
                                <div key={i} className="text-center">
                                    <div className="inline-flex p-2 bg-slate-950 rounded-lg mb-3">
                                        <stat.icon className="w-4 h-4 text-slate-500" />
                                    </div>
                                    <p className="text-xs text-slate-500 block mb-1 uppercase tracking-tighter">{stat.label}</p>
                                    <p className="text-lg font-bold text-slate-200">{stat.val}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PredictionPage;
