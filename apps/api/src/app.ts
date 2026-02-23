import Fastify from "fastify";
import cors from "@fastify/cors";
import { v4 as uuidv4 } from "uuid";

import { env } from "./env";
import { pool } from "./db";
import { CreateFileBodySchema, PutDocumentBodySchema } from "@nexo/protocol";
import type { FileRecord, SceneDocument } from "@nexo/shared";

export function buildApp() {
  const app = Fastify({ logger: true });

  app.register(cors, { origin: env.CORS_ORIGIN });

  app.get("/health", async () => ({ ok: true }));

  app.get("/files", async () => {
    const { rows } = await pool.query<{
      id: string;
      name: string;
      created_at: string;
    }>(
      `SELECT id, name, created_at FROM files ORDER BY created_at DESC LIMIT 200;`,
    );

    const files: FileRecord[] = rows.map((r) => ({
      id: r.id,
      name: r.name,
      createdAt: new Date(r.created_at).toISOString(),
    }));

    return { files };
  });

  app.post("/files", async (req, reply) => {
    const parsed = CreateFileBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.message });
    }

    const id = uuidv4();
    const name = parsed.data.name.trim();

    const { rows } = await pool.query<{
      id: string;
      name: string;
      created_at: string;
    }>(
      `INSERT INTO files (id, name) VALUES ($1, $2) RETURNING id, name, created_at;`,
      [id, name],
    );

    await pool.query(
      `INSERT INTO file_documents (file_id, document) VALUES ($1, $2::jsonb)
       ON CONFLICT (file_id) DO NOTHING;`,
      [id, JSON.stringify({ shapes: [] })],
    );

    const row = rows[0]!;
    const file: FileRecord = {
      id: row.id,
      name: row.name,
      createdAt: new Date(row.created_at).toISOString(),
    };

    return reply.code(201).send(file);
  });

  app.get("/files/:id/document", async (req, reply) => {
    const { id } = req.params as { id: string };

    // existe file?
    const exists = await pool.query(
      `SELECT 1 FROM files WHERE id = $1 LIMIT 1;`,
      [id],
    );
    if (exists.rowCount === 0)
      return reply.code(404).send({ error: "file not found" });

    const { rows } = await pool.query<{ document: SceneDocument }>(
      `SELECT document FROM file_documents WHERE file_id = $1 LIMIT 1;`,
      [id],
    );

    // fallback si no existe (por si hay legacy)
    const document = (rows[0]?.document ?? { shapes: [] }) as SceneDocument;
    return { document };
  });

  app.put("/files/:id/document", async (req, reply) => {
    const { id } = req.params as { id: string };

    const parsed = PutDocumentBodySchema.safeParse(req.body);
    if (!parsed.success)
      return reply.code(400).send({ error: parsed.error.message });

    const exists = await pool.query(
      `SELECT 1 FROM files WHERE id = $1 LIMIT 1;`,
      [id],
    );
    if (exists.rowCount === 0)
      return reply.code(404).send({ error: "file not found" });

    const doc = parsed.data.document;

    await pool.query(
      `INSERT INTO file_documents (file_id, document, updated_at)
       VALUES ($1, $2::jsonb, now())
       ON CONFLICT (file_id) DO UPDATE SET document = EXCLUDED.document, updated_at = now();`,
      [id, JSON.stringify(doc)],
    );

    return { ok: true };
  });

  return app;
}
