"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import OverviewTab from "@/components/tabs/OverviewTab";
import CallsRoomsTab from "@/components/tabs/CallsRoomsTab";
import LatencyTab from "@/components/tabs/LatencyTab";
import AiInsightsTab from "@/components/tabs/AiInsightsTab";
import AgentsTab from "@/components/tabs/AgentsTab";
import MediaTab from "@/components/tabs/MediaTab";
import TelephonyTab from "@/components/tabs/TelephonyTab";
import PriceCostTab from "@/components/tabs/PriceCostTab";
import CustomerUsageTab from "@/components/tabs/CustomerUsageTab";
import ServerStatsTab from "@/components/tabs/ServerStatsTab";
import { 
  Gauge, 
  TrendingUp, 
  Activity as ActivityIcon, 
  Wand2, 
  Users, 
  PlaySquare, 
  Phone, 
  DollarSign, 
  Clock, 
  Server,
  Download, 
  HelpCircle, 
  ChevronDown, 
  RefreshCw 
} from "lucide-react";

const tabItems = [
  { name: "Overview", value: "overview", icon: <Gauge className="w-4 h-4" /> },
  { name: "Calls & Rooms", value: "calls-rooms", icon: <TrendingUp className="w-4 h-4" /> },
  { name: "Latency", value: "latency", icon: <ActivityIcon className="w-4 h-4" /> },
  { name: "AI Insights", value: "ai-insights", icon: <Wand2 className="w-4 h-4" /> },
  { name: "Agents", value: "agents", icon: <Users className="w-4 h-4" /> },
  { name: "Media", value: "media", icon: <PlaySquare className="w-4 h-4" /> },
  { name: "Telephony", value: "telephony", icon: <Phone className="w-4 h-4" /> },
  { name: "Price/Cost", value: "price-cost", icon: <DollarSign className="w-4 h-4" /> },
  { name: "Customer Usage", value: "customer-usage", icon: <Clock className="w-4 h-4" /> },
  { name: "Server Stats", value: "server-stats", icon: <Server className="w-4 h-4" /> }
];

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-black text-zinc-200">
      <Tabs defaultValue="overview" className="w-full max-w-full min-w-0 mt-6">
        {/* Unified Sticky Header Area */}
        <div className="sticky top-[-24px] z-30 bg-black/90 backdrop-blur-xl border-b border-zinc-800">
          <header className="">
            <div className="max-w-[1600px] mx-auto px-8 py-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-1.5">
                  <h1 className="text-2xl font-bold text-zinc-50 tracking-tight">Analytics Dashboard</h1>
                  <span className="text-[10px] font-bold text-zinc-500 bg-zinc-900 px-2.5 py-1 rounded-full border border-zinc-800 uppercase tracking-widest">Enterprise NOC</span>
                </div>
                <p className="text-xs text-zinc-500 font-medium tracking-tight">
                  Viewing technical metrics for <span className="text-zinc-300 font-bold uppercase">System Cluster</span>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3.5 py-2 rounded-xl">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Timeframe</span>
                  <button className="flex items-center gap-2 text-xs font-bold text-zinc-100 hover:text-white transition-colors">
                    Today <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
                  </button>
                </div>

                <button className="flex items-center gap-2.5 bg-zinc-900 border border-zinc-800 px-3.5 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white transition-all hover:bg-zinc-800">
                  <RefreshCw className="w-3.5 h-3.5" /> Auto-refresh off
                </button>

                <div className="flex items-center">
                  <button className="flex items-center gap-2.5 bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-l-xl border-r-0 text-xs font-bold text-zinc-400 hover:text-white transition-all hover:bg-zinc-800">
                    <Download className="w-3.5 h-3.5" /> Export
                  </button>
                  <button className="bg-zinc-900 border border-zinc-800 px-2.5 py-2 rounded-r-xl text-zinc-400 hover:text-white transition-all hover:bg-zinc-800 border-l-0">
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button className="flex items-center gap-2.5 text-zinc-500 hover:text-zinc-200 transition-colors group">
                  <HelpCircle className="w-4.5 h-4.5 group-hover:text-emerald-500 transition-colors" /> <span className="text-[10px] font-bold uppercase tracking-widest">Help</span>
                </button>
              </div>
            </div>
          </header>

          <div className="max-w-[1600px] mx-auto px-8 pb-4">
            <TabsList className="flex w-full justify-start overflow-x-auto overflow-y-hidden whitespace-nowrap bg-zinc-900/60 border border-zinc-800/60 p-1 pr-4 no-scrollbar">
              {tabItems.map((tab) => (
                <TabsTrigger 
                  key={tab.value} 
                  value={tab.value} 
                  className="shrink-0 flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all data-[active]:bg-zinc-800 data-[active]:text-white text-zinc-400 hover:text-zinc-200"
                >
                  {tab.icon}
                  {tab.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </div>

        {/* Main NOC Content */}
        <div className="w-full h-full overflow-y-auto bg-zinc-950 p-8 md:p-10">
          <div className="max-w-[1600px] mx-auto flex flex-col gap-8">
            <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
              <TabsContent value="overview"><OverviewTab /></TabsContent>
              <TabsContent value="calls-rooms"><CallsRoomsTab /></TabsContent>
              <TabsContent value="latency"><LatencyTab /></TabsContent>
              <TabsContent value="ai-insights"><AiInsightsTab /></TabsContent>
              <TabsContent value="agents"><AgentsTab /></TabsContent>
              <TabsContent value="media"><MediaTab /></TabsContent>
              <TabsContent value="telephony"><TelephonyTab /></TabsContent>
              <TabsContent value="price-cost"><PriceCostTab /></TabsContent>
              <TabsContent value="customer-usage"><CustomerUsageTab /></TabsContent>
              <TabsContent value="server-stats"><ServerStatsTab /></TabsContent>
            </div>
          </div>
        </div>
      </Tabs>

      {/* Global Access Footer */}
      <footer className="border-t border-zinc-900 bg-black pt-16 pb-24">
        <div className="max-w-[1600px] mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="flex flex-col gap-3">
            <span className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Global Access AI Engine © 2026</span>
            <div className="flex items-center gap-4">
              <span className="text-[10px] text-zinc-700 uppercase font-bold tracking-tight px-3 py-1 border border-zinc-900 rounded-lg">Sovereign Deployment</span>
              <span className="text-[10px] text-emerald-900/80 uppercase font-bold tracking-tight px-3 py-1 border border-emerald-900/20 bg-emerald-950/10 rounded-lg">Air-Gapped Status Verified</span>
            </div>
          </div>

          <div className="flex items-center gap-16">
            <div className="flex flex-col items-end gap-2 text-right">
              <span className="text-[10px] text-zinc-700 uppercase font-bold tracking-tight">Hardware Node</span>
              <span className="text-xs font-mono text-zinc-500 font-bold tracking-tighter">GA-NOC-SVR-01</span>
            </div>
            <div className="flex flex-col items-end gap-2 text-right">
              <span className="text-[10px] text-zinc-700 uppercase font-bold tracking-tight">Engine Identity</span>
              <span className="text-xs font-mono text-zinc-500 font-bold tracking-tighter">v.4.15.2-GA</span>
            </div>
            <div className="flex flex-col items-end gap-2 text-right">
              <span className="text-[10px] text-zinc-700 uppercase font-bold tracking-tight">Master Cluster</span>
              <span className="text-xs text-emerald-500 font-bold tracking-widest uppercase flex items-center gap-2.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                Optimal
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
