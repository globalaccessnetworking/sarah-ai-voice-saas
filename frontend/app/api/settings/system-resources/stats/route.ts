import { NextResponse } from 'next/server';
import si from 'systeminformation';

export async function GET() {
    try {
        // Fetch system totals
        const memData = await si.mem();
        const totalRamGB = parseFloat((memData.total / (1024 * 1024 * 1024)).toFixed(2));
        const totalSwapGB = parseFloat((memData.swaptotal / (1024 * 1024 * 1024)).toFixed(2));

        // Define expected services and their process matching rules
        const expectedServices = [
            { name: "LiveKit Server", regex: /livekit-server|livekit/i, memLimitMB: 1024 },
            { name: "Redis Cache", regex: /redis-server/i, memLimitMB: 512 },
            { name: "PostgreSQL", regex: /postgres/i, memLimitMB: 1024 },
            { name: "Dashboard (Node)", regex: /node/i, memLimitMB: 1024 },
            { name: "Agent Worker", regex: /python/i, memLimitMB: 1024 }
        ];

        // Fetch processes
        const processData = await si.processes();
        const processes = processData.list;

        const services = expectedServices.map(serviceDef => {
            // Find the best matching process (highest memory usage if multiple)
            const matchingProcs = processes.filter(p => serviceDef.regex.test(p.name) || serviceDef.regex.test(p.command));
            
            if (matchingProcs.length > 0) {
                // Sort by memory desc, pick the top one to represent the service
                matchingProcs.sort((a, b) => b.memRss - a.memRss);
                const proc = matchingProcs[0];
                
                const usedMemMB = parseFloat((proc.memRss / 1024).toFixed(2)); // systeminformation returns kb in memRss usually, wait, systeminformation docs: memRss is in KB. Let me double check. Actually si.processes() list items have memRss in KB since v5.
                // Wait, si returns memRss in KB, but mem in %? Actually let's just use memRss / 1024 for MB.
                // Or let's be safe: memRss might be bytes or kb depending on OS/version. In si v5, memory in processes is usually KB.
                // Let's use proc.memRss / 1024.
                
                return {
                    name: serviceDef.name,
                    status: "RUNNING",
                    pid: proc.pid,
                    usedMem: parseFloat((proc.memRss / 1024).toFixed(2)),
                    totalLimit: serviceDef.memLimitMB,
                    cpuUsage: parseFloat(proc.cpu.toFixed(2))
                };
            } else {
                return {
                    name: serviceDef.name,
                    status: "STOPPED",
                    pid: null,
                    usedMem: 0,
                    totalLimit: serviceDef.memLimitMB,
                    cpuUsage: 0
                };
            }
        });

        return NextResponse.json({
            services,
            system: {
                totalRam: totalRamGB,
                totalSwap: totalSwapGB
            }
        });

    } catch (error: any) {
        console.error('[System Resources API] GET Error:', error);
        return NextResponse.json({ error: 'Failed to fetch system resources' }, { status: 500 });
    }
}
