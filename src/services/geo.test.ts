import { formatDistance, haversineMeters } from './geo';

describe('geo helpers', () => {
  it('returns zero for the same coordinate', () => {
    expect(haversineMeters(51.5074, -0.1278, 51.5074, -0.1278)).toBe(0);
  });

  it('calculates a useful distance between nearby coordinates', () => {
    const distance = haversineMeters(51.5074, -0.1278, 51.5083, -0.1278);
    expect(distance).toBeGreaterThan(90);
    expect(distance).toBeLessThan(110);
  });

  it('formats metres and kilometres for the UI', () => {
    expect(formatDistance(245)).toBe('245m');
    expect(formatDistance(1_250)).toBe('1.3km');
  });

  it('formats miles when selected', () => {
    expect(formatDistance(1_609.344, 'miles')).toBe('1.0 mi');
  });
});
