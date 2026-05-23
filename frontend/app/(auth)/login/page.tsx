import React from "react";
import LoginClient from "./LoginClient";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Authorize Access | Global Access AI Engine",
    description: "Secure gateway for Global Access AI Engine nodes.",
};

export default function LoginPage() {
    return <LoginClient />;
}
