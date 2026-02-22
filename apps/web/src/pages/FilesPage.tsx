import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ListFilesResponseSchema } from "@nexo/protocol";
import type { FileRecord } from "@nexo/shared";

const API_URL = import.meta.env.VITE_API_URL as string;

async function fetchFiles(): Promise<FileRecord[]> {
  const res = await fetch(`${API_URL}/files`);
  if (!res.ok) throw new Error(`GET /files failed: ${res.status}`);
  const json = await res.json();
  const parsed = ListFilesResponseSchema.safeParse(json);
  if (!parsed.success) throw new Error(parsed.error.message);
  return parsed.data.files;
}

async function createFile(name: string): Promise<FileRecord> {
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
}

export default function FilesPage() {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [name, setName] = useState("Untitled");

  const canCreate = useMemo(() => name.trim().length > 0, [name]);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      setFiles(await fetchFiles());
    } catch (e: any) {
      setErr(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  async function onCreate() {
    if (!canCreate) return;
    setErr(null);
    try {
      const created = await createFile(name.trim());
      setFiles((prev) => [created, ...prev]);
    } catch (e: any) {
      setErr(e?.message ?? String(e));
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div style={{ padding: 16, maxWidth: 860 }}>
      <h1>Nexo</h1>

      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ padding: 8, flex: 1 }}
          placeholder="Nombre del file"
        />
        <button
          onClick={onCreate}
          disabled={!canCreate}
          style={{ padding: "8px 12px" }}
        >
          Crear
        </button>
        <button onClick={load} style={{ padding: "8px 12px" }}>
          Refrescar
        </button>
      </div>

      {loading && <p>Cargando…</p>}
      {err && <p style={{ color: "crimson" }}>{err}</p>}

      <ul style={{ marginTop: 16 }}>
        {files.map((f) => (
          <li key={f.id} style={{ padding: "6px 0" }}>
            <Link to={`/file/${f.id}`}>{f.name}</Link>{" "}
            <small style={{ opacity: 0.7 }}>
              — {new Date(f.createdAt).toLocaleString()}
            </small>
          </li>
        ))}
      </ul>
    </div>
  );
}
