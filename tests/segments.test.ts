import { describe, it, expect } from 'vitest';
import {
  segmentCustomer,
  segmentCustomers,
  getSegmentInfo,
  getSegmentDistribution,
  ALL_SEGMENTS,
} from '../src/segments.js';
import type { RFMBreakdown, Customer, CustomerSegment } from '../src/types.js';
import { getRFMTier } from '../src/rfm.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeRFM(r: 1|2|3|4|5, f: 1|2|3|4|5, m: 1|2|3|4|5): RFMBreakdown {
  const total = r + f + m;
  return { recency: r, frequency: f, monetary: m, total, tier: getRFMTier(total) };
}

// ─── segmentCustomer ──────────────────────────────────────────────────────────

describe('segmentCustomer', () => {
  describe('champions (R≥4, F≥4, M≥4)', () => {
    it('R5/F5/M5 → champions', () => {
      expect(segmentCustomer(makeRFM(5, 5, 5))).toBe('champions');
    });

    it('R4/F4/M4 → champions (minimum qualifying)', () => {
      expect(segmentCustomer(makeRFM(4, 4, 4))).toBe('champions');
    });

    it('R5/F4/M5 → champions', () => {
      expect(segmentCustomer(makeRFM(5, 4, 5))).toBe('champions');
    });

    it('R4/F5/M4 → champions', () => {
      expect(segmentCustomer(makeRFM(4, 5, 4))).toBe('champions');
    });

    it('R3/F5/M5 is NOT champions (R too low)', () => {
      expect(segmentCustomer(makeRFM(3, 5, 5))).not.toBe('champions');
    });

    it('R5/F3/M5 is NOT champions (F too low)', () => {
      expect(segmentCustomer(makeRFM(5, 3, 5))).not.toBe('champions');
    });

    it('R5/F5/M3 is NOT champions (M too low)', () => {
      expect(segmentCustomer(makeRFM(5, 5, 3))).not.toBe('champions');
    });
  });

  describe("cant-lose-them (R≤2, F=5)", () => {
    it('R1/F5/M1 → cant-lose-them', () => {
      expect(segmentCustomer(makeRFM(1, 5, 1))).toBe('cant-lose-them');
    });

    it('R2/F5/M3 → cant-lose-them', () => {
      expect(segmentCustomer(makeRFM(2, 5, 3))).toBe('cant-lose-them');
    });

    it('R1/F5/M5 → cant-lose-them (takes precedence over loyal-customers)', () => {
      expect(segmentCustomer(makeRFM(1, 5, 5))).toBe('cant-lose-them');
    });

    it('R3/F5/M1 is NOT cant-lose-them (R=3 is above threshold)', () => {
      expect(segmentCustomer(makeRFM(3, 5, 1))).not.toBe('cant-lose-them');
    });
  });

  describe('loyal-customers (F≥3, M≥3, not champions)', () => {
    it('R3/F3/M3 → loyal-customers', () => {
      expect(segmentCustomer(makeRFM(3, 3, 3))).toBe('loyal-customers');
    });

    it('R5/F3/M4 → loyal-customers (R high but not champions since F=3)', () => {
      expect(segmentCustomer(makeRFM(5, 3, 4))).toBe('loyal-customers');
    });

    it('R1/F4/M5 → loyal-customers (low R, but F and M qualify)', () => {
      expect(segmentCustomer(makeRFM(1, 4, 5))).toBe('loyal-customers');
    });

    it('R5/F5/M3 → loyal-customers (not champions since M=3<4)', () => {
      expect(segmentCustomer(makeRFM(5, 5, 3))).toBe('loyal-customers');
    });

    it('R4/F4/M3 → loyal-customers (not champions since M=3<4)', () => {
      expect(segmentCustomer(makeRFM(4, 4, 3))).toBe('loyal-customers');
    });
  });

  describe('at-risk (R≤2, F≥3, not cant-lose-them, not loyal-customers)', () => {
    it('R2/F3/M1 → at-risk', () => {
      expect(segmentCustomer(makeRFM(2, 3, 1))).toBe('at-risk');
    });

    it('R1/F4/M2 → at-risk (M<3 → not loyal-customers)', () => {
      expect(segmentCustomer(makeRFM(1, 4, 2))).toBe('at-risk');
    });

    it('R2/F4/M2 → at-risk', () => {
      expect(segmentCustomer(makeRFM(2, 4, 2))).toBe('at-risk');
    });

    it('R1/F3/M2 → at-risk', () => {
      expect(segmentCustomer(makeRFM(1, 3, 2))).toBe('at-risk');
    });
  });

  describe('new-customers (R=5, F=1)', () => {
    it('R5/F1/M1 → new-customers', () => {
      expect(segmentCustomer(makeRFM(5, 1, 1))).toBe('new-customers');
    });

    it('R5/F1/M3 → new-customers (M does not affect this segment)', () => {
      expect(segmentCustomer(makeRFM(5, 1, 3))).toBe('new-customers');
    });

    it('R5/F1/M5 → new-customers', () => {
      expect(segmentCustomer(makeRFM(5, 1, 5))).toBe('new-customers');
    });
  });

  describe('promising (R=4, F=1)', () => {
    it('R4/F1/M1 → promising', () => {
      expect(segmentCustomer(makeRFM(4, 1, 1))).toBe('promising');
    });

    it('R4/F1/M4 → promising (M does not affect this segment)', () => {
      expect(segmentCustomer(makeRFM(4, 1, 4))).toBe('promising');
    });
  });

  describe('potential-loyalists (R≥4/F=2 OR R=3/F≤2/M≥3)', () => {
    it('R3/F2/M3 → potential-loyalists', () => {
      expect(segmentCustomer(makeRFM(3, 2, 3))).toBe('potential-loyalists');
    });

    it('R4/F2/M2 → potential-loyalists (R≥4 qualifies regardless of M)', () => {
      expect(segmentCustomer(makeRFM(4, 2, 2))).toBe('potential-loyalists');
    });

    it('R5/F2/M1 → potential-loyalists', () => {
      expect(segmentCustomer(makeRFM(5, 2, 1))).toBe('potential-loyalists');
    });

    it('R3/F1/M4 → potential-loyalists (M≥3 saves it from about-to-sleep)', () => {
      expect(segmentCustomer(makeRFM(3, 1, 4))).toBe('potential-loyalists');
    });
  });

  describe('about-to-sleep (R=3, F≤2, M<3)', () => {
    it('R3/F1/M1 → about-to-sleep', () => {
      expect(segmentCustomer(makeRFM(3, 1, 1))).toBe('about-to-sleep');
    });

    it('R3/F2/M1 → about-to-sleep', () => {
      expect(segmentCustomer(makeRFM(3, 2, 1))).toBe('about-to-sleep');
    });

    it('R3/F1/M2 → about-to-sleep', () => {
      expect(segmentCustomer(makeRFM(3, 1, 2))).toBe('about-to-sleep');
    });

    it('R3/F2/M2 → about-to-sleep', () => {
      expect(segmentCustomer(makeRFM(3, 2, 2))).toBe('about-to-sleep');
    });
  });

  describe('needs-attention (R≥3, F≥3, M<3 — active/frequent but low-value)', () => {
    it('R3/F3/M1 → needs-attention', () => {
      expect(segmentCustomer(makeRFM(3, 3, 1))).toBe('needs-attention');
    });

    it('R3/F3/M2 → needs-attention', () => {
      expect(segmentCustomer(makeRFM(3, 3, 2))).toBe('needs-attention');
    });

    it('R4/F4/M1 → needs-attention (not champions: M<4)', () => {
      expect(segmentCustomer(makeRFM(4, 4, 1))).toBe('needs-attention');
    });

    it('R4/F4/M2 → needs-attention (not champions: M<4)', () => {
      expect(segmentCustomer(makeRFM(4, 4, 2))).toBe('needs-attention');
    });

    it('R5/F4/M2 → needs-attention', () => {
      expect(segmentCustomer(makeRFM(5, 4, 2))).toBe('needs-attention');
    });

    it('R5/F5/M2 → needs-attention (not champions: M<4)', () => {
      expect(segmentCustomer(makeRFM(5, 5, 2))).toBe('needs-attention');
    });

    it('R4/F3/M1 → needs-attention', () => {
      expect(segmentCustomer(makeRFM(4, 3, 1))).toBe('needs-attention');
    });

    it('R3/F3/M3 is NOT needs-attention (M≥3 → loyal-customers)', () => {
      expect(segmentCustomer(makeRFM(3, 3, 3))).toBe('loyal-customers');
    });
  });

  describe('hibernating (R=2, F≤2)', () => {
    it('R2/F1/M1 → hibernating', () => {
      expect(segmentCustomer(makeRFM(2, 1, 1))).toBe('hibernating');
    });

    it('R2/F2/M2 → hibernating', () => {
      expect(segmentCustomer(makeRFM(2, 2, 2))).toBe('hibernating');
    });

    it('R2/F1/M5 → hibernating (M does not rescue hibernating)', () => {
      expect(segmentCustomer(makeRFM(2, 1, 5))).toBe('hibernating');
    });
  });

  describe('lost (R=1, F≤2)', () => {
    it('R1/F1/M1 → lost', () => {
      expect(segmentCustomer(makeRFM(1, 1, 1))).toBe('lost');
    });

    it('R1/F2/M2 → lost', () => {
      expect(segmentCustomer(makeRFM(1, 2, 2))).toBe('lost');
    });

    it('R1/F1/M5 → lost (high M cannot override fully lapsed recency+frequency)', () => {
      expect(segmentCustomer(makeRFM(1, 1, 5))).toBe('lost');
    });

    it('R1/F2/M4 → lost', () => {
      expect(segmentCustomer(makeRFM(1, 2, 4))).toBe('lost');
    });
  });

  describe('exhaustiveness — every (R, F, M) triple maps to a known segment', () => {
    const scores: Array<1|2|3|4|5> = [1, 2, 3, 4, 5];
    const allSegments = new Set(ALL_SEGMENTS);

    for (const r of scores) {
      for (const f of scores) {
        for (const m of scores) {
          it(`R${r}/F${f}/M${m} resolves to a known segment`, () => {
            const result = segmentCustomer(makeRFM(r, f, m));
            expect(allSegments.has(result)).toBe(true);
          });
        }
      }
    }
  });

  describe('mutual exclusivity — no combination produces multiple segments', () => {
    // This follows from first-match logic, but we verify no combination ever
    // reaches the function's end returning undefined.
    it('all 125 combinations return a string', () => {
      const scores: Array<1|2|3|4|5> = [1, 2, 3, 4, 5];
      for (const r of scores) {
        for (const f of scores) {
          for (const m of scores) {
            expect(typeof segmentCustomer(makeRFM(r, f, m))).toBe('string');
          }
        }
      }
    });
  });
});

// ─── segmentCustomers ─────────────────────────────────────────────────────────

describe('segmentCustomers', () => {
  const sampleCustomers: Customer[] = [
    { id: 'c1', daysSinceLastPurchase: 5,   purchaseCount: 10, totalSpend: 1200 },
    { id: 'c2', daysSinceLastPurchase: 200, purchaseCount: 1,  totalSpend: 30   },
    { id: 'c3', daysSinceLastPurchase: 15,  purchaseCount: 3,  totalSpend: 100  },
  ];

  it('returns the same number of results as input', () => {
    const result = segmentCustomers(sampleCustomers);
    expect(result).toHaveLength(3);
  });

  it('preserves customer id on each result', () => {
    const result = segmentCustomers(sampleCustomers);
    expect(result[0]?.id).toBe('c1');
    expect(result[1]?.id).toBe('c2');
    expect(result[2]?.id).toBe('c3');
  });

  it('preserves input order', () => {
    const result = segmentCustomers(sampleCustomers);
    const ids = result.map((c) => c.id);
    expect(ids).toEqual(['c1', 'c2', 'c3']);
  });

  it('adds rfm and segment fields to each customer', () => {
    const result = segmentCustomers(sampleCustomers);
    for (const customer of result) {
      expect(customer).toHaveProperty('rfm');
      expect(customer).toHaveProperty('segment');
    }
  });

  it('does not mutate the input array or objects', () => {
    const input = [{ ...sampleCustomers[0]! }];
    const original = JSON.stringify(input);
    segmentCustomers(input);
    expect(JSON.stringify(input)).toBe(original);
  });

  it('returns empty array for empty input', () => {
    expect(segmentCustomers([])).toEqual([]);
  });

  it('classifies the best customer as champions', () => {
    const result = segmentCustomers([sampleCustomers[0]!]);
    expect(result[0]?.segment).toBe('champions');
  });

  it('classifies the worst customer as lost', () => {
    const result = segmentCustomers([sampleCustomers[1]!]);
    expect(result[0]?.segment).toBe('lost');
  });

  it('throws RangeError with customer id for invalid metrics', () => {
    const badCustomers: Customer[] = [
      { id: 'bad-customer', daysSinceLastPurchase: -10, purchaseCount: 5, totalSpend: 100 },
    ];
    expect(() => segmentCustomers(badCustomers)).toThrow(RangeError);
    expect(() => segmentCustomers(badCustomers)).toThrow(/bad-customer/);
  });

  it('supports INR currency preset via RFMConfig', () => {
    const inrCustomers: Customer[] = [
      { id: 'in1', daysSinceLastPurchase: 5, purchaseCount: 10, totalSpend: 83000 },
    ];
    const result = segmentCustomers(inrCustomers, { monetary: 'INR' });
    expect(result[0]?.rfm.monetary).toBe(5);
  });

  it('applies custom RFM ScoreThresholds config to every customer', () => {
    const result = segmentCustomers(sampleCustomers, {
      monetary: { boundaries: [10000, 50000, 100000, 200000] },
    });
    // With very high monetary thresholds, even $1,200 should score 1
    expect(result[0]?.rfm.monetary).toBe(1);
  });
});

// ─── getSegmentInfo ───────────────────────────────────────────────────────────

describe('getSegmentInfo', () => {
  it('returns info for every known segment', () => {
    for (const segment of ALL_SEGMENTS) {
      const info = getSegmentInfo(segment);
      expect(info.segment).toBe(segment);
      expect(typeof info.label).toBe('string');
      expect(info.label.length).toBeGreaterThan(0);
      expect(typeof info.description).toBe('string');
      expect(info.description.length).toBeGreaterThan(0);
      expect(Array.isArray(info.recommendedActions)).toBe(true);
      expect(info.recommendedActions.length).toBeGreaterThan(0);
    }
  });

  it('returns a frozen object', () => {
    const info = getSegmentInfo('champions');
    expect(Object.isFrozen(info)).toBe(true);
  });

  it('champions info has expected label', () => {
    expect(getSegmentInfo('champions').label).toBe('Champions');
  });

  it('lost segment includes a removal or suppression recommendation', () => {
    const actions = getSegmentInfo('lost').recommendedActions;
    const joined = actions.join(' ').toLowerCase();
    expect(joined).toMatch(/remov|suppress/);
  });

  it('needs-attention info is present and describes an upsell opportunity', () => {
    const info = getSegmentInfo('needs-attention');
    expect(info.label).toBe('Needs Attention');
    // Should have actionable upsell language
    const combined = info.description.toLowerCase() + info.recommendedActions.join(' ').toLowerCase();
    expect(combined).toMatch(/upsell|spend|bundle/);
  });

  it('throws RangeError for unknown segment', () => {
    // @ts-expect-error — intentional runtime test
    expect(() => getSegmentInfo('unknown-segment')).toThrow(RangeError);
  });
});

// ─── getSegmentDistribution ───────────────────────────────────────────────────

describe('getSegmentDistribution', () => {
  it('returns zero counts for all segments on empty input', () => {
    const dist = getSegmentDistribution([]);
    for (const segment of ALL_SEGMENTS) {
      expect(dist[segment]).toBe(0);
    }
  });

  it('all 11 segment keys are always present', () => {
    const dist = getSegmentDistribution([]);
    expect(Object.keys(dist)).toHaveLength(ALL_SEGMENTS.length);
    for (const segment of ALL_SEGMENTS) {
      expect(dist).toHaveProperty(segment);
    }
  });

  it('counts sum to total number of customers', () => {
    const customers: Customer[] = [
      { id: 'a', daysSinceLastPurchase: 5,   purchaseCount: 10, totalSpend: 1200 },
      { id: 'b', daysSinceLastPurchase: 200, purchaseCount: 1,  totalSpend: 30   },
      { id: 'c', daysSinceLastPurchase: 15,  purchaseCount: 3,  totalSpend: 100  },
    ];
    const segmented = segmentCustomers(customers);
    const dist = getSegmentDistribution(segmented);
    const total = Object.values(dist).reduce((sum, n) => sum + n, 0);
    expect(total).toBe(customers.length);
  });

  it('correctly counts multiple customers in the same segment', () => {
    const twoLost: Customer[] = [
      { id: 'x', daysSinceLastPurchase: 400, purchaseCount: 1, totalSpend: 10 },
      { id: 'y', daysSinceLastPurchase: 500, purchaseCount: 1, totalSpend: 5  },
    ];
    const segmented = segmentCustomers(twoLost);
    const dist = getSegmentDistribution(segmented);
    expect(dist.lost).toBe(2);
  });

  it('correctly counts a champion', () => {
    const champion: Customer[] = [
      { id: 'z', daysSinceLastPurchase: 3, purchaseCount: 15, totalSpend: 2000 },
    ];
    const segmented = segmentCustomers(champion);
    const dist = getSegmentDistribution(segmented);
    expect(dist.champions).toBe(1);
  });
});
