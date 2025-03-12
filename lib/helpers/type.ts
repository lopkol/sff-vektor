export function camelToSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter: string) => `_${letter.toLowerCase()}`);
}

export function emptyObject<T extends Record<string, unknown>>(
  obj: T,
): boolean {
  return (Object.keys(obj).length === 0 ||
    Object.values(obj).every((value) => value === undefined));
}
