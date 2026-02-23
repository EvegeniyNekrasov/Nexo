import { Link, useParams } from "react-router-dom";
import CanvasEditor from "../editor/CanvasEditor";

import "./editorPage.css";

const EditorPage = () => {
  const { id } = useParams();
  if (!id) return <div className="wrapper-no-file">Missing file id</div>;

  return (
    <div className="wrapper-editor-page">
      <div className="wrapper-editor-page-header">
        <Link to="/">← Files</Link>{" "}
        <span className="file-code">
          File: <code>{id}</code>
        </span>
      </div>

      <div className="wrapper-canvas">
        <CanvasEditor fileId={id} />
      </div>
    </div>
  );
};

export default EditorPage;
