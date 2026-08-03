import React from "react";

// Simple parser for inline code, bold, italic, and links
export function parseInlineMarkdown(text: string): React.ReactNode[] {
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;
  const parts = text.split(regex);
  return parts.map((part, idx) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={idx}
          style={{
            background: "#21262d",
            padding: "2px 4px",
            borderRadius: "4px",
            fontSize: "11px",
            fontFamily: "var(--gh-font-mono)",
            color: "#e6edf3",
            border: "1px solid var(--gh-border-default)",
          }}
        >
          {part.slice(1, -1)}
        </code>
      );
    } else if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={idx} style={{ fontWeight: 600 }}>{part.slice(2, -2)}</strong>;
    } else if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={idx} style={{ fontStyle: "italic" }}>{part.slice(1, -1)}</em>;
    } else if (part.startsWith("[") && part.includes("](")) {
      const match = part.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (match) {
        const [, linkText, url] = match;
        return (
          <a
            key={idx}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--gh-text-link)", textDecoration: "none" }}
          >
            {linkText}
          </a>
        );
      }
    }
    return part;
  });
}

export function renderMarkdown(md: string): React.ReactNode {
  if (!md.trim()) {
    return (
      <p style={{ color: "var(--gh-text-muted)", fontStyle: "italic", fontSize: "13px", margin: 0 }}>
        Nothing to preview
      </p>
    );
  }

  const lines = md.split("\n");
  let inCodeBlock = false;
  let codeBlockLines: string[] = [];
  let currentListItems: React.ReactNode[] = [];
  const elements: React.ReactNode[] = [];

  const flushList = (key: string | number) => {
    if (currentListItems.length > 0) {
      elements.push(
        <ul key={`list-${key}`} style={{ margin: "8px 0", paddingLeft: "20px", listStyleType: "disc" }}>
          {currentListItems}
        </ul>
      );
      currentListItems = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("```")) {
      flushList(i);
      if (inCodeBlock) {
        elements.push(
          <pre
            key={`code-${i}`}
            style={{
              background: "#161b22",
              border: "1px solid var(--gh-border-default)",
              padding: "12px",
              borderRadius: "6px",
              fontSize: "12px",
              fontFamily: "var(--gh-font-mono)",
              overflowX: "auto",
              margin: "8px 0",
            }}
          >
            <code>{codeBlockLines.join("\n")}</code>
          </pre>
        );
        codeBlockLines = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      continue;
    }

    if (line.startsWith("- ") || line.startsWith("* ")) {
      currentListItems.push(
        <li
          key={`li-${i}`}
          style={{
            fontSize: "13px",
            marginBottom: "4px",
            color: "var(--gh-text-default)",
          }}
        >
          {parseInlineMarkdown(line.slice(2))}
        </li>
      );
    } else {
      flushList(i);

      if (line.startsWith("# ")) {
        elements.push(
          <h1
            key={i}
            style={{
              fontSize: "18px",
              fontWeight: 600,
              borderBottom: "1px solid var(--gh-border-default)",
              paddingBottom: "6px",
              margin: "12px 0 8px 0",
              color: "var(--gh-text-default)",
            }}
          >
            {parseInlineMarkdown(line.slice(2))}
          </h1>
        );
      } else if (line.startsWith("## ")) {
        elements.push(
          <h2
            key={i}
            style={{
              fontSize: "16px",
              fontWeight: 600,
              borderBottom: "1px solid var(--gh-border-default)",
              paddingBottom: "4px",
              margin: "12px 0 8px 0",
              color: "var(--gh-text-default)",
            }}
          >
            {parseInlineMarkdown(line.slice(3))}
          </h2>
        );
      } else if (line.startsWith("### ")) {
        elements.push(
          <h3
            key={i}
            style={{
              fontSize: "14px",
              fontWeight: 600,
              margin: "12px 0 8px 0",
              color: "var(--gh-text-default)",
            }}
          >
            {parseInlineMarkdown(line.slice(4))}
          </h3>
        );
      } else if (!line.trim()) {
        elements.push(<div key={i} style={{ height: "8px" }} />);
      } else {
        elements.push(
          <p
            key={i}
            style={{
              fontSize: "13px",
              margin: "4px 0",
              lineHeight: "1.5",
              color: "var(--gh-text-default)",
            }}
          >
            {parseInlineMarkdown(line)}
          </p>
        );
      }
    }
  }

  flushList("end");

  return <div className="gh-markdown-body">{elements}</div>;
}
