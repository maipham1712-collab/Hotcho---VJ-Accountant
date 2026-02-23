# Architecture — Hot Choco System

## System Diagram

```
                    ┌──────────────────────────────────────┐
                    │            TELEGRAM BOT               │
                    │   Staff send: selfies, commands,      │
                    │   photos, button taps                 │
                    └───────────────┬──────────────────────┘
                                    │
                                    ▼
                    ┌──────────────────────────────────────┐
                    │         n8n ORCHESTRATION             │
                    │    hotchoco.nerdsociety.com.vn:8443   │
                    │                                      │
                    │  ┌─────────────────────────────────┐ │
                    │  │ WF1: Sales & Commands            │ │
                    │  │ • Selfie check-in                │ │
                    │  │ • /help /sales /status /ks /bctc │ │
                    │  │ • EOD auto-report (cron)         │ │
                    │  └─────────────────────────────────┘ │
                    │                                      │
                    │  ┌─────────────────────────────────┐ │
                    │  │ WF2: Consignment Receive         │ │
                    │  │ • /receive → photo intake        │ │
                    │  │ • Category assignment             │ │
                    │  │ • /finalize → Drive + Sheets     │ │
                    │  └─────────────────────────────────┘ │
                    │                                      │
                    │  ┌─────────────────────────────────┐ │
                    │  │ FUTURE WORKFLOWS                 │ │
                    │  │ • Financial reports (BCTC)       │ │
                    │  │ • Payroll calculation             │ │
                    │  │ • Settlement processing           │ │
                    │  │ • AI receipt parsing              │ │
                    │  └─────────────────────────────────┘ │
                    └───────┬──────────────┬───────────────┘
                            │              │
                   ┌────────▼────┐  ┌──────▼──────┐
                   │Google Sheets│  │Google Drive  │
                   │  (Data)     │  │  (Photos)    │
                   │             │  │              │
                   │• Orders     │  │• Consignment │
                   │• Order_Items│  │  photo folder│
                   │• Consignment│  │              │
                   └─────────────┘  └──────────────┘
```

## Workflow Details

### WF1: Sales & Commands (`YhRSnQb9MnXl7jOj`)

**Triggers:**
1. `Telegram Trigger` — listens for all messages
2. `EOD Schedule` — cron at `30 15 * * *` (22:30 VN)

**Flow:**
```
Telegram Message
  └─ Is Selfie? (has photo?)
      ├─ YES → Check-in Data → Reply Check-in
      └─ NO → Route Command
              ├─ /help → Reply Help
              ├─ /sales → Get Orders → Calc Sales → Reply Sales
              ├─ /status → Get Orders → Calc Status → Reply Status
              ├─ /ks → Get Items KS → Calc KS → Reply KS
              ├─ /bctc → "Coming soon"
              └─ default → Reply Other

EOD Schedule (22:30 VN)
  └─ Get Orders → Calc EOD Report → Send to Mai
```

### WF2: Consignment Receive (`4lIh7RUWxGlpqX9l`)

**Trigger:** `Telegram Trigger` — listens for messages + callback_query

**Flow:**
```
Telegram Update
  └─ Router (code node)
      ├─ "receive" → Parse Receive → Store Batch → Reply Batch Created
      ├─ "photo" → Process Photo → Ask Category (with inline buttons)
      ├─ "callback" → Process Callback → Reply Category Set
      └─ "other" → Handle /finalize, /done, /batches
                     └─ /finalize → Reply Finalizing
                                    → Split Items
                                    → Get Photo from Telegram
                                    → Upload to Drive
                                    → Build Sheet Rows
                                    → Write to Sheet
                                    → Finalize Summary
                                    → Reply Done
```

## Known Architecture Issues

### 1. Dual Telegram Triggers (Critical)
Both WF1 and WF2 use `telegramTrigger` on the same bot token. This means:
- Telegram sends each update to ONE webhook only
- Whichever workflow registered last gets the webhook
- The other workflow stops receiving messages

**Fix**: Merge into a **single master workflow** with a router, or use a single trigger workflow that dispatches to sub-workflows via n8n's "Execute Workflow" node.

### 2. Volatile Batch Storage (High)
Consignment batches are stored in `$getWorkflowStaticData('global')`. This data:
- Survives within a single n8n process
- Is **LOST** when n8n restarts or redeploys
- Has no backup

**Fix**: Store batch state in Google Sheets (a `Batches` tab) or a database.

### 3. No User Authorization (Medium)
Any Telegram user can send commands. There's no check on `userId` or `chatId` before executing commands.

**Fix**: Add an authorization check node at the start:
```javascript
const ALLOWED_USERS = [8449351519, /* other staff IDs */];
const MAI_ONLY_CMDS = ['/ks', '/bctc', '/settle'];
if (!ALLOWED_USERS.includes(userId)) return ignore;
if (MAI_ONLY_CMDS.includes(cmd) && userId !== 8449351519) return "unauthorized";
```

### 4. Missing Inline Keyboard (Low)
The "Ask Category" node in WF2 sends a text message asking for category but doesn't include inline keyboard buttons. The callback handler expects button presses with data like `cat_3_R`.

**Fix**: Add `reply_markup` with `inline_keyboard` to the Telegram send message:
```json
{
  "inline_keyboard": [
    [{"text": "💍 Ring", "callback_data": "cat_1_R"}, {"text": "📿 Necklace", "callback_data": "cat_1_N"}],
    [{"text": "⌚ Bracelet", "callback_data": "cat_1_BR"}, {"text": "✨ Ear Stud", "callback_data": "cat_1_ES"}]
  ]
}
```
