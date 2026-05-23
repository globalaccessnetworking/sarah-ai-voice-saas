export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        id: "call_ptcl_lhr_55921",
        date: "2026-03-11T14:30:00Z",
        duration: 45,
        caller: "+92 300 1234567",
        agent: "Urdu Support Agent",
        audioUrl: "/mock-audio/demo-call.wav",
        claudeGrade: {
            score: 8.5,
            breakdown: {
                understanding: 9.0, // Handled code-switching perfectly
                latency: 8.0, // Slight delay on first token
                politeness: 9.5 // Excellent use of honorifics
            },
            feedback: "The AI agent correctly recognized the term 'Ghattar' and instantly mapped it to sewerage via the RAG dictionary. It responded politely. However, there was a minor 1.2s gap before the wait-filler triggered."
        },
        transcript: [
            { 
                speaker: "ai", 
                startTime: 0.5, 
                endTime: 3.2, 
                words: [
                    { text: "Assalam", start: 0.5, end: 1.0 },
                    { text: "o", start: 1.0, end: 1.2 },
                    { text: "Alaikum,", start: 1.2, end: 1.8 },
                    { text: "Global", start: 1.9, end: 2.3 },
                    { text: "Access", start: 2.3, end: 2.7 },
                    { text: "Support", start: 2.7, end: 3.2 }
                ] 
            },
            {
                speaker: "user",
                startTime: 4.0,
                endTime: 8.5,
                words: [
                    { text: "Bhai", start: 4.0, end: 4.5 },
                    { text: "Jaan,", start: 4.5, end: 5.0 },
                    { text: "idhar", start: 5.1, end: 5.4 },
                    { text: "Johar", start: 5.4, end: 5.8 },
                    { text: "Town", start: 5.8, end: 6.2 },
                    { text: "mein", start: 6.2, end: 6.5 },
                    { text: "ghattar", start: 6.6, end: 7.2 },
                    { text: "ka", start: 7.2, end: 7.4 },
                    { text: "masla", start: 7.4, end: 8.0 },
                    { text: "hai.", start: 8.0, end: 8.5 }
                ]
            },
            {
                speaker: "ai",
                startTime: 10.0,  // Wait filler happened here implicitly
                endTime: 16.0,
                words: [
                    { text: "Mafi", start: 10.0, end: 10.5 },
                    { text: "chahta", start: 10.5, end: 11.0 },
                    { text: "hoon", start: 11.0, end: 11.5 },
                    { text: "zubair", start: 11.6, end: 12.2 },
                    { text: "bhai,", start: 12.2, end: 12.8 },
                    { text: "main", start: 13.0, end: 13.3 },
                    { text: "team", start: 13.3, end: 13.8 },
                    { text: "ko", start: 13.8, end: 14.0 },
                    { text: "abhi", start: 14.0, end: 14.5 },
                    { text: "Johar", start: 14.5, end: 15.0 },
                    { text: "Town", start: 15.0, end: 15.5 },
                    { text: "bhejta", start: 15.6, end: 16.0 }
                ]
            }
        ]
    });
}
