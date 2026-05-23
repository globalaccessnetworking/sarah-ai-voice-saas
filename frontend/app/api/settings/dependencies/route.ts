import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';
import { promisify } from 'util';
import fs from 'fs';
import fsPromises from 'fs/promises';

const execAsync = promisify(exec);

// Helper to resolve paths
const getPaths = () => {
    const isWindows = process.platform === 'win32';
    const aiWorkerPath = path.join(process.cwd(), '..', 'ai-worker');
    const requirementsPath = path.join(process.cwd(), '..', 'ai-worker', 'requirements.txt');

    // Resolve path to pip based on the OS
    const pipPath = isWindows
        ? path.join(aiWorkerPath, 'venv', 'Scripts', 'pip.exe')
        : path.join(aiWorkerPath, 'venv', 'bin', 'pip');

    return { aiWorkerPath, requirementsPath, pipPath, isWindows };
};

// Crucial Security: Sanitize package name against shell injection
function sanitizePackageName(name: string): string | null {
    if (!name || typeof name !== 'string') return null;
    const sanitized = name.trim();
    if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(sanitized)) return null;
    return sanitized;
}

export async function GET() {
    try {
        const { pipPath } = getPaths();

        // Graceful handling if venv doesn't exist
        if (!fs.existsSync(pipPath)) {
            console.warn(`[Dependencies API] WARNING: pip executable not found at ${pipPath}.`);
            return NextResponse.json({}, { status: 200 });
        }

        // Execute pip list
        const { stdout } = await execAsync(`"${pipPath}" list --format=json`);

        const packages = JSON.parse(stdout);
        const dependencies: Record<string, string> = {};

        // Map the output array into a clean dictionary
        for (const pkg of packages) {
            if (pkg.name && pkg.version) {
                dependencies[pkg.name] = pkg.version;
            }
        }

        return NextResponse.json(dependencies, { status: 200 });
    } catch (error) {
        console.warn('[Dependencies API] Execution failed:', error);
        // Robust error handling: return 200 OK with empty object so UI doesn't crash
        return NextResponse.json({}, { status: 200 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { package_name, install_type } = body;

        const sanitized = sanitizePackageName(package_name);
        if (!sanitized) {
            return NextResponse.json({ error: 'Invalid package name' }, { status: 400 });
        }

        const { requirementsPath, pipPath } = getPaths();

        if (!fs.existsSync(pipPath)) {
            return NextResponse.json({ error: 'pip not found in venv' }, { status: 500 });
        }

        // Execute pip install
        await execAsync(`"${pipPath}" install ${sanitized} --upgrade --no-cache-dir`, { timeout: 60000 });

        // Post-Install Version Verification
        let newVersion = "unknown";
        try {
            const { stdout } = await execAsync(`"${pipPath}" show ${sanitized}`);
            const versionMatch = stdout.match(/^Version:\s*(.+)$/m);
            if (versionMatch && versionMatch[1]) {
                newVersion = versionMatch[1].trim();
            }
        } catch (e) {
            console.warn(`[Dependencies API] Could not verify version for ${sanitized}`);
        }

        // Permanent Persistence Logic
        if (install_type === 'permanent') {
            let requirements = '';
            if (fs.existsSync(requirementsPath)) {
                requirements = await fsPromises.readFile(requirementsPath, 'utf-8');
            }

            const lines = requirements.split('\n').filter(line => line.trim() !== '');
            const pkgMap = new Map();
            for (const line of lines) {
                const cleanLine = line.split('==')[0].trim().toLowerCase();
                pkgMap.set(cleanLine, line.trim());
            }
            // Inject version pin if verified, else fallback to latest untracked
            const finalReqString = newVersion !== "unknown" ? `${sanitized.toLowerCase()}==${newVersion}` : sanitized.toLowerCase();
            pkgMap.set(sanitized.toLowerCase(), finalReqString);
            
            const sortedLines = Array.from(pkgMap.values()).sort();
            await fsPromises.writeFile(requirementsPath, sortedLines.join('\n') + '\n');
        }

        return NextResponse.json({ success: true, message: 'Installed successfully', newVersion }, { status: 200 });
    } catch (error: any) {
        console.error('[Dependencies API] POST Error:', error);
        let errorMsg = error.stderr || error.message || 'Internal Server Error';
        if (error.stderr && typeof error.stderr === 'string') {
            const lines = error.stderr.split('\n').filter((l: string) => l.trim().length > 0);
            if (lines.length > 3) {
                errorMsg = lines.slice(-3).join('\n');
            }
        }
        return NextResponse.json({ error: errorMsg }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        let package_name: string | null = null;

        const urlReq = new URL(req.url);
        if (urlReq.searchParams.has('package_name')) {
            package_name = urlReq.searchParams.get('package_name');
        } else {
            const body = await req.json();
            package_name = body.package_name;
        }

        const sanitized = sanitizePackageName(package_name || '');
        if (!sanitized) {
            return NextResponse.json({ error: 'Invalid package name' }, { status: 400 });
        }

        const { requirementsPath, pipPath } = getPaths();

        if (!fs.existsSync(pipPath)) {
            return NextResponse.json({ error: 'pip not found in venv' }, { status: 500 });
        }

        // Execute pip uninstall
        await execAsync(`"${pipPath}" uninstall -y ${sanitized}`, { timeout: 60000 });

        // Cleanup Logic from requirements.txt
        if (fs.existsSync(requirementsPath)) {
            const requirements = await fsPromises.readFile(requirementsPath, 'utf-8');
            const lines = requirements.split('\n');
            const newLines = lines.filter(line => {
                if (!line.trim()) return false; // filter empty lines safely
                const cleanLine = line.split('==')[0].trim().toLowerCase();
                return cleanLine !== sanitized.toLowerCase();
            });
            await fsPromises.writeFile(requirementsPath, newLines.join('\n') + '\n');
        }

        return NextResponse.json({ success: true, message: 'Uninstalled successfully' }, { status: 200 });

    } catch (error: any) {
        console.error('[Dependencies API] DELETE Error:', error);
        return NextResponse.json({ error: error.stderr || error.message || 'Internal Server Error' }, { status: 500 });
    }
}
