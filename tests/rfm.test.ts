import { describe, it, expect } from 'vitest';
import {
  scoreRecency,
  scoreFrequency,
  scoreMonetary,
  calculateRFMScore,
  getRFMTier,
  CURRENCY_PRESETS,
} from '../src/rfm.js';
import type { RFMConfig } from '../src/types.js';

// ─── scoreRecency ──────────────────────────────────────────────────────────────

describe('scoreRecency', () => {
  it('scores 5 for same-day purchase (0 days)', () => {
    expect(scoreRecency(0)).toBe(5);
  });

  it('scores 5 at the exact upper boundary (7 days)', () => {
    expect(scoreRecency(7)).toBe(5);
  });

  it('scores 4 one day past the 5-boundary (8 days)', () => {
    expect(scoreRecency(8)).toBe(4);
  });

  it('scores 4 at the exact upper boundary (30 days)', () => {
    expect(scoreRecency(30)).toBe(4);
  });

  it('scores 3 one day past the 4-boundary (31 days)', () => {
    expect(scoreRecency(31)).toBe(3);
  });

  it('scores 3 at the exact upper boundary (90 days)', () => {
    expect(scoreRecency(90)).toBe(3);
  });

  it('scores 2 one day past the 3-boundary (91 days)', () => {
    expect(scoreRecency(91)).toBe(2);
  });

  it('scores 2 at the exact upper boundary (180 days)', () => {
    expect(scoreRecency(180)).toBe(2);
  });

  it('scores 1 one day past the 2-boundary (181 days)', () => {
    expect(scoreRecency(181)).toBe(1);
  });

  it('scores 1 for very large day values', () => {
    expect(scoreRecency(730)).toBe(1);
    expect(scoreRecency(3650)).toBe(1);
    expect(scoreRecency(Number.MAX_SAFE_INTEGER)).toBe(1);
  });

  it('accepts fractional days (e.g. 6.5)', () => {
    expect(scoreRecency(6.5)).toBe(5);
    expect(scoreRecency(7.1)).toBe(4);
    expect(scoreRecency(0.001)).toBe(5);
  });

  it('applies custom thresholds', () => {
    const custom = { boundaries: [1, 5, 15, 60] as [number, number, number, number] };
    expect(scoreRecency(0, custom)).toBe(5);
    expect(scoreRecency(1, custom)).toBe(5);
    expect(scoreRecency(2, custom)).toBe(4);
    expect(scoreRecency(5, custom)).toBe(4);
    expect(scoreRecency(10, custom)).toBe(3);
    expect(scoreRecency(20, custom)).toBe(2);
    expect(scoreRecency(61, custom)).toBe(1);
  });

  it('throws RangeError for negative input', () => {
    expect(() => scoreRecency(-1)).toThrow(RangeError);
    expect(() => scoreRecency(-0.001)).toThrow(RangeError);
  });

  it('throws RangeError for NaN', () => {
    expect(() => scoreRecency(NaN)).toThrow(RangeError);
  });

  it('throws RangeError for Infinity', () => {
    expect(() => scoreRecency(Infinity)).toThrow(RangeError);
    expect(() => scoreRecency(-Infinity)).toThrow(RangeError);
  });

  it('error message names the parameter', () => {
    expect(() => scoreRecency(-5)).toThrow(/daysSinceLastPurchase/);
  });

  it('throws RangeError for non-monotone custom boundaries', () => {
    // descending — not valid
    const bad = { boundaries: [90, 30, 7, 1] as [number, number, number, number] };
    expect(() => scoreRecency(10, bad)).toThrow(RangeError);
    expect(() => scoreRecency(10, bad)).toThrow(/strictly-ascending/);
  });

  it('throws RangeError for duplicate boundary values', () => {
    const dup = { boundaries: [7, 7, 90, 180] as [number, number, number, number] };
    expect(() => scoreRecency(10, dup)).toThrow(RangeError);
  });

  it('throws RangeError for negative boundary values', () => {
    const neg = { boundaries: [-1, 7, 30, 90] as [number, number, number, number] };
    expect(() => scoreRecency(10, neg)).toThrow(RangeError);
  });
});

// ─── scoreFrequency ───────────────────────────────────────────────────────────

describe('scoreFrequency', () => {
  it('scores 1 for 0 purchases', () => {
    expect(scoreFrequency(0)).toBe(1);
  });

  it('scores 1 for 1 purchase', () => {
    expect(scoreFrequency(1)).toBe(1);
  });

  it('scores 2 at the lower boundary (2 purchases)', () => {
    expect(scoreFrequency(2)).toBe(2);
  });

  it('scores 2 at 3 purchases', () => {
    expect(scoreFrequency(3)).toBe(2);
  });

  it('scores 3 at the boundary (4 purchases)', () => {
    expect(scoreFrequency(4)).toBe(3);
  });

  it('scores 3 at 6 purchases', () => {
    expect(scoreFrequency(6)).toBe(3);
  });

  it('scores 4 at the boundary (7 purchases)', () => {
    expect(scoreFrequency(7)).toBe(4);
  });

  it('scores 4 at 9 purchases', () => {
    expect(scoreFrequency(9)).toBe(4);
  });

  it('scores 5 at the boundary (10 purchases)', () => {
    expect(scoreFrequency(10)).toBe(5);
  });

  it('scores 5 for very high purchase counts', () => {
    expect(scoreFrequency(100)).toBe(5);
    expect(scoreFrequency(Number.MAX_SAFE_INTEGER)).toBe(5);
  });

  it('applies custom thresholds', () => {
    const custom = { boundaries: [5, 15, 30, 50] as [number, number, number, number] };
    expect(scoreFrequency(4, custom)).toBe(1);
    expect(scoreFrequency(5, custom)).toBe(2);
    expect(scoreFrequency(20, custom)).toBe(3);
    expect(scoreFrequency(30, custom)).toBe(4);
    expect(scoreFrequency(50, custom)).toBe(5);
  });

  it('throws RangeError for negative input', () => {
    expect(() => scoreFrequency(-1)).toThrow(RangeError);
  });

  it('throws RangeError for NaN', () => {
    expect(() => scoreFrequency(NaN)).toThrow(RangeError);
  });

  it('throws RangeError for fractional input', () => {
    expect(() => scoreFrequency(2.5)).toThrow(RangeError);
    expect(() => scoreFrequency(0.1)).toThrow(RangeError);
  });

  it('throws RangeError for Infinity', () => {
    expect(() => scoreFrequency(Infinity)).toThrow(RangeError);
  });

  it('error message names the parameter', () => {
    expect(() => scoreFrequency(2.5)).toThrow(/purchaseCount/);
  });

  it('throws RangeError for non-monotone custom boundaries', () => {
    const bad = { boundaries: [50, 10, 7, 2] as [number, number, number, number] };
    expect(() => scoreFrequency(5, bad)).toThrow(RangeError);
  });
});

// ─── scoreMonetary ────────────────────────────────────────────────────────────

describe('scoreMonetary', () => {
  describe('USD (default)', () => {
    it('scores 1 for $0', () => {
      expect(scoreMonetary(0)).toBe(1);
    });

    it('scores 1 just below the 2-boundary ($49.99)', () => {
      expect(scoreMonetary(49.99)).toBe(1);
    });

    it('scores 2 at the boundary ($50)', () => {
      expect(scoreMonetary(50)).toBe(2);
    });

    it('scores 2 up to just below $200 ($199.99)', () => {
      expect(scoreMonetary(199.99)).toBe(2);
    });

    it('scores 3 at $200', () => {
      expect(scoreMonetary(200)).toBe(3);
    });

    it('scores 3 up to $499.99', () => {
      expect(scoreMonetary(499.99)).toBe(3);
    });

    it('scores 4 at $500', () => {
      expect(scoreMonetary(500)).toBe(4);
    });

    it('scores 4 up to $999.99', () => {
      expect(scoreMonetary(999.99)).toBe(4);
    });

    it('scores 5 at $1,000', () => {
      expect(scoreMonetary(1000)).toBe(5);
    });

    it('scores 5 for very high spend', () => {
      expect(scoreMonetary(50000)).toBe(5);
      expect(scoreMonetary(Number.MAX_SAFE_INTEGER)).toBe(5);
    });
  });

  describe('INR preset', () => {
    it('scores 1 for ₹3,999', () => {
      expect(scoreMonetary(3999, 'INR')).toBe(1);
    });

    it('scores 2 at ₹4,000', () => {
      expect(scoreMonetary(4000, 'INR')).toBe(2);
    });

    it('scores 3 at ₹16,600', () => {
      expect(scoreMonetary(16600, 'INR')).toBe(3);
    });

    it('scores 4 at ₹41,500', () => {
      expect(scoreMonetary(41500, 'INR')).toBe(4);
    });

    it('scores 5 at ₹83,000', () => {
      expect(scoreMonetary(83000, 'INR')).toBe(5);
    });
  });

  describe('USD preset string', () => {
    it('accepts "USD" string and matches default behaviour', () => {
      expect(scoreMonetary(500, 'USD')).toBe(scoreMonetary(500));
      expect(scoreMonetary(999, 'USD')).toBe(scoreMonetary(999));
    });
  });

  describe('custom thresholds', () => {
    it('applies custom boundaries correctly', () => {
      const custom = { boundaries: [100, 500, 1000, 5000] as [number, number, number, number] };
      expect(scoreMonetary(50, custom)).toBe(1);
      expect(scoreMonetary(100, custom)).toBe(2);
      expect(scoreMonetary(500, custom)).toBe(3);
      expect(scoreMonetary(1000, custom)).toBe(4);
      expect(scoreMonetary(5000, custom)).toBe(5);
    });

    it('throws RangeError for non-monotone custom boundaries', () => {
      const bad = { boundaries: [1000, 500, 200, 50] as [number, number, number, number] };
      expect(() => scoreMonetary(100, bad)).toThrow(RangeError);
      expect(() => scoreMonetary(100, bad)).toThrow(/strictly-ascending/);
    });
  });

  it('throws RangeError for negative spend', () => {
    expect(() => scoreMonetary(-1)).toThrow(RangeError);
  });

  it('throws RangeError for NaN', () => {
    expect(() => scoreMonetary(NaN)).toThrow(RangeError);
  });

  it('throws RangeError for unknown currency preset string', () => {
    // @ts-expect-error — intentional runtime test with invalid preset
    expect(() => scoreMonetary(100, 'EUR')).toThrow(RangeError);
  });
});

// ─── getRFMTier ───────────────────────────────────────────────────────────────

describe('getRFMTier', () => {
  const cases: Array<[number, string]> = [
    [3, 'poor'],
    [4, 'poor'],
    [5, 'below-average'],
    [6, 'below-average'],
    [7, 'average'],
    [8, 'average'],
    [9, 'average'],
    [10, 'good'],
    [11, 'good'],
    [12, 'good'],
    [13, 'excellent'],
    [14, 'excellent'],
    [15, 'excellent'],
  ];

  it.each(cases)('score %i → %s', (score, expected) => {
    expect(getRFMTier(score)).toBe(expected);
  });

  it('throws for score below 3', () => {
    expect(() => getRFMTier(2)).toThrow(RangeError);
    expect(() => getRFMTier(0)).toThrow(RangeError);
  });

  it('throws for score above 15', () => {
    expect(() => getRFMTier(16)).toThrow(RangeError);
    expect(() => getRFMTier(100)).toThrow(RangeError);
  });

  it('throws for fractional scores', () => {
    expect(() => getRFMTier(7.5)).toThrow(RangeError);
    expect(() => getRFMTier(12.9)).toThrow(RangeError);
  });

  it('throws for NaN', () => {
    expect(() => getRFMTier(NaN)).toThrow(RangeError);
  });
});

// ─── calculateRFMScore ────────────────────────────────────────────────────────

describe('calculateRFMScore', () => {
  it('computes a correct breakdown for a champion customer', () => {
    const result = calculateRFMScore({
      daysSinceLastPurchase: 5,
      purchaseCount: 8,
      totalSpend: 600,
    });
    expect(result).toEqual({
      recency: 5,
      frequency: 4,
      monetary: 4,
      total: 13,
      tier: 'excellent',
    });
  });

  it('computes best possible score (total = 15)', () => {
    const result = calculateRFMScore({
      daysSinceLastPurchase: 0,
      purchaseCount: 100,
      totalSpend: 10000,
    });
    expect(result.recency).toBe(5);
    expect(result.frequency).toBe(5);
    expect(result.monetary).toBe(5);
    expect(result.total).toBe(15);
    expect(result.tier).toBe('excellent');
  });

  it('computes worst possible score (total = 3)', () => {
    const result = calculateRFMScore({
      daysSinceLastPurchase: 365,
      purchaseCount: 0,
      totalSpend: 0,
    });
    expect(result.recency).toBe(1);
    expect(result.frequency).toBe(1);
    expect(result.monetary).toBe(1);
    expect(result.total).toBe(3);
    expect(result.tier).toBe('poor');
  });

  it('uses INR monetary thresholds via RFMConfig', () => {
    const config: RFMConfig = { monetary: 'INR' };
    const result = calculateRFMScore(
      { daysSinceLastPurchase: 5, purchaseCount: 8, totalSpend: 83000 },
      config,
    );
    expect(result.monetary).toBe(5);
  });

  it('INR borderline: ₹3,000 scores 1 with INR config', () => {
    const result = calculateRFMScore(
      { daysSinceLastPurchase: 5, purchaseCount: 8, totalSpend: 3000 },
      { monetary: 'INR' },
    );
    expect(result.monetary).toBe(1);
  });

  it('total equals sum of the three dimension scores', () => {
    const result = calculateRFMScore({
      daysSinceLastPurchase: 45,
      purchaseCount: 3,
      totalSpend: 150,
    });
    expect(result.total).toBe(result.recency + result.frequency + result.monetary);
  });

  it('tier matches getRFMTier(total)', () => {
    const result = calculateRFMScore({
      daysSinceLastPurchase: 45,
      purchaseCount: 3,
      totalSpend: 150,
    });
    expect(result.tier).toBe(getRFMTier(result.total));
  });

  it('propagates RangeError on invalid input', () => {
    expect(() =>
      calculateRFMScore({
        daysSinceLastPurchase: -1,
        purchaseCount: 5,
        totalSpend: 100,
      }),
    ).toThrow(RangeError);
  });

  it('accepts custom ScoreThresholds via RFMConfig', () => {
    const config: RFMConfig = {
      monetary: { boundaries: [100, 500, 1000, 5000] },
    };
    const result = calculateRFMScore(
      { daysSinceLastPurchase: 5, purchaseCount: 8, totalSpend: 600 },
      config,
    );
    expect(result.monetary).toBe(3); // $600 falls in [500, 1000)
  });
});

// ─── CURRENCY_PRESETS ─────────────────────────────────────────────────────────

describe('CURRENCY_PRESETS', () => {
  it('exports USD and INR presets', () => {
    expect(CURRENCY_PRESETS).toHaveProperty('USD');
    expect(CURRENCY_PRESETS).toHaveProperty('INR');
  });

  it('each preset has exactly 4 boundaries', () => {
    for (const preset of Object.values(CURRENCY_PRESETS)) {
      expect(preset.boundaries).toHaveLength(4);
    }
  });

  it('INR boundaries are strictly larger than USD boundaries', () => {
    const usd = CURRENCY_PRESETS.USD.boundaries;
    const inr = CURRENCY_PRESETS.INR.boundaries;
    for (let i = 0; i < 4; i++) {
      expect(inr[i]).toBeGreaterThan(usd[i]!);
    }
  });

  it('each preset has strictly-ascending boundaries', () => {
    for (const [name, preset] of Object.entries(CURRENCY_PRESETS)) {
      const [b1, b2, b3, b4] = preset.boundaries;
      expect(b2).toBeGreaterThan(b1!);
      expect(b3).toBeGreaterThan(b2!);
      expect(b4).toBeGreaterThan(b3!);
    }
  });
});
