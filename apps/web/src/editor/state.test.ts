import { describe, it, expect } from "vitest";
import { initialState, reducer } from "./state";

describe("editor history", () => {
  it("commit + undo + redo", () => {
    const s0 = initialState({ shapes: [] });

    const s1 = reducer(s0, {
      type: "add-shape",
      shape: { id: "1", type: "rect", x: 0, y: 0, w: 10, h: 10 },
    });

    // commit history with before snapshot = empty
    const s2 = reducer(s1, { type: "commit-history", before: s0.scene });
    expect(s2.history.past.length).toBe(1);

    const s3 = reducer(s2, { type: "undo" });
    expect(s3.scene.shapes.length).toBe(0);

    const s4 = reducer(s3, { type: "redo" });
    expect(s4.scene.shapes.length).toBe(1);
  });
});
