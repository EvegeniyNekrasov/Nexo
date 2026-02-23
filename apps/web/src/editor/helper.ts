import type { EditorState, RectShape, Tool } from "./types";
import { loadScene, saveScene } from "./storage";

export type Props = { fileId: string };

export type Action =
  | { type: "set-tool"; tool: Tool }
  | { type: "space"; down: boolean }
  | { type: "set-camera"; panX: number; panY: number; zoom: number }
  | { type: "set-selection"; shapeId: string | null }
  | { type: "set-drag"; drag: EditorState["drag"] }
  | { type: "add-shape"; shape: RectShape }
  | {
      type: "update-rect";
      id: string;
      patch: Partial<Pick<RectShape, "x" | "y" | "w" | "h">>;
    }
  | { type: "load-scene"; shapes: RectShape[] };

export const initialState = (fileId: string): EditorState => {
  const saved = loadScene(fileId);
  return {
    tool: "select",
    camera: {
      panX: 300,
      panY: 200,
      zoom: 1,
    },
    scene: {
      shapes: saved?.shapes ?? [],
    },
    selection: {
      shapeId: null,
    },
    drag: {
      kind: "none",
    },
    isSpaceDown: false,
  };
};

export const reducer = (state: EditorState, action: Action): EditorState => {
  switch (action.type) {
    case "set-tool":
      return { ...state, tool: action.tool, drag: { kind: "none" } };

    case "space":
      return { ...state, isSpaceDown: action.down };

    case "set-camera":
      return {
        ...state,
        camera: { panX: action.panX, panY: action.panY, zoom: action.zoom },
      };

    case "set-selection":
      return { ...state, selection: { shapeId: action.shapeId } };

    case "set-drag":
      return { ...state, drag: action.drag };

    case "add-shape":
      return {
        ...state,
        scene: { shapes: [...state.scene.shapes, action.shape] },
      };

    case "update-rect":
      return {
        ...state,
        scene: {
          shapes: state.scene.shapes.map((s) =>
            s.id === action.id ? { ...s, ...action.patch } : s,
          ),
        },
      };

    case "load-scene":
      return {
        ...state,
        scene: { shapes: action.shapes },
        selection: { shapeId: null },
        drag: { kind: "none" },
      };

    default:
      return state;
  }
};

export const newId = () => crypto.randomUUID();
