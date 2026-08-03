export interface FiberMetadata {
  componentName: string;
  sourceFile: string;
  lineNumber: number;
  componentStack: string[];
  memoizedProps: any | null;
}

/**
 * Normalizes absolute file paths to repository-relative paths
 * (e.g. E:/projects/Workout/src/App.jsx -> src/App.jsx)
 */
export function cleanFilePath(path: string): string {
  if (!path) return "";
  const normalized = path.replace(/\\/g, "/");
  const match = normalized.match(/(?:^|\/)(src|packages)\/(.+)$/);
  if (match) {
    return `${match[1]}/${match[2]}`;
  }
  return normalized;
}

/**
 * Extracts React Fiber metadata from a clicked DOM element.
 */
export function extractFiberMetadata(domElement: HTMLElement, maxStackDepth: number = 15): FiberMetadata | null {
  try {
    // 1. Walk up the DOM tree if needed to find the nearest element with a React fiber node
    let currentEl: HTMLElement | null = domElement;
    let fiber: any = null;
    let fiberKey: string | null = null;

    while (currentEl) {
      fiberKey = Object.keys(currentEl).find(key => key.startsWith("__reactFiber$")) || null;
      if (fiberKey) {
        fiber = (currentEl as any)[fiberKey];
        break;
      }
      currentEl = currentEl.parentElement;
    }

    if (!fiber) {
      return null;
    }

    // 2. Walk the fiber chain to construct the component hierarchy and find debugSource / props
    let currentFiber = fiber;
    let depth = 0;
    const componentStack: string[] = [];
    let sourceFile = "";
    let lineNumber = 0;
    let componentProps: any = null;
    let primaryComponentName = "";

    while (currentFiber && depth < maxStackDepth) {
      const type = currentFiber.type;
      const elementType = currentFiber.elementType;
      let name = "";

      if (type) {
        if (typeof type === "function") {
          name = type.name || type.displayName || "";
        } else if (typeof type === "string") {
          name = type;
        } else if (type.render && typeof type.render === "function") {
          name = type.render.name || type.displayName || "";
        }
      }

      if (!name && elementType) {
        if (typeof elementType === "function") {
          name = elementType.name || elementType.displayName || "";
        } else if (typeof elementType === "string") {
          name = elementType;
        }
      }

      // If it is a capital-letter component (React component)
      if (name && /^[A-Z]/.test(name)) {
        if (!primaryComponentName) {
          primaryComponentName = name;
        }
        componentStack.push(name);

        // Capture closest React component props
        if (!componentProps && currentFiber.memoizedProps) {
          componentProps = currentFiber.memoizedProps;
        }
      }

      // Capture source code mapping details
      if (!sourceFile && currentFiber._debugSource) {
        sourceFile = currentFiber._debugSource.fileName || "";
        lineNumber = currentFiber._debugSource.lineNumber || 0;
      }

      currentFiber = currentFiber.return;
      depth++;
    }

    return {
      componentName: primaryComponentName || "UnknownComponent",
      sourceFile: cleanFilePath(sourceFile),
      lineNumber,
      componentStack,
      memoizedProps: componentProps,
    };
  } catch (error) {
    console.warn("Failed to extract fiber metadata:", error);
    return null;
  }
}
