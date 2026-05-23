"use client";

import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Settings, Plug, Box, Users, ShieldAlert, Cpu,
    DollarSign, Mail, Database, HardDrive, TerminalSquare, StickyNote
} from "lucide-react";

import { SettingsGeneral } from "./components/SettingsGeneral";
import { SettingsIntegrations } from "./components/SettingsIntegrations";
import { SettingsSecurity } from "./components/SettingsSecurity";
import { SettingsResources } from "./components/SettingsResources";
import { SettingsPricing } from "./components/SettingsPricing";
import { SettingsStorageBackup } from "./components/SettingsStorageBackup";
import { SettingsDependencies } from "./components/SettingsDependencies";
import { SettingsUsers } from "./components/SettingsUsers";
import { SettingsEmail } from "./components/SettingsEmail";
import { SettingsLogs } from "./components/SettingsLogs";
import { SettingsNotes } from "./components/SettingsNotes";

export default function SettingsPage() {
    return (
        <div className="min-h-screen bg-transparent text-white pt-8 pb-20 px-4 md:px-8">
            {/* Page Header */}
            <div className="mb-8 pl-1">
                <h1 className="text-4xl font-bold tracking-tight text-white mb-2">Settings</h1>
                <p className="text-zinc-400 text-lg">Configuration & Integrations</p>
            </div>

            <Tabs defaultValue="integrations" className="w-full">
                {/* Horizontal Tab Bar */}
                <div className="border-b border-zinc-800 mb-8 overflow-x-auto no-scrollbar">
                    <TabsList className="bg-transparent h-auto p-0 flex flex-row gap-6 items-center">
                        <TabsTrigger value="general" className="px-1 py-3 bg-transparent h-auto data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none text-zinc-400 data-[state=active]:text-white transition-all text-sm font-medium whitespace-nowrap">
                            General
                        </TabsTrigger>
                        <TabsTrigger value="integrations" className="px-1 py-3 bg-transparent h-auto data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none text-zinc-400 data-[state=active]:text-white transition-all text-sm font-medium whitespace-nowrap">
                            Integrations/API
                        </TabsTrigger>
                        <TabsTrigger value="dependencies" className="px-1 py-3 bg-transparent h-auto data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none text-zinc-400 data-[state=active]:text-white transition-all text-sm font-medium whitespace-nowrap">
                            Dependencies
                        </TabsTrigger>
                        <TabsTrigger value="users" className="px-1 py-3 bg-transparent h-auto data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none text-zinc-400 data-[state=active]:text-white transition-all text-sm font-medium whitespace-nowrap">
                            User Management
                        </TabsTrigger>
                        <TabsTrigger value="security" className="px-1 py-3 bg-transparent h-auto data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none text-zinc-400 data-[state=active]:text-white transition-all text-sm font-medium whitespace-nowrap">
                            Security
                        </TabsTrigger>
                        <TabsTrigger value="resources" className="px-1 py-3 bg-transparent h-auto data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none text-zinc-400 data-[state=active]:text-white transition-all text-sm font-medium whitespace-nowrap">
                            System Resources
                        </TabsTrigger>
                        <TabsTrigger value="pricing" className="px-1 py-3 bg-transparent h-auto data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none text-zinc-400 data-[state=active]:text-white transition-all text-sm font-medium whitespace-nowrap">
                            Pricing
                        </TabsTrigger>
                        <TabsTrigger value="email" className="px-1 py-3 bg-transparent h-auto data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none text-zinc-400 data-[state=active]:text-white transition-all text-sm font-medium whitespace-nowrap">
                            Email
                        </TabsTrigger>
                        <TabsTrigger value="backup" className="px-1 py-3 bg-transparent h-auto data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none text-zinc-400 data-[state=active]:text-white transition-all text-sm font-medium whitespace-nowrap">
                            Backup
                        </TabsTrigger>
                        <TabsTrigger value="storage" className="px-1 py-3 bg-transparent h-auto data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none text-zinc-400 data-[state=active]:text-white transition-all text-sm font-medium whitespace-nowrap">
                            Storage
                        </TabsTrigger>
                        <TabsTrigger value="logs" className="px-1 py-3 bg-transparent h-auto data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none text-zinc-400 data-[state=active]:text-white transition-all text-sm font-medium whitespace-nowrap">
                            System Logs
                        </TabsTrigger>
                        <TabsTrigger value="notes" className="px-1 py-3 bg-transparent h-auto data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none text-zinc-400 data-[state=active]:text-white transition-all text-sm font-medium whitespace-nowrap">
                            Notes
                        </TabsTrigger>
                    </TabsList>
                </div>

                {/* Content Area */}
                <div className="w-full">
                    <TabsContent value="general" className="mt-0 outline-none">
                        <SettingsGeneral />
                    </TabsContent>

                    <TabsContent value="integrations" className="mt-0 outline-none">
                        <SettingsIntegrations />
                    </TabsContent>

                    <TabsContent value="dependencies" className="mt-0 outline-none">
                        <SettingsDependencies />
                    </TabsContent>

                    <TabsContent value="users" className="mt-0 outline-none">
                        <SettingsUsers />
                    </TabsContent>

                    <TabsContent value="security" className="mt-0 outline-none">
                        <SettingsSecurity />
                    </TabsContent>

                    <TabsContent value="resources" className="mt-0 outline-none">
                        <SettingsResources />
                    </TabsContent>

                    <TabsContent value="pricing" className="mt-0 outline-none">
                        <SettingsPricing />
                    </TabsContent>

                    <TabsContent value="email" className="mt-0 outline-none">
                        <SettingsEmail />
                    </TabsContent>

                    <TabsContent value="backup" className="mt-0 outline-none">
                        <SettingsStorageBackup />
                    </TabsContent>

                    <TabsContent value="storage" className="mt-0 outline-none">
                        <SettingsStorageBackup />
                    </TabsContent>

                    <TabsContent value="logs" className="mt-0 outline-none">
                        <SettingsLogs />
                    </TabsContent>

                    <TabsContent value="notes" className="mt-0 outline-none">
                        <SettingsNotes />
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}
