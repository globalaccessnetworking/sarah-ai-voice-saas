#!/bin/bash
# Suthra Punjab - Lahore 042 Recording Setup Automation
# This script injects the MixMonitor recording logic into your extensions.conf

CONFIG_FILE="/etc/asterisk/extensions.conf"
MONITOR_DIR="/var/spool/asterisk/monitor"

echo "🚀 Starting Asterisk Recording Update..."

# 1. Verify existence
if [ ! -f "$CONFIG_FILE" ]; then
    echo "❌ Error: $CONFIG_FILE not found. Please run this on your Asterisk server."
    exit 1
fi

# 2. Backup
cp "$CONFIG_FILE" "${CONFIG_FILE}.bak_$(date +%Y%m%d_%H%M%S)"
echo "📦 Backup created: ${CONFIG_FILE}.bak"

# 3. Inject recording logic into the [from-nayatel] context for extension 32468161
# This logic finds the specific extension and adds the MixMonitor command
sed -i '/exten => 32468161,1,NoOp(--- CALLING LIVEKIT VIA ENCRYPTED TLS ---)/c\exten => 32468161,1,NoOp(--- CALLING LIVEKIT VIA ENCRYPTED TLS WITH RECORDING ---)\nsame => n,Set(CALLERID(num)=+92${CALLERID(num):1})\nsame => n,Set(REC_FILE=${STRFTIME(${EPOCH},,%Y%m%d-%H%M%S)}-${CALLERID(num)}-${EXTEN})\nsame => n,MixMonitor(/var/spool/asterisk/monitor/${REC_FILE}.wav,ab)' "$CONFIG_FILE"

# 4. Handle permissions
echo "📁 Setting up storage at $MONITOR_DIR"
mkdir -p "$MONITOR_DIR"
chown -R asterisk:asterisk "$MONITOR_DIR"
chmod -R 775 "$MONITOR_DIR"

# 5. Reload Asterisk
echo "🔄 Reloading Dialplan..."
asterisk -rx "dialplan reload"

echo "✅ SUCCESS: Call recording for 32468161 is now ACTIVE."
