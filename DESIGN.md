# Design Brief — Mi Dinero Finance Dashboard

## Aesthetic & Tone
Premium personal finance dashboard. Modern, trustworthy, clear. Cool-toned neutrals with strategic accent colors (teal/emerald/amber). Professional fintech, not generic corporate.

## Palette (OKLCH)
| Token | Light | Dark | Purpose |
|-------|-------|------|----------|
| primary | 0.5 0.08 262 | 0.65 0.12 262 | Teal authority, trust |
| accent | 0.68 0.15 136 | 0.72 0.18 136 | Emerald success, positive cash |
| warning | 0.85 0.12 96 | 0.75 0.14 96 | Amber alerts, pending |
| destructive | 0.6 0.18 25 | 0.65 0.16 25 | Coral red overspending |
| background | 0.98 0.01 0 | 0.13 0.01 0 | Light/dark surfaces |
| foreground | 0.12 0.01 0 | 0.95 0.01 0 | Text contrast |

## Typography
- **Display:** GeneralSans (geometric, confident headers & KPI cards)
- **Body:** DMSans (efficient, numbers-friendly for data tables)
- **Mono:** GeistMono (currency, transaction details)

## Elevation & Depth
Card shadows: subtle (2px lift) → elevated (8px lift) → prominent (12px lift). Cards rest on light card background with border-subtle. Header/footer use border-top/bottom instead of shadows.

## Structural Zones
| Zone | Surface | Treatment | Purpose |
|------|---------|-----------|----------|
| Header | card | border-b, shadow-subtle | Month nav, date display |
| KPI Cards | card | shadow-elevated, 12px radius | Income/expense/savings/balance |
| Tables | card | alternating bg-muted/10 rows | Transactions, categories |
| Navigation | muted/30 | border-t | Bottom nav |

## Motion
Transition-smooth (0.3s ease) for interactive elements. No bounce. Subtle fade for modal/popover entrance.

## Signature Detail
Large, high-contrast KPI numbers with right-aligned percentages. Color-coded status (green +, amber pending, red −). Chart colors match category palette. Currency always in MX$ format with thousands separators.

## Constraints
Mobile-first responsive design. Spanish-language all UI text. Dates in dd/mm/aaaa. Percentages: 1 decimal. Dark mode full support.
