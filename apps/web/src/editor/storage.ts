import type { Scene } from "./types";

const keyFor = (fileId: string) => `nexo:scene:${fileId}`;

export function loadScene(fileId: string): Scene | null {
  try {
    const raw = localStorage.getItem(keyFor(fileId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Scene;
    if (!parsed || !Array.isArray(parsed.shapes)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveScene(fileId: string, scene: Scene) {
  try {
    localStorage.setItem(keyFor(fileId), JSON.stringify(scene));
  } catch {
    // ignore quota
  }
}
