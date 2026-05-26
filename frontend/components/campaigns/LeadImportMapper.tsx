"use client";

/**
 * LeadImportMapper.tsx
 * Self-contained 5-sub-step lead import wizard for the Campaign Builder.
 *
 * Sub-steps:
 *   1. Upload     — drag-drop or browse for .csv / .xlsx
 *   2. Preview    — first 20 rows table + empty-column warnings
 *   3. Mapping    — auto-detected + user-overridable column mapping
 *   4. Validation — valid/invalid/dup counts, download invalid rows
 *   5. Preview    — personalized greeting preview for first 5 valid leads
 *
 * Does NOT touch: run_agents.py, outbound_dialer.py, greeting_cache.py,
 * SIP gate, barge-in, Redis, or CampaignLifecycle.
 */

import React, { useState, useCallback, useRef } from "react";
import Papa from "papaparse";
import {
    Upload,
    Table2,
    Columns3,
    ShieldCheck,
    Sparkles,
    FileText,
    X,
    Download,
    ChevronLeft,
    ChevronRight,
    AlertCircle,
    CheckCircle2,
    AlertTriangle,
    Eye,
    RotateCcw,
    Phone,
} from "lucide-react";
import {
    buildNormalizedHeaderMap,
    detectFieldMapping,
    processRows,
    tokenizeGreeting,
    downloadCSV,
    StandardField,
    STANDARD_FIELD_LABELS,
    ParsedLead,
} from "@/lib/leadImportUtils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LeadImportMapperProps {
    openingMessage: string;
    onImportComplete: (leads: ParsedLead[]) => void;
    onClear: () => void;
}

type SubStep = 1 | 2 | 3 | 4 | 5;

const SUB_STEP_LABELS: Record<SubStep, string> = {
    1: "Upload",
    2: "Preview",
    3: "Mapping",
    4: "Validate",
    5: "Preview",
};

const SUB_STEP_ICONS: Record<SubStep, React.ReactNode> = {
    1: <Upload size={14} />,
    2: <Table2 size={14} />,
    3: <Columns3 size={14} />,
    4: <ShieldCheck size={14} />,
    5: <Sparkles size={14} />,
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function LeadImportMapper({ openingMessage, onImportComplete, onClear }: LeadImportMapperProps) {
    const [subStep, setSubStep] = useState<SubStep>(1);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Parsed data
    const [fileName, setFileName] = useState("");
    const [rawHeaders, setRawHeaders] = useState<string[]>([]);
    const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
    const [normalizedHeaderMap, setNormalizedHeaderMap] = useState<Record<string, string>>({});

    // Mapping state: rawHeader → StandardField | null
    const [mapping, setMapping] = useState<Record<string, StandardField | null>>({});

    // Processed leads
    const [processedLeads, setProcessedLeads] = useState<ParsedLead[]>([]);

    // Validation UI state
    const [showInvalid, setShowInvalid] = useState(false);

    // ─── File Parsing ─────────────────────────────────────────────────────────

    const parseFile = useCallback(async (file: File) => {
        const ext = file.name.split(".").pop()?.toLowerCase();

        if (ext === "csv") {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    handleParsedData(file.name, results.meta.fields ?? [], results.data as Record<string, string>[]);
                },
                error: (err) => alert(`CSV parse error: ${err.message}`),
            });
        } else if (ext === "xlsx" || ext === "xls") {
            try {
                const XLSX = await import("xlsx");
                const buffer = await file.arrayBuffer();
                const wb = XLSX.read(buffer, { type: "array" });
                const ws = wb.Sheets[wb.SheetNames[0]];
                const data = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: "" });
                const headers = data.length > 0 ? Object.keys(data[0]) : [];
                handleParsedData(file.name, headers, data);
            } catch (err: unknown) {
                alert(`XLSX parse error: ${err instanceof Error ? err.message : String(err)}`);
            }
        } else {
            alert("Unsupported file type. Please upload a .csv or .xlsx file.");
        }
    }, []);

    const handleParsedData = (name: string, headers: string[], rows: Record<string, string>[]) => {
        if (headers.length === 0) {
            alert("No columns detected in the file.");
            return;
        }
        if (rows.length === 0) {
            alert("No data rows found in the file.");
            return;
        }

        const normMap = buildNormalizedHeaderMap(headers);
        const autoMapping = detectFieldMapping(headers);

        setFileName(name);
        setRawHeaders(headers);
        setRawRows(rows);
        setNormalizedHeaderMap(normMap);
        setMapping(autoMapping);
        setSubStep(2);
    };

    // ─── Drop / File Input ────────────────────────────────────────────────────

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragging(false);
            const file = e.dataTransfer.files?.[0];
            if (file) parseFile(file);
        },
        [parseFile]
    );

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) parseFile(file);
        e.target.value = "";
    };

    // ─── Mapping ──────────────────────────────────────────────────────────────

    const updateMapping = (rawHeader: string, field: StandardField | null) => {
        setMapping((prev) => ({ ...prev, [rawHeader]: field }));
    };

    const phoneMapped = Object.values(mapping).includes("phone");

    // ─── Validation ───────────────────────────────────────────────────────────

    const runValidation = () => {
        const leads = processRows(rawRows, mapping, normalizedHeaderMap);
        setProcessedLeads(leads);
        setSubStep(4);
    };

    const validLeads = processedLeads.filter((l) => l._valid);
    const invalidLeads = processedLeads.filter((l) => !l._valid && !l._isDuplicate);
    const duplicateLeads = processedLeads.filter((l) => l._isDuplicate);

    // ─── Download invalid ─────────────────────────────────────────────────────

    const handleDownloadInvalid = () => {
        const rows = [...invalidLeads, ...duplicateLeads].map((l) => ({
            ...l.raw,
            _error: l._validationError ?? "",
        }));
        downloadCSV(rows, "invalid_leads.csv");
    };

    // ─── Import ───────────────────────────────────────────────────────────────

    const handleImport = () => {
        onImportComplete(validLeads);
        resetAll();
    };

    const resetAll = () => {
        setSubStep(1);
        setFileName("");
        setRawHeaders([]);
        setRawRows([]);
        setNormalizedHeaderMap({});
        setMapping({});
        setProcessedLeads([]);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    // ─── Empty column detection ───────────────────────────────────────────────

    const emptyColumnWarnings = rawHeaders.filter((h) => {
        if (rawRows.length === 0) return false;
        const emptyCount = rawRows.filter((r) => !r[h]?.trim()).length;
        return emptyCount / rawRows.length > 0.8;
    });

    // ─── Sub-step indicator ───────────────────────────────────────────────────

    const renderSubStepIndicator = () => (
        <div className="flex items-center gap-1 mb-6">
            {([1, 2, 3, 4, 5] as SubStep[]).map((s) => {
                const isActive = subStep === s;
                const isPassed = subStep > s;
                return (
                    <React.Fragment key={s}>
                        <div
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                                isActive
                                    ? "bg-blue-500/20 text-blue-400 border border-blue-500/40"
                                    : isPassed
                                    ? "bg-green-500/10 text-green-400 border border-green-500/20"
                                    : "bg-zinc-900 text-zinc-500 border border-zinc-800"
                            }`}
                        >
                            {isPassed ? <CheckCircle2 size={12} /> : SUB_STEP_ICONS[s]}
                            <span className="hidden sm:inline">{SUB_STEP_LABELS[s]}</span>
                        </div>
                        {s < 5 && (
                            <div className={`h-px flex-1 max-w-[24px] ${subStep > s ? "bg-green-500/30" : "bg-zinc-800"}`} />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );

    // ─── Sub-step 1: Upload ───────────────────────────────────────────────────

    const renderUpload = () => (
        <div className="flex flex-col gap-4">
            <div>
                <h3 className="text-base font-semibold text-white mb-1">Import Leads from File</h3>
                <p className="text-sm text-zinc-400">
                    Upload a <span className="text-zinc-300 font-medium">.csv</span> or{" "}
                    <span className="text-zinc-300 font-medium">.xlsx</span> file. All columns will be preserved.
                </p>
            </div>

            <div
                onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center text-center transition-all cursor-pointer group ${
                    isDragging
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-zinc-700 bg-zinc-900/50 hover:border-zinc-600 hover:bg-zinc-900"
                }`}
                onClick={() => fileInputRef.current?.click()}
            >
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all ${
                    isDragging ? "bg-blue-500/20" : "bg-zinc-800 group-hover:bg-zinc-700"
                }`}>
                    <Upload size={28} className={isDragging ? "text-blue-400" : "text-zinc-400"} />
                </div>
                <p className="text-sm font-medium text-white mb-1">
                    {isDragging ? "Drop file here" : "Drag & drop or click to browse"}
                </p>
                <p className="text-xs text-zinc-500">Supports CSV and XLSX files</p>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    className="hidden"
                    onChange={handleFileInput}
                />
            </div>

            <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg">
                <p className="text-xs font-medium text-zinc-400 mb-2">Auto-detected fields include:</p>
                <div className="flex flex-wrap gap-1.5">
                    {(["phone", "name", "company_name", "business_nature", "pain_point", "website", "email", "designation", "gmb_reviews"] as StandardField[]).map((f) => (
                        <span key={f} className="px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded text-xs font-mono">
                            {`{{${f}}}`}
                        </span>
                    ))}
                    <span className="px-2 py-0.5 bg-zinc-800 text-zinc-500 rounded text-xs">+ any other column</span>
                </div>
            </div>
        </div>
    );

    // ─── Sub-step 2: Preview rows ─────────────────────────────────────────────

    const renderPreview = () => {
        const previewRows = rawRows.slice(0, 20);

        return (
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-base font-semibold text-white mb-1">File Preview</h3>
                        <p className="text-sm text-zinc-400">
                            <span className="text-white font-medium">{rawRows.length}</span> rows ·{" "}
                            <span className="text-white font-medium">{rawHeaders.length}</span> columns ·{" "}
                            <FileText size={12} className="inline" /> {fileName}
                        </p>
                    </div>
                    <button onClick={resetAll} className="text-zinc-500 hover:text-red-400 transition-colors p-1">
                        <X size={18} />
                    </button>
                </div>

                {emptyColumnWarnings.length > 0 && (
                    <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                        <AlertTriangle size={14} className="text-amber-400 mt-0.5 shrink-0" />
                        <div className="text-xs text-amber-300">
                            <span className="font-medium">Empty column warnings:</span>{" "}
                            {emptyColumnWarnings.map((h) => (
                                <span key={h} className="font-mono bg-amber-500/10 px-1 rounded mr-1">{h}</span>
                            ))}
                            {" "}&gt;80% empty
                        </div>
                    </div>
                )}

                <div className="overflow-x-auto border border-zinc-800 rounded-lg">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="border-b border-zinc-800 bg-zinc-900">
                                <th className="px-2 py-2 text-left text-zinc-500 font-medium w-8">#</th>
                                {rawHeaders.map((h) => (
                                    <th key={h} className="px-3 py-2 text-left text-zinc-400 font-medium whitespace-nowrap">
                                        <div>{h}</div>
                                        <div className="text-zinc-600 font-normal font-mono">{normalizedHeaderMap[h]}</div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {previewRows.map((row, i) => (
                                <tr key={i} className="border-b border-zinc-800/50 hover:bg-zinc-900/50 transition-colors">
                                    <td className="px-2 py-1.5 text-zinc-600">{i + 1}</td>
                                    {rawHeaders.map((h) => (
                                        <td key={h} className="px-3 py-1.5 text-zinc-300 whitespace-nowrap max-w-[150px] truncate">
                                            {row[h] || <span className="text-zinc-700">—</span>}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {rawRows.length > 20 && (
                    <p className="text-xs text-zinc-500 text-center">
                        Showing first 20 of {rawRows.length} rows
                    </p>
                )}

                <div className="flex justify-between pt-2">
                    <button onClick={resetAll} className="btn-secondary flex items-center gap-2">
                        <ChevronLeft size={14} /> Back
                    </button>
                    <button onClick={() => setSubStep(3)} className="btn-primary flex items-center gap-2">
                        Map Columns <ChevronRight size={14} />
                    </button>
                </div>
            </div>
        );
    };

    // ─── Sub-step 3: Column mapping ───────────────────────────────────────────

    const renderMapping = () => {
        const standardOptions: Array<{ value: StandardField | ""; label: string }> = [
            { value: "", label: "— Store in lead_data only —" },
            ...Object.entries(STANDARD_FIELD_LABELS).map(([k, v]) => ({
                value: k as StandardField,
                label: v,
            })),
        ];

        return (
            <div className="flex flex-col gap-4">
                <div>
                    <h3 className="text-base font-semibold text-white mb-1">Map Columns</h3>
                    <p className="text-sm text-zinc-400">
                        Auto-detected mappings shown. Override as needed.
                        All columns are saved in lead_data regardless of mapping.
                    </p>
                </div>

                {!phoneMapped && (
                    <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-300">
                        <AlertCircle size={14} className="shrink-0" />
                        <span><strong>Phone column required.</strong> Map at least one column to "Phone (Required)" to continue.</span>
                    </div>
                )}

                <div className="border border-zinc-800 rounded-lg overflow-hidden">
                    <div className="grid grid-cols-[1fr_auto_1fr] gap-0 bg-zinc-900 border-b border-zinc-800 px-4 py-2">
                        <span className="text-xs font-medium text-zinc-500">Your Column</span>
                        <span className="text-xs font-medium text-zinc-500 text-center px-4">→</span>
                        <span className="text-xs font-medium text-zinc-500">Maps To</span>
                    </div>
                    <div className="divide-y divide-zinc-800">
                        {rawHeaders.map((h) => {
                            const currentMapping = mapping[h];
                            const normKey = normalizedHeaderMap[h];
                            const isRequired = currentMapping === "phone";
                            const isMapped = currentMapping !== null;

                            return (
                                <div key={h} className="grid grid-cols-[1fr_auto_1fr] items-center gap-0 px-4 py-3 hover:bg-zinc-900/30">
                                    <div>
                                        <p className="text-sm text-white font-medium">{h}</p>
                                        <p className="text-xs text-zinc-500 font-mono mt-0.5">
                                            {`{{${normKey}}}`}
                                            {isMapped && normKey !== currentMapping && (
                                                <span className="text-blue-400 ml-2">+ {`{{${currentMapping}}}`}</span>
                                            )}
                                        </p>
                                    </div>
                                    <div className="px-4 text-zinc-600">→</div>
                                    <div className="flex items-center gap-2">
                                        <select
                                            value={currentMapping ?? ""}
                                            onChange={(e) => updateMapping(h, (e.target.value as StandardField) || null)}
                                            className={`input-field text-xs py-1.5 flex-1 ${isRequired ? "border-blue-500/50 bg-blue-500/5" : ""}`}
                                        >
                                            {standardOptions.map((opt) => (
                                                <option key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </option>
                                            ))}
                                        </select>
                                        {isRequired && (
                                            <span className="text-red-400 text-xs font-bold shrink-0">*</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-400">
                    <CheckCircle2 size={14} className="text-green-400 shrink-0" />
                    <span>
                        <strong className="text-zinc-300">All columns</strong> will be stored in{" "}
                        <span className="font-mono text-blue-400">lead_data</span> regardless of mapping.
                        Unmapped columns are accessible as <span className="font-mono">{"{{normalized_column_name}}"}</span>.
                    </span>
                </div>

                <div className="flex justify-between pt-2">
                    <button onClick={() => setSubStep(2)} className="btn-secondary flex items-center gap-2">
                        <ChevronLeft size={14} /> Back
                    </button>
                    <button
                        onClick={runValidation}
                        disabled={!phoneMapped}
                        className="btn-primary flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        Validate Leads <ChevronRight size={14} />
                    </button>
                </div>
            </div>
        );
    };

    // ─── Sub-step 4: Validation ───────────────────────────────────────────────

    const renderValidation = () => {

        return (
            <div className="flex flex-col gap-4">
                <div>
                    <h3 className="text-base font-semibold text-white mb-1">Validation Results</h3>
                    <p className="text-sm text-zinc-400">
                        Review the quality of your leads before importing.
                    </p>
                </div>

                {/* Counts */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-center">
                        <div className="text-2xl font-bold text-green-400">{validLeads.length}</div>
                        <div className="text-xs text-green-300 mt-1">Valid</div>
                    </div>
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-center">
                        <div className="text-2xl font-bold text-red-400">{invalidLeads.length}</div>
                        <div className="text-xs text-red-300 mt-1">Invalid</div>
                    </div>
                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg text-center">
                        <div className="text-2xl font-bold text-amber-400">{duplicateLeads.length}</div>
                        <div className="text-xs text-amber-300 mt-1">Duplicates</div>
                    </div>
                    <div className="p-4 bg-zinc-800 border border-zinc-700 rounded-lg text-center">
                        <div className="text-2xl font-bold text-zinc-300">{rawRows.length}</div>
                        <div className="text-xs text-zinc-400 mt-1">Total</div>
                    </div>
                </div>

                {/* Valid leads preview */}
                {validLeads.length > 0 && (
                    <div className="border border-zinc-800 rounded-lg overflow-hidden">
                        <div className="px-4 py-2 bg-zinc-900 border-b border-zinc-800 flex items-center gap-2">
                            <CheckCircle2 size={14} className="text-green-400" />
                            <span className="text-xs font-medium text-zinc-300">Valid leads (showing first 10)</span>
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                            {validLeads.slice(0, 10).map((lead, i) => (
                                <div key={i} className="flex items-center gap-3 px-4 py-2 border-b border-zinc-800/50 hover:bg-zinc-900/30">
                                    <Phone size={12} className="text-zinc-600 shrink-0" />
                                    <span className="text-sm text-white font-mono">{lead.phone}</span>
                                    {lead.name && <span className="text-xs text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded">{lead.name}</span>}
                                    {lead.company_name && <span className="text-xs text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded">{lead.company_name}</span>}
                                    <span className="ml-auto text-xs text-zinc-600">{Object.keys(lead.lead_data).length} fields</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Invalid rows */}
                {(invalidLeads.length > 0 || duplicateLeads.length > 0) && (
                    <div className="border border-zinc-800 rounded-lg overflow-hidden">
                        <button
                            onClick={() => setShowInvalid(!showInvalid)}
                            className="w-full px-4 py-2 bg-zinc-900 border-b border-zinc-800 flex items-center gap-2 text-xs font-medium text-zinc-400 hover:text-zinc-300 transition-colors"
                        >
                            <AlertCircle size={14} className="text-amber-400" />
                            <span>Invalid / Duplicate rows ({invalidLeads.length + duplicateLeads.length})</span>
                            <span className="ml-auto">{showInvalid ? "▲" : "▼"}</span>
                        </button>
                        {showInvalid && (
                            <div className="max-h-40 overflow-y-auto">
                                {[...invalidLeads, ...duplicateLeads].slice(0, 20).map((lead, i) => (
                                    <div key={i} className="flex items-center gap-3 px-4 py-2 border-b border-zinc-800/50">
                                        <AlertCircle size={12} className={lead._isDuplicate ? "text-amber-400" : "text-red-400"} />
                                        <span className="text-xs text-zinc-400 font-mono">{lead.phone || '—'}</span>
                                        <span className="text-xs text-zinc-500 ml-auto">{lead._validationError}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Download invalid */}
                {(invalidLeads.length > 0 || duplicateLeads.length > 0) && (
                    <button onClick={handleDownloadInvalid} className="btn-secondary flex items-center gap-2 w-fit text-xs">
                        <Download size={13} /> Download invalid rows as CSV
                    </button>
                )}

                <div className="flex justify-between pt-2">
                    <button onClick={() => setSubStep(3)} className="btn-secondary flex items-center gap-2">
                        <ChevronLeft size={14} /> Back to Mapping
                    </button>
                    <button
                        onClick={() => setSubStep(5)}
                        disabled={validLeads.length === 0}
                        className="btn-primary flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        Preview Greetings <ChevronRight size={14} />
                    </button>
                </div>
            </div>
        );
    };

    // ─── Sub-step 5: Greeting preview ─────────────────────────────────────────

    const renderGreetingPreview = () => {
        const previewLeads = validLeads.slice(0, 5);
        const hasTemplate = openingMessage?.trim().length > 0;

        return (
            <div className="flex flex-col gap-4">
                <div>
                    <h3 className="text-base font-semibold text-white mb-1">Personalized Greeting Preview</h3>
                    <p className="text-sm text-zinc-400">
                        See how your opening message will be rendered for the first {previewLeads.length} leads.
                    </p>
                </div>

                {/* Template display */}
                <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg">
                    <p className="text-xs text-zinc-500 mb-1 uppercase tracking-wider font-medium">Opening Message Template</p>
                    {hasTemplate ? (
                        <p className="text-sm text-zinc-300 font-mono leading-relaxed">{openingMessage}</p>
                    ) : (
                        <p className="text-sm text-zinc-600 italic">No opening message set. Go back to Step 2 (Agent) to set one.</p>
                    )}
                </div>

                {/* Per-lead previews */}
                {hasTemplate && (
                    <div className="flex flex-col gap-3">
                        {previewLeads.map((lead, i) => {
                            const tokens = tokenizeGreeting(openingMessage, lead);
                            const hasMissing = tokens.some((t) => t.type === "missing");

                            return (
                                <div key={i} className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Eye size={12} className="text-zinc-500" />
                                        <span className="text-xs font-medium text-zinc-400">
                                            Lead {i + 1}: {lead.name || lead.phone}
                                        </span>
                                        {lead.company_name && (
                                            <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded">
                                                {lead.company_name}
                                            </span>
                                        )}
                                        {hasMissing && (
                                            <span className="ml-auto text-xs text-amber-400 flex items-center gap-1">
                                                <AlertTriangle size={11} /> Missing variables
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm leading-relaxed">
                                        {tokens.map((token, ti) => {
                                            if (token.type === "text") {
                                                return <span key={ti} className="text-zinc-200">{token.value}</span>;
                                            }
                                            if (token.type === "resolved") {
                                                return (
                                                    <span key={ti} className="text-green-400 font-medium" title={`{{${token.variable}}}`}>
                                                        {token.value}
                                                    </span>
                                                );
                                            }
                                            // missing
                                            return (
                                                <span key={ti} className="text-amber-400 font-mono text-xs bg-amber-500/10 px-1 rounded">
                                                    {token.value}
                                                </span>
                                            );
                                        })}
                                    </p>
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {Object.entries(lead.lead_data).slice(0, 8).map(([k, v]) => v ? (
                                            <span key={k} className="text-xs text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded font-mono">
                                                {k}: <span className="text-zinc-400">{v.slice(0, 20)}{v.length > 20 ? '…' : ''}</span>
                                            </span>
                                        ) : null)}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {!hasTemplate && (
                    <div className="flex flex-col gap-3">
                        {previewLeads.map((lead, i) => (
                            <div key={i} className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <Eye size={12} className="text-zinc-500" />
                                    <span className="text-xs font-medium text-zinc-400">Lead {i + 1}: {lead.name || lead.phone}</span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {Object.entries(lead.lead_data).slice(0, 10).map(([k, v]) => v ? (
                                        <span key={k} className="text-xs text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded font-mono">
                                            {k}: <span className="text-zinc-400">{v.slice(0, 20)}{v.length > 20 ? '…' : ''}</span>
                                        </span>
                                    ) : null)}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Summary */}
                <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
                    <h4 className="text-xs font-medium text-zinc-400 mb-3 uppercase tracking-wider">Import Summary</h4>
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <div className="text-xl font-bold text-green-400">{validLeads.length}</div>
                            <div className="text-xs text-zinc-500 mt-0.5">Leads to import</div>
                        </div>
                        <div>
                            <div className="text-xl font-bold text-red-400">{invalidLeads.length + duplicateLeads.length}</div>
                            <div className="text-xs text-zinc-500 mt-0.5">Skipped</div>
                        </div>
                        <div>
                            <div className="text-xl font-bold text-zinc-300">{rawHeaders.length}</div>
                            <div className="text-xs text-zinc-500 mt-0.5">Fields per lead</div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-between pt-2">
                    <div className="flex items-center gap-2">
                        <button onClick={() => setSubStep(4)} className="btn-secondary flex items-center gap-2">
                            <ChevronLeft size={14} /> Back
                        </button>
                        <button onClick={() => { resetAll(); onClear(); }} className="btn-secondary flex items-center gap-2 text-zinc-500">
                            <RotateCcw size={13} /> Clear Import
                        </button>
                    </div>
                    <button
                        onClick={handleImport}
                        disabled={validLeads.length === 0}
                        className="btn-primary flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-blue-900/20"
                    >
                        Import {validLeads.length} Valid Lead{validLeads.length !== 1 ? "s" : ""}
                    </button>
                </div>
            </div>
        );
    };

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-xl">
            {renderSubStepIndicator()}
            {subStep === 1 && renderUpload()}
            {subStep === 2 && renderPreview()}
            {subStep === 3 && renderMapping()}
            {subStep === 4 && renderValidation()}
            {subStep === 5 && renderGreetingPreview()}
        </div>
    );
}
