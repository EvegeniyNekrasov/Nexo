import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import type { RectShape, SceneDocument, Tool } from "./types";
import { clamp, hitTestRect, normalizeRect, screenToWorld } from "./geometry";
import { render } from "./render";
import { getDocument, putDocument } from "./api";
import { initialState, reducer, type Action } from "./state";
import ToolButton from "../ui/ToolButton/ToolButton";
import { saveScene } from "./storage";

import * as helperCanvasEditor from "./helper";

import "./canvasEditor.css";

const CanvasEditor = ({ fileId }: helperCanvasEditor.Props) => {
  const [loaded, setLoaded] = useState(false);

  const [state, dispatch] = useReducer(
    reducer,
    { shapes: [] } satisfies SceneDocument,
    initialState,
  );

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const dprRef = useRef<number>(1);
  const saveTimerRef = useRef<number | null>(null);

  const isMac = navigator.platform.toLowerCase().includes("mac");

  const isUndo = (e: KeyboardEvent) => {
    const mod = isMac ? e.metaKey : e.ctrlKey;
    return mod && !e.shiftKey && (e.key === "z" || e.key === "Z");
  };

  const isRedo = (e: KeyboardEvent) => {
    const mod = isMac ? e.metaKey : e.ctrlKey;
    return (
      (mod && e.shiftKey && (e.key === "z" || e.key === "Z")) ||
      (mod && (e.key === "y" || e.key === "Y"))
    );
  };

  useEffect(() => {
    if (!loaded) return;
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);

    saveTimerRef.current = window.setTimeout(() => {
      void putDocument(fileId, state.scene).catch(() => {});
    }, 500);

    return () => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    };
  }, [loaded, fileId, state.scene]);

  // Guardar escena al cambiar
  useEffect(() => {
    saveScene(fileId, state.scene);
  }, [fileId, state.scene]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const doc = await getDocument(fileId);
        if (!cancelled) dispatch({ type: "load-scene", scene: doc });
      } catch {
        // fallback: documento vacío
        if (!cancelled) dispatch({ type: "load-scene", scene: { shapes: [] } });
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fileId]);

  // Atajos: V (select), R (rect), Space (pan modifier)
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (isUndo(e)) {
        e.preventDefault();
        dispatch({ type: "undo" });
      }
      if (isRedo(e)) {
        e.preventDefault();
        dispatch({ type: "redo" });
      }
      if (e.code === "Space") {
        dispatch({ type: "space", down: true });
      }
      if (e.key === "v" || e.key === "V")
        dispatch({ type: "set-tool", tool: "select" });
      if (e.key === "r" || e.key === "R")
        dispatch({ type: "set-tool", tool: "rect" });
    }
    function onKeyUp(e: KeyboardEvent) {
      if (e.code === "Space") {
        dispatch({ type: "space", down: false });
      }
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  // Setup canvas (DPR + resize)
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctxRef.current = ctx;

    const ro = new ResizeObserver(() => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      dprRef.current = dpr;

      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));

      // fondo base
      ctx.fillStyle = "rgba(11,12,16,1)";
      render(ctx, state, canvas.width, canvas.height);
    });

    ro.observe(canvas);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Render al cambiar el estado
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    ctx.fillStyle = "rgba(11,12,16,1)";
    render(ctx, state, canvas.width, canvas.height);
  }, [state]);

  const clientToWorld = (
    e: PointerEvent | React.PointerEvent,
    canvas: HTMLCanvasElement,
  ) => {
    const rect = canvas.getBoundingClientRect();
    const dpr = dprRef.current;
    return screenToWorld({
      clientX: e.clientX,
      clientY: e.clientY,
      canvasRect: rect,
      camera: state.camera,
      dpr,
    });
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    canvas.setPointerCapture(e.pointerId);

    // Middle click OR Space modifier => pan
    if (e.button === 1 || state.isSpaceDown) {
      dispatch({
        type: "set-drag",
        drag: {
          kind: "panning",
          startClientX: e.clientX,
          startClientY: e.clientY,
          startPanX: state.camera.panX,
          startPanY: state.camera.panY,
        },
      });
      return;
    }

    // Right click: ignore
    if (e.button === 2) return;

    const p = clientToWorld(e, canvas);

    if (state.tool === "select") {
      const hit = hitTestRect(state.scene.shapes, p);
      if (!hit) {
        dispatch({ type: "set-selection", shapeId: null });
        dispatch({ type: "set-drag", drag: { kind: "none" } });
        return;
      }

      dispatch({ type: "set-selection", shapeId: hit.id });
      dispatch({
        type: "set-drag",
        drag: {
          kind: "moving",
          shapeId: hit.id,
          startWorldX: p.x,
          startWorldY: p.y,
          startShapeX: hit.x,
          startShapeY: hit.y,
          before: state.scene,
        },
      });
      return;
    }

    if (state.tool === "rect") {
      const id = helperCanvasEditor.newId();
      const shape: RectShape = { id, type: "rect", x: p.x, y: p.y, w: 0, h: 0 };
      dispatch({ type: "add-shape", shape });
      dispatch({ type: "set-selection", shapeId: id });
      dispatch({
        type: "set-drag",
        drag: {
          kind: "creating-rect",
          shapeId: id,
          startWorldX: p.x,
          startWorldY: p.y,
          before: state.scene,
        },
      });
      return;
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const p = clientToWorld(e, canvas);

    if (state.drag.kind === "panning") {
      const dx = (e.clientX - state.drag.startClientX) * dprRef.current;
      const dy = (e.clientY - state.drag.startClientY) * dprRef.current;
      dispatch({
        type: "set-camera",
        panX: state.drag.startPanX + dx,
        panY: state.drag.startPanY + dy,
        zoom: state.camera.zoom,
      });
      return;
    }

    if (state.drag.kind === "moving") {
      const dx = p.x - state.drag.startWorldX;
      const dy = p.y - state.drag.startWorldY;
      dispatch({
        type: "update-rect",
        id: state.drag.shapeId,
        patch: {
          x: state.drag.startShapeX + dx,
          y: state.drag.startShapeY + dy,
        },
      });
      return;
    }

    if (state.drag.kind === "creating-rect") {
      const n = normalizeRect(
        state.drag.startWorldX,
        state.drag.startWorldY,
        p.x,
        p.y,
      );
      dispatch({
        type: "update-rect",
        id: state.drag.shapeId,
        patch: { x: n.x, y: n.y, w: n.w, h: n.h },
      });
      return;
    }
  };

  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    try {
      canvas.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    const d = state.drag;

    if (d.kind === "moving") {
      dispatch({ type: "commit-history", before: d.before });
    }

    if (d.kind === "creating-rect") {
      // si quedó 0x0, lo borramos y no guardamos history
      const created = state.scene.shapes.find((s) => s.id === d.shapeId);
      if (!created || created.w < 1 || created.h < 1) {
        dispatch({ type: "remove-shape", id: d.shapeId });
      } else {
        dispatch({ type: "commit-history", before: d.before });
      }
    }
    dispatch({ type: "set-drag", drag: { kind: "none" } });
  };

  const onWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    e.preventDefault();

    const rect = canvas.getBoundingClientRect();
    const dpr = dprRef.current;

    // Punto “ancla” bajo el cursor, en coords world, antes del zoom
    const before = screenToWorld({
      clientX: e.clientX,
      clientY: e.clientY,
      canvasRect: rect,
      camera: state.camera,
      dpr,
    });

    const zoomFactor = Math.exp(-e.deltaY * 0.0015);
    const nextZoom = clamp(state.camera.zoom * zoomFactor, 0.15, 6);

    // Mantener el punto bajo el cursor estable
    const sx = (e.clientX - rect.left) * dpr;
    const sy = (e.clientY - rect.top) * dpr;

    const nextPanX = sx - before.x * nextZoom;
    const nextPanY = sy - before.y * nextZoom;

    dispatch({
      type: "set-camera",
      panX: nextPanX,
      panY: nextPanY,
      zoom: nextZoom,
    });
  };

  const resetScene = () => {
    localStorage.removeItem(`nexo:scene:${fileId}`);
    dispatch({ type: "load-scene", scene: { shapes: [] } });
  };

  return (
    <div className="wrapper-canvas-editor">
      <div className="container-toolbar">
        <ToolButton
          active={state.tool === "select"}
          onClick={() => dispatch({ type: "set-tool", tool: "select" })}
        >
          Select (V)
        </ToolButton>
        <ToolButton
          active={state.tool === "rect"}
          onClick={() => dispatch({ type: "set-tool", tool: "rect" })}
        >
          Rect (R)
        </ToolButton>
        <div className="separator" />
        <ToolButton
          active={false}
          onClick={() =>
            dispatch({ type: "set-camera", panX: 300, panY: 200, zoom: 1 })
          }
        >
          Reset View
        </ToolButton>
        <ToolButton active={false} onClick={resetScene}>
          Clear
        </ToolButton>
      </div>

      <canvas
        ref={canvasRef}
        className="canvas"
        style={{
          cursor: state.isSpaceDown
            ? "grab"
            : state.tool === "rect"
              ? "crosshair"
              : "default",
        }}
        onContextMenu={(e) => e.preventDefault()}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onWheel={onWheel}
      />
    </div>
  );
};

export default CanvasEditor;
