"use client";

import { useState } from "react";
import { Plus, Play, Pause, Trash2, Users, PhoneCall, CheckCircle, AlertCircle } from "lucide-react";
import CampaignModal from "./CampaignModal";

export default function CampaignsView({ initialCampaigns, agents, trunks }: {
    initialCampaigns: any[],
    agents: any[],
    trunks: any[]
}) {
    const [campaigns, setCampaigns] = useState(initialCampaigns);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCampaign, setEditingCampaign] = useState<any>(null);

    const toggleCampaignStatus = async (campaign: any) => {
        const newStatus = campaign.status === 'active' ? 'idle' : 'active';
        try {
            const res = await fetch(`/api/campaigns/${campaign.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) {
                setCampaigns(campaigns.map(c => c.id === campaign.id ? { ...c, status: newStatus } : c));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const deleteCampaign = async (id: string) => {
        if (!confirm("Are you sure you want to delete this campaign?")) return;
        try {
            const res = await fetch(`/api/campaigns/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setCampaigns(campaigns.filter(c => c.id !== id));
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Active Campaigns</h2>
                <button
                    onClick={() => { setEditingCampaign(null); setIsModalOpen(true); }}
                    className="flex items-center gap-2 bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                    <Plus className="w-4 h-4" /> Create Campaign
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {campaigns.map(campaign => (
                    <div key={campaign.id} className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl overflow-hidden hover:border-[var(--brand-primary)]/50 transition-all shadow-lg group">
                        <div className="p-5">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-lg text-white group-hover:text-[var(--brand-primary)] transition-colors">{campaign.name}</h3>
                                    <p className="text-xs text-gray-500 font-mono mt-1 uppercase tracking-wider">{campaign.status}</p>
                                </div>
                                <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-tighter ${campaign.status === 'active' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                                    campaign.status === 'completed' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                                        'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                                    }`}>
                                    {campaign.status}
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="text-center p-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
                                    <Users className="w-4 h-4 mx-auto mb-1 text-gray-400" />
                                    <div className="text-sm font-bold text-white">{campaign.stats?.total || 0}</div>
                                    <div className="text-[10px] text-gray-500 uppercase">Leads</div>
                                </div>
                                <div className="text-center p-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
                                    <CheckCircle className="w-4 h-4 mx-auto mb-1 text-green-400" />
                                    <div className="text-sm font-bold text-white">{campaign.stats?.completed || 0}</div>
                                    <div className="text-[10px] text-gray-500 uppercase">Success</div>
                                </div>
                                <div className="text-center p-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
                                    <AlertCircle className="w-4 h-4 mx-auto mb-1 text-red-400" />
                                    <div className="text-sm font-bold text-white">{campaign.stats?.failed || 0}</div>
                                    <div className="text-[10px] text-gray-500 uppercase">Failed</div>
                                </div>
                            </div>

                            <div className="w-full bg-gray-800 rounded-full h-1.5 mb-6 overflow-hidden">
                                <div
                                    className="bg-[var(--brand-primary)] h-1.5 rounded-full transition-all duration-500"
                                    style={{ width: `${(campaign.stats?.completed / campaign.stats?.total * 100) || 0}%` }}
                                ></div>
                            </div>

                            <div className="flex items-center justify-between border-t border-[var(--border-color)] pt-4">
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => toggleCampaignStatus(campaign)}
                                        className={`p-2 rounded-lg transition-all ${campaign.status === 'active'
                                            ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20'
                                            : 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
                                            }`}
                                        title={campaign.status === 'active' ? "Pause Campaign" : "Start Campaign"}
                                    >
                                        {campaign.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                    </button>
                                    <button
                                        onClick={() => deleteCampaign(campaign.id)}
                                        className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all"
                                        title="Delete Campaign"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="text-xs text-gray-500 flex items-center gap-1">
                                    <PhoneCall className="w-3 h-3" />
                                    Trunk: {trunks.find(t => t.id === campaign.sipTrunkId)?.name || 'None'}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {campaigns.length === 0 && (
                    <div className="col-span-full py-20 text-center border-2 border-dashed border-[var(--border-color)] rounded-2xl">
                        <PhoneCall className="w-16 h-16 mx-auto mb-4 text-gray-600 opacity-20" />
                        <h3 className="text-xl font-bold text-gray-400">No Campaigns Planned</h3>
                        <p className="text-gray-500 mt-2">Create your first outbound campaign to start reaching leads.</p>
                        <button
                            onClick={() => { setEditingCampaign(null); setIsModalOpen(true); }}
                            className="mt-6 text-[var(--brand-primary)] hover:underline font-bold"
                        >
                            + Launch New Campaign
                        </button>
                    </div>
                )}
            </div>

            <CampaignModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                agents={agents}
                trunks={trunks}
                initialData={editingCampaign}
                onSave={(newCampaign) => {
                    if (editingCampaign) {
                        setCampaigns(campaigns.map(c => c.id === newCampaign.id ? newCampaign : c));
                    } else {
                        setCampaigns([newCampaign, ...campaigns]);
                    }
                }}
            />
        </div>
    );
}
