import { Bug, X } from "lucide-react";

interface HeaderProps {
  title: string;
  onClose: () => void;
}

export function Header({ title, onClose }: HeaderProps) {
  return (
    <div className="dir-header">
      <h3 className="dir-title">
        <Bug className="dir-title-bug" size={16} />
        <span>{title}</span>
      </h3>
      <button
        onClick={onClose}
        className="dir-close-btn"
        title="Close"
      >
        <X size={16} />
      </button>
    </div>
  );
}
