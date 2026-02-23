import type { Camera, RectShape, WorldPoint } from "./types";

export const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

export const screenToWorld = (opts: {
  clientX: number;
  clientY: number;
  canvasRect: DOMRect;
  camera: Camera;
  dpr: number;
}): WorldPoint => {
  const { clientX, clientY, camera, canvasRect, dpr } = opts;

  // client -> canvas CSS px
  const sxCss = clientX - canvasRect.left;
  const syCss = clientY - canvasRect.top;

  // css px -> device px
  const sx = sxCss * dpr;
  const sy = syCss * dpr;

  // inverse transform: (world * zoom + pan) => screen
  const x = (sx - camera.panX) / camera.zoom;
  const y = (sy - camera.panY) / camera.zoom;
  return { x, y };
};

export const rectContainsPoint = (
  rectShape: RectShape,
  pointWorld: WorldPoint,
): boolean =>
  pointWorld.x >= rectShape.x &&
  pointWorld.x <= rectShape.x + rectShape.w &&
  pointWorld.y >= rectShape.y &&
  pointWorld.y <= rectShape.y + rectShape.h;

export const normalizeRect = (
  pointX: number,
  pointY: number,
  pointXX: number,
  pointYY: number,
) => {
  const x = Math.min(pointX, pointXX);
  const y = Math.min(pointY, pointYY);
  const w = Math.abs(pointXX - pointX);
  const h = Math.abs(pointYY - pointY);
  return { x, y, w, h };
};

export const hitTestRect = (
  shapes: RectShape[],
  p: WorldPoint,
): RectShape | null => {
  for (let i = shapes.length - 1; i >= 0; i--) {
    const s = shapes[i]!;
    if (rectContainsPoint(s, p)) {
      return s;
    }
  }

  return null;
};
