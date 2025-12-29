// threeHostRegistry.js
import { acquireRenderer, releaseRenderer } from "./renderer.js";

const PRIORITY = {
  menu: 0,
  drawer: 1,
  modal: 2,
  default: 0,
};

let owner = null; // string | null
const hosts = new Map(); // key -> HTMLElement

const ownerEvents = new EventTarget();

function emitOwnerChange() {
  ownerEvents.dispatchEvent(new CustomEvent("ownerchange", { detail: owner }));
}

export function onThreeOwnerChange(cb) {
  const handler = (e) => cb(e.detail);
  ownerEvents.addEventListener("ownerchange", handler);
  return () => ownerEvents.removeEventListener("ownerchange", handler);
}

export function getThreeCanvasOwner() {
  return owner;
}

export function claimThreeCanvas(key, { force = false } = {}) {
  if (!key) return false;

  if (!owner) {
    owner = key;
    emitOwnerChange();
    return true;
  }

  if (owner === key) return true;

  const curP = PRIORITY[owner] ?? 0;
  const nextP = PRIORITY[key] ?? 0;

  if (force || nextP >= curP) {
    owner = key;
    emitOwnerChange();
    return true;
  }

  return false;
}

export function releaseThreeCanvas(key) {
  if (owner === key) {
    owner = null;
    emitOwnerChange();
  }
}

export function registerThreeHost(key, el) {
  if (!key || !el) return;
  hosts.set(key, el);
}

export function unregisterThreeHost(key) {
  hosts.delete(key);
}

// Optional helper — keeps behavior you had, but now emits no ownership changes.
// It just moves the canvas to a known host.
export function attachSharedCanvas({ preferKey } = {}) {
  const { canvas } = acquireRenderer();
  try {
    const target =
      (preferKey && hosts.get(preferKey)) ||
      (owner && hosts.get(owner)) ||
      hosts.get("drawer") ||
      [...hosts.values()][0];

    if (!target) return false;

    if (canvas.parentElement !== target) {
      canvas.parentElement?.removeChild(canvas);
      target.appendChild(canvas);
    }
    return true;
  } finally {
    releaseRenderer();
  }
}
