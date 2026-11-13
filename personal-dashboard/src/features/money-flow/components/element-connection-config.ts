/** Tweak these values to style every canvas connection. No CSS edits needed. */
export const ELEMENT_CONNECTION_CONFIG = {
  // Seconds for an arrowhead to travel the full connection. Lower = faster.
  durationSeconds: 3,
  reducedMotionDurationSeconds: 8,

  // Whole number per connection; 0 hides moving arrows. Spacing is automatic.
  arrowCount: 5,
  // Graph-space size: arrows scale with the canvas zoom.
  arrowSize: 8,
  arrowStrokeWidth: 2,
  // Opacity values range from 0 (invisible) to 1 (fully visible).
  arrowOpacity: 0.9,

  lineWidth: 1.5,
  lineOpacity: 0.5,
  endArrowSize: 7,

  // CSS colors or theme variables; defaults match each element's handle.
  colors: {
    chequing: "var(--foreground)",
    income: "var(--color-emerald-500)",
    expense: "var(--color-rose-500)",
    account: "var(--color-sky-500)",
  },
} as const;

// SVG markers scale with the edge stroke. Leave room for the whole arrowhead.
export const END_ARROW_CLEARANCE =
  ELEMENT_CONNECTION_CONFIG.endArrowSize * ELEMENT_CONNECTION_CONFIG.lineWidth +
  2;
