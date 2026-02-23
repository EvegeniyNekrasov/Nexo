import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { FileRecord } from "@nexo/shared";

import * as filesHelper from "./helper";

import "./filePage.css";

export default function FilesPage() {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [name, setName] = useState("Untitled");

  const canCreate = useMemo(() => {
    return name.trim().length > 0;
  }, [name]);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      setFiles(await filesHelper.fetchFiles());
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
      const created = await filesHelper.createFile(name.trim());
      setFiles((prev) => [created, ...prev]);
    } catch (e: any) {
      setErr(e?.message ?? String(e));
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="wrapper-file-page">
      <h1>Nexo</h1>

      <div className="container-create-file">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre del file"
        />
        <button onClick={onCreate} disabled={!canCreate}>
          Create
        </button>
        <button onClick={load}>Refresh</button>
      </div>

      {loading && <p>Loading…</p>}
      {err && <p className="error">{err}</p>}

      <ul className="wrapper-list">
        {files.map((f) => (
          <li key={f.id} className="list">
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
