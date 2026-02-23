import { describe, it, expect } from "vitest";
import { CreateFileBodySchema, ListFilesResponseSchema } from "./index";

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
});
