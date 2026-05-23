"use client";

import React from 'react';
import MetricCard from "./MetricCard";
import {
    Activity,
    CheckCircle2,
    Phone,
    Users,
    BarChart3,
    Clock,
    Zap,
    ShieldCheck,
    Ban,
    ListChecks,
    Lock
} from "lucide-react";

export default function KPIGrid() {
    return (
        <div className="flex flex-col gap-8 mb-10 w-full">
            {/* Row 1: Core Performance */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
                <MetricCard
                    title="Room Connection Rate"
                    value="100%"
                    status="success"
                    icon={<Activity className="w-4 h-4" />}
                />
                <MetricCard
                    title="Answer Rate"
                    value="0%"
                    description="0% answer rate"
                    status="success"
                    icon={<CheckCircle2 className="w-4 h-4" />}
                />
                <MetricCard
                    title="Calls Today"
                    value="0"
                    trend={{ value: "0%", direction: 'neutral', label: "answer rate" }}
                    icon={<Phone className="w-4 h-4" />}
                />
                <MetricCard
                    title="Running Agents"
                    value="1"
                    description="of 1 total"
                    icon={<Users className="w-4 h-4" />}
                />
            </div>

            {/* Row 2: Volume & Sentiment */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Total Calls"
                    value="0"
                    trend={{ value: "0%", direction: 'neutral' }}
                    icon={<BarChart3 className="w-4 h-4" />}
                />
                <MetricCard
                    title="Total Minutes"
                    value="0.0"
                    unit="min"
                    trend={{ value: "0%", direction: 'neutral' }}
                    icon={<Clock className="w-4 h-4" />}
                />
                <MetricCard
                    title="Avg Duration"
                    value="0s"
                    icon={<Zap className="w-4 h-4" />}
                />
                <MetricCard
                    title="Avg Sentiment"
                    value="0.00"
                    description="Needs attention"
                    status="warning"
                    icon={<Activity className="w-4 h-4" />}
                />
            </div>

            {/* Row 3: Telephony Health */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricCard
                    title="Trunk Status"
                    value="1"
                    description="1 in / 0 out"
                    status="success"
                    icon={<CheckCircle2 className="w-4 h-4" />}
                />
                <MetricCard
                    title="SIP Success Rate"
                    value="95.5%"
                    description="Excellent"
                    status="success"
                    icon={<CheckCircle2 className="w-4 h-4" />}
                />
                <MetricCard
                    title="Room Connection Rate"
                    value="0%"
                    description="0 / 0 connected"
                    icon={<Activity className="w-4 h-4" />}
                />
            </div>

            {/* Row 4: Security Monitoring */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <MetricCard
                    title="Protection Status"
                    value="Active"
                    status="success"
                    icon={<ShieldCheck className="w-4 h-4" />}
                />
                <MetricCard
                    title="Banned IPs"
                    value="4"
                    description="Blocked threats"
                    status="error"
                    icon={<Ban className="w-4 h-4" />}
                />
                <MetricCard
                    title="Whitelisted IPs"
                    value="1"
                    description="Trusted sources"
                    status="success"
                    icon={<ListChecks className="w-4 h-4" />}
                />
                <MetricCard
                    title="Active Jails"
                    value="7"
                    description="Monitoring"
                    icon={<Lock className="w-4 h-4" />}
                />
            </div>
        </div>
    );
}
