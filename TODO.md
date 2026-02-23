# Development TODO — Hot Choco

## 🔴 Priority 1 — Fix Critical Issues

- [ ] **Merge dual Telegram triggers** into a single master workflow with router
  - Both `Sales & Commands` and `Consignment Receive` fight over the same webhook
  - Create one trigger → master router → Execute Workflow nodes for each module
- [ ] **Move batch storage to Google Sheets** (currently in volatile `staticData`)
  - Create a `Batches` tab in the master spreadsheet
  - Fields: batch_id, brand, count, photos_received, status, created_at, chat_id
- [ ] **Add inline keyboard buttons** to Ask Category in consignment flow
  - Currently sends text only — user can't tap category buttons
  - Need `reply_markup` with `inline_keyboard` in the Telegram node
- [ ] **Add user authorization** — check Telegram user ID against allowed list
  - Block unauthorized users from all commands
  - Restrict `/ks`, `/bctc`, `/settle` to Mai only (ID: `8449351519`)

## 🟡 Priority 2 — Build Core Features

- [ ] **`/bctc` Financial Report**
  - Daily P&L: revenue - COGS = gross profit
  - Breakdown by brand, payment method, staff
  - Monthly rollup option: `/bctc month`
- [ ] **Payroll Calculator** (`/payroll`)
  - Read staff base salary from new `Staff` sheet
  - Sum late penalties for the month
  - Calculate commission (TBD — confirm structure with Mai)
  - Output: per-staff payroll summary
- [ ] **Consignment Settlement** (`/settle BRAND`)
  - Find all SOLD items for a brand that haven't been settled
  - Calculate: total cost_price to pay artist, total commission VJ keeps
  - Generate settlement summary
  - Mark items as `SETTLED` in sheet after Mai approves
- [ ] **Stock Import Processing** (`/import`)
  - Handle Thai Factory invoice photos
  - Parse: item descriptions, weights, stone details
  - Apply pricing formula: gold_weight × market_rate + stone + labor
  - Write to product catalog

## 🟢 Priority 3 — Operations Improvements

- [ ] **Check-out system** — second selfie or `/checkout` command
  - Track work hours (check-in to check-out)
  - Create `Attendance` sheet: date, staff_id, check_in_time, check_out_time, hours, penalty
  - Monthly attendance report
- [ ] **Cash reconciliation** (`/cash AMOUNT`)
  - Staff reports end-of-day cash amount
  - Compare against POS cash sales total
  - Flag discrepancies
- [ ] **Inventory alerts**
  - Check consignment items with no sales after 30/60/90 days
  - Alert Mai about items approaching settlement deadlines

## 🔵 Priority 4 — AI Features (Future)

- [ ] **Receipt parsing** — photo of receipt → auto-create order
  - Use Claude API to extract line items from receipt image
  - Create order + order_items in Sheets
- [ ] **Natural language queries**
  - "How much did we sell last week?" → query Sheets → respond
  - Use Claude for intent parsing
- [ ] **Smart EOD report**
  - Compare today vs last week/month
  - Highlight anomalies and trends

## 📋 New Google Sheets Tabs Needed

- [ ] `Staff` — staff_id, name, telegram_id, base_salary, bank_details, role
- [ ] `Attendance` — date, staff_id, check_in, check_out, hours_worked, late_penalty
- [ ] `Batches` — batch_id, brand, count, photos_received, status, started_by, chat_id, created_at
- [ ] `Settlements` — settlement_id, brand, date, items_count, total_cost, total_commission, status
- [ ] `Expenses` — date, category, amount, description, receipt_url
- [ ] `Inventory` — product_code, brand, category, status, days_in_stock, location

## 🔧 Technical Debt

- [ ] Add error handling (try/catch) to all Code nodes
- [ ] Add error notification workflow — send to Mai on any workflow failure
- [ ] Add logging to a `Logs` sheet for audit trail
- [ ] Consider Vietnamese language for bot responses
- [ ] Implement proper date handling (VN timezone consistently)
- [ ] Add unit tests for calculation logic
