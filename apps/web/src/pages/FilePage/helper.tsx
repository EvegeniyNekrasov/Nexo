import type { FileRecord } from "@nexo/shared";
import { ListFilesResponseSchema } from "@nexo/protocol";

const API_URL = import.meta.env.VITE_API_URL as string;

export const fetchFiles = async (): Promise<FileRecord[]> => {
  const res = await fetch(`${API_URL}/files`);

  if (!res.ok) {
    throw new Error(`GET /files failed: ${res.status}`);
  }

  const json = await res.json();
  const parsed = ListFilesResponseSchema.safeParse(json);

  if (!parsed.success) {
    throw new Error(parsed.error.message);
  }

  return parsed.data.files;
};

export const createFile = async (name: string): Promise<FileRecord> => {
  const res = await fetch(`${API_URL}/files`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name }),
  });

  if (!res.ok) {
    const json = await res.json().catch(() => null);
    throw new Error(json?.error ?? `POST /files failed: ${res.status}`);
  }

  return (await res.json()) as FileRecord;
};
