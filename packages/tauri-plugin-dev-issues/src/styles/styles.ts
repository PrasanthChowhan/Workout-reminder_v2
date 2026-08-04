export const STYLES = `
.dev-issue-reporter {
  --gh-bg-default: #0d1117;
  --gh-bg-overlay: #161b22;
  --gh-bg-subtle: #21262d;
  --gh-border-default: #30363d;
  --gh-text-default: #e6edf3;
  --gh-text-muted: #7d8590;
  --gh-text-link: #2f81f7;
  --gh-btn-primary-bg: #238636;
  --gh-btn-primary-hover: #2ea043;
  --gh-btn-primary-border: rgba(240, 246, 252, 0.1);
  --gh-btn-secondary-bg: #21262d;
  --gh-btn-secondary-hover: #30363d;
  --gh-btn-secondary-border: #30363d;
  --gh-btn-active-bg: rgba(31, 111, 235, 0.1);
  --gh-btn-active-border: #1f6feb;
  --gh-chip-bg: rgba(31, 111, 235, 0.15);
  --gh-chip-border: rgba(56, 139, 253, 0.4);
  --gh-chip-text: #58a6ff;
  --gh-success-icon: #3fb950;
  --gh-focus-outline: #2f81f7;
  --gh-font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
  --gh-font-mono: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, "Liberation Mono", monospace;

  font-family: var(--gh-font-sans);
  color: var(--gh-text-default);
}

.dev-issue-reporter *, 
.dev-issue-reporter *::before, 
.dev-issue-reporter *::after {
  box-sizing: border-box;
}

.dev-issue-reporter .dir-fab {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 99999;
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: var(--gh-btn-secondary-bg);
  color: var(--gh-text-default);
  border: 1px solid var(--gh-border-default);
  padding: 8px 14px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s, border-color 0.2s, box-shadow 0.2s;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.dev-issue-reporter .dir-fab:hover {
  background-color: var(--gh-btn-secondary-hover);
  border-color: #8b949e;
}

.dev-issue-reporter .dir-fab svg {
  color: var(--gh-success-icon);
  transition: transform 0.2s;
}

.dev-issue-reporter .dir-fab:hover svg {
  transform: scale(1.1);
}

.dev-issue-reporter .dir-overlay {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 99999;
  width: 440px;
  background-color: var(--gh-bg-default);
  border: 1px solid var(--gh-border-default);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(1, 4, 9, 0.4);
  display: flex;
  flex-direction: column;
  animation: dir-fade-in 0.15s cubic-bezier(0, 0, 0.2, 1);
}

@keyframes dir-fade-in {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.dev-issue-reporter .dir-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: var(--gh-bg-overlay);
  border-bottom: 1px solid var(--gh-border-default);
}

.dev-issue-reporter .dir-title {
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  color: var(--gh-text-default);
}

.dev-issue-reporter .dir-title-bug {
  color: var(--gh-success-icon);
}

.dev-issue-reporter .dir-close-btn {
  background: transparent;
  border: none;
  color: var(--gh-text-muted);
  cursor: pointer;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s, color 0.2s;
}

.dev-issue-reporter .dir-close-btn:hover {
  background-color: var(--gh-btn-secondary-hover);
  color: var(--gh-text-default);
}

.dev-issue-reporter .dir-content {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dev-issue-reporter .dir-title-input {
  width: 100%;
  background-color: var(--gh-bg-default);
  border: 1px solid var(--gh-border-default);
  border-radius: 6px;
  padding: 6px 12px;
  font-family: var(--gh-font-sans);
  font-size: 14px;
  color: var(--gh-text-default);
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.dev-issue-reporter .dir-title-input:focus {
  border-color: var(--gh-focus-outline);
  box-shadow: 0 0 0 3px rgba(31, 111, 235, 0.3);
}

.dev-issue-reporter .dir-title-input::placeholder {
  color: var(--gh-text-muted);
}

.dev-issue-reporter .dir-editor-container {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--gh-border-default);
  border-radius: 6px;
  background-color: var(--gh-bg-default);
  overflow: hidden;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.dev-issue-reporter .dir-editor-container:has(.dir-textarea:focus) {
  border-color: var(--gh-focus-outline);
  box-shadow: 0 0 0 3px rgba(31, 111, 235, 0.3);
}

.dev-issue-reporter .dir-editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: var(--gh-bg-overlay);
  border-bottom: 1px solid var(--gh-border-default);
  padding: 0 8px;
}

.dev-issue-reporter .dir-tabs {
  display: flex;
  gap: 4px;
  padding-top: 8px;
}

.dev-issue-reporter .dir-tab {
  background: transparent;
  border: 1px solid transparent;
  border-bottom: none;
  border-top-left-radius: 6px;
  border-top-right-radius: 6px;
  padding: 6px 12px;
  font-size: 13px;
  color: var(--gh-text-muted);
  cursor: pointer;
  margin-bottom: -1px;
  transition: color 0.2s;
}

.dev-issue-reporter .dir-tab:hover {
  color: var(--gh-text-default);
}

.dev-issue-reporter .dir-tab.active {
  background-color: var(--gh-bg-default);
  border-color: var(--gh-border-default);
  color: var(--gh-text-default);
  font-weight: 500;
  z-index: 1;
}

.dev-issue-reporter .dir-toolbar {
  display: flex;
  gap: 4px;
  align-items: center;
  padding: 4px 8px;
}

.dev-issue-reporter .dir-toolbar-btn {
  background: transparent;
  border: none;
  color: var(--gh-text-muted);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s, color 0.2s;
}

.dev-issue-reporter .dir-toolbar-btn:hover {
  background-color: var(--gh-btn-secondary-hover);
  color: var(--gh-text-default);
}

.dev-issue-reporter .dir-editor-body {
  display: flex;
  flex-direction: column;
  min-height: 180px;
  background-color: var(--gh-bg-default);
}

.dev-issue-reporter .dir-textarea {
  flex: 1;
  width: 100%;
  min-height: 140px;
  display: block;
  margin: 0;
  background-color: var(--gh-bg-default);
  border: none;
  padding: 12px;
  font-family: var(--gh-font-sans);
  font-size: 13px;
  line-height: 1.5;
  color: var(--gh-text-default);
  resize: vertical;
  outline: none;
}

.dev-issue-reporter .dir-textarea::placeholder {
  color: var(--gh-text-muted);
}

.dev-issue-reporter .dir-preview-area {
  padding: 12px;
  min-height: 140px;
  max-height: 280px;
  overflow-y: auto;
  font-size: 13px;
  background-color: var(--gh-bg-default);
}

.dev-issue-reporter .gh-markdown-body {
  color: var(--gh-text-default);
}

.dev-issue-reporter .gh-markdown-body p {
  margin: 0 0 10px 0;
  line-height: 1.5;
}

.dev-issue-reporter .dir-metadata-card {
  background-color: var(--gh-bg-overlay);
  border: 1px solid var(--gh-border-default);
  border-radius: 6px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.dev-issue-reporter .dir-metadata-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 12px;
}

.dev-issue-reporter .dir-metadata-label {
  font-size: 10px;
  font-weight: 500;
  color: var(--gh-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  width: 90px;
  flex-shrink: 0;
  padding-top: 2px;
  text-box: trim-both cap alphabetic;
}

.dev-issue-reporter .dir-metadata-value {
  font-family: var(--gh-font-mono);
  font-size: 11px;
  color: var(--gh-text-default);
  word-break: break-all;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
}

.dev-issue-reporter .dir-chip-tertiary {
  background-color: var(--gh-chip-bg);
  color: var(--gh-chip-text);
  border: 1px solid var(--gh-chip-border);
  padding: 1px 6px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  display: inline-block;
  text-box: trim-both cap alphabetic;
}

.dev-issue-reporter .dir-chip-primary {
  background-color: rgba(56, 139, 253, 0.1);
  color: #58a6ff;
  border: 1px solid rgba(56, 139, 253, 0.3);
  padding: 1px 6px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  display: inline-block;
  text-box: trim-both cap alphabetic;
}

.dev-issue-reporter .dir-details {
  border: 1px solid var(--gh-border-default);
  border-radius: 6px;
  background-color: var(--gh-bg-default);
  margin-top: 4px;
}

.dev-issue-reporter .dir-details summary {
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 500;
  color: var(--gh-text-default);
  cursor: pointer;
  user-select: none;
  background-color: var(--gh-bg-overlay);
  border-radius: 6px;
}

.dev-issue-reporter .dir-details[open] summary {
  border-bottom: 1px solid var(--gh-border-default);
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}

.dev-issue-reporter .dir-details-content {
  padding: 8px 10px;
  max-height: 100px;
  overflow-y: auto;
  font-family: var(--gh-font-mono);
  font-size: 10px;
  color: var(--gh-text-muted);
  white-space: pre-wrap;
  word-break: break-all;
  line-height: 1.4;
}

.dev-issue-reporter .dir-actions {
  display: flex;
  gap: 8px;
  justify-content: space-between;
}

.dev-issue-reporter .dir-btn {
  font-family: var(--gh-font-sans);
  font-size: 12px;
  font-weight: 500;
  border-radius: 6px;
  padding: 6px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: background-color 0.2s, border-color 0.2s;
  border: 1px solid transparent;
  outline: none;
}

.dev-issue-reporter .dir-btn-inspect {
  background-color: var(--gh-btn-secondary-bg);
  border-color: var(--gh-btn-secondary-border);
  color: var(--gh-text-default);
}

.dev-issue-reporter .dir-btn-inspect:hover:not(:disabled) {
  background-color: var(--gh-btn-secondary-hover);
}

.dev-issue-reporter .dir-btn-inspect.active {
  background-color: var(--gh-btn-active-bg);
  border-color: var(--gh-btn-active-border);
  color: var(--gh-text-link);
}

.dev-issue-reporter .dir-btn-submit {
  background-color: var(--gh-btn-primary-bg);
  color: white;
  border: 1px solid var(--gh-btn-primary-border);
}

.dev-issue-reporter .dir-btn-submit:hover:not(:disabled) {
  background-color: var(--gh-btn-primary-hover);
}

.dev-issue-reporter .dir-btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.dev-issue-reporter .dir-editor-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 10px;
  border-top: 1px solid var(--gh-border-default);
  background-color: var(--gh-bg-overlay);
}

.dev-issue-reporter .dir-markdown-tip {
  font-size: 11px;
  color: var(--gh-text-muted);
  display: flex;
  align-items: center;
  gap: 4px;
}

.dev-issue-reporter .dir-markdown-tip svg {
  color: var(--gh-text-muted);
}
`;
