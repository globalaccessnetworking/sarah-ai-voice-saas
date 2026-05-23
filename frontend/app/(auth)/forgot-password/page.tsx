import React from "react";
import ForgotPasswordClient from "./ForgotPasswordClient";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Identity Recovery | Global Access AI Engine",
    description: "Initiate credential recovery for Global Access AI Engine.",
};

export default function ForgotPasswordPage() {
    return <ForgotPasswordClient />;
}
