"use client";

import React from "react";
import { CheckCircle2, ArrowLeft, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter
} from "@/components/ui/card";
import Link from "next/link";

export default function LogoutPage() {
    return (
        <Card className="bg-zinc-950/50 border-zinc-800 backdrop-blur-xl shadow-2xl animate-in fade-in zoom-in-95 duration-500 border-t-2 border-t-emerald-500/20">
            <CardHeader className="space-y-4 pb-8">
                <div className="flex justify-center">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center group">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500 group-hover:scale-110 transition-transform" />
                    </div>
                </div>
                <div className="text-center space-y-1">
                    <CardTitle className="text-2xl font-bold tracking-tight text-white">Session Terminated</CardTitle>
                    <CardDescription className="text-zinc-500 font-medium">You have been successfully logged out of the node.</CardDescription>
                </div>
            </CardHeader>
            <CardContent className="py-8 flex flex-col items-center space-y-4">
                <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 flex items-center gap-4 w-full">
                    <div className="p-2 rounded-lg bg-zinc-800">
                        <LogOut className="w-4 h-4 text-zinc-400" />
                    </div>
                    <div className="space-y-0.5">
                        <p className="text-xs font-bold text-white uppercase tracking-wider">Identity Cleared</p>
                        <p className="text-[10px] text-zinc-600">Local cache and secure tokens purged.</p>
                    </div>
                </div>
                <p className="text-xs text-zinc-500 text-center leading-relaxed">
                    To re-establish a secure connection, please return to the gateway and provide your identity credentials.
                </p>
            </CardContent>
            <CardFooter className="pb-8">
                <Link href="/login" className="w-full">
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-12 rounded-xl transition-all active:scale-[0.98] group">
                        <span className="flex items-center gap-2">
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Return to Gateway
                        </span>
                    </Button>
                </Link>
            </CardFooter>
        </Card>
    );
}
