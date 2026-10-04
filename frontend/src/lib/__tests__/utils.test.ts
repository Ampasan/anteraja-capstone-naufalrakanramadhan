import { describe, expect, it } from 'vitest';
import { cn } from '../utils';

describe('cn', () => {
  it('mengabaikan nilai falsy', () => {
    expect(cn('p-2', false, undefined, null, 0)).toBe('p-2');
  });

  it('kelas konflik diselesaikan oleh kelas terakhir', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });

  it('kelas yang tidak berkonflik tetap dipertahankan', () => {
    const result = cn('p-2', 'm-4').split(' ');

    expect(result).toContain('p-2');
    expect(result).toContain('m-4');
  });

  it('menerima array dan objek kondisional', () => {
    const result = cn(['p-2', { hidden: true, block: false }]).split(' ');

    expect(result).toContain('p-2');
    expect(result).toContain('hidden');
    expect(result).not.toContain('block');
  });
});
