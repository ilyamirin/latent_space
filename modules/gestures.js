const SWIPE_THRESHOLD = 84;
const TAP_DISTANCE = 10;
const TAP_TIME = 260;


export function attachDeckGestures(node, callbacks) {
  let pointerId = null;
  let startX = 0;
  let startY = 0;
  let startTime = 0;
  let active = false;

  function onPointerDown(event) {
    if (event.button !== 0 && event.pointerType === "mouse") {
      return;
    }
    if (event.target instanceof Element && event.target.closest("button, input, a")) {
      return;
    }
    active = true;
    pointerId = event.pointerId;
    startX = event.clientX;
    startY = event.clientY;
    startTime = performance.now();
    node.setPointerCapture(pointerId);
  }

  function onPointerMove(event) {
    if (!active || event.pointerId !== pointerId) {
      return;
    }
    const deltaX = event.clientX - startX;
    const deltaY = event.clientY - startY;
    if (Math.abs(deltaY) > Math.abs(deltaX) * 1.25) {
      cleanupPointer(event.pointerId);
      callbacks.onCancel?.();
      return;
    }
    callbacks.onDrag?.({
      deltaX,
      deltaY,
      progress: Math.min(Math.abs(deltaX) / SWIPE_THRESHOLD, 1),
    });
  }

  function onPointerUp(event) {
    if (!active || event.pointerId !== pointerId) {
      return;
    }
    const deltaX = event.clientX - startX;
    const deltaY = event.clientY - startY;
    const elapsed = performance.now() - startTime;
    cleanupPointer(event.pointerId);

    if (
      Math.abs(deltaX) <= TAP_DISTANCE &&
      Math.abs(deltaY) <= TAP_DISTANCE &&
      elapsed <= TAP_TIME
    ) {
      callbacks.onTap?.();
      return;
    }

    if (Math.abs(deltaX) >= SWIPE_THRESHOLD) {
      callbacks.onSwipe?.(deltaX > 0 ? 1 : -1);
      return;
    }

    callbacks.onCancel?.();
  }

  function onPointerCancel(event) {
    if (!active || event.pointerId !== pointerId) {
      return;
    }
    cleanupPointer(event.pointerId);
    callbacks.onCancel?.();
  }

  function cleanupPointer(currentPointerId) {
    try {
      node.releasePointerCapture(currentPointerId);
    } catch (_error) {
      // Ignore capture mismatch on rapid interactions.
    }
    active = false;
    pointerId = null;
  }

  node.addEventListener("pointerdown", onPointerDown);
  node.addEventListener("pointermove", onPointerMove);
  node.addEventListener("pointerup", onPointerUp);
  node.addEventListener("pointercancel", onPointerCancel);

  return () => {
    node.removeEventListener("pointerdown", onPointerDown);
    node.removeEventListener("pointermove", onPointerMove);
    node.removeEventListener("pointerup", onPointerUp);
    node.removeEventListener("pointercancel", onPointerCancel);
  };
}
