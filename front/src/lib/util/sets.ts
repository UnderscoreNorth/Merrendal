export function addSet(arr: string[], val: string) {
  if (!arr.includes(val)) arr.push(val);
  return arr;
}

export function delSet(arr: string[], val: string) {
  let index = arr.indexOf(val);
  if (index >= 0) arr.splice(index, 1);
  return arr;
}
