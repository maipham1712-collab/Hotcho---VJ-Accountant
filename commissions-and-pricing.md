# Business Rules — Commissions & Pricing

## Consignment Model

Viet Jewelers operates primarily on a **consignment model** for jewelry from partner brands/artists. The store displays and sells items on behalf of artists, keeping a commission on each sale.

### How Consignment Works

1. **Artist delivers items** → Staff uses `/receive BRAND COUNT` to start batch
2. **Photos taken** → Each item photographed and categorized
3. **Artist sets cost price** → The amount they want to receive per item
4. **Mai sets retail price** → Cost + VJ margin
5. **Item goes on display** → Listed in POS
6. **When sold** → VJ pays artist the cost price, keeps the difference
7. **Settlement** → Periodic payout to artists for sold items

### Commission Structure

> ⚠️ **ACTION NEEDED**: Confirm exact commission rates with Mai for each brand.

#### Known Structures:
- **KS (Kensho)**: VJ keeps markup above artist's cost price. Commission = `retail_price - cost_price`
- **TF (Thai Factory)**: **Not consignment** — VJ buys outright. Pricing uses gold weight formula.

#### Thai Factory (TF) Pricing Formula:
```
item_price = (gold_weight_grams × gold_market_rate_per_gram) + stone_cost + labor_cost
```

### Staff Sales Commission

> ⚠️ **ACTION NEEDED**: Confirm staff commission structure with Mai.

Likely structure (to be confirmed):
- Base salary per month
- Bonus based on sales targets
- Deductions: late penalties, damages

---

## Check-in / Attendance Rules

### Work Hours
- **Shift start**: 9:00 AM (VN time, GMT+7)
- **Grace period**: 5 minutes (until 9:05 AM)

### Late Penalties
| Arrival Time | Penalty |
|-------------|---------|
| Before 9:05 AM | None (on time) |
| 9:05 AM – 9:30 AM | 30,000 VND |
| After 9:30 AM | 100,000 VND |

### Current Limitation
- Only **check-in** is tracked (via selfie photo)
- **Check-out** is NOT tracked yet
- No overtime calculation
- No leave/absence tracking

---

## Order Statuses

| Status | Meaning |
|--------|---------|
| `ACTIVE` | Completed sale |
| `VOID` | Cancelled before completion |
| `RETURN` | Item returned after sale |

## Consignment Item Statuses

| Status | Meaning |
|--------|---------|
| `AWAITING_ARTIST` | Photos uploaded, waiting for artist to fill cost + description |
| `PRICED` | Artist has set cost price |
| `APPROVED` | Mai has approved pricing |
| `LISTED` | Item is live on POS display |
| `SOLD` | Item has been sold |
| `SETTLED` | Artist has been paid |

---

## Payment Methods

| Code | Method |
|------|--------|
| `CASH` | Cash payment |
| `TRANSFER` | Bank transfer |
| `CARD` | Credit/debit card |

## Currency

All amounts are in **Vietnamese Dong (VND)**. No decimal places needed (smallest denomination is 1,000 VND in practice).

Formatting: Use `vi-VN` locale for number formatting (e.g., `1.500.000` for 1.5 million VND).
