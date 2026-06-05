<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0F172A,50:1E3A8A,100:2563EB&height=220&section=header&text=retail-rfm&fontSize=70&fontColor=ffffff&animation=fadeIn&fontAlignY=35&desc=Customer%20Analytics%20Engine%20for%20Retail%20%7C%20RFM%20Segmentation%20%7C%20Loyalty%20Intelligence&descAlignY=58&descSize=18&descColor=D6E4FF" width="100%"/>

# retail-rfm

### Customer Analytics Engine for Modern Retail Applications

Type-safe RFM scoring, behavioural segmentation, customer intelligence, and loyalty program analytics for e-commerce platforms.

[![npm version](https://img.shields.io/npm/v/retail-rfm.svg?style=for-the-badge)](https://www.npmjs.com/package/retail-rfm)
[![npm downloads](https://img.shields.io/npm/dm/retail-rfm.svg?style=for-the-badge)](https://www.npmjs.com/package/retail-rfm)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/retail-rfm?style=for-the-badge)](https://bundlephobia.com/package/retail-rfm)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

<br/>

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)
![Browser](https://img.shields.io/badge/Browser-Compatible-blue?style=flat-square)
![Tree Shaking](https://img.shields.io/badge/Tree_Shakeable-Yes-success?style=flat-square)
![Dependencies](https://img.shields.io/badge/Dependencies-Zero-success?style=flat-square)

</div>

---

## Why retail-rfm?

Customer retention teams rarely struggle to collect data.

They struggle to convert customer activity into actionable decisions.

`retail-rfm` provides the analytical layer behind retention dashboards, CRM platforms, loyalty programs, marketing automation systems, and customer intelligence products.

The library transforms raw purchase behaviour into:

- RFM scores (Recency, Frequency, Monetary)
- Behavioural customer segments
- Loyalty program tiers
- Reward point calculations
- Segment-level marketing recommendations
- Distribution analytics for dashboards

All without external dependencies.

---

## Core Capabilities

### RFM Intelligence

Convert transactional activity into standardized customer quality scores.

```ts
const rfm = calculateRFMScore({
  daysSinceLastPurchase: 12,
  purchaseCount: 8,
  totalSpend: 620,
});

console.log(rfm);

/*
{
  recency: 4,
  frequency: 4,
  monetary: 4,
  total: 12,
  tier: "good"
}
*/

---

## What is RFM analysis?

RFM analysis is a proven marketing technique that scores customers on three behavioural dimensions: **Recency** (how recently they bought), **Frequency** (how often they buy), and **Monetary** value (how much they spend). Each dimension is scored 1–5, giving a composite score of 3–15 that reflects overall customer quality. By grouping customers into named segments like "Champions", "At Risk", or "Hibernating", teams can target the right message to the right person — retaining high-value customers, re-engaging lapsed ones, and converting promising new buyers into loyal repeat purchasers.

---

## Installation

```bash
npm install retail-rfm
```

No runtime dependencies. Works in Node ≥ 18, any modern browser, and edge runtimes (Cloudflare Workers, Vercel Edge, Deno).

---

## Quick start

```ts
import { calculateRFMScore, segmentCustomers, getLoyaltyTier, calculatePoints } from 'retail-rfm';

// Score a single customer
const rfm = calculateRFMScore({
  daysSinceLastPurchase: 12,
  purchaseCount: 8,
  totalSpend: 620,
});
// => { recency: 4, frequency: 4, monetary: 4, total: 12, tier: 'good' }

// Batch-segment an entire customer list
const segmented = segmentCustomers([
  { id: 'u1', daysSinceLastPurchase: 12, purchaseCount: 8,  totalSpend: 620  },
  { id: 'u2', daysSinceLastPurchase: 95, purchaseCount: 12, totalSpend: 1400 },
  { id: 'u3', daysSinceLastPurchase: 220, purchaseCount: 1, totalSpend: 25   },
]);
// segmented[0].segment => 'champions'
// segmented[1].segment => 'at-risk'
// segmented[2].segment => 'lost'

// Loyalty points & tier
const points = calculatePoints(620, 1.5); // => 930  (silver-tier rate)
const tier   = getLoyaltyTier(930);       // => 'bronze'
```

---

## API reference

### RFM module

Import from `'retail-rfm'` or directly from `'retail-rfm/rfm'`.

---

#### `scoreRecency(daysSinceLastPurchase, thresholds?)`

Scores purchase recency on a 1–5 scale. **5 = most recent.**

| Days since last purchase | Default score |
|---|---|
| 0–7   | 5 |
| 8–30  | 4 |
| 31–90 | 3 |
| 91–180 | 2 |
| 181+  | 1 |

```ts
scoreRecency(5)   // => 5
scoreRecency(45)  // => 3
scoreRecency(400) // => 1

// Custom thresholds — [d5, d4, d3, d2] day boundaries, strictly ascending
scoreRecency(10, { boundaries: [3, 14, 30, 60] }) // => 3
```

**Parameters:**
- `daysSinceLastPurchase: number` — Non-negative days (fractional allowed).
- `thresholds?: ScoreThresholds` — Optional custom boundaries.

**Returns:** `RFMScore` (1 | 2 | 3 | 4 | 5)

**Throws:** `RangeError` if input is negative/NaN/non-finite, or if custom boundaries are not strictly ascending.

---

#### `scoreFrequency(purchaseCount, thresholds?)`

Scores purchase frequency on a 1–5 scale. **5 = most frequent.**

| Total purchases | Default score |
|---|---|
| 0–1  | 1 |
| 2–3  | 2 |
| 4–6  | 3 |
| 7–9  | 4 |
| 10+  | 5 |

```ts
scoreFrequency(1)  // => 1
scoreFrequency(5)  // => 3
scoreFrequency(12) // => 5
```

**Parameters:**
- `purchaseCount: number` — Non-negative integer.
- `thresholds?: ScoreThresholds` — Optional custom `[c2, c3, c4, c5]` boundaries.

**Returns:** `RFMScore`

**Throws:** `RangeError` if input is negative, fractional, NaN, or non-finite.

---

#### `scoreMonetary(totalSpend, thresholds?)`

Scores monetary value on a 1–5 scale. **5 = highest spend.** Supports USD and INR presets out of the box.

| Total spend (USD default) | Score |
|---|---|
| < $50    | 1 |
| $50–$199  | 2 |
| $200–$499 | 3 |
| $500–$999 | 4 |
| $1,000+  | 5 |

```ts
scoreMonetary(45)           // => 1  (USD default)
scoreMonetary(600)          // => 4
scoreMonetary(600, 'INR')   // => 1  (₹600 is below INR threshold)
scoreMonetary(83000, 'INR') // => 5

// Full control with custom boundaries
scoreMonetary(600, { boundaries: [100, 500, 2000, 10000] }) // => 3
```

**Parameters:**
- `totalSpend: number` — Non-negative spend.
- `thresholds?: ScoreThresholds | CurrencyPreset` — `'USD'` (default), `'INR'`, or a custom `ScoreThresholds` object.

**Returns:** `RFMScore`

**Throws:** `RangeError` if spend is negative/NaN/non-finite, thresholds are non-monotone, or an unknown preset string is passed.

---

#### `calculateRFMScore(metrics, config?)`

Scores all three dimensions and returns a full breakdown with composite total and tier name.

```ts
calculateRFMScore({
  daysSinceLastPurchase: 5,
  purchaseCount: 8,
  totalSpend: 600,
})
// => { recency: 5, frequency: 4, monetary: 4, total: 13, tier: 'excellent' }

// With INR monetary thresholds
calculateRFMScore(metrics, { monetary: 'INR' })
```

**Parameters:**
- `metrics: CustomerMetrics` — `{ daysSinceLastPurchase, purchaseCount, totalSpend }`
- `config?: RFMConfig` — Optional per-dimension overrides. `monetary` accepts `ScoreThresholds | CurrencyPreset`.

**Returns:** `RFMBreakdown` — `{ recency, frequency, monetary, total, tier }`

---

#### `getRFMTier(score)`

Maps a composite score (3–15) to a named quality band.

| Score | Tier |
|---|---|
| 13–15 | `'excellent'` |
| 10–12 | `'good'` |
| 7–9   | `'average'` |
| 5–6   | `'below-average'` |
| 3–4   | `'poor'` |

```ts
getRFMTier(13) // => 'excellent'
getRFMTier(6)  // => 'below-average'
```

**Throws:** `RangeError` if score is outside 3–15 or not an integer.

---

#### `DEFAULT_RFM_CONFIG`

The default thresholds object used when no config is passed to `calculateRFMScore`. Useful as a reference or to spread and override one dimension:

```ts
import { DEFAULT_RFM_CONFIG } from 'retail-rfm';
const myConfig = { ...DEFAULT_RFM_CONFIG, monetary: 'INR' };
```

#### `CURRENCY_PRESETS`

```ts
import { CURRENCY_PRESETS } from 'retail-rfm';
CURRENCY_PRESETS.USD // ScoreThresholds for USD
CURRENCY_PRESETS.INR // ScoreThresholds for INR
```

---

### Segmentation module

Import from `'retail-rfm'` or directly from `'retail-rfm/segments'`.

---

#### `segmentCustomer(rfm)`

Assigns a behavioural segment from an RFM breakdown. Uses a deterministic first-match grid — every possible (R, F, M) combination maps to exactly one segment.

```ts
import { calculateRFMScore, segmentCustomer } from 'retail-rfm';

const rfm = calculateRFMScore({ daysSinceLastPurchase: 5, purchaseCount: 10, totalSpend: 900 });
segmentCustomer(rfm) // => 'champions'
```

**Segment grid (highest value first):**

| Segment | Conditions | Description |
|---|---|---|
| `champions` | R≥4, F≥4, M≥4 | Best customers — recent, frequent, high spend |
| `cant-lose-them` | R≤2, F=5 | Once your most frequent buyers; now gone quiet |
| `loyal-customers` | F≥3, M≥3 | Regular buyers with solid spend |
| `at-risk` | R≤2, F≥3 | Were frequent; haven't returned lately |
| `new-customers` | R=5, F=1 | Very first purchase |
| `promising` | R=4, F=1 | Recent first purchase, not yet back |
| `potential-loyalists` | R≥4/F=2 or R=3/F≤2/M≥3 | Recent with growing engagement |
| `about-to-sleep` | R=3, F≤2, M<3 | Engagement fading — act now |
| `needs-attention` | R≥3, F≥3, M<3 | Active and frequent but spending below potential |
| `hibernating` | R=2, F≤2 | Largely inactive — dormant |
| `lost` | R=1, F≤2 | Long gone, rarely bought |

**Returns:** `CustomerSegment`

---

#### `segmentCustomers(customers, config?)`

Batch version of `segmentCustomer`. Pure function — input is never mutated, output order matches input.

```ts
const results = segmentCustomers(customerList, { monetary: 'INR' });
results[0] // => { id, daysSinceLastPurchase, purchaseCount, totalSpend, rfm, segment }
```

**Parameters:**
- `customers: readonly Customer[]` — Array with `{ id, daysSinceLastPurchase, purchaseCount, totalSpend }`.
- `config?: RFMConfig` — Same config as `calculateRFMScore`, including `monetary: 'INR'`.

**Returns:** `SegmentedCustomer[]`

**Throws:** `RangeError` naming the offending customer `id` if any metrics are invalid.

---

#### `getSegmentInfo(segment)`

Returns frozen display metadata for a segment: label, description, and prioritised marketing recommendations.

```ts
getSegmentInfo('champions')
// => {
//   segment: 'champions',
//   label: 'Champions',
//   description: 'Your best customers — ...',
//   recommendedActions: ['Reward with early access ...', ...]
// }
```

**Returns:** `SegmentInfo` (frozen object — do not mutate)

---

#### `getSegmentDistribution(customers)`

Counts customers per segment. Every segment key is always present (zero-filled), so dashboard charts never hit `undefined`.

```ts
getSegmentDistribution(segmented)
// => { champions: 12, 'loyal-customers': 34, ..., lost: 5 }

getSegmentDistribution([])
// => { champions: 0, 'loyal-customers': 0, ..., lost: 0 }
```

**Returns:** `Record<CustomerSegment, number>`

---

#### `ALL_SEGMENTS`

`readonly CustomerSegment[]` — all 11 segment values in display order (highest to lowest value). Useful for rendering ordered dropdowns or chart axes.

---

### Loyalty module

Import from `'retail-rfm'` or directly from `'retail-rfm/loyalty'`.

---

#### `getLoyaltyTier(points)`

Classifies a customer into a loyalty tier from their lifetime points balance.

| Points | Tier |
|---|---|
| [0, 5,000) | `'bronze'` |
| [5,000, 15,000) | `'silver'` |
| [15,000, 30,000) | `'gold'` |
| 30,000+ | `'platinum'` |

```ts
getLoyaltyTier(0)      // => 'bronze'
getLoyaltyTier(4999)   // => 'bronze'
getLoyaltyTier(5000)   // => 'silver'
getLoyaltyTier(30000)  // => 'platinum'
```

**Throws:** `RangeError` if points is negative, NaN, or non-finite.

---

#### `getTierInfo(tier)`

Returns frozen metadata for a tier: point boundaries, multiplier, and benefit descriptions.

```ts
getTierInfo('gold')
// => {
//   tier: 'gold',
//   label: 'Gold Member',
//   minPoints: 15000,
//   maxPoints: 30000,      // exclusive upper bound; null for platinum
//   pointsMultiplier: 2,
//   benefits: ['Earn 2 points per $1 / ₹1 spent', ...]
// }
```

**Returns:** `TierInfo` (frozen object)

---

#### `calculatePoints(spend, multiplier?)`

Converts a spend amount to loyalty points: `Math.floor(spend × multiplier)`.

```ts
calculatePoints(199.99)        // => 199  (bronze: 1× rate)
calculatePoints(199.99, 1.5)   // => 299  (silver: 1.5× rate)
calculatePoints(199.99, 2)     // => 399  (gold: 2× rate)
calculatePoints(199.99, 3)     // => 599  (platinum: 3× rate)

// Compose with getTierInfo
const { pointsMultiplier } = getTierInfo(getLoyaltyTier(myPoints));
const earned = calculatePoints(orderTotal, pointsMultiplier);
```

**Throws:** `RangeError` if spend is negative/NaN/non-finite, multiplier is not a positive finite number, or the result overflows.

---

#### `pointsToNextTier(points, tier)`

Returns how many more points are needed to reach the next tier. Returns `null` for platinum (no higher tier). Clamps to `0` — never returns negative.

```ts
pointsToNextTier(3500, 'bronze')     // => 1500
pointsToNextTier(5000, 'bronze')     // => 0    (already at silver boundary)
pointsToNextTier(25000, 'gold')      // => 5000
pointsToNextTier(999999, 'platinum') // => null
```

---

#### `TIER_TABLE` / `TIER_ORDER`

```ts
import { TIER_TABLE, TIER_ORDER } from 'retail-rfm';
TIER_ORDER // => ['bronze', 'silver', 'gold', 'platinum']
TIER_TABLE.silver.minPoints // => 5000
```

---

## Types

All types are exported from the root `'retail-rfm'` entrypoint.

```ts
import type {
  // Primitives
  RFMScore,           // 1 | 2 | 3 | 4 | 5
  RFMTier,            // 'excellent' | 'good' | 'average' | 'below-average' | 'poor'
  CustomerSegment,    // 'champions' | 'loyal-customers' | ... (11 values)
  LoyaltyTier,        // 'bronze' | 'silver' | 'gold' | 'platinum'
  CurrencyPreset,     // 'USD' | 'INR'

  // Input shapes
  CustomerMetrics,    // { daysSinceLastPurchase, purchaseCount, totalSpend }
  Customer,           // CustomerMetrics & { id: string }

  // Output shapes
  RFMBreakdown,       // { recency, frequency, monetary, total, tier }
  SegmentedCustomer,  // Customer & { rfm, segment }
  SegmentInfo,        // { segment, label, description, recommendedActions }
  TierInfo,           // { tier, label, minPoints, maxPoints, pointsMultiplier, benefits }

  // Configuration
  ScoreThresholds,    // { boundaries: [number, number, number, number] }
  RFMConfig,          // { recency?, frequency?, monetary?: ScoreThresholds | CurrencyPreset }
} from 'retail-rfm';
```

---

## Subpath imports

The package exports each module as a separate entry point for maximum tree-shaking:

```ts
import { scoreRecency, calculateRFMScore } from 'retail-rfm/rfm';
import { segmentCustomers, getSegmentDistribution } from 'retail-rfm/segments';
import { getLoyaltyTier, calculatePoints } from 'retail-rfm/loyalty';
```

---

## Use cases

### CRM dashboards

Use `segmentCustomers` + `getSegmentDistribution` to power a customer health overview — showing how many customers sit in each behavioural band, and pulling `getSegmentInfo` for the recommended action copy displayed to sales reps.

### E-commerce analytics

Plug `calculateRFMScore` into a nightly data pipeline to score every customer after new orders arrive. Store the `RFMBreakdown` in your data warehouse and trend it over time to detect cohort-level behavioural shifts before they show up in revenue.

### Loyalty programs

Use `getLoyaltyTier` + `calculatePoints` + `pointsToNextTier` to drive real-time tier status and progress bars on account pages. Use `getTierInfo` to render benefit lists and `getLoyaltyTier(newBalance)` after each transaction to detect and congratulate tier upgrades.

### Multi-currency platforms

Pass `{ monetary: 'INR' }` as the `config` to `calculateRFMScore` or `segmentCustomers` to apply INR-calibrated monetary thresholds without any code changes. Custom `ScoreThresholds` objects support any currency or business scale.

---

## Contributing

Contributions are welcome. Please open an issue first if you're proposing a new segment, threshold change, or currency preset — these decisions affect downstream consumers and deserve discussion.

```bash
git clone https://github.com/HXRIkumar/retail-rfm.git
cd retail-rfm
npm install

npm test           # run tests (Vitest)
npm run typecheck  # strict TypeScript check
npm run build      # dual ESM + CJS output via tsup
npm run test:coverage  # coverage report (95%+ enforced)
```

All PRs must pass `npm run typecheck && npm test` with no regressions. If you're adding a function, add tests that cover every branch including error paths.

---

## License

MIT © [Hari K](https://github.com/HXRIkumar)

See [LICENSE](LICENSE) for the full text.
