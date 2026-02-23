import { z } from "zod";
import type { FileRecord, SceneDocument } from "@nexo/shared";

export const CreateFileBodySchema = z.object({
  name: z.string().min(1).max(120),
});
export type CreateFileBody = z.infer<typeof CreateFileBodySchema>;

export const FileRecordSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.string(),
}) satisfies z.ZodType<FileRecord>;

export const ListFilesResponseSchema = z.object({
  files: z.array(FileRecordSchema),
});
export type ListFilesResponse = z.infer<typeof ListFilesResponseSchema>;

// ------------------

export const RectShapeScheme = z.object({
  id: z.string(),
  type: z.literal("rect"),
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number(),
});

export const SceneDocumentScheme = z.object({
  shapes: z.array(RectShapeScheme),
}) satisfies z.ZodType<SceneDocument>;

export const GetDocumentResponseSchema = z.object({
  document: SceneDocumentScheme,
});

export const PutDocumentBodySchema = z.object({
  document: SceneDocumentScheme,
});
