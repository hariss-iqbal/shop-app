# SmartCell Mobile — DESIGN.md

Scope: the Expo/React Native app in `mobile/` (login, Variants admin, Outs/transfer screens,
Partners). Tokens live in `mobile/src/theme.ts` and are the single source of truth — screens
must not hard-code hex values.

## Theme
Light, cool slate neutrals with a single blue accent. Restrained color strategy: accent for
primary actions and selection only; semantic tints carry state, never decoration.

## Color tokens (`colors` in theme.ts)
- `primary` #2563eb / `primaryDark` #1e40af — primary actions, selection, links.
- `bg` #f1f5f9 (screen), `card` #ffffff (surfaces), `bgSubtle` #f8fafc (inset panels),
  `border` #e2e8f0.
- `text` #0f172a, `textMuted` #64748b (labels/meta only, never body-critical numbers).
- Solid state colors: `success` #16a34a (confirm buttons), `danger` #dc2626 (destructive),
  `warning` #d97706 (reserved).
- Semantic tint triads `{bg, border, text}` — text is always the 800-level shade so 11-12px
  bold chip text stays ≥4.5:1 on its tint:
  - `amber` (active OUT/aging), `green` (sold/paid/success banners), `red` (overdue/errors),
    `blue` (claims/info locks), `orange` (recall requests), `pink` (+ `pink.solid` for the
    consignment-IN identity), `purple` (our-branch badge), `cyan` (partner badge),
    `slate` (neutral/closed states).

## Typography
System font only (SF/Roboto). Fixed scale, weight-led hierarchy:
- Screen numbers/stats 19px w800 · card titles 15-15.5px w800 · body/values 13.5px w700-800 ·
  labels/meta 12-12.5px w600-700 · badges/chips 10-11px w800 uppercase.
- Uppercase only for chips, badges, and card section titles (≤3 words).

## Components
- **Cards**: white, radius 14, 1px `border`, padding 13-15. No nested cards, no side-stripes.
- **List rows** (device_outs): title line (model, w800) + IMEI meta line + badge row +
  bordered footer row (money left, status/action right).
- **Chips/badges**: radius 6-8, tint bg + tint border + 800-level tint text, 10-11px w800.
- **Buttons**: primary = solid `primary` (or `success` for money-confirm), radius 11-12,
  15-16px w800 white; secondary = white with 1.5px tint border + tint text; tertiary =
  bare text link. One vocabulary everywhere.
- **Banners**: tint bg + border + 800 text, radius 8, 10px padding (done=green, error=red,
  lock=blue).
- **Forms**: labeled inputs (12.5px w600 label above), white input, radius 10, 16px text;
  errors surface in the top banner AND scroll into view.
- **FAB**: bottom-center pill, `primary` (pink.solid on the IN side), elevation/shadow; list
  content keeps ≥170px bottom padding so the last row's actions stay tappable.

## Motion
State feedback only (spinners in buttons while busy, RefreshControl). No entrance choreography.

## Voice
Shop-speak, not accounting: "owed to us", "we owe partners", "our phones with others",
"Phone is back — return it to stock", "Claimed by {name} until {time} — after that anyone can
sell it". Buttons are verb + object.
