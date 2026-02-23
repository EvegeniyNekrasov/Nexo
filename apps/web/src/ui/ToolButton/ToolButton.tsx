import "./toolButton.css";

interface ToolProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

export default function ToolButton(props: ToolProps) {
  return (
    <button
      onClick={props.onClick}
      className={`tool-btn ${props.active ? "active" : ""}`}
    >
      {props.children}
    </button>
  );
}
