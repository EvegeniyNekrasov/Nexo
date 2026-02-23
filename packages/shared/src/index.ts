export type Id = string;

export type FileRecord = {
  id: Id;
  name: string;
  createdAt: string; // ISO
};

export type ApiError = {
  error: string;
};

export type RectShape = {
  id: string;
  type: "rect";
  x: number;
  y: number;
  w: number;
  h: number;
};

export type SceneDocument = {
  shapes: RectShape[];
};
