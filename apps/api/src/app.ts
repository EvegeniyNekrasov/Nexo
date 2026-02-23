import Fastify from "fastify";
import cors from "@fastify/cors";
import { v4 as uuidv4 } from "uuid";

import { env } from "./env";
import { pool } from "./db";
import { CreateFileBodySchema } from "@nexo/protocol";
import type { FileRecord } from "@nexo/shared";

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

    const row = rows[0]!;
    const file: FileRecord = {
      id: row.id,
      name: row.name,
      createdAt: new Date(row.created_at).toISOString(),
    };

    return reply.code(201).send(file);
  });

  return app;
}
