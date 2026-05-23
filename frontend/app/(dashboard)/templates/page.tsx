"use client";
import React, { useState } from "react";
import {
    Stethoscope, Home, DollarSign, ShoppingCart, Hotel, Wrench,
    UtensilsCrossed, Smile, Bot, Star, Rocket, Search,
    CheckCircle, Clock, Users
} from "lucide-react";

interface Template {
    id: string;
    name: string;
    industry: string;
    icon: React.ReactNode;
    color: string;
    description: string;
    tags: string[];
    calls: string;
    rating: number;
    featured: boolean;
    systemPromptSnippet: string;
    features: string[];
}

const TEMPLATES: Template[] = [
    {
        id: "dental",
        name: "Dental Practice Receptionist",
        industry: "Healthcare",
        icon: <Smile className="w-6 h-6" />,
        color: "#06b6d4",
        description: "Books appointments, answers pricing questions, handles emergency triage, and collects patient insurance details.",
        tags: ["Appointments", "Insurance", "Pricing", "HIPAA"],
        calls: "12.4K",
        rating: 4.9,
        featured: true,
        systemPromptSnippet: "You are Sarah, a professional and empathetic dental receptionist for {{practice_name}} located in {{location}}. Book appointments, answer dental queries, handle urgent triage.",
        features: ["Appointment booking flow", "Insurance verification questions", "After-hours emergency triage", "HIPAA-compliant conversation", "Recall patient follow-up"],
    },
    {
        id: "real-estate",
        name: "Real Estate Lead Qualifier",
        industry: "Real Estate",
        icon: <Home className="w-6 h-6" />,
        color: "#10b981",
        description: "Qualifies inbound property enquiries, captures buyer/seller intent, and books property inspections.",
        tags: ["Lead Qualifying", "Inspections", "CRM", "Follow-up"],
        calls: "8.7K",
        rating: 4.8,
        featured: true,
        systemPromptSnippet: "You are Alex, a knowledgeable real estate assistant for {{agency_name}}. Qualify leads by understanding property goals, budget range, preferred suburbs, and timeline.",
        features: ["Buyer/seller qualification", "Budget and suburb capture", "Inspection scheduling", "CRM data capture", "Callback booking"],
    },
    {
        id: "healthcare",
        name: "Medical Clinic Receptionist",
        industry: "Healthcare",
        icon: <Stethoscope className="w-6 h-6" />,
        color: "#ef4444",
        description: "Handles appointment requests, referral coordination, repeat prescription enquiries, and directions.",
        tags: ["GP Clinic", "Referrals", "Scripts", "HIPAA"],
        calls: "15.2K",
        rating: 4.9,
        featured: false,
        systemPromptSnippet: "You are a professional medical receptionist for {{clinic_name}}. Handle bookings for GPs, specialists, and allied health. Triage urgency appropriately.",
        features: ["GP & specialist bookings", "Urgency triage", "Repeat prescription routing", "After-hours messaging", "Referral coordination"],
    },
    {
        id: "financial",
        name: "Financial Services Advisor",
        industry: "Finance",
        icon: <DollarSign className="w-6 h-6" />,
        color: "#6366f1",
        description: "Answers product enquiries, qualifies leads for financial advisors, and books consultation appointments.",
        tags: ["Compliance", "Disclaimers", "Lending", "Super"],
        calls: "5.1K",
        rating: 4.7,
        featured: false,
        systemPromptSnippet: "You are a professional financial services assistant for {{company_name}}. Provide general information about financial products. MUST include compliance disclaimer for all product discussions.",
        features: ["Compliance disclaimer auto-injection", "Home loan qualification", "Super enquiry handling", "Appointment booking", "Lead capture"],
    },
    {
        id: "ecommerce",
        name: "E-Commerce Order Support",
        industry: "Retail",
        icon: <ShoppingCart className="w-6 h-6" />,
        color: "#f59e0b",
        description: "Handles order tracking, returns, refunds, and product enquiries 24/7 without human involvement.",
        tags: ["Orders", "Returns", "Refunds", "Tracking"],
        calls: "22.1K",
        rating: 4.6,
        featured: false,
        systemPromptSnippet: "You are a friendly customer support agent for {{store_name}}. Help customers with order tracking, returns and exchanges, product information, and general enquiries.",
        features: ["Order status lookup", "Return request processing", "Refund eligibility check", "Product availability", "Escalation to human"],
    },
    {
        id: "hotel",
        name: "Hotel Concierge & Reservations",
        industry: "Hospitality",
        icon: <Hotel className="w-6 h-6" />,
        color: "#8b5cf6",
        description: "Takes room reservations, answers amenity questions, handles guest requests, and provides local recommendations.",
        tags: ["Reservations", "Concierge", "Check-in", "Amenities"],
        calls: "4.3K",
        rating: 4.8,
        featured: false,
        systemPromptSnippet: "You are a warm and professional concierge at {{hotel_name}}, a {{star_rating}}-star hotel in {{location}}. Handle room reservations and answer questions about amenities.",
        features: ["Room availability check", "Reservation booking", "Amenity questions", "Local recommendations", "Guest request routing"],
    },
    {
        id: "trades",
        name: "Home Services Dispatcher",
        industry: "Trades",
        icon: <Wrench className="w-6 h-6" />,
        color: "#d97706",
        description: "Dispatches plumbers, electricians, and handymen by capturing job details and booking a technician.",
        tags: ["Booking", "Dispatch", "Urgency", "Quotes"],
        calls: "9.8K",
        rating: 4.7,
        featured: false,
        systemPromptSnippet: "You are a dispatcher for {{company_name}}, a licensed home services company. Capture job type, urgency, address, and preferred time. Escalate emergencies immediately.",
        features: ["Job type capture", "Urgency triage", "Address collection", "Technician dispatch", "Quote request logging"],
    },
    {
        id: "restaurant",
        name: "Restaurant Reservation Agent",
        industry: "Hospitality",
        icon: <UtensilsCrossed className="w-6 h-6" />,
        color: "#ec4899",
        description: "Takes table reservations, answers menu questions, handles dietary requirements, and confirms bookings.",
        tags: ["Reservations", "Menu", "Dietary", "Groups"],
        calls: "6.9K",
        rating: 4.8,
        featured: false,
        systemPromptSnippet: "You are a friendly reservation agent for {{restaurant_name}}, a {{cuisine_type}} restaurant in {{location}}. Take bookings, answer menu questions, and confirm reservations via SMS.",
        features: ["Table availability check", "Multi-party booking", "Dietary requirement capture", "SMS confirmation", "Special occasion notes"],
    },
];

const INDUSTRIES = ["All", "Healthcare", "Real Estate", "Finance", "Retail", "Hospitality", "Trades"];
const VARIABLES = ["practice_name", "location", "business_name", "operating_hours"];

function StarRating({ rating }: { rating: number }) {
    return (
        <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map(i => (
                <Star key={i} className={`w-3 h-3 ${i <= Math.floor(rating) ? "fill-yellow-400 text-yellow-400" : "text-zinc-600"}`} />
            ))}
            <span className="text-[10px] text-zinc-400 ml-1 font-bold">{rating}</span>
        </div>
    );
}

export default function TemplatesPage() {
    const [filter, setFilter] = useState("All");
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState<Template | null>(null);
    const [deployed, setDeployed] = useState<string | null>(null);

    const filtered = TEMPLATES.filter(t =>
        (filter === "All" || t.industry === filter) &&
        (t.name.toLowerCase().includes(search.toLowerCase()) || t.industry.toLowerCase().includes(search.toLowerCase()))
    );

    const handleDeploy = (t: Template) => {
        setDeployed(t.id);
        setTimeout(() => setDeployed(null), 3000);
    };

    return (
        <div className="min-h-screen bg-black text-zinc-200">
            <div className="w-full overflow-y-auto bg-zinc-950 p-8 md:p-10">
                <div className="max-w-[1600px] mx-auto space-y-8">

                    {/* Header */}
                    <div className="bg-gradient-to-r from-violet-950/40 to-purple-950/30 border border-violet-900/30 rounded-2xl p-6 flex items-center gap-5">
                        <div className="w-14 h-14 bg-violet-500/10 border border-violet-500/20 rounded-2xl flex items-center justify-center">
                            <Bot className="w-7 h-7 text-violet-400" />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-xl font-bold text-white">Agent Template Library</h1>
                                <span className="text-[10px] font-bold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2.5 py-1 rounded-full uppercase tracking-widest">8 Industries</span>
                            </div>
                            <p className="text-xs text-zinc-400">Production-ready AI voice agent templates for industry verticals. One-click deploy into your Agent Builder.</p>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-bold text-violet-400">{TEMPLATES.length}</div>
                            <div className="text-xs text-zinc-500 uppercase tracking-widest">Templates</div>
                        </div>
                    </div>

                    {/* Filter Bar */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                            <input
                                type="text"
                                placeholder="Search templates..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-violet-500"
                            />
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            {INDUSTRIES.map(ind => (
                                <button
                                    key={ind}
                                    onClick={() => setFilter(ind)}
                                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${filter === ind ? "bg-violet-600 text-white" : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200"}`}
                                >
                                    {ind}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Featured Banner */}
                    {filter === "All" && !search && (
                        <div className="bg-gradient-to-r from-amber-950/30 to-orange-950/20 border border-amber-900/30 rounded-xl p-4 flex items-center gap-3">
                            <Star className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0" />
                            <span className="text-xs text-amber-300 font-medium">
                                <strong>Featured:</strong> Dental Receptionist and Real Estate Qualifier are our most deployed templates with 12K+ live calls each.
                            </span>
                        </div>
                    )}

                    {/* Template Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                        {filtered.map(t => (
                            <div
                                key={t.id}
                                className={`bg-zinc-900 border rounded-2xl p-5 flex flex-col gap-4 cursor-pointer hover:shadow-lg transition-all group ${t.featured ? "border-violet-500/40 hover:border-violet-500/70" : "border-zinc-800 hover:border-zinc-600"}`}
                                onClick={() => setSelected(t)}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0" style={{ background: t.color + "20", color: t.color, border: `1px solid ${t.color}40` }}>
                                        {t.icon}
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        {t.featured && (
                                            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                <Star className="w-2.5 h-2.5 fill-amber-400" /> Featured
                                            </span>
                                        )}
                                        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{t.industry}</span>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-white group-hover:text-violet-400 transition-colors mb-1.5">{t.name}</h3>
                                    <p className="text-[11px] text-zinc-500 leading-relaxed line-clamp-3">{t.description}</p>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {t.tags.slice(0, 3).map(tag => (
                                        <span key={tag} className="text-[10px] font-bold px-1.5 py-0.5 bg-zinc-800 text-zinc-400 rounded-md">{tag}</span>
                                    ))}
                                </div>
                                <div className="flex items-center justify-between">
                                    <StarRating rating={t.rating} />
                                    <div className="text-[10px] text-zinc-500 flex items-center gap-1">
                                        <Users className="w-3 h-3" /> {t.calls} calls
                                    </div>
                                </div>
                                <button
                                    onClick={e => { e.stopPropagation(); handleDeploy(t); }}
                                    className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${deployed === t.id ? "bg-emerald-600 text-white" : "bg-zinc-800 hover:bg-violet-600 text-zinc-200 hover:text-white border border-zinc-700 hover:border-violet-500"}`}
                                >
                                    {deployed === t.id ? (
                                        <><CheckCircle className="w-3.5 h-3.5" /> Deployed to Agent Builder!</>
                                    ) : (
                                        <><Rocket className="w-3.5 h-3.5" /> Deploy Template</>
                                    )}
                                </button>
                            </div>
                        ))}
                    </div>

                    {filtered.length === 0 && (
                        <div className="text-center py-16 text-zinc-500">
                            <Bot className="w-12 h-12 mx-auto mb-3 text-zinc-700" />
                            <p className="font-bold text-zinc-400">No templates match your search.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Detail Drawer */}
            {selected && (
                <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm" onClick={() => setSelected(null)}>
                    <div className="w-full max-w-xl bg-zinc-950 border-l border-zinc-800 h-full overflow-y-auto p-8 space-y-6" onClick={e => e.stopPropagation()}>
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: selected.color + "20", color: selected.color }}>
                                    {selected.icon}
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-white">{selected.name}</h2>
                                    <p className="text-xs text-zinc-500">{selected.industry} · {selected.calls} calls deployed</p>
                                </div>
                            </div>
                            <button onClick={() => setSelected(null)} className="text-zinc-500 hover:text-white text-2xl leading-none">×</button>
                        </div>

                        <div>
                            <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Included Features</div>
                            <div className="space-y-2">
                                {selected.features.map(f => (
                                    <div key={f} className="flex items-center gap-2 text-sm text-zinc-300">
                                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> {f}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">System Prompt Preview</div>
                            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                                <p className="text-xs text-zinc-300 leading-relaxed font-mono">{selected.systemPromptSnippet}</p>
                            </div>
                        </div>

                        <div>
                            <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Variables (auto-filled at runtime)</div>
                            <div className="flex flex-wrap gap-2">
                                {VARIABLES.map(v => (
                                    <span key={v} className="text-[11px] font-mono bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 px-2 py-1 rounded-lg">{`{{${v}}}`}</span>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                onClick={() => { handleDeploy(selected); setSelected(null); }}
                                className="flex-1 py-3 bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                <Rocket className="w-4 h-4" /> Deploy to Agent Builder
                            </button>
                            <button className="py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-sm rounded-xl transition-colors">
                                Preview
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
