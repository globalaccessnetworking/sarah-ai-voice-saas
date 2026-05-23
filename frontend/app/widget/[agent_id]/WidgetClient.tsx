"use client";

import { useState, useRef, useEffect } from "react";
import { X, Send } from "lucide-react";

interface Message {
    id: string;
    text: string;
    sender: "user" | "agent";
    timestamp: Date;
}

export default function WidgetClient({
    agentId,
    title,
    primaryColor,
    theme,
    welcomeMessage,
    brandingText
}: {
    agentId: string,
    title: string,
    primaryColor: string,
    theme: string,
    welcomeMessage: string,
    brandingText: string
}) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [connected, setConnected] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [status, setStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");
    const [sessionEnded, setSessionEnded] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Dynamic Theming calculations
    const isDark = theme === 'dark';
    const bg = isDark ? '#1a1a2e' : '#ffffff';
    const text = isDark ? '#e0e0e0' : '#1a1a2e';
    const textSecondary = isDark ? '#a0a0b0' : '#666666';
    const border = isDark ? '#333355' : '#e0e0e8';
    const inputBg = isDark ? '#2d2d44' : '#f5f5fa';
    const bgMsgAgent = isDark ? '#2d2d44' : '#e8e8f0';

    const getContrastColor = (hex: string) => {
        try {
            const r = parseInt(hex.slice(1, 3), 16) / 255;
            const g = parseInt(hex.slice(3, 5), 16) / 255;
            const b = parseInt(hex.slice(5, 7), 16) / 255;
            const L = 0.2126 * r + 0.7152 * g + 0.0722 * b;
            return L > 0.4 ? '#1a1a2e' : '#ffffff';
        } catch {
            return '#ffffff';
        }
    };
    const textOnPrimary = getContrastColor(primaryColor);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping]);

    // Mock LiveKit Connection Flow
    useEffect(() => {
        let mounted = true;

        const connect = async () => {
            setStatus("connecting");
            setConnected(false);

            // Mock connection delay exactly like Tronic
            setTimeout(() => {
                if (!mounted) return;
                setStatus("connected");
                setConnected(true);

                if (welcomeMessage) {
                    setMessages([{
                        id: Date.now().toString(),
                        text: welcomeMessage,
                        sender: "agent",
                        timestamp: new Date()
                    }]);
                }
            }, 1200);
        };

        connect();

        return () => { mounted = false; };
    }, [welcomeMessage]);

    // Event listeners for iframe communication
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data?.type === 'lk-widget-open') {
                // Focus input when opened
                document.getElementById('chatInput')?.focus();
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    const sendMessage = () => {
        if (!inputValue.trim() || !connected) return;

        const newMsg: Message = {
            id: Date.now().toString(),
            text: inputValue.trim(),
            sender: "user",
            timestamp: new Date()
        };

        setMessages(prev => [...prev, newMsg]);
        setInputValue("");
        setIsTyping(true);

        // Mock Agent Response via standard LiveKit Data Channel implementation
        setTimeout(() => {
            setIsTyping(false);
            const agentMsg: Message = {
                id: (Date.now() + 1).toString(),
                text: "I am a mock response. In production, this data travels over the ultra-low latency WebRTC data channel powered by LiveKit Server SDK.",
                sender: "agent",
                timestamp: new Date()
            };
            setMessages(prev => [...prev, agentMsg]);

            // Notify parent iframe of unread
            if (window.parent !== window) {
                window.parent.postMessage({ type: 'lk-widget-unread' }, '*');
            }
        }, 1500);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const closeWidget = () => {
        if (window.parent !== window) {
            window.parent.postMessage({ type: 'lk-widget-close' }, '*');
        }
    };

    const startNewChat = () => {
        setSessionEnded(false);
        setMessages([]);
        setStatus("connecting");
        setConnected(false);
        setTimeout(() => {
            setStatus("connected");
            setConnected(true);
            if (welcomeMessage) {
                setMessages([{
                    id: Date.now().toString(),
                    text: welcomeMessage,
                    sender: "agent",
                    timestamp: new Date()
                }]);
            }
        }, 800);
    };

    return (
        // Absolute full-screen wrapper to override dashboard layouts if present
        <div
            className="fixed inset-0 z-[9999] flex flex-col antialiased text-sm font-sans"
            style={{ backgroundColor: bg, color: text }}
        >
            {/* Header */}
            <div
                className="flex items-center justify-between p-3 flex-shrink-0 shadow-sm"
                style={{ backgroundColor: primaryColor, color: textOnPrimary }}
            >
                <div className="flex items-center gap-2 font-semibold">
                    <span>{title}</span>
                    <span
                        className={`w-2 h-2 rounded-full ${status === 'connecting' ? 'bg-amber-400 animate-pulse' : status === 'connected' ? 'bg-green-400' : 'bg-red-500'}`}
                        title={status}
                    />
                </div>
                <button
                    onClick={closeWidget}
                    className="p-1 hover:bg-black/10 rounded transition-colors"
                    aria-label="Close"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 relative">

                {status === 'connecting' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-transparent z-10" style={{ backgroundColor: bg }}>
                        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: primaryColor, borderTopColor: 'transparent' }} />
                    </div>
                )}

                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`max-w-[85%] p-3 rounded-2xl ${msg.sender === 'user' ? 'self-end rounded-br-sm' : 'self-start rounded-bl-sm border'}`}
                        style={msg.sender === 'user' ? {
                            backgroundColor: primaryColor,
                            color: textOnPrimary
                        } : {
                            backgroundColor: bgMsgAgent,
                            borderColor: border,
                            color: text
                        }}
                    >
                        <div className="leading-relaxed whitespace-pre-wrap">{msg.text}</div>
                        <div
                            className={`text-[11px] mt-1 ${msg.sender === 'user' ? 'text-right opacity-80' : ''}`}
                            style={msg.sender === 'agent' ? { color: textSecondary } : {}}
                        >
                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </div>
                ))}

                {isTyping && (
                    <div
                        className="self-start max-w-[85%] px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-1.5 border"
                        style={{ backgroundColor: bgMsgAgent, borderColor: border }}
                    >
                        <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: textSecondary, animationDelay: '0ms' }} />
                        <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: textSecondary, animationDelay: '150ms' }} />
                        <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: textSecondary, animationDelay: '300ms' }} />
                    </div>
                )}

                {/* Session Ended Divider */}
                {sessionEnded && (
                    <div className="absolute inset-x-0 bottom-0 p-4 border-t flex flex-col items-center justify-center gap-3 backdrop-blur-sm shadow-lg" style={{ backgroundColor: bg, borderColor: border }}>
                        <span style={{ color: textSecondary }}>The session has ended</span>
                        <button
                            onClick={startNewChat}
                            className="px-5 py-2 rounded-full font-medium transition-opacity hover:opacity-90"
                            style={{ backgroundColor: primaryColor, color: textOnPrimary }}
                        >
                            Start new chat
                        </button>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div
                className="p-3 border-t flex items-center gap-2 flex-shrink-0 relative z-20"
                style={{ backgroundColor: bg, borderColor: border }}
            >
                <input
                    id="chatInput"
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={!connected || sessionEnded}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2.5 rounded-full outline-none border transition-colors disabled:opacity-50"
                    style={{ backgroundColor: inputBg, color: text, borderColor: border }}
                />
                <button
                    onClick={sendMessage}
                    disabled={!inputValue.trim() || !connected || sessionEnded}
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-opacity disabled:opacity-50"
                    style={{ backgroundColor: primaryColor, color: textOnPrimary }}
                >
                    <Send className="w-4 h-4 ml-0.5" />
                </button>
            </div>

            {/* Branding Status Bar */}
            {brandingText && (
                <div
                    className="text-center py-1.5 text-[11px] border-t flex-shrink-0"
                    style={{ backgroundColor: bg, borderColor: border, color: textSecondary }}
                >
                    {brandingText}
                </div>
            )}
        </div>
    );
}
