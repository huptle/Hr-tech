/** Normalize Indian mobile numbers to E.164 (+91…). */

export function normalizeIndianPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;

  let national = digits;
  if (national.startsWith("91") && national.length >= 12) {
    national = national.slice(2);
  }
  if (national.startsWith("0") && national.length === 11) {
    national = national.slice(1);
  }

  if (national.length !== 10) return null;
  if (!/^[6-9]/.test(national)) return null;

  return `+91${national}`;
}

export function isIndianPhone(raw: string): boolean {
  return normalizeIndianPhone(raw) !== null;
}
