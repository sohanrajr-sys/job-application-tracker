# UI Redesign — Mobile-Responsive Dark Mode

**Date:** 2026-05-02  
**Status:** Approved

## Overview

Full UI overhaul of `job-tracker-web`. Goals: dark-mode-first Zinc palette, mobile-responsive layout with bottom tab navigation, subtle interactivity polish. No new features — strictly presentation.

---

## 1. Color System (Zinc Dark — always on)

Replace the current light theme with a permanent dark mode using the Zinc palette. No light/dark toggle needed — app is dark-only.

| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `#18181b` (zinc-900) | Page background |
| `--card` | `#27272a` (zinc-800) | Cards, sidebar, table rows |
| `--border` | `#3f3f46` (zinc-700) | Dividers, input borders |
| `--foreground` | `#fafafa` (zinc-50) | Primary text |
| `--muted-foreground` | `#a1a1aa` (zinc-400) | Secondary text |
| `--primary` | `#7c3aed` (violet-700) | Active nav, primary buttons |
| `--primary-light` | `#a78bfa` (violet-400) | Hover state, accents |

Override globals.css CSS vars in `:root` (remove `.dark` block — dark is the only theme).

Status badge colors (keep semantic):
- `saved` → `#3f3f46` bg / `#a1a1aa` text
- `applied` → `#4c1d95` bg / `#c4b5fd` text  
- `screening` → `#78350f` bg / `#fcd34d` text
- `interview` → `#065f46` bg / `#6ee7b7` text
- `offer` → `#14532d` bg / `#86efac` text
- `rejected` → `#7f1d1d` bg / `#fca5a5` text
- `withdrawn` → `#3f3f46` bg / `#71717a` text

---

## 2. Layout — Desktop (≥768px)

Sidebar stays. Update its styles:

- Background: `#18181b`, border-right: `#3f3f46`
- Logo area: white text on dark bg
- Nav items: inactive = `text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100`, active = `bg-violet-900/40 text-violet-400 border-r-2 border-violet-500`
- Bottom section (Get Extension, Sign out): same item styling

Main content area: `bg-[#18181b]`, `p-6` on desktop, `p-4` on mobile.

---

## 3. Layout — Mobile (<768px): Hybrid Bottom Nav

On mobile, the left sidebar is hidden. A bottom tab bar replaces it.

**Bottom tab bar** (fixed, full width, `z-50`):
- Background: `#18181b`, top border: `#3f3f46`
- 4 tabs: Home (LayoutDashboard → `/dashboard`), Apps (Briefcase → `/applications`), Bookmarks (Bookmark → `/bookmarks`), More (Menu → opens drawer)
- Active tab: icon + label in violet, inactive: zinc-400
- Height: `56px`

**"More" drawer** (slides up from bottom on tap):
- Contains: Reminders, Get Extension, Admin links (if admin), Sign Out
- Uses a sheet/drawer component (`Dialog` with bottom-anchor styling or a dedicated Drawer component)
- Backdrop darkens content behind it

**Implementation:**
- New client component: `MobileBottomNav` — renders only on `<768px` via CSS (`md:hidden`)
- Sidebar gets `hidden md:flex` to hide on mobile
- App layout wraps in `pb-14 md:pb-0` to account for the tab bar height

---

## 4. Interactions (Subtle)

All transitions: `transition-all duration-150 ease-out`.

**Hover lift on cards:**
```css
.card-hover {
  transition: box-shadow 150ms ease, transform 150ms ease;
}
.card-hover:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 20px rgba(0,0,0,0.4);
}
```

Apply to: stat cards on dashboard, application cards on mobile, bookmark cards.

**Skeleton loaders:** Use existing `<Skeleton>` component from shadcn. Dashboard page shows skeleton cards while data loads (wrap in Suspense with a skeleton fallback).

**Nav transitions:** Active state changes use `transition-colors duration-150`.

**Toast notifications:** Already using Sonner — no changes needed.

**No heavy animations:** No count-up, no staggered entry, no spring physics.

---

## 5. Mobile Table → Card List

On mobile, `ApplicationsTable` switches from the `<Table>` layout to a card list.

Each card contains:
- **Top row:** company name (bold, zinc-50) + status pill (right-aligned)
- **Middle:** job title (zinc-400)
- **Bottom row:** platform (zinc-500, small) + date (zinc-500, small) + bookmark icon + external link icon

**Implementation:**
- Inside `ApplicationsTable`, detect mobile via a `useMediaQuery('(max-width: 767px)')` hook (simple `window.matchMedia` listener, SSR-safe with `useState(false)` default)
- On mobile: render `<div className="space-y-2">` with card `<div>`s instead of `<Table>`
- On desktop: keep existing `<Table>` unchanged
- Cards get `card-hover` class for lift effect

---

## 6. Files to Change

| File | Change |
|------|--------|
| `src/app/globals.css` | Replace `:root` + `.dark` vars with Zinc dark values |
| `src/components/layout/Sidebar.tsx` | Dark styles, `hidden md:flex` |
| `src/app/(app)/layout.tsx` | Add `pb-14 md:pb-0`, render `<MobileBottomNav>` |
| `src/components/layout/MobileBottomNav.tsx` | **NEW** — bottom tab bar + More drawer |
| `src/components/applications/ApplicationsTable.tsx` | Card view on mobile, dark styles throughout |
| `src/app/(app)/dashboard/page.tsx` | Dark card styles, hover lift, Suspense skeletons |
| `src/app/(app)/applications/page.tsx` | Dark page wrapper |
| `src/app/(app)/bookmarks/page.tsx` | Dark styles, hover lift on bookmark cards |
| `src/app/(app)/reminders/page.tsx` | Dark styles |
| `src/app/setup/page.tsx` | Dark styles |
| `src/app/(auth)/login/page.tsx` | Dark auth form |
| `src/app/(auth)/signup/page.tsx` | Dark auth form |

Admin pages follow the same dark token system — no separate treatment needed since they inherit from globals.

---

## 7. Constraints

- No new npm packages. Use existing shadcn Dialog/Sheet for the More drawer.
- `tw-animate-css` already imported — can use its utility classes for the drawer slide-up if needed.
- Keep all existing functionality intact — this is styling only.
- `@base-ui/react` Select quirks remain: `onValueChange` can be null, no `asChild`.
- Mobile bottom nav is CSS-only hidden/shown — no JS breakpoint detection for the nav itself (only for the table card/row toggle).
