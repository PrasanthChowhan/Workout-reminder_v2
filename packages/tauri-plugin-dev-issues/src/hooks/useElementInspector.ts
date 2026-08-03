import { useState, useEffect } from "react";
import { extractFiberMetadata, FiberMetadata } from "../utils/fiber";

interface UseElementInspectorProps {
  maxStackDepth: number;
}

export function useElementInspector({ maxStackDepth }: UseElementInspectorProps) {
  const [isInspecting, setIsInspecting] = useState(false);
  const [inspectedMeta, setInspectedMeta] = useState<FiberMetadata | null>(null);
  const [inspectedDetails, setInspectedDetails] = useState<{
    selector: string;
    textContent: string;
  } | null>(null);

  useEffect(() => {
    if (!isInspecting) return;

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest(".dev-issue-reporter")) return;
      target.style.outline = "2px solid #2f81f7"; // GitHub blue outline
      target.style.outlineOffset = "-2px";
      target.style.cursor = "crosshair";
    };

    const handleMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest(".dev-issue-reporter")) return;
      target.style.outline = "";
      target.style.outlineOffset = "";
      target.style.cursor = "";
    };

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest(".dev-issue-reporter")) return;

      e.preventDefault();
      e.stopPropagation();

      // Reset cursor and outlines
      target.style.outline = "";
      target.style.outlineOffset = "";
      target.style.cursor = "";

      // CSS Selector construction
      const tag = target.tagName.toLowerCase();
      const id = target.id ? `#${target.id}` : "";
      
      let classStr = "";
      if (typeof target.className === "string") {
        classStr = target.className;
      } else if (target.className && typeof (target.className as any).baseVal === "string") {
        classStr = (target.className as any).baseVal;
      }
      const classes = classStr.trim() ? `.${classStr.trim().split(/\s+/).join(".")}` : "";
      
      const textContent = target.textContent?.slice(0, 80).trim() || "";

      // Extract fiber metadata
      const fiberMeta = extractFiberMetadata(target, maxStackDepth);

      if (fiberMeta) {
        setInspectedMeta(fiberMeta);
      } else {
        setInspectedMeta(null);
      }

      setInspectedDetails({
        selector: `${tag}${id}${classes}`,
        textContent,
      });

      setIsInspecting(false);
    };

    document.addEventListener("mouseover", handleMouseOver);
    document.addEventListener("mouseout", handleMouseOut);
    document.addEventListener("click", handleClick, { capture: true });

    return () => {
      document.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("mouseout", handleMouseOut);
      document.removeEventListener("click", handleClick, { capture: true });

      // Clean up any stray styles
      document.querySelectorAll("*").forEach(el => {
        const htmlEl = el as HTMLElement;
        if (htmlEl.style.outline.includes("rgb(47, 129, 247)") || htmlEl.style.outline.includes("#2f81f7") || htmlEl.style.cursor === "crosshair") {
          htmlEl.style.outline = "";
          htmlEl.style.outlineOffset = "";
          htmlEl.style.cursor = "";
        }
      });
    };
  }, [isInspecting, maxStackDepth]);

  return {
    isInspecting,
    setIsInspecting,
    inspectedMeta,
    setInspectedMeta,
    inspectedDetails,
    setInspectedDetails,
  };
}
