export function IsArray(object: Object): boolean {
  return Array.isArray(object);
}

export function IsObject(object: Record<string, unknown>): boolean {
  return typeof object === 'object';
}
