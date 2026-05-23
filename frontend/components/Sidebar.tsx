"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Gauge,
    FileBarChart2,
    DoorOpen,
    Clock,
    MessageSquare,
    CircleDot,
    Wrench,
    BookOpen,
    Bot,
    MessageCircle,
    PhoneOutgoing,
    GitFork,
    Megaphone,
    FlaskConical,
    Cpu,
    Box,
    Settings,
    Radio,
    Users,
    Shield,
    HardDrive,
    Lock,
    Building2,
    Globe,
    Zap,
    Signal,
    LayoutTemplate,
    Plug,
    PenLine,
    AudioWaveform,
    ShieldCheck,
    Code2,
    DollarSign,
    Bell,
    Heart,
    Microscope,
    UserCircle,
    BarChart3,
    Phone,
    Crosshair,
    MonitorPlay,
    Brain,
    Network,
    Mic2,
    Mail,
    History,
    Activity,
    Palette,
    Webhook,
    ClipboardList
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
    href: string;
    label: string;
    icon: React.ReactNode;
    badge?: string;
}

interface NavSection {
    title: string;
    items: NavItem[];
}

const navigation: NavSection[] = [
    {
        title: "Core",
        items: [
            { href: "/", label: "Master Analytics", icon: <Gauge size={15} /> },
            { href: "/analytics", label: "Deep Analytics", icon: <FileBarChart2 size={15} /> },
            { href: "/reports", label: "Reports", icon: <Mail size={15} /> },
            { href: "/rooms", label: "Rooms", icon: <DoorOpen size={15} /> },
            { href: "/rooms/rtc-health", label: "RTC Health", icon: <Signal size={15} />, badge: "New" },
            { href: "/live-sessions", label: "Live Sessions", icon: <Radio size={15} />, badge: "Live" },
            { href: "/call-history", label: "Call History & Billing", icon: <Clock size={15} /> },
            { href: "/chat-history", label: "Chat History", icon: <MessageSquare size={15} /> },
            { href: "/egress", label: "Recording / Egress", icon: <CircleDot size={15} /> },
            { href: "/recording-storage", label: "Recording Library", icon: <HardDrive size={15} />, badge: "New" },
            { href: "/tools", label: "Tools", icon: <Wrench size={15} /> },
            { href: "/knowledge-base", label: "Knowledge Base", icon: <BookOpen size={15} /> },
            { href: "/agents", label: "Voice Agents", icon: <Bot size={15} /> },
            { href: "/web-chat", label: "Web ChatBot", icon: <MessageCircle size={15} /> },
        ],
    },
    {
        title: "Suthra Punjab Portal",
        items: [
            { href: "/settings/sms", label: "SMS Intelligence Hub", icon: <MessageSquare size={15} />, badge: "PHASE 5" },
            { href: "/complaints", label: "Complaint Registry", icon: <ClipboardList size={15} />, badge: "Live" },
            { href: "/verification-registry", label: "Verification Registry", icon: <ShieldCheck size={15} />, badge: "ROBOCALL" },
            { href: "/settings/sms?tab=registry", label: "Field Staff Registry", icon: <Users size={15} />, badge: "ADMIN" },
            { href: "/analytics/outbound", label: "Outbound Analytics (HUD)", icon: <Activity size={15} />, badge: "LIVE" },
            { href: "/settings/sms?tab=analytics", label: "Strategic Reports", icon: <BarChart3 size={15} />, badge: "NEW" },
            { href: "/qa-audit", label: "QA & Compliance Audit", icon: <ShieldCheck size={15} />, badge: "AI AUDIT" },
        ],
    },
    {
        title: "Telephony",
        items: [
            { href: "/sip-trunks", label: "SIP Trunks", icon: <PhoneOutgoing size={15} /> },
            { href: "/telephony", label: "Dispatcher", icon: <GitFork size={15} /> },
            { href: "/telephony/campaigns", label: "Campaigns", icon: <Megaphone size={15} /> },
        ],
    },
    {
        title: "Asterisk PBX",
        items: [
            { href: "/asterisk", label: "PBX Dashboard", icon: <Signal size={15} />, badge: "New" },
            { href: "/asterisk/health", label: "Health Monitor", icon: <Zap size={15} />, badge: "New" },
            { href: "/asterisk/carriers", label: "SIP Carriers", icon: <Globe size={15} />, badge: "New" },
            { href: "/asterisk/queues", label: "Call Queuing", icon: <Users size={15} />, badge: "New" },
            { href: "/asterisk/ivr", label: "IVR Builder", icon: <GitFork size={15} />, badge: "New" },
            { href: "/asterisk/hunt-groups", label: "Hunt Groups", icon: <Bot size={15} />, badge: "New" },
            { href: "/asterisk/transfer", label: "Call Transfer", icon: <PhoneOutgoing size={15} />, badge: "New" },
            { href: "/asterisk/vault", label: "Recording Vault", icon: <HardDrive size={15} />, badge: "New" },
            { href: "/asterisk/failover", label: "Carrier Failover", icon: <Shield size={15} />, badge: "New" },
            { href: "/asterisk/voicemail", label: "AI Voicemail", icon: <MessageSquare size={15} />, badge: "New" },
            { href: "/asterisk/cost-ledger", label: "Cost Ledger", icon: <Gauge size={15} />, badge: "New" },
            { href: "/asterisk/white-label", label: "White-Label PBX", icon: <Building2 size={15} />, badge: "New" },
            { href: "/asterisk/trunk-marketplace", label: "Trunk Market", icon: <Globe size={15} />, badge: "New" },
            { href: "/asterisk/number-porting", label: "Number Porting", icon: <PhoneOutgoing size={15} />, badge: "New" },
            { href: "/asterisk/routing", label: "E.164 Routing", icon: <GitFork size={15} />, badge: "New" },
            { href: "/asterisk/cluster", label: "Multi-Region Cluster", icon: <Globe size={15} />, badge: "New" },
        ],
    },
    {
        title: "Revenue & Billing",
        items: [
            { href: "/billing", label: "Billing & Metering", icon: <DollarSign size={15} />, badge: "New" },
            { href: "/onboarding", label: "Client Onboarding", icon: <Zap size={15} />, badge: "New" },
            { href: "/alerts", label: "Alerts & Notifications", icon: <Bell size={15} />, badge: "New" },
        ],
    },
    {
        title: "AI Intelligence",
        items: [
            { href: "/sentiment", label: "Sentiment Engine", icon: <Heart size={15} />, badge: "New" },
            { href: "/forensics", label: "AI Call Forensics", icon: <Microscope size={15} />, badge: "New" },
            { href: "/latency", label: "Latency X-Ray", icon: <Crosshair size={15} />, badge: "New" },
        ],
    },
    {
        title: "Portal & Softphone",
        items: [
            { href: "/portal", label: "Client Portal", icon: <UserCircle size={15} />, badge: "New" },
            { href: "/campaigns/analytics", label: "Campaign Analytics", icon: <BarChart3 size={15} />, badge: "New" },
            { href: "/softphone", label: "WebRTC Softphone", icon: <Phone size={15} />, badge: "New" },
        ],
    },
    {
        title: "Pakistani Context AI",
        items: [
            { href: "/calls/live", label: "Live Call (Dual-Brain)", icon: <MonitorPlay size={15} />, badge: "New" },
            { href: "/knowledge", label: "Slang Dictionary (RAG)", icon: <Brain size={15} />, badge: "New" },
            { href: "/latency-fillers", label: "Wait Fillers", icon: <Clock size={15} />, badge: "New" },
            { href: "/asterisk/ptcl", label: "PTCL & Dialect Routing", icon: <Network size={15} />, badge: "New" },
            { href: "/workflows", label: "Automation Webhooks", icon: <Zap size={15} />, badge: "New" },
            { href: "/voice-tuner", label: "Voice Persona Tuner", icon: <Mic2 size={15} />, badge: "New" },
        ],
    },
    {
        title: "Agency & AI",
        items: [
            { href: "/clients", label: "Client Portals", icon: <Building2 size={15} />, badge: "New" },
            { href: "/templates", label: "Agent Templates", icon: <LayoutTemplate size={15} />, badge: "New" },
            { href: "/integrations", label: "Integrations", icon: <Plug size={15} />, badge: "New" },
            { href: "/prompt-studio", label: "Prompt Studio", icon: <PenLine size={15} />, badge: "New" },
        ],
    },
    {
        title: "Advanced",
        items: [
            { href: "/voice-gallery", label: "Voice Gallery", icon: <AudioWaveform size={15} />, badge: "New" },
            { href: "/compliance", label: "Compliance", icon: <ShieldCheck size={15} />, badge: "New" },
            { href: "/developer", label: "Developer API", icon: <Code2 size={15} />, badge: "New" },
        ],
    },
    {
        title: "Testing",
        items: [
            { href: "/agent-tester", label: "Agent Tester", icon: <FlaskConical size={15} /> },
            { href: "/simulation", label: "Simulation", icon: <Cpu size={15} />, badge: "Beta" },
            { href: "/sandbox", label: "Sandbox", icon: <Box size={15} /> },
        ],
    },
    {
        title: "Admin (SaaS)",
        items: [
            { href: "/settings/users", label: "User Management", icon: <Users size={15} /> },
            { href: "/settings/audit", label: "Audit Logs", icon: <Shield size={15} /> },
            { href: "/settings/email", label: "Email & Notifications", icon: <Mail size={15} />, badge: "New" },
            { href: "/settings/templates", label: "Email Templates", icon: <LayoutTemplate size={15} />, badge: "New" },
            { href: "/settings/branding", label: "Email Branding", icon: <Palette size={15} />, badge: "New" },
            { href: "/settings/email-logs", label: "Delivery Logs", icon: <History size={15} />, badge: "New" },
            { href: "/settings/dispatcher-monitor", label: "Dispatcher Monitor", icon: <Activity size={15} />, badge: "New" },
            { href: "/settings/email-analytics", label: "Email Analytics", icon: <BarChart3 size={15} />, badge: "New" },
            { href: "/settings/prediction", label: "Prediction Hub", icon: <Brain size={15} />, badge: "AI" },
            { href: "/settings/security", label: "Security Centre", icon: <Lock size={15} />, badge: "New" },
            { href: "/settings/alerts", label: "Service Alerts", icon: <Activity size={15} />, badge: "New" },
            { href: "/settings/deepgram-flux", label: "Deepgram Flux", icon: <Zap size={15} />, badge: "New" },
            { href: "/settings/geo-routing", label: "Geo Routing", icon: <Globe size={15} />, badge: "New" },
            { href: "/settings/api", label: "Integrations / API", icon: <Webhook size={15} />, badge: "New" },
            { href: "/settings/reports", label: "Automated Reports", icon: <BarChart3 size={15} />, badge: "New" },
            { href: "/settings", label: "System Config", icon: <Settings size={15} /> },
        ],
    },
];

export default function Sidebar() {
    const pathname = usePathname();

    const isActive = (href: string) => {
        if (href === "/") return pathname === "/";
        return pathname.startsWith(href);
    };

    return (
        <aside className="sidebar">
            {/* Brand */}
            <Link href="/" className="sidebar-brand">
                <div className="sidebar-brand-icon">
                    <Radio size={16} color="white" />
                </div>
                <div className="sidebar-brand-text">
                    <span className="sidebar-brand-name">Global Access</span>
                    <span className="sidebar-brand-tagline">AI Engine</span>
                </div>
            </Link>

            {/* Navigation */}
            <nav className="sidebar-nav">
                {navigation.map((section) => (
                    <div key={section.title} className="nav-section">
                        <div className="nav-section-title">{section.title}</div>
                        {section.items.map((item) => (
                            <Link
                                key={item.label}
                                href={item.href}
                                className={cn("nav-link", isActive(item.href) && "active")}
                            >
                                {item.icon}
                                <span>{item.label}</span>
                                {item.badge && (
                                    <span className="nav-badge">{item.badge}</span>
                                )}
                            </Link>
                        ))}
                    </div>
                ))}
            </nav>
        </aside>
    );
}
