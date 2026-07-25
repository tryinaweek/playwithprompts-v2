# Play with Prompts — Design System

## Brand Identity

**Name:** Catch the AI (playwithprompts.com)
**Tagline:** One challenge a day. Spot what the AI got wrong.
**Tone:** Friendly, clear, playful. Speaks to non-technical people without dumbing things down. A smart friend daring you to beat a puzzle.

**Not:** Corporate, academic, or hype-driven. Streaks, scores, and percentiles ARE the product (v3 decision — the game mechanics carry the learning); XP-style decoration beyond those is still banned. No fabricated numbers, ever.

---

## Colors

### Primary Palette

| Name | Value | Usage |
|------|-------|-------|
| Purple 600 | `#7c3aed` | Primary accent, CTAs, active states |
| Blue 600 | `#2563eb` | Secondary accent, gradients with purple |
| Primary gradient | `from-purple-600 to-blue-600` | Buttons, hero elements, lesson nav |

### Semantic Colors

| Name | Value | Usage |
|------|-------|-------|
| Green 500 | `#22c55e` | Success, correct answers, completed states |
| Green 50 | `#f0fdf4` | Success backgrounds |
| Red 400 | `#f87171` | Errors, incorrect answers |
| Red 50 | `#fef2f2` | Error backgrounds, "Before" examples |
| Amber 500 | `#f59e0b` | Tips, warnings, highlights |
| Amber 50 | `#fffbeb` | Tip backgrounds |

### Neutral Colors

| Name | Value | Usage |
|------|-------|-------|
| Gray 900 | `#111827` | Headings, primary text |
| Gray 700 | `#374151` | Body text, paragraph content |
| Gray 500 | `#6b7280` | Secondary text, metadata |
| Gray 400 | `#9ca3af` | Muted text, placeholders |
| Gray 200 | `#e5e7eb` | Borders, dividers |
| Gray 50 | `#f9fafb` | Page backgrounds, section alternation |
| White | `#ffffff` | Cards, content backgrounds |

---

## Typography

### Font Stack

```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

System fonts only. No custom fonts to load. Fast, native-feeling, readable on every device.

### Type Scale

| Element | Size | Weight | Color | Line Height |
|---------|------|--------|-------|-------------|
| Page title (h1) | `text-3xl` (30px) | `font-bold` (700) | gray-900 | tight |
| Section heading (h2) | `text-xl` (20px) | `font-bold` (700) | gray-900 | — |
| Subsection (h3) | `text-lg` (18px) | `font-bold` (700) | gray-900 | — |
| Body text | `text-base` (16px) | `font-normal` (400) | gray-700 | relaxed (1.625) |
| Small text / metadata | `text-sm` (14px) | `font-normal` (400) | gray-500 | — |
| Labels / caps | `text-xs` (12px) | `font-semibold` (600) | gray-400 | — |
| Inline code | `text-sm` (14px) | `font-mono` | purple-700 on gray-100 | — |

### Reading Width

Content area maxes out at `max-w-2xl` (672px / ~65 characters per line). This is the optimal reading width. Never stretch lesson text wider than this.

---

## Spacing

### Page Layout

| Area | Spacing |
|------|---------|
| Page padding (horizontal) | `px-4` (16px) |
| Page padding (vertical) | `py-8` to `py-10` (32-40px) |
| Content max width | `max-w-5xl` (1024px) for layout, `max-w-2xl` (672px) for content |
| Section gap | `space-y-12` (48px) between lesson sections |

### Component Spacing

| Element | Spacing |
|---------|---------|
| Between heading and content | `mb-4` (16px) |
| Between paragraphs | `my-3` (12px) |
| Inside cards | `p-5` or `p-6` (20-24px) |
| List item gap | `space-y-2` (8px) |
| Button padding | `px-5 py-3` or `px-6 py-3` |

---

## Components

### Buttons

**Primary CTA:**
```
bg-gradient-to-r from-purple-600 to-blue-600 text-white
rounded-xl px-6 py-3 font-medium hover:opacity-90
```

**Secondary / Outline:**
```
border border-gray-200 text-gray-700
rounded-xl px-5 py-3 hover:bg-gray-50
```

**Navigation link:**
```
text-gray-500 hover:text-gray-900 text-sm flex items-center gap-1
```

### Cards

**Default card:**
```
rounded-xl border border-gray-200 bg-white overflow-hidden
```

**Prompt template card:**
```
rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50 p-5
```

**Before (weak) card:**
```
rounded-xl border border-red-200 bg-red-50 p-4
```

**After (strong) card:**
```
rounded-xl border border-green-200 bg-green-50 p-4
```

**Exercise wrapper:**
```
rounded-xl border-2 border-purple-200 bg-purple-50/50 p-6
```

**Tip / callout:**
```
rounded-xl border border-amber-200 bg-amber-50 p-5
```

**Blockquote / insight:**
```
border-l-4 border-purple-400 bg-purple-50 pl-4 pr-4 py-3 rounded-r-lg
```

### Module Accordion (Course Overview)

**Module header:**
```
w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50
rounded-xl border border-gray-200 bg-white
```

**Lesson row inside module:**
```
w-full px-5 py-3 flex items-center gap-3 hover:bg-purple-50
```

### Header

```
bg-white border-b border-gray-200
max-w-5xl mx-auto px-4 py-4
```

Logo: 36px purple-to-blue gradient rounded-xl with white BookOpen icon.

---

## Iconography

Using Lucide React exclusively. Common icons:

| Icon | Usage |
|------|-------|
| `BookOpen` | Logo, course/learning references |
| `Clock` | Time estimates |
| `Play` | Start/continue lesson |
| `ArrowLeft` / `ArrowRight` | Navigation |
| `ChevronDown` / `ChevronRight` | Accordion expand/collapse |
| `CheckCircle` | Completed states, correct answers |
| `Lock` | Locked content |
| `PenTool` | Exercises |
| `Lightbulb` | Tips |
| `Sparkles` | AI feedback |

Icon size: `w-4 h-4` (16px) for inline, `w-5 h-5` (20px) for section headers, `w-6 h-6` (24px) for logo.

---

## Lesson Content Styling

### Section Types

Each lesson has sections parsed from markdown. Each type gets distinct visual treatment:

| Type | Treatment |
|------|-----------|
| **Content** | Default prose styling, gray-700 text |
| **Example** (Before/After) | Red card (before) + green card (after) |
| **Template** | Purple gradient card with monospace text |
| **Exercise** | Purple border wrapper with pen icon |
| **Quiz** | Interactive MCQ with click-to-select, green/red results |
| **Tip** | Amber background callout with lightbulb |

### Code / Prompt Blocks

Prompt templates render as styled cards, NOT as dark code blocks. This is a non-technical audience. Dark terminal-style blocks feel intimidating. Purple gradient cards with monospace text feel inviting.

```
rounded-xl border border-purple-200
bg-gradient-to-br from-purple-50 to-blue-50
p-5 font-mono text-sm text-gray-800
```

### Quiz Interaction

- Unselected: `border-gray-200`
- Selected: `border-purple-500 bg-purple-50`
- Correct (after submit): `border-green-500 bg-green-50` with checkmark
- Incorrect (after submit): `border-red-400 bg-red-50`
- Correct but not selected: `border-green-300 bg-green-50/50`

---

## Responsive Design

### Breakpoints

| Breakpoint | Behavior |
|------------|----------|
| Mobile (< 768px) | Single column, TOC hidden, full-width content |
| Tablet (768-1024px) | Single column with padding |
| Desktop (> 1024px) | TOC sidebar (192px) + content column |

### Mobile Priorities

- Content is never narrower than viewport minus padding
- Buttons are full-width on mobile
- Navigation arrows in header for lesson-to-lesson
- No horizontal scrolling, ever

---

## Animation

Minimal. No framer-motion, no floating elements, no pulsing badges.

| What | How |
|------|-----|
| Page transitions | None (instant route changes) |
| Hover states | `transition-colors` (150ms default) |
| Button hover | `hover:opacity-90` |
| Loading states | Simple spinner (`animate-spin rounded-full border-b-2 border-purple-600`) |

---

## Certification (Future)

When implemented, certificates should:
- Use the same purple-to-blue gradient as brand accent
- Show: student name, course name, completion date, verification code
- Be shareable as image (for LinkedIn/Twitter)
- Have a public verification URL at `/verify/:code`
- PDF download option
- Pass threshold: 80%+ on final exam

---

## What This Design System Is NOT

- No dark mode (keep it simple, add later if demand exists)
- No custom fonts (system fonts are fast and readable)
- No complex animations (content is the experience)
- No XP bars or achievement-badge walls (streaks, scores, and percentiles are allowed — they are the core loop; decorative gamification beyond them is not)
- No gradient backgrounds on page sections (white and gray-50 only)
- No decorative floating elements (no gradient circles, no blur blobs)

The design should feel like reading a well-made blog post or a clean documentation site. The content teaches. The UI gets out of the way.
