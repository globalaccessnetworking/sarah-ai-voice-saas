import { NextResponse, NextRequest } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import si from 'systeminformation';

const execAsync = promisify(exec);

export async function GET() {
    try {
        const memData = await si.mem();
        const totalSwapGB = (memData.swaptotal / (1024 * 1024 * 1024)).toFixed(2);
        const usedSwapMB = (memData.swapused / (1024 * 1024)).toFixed(0);
        const freeSwapGB = (memData.swapfree / (1024 * 1024 * 1024)).toFixed(2);
        
        const isEnabled = memData.swaptotal > 0;
        
        let swapFile = "None";
        if (isEnabled) {
            try {
                // Attempt to get swap file path on Linux
                const { stdout } = await execAsync('swapon --show=NAME --noheadings');
                if (stdout.trim()) {
                    swapFile = stdout.trim();
                } else if (process.platform === 'win32') {
                    swapFile = "Pagefile (Windows)";
                } else {
                    swapFile = "Unknown";
                }
            } catch (e) {
                if (process.platform === 'win32') {
                    swapFile = "Pagefile (Windows)";
                }
            }
        }

        let swappiness = 60; // default Linux swappiness
        if (process.platform === 'linux') {
            try {
                const { stdout } = await execAsync('cat /proc/sys/vm/swappiness');
                swappiness = parseInt(stdout.trim(), 10) || 60;
            } catch (e) {
                // ignore
            }
        } else if (process.platform === 'win32') {
            swappiness = 0; // Windows doesn't use swappiness in the same way
        }

        return NextResponse.json({
            status: isEnabled ? "ENABLED" : "DISABLED",
            swapFile,
            total: totalSwapGB,
            used: usedSwapMB,
            free: freeSwapGB,
            swappiness
        });

    } catch (error: any) {
        console.error('[System Resources API] Swap GET Error:', error);
        return NextResponse.json({ error: 'Failed to fetch swap resources' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { swappiness } = body;

        if (typeof swappiness !== 'number' || swappiness < 0 || swappiness > 100) {
            return NextResponse.json({ error: 'Invalid swappiness value' }, { status: 400 });
        }

        if (process.platform !== 'linux') {
            return NextResponse.json({ error: 'Swappiness can only be configured on Linux' }, { status: 400 });
        }

        // Apply new swappiness
        await execAsync(`sysctl vm.swappiness=${swappiness}`);

        // Persist swappiness to sysctl.conf (simplified)
        await execAsync(`sed -i '/^vm.swappiness=/d' /etc/sysctl.conf`);
        await execAsync(`echo 'vm.swappiness=${swappiness}' >> /etc/sysctl.conf`);

        return NextResponse.json({ success: true, message: `Swappiness updated to ${swappiness}` });
    } catch (error: any) {
        console.error('[System Resources API] Swap POST Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to update swappiness' }, { status: 500 });
    }
}
