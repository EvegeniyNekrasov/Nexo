export type Id = string;

export type FileRecord = {
  id: Id;
  name: string;
  createdAt: string; // ISO
};

export type ApiError = {
  error: string;
};
