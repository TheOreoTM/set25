# SET25 HQ Design System

## Principles

SET25 HQ is athletic, technical, editorial, and exact. Premium is expressed through restraint, hierarchy, spacing, sharp alignment, and high contrast—not gradients, glow, glass, large soft cards, or ornamental motion.

## Brand assets

Canonical assets live in `packages/brand/assets/` and must remain unchanged. Use:

- `SET25_Primary_Wordmark_White.svg` on the Onyx sidebar;
- `S25_Monogram.svg` or `25_Compact.svg` where space is constrained;
- other supplied lockups only when their composition matches the context.

Never recreate a SET25 logo with type, trace it, or substitute a text approximation. Preserve intrinsic proportions and clear space.

## Colour

| Token | Value     | Use                                                       |
| ----- | --------- | --------------------------------------------------------- |
| Onyx  | `#0A0A0A` | primary text, sidebar, high-emphasis surfaces             |
| White | `#F4F4F4` | application canvas and text on Onyx                       |
| Volt  | `#D7FF3F` | selected state, focus detail, urgent accent, small signal |
| Steel | `#8A8F94` | secondary text and quiet metadata                         |

Supporting neutrals may be derived only to provide readable layers and borders (for example warm white, pale grey, graphite). They must stay visually subordinate to the four brand colours.

### Volt rules

- Use Volt for signals, not acreage: active navigation indicators, small status marks, focus rings, and one high-value accent.
- Do not use Volt as the default background for every button or card.
- Never place small white text on Volt; use Onyx for sufficient contrast.
- A screen should remain composed and legible if every Volt element is mentally removed.

## Typography

- **Rajdhani:** headings, display numbers, section labels, compact technical labels, navigation group labels.
- **Inter:** body copy, buttons, form controls, table content, metadata.

Display type may use uppercase and tightened line height. Interface copy uses sentence case for clarity. Numeric summaries use tabular figures where alignment matters.

Suggested scale:

- display: 2.5–4rem, Rajdhani 600;
- page title: 1.75–2.25rem, Rajdhani 600;
- section title: 1.125–1.375rem, Rajdhani 600;
- body: 0.875–1rem, Inter 400–500;
- label/meta: 0.6875–0.75rem, Rajdhani or Inter 600, tracked uppercase.

## Shared tokens

Canonical colours, font families, and the type scale live in `packages/brand/styles/tokens.css`. Apps import it right after Tailwind (`@import "tailwindcss"; @import "@set25/brand/styles/tokens.css";`). Every token is both a CSS variable and a Tailwind v4 utility:

| Kind        | CSS variable                                                                                                   | Utility example                        |
| ----------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| Colour      | `--color-onyx`, `-white`, `-volt`, `-steel`, `-paper`, `-line`, `-muted`, `-danger`                            | `text-onyx`, `bg-volt`, `border-line`  |
| Font family | `--font-interface`, `--font-display`                                                                           | `font-interface`, `font-display`       |
| Type scale  | `--text-meta` 9px, `-label` 10px, `-small` 11px, `-body` 12px, `-body-lg` 13px, `-section` 21px, `-title` 32px | `text-meta`, `text-body`, `text-title` |

The HQ type scale is deliberately small. New code uses these steps only: 9px is the minimum for readable interface text, and new 8px or fractional sizes should not be introduced. SET25 White (`#F4F4F4`) replaces Tailwind's default `white`.

The shared file holds universal primitives only. HQ-specific layout, density, tables, forms, and cards stay in the HQ app, because the Store needs a different density. HQ's short variable names (`--onyx`, `--paper`, and so on) are compatibility aliases of the shared tokens. HQ `body` uses `--text-body` as its base size so unsized text never falls back to the browser's 16px.

## Spacing and layout

Use a 4px base unit with a practical sequence of 4, 8, 12, 16, 20, 24, 32, 40, 48, and 64px. Dense operational groups use 12–20px; page sections use 32–48px. The desktop content area has a readable maximum width while operational tables may use available width.

Alignment should feel structural. Use rules, columns, and whitespace before introducing containers.

## Borders, radius, and elevation

- Standard border: 1px neutral rule.
- Strong divider: 1px Onyx or 2px accent rule.
- Default radius: 0–4px.
- Controls may use up to 6px where touch ergonomics benefit.
- Pills are reserved for compact status indicators and counts.
- Avoid heavy shadows. A subtle shadow may clarify an overlay such as mobile navigation.

## Buttons

- **Primary:** Onyx fill, White label; use for the single dominant action.
- **Accent:** Volt fill, Onyx label; reserve for rare, high-priority actions.
- **Secondary:** transparent or White fill with a neutral/Onyx border.
- **Quiet:** text/icon treatment without a containing card.

Buttons use Inter 600, compact radius, visible focus treatment, and a minimum 44px mobile hit area. Disabled states must remain readable and not rely solely on opacity.

## Form controls

Inputs use White backgrounds, neutral borders, Onyx text, and visible labels. Focus uses an Onyx outline with a narrow Volt offset/accent. Placeholder text is Steel and never replaces a label. Error text is plain and specific. Controls are at least 44px high on touch layouts.

## Tables and lists

Desktop tables are dense, ruled, and left aligned. Headers use compact tracked type. Numeric columns align right and use tabular figures. Hover is subtle and must not be the only indication of interactivity.

On mobile, tables become purpose-built stacked records: show the identifier, status, most important value, and next action rather than squeezing all columns horizontally.

## Status indicators

Status always combines wording with a visual signal. Do not rely on colour alone.

- neutral/in progress: Steel or outlined;
- healthy/complete: Onyx with clear wording;
- attention: Volt accent with Onyx text;
- critical/overdue: restrained red supporting colour, used only when urgency is real.

## Navigation

Desktop uses a fixed-width Onyx sidebar with the canonical white wordmark, grouped labels, clear current-page treatment, and compact iconography. Mobile uses a persistent top bar and an accessible menu drawer. Navigation labels are plain English and routes remain stable across breakpoints.

## Responsive behaviour

- **Mobile (< 768px):** top bar, drawer navigation, single-column summaries, stacked operational records, 16px page gutters.
- **Tablet (768–1023px):** compact sidebar or drawer depending on usable width; two-column summaries where appropriate.
- **Desktop (>= 1024px):** persistent sidebar, four-column primary summary, editorial multi-column dashboard.

The order of content on small screens follows urgency: page context, needs attention, key summaries, incoming, recent orders, tasks, activity.

## Loading and empty states

Loading skeletons mirror the final hierarchy using flat neutral blocks and restrained pulse animation, respecting reduced-motion preferences. Empty states explain what is absent and, when a workflow exists, what the user can do next. Placeholder routes explicitly say the area is planned rather than presenting fake controls.

## Accessibility

- Maintain WCAG AA contrast for interface text.
- Provide keyboard-visible focus states.
- Use semantic landmarks, headings, lists, tables, and buttons.
- Label icon-only controls with accessible names.
- Keep interactive targets at least 44×44px on mobile.
- Respect reduced motion.
