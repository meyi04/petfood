import { describe, expect, test } from 'vitest';
import { distanceInKm } from '@/utils/distance';

describe('distanceInKm', () => {
  test('returns zero for the same valid location', () => {
    expect(distanceInKm({ lat: 14.6, lng: 121.0 }, { lat: 14.6, lng: 121.0 })).toBe(0);
  });

  test('calculates the distance between two locations in kilometers', () => {
    expect(distanceInKm({ lat: 0, lng: 0 }, { lat: 0, lng: 1 })).toBeCloseTo(111.2, 0);
  });

  test('rejects invalid coordinates and default empty store coordinates', () => {
    expect(distanceInKm({ lat: 1, lng: 1 }, { lat: 0, lng: 0 })).toBeNull();
    expect(distanceInKm({ lat: 91, lng: 0 }, { lat: 1, lng: 1 })).toBeNull();
  });
});
