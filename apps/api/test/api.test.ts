import { beforeAll, beforeEach, afterAll, describe, expect, it } from "vitest";

import { ensureSchema, pool } from "../src/db";
import { buildApp } from "../src/app";

describe("api", () => {
  const app = buildApp();

  beforeAll(async () => {
    await ensureSchema();
    await app.ready();
  });

  beforeEach(async () => {
    // aislamos tests limpiando tabla
    await pool.query(`TRUNCATE TABLE file_documents, files;`);
  });

  afterAll(async () => {
    await app.close();
    await pool.end();
  });

  it("GET /health", async () => {
    const res = await app.inject({ method: "GET", url: "/health" });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ ok: true });
  });

  it("POST /files creates a file", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/files",
      payload: { name: "My first file" },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.name).toBe("My first file");
    expect(typeof body.id).toBe("string");
    expect(typeof body.createdAt).toBe("string");
  });

  it("GET /files lists files", async () => {
    await app.inject({ method: "POST", url: "/files", payload: { name: "A" } });
    await app.inject({ method: "POST", url: "/files", payload: { name: "B" } });

    const res = await app.inject({ method: "GET", url: "/files" });
    expect(res.statusCode).toBe(200);

    const body = res.json() as { files: Array<{ name: string }> };
    expect(body.files.length).toBe(2);
    expect(body.files.map((f) => f.name)).toContain("A");
    expect(body.files.map((f) => f.name)).toContain("B");
  });

  it("GET /files/:id/document returns empty doc after creating file", async () => {
    const created = await app.inject({
      method: "POST",
      url: "/files",
      payload: { name: "DocTest" },
    });
    const file = created.json() as { id: string };

    const res = await app.inject({
      method: "GET",
      url: `/files/${file.id}/document`,
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ document: { shapes: [] } });
  });

  it("PUT /files/:id/document persists doc", async () => {
    const created = await app.inject({
      method: "POST",
      url: "/files",
      payload: { name: "DocSave" },
    });
    const file = created.json() as { id: string };

    const put = await app.inject({
      method: "PUT",
      url: `/files/${file.id}/document`,
      payload: {
        document: {
          shapes: [{ id: "1", type: "rect", x: 1, y: 2, w: 3, h: 4 }],
        },
      },
    });
    expect(put.statusCode).toBe(200);

    const get = await app.inject({
      method: "GET",
      url: `/files/${file.id}/document`,
    });
    expect(get.statusCode).toBe(200);
    expect(get.json().document.shapes.length).toBe(1);
  });
});
