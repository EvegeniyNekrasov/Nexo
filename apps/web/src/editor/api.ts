import {
  GetDocumentResponseSchema,
  PutDocumentBodySchema,
} from "@nexo/protocol";
import type { SceneDocument } from "@nexo/shared";

const API_URL = import.meta.env.VITE_API_URL as string;

export const getDocument = async (fileId: string): Promise<SceneDocument> => {
  const res = await fetch(`${API_URL}/files/${fileId}/document`);

  if (!res.ok) {
    throw new Error(`GET document failed: ${res.status}`);
  }

  const json = await res.json();
  const parsed = GetDocumentResponseSchema.safeParse(json);

  if (!parsed.success) {
    throw new Error(parsed.error.message);
  }

  return parsed.data.document;
};

export const putDocument = async (
  fileId: string,
  document: SceneDocument,
): Promise<void> => {
  const body = { document };
  const parsed = PutDocumentBodySchema.safeParse(body);

  if (!parsed.success) throw new Error(parsed.error.message);

  const res = await fetch(`${API_URL}/files/${fileId}/document`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const json = await res.json().catch(() => null);
    throw new Error(json?.error ?? `PUT document failed: ${res.status}`);
  }
};
