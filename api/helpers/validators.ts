export function isUuidv7(uuid: string): boolean {
  return /^[0-9A-F]{8}-[0-9A-F]{4}-7[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i
    .test(uuid);
}
