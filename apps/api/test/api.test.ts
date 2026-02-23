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
    await pool.query(`TRUNCATE TABLE files;`);
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
});
