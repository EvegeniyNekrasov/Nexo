import "dotenv/config";
import process from "node:process";

import { env } from "./env";
import { ensureSchema } from "./db";
import { buildApp } from "./app";

async function main() {
  await ensureSchema();
  const app = buildApp();
  await app.listen({ port: env.PORT, host: "0.0.0.0" });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
