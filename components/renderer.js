import { WebGLRenderer } from "three";

let shared = null;
let disposeTimer = null;

export function acquireRenderer() {
  // cancel pending disposal if someone wants it again
  if (disposeTimer) {
    clearTimeout(disposeTimer);
    disposeTimer = null;
  }

  if (!shared) {
    const renderer = new WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    shared = {
      renderer,
      canvas: renderer.domElement,
      refs: 0,
    };
  }

  shared.refs += 1;
  return shared;
}

export function releaseRenderer() {
  if (!shared) return;

  shared.refs -= 1;

  if (shared.refs <= 0) {
    // Don’t dispose immediately; give the app a moment to re-acquire
    disposeTimer = setTimeout(() => {
      // someone re-acquired meanwhile
      if (!shared || shared.refs > 0) return;

      try {
        shared.renderer.renderLists?.dispose?.();
        shared.renderer.dispose();
      } finally {
        shared = null;
        disposeTimer = null;
      }
    }, 250); // 150–500ms is the usual sweet spot
  }
}
