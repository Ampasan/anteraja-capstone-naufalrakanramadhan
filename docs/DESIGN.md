---
name: Hub Dwell Precision
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#5a3f49'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#8d6f79'
  outline-variant: '#e1bdc9'
  surface-tint: '#b70070'
  primary: '#b6006f'
  on-primary: '#ffffff'
  primary-container: '#e3008c'
  on-primary-container: '#ffffff'
  inverse-primary: '#ffb0ce'
  secondary: '#565e74'
  on-secondary: '#ffffff'
  secondary-container: '#dae2fd'
  on-secondary-container: '#5c647a'
  tertiary: '#845300'
  on-tertiary: '#ffffff'
  tertiary-container: '#a66900'
  on-tertiary-container: '#ffffff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffd9e5'
  primary-fixed-dim: '#ffb0ce'
  on-primary-fixed: '#3e0022'
  on-primary-fixed-variant: '#8c0054'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
    letterSpacing: 0em
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.03em
  stat-display:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '800'
    lineHeight: 38px
    letterSpacing: -0.03em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-desktop: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
---

## Brand & Style

This design system is engineered for industrial throughput environments, logistics supervisors, and hub floor dispatchers who monitor package dwell times, dispatch backlogs, and sorting SLA thresholds in real time.

The visual style blends **Utilitarian Modern** clarity with **High-Focus Minimalism**. Operational tools require rapid scanability under active warehouse floor lighting: visual noise, decorative graphs, and non-essential sidebars are eliminated in favor of full-width, clean operational surfaces. 

Key attributes:
- **Operational Clarity:** High contrast between package dwell stages (Normal, In-Risk, Breached) with zero extraneous chrome.
- **Intentional Pop:** Anteraja Magenta anchors critical focus states, urgent actions, and breached SLAs without visually fatiguing the operator.
- **Surface Serenity:** High-legibility light backgrounds provide a stark, glare-free working canvas for shift workers interacting on rugged tablets, desktop command monitors, and dispatch wallboards.

## Colors

The palette delivers strict visual priority to operational anomalies and dwell-time states.

- **Primary (`#E3008C`):** Anteraja Signature Magenta. Reserved for primary operational actions, active tabs, overdue package counts, SLA breach badges, and live filter highlights.
- **Secondary (`#0F172A`):** Deep Slate. Powers dense primary operational data, tracking numbers, stage timers, and high-emphasis labels.
- **Tertiary (`#F59E0B`):** Warning Amber. Flags approaching dwell thresholds (within 15–30 minutes of SLA failure) before critical escalation.
- **Neutral (`#64748B`):** Muted Slate. Used for secondary metadata (timestamps, container IDs, runner tags, and inactive states).

### Functional Surfaces & Tokens
- **Application Canvas:** `#F8F9FA` creates structural separation behind data surfaces without eye strain.
- **Card & Component Canvas:** `#FFFFFF` provides clean separation for container cards, table rows, and popovers.
- **Subtle Stroke:** `#E2E8F0` defines cards and inputs; `#F1F5F9` serves as inner division lines.
- **Semantic Success:** `#10B981` indicates sorted/dispatched packages within safe limits.

## Typography

**Plus Jakarta Sans** provides rounded geometry and open counters that remain sharp across high-density logistics tables and wallboard monitors.

- **Numerics & Wayfinding:** Dwell times (e.g., `01:42:10`) and AWB tracking sequences use tabular numeral alignments (`tnum`) to eliminate layout jitter during live telemetry updates.
- **Hierarchy:** `stat-display` delivers rapid at-a-glance throughput counters for hub managers. Section headers use semi-bold and bold weights to delineate monitoring groups without relying on heavy graphical dividers.
- **Labels:** `label-sm` and `label-md` feature uppercase tracking for status pills (`BREACHED`, `STAGED`, `DISPATCHED`).

## Layout & Spacing

This design system uses a **fluid utility grid** optimized for full-width horizontal scan efficiency. Vertical sidebars are excluded to maximize real estate for multi-column manifest grids, staging queues, and dwell distribution swimlanes.

- **Canvas Layout:** Top-anchored global monitoring bar containing hub location switchers, live sync pulse, global search, and shift filters. Below is a full-width continuous layout with responsive padding (`margin: 1rem` on mobile, scaling to `2rem` on wide hub displays).
- **Desktop Grid:** 12-column grid with `1.5rem` gutters. Top KPI blocks span 3 columns each (4 cards across). Data tables and staging queues run across 12 full columns.
- **Breakpoints:**
  - `Mobile (< 768px):` 4-column stack. Dwell tables switch to stacked parcel cards.
  - `Tablet (768px – 1024px):` 8-column layout. Split metric views.
  - `Desktop (> 1024px):` 12-column fluid canvas with maximum screen efficiency.

## Elevation & Depth

Visual depth is achieved through **low-contrast outlines combined with micro ambient shadows**, avoiding heavy drops or dark directional lighting.

- **Flat Substrate (`Level 0`):** `#F8F9FA` hub backdrop. No elevation.
- **Base Cards & Staging Panels (`Level 1`):** Pure white `#FFFFFF` surface enclosed by a hairline border (`1px solid #E2E8F0`) and an ambient shadow: `box-shadow: 0 1px 2px 0 rgba(15, 23, 42, 0.04)`.
- **Hover & Focused Elements (`Level 2`):** Cards or active queue rows elevate on focus/hover with `box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.06), 0 2px 4px -2px rgba(15, 23, 42, 0.04)` and border transition to `#CBD5E1`.
- **Alert & Priority Overlays (`Level 3`):** Critical modal dialogs, barcode scanner overlays, and batch reassignment sheets utilize `box-shadow: 0 10px 15px -3px rgba(15, 23, 42, 0.08)` anchored over a 40% opacity slate scrim (`rgba(15, 23, 42, 0.4)`).
- **Breached Dwell Warning:** SLA-breached rows or cards replace neutral borders with a focused accent border: `1px solid rgba(227, 0, 140, 0.4)` accompanied by a gentle magenta glow `0 0 0 1px rgba(227, 0, 140, 0.2)`.

## Shapes

The geometric signature is strictly structured around a modern 12px standard (`rounded-xl` / radius token: `0.75rem` / `12px`), giving industrial interfaces an approachable, ergonomic feel.

- **Cards & Data Containers:** Uniform `12px` border radius across all outer corners.
- **Input Fields & Filter Selectors:** `12px` border radius ensures seamless horizontal alignment when placed side by side with buttons.
- **Action Buttons:** `12px` border radius for primary and secondary triggers.
- **Badges & Status Chips:** `9999px` (Pill shape) to contrast against card geometry and indicate interactive or semantic status immediately.
- **Table Corner Continuity:** Outer bounds of dwell manifests clip to `12px`, with inner rows remaining sharp to optimize data density.

## Components

### Buttons
- **Primary:** Background `#E3008C`, text `#FFFFFF`, border `none`, radius `12px`, padding `0.625rem 1.25rem`. Hover state: `#C7007A`. Active state: `#A60066`.
- **Secondary / Action Outline:** Background `#FFFFFF`, text `#1E293B`, border `1px solid #E2E8F0`, radius `12px`. Hover state: `#F8F9FA` with border color `#CBD5E1`.
- **Destructive / SLA Override:** Background `#FEE2E2`, text `#DC2626`, border `1px solid #FCA5A5`, radius `12px`.

### Badges & Status Chips
- **SLA Breached:** Background `#FDF2F8`, text `#E3008C`, border `1px solid #FCE7F3`, radius `9999px`, font `label-sm`.
- **Approaching Threshold:** Background `#FEF3C7`, text `#D97706`, border `1px solid #FDE68A`, radius `9999px`.
- **On Schedule:** Background `#ECFDF5`, text `#059669`, border `1px solid #D1FAE5`, radius `9999px`.
- **Filter Chip (Interactive):** Background `#FFFFFF`, text `#64748B`, border `1px solid #E2E8F0`. Selected state: `#E3008C` background with `#FFFFFF` text.

### Form Inputs & Search Fields
- Single-line search and filter inputs feature a `#FFFFFF` fill, `1px solid #E2E8F0` border, `12px` corner radius, and `0.625rem 1rem` padding.
- Leading search icon tinted `#94A3B8`.
- Focus state: `border-color: #E3008C` with an outline ring `0 0 0 3px rgba(227, 0, 140, 0.15)`.

### Checkboxes & Bulk Selection
- Dimensions: `18px x 18px` with a `4px` rounded radius.
- Inactive state: Border `1.5px solid #CBD5E1`, background `#FFFFFF`.
- Checked state: Background `#E3008C`, border `#E3008C`, white checkmark glyph.

### Cards & Metrics Tiles
- Metric tiles feature a pure `#FFFFFF` background, `1px solid #E2E8F0` stroke, `12px` border radius, and `1.25rem` internal padding.
- Tile layout: Secondary neutral uppercase label at top, bold `stat-display` numerical metric in secondary slate, with a right-aligned delta pill or magenta warning indicator.

### Dwell Monitoring Table
- Striped or bordered rows on `#FFFFFF` table container.
- Row height: `48px` default, `40px` compact density.
- Dividers: `1px solid #F1F5F9`.
- Breached Rows: Highlighted with an ultra-light tint (`rgba(227, 0, 140, 0.03)`) and an active `#E3008C` indicator bar (3px width) pinned to the left edge.