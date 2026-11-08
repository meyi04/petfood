import { describe, expect, test } from 'vitest';
import { formatCurrency } from '@/utils/format';

describe('currency formatting', () => {
  test('formats amounts as Philippine pesos', () => {
    expect(formatCurrency(1234.5)).toBe('₱1,234.50');
    expect(formatCurrency(0)).toBe('₱0.00');
  });
});
