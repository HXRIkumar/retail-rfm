import { describe, it, expect } from 'vitest';
import {
  getLoyaltyTier,
  getTierInfo,
  calculatePoints,
  pointsToNextTier,
  TIER_TABLE,
  TIER_ORDER,
} from '../src/loyalty.js';
import type { LoyaltyTier } from '../src/types.js';

// ─── getLoyaltyTier ───────────────────────────────────────────────────────────

describe('getLoyaltyTier', () => {
  describe('bronze (0 – 4,999)', () => {
    it('0 points → bronze', () => {
      expect(getLoyaltyTier(0)).toBe('bronze');
    });

    it('2,500 points → bronze', () => {
      expect(getLoyaltyTier(2500)).toBe('bronze');
    });

    it('4,999 points → bronze', () => {
      expect(getLoyaltyTier(4999)).toBe('bronze');
    });
  });

  describe('silver (5,000 – 14,999)', () => {
    it('5,000 points → silver', () => {
      expect(getLoyaltyTier(5000)).toBe('silver');
    });

    it('10,000 points → silver', () => {
      expect(getLoyaltyTier(10000)).toBe('silver');
    });

    it('14,999 points → silver', () => {
      expect(getLoyaltyTier(14999)).toBe('silver');
    });
  });

  describe('gold (15,000 – 29,999)', () => {
    it('15,000 points → gold', () => {
      expect(getLoyaltyTier(15000)).toBe('gold');
    });

    it('22,000 points → gold', () => {
      expect(getLoyaltyTier(22000)).toBe('gold');
    });

    it('29,999 points → gold', () => {
      expect(getLoyaltyTier(29999)).toBe('gold');
    });
  });

  describe('platinum (30,000+)', () => {
    it('30,000 points → platinum', () => {
      expect(getLoyaltyTier(30000)).toBe('platinum');
    });

    it('100,000 points → platinum', () => {
      expect(getLoyaltyTier(100000)).toBe('platinum');
    });

    it('1,000,000 points → platinum', () => {
      expect(getLoyaltyTier(1_000_000)).toBe('platinum');
    });
  });

  it('throws RangeError for negative points', () => {
    expect(() => getLoyaltyTier(-1)).toThrow(RangeError);
  });

  it('throws RangeError for NaN', () => {
    expect(() => getLoyaltyTier(NaN)).toThrow(RangeError);
  });

  it('throws RangeError for Infinity', () => {
    expect(() => getLoyaltyTier(Infinity)).toThrow(RangeError);
  });
});

// ─── getTierInfo ──────────────────────────────────────────────────────────────

describe('getTierInfo', () => {
  it('returns info for every tier', () => {
    const tiers: LoyaltyTier[] = ['bronze', 'silver', 'gold', 'platinum'];
    for (const tier of tiers) {
      const info = getTierInfo(tier);
      expect(info.tier).toBe(tier);
      expect(typeof info.label).toBe('string');
      expect(info.label.length).toBeGreaterThan(0);
      expect(typeof info.minPoints).toBe('number');
      expect(info.pointsMultiplier).toBeGreaterThan(0);
      expect(Array.isArray(info.benefits)).toBe(true);
      expect(info.benefits.length).toBeGreaterThan(0);
    }
  });

  it('returns a frozen object', () => {
    expect(Object.isFrozen(getTierInfo('gold'))).toBe(true);
  });

  it('platinum maxPoints is null', () => {
    expect(getTierInfo('platinum').maxPoints).toBeNull();
  });

  it('non-platinum tiers have numeric maxPoints', () => {
    expect(getTierInfo('bronze').maxPoints).toBeTypeOf('number');
    expect(getTierInfo('silver').maxPoints).toBeTypeOf('number');
    expect(getTierInfo('gold').maxPoints).toBeTypeOf('number');
  });

  it('tier minPoints/maxPoints form a contiguous, non-overlapping ladder', () => {
    // bronze.maxPoints === silver.minPoints, etc.
    const bronze = getTierInfo('bronze');
    const silver = getTierInfo('silver');
    const gold = getTierInfo('gold');
    const platinum = getTierInfo('platinum');

    expect(bronze.minPoints).toBe(0);
    expect(bronze.maxPoints).toBe(silver.minPoints);
    expect(silver.maxPoints).toBe(gold.minPoints);
    expect(gold.maxPoints).toBe(platinum.minPoints);
    expect(platinum.maxPoints).toBeNull();
  });

  it('multipliers increase with tier', () => {
    const bronze = getTierInfo('bronze').pointsMultiplier;
    const silver = getTierInfo('silver').pointsMultiplier;
    const gold = getTierInfo('gold').pointsMultiplier;
    const platinum = getTierInfo('platinum').pointsMultiplier;

    expect(silver).toBeGreaterThan(bronze);
    expect(gold).toBeGreaterThan(silver);
    expect(platinum).toBeGreaterThan(gold);
  });

  it('throws RangeError for unknown tier', () => {
    // @ts-expect-error — intentional runtime test
    expect(() => getTierInfo('diamond')).toThrow(RangeError);
  });
});

// ─── calculatePoints ──────────────────────────────────────────────────────────

describe('calculatePoints', () => {
  describe('base rate (multiplier = 1)', () => {
    it('$0 → 0 points', () => {
      expect(calculatePoints(0)).toBe(0);
    });

    it('$100 → 100 points', () => {
      expect(calculatePoints(100)).toBe(100);
    });

    it('$199.99 → 199 points (floors fractional result)', () => {
      expect(calculatePoints(199.99)).toBe(199);
    });

    it('$0.99 → 0 points', () => {
      expect(calculatePoints(0.99)).toBe(0);
    });

    it('$1,000 → 1000 points', () => {
      expect(calculatePoints(1000)).toBe(1000);
    });
  });

  describe('custom multiplier', () => {
    it('$199.99 × 1.5 → 299 points', () => {
      expect(calculatePoints(199.99, 1.5)).toBe(299);
    });

    it('$199.99 × 2 → 399 points', () => {
      expect(calculatePoints(199.99, 2)).toBe(399);
    });

    it('$199.99 × 3 → 599 points', () => {
      expect(calculatePoints(199.99, 3)).toBe(599);
    });

    it('$100 × 1.5 → 150 points', () => {
      expect(calculatePoints(100, 1.5)).toBe(150);
    });

    it('$50.50 × 2 → 101 points', () => {
      expect(calculatePoints(50.50, 2)).toBe(101);
    });

    it('uses tier multipliers from getTierInfo', () => {
      const { pointsMultiplier } = getTierInfo('gold');
      expect(calculatePoints(500, pointsMultiplier)).toBe(
        Math.floor(500 * pointsMultiplier),
      );
    });
  });

  it('throws RangeError for negative spend', () => {
    expect(() => calculatePoints(-1)).toThrow(RangeError);
  });

  it('throws RangeError for NaN spend', () => {
    expect(() => calculatePoints(NaN)).toThrow(RangeError);
  });

  it('throws RangeError for Infinity spend', () => {
    expect(() => calculatePoints(Infinity)).toThrow(RangeError);
  });

  it('throws RangeError for zero multiplier', () => {
    expect(() => calculatePoints(100, 0)).toThrow(RangeError);
  });

  it('throws RangeError for negative multiplier', () => {
    expect(() => calculatePoints(100, -1)).toThrow(RangeError);
  });

  it('throws RangeError for Infinity multiplier', () => {
    expect(() => calculatePoints(100, Infinity)).toThrow(RangeError);
  });

  it('throws RangeError when spend × multiplier overflows to Infinity', () => {
    // Number.MAX_VALUE × 2 = Infinity in IEEE 754
    expect(() => calculatePoints(Number.MAX_VALUE, 2)).toThrow(RangeError);
    expect(() => calculatePoints(Number.MAX_VALUE, 2)).toThrow(/overflow/);
  });

  it('does not overflow for large but representable inputs', () => {
    // 1e15 × 3 = 3e15, which is finite and representable
    expect(() => calculatePoints(1e15, 3)).not.toThrow();
    expect(calculatePoints(1e15, 3)).toBe(3e15);
  });
});

// ─── pointsToNextTier ─────────────────────────────────────────────────────────

describe('pointsToNextTier', () => {
  describe('from bronze', () => {
    it('0 pts from bronze → 5000 to reach silver', () => {
      expect(pointsToNextTier(0, 'bronze')).toBe(5000);
    });

    it('3500 pts from bronze → 1500 to reach silver', () => {
      expect(pointsToNextTier(3500, 'bronze')).toBe(1500);
    });

    it('4999 pts from bronze → 1 to reach silver', () => {
      expect(pointsToNextTier(4999, 'bronze')).toBe(1);
    });

    it('exactly at silver boundary → 0 (clamped)', () => {
      expect(pointsToNextTier(5000, 'bronze')).toBe(0);
    });

    it('above silver boundary while still labelled bronze → 0 (clamped)', () => {
      // Edge case: stale tier label vs. actual points
      expect(pointsToNextTier(6000, 'bronze')).toBe(0);
    });
  });

  describe('from silver', () => {
    it('5000 pts from silver → 10000 to reach gold', () => {
      expect(pointsToNextTier(5000, 'silver')).toBe(10000);
    });

    it('12000 pts from silver → 3000 to reach gold', () => {
      expect(pointsToNextTier(12000, 'silver')).toBe(3000);
    });

    it('exactly at gold boundary → 0', () => {
      expect(pointsToNextTier(15000, 'silver')).toBe(0);
    });
  });

  describe('from gold', () => {
    it('15000 pts from gold → 15000 to reach platinum', () => {
      expect(pointsToNextTier(15000, 'gold')).toBe(15000);
    });

    it('25000 pts from gold → 5000 to reach platinum', () => {
      expect(pointsToNextTier(25000, 'gold')).toBe(5000);
    });

    it('exactly at platinum boundary → 0', () => {
      expect(pointsToNextTier(30000, 'gold')).toBe(0);
    });
  });

  describe('from platinum', () => {
    it('any amount from platinum → null (no higher tier)', () => {
      expect(pointsToNextTier(30000, 'platinum')).toBeNull();
      expect(pointsToNextTier(1_000_000, 'platinum')).toBeNull();
      expect(pointsToNextTier(0, 'platinum')).toBeNull();
    });
  });

  it('never returns a negative number', () => {
    // All tier x points combos at/over the boundary should be 0, not negative
    const tiers: LoyaltyTier[] = ['bronze', 'silver', 'gold'];
    for (const tier of tiers) {
      const result = pointsToNextTier(999999, tier);
      expect(result).not.toBeNull();
      expect(result as number).toBeGreaterThanOrEqual(0);
    }
  });

  it('throws RangeError for negative points', () => {
    expect(() => pointsToNextTier(-1, 'bronze')).toThrow(RangeError);
  });

  it('throws RangeError for NaN points', () => {
    expect(() => pointsToNextTier(NaN, 'bronze')).toThrow(RangeError);
  });

  it('throws RangeError for Infinity points', () => {
    expect(() => pointsToNextTier(Infinity, 'bronze')).toThrow(RangeError);
  });
});

// ─── TIER_TABLE and TIER_ORDER ────────────────────────────────────────────────

describe('TIER_TABLE', () => {
  it('contains exactly 4 tiers', () => {
    expect(Object.keys(TIER_TABLE)).toHaveLength(4);
  });

  it('each tier is frozen', () => {
    for (const info of Object.values(TIER_TABLE)) {
      expect(Object.isFrozen(info)).toBe(true);
    }
  });
});

describe('TIER_ORDER', () => {
  it('has exactly 4 tiers in ascending order', () => {
    expect(TIER_ORDER).toEqual(['bronze', 'silver', 'gold', 'platinum']);
  });

  it('minPoints are strictly ascending through the order', () => {
    for (let i = 1; i < TIER_ORDER.length; i++) {
      const prev = TIER_TABLE[TIER_ORDER[i - 1]!]!;
      const curr = TIER_TABLE[TIER_ORDER[i]!]!;
      expect(curr.minPoints).toBeGreaterThan(prev.minPoints);
    }
  });
});
