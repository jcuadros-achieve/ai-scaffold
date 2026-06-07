# Accessibility rules

> Optional module — relevant to projects with a user-facing UI. Run `ai-init` to
> align with the project's framework and target WCAG level.

An interface that excludes users with disabilities is broken, not "missing a
nice-to-have". Build for assistive technology from the start.

## Structure & semantics

- Use **semantic HTML** (`button`, `nav`, `main`, `label`, headings in order).
  A `div` with a click handler is not a button.
- Every form control has an associated `label`. Every image has meaningful `alt`
  (empty `alt=""` for decorative).
- ARIA only when semantics can't express it — and correctly. Wrong ARIA is worse
  than none.

## Interaction

- **Fully keyboard operable.** Every interactive element is reachable and usable
  with Tab/Enter/Esc; focus order is logical; focus is visible.
- Manage focus on route changes, dialogs, and dynamically revealed content.
- Don't trap focus except intentionally (modals), and release it on close.

## Perception

- Color contrast meets the target level (WCAG AA: 4.5:1 text). Never convey
  meaning by color alone.
- Respect `prefers-reduced-motion`; don't auto-play motion that can't be paused.
- Content reflows and remains usable at 200% zoom and on small viewports.

## Verify

- Test with a keyboard only and with a screen reader on critical flows. Run an
  automated checker (axe, Lighthouse) — but treat it as a floor, not proof.

> Run ai-init to record the UI framework, target WCAG level, and a11y tooling.
