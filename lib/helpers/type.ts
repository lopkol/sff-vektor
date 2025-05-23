export function camelToSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter: string) => `_${letter.toLowerCase()}`);
}

export function emptyObject<T extends Record<string, unknown>>(
  obj: T,
): boolean {
  return (Object.keys(obj).length === 0 ||
    Object.values(obj).every((value) => value === undefined));
}

// https://stackoverflow.com/questions/17380845/how-do-i-convert-a-string-to-enum-in-typescript/41548441#41548441
/**
 * Helper that transforms a string to an enum, returns undefined if the string is not among the enum values
 * Usage: enumFromString<MyEnum>(MyEnum, 'boo')
 * @param {{[p: string]: string}} enm
 * @param {string} value
 * @returns {T | undefined}
 */
export function enumFromString<T>(
  enm: { [s: string]: string },
  value: string,
): T | undefined {
  return (Object.values(enm) as unknown as string[]).includes(value)
    ? (value as unknown as T)
    : undefined;
}

export function isUuidv7(uuid: string): boolean {
  return /^[0-9A-F]{8}-[0-9A-F]{4}-7[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i
    .test(uuid);
}

type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

/**
 * Helper function to tell the compiler that the object is mutable.
 * This is a workaround: Slonik returns a list of items marked as readonly.
 * @reference https://github.com/gajus/slonik/issues/218#issuecomment-2400447053
 * @example
 * mutable(connection.query(sql.type(z.unknown())`select * from "table_name"`));
 */
export function mutable<T>(value: T): Mutable<T> {
  return value as Mutable<T>;
}
