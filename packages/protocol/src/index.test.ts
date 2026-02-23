import { describe, it, expect } from "vitest";
import {
  CreateFileBodySchema,
  ListFilesResponseSchema,
  SceneDocumentScheme,
} from "./index";

describe("@nexo/protocol", () => {
  it("validates CreateFileBody", () => {
    expect(CreateFileBodySchema.safeParse({ name: "Hello" }).success).toBe(
      true,
    );
    expect(CreateFileBodySchema.safeParse({ name: "" }).success).toBe(false);
  });

  it("validates ListFilesResponse", () => {
    const ok = {
      files: [{ id: "1", name: "A", createdAt: new Date().toISOString() }],
    };
    expect(ListFilesResponseSchema.safeParse(ok).success).toBe(true);
  });

  it("validates SceneDocument", () => {
    expect(
      SceneDocumentScheme.safeParse({
        shapes: [{ id: "1", type: "rect", x: 0, y: 0, w: 10, h: 10 }],
      }).success,
    ).toBe(true);
  });
});
