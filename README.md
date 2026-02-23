# 🍫 Hot Choco — AI Accountant for Viet Jewelers

**Hot Choco** is an AI-powered bookkeeping & operations bot for **Viet Jewelers (VJ)** and **Nerd Society**, built on [n8n](https://n8n.io) with a Telegram bot interface. It automates daily sales reporting, staff check-ins, consignment intake, and financial settlement tracking.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Current Status](#current-status)
- [What's Working](#whats-working)
- [What Needs to Be Built](#what-needs-to-be-built)
- [Infrastructure](#infrastructure)
- [Data Model](#data-model)
- [Getting Started](#getting-started)
- [Business Rules](#business-rules)

---

## Overview

Hot Choco serves as the central AI accountant that replaces the need for a human bookkeeper. Staff interact with it via a **Telegram bot**. The system reads/writes data from **Google Sheets** (current data layer) and uploads media to **Google Drive**.

### Key Personas

| Role | Telegram ID | Permissions |
|------|-------------|-------------|
| **Mai** (Owner) | `8449351519` | Full access, approval authority, financial reports |
| **Staff** (Linh, Thái, Huyền) | TBD | Check-in/out, sales viewing |
| **Artists** (consignment partners) | TBD | View their consignment items |

---

## Architecture

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────────┐
│  Telegram Bot    │◄───►│  n8n Server  │◄───►│  Google Sheets  │
│  (User Interface)│     │  (Self-hosted)│     │  (Data Layer)   │
└─────────────────┘     └──────┬───────┘     └─────────────────┘
                               │
                        ┌──────┴───────┐
                        │ Google Drive  │
                        │ (Photo Store) │
                        └──────────────┘
```

### Tech Stack

| Component | Technology | Details |
|-----------|-----------|---------|
| **Orchestration** | n8n v2.7.4 (self-hosted) | `hotchoco.nerdsociety.com.vn:8443` |
| **Bot Interface** | Telegram Bot API | Via n8n Telegram nodes |
| **Data Layer** | Google Sheets | Sheet ID: `17WfwIy5WfN2uS51q-DrPtMlE-WHfqwWXvIghMbq697o` |
| **File Storage** | Google Drive | Folder: `15FfPWyROEKqPdnH3mXYRbwctHu9j4MjK` |
| **Auth** | Google Service Account | Credential ID in n8n: `L3VaG4Y8rh7wU28O` |
| **AI** | Claude API (Anthropic) | For future AI reasoning features |

---

## Current Status

### ✅ What's Working (Production)

#### 1. Sales & Commands Workflow (`YhRSnQb9MnXl7jOj`) — ACTIVE
- **Selfie check-in**: Staff send a photo → system logs time, calculates late penalty
  - On time (before 9:05): No penalty
  - 9:05–9:30: 30,000 VND penalty
  - After 9:30: 100,000 VND penalty
- **`/help`**: Shows command menu
- **`/sales`**: Today's sales from Google Sheets (Orders tab)
- **`/status`**: Today's summary with per-staff breakdown
- **`/ks`**: Kensho brand settlement status (commission tracking)
- **`/bctc`**: Financial report (stub — returns "coming soon")
- **EOD Report**: Scheduled daily at 22:30 VN time (15:30 UTC), sends summary to Mai

#### 2. Consignment Receive Workflow (`4lIh7RUWxGlpqX9l`) — ACTIVE
- **`/receive [brand] [count]`**: Starts a consignment batch
  - Valid brands: `KS, CH, MD, OTS, KP, KR, CT, TF`
  - Generates batch ID like `CH-130226`
- **Photo intake**: Receives photos one-by-one, tracks count
- **Category assignment**: Inline buttons for jewelry categories (RING, NECKLACE, BRACELET, etc.)
- **Product code generation**: `BRAND + CATEGORY + DATESEQ` format (e.g., `CHR13022601`)
- **`/finalize`**: Uploads all photos to Google Drive, writes rows to Consignment sheet
- **`/batches`**: Lists active batches

#### 3. Original Bot (`nBPLm4EPveTcG6SX`) — INACTIVE (superseded by v2)

---

### 🚧 What Needs to Be Built

#### Priority 1 — Core Accounting Features

1. **`/bctc` Financial Report (Báo Cáo Tài Chính)**
   - Daily P&L summary
   - Revenue by brand, by payment method
   - Cost of goods sold tracking
   - Gross margin calculation
   - Monthly rollup

2. **Payroll Calculator**
   - Base salary tracking per staff
   - Commission calculation (varies by brand — see business rules)
   - Late penalty deduction integration
   - Monthly payroll summary
   - VJ pays artists on consignment settlement basis

3. **Consignment Settlement (`/settle`)**
   - Track which consignment items have been sold
   - Calculate artist payout (cost price) vs VJ commission
   - Generate settlement report per brand/artist
   - Mark items as settled in sheet

4. **Stock Import Processing**
   - Parse vendor invoice photos (Thai Factory format)
   - Extract item details: weight, stone description, price
   - Apply pricing formulas (gold weight × market rate + stone cost + labor)
   - Auto-populate product catalog

#### Priority 2 — Operations

5. **Check-in/Check-out System (Upgrade)**
   - Current: Only check-in (selfie = check-in)
   - Needed: Check-out tracking (second selfie or /checkout command)
   - Work hours calculation
   - Overtime tracking
   - Monthly attendance report

6. **Daily Cash Reconciliation**
   - End of day cash count vs POS totals
   - Discrepancy flagging
   - Photo receipt for cash count

7. **Inventory Alerts**
   - Low stock notifications
   - Consignment items approaching settlement deadline
   - Unsold items aging report

#### Priority 3 — AI Features

8. **AI-Powered Receipt Parsing**
   - Staff photographs a receipt → Claude extracts line items
   - Auto-create order in Google Sheets
   - Handle both Vietnamese and English receipts

9. **Natural Language Queries**
   - "How much did we sell last week?"
   - "What's our best selling brand this month?"
   - Use Claude API for intent parsing → query sheets → respond

10. **Smart EOD Report**
    - Compare today vs same day last week/month
    - Highlight anomalies
    - Sales trend analysis

---

## Data Model

### Google Sheets Structure

The main spreadsheet (`17WfwIy5WfN2uS51q-DrPtMlE-WHfqwWXvIghMbq697o`) has these tabs:

#### `Orders` Sheet
| Column | Type | Description |
|--------|------|-------------|
| `order_id` | String | Unique order identifier |
| `order_date` | DateTime | `YYYY-MM-DD HH:mm` format, VN timezone |
| `staff_id` | String | `S01`=Mai, `S02`=Linh, `S03`=Thái, `S04`=Huyền, `S05`=Cover |
| `grand_total` | Number | Total order amount in VND |
| `status` | String | `ACTIVE`, `VOID`, `RETURN` |
| `payment_method` | String | `CASH`, `TRANSFER`, `CARD` |
| `customer_name` | String | Optional |
| `notes` | String | Optional |

#### `Order_Items` Sheet
| Column | Type | Description |
|--------|------|-------------|
| `order_id` | String | FK to Orders |
| `product_id` | String | Product code |
| `product_name` | String | Display name |
| `brand_id` | String | `KS`, `CH`, `MD`, etc. |
| `unit_price` | Number | Selling price VND |
| `line_base_cost` | Number | Cost price VND |
| `commission_full` | Number | Commission amount VND |
| `quantity` | Number | Usually 1 for jewelry |

#### `Consignment` Sheet
| Column | Type | Description |
|--------|------|-------------|
| `batch_id` | String | e.g. `CH-130226` |
| `num` | Number | Item number in batch |
| `product_code` | String | Generated code |
| `category` | String | RING, NECKLACE, etc. |
| `import_date` | Date | When received |
| `brand` | String | Brand code |
| `photo_url` | URL | Google Drive link |
| `cost_price` | Number | Artist's cost (filled by artist) |
| `stone_description` | String | Filled by artist |
| `product_name` | String | Filled by staff |
| `retail_price` | Number | Set after Mai approval |
| `status` | String | `AWAITING_ARTIST`, `PRICED`, `APPROVED`, `LISTED`, `SOLD`, `SETTLED` |
| `mai_approved` | String | `YES`/`NO` |

#### Sheets Still Needed (to be created):
- `Staff` — Staff profiles, base salary, bank details
- `Attendance` — Check-in/out log
- `Settlements` — Consignment payout records
- `Expenses` — Operating expenses
- `Inventory` — Live stock count

---

## Business Rules

### Staff & Commission

| Staff ID | Name | Role | Base Salary |
|----------|------|------|-------------|
| S01 | Mai | Owner | N/A |
| S02 | Linh | Sales | TBD |
| S03 | Thái | Sales | TBD |
| S04 | Huyền | Sales | TBD |
| S05 | Cover | Part-time | TBD |

### Consignment Brands

| Code | Full Name | Commission Structure |
|------|-----------|---------------------|
| KS | Kensho | VJ keeps markup above cost price |
| CH | [Brand] | TBD - confirm with Mai |
| MD | [Brand] | TBD - confirm with Mai |
| OTS | [Brand] | TBD - confirm with Mai |
| KP | [Brand] | TBD - confirm with Mai |
| KR | [Brand] | TBD - confirm with Mai |
| CT | [Brand] | TBD - confirm with Mai |
| TF | Thai Factory | VJ buys outright (not consignment) |

### Product Categories

| Code | Name |
|------|------|
| R | Ring |
| N | Necklace |
| BR | Bracelet |
| ES | Ear Stud |
| EP | Ear Hoop |
| EC | Ear Cuff |
| EK | Ear Hook |
| CN | Chain |
| PD | Pendant |
| BG | Bangle |
| AC | Accessory |
| W | Watch |

### Check-in Rules
- Shift start: 9:00 AM (VN time, GMT+7)
- Grace period: until 9:05 AM
- Late 9:05–9:30: 30,000 VND penalty
- Late after 9:30: 100,000 VND penalty
- Check-in method: Send selfie photo to bot

### EOD Report
- Auto-sends at 22:30 VN time daily
- Recipient: Mai (chat ID `8449351519`)
- Includes: order count, total revenue, per-staff breakdown

---

## Infrastructure

### n8n Instance
- **URL**: `https://hotchoco.nerdsociety.com.vn:8443`
- **Version**: 2.7.4
- **Owner**: `vietjewelers@gmail.com`

### Required Credentials (in n8n)
| Credential | ID | Purpose |
|------------|-----|---------|
| Telegram Bot | `IsWkq2adeT8oRkDF` | Bot API access |
| Google Service Account | `L3VaG4Y8rh7wU28O` | Sheets + Drive access |

### Google Drive
- **Consignment Photos Folder**: `15FfPWyROEKqPdnH3mXYRbwctHu9j4MjK`

---

## Getting Started

### For the Developer

1. **Get n8n access**: Request login to `https://hotchoco.nerdsociety.com.vn:8443`
2. **Review existing workflows**: Import the JSON files in `/workflows/` or view them directly in n8n
3. **Understand the data**: Open the Google Sheet and study the existing tabs
4. **Read business rules**: See `docs/business-rules/` for detailed specs
5. **Start with Priority 1**: Build `/bctc`, payroll, and settlement features

### Workflow Files
- `workflows/hot-choco-sales-commands.json` — Main bot (Sales, Check-in, Commands)
- `workflows/hot-choco-consignment-receive.json` — Consignment intake flow
- `workflows/hot-choco-telegram-bot-v1.json` — Original bot (reference only, inactive)

### Environment Variables / Secrets Needed
```
TELEGRAM_BOT_TOKEN=<get from Mai>
GOOGLE_SERVICE_ACCOUNT_KEY=<get from Mai>
ANTHROPIC_API_KEY=<for AI features>
```

---

## Notes for Developer

### Known Issues
1. **Two Telegram triggers on same bot**: The Sales workflow and Consignment workflow both listen on the same Telegram bot. This can cause conflicts. Consider merging into a single workflow with a master router.
2. **Static data for batches**: Consignment batches are stored in n8n's `staticData` (in-memory). If n8n restarts, active batches are lost. Should migrate to Google Sheets or a database.
3. **No authentication/authorization**: Any Telegram user can send commands. Need to add user verification (check Telegram user ID against allowed list).
4. **Category buttons missing**: The "Ask Category" node sends text asking for category but doesn't actually include inline keyboard buttons. Need to add `reply_markup` with inline keyboard.
5. **No error handling**: Most workflows have no try/catch or error notification. Failures are silent.

### Recommended Improvements
- Add a **master router workflow** that receives all Telegram messages and dispatches to sub-workflows
- Move data from Google Sheets to a proper database (PostgreSQL) for better querying
- Add **user role checking** before executing admin commands (/ks, /bctc)
- Implement **logging** to a separate sheet or database for audit trail
- Add **Vietnamese language support** for bot responses (currently English only)

---

## License

Private — Viet Jewelers / Nerd Society internal project.
