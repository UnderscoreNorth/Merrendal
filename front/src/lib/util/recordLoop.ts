export function recordLoop<T extends object>(
  obj: T,
): Array<[keyof T, T[keyof T]]> {
  return Object.entries(obj) as Array<[keyof T, T[keyof T]]>;
}
export const getKeys = Object.keys as <T extends object>(
  obj: T,
) => Array<keyof T>;
