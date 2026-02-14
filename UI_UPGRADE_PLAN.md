# UI Upgrade Plan — Feature Flag Service Dashboard

> Goal: Make the dashboard look and feel as professional as LaunchDarkly.
> Organized into 5 agent assignments. 200+ specific TODOs.

---

## Current State Summary

**Pages**: Login, Register, FlagList, FlagDetail, Segments, SegmentDetail, Analytics, AuditLog, Settings, Playground, Learn
**Components**: Layout, Badge, Toggle, Spinner, EmptyState, ConfirmDialog, CreateFlagModal, Toast, AuditDiff, EnvironmentBadge, Tooltip
**Targeting**: TargetingEditor, RuleBuilder, ClauseEditor, ChipInput, IndividualTargets, PrerequisiteSelector, RolloutSlider, VariationPicker, SegmentPicker
**Styling**: Tailwind CSS with dark theme (slate-900 bg), Inter font, custom component classes (btn-primary, input-field, card)
**Current Issues**: No skeleton loading, no animations/transitions, no keyboard shortcuts, basic mobile support, no breadcrumbs, no diff-based save, inconsistent spacing, no empty state illustrations, basic error handling

---

## Agent 1: Layout & Navigation

### Sidebar (`Layout.tsx`)
- [ ] Add collapsible sidebar: clicking a collapse button should shrink sidebar to icon-only mode (64px wide), store preference in localStorage
- [ ] Add collapse toggle button (chevron icon) at bottom of sidebar
- [ ] Add subtle hover tooltip showing label when sidebar is collapsed
- [ ] Add nav item grouping: group "Flags", "Segments" under "Feature Management" header; "Analytics", "Audit Log" under "Insights"; "Settings", "Learn" under "Configuration"
- [ ] Add section dividers between nav groups (thin slate-800 line with 8px vertical margin)
- [ ] Add active indicator: 3px indigo-500 left border on active nav item (replace current bg highlight)
- [ ] Add hover animation: `transition-all duration-150` on nav items, scale up icon slightly on hover
- [ ] Add badge counts on nav items: show count of active flags next to "Flags", count of pending changes next to "Audit Log"
- [ ] Change sidebar background from `bg-slate-950` to a gradient: `bg-gradient-to-b from-slate-950 to-slate-900`
- [ ] Add FlagService logo as SVG instead of emoji 🚩 — create a proper logo component with flag icon
- [ ] Add version number display at bottom of sidebar (text-[10px] text-slate-600)
- [ ] Add keyboard shortcut hints next to nav items (e.g., "⌘1" next to Flags) in text-[10px] text-slate-600

### Top Header (`Layout.tsx`)
- [ ] Add breadcrumb navigation: show current path (e.g., "Flags > dark-mode > Targeting") with clickable segments
- [ ] Create `Breadcrumb.tsx` component: accepts array of `{label, href}`, renders with `/` separators, last item non-clickable
- [ ] Add global search (Cmd+K): create `CommandPalette.tsx` overlay component
  - [ ] Full-screen overlay with backdrop blur (`backdrop-blur-sm bg-black/50`)
  - [ ] Search input with autofocus, large text (text-lg)
  - [ ] Results grouped by type (Flags, Segments, Pages) with icons
  - [ ] Keyboard navigation (arrow keys, Enter to select, Esc to close)
  - [ ] Register `useEffect` with `keydown` listener for Cmd+K / Ctrl+K
  - [ ] Fuzzy search across flag names, keys, segment names
- [ ] Move environment selector from badges to a proper dropdown menu with color dots and environment descriptions
- [ ] Add notification bell icon in header (placeholder for future notifications)
- [ ] Add user avatar/initials circle (32px, bg-indigo-600, white text) next to username
- [ ] Create `UserMenu.tsx` dropdown: avatar click opens menu with Profile, Preferences, Logout items
- [ ] Add subtle bottom shadow on header: `shadow-[0_1px_3px_rgba(0,0,0,0.3)]`

### Page Shell
- [ ] Create `PageHeader.tsx` component: standardize all page headers with title, description, and action buttons slot
  - Props: `title: string`, `description?: string`, `actions?: ReactNode`, `breadcrumbs?: {label,href}[]`
  - Consistent spacing: `mb-8` below header
- [ ] Create `PageContainer.tsx` wrapper: max-width container with consistent padding (`px-6 lg:px-8 py-6`)
- [ ] Add page transition animation: wrap `<Outlet>` in framer-motion `AnimatePresence` with fade+slide
  - Install `framer-motion`
  - `initial={{ opacity: 0, y: 8 }}`, `animate={{ opacity: 1, y: 0 }}`, `exit={{ opacity: 0 }}`
  - Duration: 200ms

### Login & Register Pages
- [ ] Add background pattern/gradient to login page: subtle dot grid or gradient mesh behind the card
- [ ] Add glassmorphism effect to login card: `backdrop-blur-xl bg-slate-800/80 border border-slate-700/50`
- [ ] Add fade-in animation on mount for the login card
- [ ] Add "Show password" toggle (eye icon) on password fields
- [ ] Add loading shimmer on submit button while loading (gradient animation)
- [ ] Add OAuth/SSO buttons placeholder (Google, GitHub icons with "Coming Soon" tooltip)
- [ ] Add subtle float animation on the 🚩 emoji (or replace with animated SVG logo)
- [ ] Match login/register layouts exactly (both use same card width, spacing, font sizes)
- [ ] Add "Forgot password?" link on login page (even if placeholder)
- [ ] Add input focus ring animation: expand ring from center outward

---

## Agent 2: Core Components

### Design Tokens (`tailwind.config.js` + `index.css`)
- [ ] Extend Tailwind theme with custom colors: `brand: { 50-950 }` based on indigo but customized
- [ ] Add `slate-750` shade: `#293548` (currently referenced but doesn't exist)
- [ ] Add `slate-850` shade: `#172033`
- [ ] Add custom shadows: `shadow-card`, `shadow-modal`, `shadow-dropdown`
  - `shadow-card: '0 1px 3px rgba(0,0,0,0.2), 0 1px 2px rgba(0,0,0,0.1)'`
  - `shadow-modal: '0 25px 50px rgba(0,0,0,0.5)'`
- [ ] Add custom border radius tokens: `rounded-card: 12px`, `rounded-button: 8px`
- [ ] Add transition presets: `transition-fast: 'all 150ms ease'`, `transition-normal: 'all 200ms ease'`
- [ ] Add `@font-face` for Inter with variable weight (if not already)
- [ ] Add focus-visible styles globally: `:focus-visible { outline: 2px solid theme('colors.indigo.500'); outline-offset: 2px }`
- [ ] Add selection color: `::selection { @apply bg-indigo-500/30 }`
- [ ] Remove custom scrollbar styles and replace with modern `scrollbar-thin scrollbar-thumb-slate-700` (tailwind-scrollbar plugin)

### Button Component
- [ ] Create `Button.tsx` component to replace raw `btn-*` classes
  - Props: `variant: 'primary' | 'secondary' | 'danger' | 'ghost'`, `size: 'sm' | 'md' | 'lg'`, `loading: boolean`, `icon?: ReactNode`, `iconPosition: 'left' | 'right'`
  - Include built-in loading spinner
  - Add `active:scale-[0.98]` press effect
  - Add disabled styles: `opacity-50 cursor-not-allowed pointer-events-none`
  - Ghost variant: transparent bg, text-slate-400, hover:bg-slate-800
- [ ] Add button group component: `ButtonGroup.tsx` for segmented/attached buttons
- [ ] Add icon-only button variant with proper sizing (square, centered icon)

### Input & Form Components
- [ ] Create `Input.tsx` component: wraps input with label, error message, helper text, icon slots
  - Props: `label`, `error`, `helperText`, `leftIcon`, `rightIcon`, `size: 'sm' | 'md'`
  - Error state: red border, red error text below
  - Animated label that floats up on focus (optional prop)
- [ ] Create `Select.tsx` component with custom dropdown styling (replace native selects)
  - Custom dropdown with search for long lists
  - Support for option groups
  - Support for option icons/badges
- [ ] Create `Textarea.tsx` with auto-resize capability
- [ ] Create `FormField.tsx` wrapper: label + input + error + helper in consistent layout
- [ ] Create `SearchInput.tsx`: input with search icon, clear button (X), debounced onChange
  - 300ms debounce
  - Clear button appears when value is non-empty
  - Subtle focus expansion animation (grow wider on focus)
- [ ] Create `DatePicker.tsx` component (or integrate a headless one like react-day-picker)
- [ ] Create `Switch.tsx` to replace raw toggle markup — add label prop, description prop, size variants

### Table Component
- [ ] Create `DataTable.tsx` component for consistent table rendering
  - Props: `columns: Column[]`, `data: T[]`, `loading`, `emptyState`, `onRowClick`, `sortable`, `selectable`
  - Sortable columns: click header to sort, show sort direction arrow
  - Row hover: `hover:bg-slate-800/50` with smooth transition
  - Sticky header on scroll
  - Column resizing (optional, stretch goal)
- [ ] Add row selection with checkboxes for bulk actions
- [ ] Add bulk action bar: slides down from top when rows selected, shows count + action buttons
- [ ] Add column visibility toggle dropdown
- [ ] Add table loading state: skeleton rows (6 rows of pulsing bars matching column widths)
- [ ] Add table pagination component: page numbers, prev/next, items per page selector

### Modal Component
- [ ] Create `Modal.tsx` component to replace raw fixed-inset divs
  - Props: `open`, `onClose`, `title`, `description`, `size: 'sm' | 'md' | 'lg' | 'xl'`, `footer`
  - Backdrop: `bg-black/60 backdrop-blur-sm`
  - Enter animation: `opacity-0 scale-95` → `opacity-1 scale-100` (200ms ease-out)
  - Exit animation: `opacity-1 scale-100` → `opacity-0 scale-95` (150ms ease-in)
  - Close on Escape key
  - Close on backdrop click
  - Focus trap inside modal
  - Scrollable body with fixed header/footer
- [ ] Refactor `ConfirmDialog.tsx` to use new `Modal.tsx`
- [ ] Refactor `CreateFlagModal.tsx` to use new `Modal.tsx`

### Badge Component (`Badge.tsx`)
- [ ] Add `size` prop: `sm` (current) and `xs` (smaller, for inline use)
- [ ] Add `dot` prop: show a colored dot before the text (like environment status)
- [ ] Add `removable` prop: show X button to remove (for filter chips)
- [ ] Add `icon` prop: render icon before text
- [ ] Add `pulse` animation variant for "live" badges
- [ ] Add more variants: `purple`, `cyan`, `pink`, `gray`

### Toast Component (`Toast.tsx`)
- [ ] Add `info` and `warning` toast types (blue and amber)
- [ ] Add progress bar at bottom of toast showing auto-dismiss countdown
- [ ] Add slide-in animation from right: `translateX(100%)` → `translateX(0)` (300ms spring)
- [ ] Add slide-out animation on dismiss
- [ ] Add action button support: toast with "Undo" button
- [ ] Stack multiple toasts with stagger offset
- [ ] Add max toast limit (3 visible at once, queue the rest)

### Spinner & Loading (`Spinner.tsx`)
- [ ] Create `Skeleton.tsx` component for skeleton loading screens
  - Variants: `text` (single line), `title` (wider, taller), `avatar` (circle), `card` (rounded rect), `table-row`
  - Animated gradient shimmer: `animate-pulse` with gradient overlay moving left-to-right
  - `SkeletonGroup` wrapper for consistent spacing
- [ ] Create `PageSkeleton.tsx` preset: header skeleton + 3 card skeletons
- [ ] Create `TableSkeleton.tsx` preset: header row + 6 body rows
- [ ] Create `FlagListSkeleton.tsx`: matches FlagList card layout
- [ ] Improve Spinner: add `color` prop, add indeterminate progress bar variant
- [ ] Create `ProgressBar.tsx`: determinate progress bar with animation

### EmptyState Component (`EmptyState.tsx`)
- [ ] Add `illustration` prop: accept SVG illustration component
- [ ] Create 5 SVG illustrations for different empty states:
  - Flags: flag icon with dotted outline
  - Segments: user group with circle
  - Analytics: chart with flat line
  - Audit log: scroll with checkmark
  - Search: magnifying glass with question mark
- [ ] Add `size` prop: `sm` (inline) and `lg` (full page)
- [ ] Add subtle float animation on illustration (CSS keyframes, 3s ease-in-out loop)

### Dropdown Component
- [ ] Create `Dropdown.tsx` headless dropdown component
  - Trigger slot + content slot
  - Position: auto (flip when near edge)
  - Animation: `opacity-0 scale-95 translate-y-1` → `opacity-1 scale-100 translate-y-0`
  - Close on outside click, Escape key
  - Support for nested menus
- [ ] Create `DropdownMenu.tsx`: pre-styled dropdown with menu items
  - Menu items: icon + label + optional shortcut hint + optional description
  - Separator lines between groups
  - Disabled items with opacity

### Tabs Component
- [ ] Create `Tabs.tsx` component to replace raw tab implementations
  - Props: `tabs: {id, label, icon?, count?}[]`, `active`, `onChange`
  - Animated underline indicator that slides between tabs (motion div)
  - Badge/count on tab labels
  - Scrollable tabs on mobile (horizontal scroll with fade edges)
- [ ] Apply to FlagDetail tabs, Learn page, and any future tabbed interfaces

---

## Agent 3: Flag-Specific UI

### Flag List Page (`FlagList.tsx`)
- [ ] Replace card-based list with proper `DataTable` component
- [ ] Add column headers: Name/Key, Type, Tags, Environment Status, Last Updated, Toggle
- [ ] Add sortable columns (click header to sort by name, type, date)
- [ ] Add multi-environment status dots: show colored dots for each environment's on/off state (like Unleash)
- [ ] Add flag lifecycle badge: calculate from createdAt/updatedAt, show "New" (<7 days), "Active", "Stale" (no evals in 7+ days)
- [ ] Add bulk selection: checkbox on each row, "Select All" in header
- [ ] Add bulk actions bar: "Archive Selected", "Tag Selected", "Delete Selected"
- [ ] Add pagination: show 25 flags per page, add page controls at bottom
- [ ] Add view toggle: list view (current) vs compact table view
- [ ] Add tag filter: clickable tag chips that filter the list
- [ ] Replace simple search with `SearchInput` component with debounce
- [ ] Add "Recently modified" quick filter chip
- [ ] Add "Stale flags" quick filter chip
- [ ] Add empty state with illustration when no flags match filters (different from "no flags yet")
- [ ] Add skeleton loading state: 6 flag card skeletons while loading
- [ ] Add row hover effect: subtle highlight + show quick action icons (copy key, quick settings)
- [ ] Add flag count display: "Showing 24 of 156 flags" text
- [ ] Add keyboard shortcut: `n` to create new flag
- [ ] Improve CreateFlagModal: add step wizard (1. Basics, 2. Variations, 3. Review) instead of single form
- [ ] Add flag type icon next to type badge (boolean = toggle icon, string = text icon, etc.)
- [ ] Fix toggle to use new `Switch` component with consistent sizing

### Flag Detail Page (`FlagDetail.tsx`)
- [ ] Add breadcrumb: "Flags > {flagName}" at top using new Breadcrumb component
- [ ] Replace tab bar with `Tabs` component (animated underline)
- [ ] Add flag lifecycle indicator: visual pipeline (Define → Develop → Production → Cleanup) like Unleash
- [ ] Add "Last evaluated" timestamp and evaluation count in header metadata
- [ ] Add environment comparison view: new tab or dropdown to see flag state across all environments side-by-side
- [ ] Add "Review and Save" workflow: when changes are made on Targeting tab, show diff modal before saving
  - Show before/after JSON diff
  - Require comment input
  - Submit button with confirmation
- [ ] Improve toggle in header: larger size (h-10 w-20), add environment name label, add confirmation dialog for production toggles
- [ ] Add copy-key button with toast feedback (currently exists but improve with animated checkmark)
- [ ] Add "More actions" dropdown menu in header: Archive, Duplicate, Delete, Copy as JSON
- [ ] Add tag display in header: show tag badges, click to edit inline
- [ ] Add "Code References" tab (placeholder): show code snippets using this flag key
- [ ] Add "Metrics" section in targeting tab: show evaluation count for this flag in current environment

### Targeting Tab (TargetingEditor)
- [ ] Add visual "pipeline" view at top: OFF variation → Prerequisites → Individual Targets → Rules → Default Rule (horizontal flow diagram)
- [ ] Improve targeting on/off toggle section: add tooltip explaining what happens when targeting is off
- [ ] Add green/red visual indicator for targeting state (green glow when ON, muted when OFF)
- [ ] Add drag-and-drop reordering for rules: use `@dnd-kit/sortable`
  - Drag handle (grip dots icon) on left of each rule
  - Smooth animation during drag
  - Drop indicator line between rules
- [ ] Add "Duplicate Rule" action on each rule (copy rule below)
- [ ] Add rule numbering with ordinal badges: "Rule 1", "Rule 2" etc. in styled badges
- [ ] Add visual connector lines between rules showing evaluation flow
- [ ] Improve save bar: make it truly sticky (`fixed bottom-0`), add animation on appearance
  - Background: `bg-slate-900/95 backdrop-blur-sm border-t border-slate-700`
  - Show change count: "3 unsaved changes"
  - Discard button + Save button
  - Slide-up animation with spring easing

### Clause Editor (`ClauseEditor.tsx`)
- [ ] Improve layout: make it a horizontal row on large screens, stack on mobile
- [ ] Add operator descriptions as tooltips (hover "is one of" shows "Matches any of the provided values")
- [ ] Add visual type indicators: number icon for numeric ops, regex icon for regex ops
- [ ] Add attribute autocomplete dropdown (not just datalist): styled dropdown with recent attributes
- [ ] Add clause validation: highlight invalid clauses (empty attribute, no values) with red border
- [ ] Add "duplicate clause" button
- [ ] Improve chip input: add paste support (paste comma-separated values), add "paste from clipboard" button

### Individual Targets (`IndividualTargets.tsx`)
- [ ] Add user avatar/initials circle next to each target value
- [ ] Add search within targets (filter existing target values)
- [ ] Add import targets from CSV/clipboard
- [ ] Add target count per variation: "3 users → True"
- [ ] Add expand/collapse for long target lists (show first 5, "+N more" button)

### Variations Tab (in FlagDetail)
- [ ] Convert to editable variation list: inline editing of variation values
- [ ] Add color indicators per variation (match rollout bar colors)
- [ ] Add "Add Variation" button (for non-boolean flags)
- [ ] Add drag-to-reorder variations
- [ ] Add JSON editor with syntax highlighting for JSON variations (use Monaco or CodeMirror)
- [ ] Add variation name editing (inline, click to edit)
- [ ] Add "Default" badge on the default variation
- [ ] Add "Delete Variation" with confirmation (only if not boolean)

### Rollout Slider (`RolloutSlider.tsx`)
- [ ] Make the color bar interactive: drag dividers to change weights
- [ ] Add percentage labels on the bar segments (show "60%" inside the bar if segment is wide enough)
- [ ] Add "Reset to equal" button (distribute evenly)
- [ ] Add smooth transition animation when weights change
- [ ] Add input validation: show warning if any weight is 0% (might be unintentional)
- [ ] Improve "Bucket by" selector: add tooltip explaining what bucketing means

### Prerequisite Selector (`PrerequisiteSelector.tsx`)
- [ ] Add visual dependency graph: show flags as connected nodes
- [ ] Add search/filter within flag list dropdown
- [ ] Add current state indicator: show if prerequisite is currently met (green check) or not (red X)
- [ ] Add circular dependency detection warning

### Segment Picker (`SegmentPicker.tsx`)
- [ ] Add segment preview on hover: show rules summary in tooltip
- [ ] Add "Create Segment" inline action (open segment creation modal)
- [ ] Add segment member count display
- [ ] Style segment chips with segment color/icon

---

## Agent 4: Data & Status Pages

### Analytics Page (`Analytics.tsx`)
- [ ] Add skeleton loading state: stat card skeletons + chart skeleton
- [ ] Improve stat cards: add subtle gradient backgrounds, add trend sparkline (tiny line chart in card)
- [ ] Add stat card icons: graph icon for evaluations, users icon for contexts, flag icon for active flags
- [ ] Animate stat numbers: count-up animation on load (0 → actual number over 500ms)
- [ ] Improve bar chart: add gradient fill on bars (indigo-500 bottom to indigo-400 top)
- [ ] Add smooth transition animation when switching periods
- [ ] Add "Export CSV" button for evaluation data
- [ ] Add chart type toggle: bar chart vs line chart
- [ ] Improve donut chart: add hover tooltip with exact numbers, add center label showing total
- [ ] Add "Top Flags by Evaluations" leaderboard section: horizontal bar chart of top 10 flags
- [ ] Add "Flag Usage Heatmap" section: calendar heatmap showing daily evaluation volume
- [ ] Improve flag filter: replace text input with searchable dropdown of available flags
- [ ] Add "No data" illustration for empty chart states
- [ ] Add period comparison: "vs. previous period" percentage change on each stat card
- [ ] Improve stale flags section: add "Go to flag" link, add "Archive" quick action
- [ ] Add loading shimmer on chart area while data loads (not "Loading..." text)

### Audit Log Page (`AuditLog.tsx`)
- [ ] Add skeleton loading state: timeline skeleton
- [ ] Convert to timeline view: vertical timeline with dots and connecting lines (like FlagDetail Activity tab)
- [ ] Add action-specific icons: proper SVG icons instead of emoji (toggle=switch, create=plus-circle, delete=trash, update=pencil, targeting=crosshair)
- [ ] Add avatar/initials for each user in the timeline
- [ ] Add "Today", "Yesterday", "This Week" date group headers in timeline
- [ ] Improve diff view: add inline diff (not just side-by-side), highlight changed fields in yellow
- [ ] Add "Revert to this state" action button on each entry
- [ ] Add real-time updates: poll for new entries every 30s, add "New entries" notification bar at top
- [ ] Add filter chips: quick filter buttons for "Toggles", "Creates", "Deletes", "Updates"
- [ ] Add date range picker instead of raw date inputs
- [ ] Add "Copy audit entry" action (copy as JSON)
- [ ] Improve "Load more" button: infinite scroll with IntersectionObserver
- [ ] Add entry count: "Showing 20 of 156 entries"
- [ ] Add export functionality: "Export as CSV" button

### Playground Page (`Playground.tsx`)
- [ ] Add skeleton loading for results table
- [ ] Improve context editor: use proper code editor component with JSON syntax highlighting (CodeMirror or simple highlight)
- [ ] Add context validation: real-time JSON validation with inline error indicators
- [ ] Add "Format JSON" button (pretty-print the context)
- [ ] Improve preset buttons: use cards with icon + name + description instead of small buttons
- [ ] Add custom preset saving: "Save as Preset" button, store in localStorage
- [ ] Add "Delete Preset" and "Edit Preset" for custom presets
- [ ] Add results animation: stagger-animate rows appearing (each row slides in 50ms after previous)
- [ ] Improve results table: use `DataTable` component with sorting
- [ ] Add "Copy Result" per row: copy flag evaluation result as JSON
- [ ] Add "View Flag" link on each result row (navigate to flag detail)
- [ ] Add visual true/false indicators: green checkmark for true, red X for false (not just colored text)
- [ ] Add reason explanation tooltips: hover over "RULE_MATCH" shows "Matched rule #2: Beta users"
- [ ] Add "Evaluate Single Flag" mode: dropdown to select specific flag to evaluate
- [ ] Improve detail panel: tabbed view with "Raw JSON", "Evaluation Path" (visual flow), "Context Matches"
- [ ] Add evaluation time display: show how long evaluation took (ms)
- [ ] Add split-pane resizable layout between editor and results

### Segments Page (`Segments.tsx`)
- [ ] Add skeleton loading state: segment card skeletons
- [ ] Improve segment cards: add rule count badge, member count badge, last modified date
- [ ] Add search bar for segments
- [ ] Add empty state with illustration
- [ ] Convert create form to modal (use new `Modal` component)
- [ ] Add segment type indicator: "Project" vs "Feature-specific"
- [ ] Add quick actions on hover: duplicate, delete

### Segment Detail Page (`SegmentDetail.tsx`)
- [ ] Add breadcrumb: "Segments > {segmentName}"
- [ ] Add skeleton loading state
- [ ] Add member preview: show first 5 matching users with "test" evaluation
- [ ] Improve included/excluded sections: add user count badge, collapsible sections
- [ ] Add "Test Segment" feature: input a context, show if it matches
- [ ] Add save bar with diff review (like targeting editor)
- [ ] Add "Used by" section: show which flags reference this segment

### Settings Page (`Settings.tsx`)
- [ ] Add section navigation sidebar (or anchor links): Environments, SDK, Danger Zone
- [ ] Improve environment cards: add environment icon/color picker
- [ ] Add "Create Environment" button and form
- [ ] Add environment reorder (drag-and-drop)
- [ ] Add API key copy animation: checkmark appears, reverts after 2s
- [ ] Add Webhook configuration section (placeholder)
- [ ] Add team members section (placeholder): list team members with roles
- [ ] Add project name/description editor at top
- [ ] Improve danger zone: red left border accent, warning icon
- [ ] Add delete confirmation animation: button shakes if input doesn't match

### Learn Page (`Learn.tsx`)
- [ ] Add progress tracking: show completion dots/bar for read sections
- [ ] Add "Copy" button on all code examples
- [ ] Improve code highlighting: use a proper syntax highlighter (Prism.js or highlight.js) instead of regex
- [ ] Add interactive examples: embed mini playground for key concepts
- [ ] Add reading time estimate per section
- [ ] Add "Next/Previous" navigation at bottom of each section
- [ ] Improve TOC sidebar: add nested sub-sections, show current section with highlight
- [ ] Add search within learn content
- [ ] Add smooth scroll-spy with debounce for performance

---

## Agent 5: Mobile, Polish & Animations

### Global Animations
- [ ] Install `framer-motion` and create `src/lib/animations.ts` with shared animation configs:
  - `fadeIn: { initial: {opacity:0}, animate: {opacity:1}, transition: {duration:0.2} }`
  - `slideUp: { initial: {opacity:0, y:12}, animate: {opacity:1, y:0} }`
  - `slideIn: { initial: {opacity:0, x:-12}, animate: {opacity:1, x:0} }`
  - `scaleIn: { initial: {opacity:0, scale:0.95}, animate: {opacity:1, scale:1} }`
  - `stagger: { transition: { staggerChildren: 0.05 } }`
- [ ] Add page transition animations: wrap each page in `motion.div` with `slideUp` variant
- [ ] Add list item stagger animation: flag list items, audit entries, segment cards animate in sequentially
- [ ] Add card mount animation: cards fade+scale in on first render
- [ ] Add number counter animation for stats (Analytics page stat cards)
- [ ] Add toggle animation: spring physics on toggle knob (`transition: { type: 'spring', stiffness: 500, damping: 30 }`)
- [ ] Add modal enter/exit animations (scale + fade, 200ms)
- [ ] Add dropdown open/close animations (scale from anchor point)
- [ ] Add toast slide-in animation (from right edge)
- [ ] Add save bar slide-up animation (from bottom)
- [ ] Add chart bar grow animation (bars grow from 0 to target height on mount)
- [ ] Add skeleton shimmer animation: linear gradient moving left-to-right (CSS keyframes, 1.5s loop)
- [ ] Add hover lift effect on interactive cards: `hover:translate-y-[-1px] hover:shadow-lg transition-all`
- [ ] Add button press effect: `active:scale-[0.98]` on all buttons
- [ ] Add focus ring animation: ring expands from center outward (subtle)
- [ ] Add tab switch underline animation: underline slides smoothly between tabs

### Mobile Responsiveness
- [ ] **Layout**: Sidebar already has mobile hamburger; verify it works correctly at 375px, 390px, 428px widths
- [ ] **Layout**: Add bottom navigation bar on mobile (< 640px) with 5 key items: Flags, Segments, Analytics, Settings, More
  - Fixed bottom, 56px tall, bg-slate-950, icon + small label per item
  - Hide sidebar nav on mobile, show bottom nav instead
- [ ] **Header**: Stack environment badges horizontally scrollable on mobile
- [ ] **Header**: Hide username on mobile (< 640px), show only avatar
- [ ] **FlagList**: Convert to card layout on mobile (< 768px): stack name, key, tags, toggle vertically
- [ ] **FlagList**: Make toggle touch-friendly: minimum 44px touch target
- [ ] **FlagList**: Filters collapse into a "Filters" button that opens a bottom sheet on mobile
- [ ] **FlagDetail**: Stack header (title + toggle) vertically on mobile
- [ ] **FlagDetail**: Make tabs horizontally scrollable on mobile
- [ ] **FlagDetail**: Targeting editor: clause editors stack fully vertical on mobile
- [ ] **Analytics**: Stat cards: 1 column on mobile (currently `sm:grid-cols-3` — add `grid-cols-1` base)
- [ ] **Analytics**: Chart: full width, reduce height to h-48 on mobile
- [ ] **AuditLog**: Filters collapse into expandable section on mobile
- [ ] **AuditLog**: Diff view: stack before/after vertically on mobile (not side-by-side)
- [ ] **Playground**: Stack editor and results vertically on mobile (not side-by-side)
- [ ] **Playground**: Full-width textarea and results
- [ ] **Settings**: Environment cards: stack info and actions vertically
- [ ] **Learn**: Hide sidebar TOC on mobile, add hamburger toggle
- [ ] **Modals**: Full-screen modals on mobile (< 640px) instead of centered cards
- [ ] **CreateFlagModal**: Full-screen on mobile with proper scroll
- [ ] **Tables**: Add horizontal scroll wrapper with fade indicators on mobile
- [ ] Add pull-to-refresh gesture on flag list (mobile only)
- [ ] Test all touch interactions: toggles, dropdowns, chip inputs, drag-and-drop

### Loading States
- [ ] **FlagList**: Replace `<Spinner>` with `<FlagListSkeleton>` (6 card-shaped skeleton items)
- [ ] **FlagDetail**: Add skeleton for header + tabs + content area
- [ ] **Analytics**: Add skeleton for stat cards (3 rectangles) + chart area (single rectangle)
- [ ] **AuditLog**: Add skeleton for filter bar + 5 timeline entries
- [ ] **Playground**: Add skeleton for results area
- [ ] **Segments**: Add skeleton for 4 segment cards
- [ ] **SegmentDetail**: Add skeleton for header + sections
- [ ] **Settings**: Add skeleton for environment cards + SDK section
- [ ] **Learn**: Add skeleton for TOC sidebar + content area
- [ ] **TargetingEditor**: Add skeleton while loading targeting config
- [ ] All API calls: add retry logic (1 retry after 2s) with subtle "Retrying..." indicator

### Error States
- [ ] Create `ErrorState.tsx` component: icon + title + description + retry button
  - Red-tinted card with alert icon
  - "Something went wrong" title
  - Technical error message in collapsible detail
  - "Try Again" button
- [ ] **FlagList**: Show ErrorState when flag fetch fails (instead of empty list)
- [ ] **FlagDetail**: Show ErrorState when flag not found (404) with "Go back to flags" link
- [ ] **Analytics**: Show ErrorState per section (chart can fail independently of stats)
- [ ] **AuditLog**: Show inline error with retry
- [ ] **Playground**: Show clear error messages for JSON parse errors, API errors
- [ ] **Segments**: Show ErrorState when segments fail to load
- [ ] **Settings**: Show ErrorState per section
- [ ] Add global error boundary: `ErrorBoundary.tsx` component wrapping `<Outlet>`
  - Catches render errors
  - Shows friendly error page with "Reload" button
  - Logs error to console

### Polish & Quality of Life
- [ ] Add `title` attributes to all icon-only buttons for accessibility
- [ ] Add `aria-label` on all interactive elements without visible text
- [ ] Add keyboard shortcuts: `n` (new flag), `/` (focus search), `?` (show shortcuts modal)
- [ ] Create `KeyboardShortcutsModal.tsx`: show all available shortcuts in a styled table
- [ ] Add `Cmd+S` / `Ctrl+S` shortcut to save (when changes detected on targeting/settings pages)
- [ ] Add favicon: create proper favicon from flag icon
- [ ] Add page titles: use `document.title` updates per page (e.g., "dark-mode - Flags - FlagService")
- [ ] Add subtle hover cursors: `cursor-pointer` on all clickable elements
- [ ] Audit all z-index values: establish layering system (base: 0, dropdown: 10, modal: 50, toast: 60)
- [ ] Add scroll-to-top on page navigation
- [ ] Add "unsaved changes" warning: `beforeunload` event when targeting/settings have pending changes
- [ ] Smooth scroll behavior globally: add `scroll-behavior: smooth` to html
- [ ] Add loading bar at top of page during navigation (thin indigo bar, like YouTube/GitHub)
- [ ] Audit all `text-white` usage: some should be `text-slate-100` for slightly softer appearance
- [ ] Add `prefers-reduced-motion` media query: disable all animations for users who prefer reduced motion
- [ ] Ensure all colors meet WCAG AA contrast ratio (especially slate-400 on slate-900 — may need to lighten to slate-300)
- [ ] Add consistent icon sizing: 16px for inline, 20px for buttons, 24px for feature icons
- [ ] Review all border radiuses: standardize to 8px for cards, 6px for inputs, 9999px for pills
- [ ] Add timestamp tooltips: hover over relative times ("5m ago") shows full datetime
- [ ] Add "What's New" changelog section or badge (placeholder for future)
- [ ] Add dark/light theme toggle (stretch goal — currently dark only, add light theme CSS variables)

---

## Implementation Priority

### Phase 1 (Foundation) — Agents 1 & 2
Core components, layout improvements, design tokens. Everything else builds on these.

### Phase 2 (Flag Experience) — Agent 3
The primary user experience. Flag list and detail pages are the most-used pages.

### Phase 3 (Data Pages) — Agent 4
Analytics, audit log, playground, segments, settings improvements.

### Phase 4 (Polish) — Agent 5
Animations, mobile, loading/error states, accessibility, keyboard shortcuts.

---

## Total TODO Count: ~230 items

### Per Agent:
1. **Layout & Navigation**: ~30 items
2. **Core Components**: ~55 items
3. **Flag-Specific UI**: ~60 items
4. **Data & Status Pages**: ~45 items
5. **Mobile, Polish & Animations**: ~40 items
