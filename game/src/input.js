// Warung Kilat — keyboard and mouse input.
// Movement keys are polled every frame; action keys fire callbacks once per
// press. Clicking a station sets a walk target the cook follows.

export class Input {
  constructor(canvas, hooks) {
    this.hooks = hooks; // { onInteractDown, onInteractUp, onPause, onRestart, onMute, onAnyKey }
    this.keys = new Set();
    this.interactHeld = false;
    this.moveTarget = null; // {x, y} in canvas pixels, or null

    window.addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
      if (e.repeat) return;
      this.keys.add(e.key.toLowerCase());
      this.hooks.onAnyKey();
      const k = e.key.toLowerCase();
      if (k === 'e' || k === ' ') {
        this.interactHeld = true;
        this.hooks.onInteractDown();
      } else if (k === 'p') {
        this.hooks.onPause();
      } else if (k === 'r') {
        this.hooks.onRestart();
      } else if (k === 'm') {
        this.hooks.onMute();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.key.toLowerCase());
      const k = e.key.toLowerCase();
      if (k === 'e' || k === ' ') {
        this.interactHeld = false;
        this.hooks.onInteractUp();
      }
    });

    canvas.addEventListener('mousedown', (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
      const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
      this.hooks.onAnyKey();
      this.hooks.onCanvasClick(x, y);
    });

    window.addEventListener('blur', () => {
      this.keys.clear();
      this.interactHeld = false;
    });
  }

  // Direction vector from held movement keys, normalized.
  moveVector() {
    let dx = 0;
    let dy = 0;
    if (this.keys.has('a') || this.keys.has('arrowleft')) dx -= 1;
    if (this.keys.has('d') || this.keys.has('arrowright')) dx += 1;
    if (this.keys.has('w') || this.keys.has('arrowup')) dy -= 1;
    if (this.keys.has('s') || this.keys.has('arrowdown')) dy += 1;
    if (dx !== 0 || dy !== 0) this.moveTarget = null; // keys override click-walk
    const len = Math.hypot(dx, dy);
    if (len === 0) return { x: 0, y: 0 };
    return { x: dx / len, y: dy / len };
  }

  clearMoveTarget() {
    this.moveTarget = null;
  }
}
