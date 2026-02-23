import type { SceneDocument, RectShape } from "@nexo/shared";
import type { Camera, Tool, Selection, DragMode, EditorState } from "./types";

type History = { past: SceneDocument[]; future: SceneDocument[] };

export type Action =
  | { type: "set-tool"; tool: Tool }
  | { type: "space"; down: boolean }
  | { type: "set-camera"; panX: number; panY: number; zoom: number }
  | { type: "set-selection"; shapeId: string | null }
  | { type: "set-drag"; drag: DragMode }
  | { type: "add-shape"; shape: RectShape }
  | { type: "remove-shape"; id: string }
  | {
      type: "update-rect";
      id: string;
      patch: Partial<Pick<RectShape, "x" | "y" | "w" | "h">>;
    }
  | { type: "load-scene"; scene: SceneDocument }
  | { type: "commit-history"; before: SceneDocument }
  | { type: "undo" }
  | { type: "redo" };

export function initialState(scene: SceneDocument): EditorState {
  return {
    tool: "select",
    camera: { panX: 300, panY: 200, zoom: 1 } satisfies Camera,
    scene,
    selection: { shapeId: null } satisfies Selection,
    drag: { kind: "none" },
    isSpaceDown: false,
    history: { past: [], future: [] } satisfies History,
  };
}

function capHistory(past: SceneDocument[]) {
  const MAX = 100;
  return past.length > MAX ? past.slice(past.length - MAX) : past;
}

export function reducer(state: EditorState, action: Action): EditorState {
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

    case "remove-shape":
      return {
        ...state,
        scene: { shapes: state.scene.shapes.filter((s) => s.id !== action.id) },
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
        scene: action.scene,
        selection: { shapeId: null },
        drag: { kind: "none" },
        history: { past: [], future: [] },
      };

    case "commit-history": {
      // push BEFORE snapshot, clear redo stack
      const nextPast = capHistory([...state.history.past, action.before]);
      return { ...state, history: { past: nextPast, future: [] } };
    }

    case "undo": {
      const past = state.history.past;
      if (past.length === 0) return state;
      const prev = past[past.length - 1]!;
      const rest = past.slice(0, -1);
      return {
        ...state,
        scene: prev,
        selection: { shapeId: null },
        drag: { kind: "none" },
        history: { past: rest, future: [state.scene, ...state.history.future] },
      };
    }

    case "redo": {
      const future = state.history.future;
      if (future.length === 0) return state;
      const next = future[0]!;
      const rest = future.slice(1);
      return {
        ...state,
        scene: next,
        selection: { shapeId: null },
        drag: { kind: "none" },
        history: { past: [...state.history.past, state.scene], future: rest },
      };
    }

    default:
      return state;
  }
}
