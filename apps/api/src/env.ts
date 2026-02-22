import process from "node:process";

export const env = {
  PORT: Number(process.env.PORT ?? 3001),
  CORS_ORIGIN: String(process.env.CORS_ORIGIN ?? "http://localhost:5173"),
  DATABASE_URL: String(
    process.env.DATABASE_URL ?? "postgres://nexo:nexo@localhost:5432/nexo",
  ),
} as const;
