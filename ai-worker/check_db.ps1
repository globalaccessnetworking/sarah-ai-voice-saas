
# Load .env
$envFile = ".env"
Get-Content $envFile | Foreach-Object {
    if ($_ -match "^([^#\s][^=]*)=(.*)$") {
        $name = $matches[1].Trim()
        $value = $matches[2].Trim()
        [System.Environment]::SetEnvironmentVariable($name, $value, "Process")
    }
}

$dbUrl = [System.Environment]::GetEnvironmentVariable("DATABASE_URL")
if (-not $dbUrl) {
    Write-Host "DATABASE_URL not found"
    exit
}

# Simple way to check schema using powershell + python (since it's already there)
& "D:\AI AGENT SUTHRA PUNJAB\livekit-dashboard\venv\Scripts\python.exe" -c "import os, psycopg2; conn = psycopg2.connect(r'$dbUrl'); cur = conn.cursor(); [cur.execute(f\"SELECT column_name FROM information_schema.columns WHERE table_name = '{t}'\"), print(f'{t}: {[r[0] for r in cur.fetchall()]}')] for t in ['agents', 'complaints']; cur.close(); conn.close()"
