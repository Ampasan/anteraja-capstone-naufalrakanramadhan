import { describe, expect, it } from 'vitest';
import {
  OPERATIONAL_NOW_ISO,
  operationalNow,
  operationalNowMs,
} from '../operationalClock';

describe('operationalClock', () => {
  it('membekukan "sekarang" pada konstanta ISO yang sama', () => {
    expect(operationalNowMs()).toBe(Date.parse(OPERATIONAL_NOW_ISO));
    expect(operationalNow().getTime()).toBe(Date.parse(OPERATIONAL_NOW_ISO));
  });

  it('mengembalikan objek Date baru tiap panggilan', () => {
    const first = operationalNow();
    first.setHours(0, 0, 0, 0);

    expect(operationalNow().getTime()).toBe(Date.parse(OPERATIONAL_NOW_ISO));
    expect(operationalNow()).not.toBe(first);
  });
});
