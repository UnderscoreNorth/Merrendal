export function pText(txt: string, data: Record<string, any>) {
  for (const key of Object.keys(data)) {
    txt = txt.replaceAll(`{{${key}}}`, data[key]);
  }

  return txt;
}
