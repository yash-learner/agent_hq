# Review: Add expiry date to purchase delivery table

## Round 1

Clean — no findings.

**Verification notes:**
- AC1-3 satisfied by `SupplyDeliveryTable.tsx` changes: column added after "Batch", dd/MM/yyyy format via `formatDate()`, "-" for missing values
- AC4 (print view) already satisfied: `PrintDeliveryOrder.tsx` lines 80-105 include expiry_date column with correct formatting (verified no changes needed)
- i18n key "expiry_date" exists in `public/locale/en.json` line 2515
- Date handling is safe (standard Date constructor + formatDate utility)
- No security or over-engineering concerns
