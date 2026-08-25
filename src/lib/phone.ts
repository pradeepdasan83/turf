// India-only phone number validation & normalization.
// Valid Indian mobile: 10 digits starting 6-9, optionally prefixed with +91 / 91 / 0.

export interface NormalizedPhone {
  valid: boolean;
  // 10-digit local number (e.g. "9876543210")
  local: string;
  // E.164 form (e.g. "+919876543210")
  e164: string;
  error?: string;
}

export function normalizeIndianPhone(input: string): NormalizedPhone {
  const digits = String(input || '').replace(/[^0-9]/g, '');

  // Strip country/trunk prefixes down to the 10-digit subscriber number
  let local = digits;
  if (local.length === 12 && local.startsWith('91')) local = local.slice(2);
  else if (local.length === 11 && local.startsWith('0')) local = local.slice(1);

  if (local.length !== 10) {
    return { valid: false, local, e164: '', error: 'Enter a valid 10-digit Indian mobile number' };
  }
  if (!/^[6-9]/.test(local)) {
    return { valid: false, local, e164: '', error: 'Indian mobile numbers start with 6, 7, 8 or 9' };
  }

  return { valid: true, local, e164: `+91${local}` };
}
