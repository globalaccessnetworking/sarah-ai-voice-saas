# Phase 10 — ViciDial AI JOIN Bridge
## Setup Instructions

---

## 1. Create Dedicated Asterisk AMI User `ai_join`

Edit `/etc/asterisk/manager.conf` on the production server:

```ini
; Dedicated AI JOIN manager user — Phase 10
; Localhost only, minimum required permissions
[ai_join]
secret=<GENERATE_STRONG_RANDOM_SECRET>   ; Use: openssl rand -base64 32
deny=0.0.0.0/0.0.0.0
permit=127.0.0.1/255.255.255.255
read=system
write=originate
```

> **Generate a strong secret (run on server):**
> ```bash
> openssl rand -base64 32
> ```
> Copy the output — this is your `ASTERISK_AMI_SECRET`.
> **Do NOT paste it anywhere in chat.**

Reload the AMI without restarting Asterisk:
```bash
asterisk -rx "manager reload"
asterisk -rx "manager show user ai_join"
```

Expected output:
```
Username: ai_join
Secret: <hidden>
ACL: 127.0.0.1/255.255.255.255
Read Perms: system
Write Perms: originate
```

---

## 2. Set Environment Variables

Add to `/opt/global-access/livekit-dashboard/frontend/.env.local`:

```env
# ── Phase 10: Asterisk AMI AI JOIN Bridge ──────────────────────────────────────
ASTERISK_AMI_HOST=127.0.0.1
ASTERISK_AMI_PORT=5038
ASTERISK_AMI_USER=ai_join
ASTERISK_AMI_SECRET=<paste secret from step 1 here — never share in chat>

# Dedicated AI Join token (used by the API and ViciDial button page)
# Generate: openssl rand -hex 32
VICIDIAL_AI_JOIN_TOKEN=<generate strong random token>

# SIP peer name for outbound AI leg (default: LIVEKIT_SIP)
AI_JOIN_SIP_PEER=LIVEKIT_SIP

# Asterisk dialplan context for AI join (default: default)
AI_JOIN_CONTEXT=default

# CLI fallback — set true ONLY for emergency use. Default: false (AMI only)
AI_JOIN_ENABLE_CLI_FALLBACK=false
```

> **Important**: `VICIDIAL_AI_JOIN_TOKEN` is the same token used in the ViciDial button URL
> (`?token=...`) AND as the `Authorization: Bearer` header in direct API calls.
> This is the only token ViciDial agents see in their browser URL.
> The `ASTERISK_AMI_SECRET` is NEVER sent to the browser — it lives only on the server.

---

## 3. Restart the Frontend

```bash
pm2 restart sarah-frontend --update-env
# Or: pm2 restart all --update-env
```

---

## 4. Test the Endpoint

### Auth rejection test (no token):
```bash
curl -s -X POST "http://127.0.0.1:3000/api/integrations/vicidial/ai-join" \
  -H "Content-Type: application/json" \
  -d '{"phone":"923312229050","conf_exten":"8600001"}' | python3 -m json.tool
# Expected: {"error":"Unauthorized. Valid token required.","request_id":"..."}
```

### Input validation test (bad phone):
```bash
curl -s -X POST "http://127.0.0.1:3000/api/integrations/vicidial/ai-join" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_VICIDIAL_AI_JOIN_TOKEN>" \
  -d '{"phone":"abc123","conf_exten":"8600001"}' | python3 -m json.tool
# Expected: {"error":"Invalid phone. Must be 7–15 digits only.","request_id":"..."}
```

### Live AI JOIN test (customer must be on a live call in MeetMe 8600001):
```bash
curl -s -X POST "http://127.0.0.1:3000/api/integrations/vicidial/ai-join" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_VICIDIAL_AI_JOIN_TOKEN>" \
  -d '{
    "user": "1001",
    "conf_exten": "8600001",
    "phone": "923312229050",
    "lead_id": "14",
    "campaign_id": "CAMP01",
    "list_id": "998",
    "ingroup": "SALES_IN",
    "first_name": "Hamza",
    "last_name": "Noor",
    "custom_fields": {
      "business_nature": "Managed IT Services",
      "pain_point": "cybersecurity support",
      "company_name": "Global Access"
    }
  }' | python3 -m json.tool
```

### Expected success response:
```json
{
  "success": true,
  "request_id": "uuid",
  "message": "AI join originated successfully.",
  "phone": "923312229050",
  "conf_exten": "8600001",
  "lead_id": "14",
  "redis": { "keys_written": ["vicidial_context:phone:923312229050", "vicidial_context:lead:14"], "ttl": 3600, "target": "..." },
  "asterisk": {
    "method": "AMI",
    "originate_status": "success",
    "channel": "SIP/LIVEKIT_SIP/923312229050",
    "exten": "8600001",
    "context": "default"
  }
}
```

---

## 5. Worker Log Verification

After AI JOIN, confirm worker logs show:
```
[VICIDIAL_CONTEXT] lookup_hit=true key=vicidial_context:phone:923312229050
[VICIDIAL_MAPPING] resolved mapping_id=... score=... campaign_id=CAMP01
[VICIDIAL_AGENT] override_applied=true
```

Check:
```bash
tail -n 100 /root/.pm2/logs/sarah-outbound-out-1.log | grep -E "VICIDIAL_CONTEXT|VICIDIAL_MAPPING|lookup_hit|override_applied"
```

---

## 6. ViciDial Button Configuration

In ViciDial Admin → `Admin → User Groups` → Edit → `Custom Button`:

- **Button Label**: `🤖 AI JOIN`
- **URL**: 
```
https://YOUR_SAAS_DOMAIN/vicidial-ai-join?token=YOUR_VICIDIAL_AI_JOIN_TOKEN&user=[user]&conf_exten=[conf_exten]&phone=[phone_number]&phone_code=[phone_code]&lead_id=[lead_id]&first_name=[first_name]&last_name=[last_name]&campaign_id=[campaign]&list_id=[list_id]&ingroup=[group_id]&email=[email]
```
- **Target**: New window / popup

The page auto-triggers the join on load. The agent just clicks the button — the AI joins the conference within 2–3 seconds.

---

## 7. Files Changed in Phase 10

| File | Status |
|------|--------|
| `frontend/lib/vicidial-context.ts` | **NEW** — Shared Redis seeding + validation helpers |
| `frontend/app/api/integrations/vicidial/ai-join/route.ts` | **NEW** — Core AI JOIN endpoint (AMI + optional CLI fallback) |
| `frontend/app/vicidial-ai-join/page.tsx` | **NEW** — Public button page for ViciDial agents |
| `frontend/app/api/integrations/vicidial/lead-context/route.ts` | **MODIFIED** — Uses shared helper (behavior unchanged) |
| `frontend/middleware.ts` | **MODIFIED** — `/vicidial-ai-join` whitelisted as public route |
| `frontend/app/(dashboard)/integrations/page.tsx` | **MODIFIED** — AI JOIN panel added to ViciDial drawer |

---

## 8. Rollback Plan

If AI JOIN endpoint causes issues:
1. The endpoint is additive — removing it does not affect any existing functionality.
2. `lead-context` refactor is fully backwards compatible — same keys, same TTL, same response shape.
3. To revert: `git revert HEAD` (single commit reverts all Phase 10 files).
4. The manual `asterisk -rx "channel originate SIP/LIVEKIT_SIP/<phone> extension <conf_exten>@default"` command continues to work as a manual fallback regardless.

---

## 9. Do NOT Change

- `campaign_refill.py`
- `outbound_dialer.py`
- SIP/8001 forced codec (`ulaw/alaw`)
- ViciDial native PHP/dialplan
- DB schema (no new tables)
