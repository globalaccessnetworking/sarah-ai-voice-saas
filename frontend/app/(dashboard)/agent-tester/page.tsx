"use client";

import dynamic from 'next/dynamic';
import React, { useEffect, useState } from 'react';

const AgentProvingGround = dynamic(
    () => import('@/components/AgentProvingGround'),
    { ssr: false }
);

function NoSSR({ children }: { children: React.ReactNode }) {
    const [isClient, setIsClient] = useState(false);
    useEffect(() => {
        setIsClient(true);
    }, []);

    return isClient ? <>{children}</> : null;
}

export default function AgentTesterPage() {
    return (
        <NoSSR>
            <AgentProvingGround />
        </NoSSR>
    );
}
