/**
 * Tiny safe token substitution helper for memory descriptions and reactions.
 * Replaces tokens like {count}, {hours}, {days}, {timeBucket}, {stageName}, {secretName}
 */
export function formatTemplate(
  template: string,
  tokens: Record<string, string | number | undefined>
): string {
  if (!template) return '';
  return template.replace(/\{([a-zA-Z0-9_-]+)\}/g, (match, key) => {
    const val = tokens[key];
    if (val !== undefined && val !== null) {
      return String(val);
    }
    return match;
  });
}
