/**
 * Safely extracts level-1 primitive values from props,
 * redacts sensitive information, and truncates long strings.
 */
export function sanitizeProps(
  props: any,
  customRedactionKeys?: (string | RegExp)[]
): Record<string, any> | null {
  if (!props || typeof props !== "object") return null;

  const sanitized: Record<string, any> = {};
  const defaultSensitiveRegex = /token|auth|password|secret|key/i;

  const isSensitive = (key: string): boolean => {
    if (defaultSensitiveRegex.test(key)) return true;
    if (customRedactionKeys) {
      return customRedactionKeys.some(pattern => {
        if (pattern instanceof RegExp) {
          return pattern.test(key);
        }
        return key.toLowerCase().includes(pattern.toLowerCase());
      });
    }
    return false;
  };

  for (const key of Object.keys(props)) {
    // Skip internal React properties, children, ref
    if (key === "children" || key === "key" || key === "ref") {
      continue;
    }

    const val = props[key];

    // Redact sensitive keys
    if (isSensitive(key)) {
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
