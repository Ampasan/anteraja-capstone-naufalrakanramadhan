---
name: Courier Ops Pulse
colors:
  surface: '#fff8f8'
  surface-dim: '#eed3da'
  surface-bright: '#fff8f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fff0f3'
  surface-container: '#ffe8ee'
  surface-container-high: '#fce1e8'
  surface-container-highest: '#f6dce3'
  on-surface: '#26171c'
  on-surface-variant: '#594048'
  inverse-surface: '#3c2c31'
  inverse-on-surface: '#ffecf0'
  outline: '#8c6f78'
  outline-variant: '#e0bec8'
  surface-tint: '#b8006b'
  primary: '#9f005c'
  on-primary: '#ffffff'
  primary-container: '#c91076'
  on-primary-container: '#ffe2ea'
  inverse-primary: '#ffb0cc'
  secondary: '#565e74'
  on-secondary: '#ffffff'
  secondary-container: '#dae2fd'
  on-secondary-container: '#5c647a'
  tertiary: '#9f005d'
  on-tertiary: '#ffffff'
  tertiary-container: '#cb0078'
  on-tertiary-container: '#ffe2ea'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffd9e4'
  primary-fixed-dim: '#ffb0cc'
  on-primary-fixed: '#3e0020'
  on-primary-fixed-variant: '#8d0050'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#ffd9e4'
  tertiary-fixed-dim: '#ffb0cc'
  on-tertiary-fixed: '#3e0021'
  on-tertiary-fixed-variant: '#8d0052'
  background: '#fff8f8'
  on-background: '#26171c'
  surface-variant: '#f6dce3'
  brand-magenta-vibrant: '#ED0677'
  brand-yellow: '#FFBE00'
  slate-navy-surface: '#1E293B'
  surface-bg: '#F8FAFC'
  surface-card: '#FFFFFF'
  border-subtle: '#E2E8F0'
  border-strong: '#CBD5E1'
  status-online: '#10B981'
  status-idle: '#F59E0B'
  status-breach: '#EF4444'
  status-offline: '#64748B'
typography:
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 38px
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  title-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
  title-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  data-mono-lg:
    fontFamily: JetBrains Mono
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
  data-mono-md:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
  data-mono-sm:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
  label-caps:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-lg: 1.5rem
  margin: 1.5rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1.25rem
  space-xl: 2rem
---

## Brand & Style

This design system establishes a high-density, low-cognitive-load operational environment engineered specifically for Courier Hub Admins, Dispatchers, and Field Fleet Supervisors. The core brand presence honors the energetic, dynamic spirit of the signature magenta brand identity, anchoring it with a calm, analytical slate navy framework to keep dispatch operators focused during high-stress sortation cycles and SLA deadlines.

The aesthetic blends **Modern Ergonomic SaaS** with **Mission-Critical Telemetry**:
- **Utilitarian Clarity**: Crisp information hierarchy engineered for split-second decisions without unnecessary visual fluff or decorative gradients.
- **Micro-Information Density**: Purposeful spacing and tabular data layouts built to withstand 10+ hour shifts in dispatch hubs with reduced eye fatigue.
- **Tactile Operational Awareness**: Explicit real-time state signaling (Courier status, GPS updates, parcel scan anomalies, and SLA delivery countdowns) using unambiguous semantic feedback.
- **Physical-Digital Parity**: Visual motifs that echo logistics elements—parcels, sorting bays, route legs, and manifests—distilled into minimalist cards, clear borders, and readable data rows.

## Colors

The color architecture is built around operational utility: neutral canvases dominate the viewport, allowing high-priority operational flags and brand accents to communicate instantly.

### Palette Roles
- **Primary (`#C91076`) & Tertiary (`#E51A8A`)**: Reserved for primary calls-to-action (e.g., "Assign Courier", "Dispatch Wave"), key active tab highlights, and primary metric indicators. Never used as large background fills to avoid cognitive fatigue.
- **Secondary Slate Navy (`#0F172A`) & Slate Surface (`#1E293B`)**: Forms the structural foundation for sidebars, persistent app headers, and top-tier metrics to keep visual weight grounded.
- **Neutral Light (`#F8FAFC`, `#FFFFFF`, `#E2E8F0`)**: Crisp canvas foundations. `#F8FAFC` handles overall page backgrounds, `#FFFFFF` isolates individual modules as elevated cards, and `#E2E8F0` defines subtle containment boundaries.
- **Operational Status Palette**:
  - `status-online` (`#10B981`): Active couriers currently delivering or scanning packages.
  - `status-idle` (`#F59E0B`): Stalled telemetry, couriers parked past allowance, or pending hub drop-offs.
  - `status-breach` (`#EF4444`): Imminent or violated SLA windows, return-to-origin (RTO) alerts, or failed scan exceptions.
  - `status-offline` (`#64748B`): Off-duty riders, unassigned shifts, or unmounted telemetry devices.

## Typography

The typographic hierarchy couples the geometric legibility of **Plus Jakarta Sans** for administrative workflows with **JetBrains Mono** for logistical data points.

### Typographic Guidelines
- **Tabular Alignment**: All tracking codes (Waybills / Resi / AWB), Order IDs, timestamps, parcel weights, and telemetry coordinates (lat/long) strictly render in `JetBrains Mono` with tabular numerals (`tnum`) enabled to ensure vertical alignment across data grids and manifests.
- **Scan-Readability**: Data labels use uppercase styling with 0.05em tracking (`label-caps`) in muted slate tones (`#64748B`) to keep headers secondary to the dynamic field values.
- **Status Badges**: Text inside status pills never exceeds 12px and maintains medium-to-bold weights to guarantee instant comprehension from typical arm-length monitor viewing distances.

## Layout & Spacing

The layout model optimizes screen real estate for multi-panel operational views such as live courier route maps, inbound/outbound staging lists, and SLA exception tables.

### Layout Model
- **Grid Structure**: 12-column adaptive layout built on an 8pt base grid with a 4pt sub-grid for dense operational tables and filter bars.
- **Fixed Sidebar + Adaptive Workspace**: A persistent 260px navigation pane (collapsible to 72px icon rail) sits alongside a fluid dashboard canvas.
- **Multi-Pane Distribution**:
  - Split-screen telemetry: 40% dispatch manifest list / 60% interactive hub-route map.
  - Monitor walls & Hub dashboards: 4-column balanced KPI metric stacks atop full-width filterable data tables.
- **Breakpoints**:
  - `Desktop Wide` (>= 1440px): 1.5rem outer canvas margin, 1.5rem gutters, persistent telemetry trays.
  - `Desktop Standard` (1024px - 1439px): 1.25rem canvas margin, 1rem gutters, collapsible side panels.
  - `Tablet / Hub Mobile Rugged Terminals` (< 1024px): 1rem canvas margin, single column stacked cards, sticky quick-filter tabs.

## Elevation & Depth

This design system avoids heavy shadows, saturated glows, and blurry multi-layered glass effects that degrade readability on commercial dispatch monitors under warehouse fluorescent lighting.

### Elevation Levels
- **Level 0 (Canvas Base - `#F8FAFC`)**: Structural workspace layer for the overall dashboard frame.
- **Level 1 (Card & Module Layer - `#FFFFFF`)**: Standard surface for operational data cards, parcel manifests, and map toolbars. Bounded by a crisp, 1px border (`#E2E8F0`) paired with an ultra-subtle ambient shadow: `0 1px 3px 0 rgba(15, 23, 42, 0.04), 0 1px 2px -1px rgba(15, 23, 42, 0.02)`.
- **Level 2 (Interactive Flyouts & Filter Dropdowns)**: Active popovers, time-range selectors, and courier quick-inspect panels. Uses a directional shadow: `0 4px 6px -1px rgba(15, 23, 42, 0.07), 0 2px 4px -2px rgba(15, 23, 42, 0.05)` with `#CBD5E1` border containment.
- **Level 3 (Urgent Exception Modals & SLA Alerts)**: Critical system-level prompts (e.g., manifest override, batch route cancellation). Uses `0 20px 25px -5px rgba(15, 23, 42, 0.12), 0 8px 10px -6px rgba(15, 23, 42, 0.08)` coupled with a semi-opaque `#0F172A`/60 backdrop.

## Shapes

The design system employs a refined modern curvature balance that avoids sharp industrial corners while steering clear of overly bubbly aesthetics.

### Corner Radius Tokens
- **Standard Controls & Badges (`rounded`, 0.5rem / 8px)**: Used for buttons, search fields, status indicators, and dropdown triggers.
- **Cards & Data Modules (`rounded-lg`, 1rem / 16px)**: Used for data containers, telemetry panels, and KPI summaries to maintain soft containment.
- **Map Overlays & Critical Drawers (`rounded-xl`, 1.5rem / 24px)**: Applied to high-level floating control sheets and courier profile bottom sheets.
- **Pill Elements (`rounded-full`)**: Strictly reserved for live status indicators (e.g., Courier Online) and micro-counters (e.g., active parcel badges).

## Components

### Buttons
- **Primary**: Background in Anteraja Magenta (`#C91076`), text in `#FFFFFF`, hover state transitioning to `#E51A8A`. Height: 38px for desktop standard, 44px for touch interfaces. 8px border radius.
- **Secondary / Action**: Slate Navy outline button (`#0F172A` text, 1px border `#E2E8F0`, hover background `#F8FAFC`).
- **Destructive / SLA Action**: Surface `#FEF2F2`, border `#FCA5A5`, text `#EF4444`.

### Operational Status Chips & Courier Badges
- Structured with a persistent 6px pulse-dot paired with compact uppercase text (`label-caps`).
- **Online**: Background `#ECFDF5`, border `#A7F3D0`, dot & text `#059669`.
- **Idle Alert**: Background `#FFFBEB`, border `#FDE68A`, dot & text `#D97706`.
- **SLA Breach**: Background `#FEF2F2`, border `#FECACA`, dot & text `#DC2626`.
- **Offline**: Background `#F1F5F9`, border `#CBD5E1`, dot & text `#475569`.

### Input Fields & Filter Triggers
- Height: 38px. Background: `#FFFFFF`. Border: 1px `#E2E8F0`. Focused state features an intentional 2px Anteraja Magenta focus-ring (`#C91076`) with 0px outline offset for high-contrast accessibility.
- Search inputs include leading barcode/search icons and an inline keyboard shortcut tag (`⌘K`).

### Logistics Data Cards & Tables
- **Cards**: Pure white background (`#FFFFFF`), 16px radius, subtle border (`#E2E8F0`). Cards house discrete operational functions (e.g., "Active Sortation Lane A", "Courier Capacity Gauge").
- **Tables**: Row height 44px for compact data density; zebra-striping avoided in favor of 1px border-bottom (`#F1F5F9`) and a high-contrast `#F8FAFC` hover state.
- **Waybill / Resi Cells**: Integrated one-click copy button, rendered in `data-mono-md`, with distinct visual grouping separating prefix and tracking sequence.

### Checkboxes & Radio Controls
- 16x16px boxes with 4px corner radius. Border `#CBD5E1`. Checked state fills `#C91076` with a white checkmark. Checked focus ring utilizes `#E51A8A` at 20% opacity.

### Courier Telemetry Quick-Card (Specialized Component)
- Floating card anchored over the route map or dispatch queue.
- Contains courier avatar, rider vehicle icon (motorcycle/van), real-time battery & GPS status, capacity percentage bar (e.g., 42/50 Parcels), and direct emergency ping trigger.