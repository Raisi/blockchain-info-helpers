export async function sha256hex(hex: string): Promise<string> {
  const bytes = new Uint8Array(
    (hex.match(/.{2}/g) || []).map((b) => parseInt(b, 16))
  );
  const buf = await crypto.subtle.digest("SHA-256", bytes as unknown as ArrayBuffer);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function h2b(hex: string): string {
  return hex
    .split("")
    .map((h) => parseInt(h, 16).toString(2).padStart(4, "0"))
    .join("");
}

export function b2hN(bin: string, bits: number): string {
  const p = bin.padEnd(bits, "0").slice(0, bits);
  let h = "";
  for (let i = 0; i < p.length; i += 4) {
    h += parseInt(p.slice(i, i + 4), 2).toString(16);
  }
  return h;
}

export function randHex(n: number): string {
  const a = new Uint8Array(n);
  crypto.getRandomValues(a);
  return Array.from(a)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function chk(s: string, n: number): string[] {
  const r: string[] = [];
  for (let i = 0; i < s.length; i += n) {
    r.push(s.slice(i, i + n));
  }
  return r;
}
