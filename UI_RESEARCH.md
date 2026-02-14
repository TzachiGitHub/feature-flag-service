# UI/UX Research: Top Feature Flag Dashboards

## 1. LaunchDarkly (Market Leader)

### Navigation Patterns
- **Left sidebar**: Collapsible, dark navy background (#1B2332), icon + label nav items
- **Structure**: Flags, Segments, Contexts, Experiments, Metrics, Integrations, Settings grouped logically
- **Breadcrumbs**: Full breadcrumb trail on detail pages (Project > Environment > Flag > Tab)
- **Environment selector**: Prominent dropdown in top header, color-coded per environment
- **Project switcher**: Top-left dropdown, always visible
- **Search**: Global Cmd+K search overlay (fuzzy search across all entities)

### Flag List Page
- **Table design**: Full-width data table with column headers (Name, Key, Kind, Tags, Status, Last Modified)
- **Toggle placement**: Right-aligned toggle with clear ON/OFF state, green/gray coloring
- **Search/Filter**: Search bar at top, filter chips for tags/type/status, sort controls
- **Bulk actions**: Checkbox selection with bulk archive/tag
- **Pagination**: Virtual scrolling for large lists
- **Quick actions**: Hover reveals copy-key, quick-toggle actions
- **Flag lifecycle badges**: "New", "Active", "Stale", "Deprecated" lifecycle indicators

### Flag Detail Page
- **Tabs**: Targeting, Variations, Metrics, Activity, Settings, Code References
- **Targeting rules**: Visual rule builder with AND/OR logic, drag-to-reorder
- **Variation editor**: Inline JSON editor with syntax highlighting, named variations with color dots
- **"Review and Save" workflow**: Changes shown as diff before saving, comment required
- **Kill switch**: Prominent red OFF button at top
- **Environment comparison**: Side-by-side view of flag state across environments

### Color Scheme & Typography
- **Background**: Deep navy (#0E1621 sidebar, #141C2E main)
- **Cards**: Slightly lighter with subtle borders (#1E293B)
- **Primary accent**: Purple/indigo (#7B61FF)
- **Success**: Green (#22C55E)
- **Danger**: Red (#EF4444)
- **Text**: White headers, slate-300 body, slate-500 secondary
- **Typography**: Inter font, 14px base, generous line-height
- **Spacing**: 24px padding on cards, 16px gaps between elements

### Micro-interactions
- **Toggle**: Smooth spring animation with color transition, ON/OFF label inside track
- **Rule builder**: Drag handles with smooth reorder animation
- **Save bar**: Sticky bottom bar slides up when changes detected, pulse animation on save button
- **Toasts**: Slide in from bottom-right with progress bar
- **Hover states**: Subtle background highlight, cursor changes
- **Loading**: Skeleton screens (not spinners) for main content areas
- **Transitions**: 200ms ease-out for all state changes

### Mobile Responsiveness
- Sidebar collapses to hamburger menu on mobile
- Flag list becomes card-based layout (not table)
- Toggle remains accessible
- Bottom navigation on mobile for key actions

### Standout UX Features
- **Cmd+K global search** across all flags, segments, environments
- **Review & Save workflow** (like a PR review for flag changes)
- **Code References** showing where flags are used in codebase
- **Flag health/lifecycle** tracking (stale flag detection)
- **Compare environments** side-by-side
- **Scheduled flag changes** (turn on at a future date)
- **Approval workflows** for production changes
- **Skeleton loading states** everywhere

---

## 2. Flagsmith (Open Source Competitor)

### Navigation Patterns
- **Left sidebar**: Clean, minimal sidebar with icon + text
- **Structure**: Features, Segments, Users, Integrations, Audit Log, Settings
- **Environment tabs**: Horizontal tab bar at top to switch environments
- **Project/org switcher**: Top-left breadcrumb-style selector

### Flag List Page
- **List view**: Card-based list (not a traditional table)
- **Toggle**: Left-aligned toggle per flag row, clear enabled/disabled state
- **Search**: Simple text search at top
- **Filter**: Tags dropdown, feature type filter
- **View toggle**: Grid vs. list view option
- **Per-flag value display**: Shows current value inline (not just on/off)
- **Environment columns**: Can show multiple environment states in columns

### Flag Detail Page
- **Tabs**: Value, Identity Overrides, Segment Overrides, Settings
- **Value tab**: Simple on/off toggle + value editor (string/number/boolean/JSON)
- **Segment overrides**: Select segment → set override value
- **A/B testing**: "Create A/B/n Test" button for multivariate setup with percentage sliders
- **Tags panel**: Right sidebar for metadata

### Color Scheme & Typography
- **Background**: White/light gray (#F8FAFC) — light theme default
- **Sidebar**: Dark sidebar (#1E293B)
- **Primary**: Blue (#3B82F6)
- **Cards**: White with subtle shadow and border
- **Typography**: System fonts, clean and minimal
- **Spacing**: Generous padding, breathing room between sections

### Micro-interactions
- **Toggle**: Standard iOS-style toggle with smooth transition
- **Tab switching**: Instant, no animation
- **Save**: Inline save buttons per section
- **Notifications**: Top banner notifications

### Mobile Responsiveness
- Responsive layout with sidebar collapse
- Feature list stacks vertically
- Touch-friendly toggle sizes

### Standout UX Features
- **Multi-environment view** in a single table
- **Identity overrides** (target specific users by key)
- **Feature-specific segments** (create segment inline)
- **Change requests** workflow for team approvals
- **Version history** per flag per environment
- **Server-side only flag** option (prevents client SDK access)

---

## 3. Unleash (Open Source Competitor)

### Navigation Patterns
- **Left sidebar**: Minimal, icon-first with expandable labels
- **Structure**: Feature flags, Projects, Playground, Segments, Strategy Templates, Admin
- **Project-centric**: Everything scoped to a project
- **Search**: Global search in header

### Flag List Page
- **Table**: Clean data table with sortable columns
- **Columns**: Name, Type, Created, Status per environment (colored dots)
- **Environment status dots**: Small colored circles showing on/off per env
- **Quick toggle**: Click environment dot to toggle
- **Type badges**: Color-coded type labels (Release, Experiment, Operational, Kill Switch, Permission)
- **Stale indicators**: Visual indicator for stale/potentially stale flags
- **Lifecycle badges**: Define → Develop → Production → Cleanup → Archived

### Flag Detail Page
- **Environment tabs**: Horizontal tabs for each environment
- **Strategy list**: Ordered list of activation strategies
- **Strategy types**: gradualRollout, userWithId, flexibleRollout, applicationHostname
- **Variants section**: Named variants with weight percentages and optional payloads
- **Metrics**: Built-in usage metrics per flag
- **Event log**: Flag-specific event timeline
- **Dependencies**: Parent/child flag relationship UI

### Color Scheme & Typography
- **Background**: White (#FFFFFF) with light gray sections
- **Sidebar**: Dark (#1A1A2E)
- **Primary**: Purple (#6C63FF)
- **Success**: Green for enabled states
- **Warning**: Amber for stale flags
- **Text**: Dark gray body, medium-weight headings
- **Typography**: Clean sans-serif, good hierarchy

### Micro-interactions
- **Toggle**: Quick flip with color change
- **Strategy ordering**: Drag-and-drop reorder
- **Change request UI**: Review panel slides in
- **Metrics charts**: Animated line/bar charts
- **Lifecycle progression**: Visual pipeline indicator

### Mobile Responsiveness
- Responsive sidebar
- Table adapts to card layout on small screens
- Strategy editor remains usable on tablet

### Standout UX Features
- **Flag lifecycle pipeline** (Define → Develop → Production → Cleanup → Archived)
- **Strategy templates** (reusable targeting strategies)
- **Flag dependencies** (parent/child relationships)
- **Project health dashboard** (technical debt score)
- **Change requests** with approval workflow
- **Playground** for testing flag evaluation
- **Impression data** tracking
- **Naming patterns** enforcement
- **Flag type system** with expected lifetimes

---

## Key Patterns Across All Three

| Feature | LaunchDarkly | Flagsmith | Unleash |
|---------|-------------|-----------|---------|
| Global search | Cmd+K | Basic | Header search |
| Skeleton loading | ✅ | ❌ | ❌ |
| Review & save | ✅ (required) | ✅ (optional) | ✅ (change requests) |
| Environment comparison | ✅ | ✅ (columns) | ✅ (dots/tabs) |
| Flag lifecycle | ✅ | ❌ | ✅ (5 stages) |
| Stale flag detection | ✅ | ❌ | ✅ |
| Code references | ✅ | ❌ | ❌ |
| Drag-and-drop rules | ✅ | ❌ | ✅ |
| Approval workflows | ✅ | ✅ | ✅ |
| Flag dependencies | ✅ | ❌ | ✅ |
| Scheduled changes | ✅ | ❌ | ❌ |
| Dark theme | ✅ (default) | ❌ (light) | ❌ (light) |

## Design Principles to Adopt

1. **Information density**: Show maximum useful info without clutter
2. **Progressive disclosure**: Simple view first, drill into complexity
3. **Skeleton loading**: Never show blank pages or simple spinners
4. **Sticky save bars**: Always visible when changes are pending
5. **Keyboard navigation**: Cmd+K search, keyboard shortcuts
6. **Environment awareness**: Always show which environment you're working in
7. **Diff-based saving**: Show what changed before committing
8. **Visual hierarchy**: Clear separation between sections with consistent spacing
9. **Contextual actions**: Right-click menus, hover actions, inline editing
10. **Empty states**: Helpful illustrations and CTAs when no data exists
