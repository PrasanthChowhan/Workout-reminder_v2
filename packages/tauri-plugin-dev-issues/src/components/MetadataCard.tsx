import { FiberMetadata } from "../utils/fiber";

interface MetadataCardProps {
  inspectedMeta: FiberMetadata | null;
  inspectedDetails: {
    selector: string;
    textContent: string;
  } | null;
}

export function MetadataCard({ inspectedMeta, inspectedDetails }: MetadataCardProps) {
  if (!inspectedMeta && !inspectedDetails) return null;

  return (
    <div className="dir-metadata-card">
      {inspectedMeta && (
        <div className="dir-metadata-row">
          <span className="dir-metadata-label">Component</span>
          <span className="dir-metadata-value">
            <span className="dir-chip-tertiary">
              {inspectedMeta.componentName}
            </span>
          </span>
        </div>
      )}

      {inspectedMeta && inspectedMeta.sourceFile && (
        <div className="dir-metadata-row">
          <span className="dir-metadata-label">Source</span>
          <span className="dir-metadata-value">
            <span className="dir-chip-primary">
              {inspectedMeta.sourceFile}:{inspectedMeta.lineNumber}
            </span>
          </span>
        </div>
      )}

      {inspectedDetails && (
        <div className="dir-metadata-row">
          <span className="dir-metadata-label">Selector</span>
          <span className="dir-metadata-value">
            {inspectedDetails.selector}
          </span>
        </div>
      )}

      {inspectedMeta && inspectedMeta.componentStack && inspectedMeta.componentStack.length > 0 && (
        <details className="dir-details">
          <summary>Component Hierarchy Stack</summary>
          <div className="dir-details-content">
            {inspectedMeta.componentStack.join(" → ")}
          </div>
        </details>
      )}
    </div>
  );
}
