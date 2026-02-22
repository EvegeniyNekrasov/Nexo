import { z } from "zod";
import type { FileRecord } from "@nexo/shared";

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
