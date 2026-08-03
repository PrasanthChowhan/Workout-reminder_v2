/**
 * Safely extracts level-1 primitive values from props,
 * redacts sensitive information, and truncates long strings.
 */
export function sanitizeProps(props: any): Record<string, any> | null {
  if (!props || typeof props !== "object") return null;

  const sanitized: Record<string, any> = {};
  const sensitiveRegex = /token|auth|password|secret|key|user/i;

  for (const key of Object.keys(props)) {
    // Skip internal React properties, children, ref
    if (key === "children" || key === "key" || key === "ref") {
      continue;
    }

    const val = props[key];

    // Redact sensitive keys
    if (sensitiveRegex.test(key)) {
      sanitized[key] = "[REDACTED]";
      continue;
    }

    if (val === null || val === undefined) {
      sanitized[key] = val;
      continue;
    }

    const type = typeof val;
    if (type === "string") {
      sanitized[key] = val.length > 100 ? `${val.slice(0, 100)}...` : val;
    } else if (type === "number" || type === "boolean") {
      sanitized[key] = val;
    }
    // Objects, arrays, functions, and nested structures are dropped to keep it simple and shallow
  }

  return Object.keys(sanitized).length > 0 ? sanitized : null;
}
