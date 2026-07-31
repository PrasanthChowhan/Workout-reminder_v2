import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Bug, X, MousePointer2, Send } from "lucide-react";

export function DevIssueReporter() {
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState("");
  const [isInspecting, setIsInspecting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isInspecting) return;

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Don't highlight our own reporter to avoid infinite recursion or weirdness
      if (target.closest('.dev-issue-reporter')) return;
      target.style.outline = "2px solid #ef4444";
      target.style.outlineOffset = "-2px";
      target.style.cursor = "crosshair";
    };

    const handleMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.dev-issue-reporter')) return;
      target.style.outline = "";
      target.style.outlineOffset = "";
      target.style.cursor = "";
    };

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.dev-issue-reporter')) return;
      
      e.preventDefault();
      e.stopPropagation();
      
      target.style.outline = "";
      target.style.outlineOffset = "";
      target.style.cursor = "";

      const tag = target.tagName.toLowerCase();
      const id = target.id ? `#${target.id}` : "";
      
      // Handle className gracefully if it's an SVGAnimatedString or string
      let classStr = "";
      if (typeof target.className === "string") {
        classStr = target.className;
      } else if (target.className && typeof target.className.baseVal === "string") {
        classStr = target.className.baseVal;
      }
      const classes = classStr.trim() ? `.${classStr.trim().split(/\s+/).join(".")}` : "";
      
      const textContent = target.textContent?.slice(0, 100).trim() || "";
      
      let context = `\n\n### Context (Inspected Element)\n- **Selector**: \`${tag}${id}${classes}\`\n`;
      if (textContent) {
        context += `- **Text**: \`${textContent}...\`\n`;
      }
      
      setText(prev => prev + context);
      setIsInspecting(false);
    };

    document.addEventListener("mouseover", handleMouseOver);
    document.addEventListener("mouseout", handleMouseOut);
    document.addEventListener("click", handleClick, { capture: true });

    return () => {
      document.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("mouseout", handleMouseOut);
      document.removeEventListener("click", handleClick, { capture: true });
      
      // Cleanup any remaining outlines
      document.querySelectorAll('*').forEach(el => {
        (el as HTMLElement).style.outline = "";
        (el as HTMLElement).style.outlineOffset = "";
        (el as HTMLElement).style.cursor = "";
      });
    };
  }, [isInspecting]);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setIsSubmitting(true);
    try {
      await invoke("plugin:dev-issues|create_dev_issue", { text });
      setText("");
      setIsOpen(false);
    } catch (err) {
      console.error("Failed to create issue:", err);
      alert("Failed to create issue. Check console.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="dev-issue-reporter fixed bottom-4 right-4 z-[9999] font-sans">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-red-500 hover:bg-red-600 text-white rounded-full p-3 shadow-lg transition-transform hover:scale-110 flex items-center justify-center border-2 border-red-400"
          title="Report Dev Issue"
        >
          <Bug className="w-6 h-6" />
        </button>
      )}

      {isOpen && (
        <div className="bg-neutral-900 border border-neutral-700 shadow-2xl rounded-lg w-96 flex flex-col overflow-hidden text-neutral-200">
          <div className="bg-neutral-800 px-4 py-3 flex items-center justify-between border-b border-neutral-700">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Bug className="w-4 h-4 text-red-400" /> Dev Issue Reporter
            </h3>
            <button onClick={() => setIsOpen(false)} className="text-neutral-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-3 flex flex-col gap-3">
            <textarea
              className="w-full bg-neutral-950 border border-neutral-700 rounded p-3 text-sm text-white focus:outline-none focus:border-red-500 min-h-[160px] resize-y"
              placeholder="Describe the issue, bug, or feature request..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <div className="flex gap-2">
              <button
                onClick={() => setIsInspecting(!isInspecting)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded text-xs font-medium transition-colors ${
                  isInspecting 
                    ? "bg-red-500/20 text-red-400 border border-red-500/50" 
                    : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700 border border-transparent"
                }`}
              >
                <MousePointer2 className="w-4 h-4" />
                {isInspecting ? "Inspecting..." : "Inspect Context"}
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !text.trim()}
                className="flex-[2] flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:hover:bg-red-600 text-white py-2 px-3 rounded text-xs font-bold transition-colors"
              >
                <Send className="w-4 h-4" />
                {isSubmitting ? "Saving..." : "Create Issue"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
