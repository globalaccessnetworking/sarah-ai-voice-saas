"use client";

import React from 'react';

export default function TabPlaceholder({ name }: { name: string }) {
    return (
        <div className="p-20 border border-zinc-800 border-dashed rounded-3xl flex flex-col items-center justify-center text-center animate-in fade-in duration-700">
            <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mb-6 border border-zinc-800 text-zinc-500">
                {name[0]}
            </div>
            <h2 className="text-xl font-bold text-zinc-100 mb-2">{name}</h2>
            <p className="text-zinc-500 text-sm max-w-sm">
                This section is currently under migration. Technical metrics for {name} will be available in the next deployment phase.
            </p>
        </div>
    );
}
