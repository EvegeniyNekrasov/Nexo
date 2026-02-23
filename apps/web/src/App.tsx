import { Route, Routes } from "react-router-dom";
import FilesPage from "./pages/FilePage/FilesPage";
import EditorPage from "./pages/EditorPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<FilesPage />} />
      <Route path="/file/:id" element={<EditorPage />} />
    </Routes>
  );
}
