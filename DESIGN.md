---
name: Obsidian Kinetic
colors:
  surface: '#121414'
  surface-dim: '#121414'
  surface-bright: '#383939'
  surface-container-lowest: '#0d0e0f'
  surface-container-low: '#1b1c1c'
  surface-container: '#1f2020'
  surface-container-high: '#292a2a'
  surface-container-highest: '#343535'
  on-surface: '#e3e2e2'
  on-surface-variant: '#e4beb1'
  inverse-surface: '#e3e2e2'
  inverse-on-surface: '#303031'
  outline: '#ab897d'
  outline-variant: '#5b4137'
  surface-tint: '#ffb59a'
  primary: '#ffb59a'
  on-primary: '#5a1b00'
  primary-container: '#ff5c00'
  on-primary-container: '#521800'
  inverse-primary: '#a73a00'
  secondary: '#c8c6c5'
  on-secondary: '#313030'
  secondary-container: '#4a4949'
  on-secondary-container: '#bab8b7'
  tertiary: '#00e639'
  on-tertiary: '#003907'
  tertiary-container: '#00aa28'
  on-tertiary-container: '#003406'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdbce'
  primary-fixed-dim: '#ffb59a'
  on-primary-fixed: '#370e00'
  on-primary-fixed-variant: '#802a00'
  secondary-fixed: '#e5e2e1'
  secondary-fixed-dim: '#c8c6c5'
  on-secondary-fixed: '#1c1b1b'
  on-secondary-fixed-variant: '#474646'
  tertiary-fixed: '#72ff70'
  tertiary-fixed-dim: '#00e639'
  on-tertiary-fixed: '#002203'
  on-tertiary-fixed-variant: '#00530e'
  background: '#121414'
  on-background: '#e3e2e2'
  surface-variant: '#343535'
typography:
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 32px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: '0'
  body-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: '0'
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
  container-max: 1440px
---

## Brand & Style

The brand personality is high-performance, technical, and uncompromising. Designed for developers and engineers who demand precision, the UI evokes a sense of deep focus and "flow state." The aesthetic is a refined **Minimalism** blended with **Corporate/Modern** precision, utilizing a "Dark Mode First" philosophy. 

The emotional response should be one of absolute control and mechanical reliability. Visuals are crisp, high-contrast, and utilitarian, prioritizing information density without sacrificing clarity.

## Colors

This design system utilizes a "Blvck" foundational palette to maximize contrast and reduce eye strain during long technical sessions.

- **Primary (Ignition Orange):** Used for critical actions, active states, and brand-driven focal points.
- **Secondary (Obsidian):** The core background surface, providing a deep, non-reflective base.
- **Tertiary (Terminal Green):** A high-vibrancy, technical green reserved for success states, telemetry data, and progress indicators. It represents "system healthy" status.
- **Neutrals:** A range of desaturated charcoals and greys for borders, secondary text, and inactive iconography.

## Typography

The typographic system is built on **Geist** for its clean, technical sans-serif geometry and **JetBrains Mono** for functional metadata.

- **Headlines:** Use Geist with tight letter spacing for a compact, engineered look.
- **Body:** Geist provides maximum readability for documentation and logs.
- **Labels/Code:** JetBrains Mono is used for all "Terminal Green" outputs, status labels, and numerical data to reinforce the developer-centric environment.

## Layout & Spacing

This design system uses a strict **8px grid system** (with a 4px baseline) to ensure mathematical alignment across all components.

- **Fluid Grid:** Content follows a 12-column fluid grid on desktop, transitioning to a 4-column grid on mobile.
- **Density:** High information density is preferred. Use 8px (`unit * 2`) for internal component padding and 16px (`unit * 4`) for spacing between related layout blocks.
- **Alignment:** All technical data points should be top-left aligned to mirror terminal logic.

## Elevation & Depth

Hierarchy is achieved through **Tonal Layers** and **Low-Contrast Outlines** rather than traditional shadows.

- **Surfaces:** Use `secondary_color_hex` for the base layer. Elevate panels using slightly lighter shades of charcoal (e.g., #1A1A1A) to create a "stacked" effect.
- **Borders:** Instead of shadows, use 1px solid borders in a low-opacity neutral (e.g., 10% white) to define component boundaries.
- **Interaction:** Active elements may use a subtle outer glow of the `primary_color_hex` or `tertiary_color_hex` (Terminal Green) to simulate a powered-on LED state.

## Shapes

The shape language is "Pill-shaped" and approachable, contrasting with the technical nature of the content. This high level of rounding provides a distinct, modern silhouette that softens the high-contrast aesthetic.

- **Buttons & Inputs:** Use a generous `1rem` base radius to create a pill-like appearance.
- **Status Pills:** Utilize `rounded-xl` (3rem) for fully circular ends.
- **Containers:** Large layout containers follow the `rounded-lg` (2rem) specification to maintain consistency with the rounded theme.

## Components

- **Buttons (Primary):** Solid `primary_color_hex` (Orange) with black text. High visibility for "Execute" or "Deploy" actions. Utilizes pill-shaped geometry.
- **Buttons (Functional):** Ghost style with `tertiary_color_hex` (Green) borders and text for non-destructive, positive actions.
- **Progress Indicators:** Use the Terminal Green for progress bars and successful "Check" states.
- **Inputs:** Deep obsidian backgrounds with a 1px neutral border. The border shifts to Ignition Orange on focus. Rounded corners follow the pill-shaped theme.
- **Chips/Status:** Small JetBrains Mono labels. "Online" or "Success" chips use a Green background with 10% opacity and solid Green text, fully rounded.
- **Cards:** No shadow. Use a 1px stroke border and a slightly elevated surface color, with significant corner rounding to distinguish them from the background.
- **Code Blocks:** Monospaced font with syntax highlighting. Maintain structural alignment while allowing the container to follow the system's rounded corners.
