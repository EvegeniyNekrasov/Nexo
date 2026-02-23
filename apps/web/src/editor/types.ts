export type Tool = "select" | "rect";

export type Camera = {
  /** px */
  panX: number;
  /** px */
  panY: number;
  /** scale factor */
  zoom: number;
};

export type RectShape = {
  id: string;
  type: "rect";
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Scene = {
  shapes: RectShape[];
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
    }
  | {
      kind: "moving";
      shapeId: string;
      startWorldX: number;
      startWorldY: number;
      startShapeX: number;
      startShapeY: number;
    };

export type EditorState = {
  tool: Tool;
  camera: Camera;
  scene: Scene;
  selection: Selection;
  drag: DragMode;
  isSpaceDown: boolean;
};

export type WorldPoint = { x: number; y: number };
