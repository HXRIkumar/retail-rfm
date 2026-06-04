# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] — 2026-06-05

### Added

- `scoreRecency`, `scoreFrequency`, `scoreMonetary` — individual RFM dimension scorers with configurable thresholds
- `calculateRFMScore` — composite RFM breakdown with `monetary: 'INR'` currency preset support
- `getRFMTier` — named quality band from composite score
- `segmentCustomer`, `segmentCustomers` — 11-segment behavioural grid covering all 125 R×F×M combinations
- `getSegmentInfo` — frozen display metadata (label, description, recommended actions) per segment
- `getSegmentDistribution` — zero-filled count record for all 11 segments
- `getLoyaltyTier`, `getTierInfo` — Bronze / Silver / Gold / Platinum tier classification
- `calculatePoints` — floored points from spend with per-tier multiplier
- `pointsToNextTier` — progress to next tier, clamped, null at platinum
- `CURRENCY_PRESETS` — built-in USD and INR monetary thresholds
- `DEFAULT_RFM_CONFIG`, `TIER_TABLE`, `TIER_ORDER`, `ALL_SEGMENTS` — exported constants
- Dual ESM + CJS build via tsup with per-module subpath exports (`/rfm`, `/segments`, `/loyalty`)
- Full TypeScript types exported from root entrypoint
