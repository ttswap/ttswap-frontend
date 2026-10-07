---
name: "TTSwap"
description: "Existing TTSwap mint identity on a quiet, readable bilingual DeFi canvas."
colors:
  primary: "#047857"
  primary-hover: "#065f46"
  primary-active: "#064e3b"
  primary-tint: "#ecfdf5"
  selected-border: "#a7f3d0"
  paper: "#ffffff"
  canvas: "#f6f7f4"
  well: "#f3f5f4"
  ink: "#221d1d"
  muted: "#636161"
  placeholder: "#71717a"
  secondary-ink: "#3f3f46"
  hairline: "#e4e4e7"
  danger: "#b91c1c"
  warning: "#92400e"
  warning-tint: "#fffbeb"
  danger-tint: "#fef2f2"
typography:
  display:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", \"Roboto\", \"Oxygen\", \"Ubuntu\", \"Cantarell\", \"Fira Sans\", \"Droid Sans\", \"Helvetica Neue\", sans-serif"
    fontSize: "clamp(36px, 5vw, 64px)"
    fontWeight: 500
    lineHeight: 1.12
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", \"Roboto\", \"Oxygen\", \"Ubuntu\", \"Cantarell\", \"Fira Sans\", \"Droid Sans\", \"Helvetica Neue\", sans-serif"
    fontSize: "32px"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  title:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", \"Roboto\", \"Oxygen\", \"Ubuntu\", \"Cantarell\", \"Fira Sans\", \"Droid Sans\", \"Helvetica Neue\", sans-serif"
    fontSize: "20px"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "-0.025em"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", \"Roboto\", \"Oxygen\", \"Ubuntu\", \"Cantarell\", \"Fira Sans\", \"Droid Sans\", \"Helvetica Neue\", sans-serif"
    fontSize: "14px"
    lineHeight: 1.55
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", \"Roboto\", \"Oxygen\", \"Ubuntu\", \"Cantarell\", \"Fira Sans\", \"Droid Sans\", \"Helvetica Neue\", sans-serif"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: 1.4
  metric:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "32px"
    lineHeight: 1.3
rounded:
  sm: "8px"
  md: "12px"
  lg: "20px"
spacing:
  xs: "4px"
  sm: "8px"
  trade-gap: "12px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
  3xl: "64px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.paper}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
    typography: "{typography.label}"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.paper}"
    rounded: "{rounded.md}"
  button-primary-disabled:
    backgroundColor: "{colors.hairline}"
    textColor: "{colors.placeholder}"
    rounded: "{rounded.md}"
  button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.secondary-ink}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
    typography: "{typography.label}"
    height: "44px"
  button-secondary-selected:
    backgroundColor: "{colors.primary-tint}"
    textColor: "{colors.primary}"
    rounded: "{rounded.md}"
  trade-submit:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.paper}"
    rounded: "{rounded.md}"
    height: "48px"
  search-input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
    height: "48px"
  card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "24px"
  count-chip:
    backgroundColor: "{colors.primary-tint}"
    textColor: "{colors.primary}"
    rounded: "{rounded.sm}"
    padding: "2px 6px"
  nav-mobile-active:
    backgroundColor: "{colors.primary-tint}"
    textColor: "{colors.primary}"
    rounded: "{rounded.sm}"
    padding: "12px 16px"
  trade-asset-field:
    backgroundColor: "{colors.well}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "16px"
  page-state:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.muted}"
    rounded: "{rounded.lg}"
    padding: "48px 24px"
  dialog:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "24px"
---

# Design System: TTSwap

## Overview

**Creative North Star: "The Mint Ledger"**

TTSwap uses its incumbent mint identity, logo and token imagery on a quiet light canvas. Dark mint carries readable actions and selected states; white panels and restrained borders organize trading and account information. The original ledger metaphor remains: confidence comes from clear hierarchy and comparable numbers.

This document records the implemented system in app.css, trade.css and the incumbent global styles. It merges the earlier direction with actual controls, typography and responsive behavior. Existing Chinese/English copy and product workflows remain the context for the visual system.

**Key Characteristics:**
- One mint family for actions and selection.
- System sans typography with tabular figures for comparison.
- 12px controls and 20px data panels.
- Flat data surfaces; depth reserved for dialogs.
- Explicit loading, unavailable, disconnected and transaction states.

## Colors

Deep mint and pale mint selection sit against warm quiet neutrals. Frontmatter values are normative; semantic colors describe state rather than a second brand.

### Primary
- **Deep Mint**: filled actions, links, caret and keyboard outline, active navigation and progress.
- **Mint Hover / Active**: darker same-family states; the explicit active shade belongs to trade submission.
- **Mint Tint / Selected Border**: selected filters, badges, presets and highlighted permissions. The incumbent brighter mint remains in logo/assets and some legacy outline details; it is not the primary filled-action token.

### Neutral
- **Paper / Canvas**: white working surfaces on a pale page backdrop.
- **Well**: amount fields, transaction feedback and trading tabs.
- **Ink / Muted / Placeholder / Secondary Ink**: primary text, supporting copy, placeholder or disabled text and secondary action labels.
- **Hairline**: borders, separators and disabled fills.

### Semantic
- **Danger / Danger Tint**: invalid fields, failed transactions and inline errors.
- **Warning / Warning Tint**: trading cautions and unknown transaction states.

**The One Voice Rule.** Keep action and selected-state colors within the incumbent mint family; semantic warning and error colors communicate state.

## Typography

**Display / Body Font:** the installed system sans stack from the global body stylesheet; no custom Geist font is loaded. Native controls inherit the surrounding system typography.
**Label/Mono Font:** system monospace for explicit numeric/address roles and incumbent mono metrics. Trading figures use tabular numbers with the surrounding sans font.

### Hierarchy
- **Display:** home headline, medium weight, responsive size and tight tracking as recorded in frontmatter; mobile overrides are 38px, then 32px below 360px.
- **Headline:** page heading; 28px on mobile. The trade heading is a distinct compact 24px/32px role.
- **Title:** section and panel heading. Smaller subheadings use 16px/1.4.
- **Body:** operating copy; page descriptions use 15px and a 65ch limit. Home description uses 18px/1.7, dropping to 16px on mobile.
- **Label:** action labels. Helpers and metadata commonly use 13px; table headings, counts and compact chain labels use 12px.
- **Metric:** prominent comparable values; home/account metrics reduce to 24px on mobile. Sale metrics include 28px values; trade amount inputs use 32px/40px and 28px/36px on mobile.

**The Tabular Ledger Rule.** Use tabular figures for values people compare; use the system mono stack where the existing numeric and address roles call for it.

## Layout

The app content is centered at a maximum width of 1280px. Desktop page padding is 48px 32px 64px, tablet padding is 32px 24px 48px, and mobile padding is 32px 16px 48px. The separate trade page is centered at 480px, with desktop padding 32px 32px 48px and mobile padding 24px 16px 32px.

Spacing uses the small 4px step, an 8px base rhythm and the recorded 12px trading gap. Panels use 24px padding at desktop and commonly 16px at mobile. Home separates major groups with 48–64px spacing; operational groups remain denser.

Detail and sale use a flexible data column with a 440px action column, narrowing to 400px below 1280px and 380px below 1024px. Below 768px the layouts become one column, putting trade or purchase before supporting data. Home metrics change from four columns to two. Tables contain horizontal overflow and account tabs scroll within their own region.

The sticky header has a 72px desktop minimum height and 64px on mobile. Below 1024px desktop links give way to a toggle and vertical navigation. Below 360px header spacing contracts and home actions stack. Dialogs keep a viewport margin and scroll their content rather than escaping the screen.

## Elevation & Depth

White panels, neutral wells and thin borders establish depth. Cards and buttons have no elevation or hover movement. The navigation's inset line is a selected-state marker, not a floating shadow.

### Shadow Vocabulary
- **Trade dialog:** `0 16px 48px rgb(34 29 29 / .12)`.
- **App modal:** `0 16px 48px #221d1d20`.
- **Active navigation marker:** `inset 0 -2px #047857`.

**The Flat-By-Default Rule.** Data panels and buttons stay flat at rest and on hover; only floating dialogs receive the established shadow.

## Shapes

The form language uses gently rounded rectangles. Small badges and nested tabs use the small radius; controls, inputs and amount wells use the medium radius; data panels and modal shells use the large radius. Token avatars remain circular. Thin neutral borders separate data surfaces; trading cards can rely on the tonal canvas alone.

## Components

### Buttons

Primary and secondary controls share the medium radius, 44px minimum height, 10px 20px padding and medium-weight labels. Primary uses Deep Mint with white text and Mint Hover. Secondary uses Paper, Secondary Ink and a Hairline border; hover uses Canvas, selected uses Mint Tint and Selected Border. Disabled controls use neutral fills, subdued labels and a not-allowed cursor. Trading submission uses 48px minimum height, a 16px label and an explicit darker active state.

Keyboard focus uses a 2px Deep Mint outline with 3px offset. Base app buttons transition background and text color over 150ms with the CSS default ease. Trade submission has no added transition in trade.css. Existing component primitives may retain their own focus ring alongside the global outline.

### Chips

Count badges use Mint Tint, Deep Mint, the small radius and 2px 6px padding. Active sale-stage badges use 4px 8px. Selectable filters use secondary button styling; selected presets use Mint Tint and Deep Mint. Counts are data labels rather than independent actions.

### Cards / Containers

White data panels use the large radius, thin Hairline border and generally 24px padding. Mobile padding contracts where the page styles specify it. Amount and transaction wells use the medium radius and Well fill. Cards remain still on hover.

### Inputs / Fields

Search inputs use white fill, a thin Hairline border, the medium radius, 12px 16px padding and 48px minimum height. Trading token search and custom slippage fields use a stronger incumbent border. Amount inputs are borderless inside neutral wells, with large tabular figures and a mint caret. Invalid sale inputs use a Danger border. Preserve focus, disabled and error cues from the actual component; do not imply a global mint glow.

### Navigation

Desktop links use muted labels, mint hover and a mint inset marker when active. Mobile links use a tinted active row, the small radius and 44px minimum height. Account navigation is a horizontally contained tab strip with the same active underline language. Trading tabs use a neutral well with white selected tab, medium outer corners and small inner corners.

### Page states and transactions

Shared page-state panels use centered text, a concise heading, a restrained icon where appropriate and a wallet-connect or retry action. Loading uses status semantics; error uses alert semantics. Trading feedback uses neutral wells and semantic confirmed, failed or unknown colors. Separate broadcast from confirmed completion and preserve a readable transaction link.

### Dialogs and motion

Dialogs have white large-radius shells, established shadows, scrollable content and a 44px trade close target. Trade dialogs are capped at 480px with viewport margins. No entrance flourish is added to data cards. A trade waiting spinner rotates linearly over one second; reduced motion removes it. The app's reduced-motion rule removes animations and transitions; trade dialogs also suppress animation under reduced motion.

## Do's and Don'ts

### Do:
- **Do** preserve the TTSwap logo, mint identity and existing token imagery.
- **Do** use deep mint for filled actions and the darker mint hover state.
- **Do** use 12px controls and 20px panels, with visible keyboard focus.
- **Do** keep comparable numbers tabular and long addresses wrap-safe.
- **Do** retain Chinese/English layout flexibility and stack result-first workflows on mobile.
- **Do** distinguish unavailable data from true zero and broadcast transactions from confirmed results.

### Don't:
- **Don't** introduce a second decorative accent or borrowed brand assets.
- **Don't** document Geist as loaded or replace the implemented system font stack without an explicit change.
- **Don't** add hover lift, glow or rest shadows to data cards.
- **Don't** turn controls into pills or invent dark marketing bands as current system patterns.
- **Don't** substitute fabricated chart lines, metrics or success states for unavailable data.
