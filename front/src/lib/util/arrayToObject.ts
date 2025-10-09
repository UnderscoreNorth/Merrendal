export function arrayToObject<T extends { id: PropertyKey }>(array: T[]) {
  return Object.fromEntries(array.map((item) => [item.id, item])) as {
    [K in T["id"]]: Extract<T, { id: K }>;
  };
}
