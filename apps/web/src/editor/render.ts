import type { EditorState, RectShape } from "./types";

const drawGrid = (
  ctx: CanvasRenderingContext2D,
  state: EditorState,
  width: number,
  height: number,
) => {
  const { camera } = state;
  const step = 80 * camera.zoom; // grid spacing in screen px aprox
  if (step < 25) return;

  ctx.save();
  ctx.lineWidth = 1;

  // vertical lines
  const startX = ((camera.panX % step) + step) % step;
  for (let x = startX; x < width; x += step) {
    ctx.globalAlpha = 0.12;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  // horizontal lines
  const startY = ((camera.panY % step) + step) % step;
  for (let y = startY; y < height; y += step) {
    ctx.globalAlpha = 0.12;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  ctx.restore();
};

const drawRect = (
  ctx: CanvasRenderingContext2D,
  state: EditorState,
  r: RectShape,
) => {
  const { camera, selection } = state;

  const x = r.x * camera.zoom + camera.panX;
  const y = r.y * camera.zoom + camera.panY;
  const w = r.w * camera.zoom;
  const h = r.h * camera.zoom;

  ctx.save();

  // Fill
  ctx.globalAlpha = 0.9;
  ctx.fillRect(x, y, w, h);

  // stroke
  ctx.globalAlpha = 0.9;
  ctx.lineWidth = Math.max(1, 1.5 * (camera.zoom >= 1 ? 1 : 1 / camera.zoom));
  ctx.strokeRect(x, y, w, h);

  // selection outline
  if (selection.shapeId === r.id) {
    ctx.globalAlpha = 1;
    ctx.lineWidth = Math.max(2, 2.5 * (camera.zoom >= 1 ? 1 : 1 / camera.zoom));
    ctx.strokeRect(x - 2, y - 2, w + 4, h + 4);
  }

  ctx.restore();
};

export const render = (
  ctx: CanvasRenderingContext2D,
  state: EditorState,
  width: number,
  height: number,
) => {
  // background
  ctx.clearRect(0, 0, width, height);
  ctx.save();
  ctx.fillRect(0, 0, width, height);
  ctx.restore();

  // grid
  drawGrid(ctx, state, width, height);

  // shapes
  for (const s of state.scene.shapes) {
    // defaults: fondo claro, borde
    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    if (state.selection.shapeId === s.id) {
      ctx.strokeStyle = "rgba(138,180,255,0.95)";
    }
    drawRect(ctx, state, s);
    ctx.restore();
  }

  // HUD text
  ctx.save();
  ctx.globalAlpha = 0.75;
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.font = "12px ui-sans-serif, system-ui";
  ctx.fillText(
    `Tool: ${state.tool}   Zoom: ${state.camera.zoom.toFixed(2)}`,
    12,
    height - 12,
  );
  ctx.restore();
};
