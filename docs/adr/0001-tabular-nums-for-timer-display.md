# 1. Anchor and Left-Align Proportional Timer Displays to Prevent Jitter

* Status: accepted
* Date: 2026-08-01

## Context

Proportional display fonts (such as Outfit or Inter) have varying horizontal widths for different digits (for example, '1' is narrower than '0'). When a ticking countdown timer is centered on the screen, these width changes cause the timer string to dynamically resize and shift horizontally on every tick (jitter). This is visually unappealing and distracts from a premium user experience.

However, using a monospace font (such as JetBrains Mono) for the large hero timer changes the desired layout and geometric display aesthetics of the user interface.

## Decision

To retain the modern geometric display font `Outfit` (`var(--font-display)`) while eliminating horizontal jitter, we will:
1. Wrap or style the timer component with a fixed width of `5.5ch` (using the character width unit `ch` so it dynamically scales with the font size).
2. Set the text alignment to `text-align: left;`.

Because the container has a constant width, it remains perfectly centered and stable in the flexbox header layout. The text inside it is anchored at the left edge of this container, meaning the left-hand characters (such as the minutes `MM:`) stay stationary, and only the right-hand characters (the seconds `SS`) shift slightly, which is far less noticeable and resolves the horizontal shaking.

## Consequences

* **Positive**: The geometric `Outfit` font is retained, keeping the premium visual identity of the app.
* **Positive**: The left side of the timer is anchored and completely stable.
* **Positive**: The layout scales cleanly across desktop and mobile screens because `ch` units are relative to the active font size.
* **Negative**: The right-hand digits (seconds) still vary slightly in width, but because the left edge is anchored, it does not translate into full-text jitter.
