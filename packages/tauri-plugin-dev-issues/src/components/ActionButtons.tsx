import { MousePointer2, Send } from "lucide-react";

interface ActionButtonsProps {
  isInspecting: boolean;
  onInspectToggle: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  disableSubmit: boolean;
}

export function ActionButtons({
  isInspecting,
  onInspectToggle,
  onSubmit,
  isSubmitting,
  disableSubmit,
}: ActionButtonsProps) {
  return (
    <div className="dir-actions">
      <button
        onClick={onInspectToggle}
        className={`dir-btn dir-btn-inspect ${isInspecting ? "active" : ""}`}
        type="button"
        disabled={isSubmitting}
      >
        <MousePointer2 size={14} />
        <span>{isInspecting ? "Inspecting..." : "Inspect Context"}</span>
      </button>
      <button
        onClick={onSubmit}
        disabled={disableSubmit}
        className="dir-btn dir-btn-submit"
        type="button"
      >
        <Send size={14} />
        <span>{isSubmitting ? "Submitting..." : "Submit Issue"}</span>
      </button>
    </div>
  );
}
