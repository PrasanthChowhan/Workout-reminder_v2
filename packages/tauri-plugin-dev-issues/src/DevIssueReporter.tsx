import { useState, useEffect, useRef } from "react";
import { sanitizeProps } from "./utils/sanitizer";
import { STYLES } from "./styles/styles";
import { invoke } from "@tauri-apps/api/core";

// Subcomponents
import { FABButton } from "./components/FABButton";
import { Header } from "./components/Header";
import { MarkdownEditor } from "./components/MarkdownEditor";
import { MetadataCard } from "./components/MetadataCard";
import { ActionButtons } from "./components/ActionButtons";

// Custom Hooks
import { useKeyboardShortcut } from "./hooks/useKeyboardShortcut";
import { useElementInspector } from "./hooks/useElementInspector";

export interface DevIssueReporterProps {
  maxStackDepth?: number;
  customRedactionKeys?: (string | RegExp)[];
  onSubmit?: (markdown: string) => void | Promise<void>;
}

export function DevIssueReporter({
  maxStackDepth = 15,
  customRedactionKeys = [],
  onSubmit,
}: DevIssueReporterProps) {
  // Verify environment to no-op in production
  let isProd = false;
  try {
    const nodeEnv = (globalThis as any).process?.env?.NODE_ENV;
    if (nodeEnv === "production") {
      isProd = true;
    }
  } catch (e) {}

  try {
    // @ts-ignore
    const viteEnv = import.meta.env;
    if (viteEnv && viteEnv.PROD) {
      isProd = true;
    }
  } catch (e) {}

  if (isProd) {
    return null;
  }

  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Inspector hook
  const {
    isInspecting,
    setIsInspecting,
    inspectedMeta,
    setInspectedMeta,
    inspectedDetails,
    setInspectedDetails,
  } = useElementInspector({ maxStackDepth });

  // Keyboard shortcut listener: Ctrl/Cmd + Shift + U
  useKeyboardShortcut("u", () => {
    setIsOpen(true);
    setIsInspecting((prev) => !prev);
  });

  // Inject styles on mount
  useEffect(() => {
    const styleId = "dev-issue-reporter-styles";
    if (document.getElementById(styleId)) return;

    const styleEl = document.createElement("style");
    styleEl.id = styleId;
    styleEl.innerHTML = STYLES;
    document.head.appendChild(styleEl);
  }, []);

  const insertMarkdown = (before: string, after: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);
    const replacement = before + selectedText + after;

    setDescription(
      text.substring(0, start) + replacement + text.substring(end)
    );

    // Re-focus and set selection
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + selectedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleSubmit = async () => {
    let markdown = "";
    if (title.trim()) {
      markdown += `## ${title.trim()}\n\n`;
    }
    if (description.trim()) {
      markdown += `${description.trim()}\n\n`;
    }

    if (inspectedDetails || inspectedMeta) {
      markdown += `### Context (Inspected Element)\n`;

      if (inspectedMeta) {
        markdown += `- **Component**: \`${inspectedMeta.componentName}\`\n`;
        if (inspectedMeta.sourceFile) {
          markdown += `- **Source Code**: \`${inspectedMeta.sourceFile}:${inspectedMeta.lineNumber}\`\n`;
        }
        if (inspectedMeta.componentStack && inspectedMeta.componentStack.length > 0) {
          markdown += `- **Component Stack**: \`${inspectedMeta.componentStack.join(" > ")}\`\n`;
        }
      }

      if (inspectedDetails) {
        markdown += `- **Selector**: \`${inspectedDetails.selector}\`\n`;
        if (inspectedDetails.textContent) {
          markdown += `- **Text**: \`${inspectedDetails.textContent}...\`\n`;
        }
      }

      if (inspectedMeta && inspectedMeta.memoizedProps) {
        const cleanProps = sanitizeProps(inspectedMeta.memoizedProps, customRedactionKeys);
        if (cleanProps) {
          markdown += `\n### Active State (Sanitized Props)\n\`\`\`json\n${JSON.stringify(cleanProps, null, 2)}\n\`\`\`\n`;
        }
      }
    }

    setIsSubmitting(true);
    try {
      if (onSubmit) {
        await onSubmit(markdown);
      } else {
        // Dynamic fallback: attempt to call tauri backend plugin/global commands directly
        try {
          await invoke("plugin:dev-issues|create_dev_issue", { text: markdown });
        } catch (pluginErr) {
          try {
            await invoke("create_dev_issue", { text: markdown });
          } catch (globalErr) {
            // Tauri not active, attempt calling local Vite dev server endpoint
            try {
              const res = await fetch("/api/dev-issues", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: markdown }),
              });
              if (!res.ok) throw new Error("HTTP " + res.status);
              console.log("DevIssueReporter: Saved local issue via API endpoint /api/dev-issues.");
            } catch (webErr) {
              console.warn(
                "DevIssueReporter: Local persistence failed (Tauri & endpoint /api/dev-issues not active). Emitted markdown payload:\n",
                markdown
              );
            }
          }
        }
      }
      setTitle("");
      setDescription("");
      setInspectedMeta(null);
      setInspectedDetails(null);
      setIsOpen(false);
    } catch (err) {
      console.error("Failed to submit issue:", err);
      alert("Failed to submit issue. Check console.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsInspecting(false);
  };

  return (
    <div className="dev-issue-reporter">
      {!isOpen ? (
        <FABButton onClick={() => setIsOpen(true)} />
      ) : (
        <div className="dir-overlay">
          <Header title="Dev Issue Reporter" onClose={handleClose} />

          <div className="dir-content">
            <input
              type="text"
              className="dir-title-input"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSubmitting}
            />

            <MarkdownEditor
              description={description}
              setDescription={setDescription}
              textareaRef={textareaRef}
              isSubmitting={isSubmitting}
              insertMarkdown={insertMarkdown}
            />

            <MetadataCard
              inspectedDetails={inspectedDetails}
              inspectedMeta={inspectedMeta}
            />

            <ActionButtons
              isInspecting={isInspecting}
              onInspectToggle={() => setIsInspecting((prev) => !prev)}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              disableSubmit={isSubmitting || (!description.trim() && !inspectedDetails)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
