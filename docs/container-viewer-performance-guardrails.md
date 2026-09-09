# Container viewer performance guardrails

The container workspace must keep one `THREE.WebGLRenderer` and one `OrbitControls`
instance alive for the lifetime of a calculated scene. A September 2026 regression
caused the canvas to be repeatedly destroyed and recreated because inline parent
callbacks became dependencies of the scene setup effect. The visible symptoms were
one-frame hover outlines, dropped grab cursors, intermittent wheel zoom, and camera
jumps several seconds after a drag.

Keep these invariants when changing the viewer:

- Store changing parent callbacks in refs. Never add callback identities to the
  Three.js setup effect dependencies.
- UI-only state such as sidebar visibility, hover details, open panels, and camera
  composition must update the existing scene through `sceneRef`; it must not rebuild
  the scene.
- Render on demand through the one-frame `requestAnimationFrame` scheduler. Do not
  add a permanent animation loop for a static planning scene.
- Keep `OrbitControls` as the sole camera gesture owner. Do not duplicate orbit or
  wheel handling in React.
- Pointer-move handlers may update React state only when the hovered cargo index
  actually changes.
- Any short UI transition must be bounded and cancel its animation frame during
  cleanup.
- Preserve the end-to-end assertions that hover and sidebar folding leave the
  original canvas connected.

Graphics, rulers, docks, and labels should remain lightweight world-space geometry.
They may rotate with the scene, but must not introduce React-driven frame updates.
