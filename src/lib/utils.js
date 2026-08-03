/**
 * Simple utility to join classnames conditionally.
 * Replaces the need for external packages like clsx or classnames,
 * keeping the application lean and direct.
 */
export function cn(...inputs) {
  return inputs
    .flat(Infinity)
    .filter((item) => typeof item === "string" && item.trim() !== "")
    .join(" ");
}
