# Frontend Agent Rules

## Verify After Changes
- RULE-V1: After modifying React/CSS files, run the dev server and check the browser console for errors.

## Component Architecture
- RULE-C1: One responsibility per component. Modals → own file. Lists → own file.
- RULE-C2: Never drill CSS module `styles` as props. Each component imports its own `.module.css`.
- RULE-C3: All modals must use `<Modal>` from `src/components/ui/Modal.jsx`.
- RULE-C4: Never use inline `style={{}}`. Use CSS module classes.
- RULE-C5: Use `crypto.randomUUID()` for IDs, never `Math.random()`.

## Icons (Show, Don't Tell)
- RULE-D1: Never inline SVG. Import from `src/components/ui/Icons.jsx`.

```jsx
// ✅ DO THIS:
import { TrashIcon, SettingsIcon } from '../ui/Icons';
<button><TrashIcon /></button>

// ❌ NEVER THIS:
<button><svg fill="none" height="24" ...>...</svg></button>
```

## Styling
- RULE-S1: `src/styles.css` is ONLY for CSS custom properties, resets, and grid layout.
- RULE-S2: All component styles → co-located `.module.css` files.
- RULE-S3: Follow [DESIGN.md](../DESIGN.md) — Ignition Orange accents, Terminal Green success, pill buttons.

## Where to Put New Code
- New component → `src/components/` + co-located `.module.css`
- New icon → add named export to `src/components/ui/Icons.jsx`
- New modal → own component file using `<Modal>` wrapper
- New hook → `src/hooks/`
- New utility → check `src/utils/` first, add there if new
