import { beforeEach, describe, expect, it, vi } from 'vitest';
import { journeyOrigin, measure, metresBetween, travel } from '../courierJourney';
import type { LatLng } from '../../features/monitoring/types';

const START: LatLng = { lat: -6.2, lng: 106.8 };
const MID: LatLng = { lat: -6.2, lng: 106.8005 };
const END: LatLng = { lat: -6.2, lng: 106.801 };

beforeEach(() => {
  sessionStorage.clear();
});

describe('metresBetween', () => {
  it('mengubah selisih koordinat menjadi meter', () => {
    const distance = metresBetween(START, END);

    // 0,001 derajat bujur di lintang 6° selatan setara sekitar 111 meter.
    expect(distance).toBeGreaterThan(105);
    expect(distance).toBeLessThan(116);
  });

  it('jarak ke titik yang sama nol', () => {
    expect(metresBetween(START, START)).toBe(0);
  });
});

describe('journeyOrigin', () => {
  it('titik awal pertama menang meski posisi server sudah berganti', () => {
    expect(journeyOrigin('HLM-010', START)).toEqual(START);
    expect(journeyOrigin('HLM-010', END)).toEqual(START);
  });

  it('titik awal selamat dari muat ulang halaman', async () => {
    journeyOrigin('HLM-011', START);

    vi.resetModules();
    const reloaded = await import('../courierJourney');

    expect(reloaded.journeyOrigin('HLM-011', END)).toEqual(START);
  });

  it('kurir tanpa catatan memakai posisi yang sedang dikirim server', () => {
    expect(journeyOrigin('HLM-012', END)).toEqual(END);
  });
});

describe('measure', () => {
  const journey = measure([START, MID, END]);

  it('menumpuk jarak kumulatif dari nol sampai panjang total', () => {
    expect(journey.cumulative).toHaveLength(3);
    expect(journey.cumulative[0]).toBe(0);
    expect(journey.cumulative[1]).toBeCloseTo(journey.total / 2, 6);
    expect(journey.total).toBeCloseTo(2 * metresBetween(START, MID), 6);
  });
});

describe('travel', () => {
  const journey = measure([START, MID, END]);

  it('berangkat dari titik awal dengan seluruh rute masih di depan', () => {
    const atStart = travel(journey, 0);

    expect(atStart.point).toEqual(START);
    expect(atStart.remaining).toHaveLength(3);
    expect(atStart.remaining[0]).toBe(atStart.point);
    expect(atStart.remaining[2]).toEqual(END);
  });

  it('berhenti di titik drop ketika jarak melewati panjang rute', () => {
    const atEnd = travel(journey, journey.total + 500);

    expect(atEnd.point.lat).toBeCloseTo(END.lat, 9);
    expect(atEnd.point.lng).toBeCloseTo(END.lng, 9);
    expect(atEnd.remaining).toEqual([atEnd.point]);
  });

  it('sisa rute selalu diawali posisi penanda dan diakhiri titik drop', () => {
    const halfway = travel(journey, journey.total / 2);

    expect(halfway.point.lng).toBeCloseTo(MID.lng, 6);
    expect(halfway.remaining[0]).toBe(halfway.point);
    expect(halfway.remaining).toHaveLength(2);
    expect(halfway.remaining[1]).toEqual(END);
  });

  it('penanda yang tepat di titik belok tidak mengulang titik itu', () => {
    const atVertex = travel(journey, journey.cumulative[1]);

    expect(atVertex.point.lng).toBeCloseTo(MID.lng, 6);
    expect(atVertex.remaining).toHaveLength(2);
    expect(atVertex.remaining[0]).toBe(atVertex.point);
    expect(atVertex.remaining[1]).toEqual(END);
  });

  it('jarak negatif dianggap masih di titik awal', () => {
    expect(travel(journey, -999).point).toEqual(START);
  });
});
