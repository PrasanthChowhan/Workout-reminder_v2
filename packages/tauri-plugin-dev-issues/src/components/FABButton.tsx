import { Bug } from "lucide-react";

interface FABButtonProps {
  onClick: () => void;
}

export function FABButton({ onClick }: FABButtonProps) {
  return (
    <button
      onClick={onClick}
      className="dir-fab"
      title="Report Dev Issue (Ctrl+Shift+U)"
    >
      <Bug size={16} />
      <span>Report Issue</span>
    </button>
  );
}
