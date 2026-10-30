export function todayIso(): string {
  return new Date().toISOString().split("T")[0];
}

export function docNo(prefix: string): string {
  const d = new Date();
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `${prefix}-${stamp}-${rand}`;
}
