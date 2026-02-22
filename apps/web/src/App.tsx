import { Route, Routes, Link, useParams } from "react-router-dom";
import FilesPage from "./pages/FilesPage";

function EditorPage() {
  const { id } = useParams();
  return (
    <div style={{ padding: 16 }}>
      <h2>Editor (placeholder)</h2>
      <p>
        File ID: <code>{id}</code>
      </p>
      <p>
        <Link to="/">← Volver a files</Link>
      </p>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<FilesPage />} />
      <Route path="/file/:id" element={<EditorPage />} />
    </Routes>
  );
}
