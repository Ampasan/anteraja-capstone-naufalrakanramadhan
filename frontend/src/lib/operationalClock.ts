export const OPERATIONAL_NOW_ISO = '2026-10-03T14:00:00+07:00';

export function operationalNow(): Date {
  return new Date(OPERATIONAL_NOW_ISO);
}

export function operationalNowMs(): number {
  return Date.parse(OPERATIONAL_NOW_ISO);
}
