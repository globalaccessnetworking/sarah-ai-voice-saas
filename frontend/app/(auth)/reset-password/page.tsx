import React, { Suspense } from "react";
import ResetPasswordClient from "./ResetPasswordClient";
import { Metadata } from "next";
import { Loader2 } from "lucide-react";

export const metadata: Metadata = {
    title: "Credential Update | Global Access AI Engine",
    description: "Update authorization credentials for Global Access AI Engine.",
};

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
            </div>
        }>
            <ResetPasswordClient />
        </Suspense>
    );
}
