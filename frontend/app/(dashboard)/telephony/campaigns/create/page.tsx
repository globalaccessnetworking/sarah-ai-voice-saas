"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Upload, FileText, Settings, Users, Phone, Loader2, XCircle } from "lucide-react";
import Link from "next/link";
import Papa from "papaparse";

export default function CreateCampaignPage() {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState("config");

    const [formData, setFormData] = useState({
        name: "",
        sipTrunkId: "",
        agentId: "",
        concurrency: 1,
        callDelaySeconds: 0,
    });

    const [numbers, setNumbers] = useState<{ phone: string, name?: string, companyName?: string }[]>([]);

    const [manualNumber, setManualNumber] = useState("");
    const [manualName, setManualName] = useState("");

    const [csvFile, setCsvFile] = useState<File | null>(null);

    const handleSave = async () => {
        if (!formData.name) {
            alert("Campaign Name is required.");
            return;
        }

        setSaving(true);
        try {
            const res = await fetch("/api/campaigns", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    numbers
                }),
            });

            if (res.ok) {
                router.push("/telephony/campaigns");
            } else {
                alert("Failed to create campaign.");
            }
        } catch (error) {
            console.error("Error creating campaign:", error);
            alert("Error creating campaign.");
        } finally {
            setSaving(false);
        }
    };

    const handleAddManual = () => {
        if (manualNumber) {
            setNumbers([...numbers, { phone: manualNumber, name: manualName }]);
            setManualNumber("");
            setManualName("");
        }
    };

    const handleRemoveNumber = (index: number) => {
        setNumbers(numbers.filter((_, i) => i !== index));
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setCsvFile(file);
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: function (results) {
                    const newNumbers: any[] = [];
                    // Ensure the CSV has a phone column
                    results.data.forEach((row: any) => {
                        const phone = row.phone || row.Phone || row.PHONE || row.phoneNumber || row['Phone Number'];
                        if (phone) {
                            newNumbers.push({
                                phone: String(phone).trim(),
                                name: row.name || row.Name || row.NAME || "",
                                companyName: row.company || row.Company || row.companyName || ""
                            });
                        }
                    });

                    if (newNumbers.length > 0) {
                        setNumbers([...numbers, ...newNumbers]);
                        setCsvFile(null); // Reset after import
                        e.target.value = ''; // Reset file input
                        alert(`Successfully imported ${newNumbers.length} numbers.`);
                    } else {
                        alert("Could not find a 'phone' column in the CSV file.");
                    }
                }
            });
        }
    };

    return (
        <div className="w-full xl:max-w-[1200px] mx-auto p-8 flex flex-col gap-6">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/telephony/campaigns" className="btn-secondary px-3">
                        <ArrowLeft size={16} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Create Campaign</h1>
                        <p className="text-zinc-400 text-sm">Configure outbound dialing parameters and target leads.</p>
                    </div>
                </div>

                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="btn-primary flex items-center gap-2"
                >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {saving ? "Saving..." : "Save & Create"}
                </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-1 border-b border-zinc-800 pb-[1px]">
                <button
                    onClick={() => setActiveTab("config")}
                    className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${activeTab === "config" ? "border-blue-500 text-white" : "border-transparent text-zinc-400 hover:text-zinc-200"
                        }`}
                >
                    <Settings size={16} />
                    Configuration
                </button>
                <button
                    onClick={() => setActiveTab("targets")}
                    className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${activeTab === "targets" ? "border-blue-500 text-white" : "border-transparent text-zinc-400 hover:text-zinc-200"
                        }`}
                >
                    <Users size={16} />
                    Target Numbers
                    <span className="ml-1 bg-zinc-800 text-xs px-2 py-0.5 rounded-full">{numbers.length}</span>
                </button>
            </div>

            {/* Content Area */}
            <div className="card p-6 min-h-[500px]">
                {activeTab === "config" && (
                    <div className="flex flex-col gap-6 max-w-2xl">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-white flex items-center gap-2">
                                Campaign Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g. Q3 Healthcare Outreach"
                                className="input-field w-full"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-white">SIP Trunk ID (Optional)</label>
                                <input
                                    type="text"
                                    value={formData.sipTrunkId}
                                    onChange={(e) => setFormData({ ...formData, sipTrunkId: e.target.value })}
                                    placeholder="UUID of active trunk"
                                    className="input-field w-full opacity-60"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-white">Target Agent ID (Optional)</label>
                                <input
                                    type="text"
                                    value={formData.agentId}
                                    onChange={(e) => setFormData({ ...formData, agentId: e.target.value })}
                                    placeholder="UUID of voice agent"
                                    className="input-field w-full opacity-60"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6 pt-4 border-t border-zinc-800/50">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-white">Max Concurrency</label>
                                <p className="text-xs text-zinc-400 mb-2">Number of simultaneous calls</p>
                                <input
                                    type="number"
                                    min="1"
                                    max="50"
                                    value={formData.concurrency}
                                    onChange={(e) => setFormData({ ...formData, concurrency: parseInt(e.target.value) || 1 })}
                                    className="input-field w-full"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-white">Call Delay (Seconds)</label>
                                <p className="text-xs text-zinc-400 mb-2">Buffer time between consecutive dials</p>
                                <input
                                    type="number"
                                    min="0"
                                    value={formData.callDelaySeconds}
                                    onChange={(e) => setFormData({ ...formData, callDelaySeconds: parseInt(e.target.value) || 0 })}
                                    className="input-field w-full"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "targets" && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                        {/* Import / Add Section */}
                        <div className="flex flex-col gap-6">

                            {/* Manual Entry */}
                            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
                                <h3 className="text-sm font-medium text-white mb-4">Add Single Target</h3>
                                <div className="flex flex-col gap-3">
                                    <input
                                        type="text"
                                        placeholder="Phone Number (+1...)"
                                        value={manualNumber}
                                        onChange={(e) => setManualNumber(e.target.value)}
                                        className="input-field w-full"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Name (Optional)"
                                        value={manualName}
                                        onChange={(e) => setManualName(e.target.value)}
                                        className="input-field w-full"
                                    />
                                    <button
                                        onClick={handleAddManual}
                                        disabled={!manualNumber}
                                        className="btn-secondary w-full"
                                    >
                                        Add Target
                                    </button>
                                </div>
                            </div>

                            <div className="relative flex items-center justify-center">
                                <div className="border-t border-zinc-800 w-full"></div>
                                <span className="absolute bg-zinc-950 px-2 text-xs text-zinc-500 font-medium">OR</span>
                            </div>

                            {/* CSV Upload */}
                            <div className="p-6 bg-zinc-900 border border-zinc-800 border-dashed rounded-lg flex flex-col items-center justify-center text-center">
                                <Upload size={24} className="text-zinc-500 mb-2" />
                                <h3 className="text-sm font-medium text-white">Import from CSV</h3>
                                <p className="text-xs text-zinc-400 mt-1 mb-4 max-w-[200px]">
                                    Upload a CSV file containing at least a 'phone' column.
                                </p>
                                <label className="btn-secondary cursor-pointer">
                                    <span>Browse Files</span>
                                    <input
                                        type="file"
                                        accept=".csv"
                                        className="hidden"
                                        onChange={handleFileUpload}
                                    />
                                </label>
                            </div>

                        </div>

                        {/* List Section */}
                        <div className="flex flex-col gap-3 h-full max-h-[500px]">
                            <h3 className="text-sm font-medium text-white flex items-center justify-between">
                                <span>Target List</span>
                                <span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded text-xs">{numbers.length} loaded</span>
                            </h3>

                            <div className="flex-1 overflow-y-auto border border-zinc-800 rounded-lg bg-zinc-900/50 p-2 space-y-2">
                                {numbers.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-zinc-500 py-10">
                                        <FileText size={32} className="mb-2 opacity-50" />
                                        <p className="text-sm">No targets added yet</p>
                                    </div>
                                ) : (
                                    numbers.map((item, index) => (
                                        <div key={index} className="flex items-center justify-between p-2 hover:bg-zinc-800 rounded-md group">
                                            <div className="flex items-center gap-3">
                                                <Phone size={14} className="text-zinc-500" />
                                                <div>
                                                    <p className="text-sm text-white font-medium">{item.phone}</p>
                                                    {item.name && <p className="text-xs text-zinc-400">{item.name}</p>}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleRemoveNumber(index)}
                                                className="text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <XCircle size={16} />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                    </div>
                )}
            </div>

        </div>
    );
}
