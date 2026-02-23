import type { RectShape, SceneDocument } from "@nexo/shared";

export type Tool = "select" | "rect";

export type Camera = {
  panX: number;
  panY: number;
  zoom: number;
};

export type Selection = {
  shapeId: string | null;
};

export type DragMode =
  | { kind: "none" }
  | {
      kind: "panning";
      startClientX: number;
      startClientY: number;
      startPanX: number;
      startPanY: number;
    }
  | {
      kind: "creating-rect";
      shapeId: string;
      startWorldX: number;
      startWorldY: number;
      before: SceneDocument;
    }
  | {
      kind: "moving";
      shapeId: string;
      startWorldX: number;
      startWorldY: number;
      startShapeX: number;
      startShapeY: number;
      before: SceneDocument;
    };

export type EditorState = {
  tool: Tool;
  camera: Camera;
  scene: SceneDocument;
  selection: Selection;
  drag: DragMode;
  isSpaceDown: boolean;
  history: { past: SceneDocument[]; future: SceneDocument[] };
};

export type WorldPoint = { x: number; y: number };

export type { RectShape, SceneDocument };
