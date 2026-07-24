# ADMIN_UI.md

# El-bannawy Platform

## Administrator Dashboard UI

Version: 2.0.0

---

# Purpose

Defines the complete Administrator Dashboard specification.

Provides full operational visibility and platform control with consistent UI patterns for data tables, forms, modals, responsive behavior and accessibility.

---

# Layout Structure

```
+---------------------------------------------------+
|  Header (Logo, Breadcrumb, Search, Profile, Theme) |
+-------------------+-------------------------------+
|                   |                               |
|  Sidebar          |  Main Content Area            |
|  (Navigation)     |  (Active Section)             |
|                   |                               |
|                   |   +------------------------+  |
|                   |   | Stats Cards Row        |  |
|                   |   +------------------------+  |
|                   |   | Filters Bar             |  |
|                   |   +------------------------+  |
|                   |   | Data Table / Content    |  |
|                   |   | (with inline actions)   |  |
|                   |   +------------------------+  |
|                   |   | Pagination              |  |
|                   |   +------------------------+  |
|                   |                               |
+-------------------+-------------------------------+
|  Footer (Copyright, Version, Support)              |
+---------------------------------------------------+
```

## Sidebar

Collapsible sidebar with:

- Dashboard home
- Users (Students, Teachers, Secretaries, Support)
- Content (Curriculum, Units, Lessons, Vocabulary, Stories)
- Payments (Transactions, Subscriptions, Refunds)
- Reports (Analytics, Export, Custom Reports)
- Notifications (Broadcast, Templates, History)
- Audit Logs
- Monitoring (System Health, Queue, Cache)
- AI Configuration (Providers, Prompts, Usage, Costs)
- Settings (Academic Year, XP, Coins, Referral, Live Classes, Maintenance)
- Feature Flags

Each sidebar item may have a badge showing pending items (e.g., flagged reports, pending payments).

Active section is highlighted. Collapsed state shows icons only with tooltip.

---

# Home Screen (Dashboard)

## Stats Cards Row

First row: 4-6 metric cards with color-coded trends.

| Card               | Data       | Trend Indicator           | Click Action              |
| ------------------ | ---------- | ------------------------- | ------------------------- |
| Total Students     | 12,054     | +12% this month           | Navigate to Students list |
| Active Teachers    | 24         | +2 this week              | Navigate to Teachers list |
| Active Users (24h) | 3,485      | -5% vs yesterday          | Navigate to Analytics     |
| Today Revenue      | 15,600 EGP | +8% vs same day last week | Navigate to Payments      |
| AI Conversations   | 1,204      | +22% this week            | Navigate to AI Analytics  |
| Platform Health    | Healthy    | All systems operational   | Expand health details     |

Each card shows:

- Icon (left)
- Label (small text)
- Value (large bold)
- Trend arrow + percentage (with green/red coloring)
- Sparkline mini-chart (optional, for 14-day trend)

## Quick Actions Bar

Horizontal bar below stats with outlined icon buttons:

[ + Create User ] [ Manage Roles ] [ Broadcast ] [ View Reports ] [ ⚠ Maintenance Mode ] [ ⚙ System Settings ]

## Platform Charts Section

Two-column layout for medium+ screens, single column on mobile:

### Left Column

- **Revenue Chart**: Line chart, 30-day view, toggleable by month/quarter/year
- **User Growth**: Area chart showing student/teacher growth over time

### Right Column

- **AI Usage**: Stacked bar chart showing conversations by type (grammar, vocab, homework, etc.)
- **System Health Gauge**: Circular gauges for API, DB, Redis, Queue, Storage, AI Provider

## Recent Activity Feed

Scrollable list showing last 20 actions:

```
[User Icon] Ahmed Mohamed created lesson "Past Simple"  2m ago
[User Icon] System completed daily backup              5m ago
[User Icon] Sara Ali paid subscription #INV-2341       12m ago
```

Each entry has:

- User avatar (or system icon for automated actions)
- Action description
- Relative timestamp
- Click → navigates to related entity

## Alerts Section

Color-coded alert cards at bottom of home screen:

| Level            | Example                                       | Frequency    |
| ---------------- | --------------------------------------------- | ------------ |
| Critical (Red)   | AI provider down, DB connection lost          | Immediate    |
| Warning (Yellow) | High latency, storage > 80%                   | Every 15 min |
| Info (Blue)      | New teacher registered, daily backup complete | Once         |
| Success (Green)  | All systems healthy, deployment successful    | Once         |

Alerts auto-dismiss after configurable timeout. Critical alerts persist until acknowledged.

---

# Data Tables

## Structure

Every data table across the admin dashboard must follow this pattern:

```
+-------------------------------------------------------------------+
| [Title]                    [Search] [Filter] [Bulk] [Export] [+Add] |
+-------------------------------------------------------------------+
| [ ] Name    | Email      | Role   | Status | Last Active | Actions |
| [ ] Ahmed.. | a@b.com    | Admin  | Active | 2m ago      | [⋮]    |
| [ ] Sara..  | s@b.com    | Teacher| Active | 1h ago      | [⋮]    |
| [ ] Omar..  | o@b.com    | Student| Inactive| 3d ago     | [⋮]    |
+-------------------------------------------------------------------+
| Showing 1-15 of 234        [<] [1] [2] [3] ... [16] [>]           |
+-------------------------------------------------------------------+
```

## Table Features

### Sorting

- All sortable columns show a sort icon (▲/▼) on hover
- Click to toggle: asc → desc → none
- Multi-column sort: hold Shift + click secondary column
- Default sort specified per table (e.g., Users: by createdAt desc)

### Search

- Global search input (top right of table)
- Debounced (300ms) to avoid excessive requests
- Searches across name, email, ID
- Advanced search: click magnifier icon to expand filter panel

### Advanced Filters

Expandable filter panel (drawer or dropdown):

```
Filters
─────────────────────
Role: [▼] All        Status: [▼] Active
Grade: [▼] Any       Date: [DatePicker] to [DatePicker]
─────────────────────
[ Apply ] [ Clear All ]
```

Supported filter types:

- Dropdown (single/multi-select)
- Date range picker
- Text input (exact match, contains)
- Toggle switch (yes/no)
- Number range (min/max)

### Bulk Actions

Checkbox column on the left of each row.

Select-all checkbox in header (selects only current page, with option "Select all N items across all pages").

When items selected, bulk action toolbar appears:

```
[3 items selected] [✏ Edit Selected] [❌ Deactivate] [📧 Send Email] [📥 Export Selected]
```

Bulk actions are specific to each table context.

### Row Actions

Last column: "⋮" (three-dot) menu with:

- Edit (opens form modal or navigates to edit page)
- View Details (opens detail panel or navigates)
- Duplicate (pre-fills create form with this item's data)
- Deactivate / Activate (toggle status)
- Delete (soft delete with confirmation dialog)
- Additional options per entity type

### Inline Editing

For simple fields (status, role), show an inline edit icon on hover.

Click → show inline dropdown/switch without leaving the table.

Changes are auto-saved on blur with optimistic update and undo toast.

### Pagination Options

| Option        | Values                                                      |
| ------------- | ----------------------------------------------------------- |
| Page size     | 15, 30, 50, 100 (default: 15 per business rule)             |
| Navigation    | Previous, page numbers (with ellipsis for large sets), Next |
| Total count   | "Showing 1-15 of 234"                                       |
| Max page size | 100 (enforced server-side)                                  |

Cursor-based pagination may be used for very large datasets (>10K rows).

### Export

| Format | Button     | Behavior                               |
| ------ | ---------- | -------------------------------------- |
| CSV    | [📥 CSV]   | Immediate download (≤10K rows)         |
| XLSX   | [📥 Excel] | Background job (>10K rows), email link |
| PDF    | [📥 PDF]   | Background job, email link             |

Export includes all items matching current filters (not just current page).

---

# Detail Views

## Detail Panel (Drawer)

For quick view without leaving the list:

- Slides in from right side, 480px wide
- Shows full entity details in read-only mode
- Action buttons at bottom: [Edit] [Delete] [Activate/Deactivate]
- Close with: X button, Escape key, or click outside

## Detail Page (Full Screen)

For complex entities (lessons, units):

- Full-page view with sections/tabs
- Breadcrumb navigation at top
- Edit button in header switches to edit mode inline
- Save/Cancel at bottom when in edit mode

---

# Forms

## Form Standards

| Element      | Spec                                                 |
| ------------ | ---------------------------------------------------- |
| Label        | Above field, bold, with optional "required" asterisk |
| Input        | Full width, min 40px height, clear border            |
| Validation   | Inline error message below field on blur             |
| Submit       | Primary button: "Save", secondary: "Cancel"          |
| Loading      | Spinner replaces button text during submission       |
| Confirmation | "Are you sure?" dialog for destructive actions       |

## Form Types

### Create Form

Opens in a modal dialog (medium size, 640px).

- Title: "Create [Entity Type]"
- Labeled fields with validation
- Server-side validation on submit
- On success: close modal, refresh table, show success toast
- On error: show error message inline, keep form open

### Edit Form

Same pattern as create, but pre-filled with existing data.

- Title: "Edit [Entity Name]"
- Same validation rules
- Optimistic update: update table row immediately, revert on error
- Track dirty state: show "Unsaved changes" warning on close attempt

### Delete Confirmation

```
⚠ Are you sure you want to delete "{entityName}"?
This action is reversible (soft delete).
[ Cancel ] [ ✓ Confirm Delete ]
```

For permanent deletion (if enabled), require admin password confirmation.

---

# Data Visualization

## Chart Types

| Chart       | Use Case                                   | Data Points               |
| ----------- | ------------------------------------------ | ------------------------- |
| Line Chart  | Revenue, users over time                   | Up to 365 points          |
| Area Chart  | Growth, cumulative metrics                 | Up to 365 points          |
| Bar Chart   | Comparisons (by grade, by month)           | Up to 50 bars             |
| Stacked Bar | Composition (AI usage by type)             | Up to 10 segments per bar |
| Pie Chart   | Distribution (user roles, payment methods) | Up to 10 slices           |
| Gauge       | System health, storage usage               | Single percentage         |
| Heatmap     | Activity by hour/day                       | 24×7 grid                 |

## Chart Interactions

- Hover: show tooltip with exact values
- Click legend: toggle data series visibility
- Click data point: drill down to detail view
- Date range: draggable selector below chart
- Download: [png] [csv] buttons above chart

---

# Dialog & Confirmation Standards

| Type            | Visual                                    | Behavior                     |
| --------------- | ----------------------------------------- | ---------------------------- |
| Success Toast   | Green, check icon                         | Auto-dismiss after 3s        |
| Error Toast     | Red, X icon                               | Persist until dismissed      |
| Warning Dialog  | Yellow, ⚠ icon, [Cancel] [Confirm]        | Blocking, requires action    |
| Info Dialog     | Blue, ℹ icon, [Got it]                    | Non-blocking auto-dismiss    |
| Confirm Delete  | Red, 🗑 icon, type entity name to confirm | Prevents accidental deletion |
| Unsaved Changes | Yellow, blocks navigation, [Leave] [Stay] | Detects dirty forms          |

---

# Loading States

| State          | Visual                                                    |
| -------------- | --------------------------------------------------------- |
| Page Load      | Skeleton layout (matching page structure, animated pulse) |
| Table Load     | Skeleton rows (5 rows of animated gray bars)              |
| Form Submit    | Spinner on submit button, fields disabled                 |
| Async Action   | Inline spinner on the action button                       |
| Background Job | Progress bar with percentage                              |
| File Upload    | Progress bar with filename and speed                      |

---

# Empty States

| Scenario          | Visual                                                 |
| ----------------- | ------------------------------------------------------ |
| No items in list  | Illustration + "No [items] found" + [Create First] CTA |
| No search results | "No results for "{query}". Try different keywords."    |
| No data for chart | "No data available for this period."                   |
| Empty filter      | "No items match your filters. [Clear Filters]"         |

---

# Error States

| Scenario          | Visual                                                  |
| ----------------- | ------------------------------------------------------- |
| API Error         | "Something went wrong." + error detail + [Retry] button |
| Network Offline   | Banner at top: "No internet connection"                 |
| Rate Limited      | "Too many requests. Please wait N seconds."             |
| Permission Denied | "You don't have permission to perform this action."     |
| 404               | "Page not found" illustration + [Back to Dashboard]     |

---

# Responsive Behavior

| Breakpoint | Layout                                                               |
| ---------- | -------------------------------------------------------------------- |
| >1200px    | Full sidebar + 2-column charts + full table                          |
| 768-1200px | Collapsed sidebar (icons) + single-column + table with fewer columns |
| <768px     | Bottom nav bar + stacked cards + table in card view (rows as cards)  |
| <480px     | Single column, minimal data, horizontal scroll for tables            |

## Card View (Mobile Table Alternative)

On screens < 768px, data tables transform into card list:

```
+--------------------------------+
| [Avatar] Ahmed Mohamed         |
| Email: a@b.com                 |
| Role: Admin   Status: ● Active |
| Last Active: 2m ago   [⋮]     |
+--------------------------------+
+--------------------------------+
| [Avatar] Sara Ali              |
| Email: s@b.com                 |
| Role: Teacher  Status: ● Active|
| Last Active: 1h ago   [⋮]     |
+--------------------------------+
```

---

# Accessibility

| Requirement         | Implementation                                                                |
| ------------------- | ----------------------------------------------------------------------------- |
| Keyboard Navigation | All actions accessible via Tab, Enter, Escape, Arrow keys                     |
| Screen Readers      | ARIA labels on all interactive elements, role attributes on custom components |
| Focus Indicators    | Visible focus ring (2px, offset 2px) on all focusable elements                |
| Color Contrast      | WCAG AA minimum (4.5:1 for text, 3:1 for large text)                          |
| Motion Reduction    | Respect prefers-reduced-motion: disable animations                            |
| RTL Support         | Full RTL layout mirroring for Arabic interface                                |
| Skip Navigation     | "Skip to main content" link at top of page                                    |

---

# Performance Targets

| Action                 | Target                         |
| ---------------------- | ------------------------------ |
| Dashboard Initial Load | <500ms                         |
| Table Page Load        | <500ms (first page)            |
| Search Response        | <300ms (after debounce)        |
| Filter Apply           | <500ms                         |
| Form Submit            | <800ms                         |
| Bulk Action            | <2s                            |
| Export (≤10K rows)     | <5s                            |
| Export (>10K rows)     | Background, email within 5 min |
| Chart Render           | <500ms                         |
| Page Navigation        | Instant (client-side routing)  |

---

# Acceptance Criteria

✓ Dashboard home shows real-time stats with trend indicators

✓ Data tables support sort, search, advanced filters, pagination

✓ Bulk actions work for select-all across pages

✓ Row actions menu works for all entity types

✓ Detail panel (drawer) loads in <500ms

✓ Create/Edit forms validate, submit, and refresh table

✓ Delete requires confirmation, supports soft delete

✓ Charts render correctly, support hover tooltip and drill-down

✓ Loading skeletons appear on every page load

✓ Empty states display for zero-data scenarios

✓ Error states show retry buttons

✓ Responsive: desktop full, tablet collapsed sidebar, mobile card view

✓ Accessibility: keyboard nav, screen reader, focus indicators, RTL

✓ All text is localized (Arabic/English)

✓ Export works in CSV, XLSX, PDF

---

# Final Rule

The Administrator Dashboard must provide complete platform control while minimizing cognitive load.

Every admin action must be intentional, reversible where possible, and clearly communicated.

End of Document.
