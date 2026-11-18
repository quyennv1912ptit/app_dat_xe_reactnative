---
name: PtitGo Design System
description: Shared Material Design 3 and adaptive native design system powering PtitGo Customer and PtitGo Tài Xế via packages/ui.
colors:
  customer-primary: "#B3263D"
  customer-on-primary: "#FFFFFF"
  customer-primary-container: "#FFD9DF"
  customer-on-primary-container: "#400012"
  customer-primary-pressed: "#8E1830"
  customer-primary-dark: "#FFB2BF"
  customer-primary-container-dark: "#8F0038"
  customer-on-primary-dark: "#650021"
  driver-primary: "#007F46"
  driver-on-primary: "#FFFFFF"
  driver-primary-container: "#C5F0D8"
  driver-on-primary-container: "#002112"
  driver-primary-pressed: "#006638"
  driver-primary-dark: "#7ED9AA"
  driver-primary-container-dark: "#005233"
  driver-on-primary-dark: "#003820"
  secondary: "#61616B"
  secondary-container: "#E0E0E0"
  on-secondary-container: "#111111"
  tertiary: "#67507D"
  tertiary-container: "#EEDCFF"
  on-tertiary-container: "#251431"
  canvas-light: "#F3F4F6"
  surface-light: "#FFFFFF"
  surface-high-light: "#ECEEF2"
  surface-highest-light: "#E5E7EB"
  on-surface-light: "#1B1B1F"
  on-surface-variant-light: "#61616B"
  on-surface-muted-light: "#6B7280"
  outline-light: "#777680"
  outline-variant-light: "#E0E2E8"
  disabled-bg-light: "#E0E0E0"
  disabled-text-light: "#73737C"
  canvas-dark: "#121212"
  surface-dark: "#1E1E1E"
  surface-input-dark: "#242424"
  surface-high-dark: "#29292D"
  surface-highest-dark: "#333337"
  on-surface-dark: "#FFFFFF"
  on-surface-variant-dark: "#C6C5CF"
  outline-dark: "#494950"
  success: "#226A44"
  success-container: "#D0F1DC"
  on-success-container: "#002112"
  warning-container: "#FFF0CF"
  on-warning-container: "#684000"
  warning-container-dark: "#362818"
  on-warning-container-dark: "#FFDC9B"
  error: "#BA1A1A"
  error-container: "#FFDAD6"
  on-error-container: "#410002"
  error-dark: "#FFB4AB"
  ride-pickup: "#2F6BFF"
  ride-dropoff: "#F2B705"
  on-ride-dropoff: "#1B1B1F"
  offer-surface: "#1E1E1E"
  offer-accent: "#48E2A3"
  media-backdrop: "#0B0B0B"
typography:
  display:
    fontFamily: "system-sans"
    fontSize: "30px"
    fontWeight: 700
    lineHeight: "38px"
    letterSpacing: "-0.4px"
  moneyDisplay:
    fontFamily: "system-sans"
    fontSize: "28px"
    fontWeight: 700
    lineHeight: "36px"
    letterSpacing: "-0.3px"
    fontVariant: "tabular-nums"
  screenTitle:
    fontFamily: "system-sans"
    fontSize: "22px"
    fontWeight: 700
    lineHeight: "30px"
    letterSpacing: "-0.2px"
  sectionTitle:
    fontFamily: "system-sans"
    fontSize: "18px"
    fontWeight: 600
    lineHeight: "26px"
    letterSpacing: "0px"
  cardTitle:
    fontFamily: "system-sans"
    fontSize: "17px"
    fontWeight: 600
    lineHeight: "24px"
    letterSpacing: "0px"
  body:
    fontFamily: "system-sans"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: "24px"
    letterSpacing: "0px"
  bodySecondary:
    fontFamily: "system-sans"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "20px"
    letterSpacing: "0.1px"
  label:
    fontFamily: "system-sans"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: "20px"
    letterSpacing: "0.1px"
  button:
    fontFamily: "system-sans"
    fontSize: "16px"
    fontWeight: 600
    lineHeight: "22px"
    letterSpacing: "0.1px"
  badge:
    fontFamily: "system-sans"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: "18px"
    letterSpacing: "0.15px"
  navigationLabel:
    fontFamily: "system-sans"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: "18px"
    letterSpacing: "0.1px"
  caption:
    fontFamily: "system-sans"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: "18px"
    letterSpacing: "0.1px"
rounded:
  sm: "2px"
  compact: "16px"
  medium: "20px"
  card: "24px"
  sheet: "28px"
  pill: "999px"
spacing:
  xxs: "2px"
  xs: "4px"
  sm: "8px"
  px3: "12px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  main-bottom: "96px"
components:
  button-primary-customer:
    backgroundColor: "{colors.customer-primary}"
    textColor: "{colors.customer-on-primary}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "8px 24px"
    height: "48px"
  button-primary-driver:
    backgroundColor: "{colors.driver-primary}"
    textColor: "{colors.driver-on-primary}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "8px 24px"
    height: "48px"
  button-secondary:
    backgroundColor: "{colors.secondary-container}"
    textColor: "{colors.on-secondary-container}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "8px 24px"
    height: "48px"
  button-tertiary:
    backgroundColor: "{colors.tertiary-container}"
    textColor: "{colors.on-tertiary-container}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "8px 24px"
    height: "48px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.customer-primary}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "8px 24px"
    height: "48px"
  card-surface:
    backgroundColor: "{colors.surface-light}"
    textColor: "{colors.on-surface-light}"
    rounded: "{rounded.card}"
    padding: "16px"
  card-muted:
    backgroundColor: "{colors.surface-high-light}"
    textColor: "{colors.on-surface-light}"
    rounded: "{rounded.card}"
    padding: "16px"
  input-outlined:
    backgroundColor: "{colors.surface-light}"
    textColor: "{colors.on-surface-light}"
    typography: "{typography.body}"
    rounded: "{rounded.card}"
    height: "56px"
  navigation-bar:
    backgroundColor: "{colors.surface-light}"
    textColor: "{colors.on-surface-variant-light}"
    height: "80px"
    padding: "8px 8px"
---

# Design System: PtitGo Design System

## Overview

**Creative North Star: "The Confident Co-Pilot"**

The PtitGo design system unifies **PtitGo** (`apps/customer`) and **PtitGo Tài Xế** (`apps/driver`) around calm, sunlit clarity and decisive, one-handed control. Every interface behaves like a dependable co-pilot at dusk or midday: neutral cool-stone canvases stay quiet, high-contrast ink carries addresses and VND fares effortlessly, and brand color is reserved strictly to signal the active role—**Coral Crimson** for customer trip requests and **Deep Emerald** for driver readiness and verification.

Rather than relying on drop shadows or heavy boxes to separate information, PtitGo builds clear visual hierarchy exclusively through flat tonal surface steps, generous generous touch geometry, and strict Material Design 3 + Apple HIG platform respect.

**Key Characteristics:**
- **Dual-Brand, Single System:** Shared primitives, spacing, shapes, and semantic role names via `@datxe/ui`, swapping only the active `brand` token family (`customer` vs `driver`) across `light` and `dark` appearances.
- **Borderless Tonal Layering:** Cards and action containers sit flat (`mode="contained"`, zero drop shadows, zero decorative borders), separated solely by contrast between `#F3F4F6` canvas and `#FFFFFF` surfaces in light mode (`#121212` and `#1E1E1E` in dark mode).
- **Outdoor-Ready Legibility & Touch Ergonomics:** Both `@datxe/ui` primitives and React Native Paper's `createMaterialTheme` share the same 12 semantic typography roles (`display`..`caption`) built around `16px/24px` readable body, generous Vietnamese diacritic line heights, minimum `48dp` primary touch buttons, `tabular-nums` on fares and timers, and full OS `fontScale` respect.

## Colors

One neutral tonal backbone supports two strictly separated brand accents and high-contrast functional feedback tones, verified against WCAG 2.2 AA contrast thresholds in `tests/theme.test.cjs`.

### Primary
- **Coral Crimson** (`customer-primary` / `#B3263D`, pressed `#8E1830`, dark mode `#FFB2BF`): Customer primary CTAs, active booking destination emphasis, and customer brand links. Paired with **Coral Tint Container** (`#FFD9DF` / `#8F0038` dark) and deep berry ink (`#400012` / `#FFD9DF` dark) on highlighted destination cards and tonal navigation pills.
- **Deep Emerald** (`driver-primary` / `#007F46`, pressed `#006638`, dark mode `#7ED9AA`): Driver readiness toggles, eKYC camera shutter, verification approval states, and primary driver workflow CTAs. Paired with **Mint Container** (`#C5F0D8` / `#005233` dark) and forest ink (`#002112` / `#C5F0D8` dark).

### Secondary
- **Graphite Slate** (`secondary` / `#61616B` light, `#C6C5CF` dark): Supporting UI controls and secondary actions paired with **Soft Ash Container** (`#E0E0E0` light, `#333337` dark) for `Button variant="secondary"`.

### Tertiary
- **Muted Plum** (`tertiary` / `#67507D` light, `#D4BCEB` dark) with **Lavender Mist Container** (`#EEDCFF` light, `#513F60` dark): Used sparingly for tertiary actions (`Button variant="tertiary"`) and subtle non-competing tags.

### Neutral & Functional
- **Cool Stone Canvas** (`canvas-light` / `#F3F4F6`, `canvas-dark` / `#121212`): Root background behind cards and sheets.
- **Crisp Porcelain Surface** (`surface-light` / `#FFFFFF`, `surface-dark` / `#1E1E1E`): Primary `Card`, header, bottom sheet, and navigation bar backgrounds.
- **Tonal Steps** (`surface-high-light` / `#ECEEF2`, `surface-highest-light` / `#E5E7EB`; `surface-input-dark` / `#242424`, `surface-high-dark` / `#29292D`, `surface-highest-dark` / `#333337`): Quiet grouped fields, disabled states, and muted cards.
- **Deep Charcoal Ink** (`on-surface-light` / `#1B1B1F`, `on-surface-dark` / `#FFFFFF`) and **Muted Slate Ink** (`on-surface-variant-light` / `#61616B`, `on-surface-variant-dark` / `#C6C5CF`): Minimum `4.5:1` contrast for primary body copy and `>= 3:1` for supporting labels.
- **Semantic States:**
  - **Success (`#226A44` / `#D0F1DC`):** Verified eKYC checks, approved badges, completed cash confirmation.
  - **Warning (`#FFF0CF` container / `#684000` ink; `#362818` / `#FFDC9B` dark):** Quality advisories, incomplete OCR hints, review warnings. Always pair container background with its matching `onWarningContainer` text token—never use `warningContainer` as foreground text on dark backdrops.
  - **Error (`#BA1A1A` / `#FFDAD6` / `#410002` ink; `#FFB4AB` / `#93000A` dark):** Blocking errors, expired documents, network failures.
  - **Route Pin Signals:** `ridePickup` (`#2F6BFF` with white icon) and `rideDropoff` (`#F2B705` paired with dark `onRideDropoff` `#1B1B1F` ink—never white ink on yellow).
  - **Driver Offer Always-Dark Surface (`offerPalette`):** `#121212` canvas, `#1E1E1E` surface, `#FAFAFA` text, `#086A4C` / `#48E2A3` accept/active cues, `#FF838B` countdown urgency.

**The Single-Brand Accent Rule.** Customer screens never import Driver emerald primary tokens for main CTAs, and Driver screens never expose Customer crimson—both apps consume the same semantic `colors.primary` token resolved by `ThemeProvider brand`.

**The Token-Only Contrast Rule.** Raw hex literals and `rgba(...)` strings are forbidden in app screens and non-theme components (`tests/theme.test.cjs`); all foreground/background pairs must come from `useThemeColors()` so Light and Dark modes stay contrast-safe.

## Typography

**Unified Platform Sans Family:** One native system sans font per OS—`sans-serif` on Android (Roboto), `System` on iOS (SF Pro), and `Roboto, Arial, sans-serif` on Web—configured centrally in `packages/ui/src/theme/colors.ts` (`fontFamily.system`).
**Label/Mono Treatment:** Same clean sans family with `fontVariant: ['tabular-nums']` strictly applied to `moneyDisplay`, VND fares, wallet balances, distances, and offer countdowns so digits never jitter.

**Character & Hierarchy Rules:** Crisp hierarchy using semantic roles rather than ad-hoc `fontSize`/`fontWeight` tweaks (`700` bold capped at display/title/fare anchors; zero `800` weights). Every app screen in `apps/customer` and `apps/driver` consumes ONLY the 12 semantic tokens from `@datxe/ui` (`typography.<role>` or `<Typography variant="...">`), and `createMaterialTheme` binds Paper MD3 slots 1:1 to those same tokens so headings, buttons, inputs, chips, badges, and lists match natively across both apps without double-scaling.

### 12 Semantic Roles (`packages/ui/src/theme/colors.ts`)
- **`display`** (`30px` / `38px` line-height, `700`, `-0.4px`): Onboarding headlines, primary hero figures.
- **`moneyDisplay`** (`28px` / `36px` line-height, `700`, `-0.3px`, `tabular-nums`): Wallet balance, quoted fare, completed receipt total.
- **`screenTitle`** (`22px` / `30px` line-height, `700`, `-0.2px`): Page headers (`ScreenHeader`, `DriverPage`, inspection metrics).
- **`sectionTitle`** (`18px` / `26px` line-height, `600`, `0px`): Section headings (`SectionHeading`, offer/route block headers).
- **`cardTitle`** (`17px` / `24px` line-height, `600`, `0px`): Card titles, driver/vehicle/customer names, active pickers.
- **`body`** (`16px` / `24px` line-height, `400`, `0px`): Primary copy, route addresses, chat messages, legal prose, text inputs.
- **`bodySecondary`** (`14px` / `20px` line-height, `400`, `0.1px`): Supporting copy, hints, alert/empty-state explanations.
- **`label`** (`14px` / `20px` line-height, `600`, `0.1px`): Form field labels, filter chips, row metadata keys, inline links.
- **`button`** (`16px` / `22px` line-height, `600`, `0.1px`): Primary, secondary, tertiary, and ghost CTA labels.
- **`badge`** (`13px` / `18px` line-height, `600`, `0.15px`): Status pills, count badges, verification/trip tags.
- **`navigationLabel`** (`13px` / `18px` line-height, `600`, `0.1px`): `TonalNavigationBar` tab labels and labeled header actions.
- **`caption`** (`13px` / `18px` line-height, `500`, `0.1px`): Timestamps, subtle disclaimers, auxiliary metadata.

**The Wrap-Before-Shrink & Full-Scale Rule.** Long Vietnamese street addresses, alley numbers (`ngõ`/`ngách`), driver names, and user emails must wrap gracefully (`flexShrink: 1`, `minWidth: 0`) rather than clipping or shrinking font sizes. Never set `allowFontScaling={false}`, blanket `maxFontSizeMultiplier`, or `adjustsFontSizeToFit`.

## Layout

Screens follow a single-column vertical rhythm tailored to `360dp+` phones with safe-area awareness (`ScreenWrapper`, `useSafeAreaInsets`), leaving breathing room on tablets (`marginTablet: 24dp`, `formMaxWidth: 512dp`, `modalMaxWidth: 384dp`).

- **Screen Padding & Gutters:** Standard mobile page padding and vertical/horizontal card rhythm use `16px` (`spacing.md`), with `8px` (`spacing.sm`) inner chip/button spacing and `24px` (`spacing.lg`) section separation.
- **Navigation Shell:** Fixed top header height (`64px`) with single leading back action; bottom `TonalNavigationBar` (`minHeight: 80px`, `4` primary tabs per app) paired with `mainBottomPadding` (`96px`) so scrollable actions never sit behind the tab bar or gesture home bar.
- **Map Sheet Shell (`MapSheetLayout`):** Three-snap `@gorhom/bottom-sheet` (`collapsed` = handle `48px` + pinned footer height, `middle` = `52%` viewport, `expanded` = viewport minus `topInset`), keeping the footer CTA pinned above both the safe-area inset and on-screen keyboard.

## Elevation & Depth

This design system is **strictly flat and tonal by default — no shadows anywhere at rest**. `Card` renders via React Native Paper `mode="contained"`, and `tests/material-design.test.cjs` mechanically forbids `shadowColor`, `shadowOffset`, `shadowOpacity`, `shadowRadius`, `elevation`, and `boxShadow` across `apps/*` and `packages/ui/src`.

Depth and separation are conveyed by stepping between `canvas` (`#F3F4F6` / `#121212`), `cardSurface` (`#FFFFFF` / `#1E1E1E`), and `surfaceContainerHigh` (`#ECEEF2` / `#29292D`), plus opaque modal scrims (`scrim60`, `scrim70`, `mediaViewerBackground` `#0B0B0B`) during photo/camera inspection.

- **Single Approved Elevation Exception:** The Customer Home destination search/booking bar in `apps/customer/src/features/booking/components/homeStyles.ts` is the sole permitted elevated/bordered anchor over live map content.

**The Flat-By-Default Rule.** Never add drop shadows or `mode="elevated"` cards to create visual separation; reach for tonal surface stepping (`cardSurface` over `background`, or `surfaceContainerHigh` insets inside cards) instead.

## Shapes

PtitGo uses friendly, generously rounded geometry that feels approachable yet structurally disciplined across touch targets and camera guides:

- **Default Cards & Outlined Inputs (`24px`):** `Card` defaults to `24px` (`borderRadius.default`), `Input` outlines use `24px`, and `GroupedList` rows follow `24px` container clipping. Compact sub-cards may step down cleanly to `16px` or `20px`.
- **Bottom Sheets (`28px`):** `MapSheetLayout` and modal bottom sheets use `28px` top corner radii with a centered `40px × 4px` grab handle (`sheetHandleWidth` / `sheetHandleHeight`).
- **Full-Pill Actions & Chips (`999px`):** All primary, secondary, tertiary, and ghost `Button` frames, tip pills, status badges, and navigation tab touch areas use `999px` full pill rounding (`borderlessFrame`).
- **Verification Alignment Frames (`ID-1` Portrait & Oval):** `GuidedCaptureScreen` draws crisp `4px`-thick `View` corner brackets in a vertical `54 : 85.6` ID-1 rectangle for CCCD/GPLX and a stroked `ovalRing` for front-camera selfies, keeping outer masks dark (`scrim70`) without adding decorative borders to regular UI cards.

**The Borderless Container Rule.** Regular cards, buttons, badges, and list items never carry decorative strokes (`borderWidth: 0` via `borderlessFrame`). Hairline outlines (`1px` or functional strokes) are permitted only in `tests/material-design.test.cjs`'s `functionalOutlines` allowlist (text inputs, OTP cells, map route connectors, Customer Home wallet card, and camera alignment guides).

## Components

Every screen composes from `@datxe/ui` primitives rather than redefining bespoke wrappers:

### Buttons
- **Shape:** Full pill (`999px` radius), borderless (`borderlessFrame`), minimum `48px` height (`content.minHeight`), `8px 24px` internal padding, `8px` icon-to-label gap.
- **Primary:** Solid `colors.primary` background (`#B3263D` Customer / `#007F46` Driver) with `colors.onPrimary` (`#FFFFFF`) text; displays an inline `ActivityIndicator` when `loading` or disables cleanly to `colors.disabled` (`#E0E0E0`) with `colors.disabledText` (`#73737C`).
- **Secondary / Tertiary / Ghost:** `Secondary` uses `secondaryContainer` / `onSecondaryContainer`; `Tertiary` uses `tertiaryContainer` / `onTertiaryContainer`; `Ghost` uses transparent fill with `colors.primary` label.

### Cards / Containers
- **Corner Style:** `24px` default (`16px` or `20px` optional for compact tiles).
- **Background:** `colors.cardSurface` (`surface` / `raised` variants — both flat tonal) or `colors.surfaceContainerHigh` (`muted` variant).
- **Internal Padding:** Minimum `16px` (`contentInset` clamps numeric padding >= `16`).
- **Grouped Rows (`GroupedList` & `SettingsListItem`):** Single `24px` tonal card dividing sequential `>= 56px`-tall rows with `1px` `colors.outlineVariant` dividers instead of stacking separate bordered boxes per row.

### Inputs / Fields
- **Style:** `Input` (Paper `mode="outlined"`, `56px` minHeight, `24px` radius, `colors.inputSurface` fill) for standalone auth/form fields; `ThemedTextInput` / `NativeDraftTextInput` (`48px` height, `bodyLg` `18px`) for IME-safe Vietnamese typing that leaves composing text intact.
- **States:** Focus and selection tint draw from `colors.primary`; OTP inputs use `OtpCodeInput` 6-cell rectangular boxes; password fields include an accessible visibility toggle (`Hiện hoặc ẩn mật khẩu`).

### Navigation
- **Top Header & Back Navigation:** Consistent leading back button (`>= 44×44` / `48×48` touch target) honoring Android system Back and iOS edge-swipe back (`gestureEnabled: true` in `useScreenMotion`).
- **Bottom Tab Bar (`TonalNavigationBar`):** `80px` minHeight horizontal bar (`4` destinations per app: Trang chủ, Lịch sử, Thông báo, Hồ sơ), active `64px × 32px` pill indicator (`primaryContainer` in `tonal` mode, `primary` text/icon in `flat` mode), unread badge integrated into `accessibilityLabel` (e.g. `"Thông báo, 3 chưa đọc"`).

### Motion & Feedback States
- **Motion (`MotionPressable` & `useScreenMotion`):** Micro-scale press feedback (`0.98` scale over `90ms` in, `160ms` cubic out) and OS-native stack transitions (`default` on iOS, `fade_from_bottom` on Android); automatically collapses to instant/no-scale (`'none'`) when `useReducedMotion()` is active.
- **Mandatory 5 Operational States:**
  - **Loading:** Inline spinners (`ActivityIndicator` with `colors.primary`) or layout-matching placeholders that preserve screen headers and back navigation.
  - **Empty:** Honest plain-language explanation plus a contextual recovery button (e.g., *Thêm xe*, *Về trang chủ*).
  - **Error:** Distinct error vs missing-context messaging in `errorContainer` / `onErrorContainer` with retry/recovery actions that never wipe previously valid state.
  - **Success:** Verified confirmation banners in `successContainer` / `onSuccessContainer` backed by actual backend confirmation.
  - **Disabled:** Visually distinct `disabled` fill (`dimWhenDisabled`) plus inline human-readable explanation nearby whenever a critical CTA (booking, eKYC submit, ride reception) is blocked.

## Do's and Don'ts

### Do:
- **Do** consume all colors, spacing, typography, and radii through `useThemeColors()`, `useThemedStyles()`, and `@datxe/ui` primitives (`Button`, `Card`, `Typography`, `Input`, `ThemedTextInput`, `ScreenWrapper`).
- **Do** preserve flat tonal hierarchy (`cardSurface` over `background`) and zero-border containers (`borderlessFrame`) across both Light and Dark themes.
- **Do** enforce `>= 48×48 dp` (Android) / `>= 44×44 pt` (iOS) interactive touch targets, full safe-area insets (`ScreenWrapper` / `useSafeAreaInsets`), and dynamic font wrapping for long Vietnamese addresses, names, and emails.
- **Do** use `fontVariant: ['tabular-nums']` for VND prices, wallet balances, distances, and driver offer countdowns.
- **Do** test and maintain every state (`loading`, `empty`, `error`, `success`, `disabled`) and respect `useReducedMotion()`.

### Don't:
- **Don't** introduce raw hex/`rgb()`/`rgba()` literals inside `apps/*/src/**` or non-theme UI files (`tests/theme.test.cjs` enforces this).
- **Don't** add `shadowColor`, `shadowOpacity`, `elevation`, `boxShadow`, or `Card mode="elevated"` outside the single approved Customer Home search exception (`homeStyles.ts`).
- **Don't** add decorative `borderWidth` to buttons, badges, or cards outside `functionalOutlines` in `tests/material-design.test.cjs`.
- **Don't** use white text/icons on `rideDropoff` (`#F2B705`) yellow badges (`1.8:1` failure—use dark `onRideDropoff` `#1B1B1F`), or `warningContainer` as dark-mode text color.
- **Don't** shrink critical addresses, prices, or emails with `adjustsFontSizeToFit` or `numberOfLines={1}` where full decision context is needed.
- **Chống cắt chữ bắt buộc:** Không được cắt chữ của trạng thái nghiệp vụ, số tiền và các thông tin quan trọng. Component phải thích ứng với nội dung dài, màn hình nhỏ và font scaling.
