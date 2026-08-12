### CSS Modules Architecture

* Component styles live beside the component (`Component.module.css`).
* Global CSS is only for resets, fonts, and design tokens (`tokens.css`).
* Never duplicate colors, spacing, radius, shadows, or typography; use CSS variables.
* Extract any style pattern used in 3+ places into a shared module (`utilities.module.css`, `surfaces.module.css`, `forms.module.css`, etc.).
* Reuse shared styles with `composes`; do not copy declarations between modules.
* Keep selectors shallow (single-class selectors preferred).
* Name shared classes by intent (`card`, `panel`, `buttonBase`, `inputField`, `flexCenter`), not implementation (`mt12`, `blueBox`).
* Component modules should contain only behavior or appearance unique to that component.
* If a module exceeds ~200-250 lines, split the component or extract shared styles.
