import React, { useState } from "react";
import { Bold, Italic, Code, Link, List } from "lucide-react";
import { renderMarkdown } from "../utils/markdown";

interface MarkdownEditorProps {
  description: string;
  setDescription: (val: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  isSubmitting: boolean;
  insertMarkdown: (before: string, after?: string) => void;
}

export function MarkdownEditor({
  description,
  setDescription,
  textareaRef,
  isSubmitting,
  insertMarkdown,
}: MarkdownEditorProps) {
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");

  return (
    <div className="dir-editor-container">
      <div className="dir-editor-header">
        <div className="dir-tabs">
          <button
            type="button"
            className={`dir-tab ${activeTab === "write" ? "active" : ""}`}
            onClick={() => setActiveTab("write")}
          >
            Write
          </button>
          <button
            type="button"
            className={`dir-tab ${activeTab === "preview" ? "active" : ""}`}
            onClick={() => setActiveTab("preview")}
          >
            Preview
          </button>
        </div>
        {activeTab === "write" && (
          <div className="dir-toolbar">
            <button
              type="button"
              className="dir-toolbar-btn"
              onClick={() => insertMarkdown("**", "**")}
              title="Add bold text"
            >
              <Bold size={14} />
            </button>
            <button
              type="button"
              className="dir-toolbar-btn"
              onClick={() => insertMarkdown("*", "*")}
              title="Add italic text"
            >
              <Italic size={14} />
            </button>
            <button
              type="button"
              className="dir-toolbar-btn"
              onClick={() => insertMarkdown("`", "`")}
              title="Insert code"
            >
              <Code size={14} />
            </button>
            <button
              type="button"
              className="dir-toolbar-btn"
              onClick={() => insertMarkdown("[", "](url)")}
              title="Add a link"
            >
              <Link size={14} />
            </button>
            <button
              type="button"
              className="dir-toolbar-btn"
              onClick={() => insertMarkdown("- ")}
              title="Add a bullet list"
            >
              <List size={14} />
            </button>
          </div>
        )}
      </div>

      <div className="dir-editor-body">
        {activeTab === "write" ? (
          <>
            <textarea
              ref={textareaRef}
              className="dir-textarea"
              placeholder="Describe the issue, bug, or feature request..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
            />
            <div className="dir-editor-footer">
              <div className="dir-markdown-tip">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <path d="M14.85 3H1.15C.52 3 0 3.52 0 4.15v7.69C0 12.48.52 13 1.15 13h13.69c.63 0 1.15-.52 1.15-1.15V4.15C16 3.52 15.48 3 14.85 3zM9 11H7V8L5.5 9.5 4 8v3H2V5h2l1.5 1.5L7 5h2v6zm5.5-3l-2-2v2.5H10v1h2.5V11l2-3z" />
                </svg>
                <span>Markdown is supported</span>
              </div>
            </div>
          </>
        ) : (
          <div className="dir-preview-area">
            {renderMarkdown(description)}
          </div>
        )}
      </div>
    </div>
  );
}
