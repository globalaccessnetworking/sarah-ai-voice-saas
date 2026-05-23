"use client";

import { useState, useEffect, useRef } from "react";
import {
    Mic,
    MicOff,
    MessageSquare,
    Terminal as TerminalIcon,
    Settings,
    Play,
    Square,
    Activity,
    ShieldCheck,
    Cpu,
    Wifi,
    Volume2,
    Database,
    Zap,
    Send,
    User,
    Bot,
    Info,
    RefreshCw,
    Loader2
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

// LiveKit Imports
import {
    LiveKitRoom,
    RoomAudioRenderer,
    useToken,
    useLocalParticipant,
    useTracks,
    useRoomContext,
    ControlBar,
    VoiceAssistantControlBar,
    BarVisualizer
} from "@livekit/components-react";
import {
    Room,
    RoomEvent,
    Track,
    Participant,
    DataPacket_Kind
} from "livekit-client";
import "@livekit/components-styles";

export default function AgentProvingGround() {
    const [mode, setMode] = useState<"text" | "voice">("voice");
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [token, setToken] = useState<string | null>(null);
    const [roomName, setRoomName] = useState<string | null>(null);
    const [agentName, setAgentName] = useState("Sovereign Test Agent");

    const [messages, setMessages] = useState<{ role: string, content: string, id: string }[]>([
        { role: 'system', content: 'Agent Tester initialized. Proving ground ready for Sovereign AI connectivity.', id: '1' }
    ]);
    const [debugLogs, setDebugLogs] = useState<string[]>([
        "[00:00:01] System: WebRTC components initialized.",
        "[00:00:02] System: Ready for token handshake...",
    ]);
    const [inputText, setInputText] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);
    const logScrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        if (logScrollRef.current) {
            logScrollRef.current.scrollTop = logScrollRef.current.scrollHeight;
        }
    }, [debugLogs]);

    const addLog = (msg: string) => {
        const time = new Date().toLocaleTimeString('en-GB', { hour12: false });
        setDebugLogs(prev => [...prev, `[${time}] ${msg}`]);
    };

    const handleConnect = async () => {
        if (!isConnected) {
            try {
                setIsConnecting(true);
                addLog("Initiating token handshake with backend...");

                const response = await fetch("/api/agent-tester/token", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        agent_id: "sov-agent-01",
                        mode: mode
                    })
                });

                if (!response.ok) throw new Error("Failed to fetch token");

                const data = await response.json();
                setToken(data.token);
                setRoomName(data.room_name);
                setAgentName(data.agent_name);

                addLog(`Token acquired. Room: ${data.room_name}`);
                addLog("Connecting to LiveKit Master...");
                setIsConnected(true);
            } catch (error) {
                console.error("Connection error:", error);
                addLog(`ERROR: Connection failed. ${error instanceof Error ? error.message : "Internal error"}`);
                toast.error("Handshake failed. Ensure API keys are set and worker is running.");
            } finally {
                setIsConnecting(false);
            }
        } else {
            setIsConnected(false);
            setToken(null);
            setRoomName(null);
            addLog("Session killed by terminal operator.");
        }
    };

    const handleDataReceived = (payload: Uint8Array, participant?: Participant) => {
        try {
            const data = JSON.parse(new TextDecoder().decode(payload));
            if (data.type === "chat" || data.text) {
                const text = data.text || data.content;
                const sender = data.sender || "Agent";
                setMessages(prev => [...prev, {
                    role: 'agent',
                    content: text,
                    id: Date.now().toString()
                }]);
                addLog(`SIG_IN [${sender}]: ${text.slice(0, 30)}...`);
            }
        } catch (e) {
            console.error("Failed to parse data message", e);
        }
    };

    return (
        <div className="p-6 h-[calc(100vh-64px)] flex flex-col space-y-4 animate-in fade-in duration-500 overflow-hidden">
            {/* LiveKit Integrated Content */}
            {isConnected && token && roomName ? (
                <LiveKitRoom
                    token={token}
                    serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL || "wss://muhammad-ipfdzk9v.livekit.cloud"}
                    connect={true}
                    audio={mode === "voice"}
                    video={false}
                    onDisconnected={() => {
                        setIsConnected(false);
                        setToken(null);
                        addLog("Session closed by remote peer.");
                    }}
                    onConnected={() => {
                        addLog("✓ WEBRTC_UPLINK_ESTABLISHED");
                        addLog(`✓ Agent '${agentName}' handshaked.`);
                        setMessages(prev => [
                            ...prev,
                            {
                                role: 'system',
                                content: `Connected to ${roomName}. Sovereign AI listener active.`,
                                id: Date.now().toString()
                            }
                        ]);
                    }}
                    className="flex-1 flex flex-col space-y-4 overflow-hidden"
                >
                    <RoomAudioRenderer />
                    <AgentTesterRoomChild
                        mode={mode}
                        setMode={setMode}
                        isConnected={isConnected}
                        isConnecting={isConnecting}
                        handleConnect={handleConnect}
                        messages={messages}
                        setMessages={setMessages}
                        inputText={inputText}
                        setInputText={setInputText}
                        debugLogs={debugLogs}
                        scrollRef={scrollRef}
                        logScrollRef={logScrollRef}
                        agentName={agentName}
                    />
                </LiveKitRoom>
            ) : (
                <AgentTesterInner
                    mode={mode}
                    setMode={setMode}
                    isConnected={isConnected}
                    isConnecting={isConnecting}
                    handleConnect={handleConnect}
                    messages={messages}
                    setMessages={setMessages}
                    inputText={inputText}
                    setInputText={setInputText}
                    debugLogs={debugLogs}
                    scrollRef={scrollRef}
                    logScrollRef={logScrollRef}
                    agentName={agentName}
                    localParticipant={null}
                />
            )}
        </div>
    );
}

// Bridge component to access hooks safely inside LiveKitRoom
function AgentTesterRoomChild(props: any) {
    const { localParticipant } = useLocalParticipant();
    return <AgentTesterInner {...props} localParticipant={localParticipant} />;
}

// Separate component for the UI
function AgentTesterInner({
    mode, setMode, isConnected, isConnecting, handleConnect,
    messages, setMessages, inputText, setInputText,
    debugLogs, scrollRef, logScrollRef, agentName,
    localParticipant
}: any) {

    const handleSendMessage = async () => {
        if (!inputText.trim() || !isConnected) return;

        const text = inputText.trim();
        const msgId = Date.now().toString();

        // Add to local UI
        setMessages((prev: any) => [...prev, { role: 'user', content: text, id: msgId }]);
        setInputText("");

        try {
            // Encode and send via direct data packet
            const encoder = new TextEncoder();
            const data = encoder.encode(JSON.stringify({
                type: "chat",
                text: text,
                sender: "Admin Tester"
            }));

            if (localParticipant) {
                await localParticipant.publishData(data, { reliable: true });
                // addLog(`SIG_OUT: ${text.slice(0, 30)}...`);
            }
        } catch (e) {
            console.error("Failed to send message", e);
            toast.error("Failed to transmit signal.");
        }
    };
    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] p-4 gap-4">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <Activity className="text-white w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Agent Proving Ground</h1>
                        <p className="text-xs text-zinc-500 uppercase tracking-widest font-medium">Bypass Telephony / WebRTC Debugger</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <Badge variant="outline" className={`${isConnected ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-zinc-800 text-zinc-500 border-zinc-700'}`}>
                        {isConnected ? 'LIVE SESSION' : 'OFFLINE'}
                    </Badge>
                    <div className="flex items-center gap-1.5 text-zinc-400 text-xs">
                        {isConnected ? (
                            <Wifi className="w-3.5 h-3.5 text-green-500 animate-pulse" />
                        ) : (
                            <Wifi className="w-3.5 h-3.5 text-zinc-600" />
                        )}
                        <span>{isConnected ? "UPLINK_STABLE" : "SIGNAL_DISCONNECTED"}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-4 flex-1 overflow-hidden">
                {/* Connection Panel */}
                <Card className="col-span-3 bg-zinc-950 border-zinc-800 flex flex-col">
                    <CardHeader className="py-4 border-b border-zinc-800">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-white">
                            <Settings className="w-4 h-4 text-zinc-400" /> Signal Config
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 p-4 space-y-6">
                        <div className="space-y-2">
                            <Label className="text-xs text-zinc-500 block uppercase">Target Agent</Label>
                            <Select defaultValue="sov-x">
                                <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white text-xs">
                                    <SelectValue placeholder="Select Agent" />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                                    <SelectItem value="sov-x">Sovereign-X (Voice)</SelectItem>
                                    <SelectItem value="nexus">Nexus Core (Text)</SelectItem>
                                    <SelectItem value="titan">Titan Support</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-xs text-zinc-500 block uppercase">Mode Selector</Label>
                            <div className="flex bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                                <button
                                    disabled={isConnected}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs rounded-md transition-all ${mode === 'voice' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'} ${isConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    onClick={() => setMode('voice')}
                                >
                                    <Mic className="w-3.5 h-3.5" /> Voice
                                </button>
                                <button
                                    disabled={isConnected}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs rounded-md transition-all ${mode === 'text' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'} ${isConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    onClick={() => setMode('text')}
                                >
                                    <MessageSquare className="w-3.5 h-3.5" /> Text
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-zinc-800/50">
                            <Label className="text-xs text-zinc-500 block uppercase">Audio Insight</Label>
                            <div className="h-24 bg-zinc-900 rounded-lg border border-zinc-800 flex items-end justify-center gap-[2px] p-4 overflow-hidden relative">
                                {!isConnected && <div className="absolute inset-0 flex items-center justify-center text-[10px] text-zinc-600 font-mono">INPUT_IDLE</div>}
                                {[...Array(24)].map((_, i) => (
                                    <div
                                        key={i}
                                        className={`w-full bg-indigo-500/80 rounded-t-sm transition-all duration-150 ${isConnected ? 'animate-pulse' : 'h-1'}`}
                                        style={{ height: isConnected ? `${Math.random() * 80 + 20}%` : '4px' }}
                                    />
                                ))}
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                                <span>20Hz</span>
                                <span>SPECTRUM_FREQ</span>
                                <span>20kHz</span>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="p-4 border-t border-zinc-800">
                        <Button
                            disabled={isConnecting}
                            className={`w-full h-11 text-xs font-bold gap-2 ${isConnected ? 'bg-red-900/20 text-red-500 hover:bg-red-900/30 border border-red-900/50' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20'}`}
                            onClick={handleConnect}
                        >
                            {isConnecting ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Handshaking...</>
                            ) : isConnected ? (
                                <><Square className="w-4 h-4 fill-current" /> Kill Session</>
                            ) : (
                                <><Play className="w-4 h-4 fill-current" /> Initiate Proving Ground</>
                            )}
                        </Button>
                    </CardFooter>
                </Card>

                {/* Chat Interface */}
                <Card className="col-span-6 bg-zinc-950 border-zinc-800 flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-500/30">
                        {isConnected && <div className="h-full bg-indigo-500 animate-progress w-full origin-left" />}
                    </div>
                    <CardHeader className="py-4 border-b border-zinc-800 bg-zinc-900/20">
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-sm font-semibold text-white">Primary Interaction Feed</CardTitle>
                            <div className="flex gap-2">
                                <Badge variant="outline" className="text-[10px] font-mono border-zinc-800 text-zinc-500">RTC_DATA: OK</Badge>
                                <Badge variant="outline" className="text-[10px] font-mono border-zinc-800 text-zinc-500">SIP_BYPASS: TRUE</Badge>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 p-0 overflow-hidden relative">
                        <div
                            ref={scrollRef}
                            className="absolute inset-0 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent"
                        >
                            {messages.map((msg: any) => (
                                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse text-right' : ''}`}>
                                        <div className={`w-8 h-8 rounded shrink-0 flex items-center justify-center border ${msg.role === 'user' ? 'bg-zinc-800 border-zinc-700' :
                                            msg.role === 'system' ? 'bg-amber-950/20 border-amber-900/50' : 'bg-indigo-900/30 border-indigo-500/30'
                                            }`}>
                                            {msg.role === 'user' ? <User className="w-4 h-4 text-zinc-400" /> :
                                                msg.role === 'system' ? <Info className="w-4 h-4 text-amber-500" /> : <Bot className="w-4 h-4 text-indigo-400" />}
                                        </div>
                                        <div className={`p-3 rounded-lg text-sm leading-relaxed ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' :
                                            msg.role === 'system' ? 'bg-zinc-900/50 text-zinc-400 italic text-[11px] border border-zinc-800' :
                                                'bg-zinc-900 text-zinc-200 rounded-tl-none border border-zinc-800 shadow-sm'
                                            }`}>
                                            {msg.content}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                    <CardFooter className="p-4 border-t border-zinc-800 bg-zinc-950">
                        <div className="relative w-full">
                            <Input
                                className="bg-zinc-900 border-zinc-800 text-white h-11 pr-12 text-sm focus:ring-indigo-500"
                                placeholder={isConnected ? "Speak your command or type here..." : "Initiate session to begin talking..."}
                                disabled={!isConnected}
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            />
                            <Button
                                size="icon"
                                variant="ghost"
                                className="absolute right-1 top-1 h-9 w-9 text-indigo-500 hover:text-indigo-400 hover:bg-zinc-800"
                                disabled={!isConnected}
                                onClick={handleSendMessage}
                            >
                                <Send className="w-4 h-4" />
                            </Button>
                        </div>
                    </CardFooter>
                </Card>

                {/* Debug Console */}
                <Card className="col-span-3 bg-zinc-950 border-zinc-800 flex flex-col">
                    <CardHeader className="py-4 border-b border-zinc-800">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-white">
                            <TerminalIcon className="w-4 h-4 text-zinc-400" /> WebRTC Kernel
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 p-0 overflow-hidden bg-black flex flex-col">
                        <div
                            ref={logScrollRef}
                            className="flex-1 p-3 font-mono text-[10px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent space-y-1"
                        >
                            {debugLogs.map((log: any, i: number) => (
                                <div key={i} className={`${log.includes('SIG_OUT') ? 'text-indigo-400' : log.includes('SIG_IN') ? 'text-blue-400' : 'text-green-500/80'}`}>
                                    {log}
                                </div>
                            ))}
                            {isConnected && <div className="inline-block w-2 h-4 bg-green-500 animate-pulse ml-1 align-middle" />}
                        </div>
                        <div className="p-2 border-t border-zinc-900/50 bg-zinc-950/50 flex items-center justify-between">
                            <span className="text-[9px] text-zinc-500 font-mono tracking-tighter uppercase">status: {isConnected ? 'session_running' : 'kernel_idle'}</span>
                            <div className="flex gap-2">
                                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 shadow-lg shadow-green-500/50 animate-pulse' : 'bg-zinc-800'}`} />
                                <div className="w-2 h-2 rounded-full bg-zinc-800" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <style jsx global>{`
                    @keyframes progress {
                        0% { transform: scaleX(0); }
                        100% { transform: scaleX(1); }
                    }
                    .animate-progress {
                        animation: progress 20s linear infinite;
                    }
                `}</style>
        </div>
    );
}

