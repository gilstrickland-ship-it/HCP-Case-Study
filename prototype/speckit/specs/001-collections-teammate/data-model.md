# Data Model — AI Collections Teammate

In-memory mock data (`prototype/lib/data.ts`). No database. Types in `lib/types.ts`.

## Entities

### Customer
| Field | Type | Notes |
|---|---|---|
| id | string | |
| name | string | |
| relationship | `repeat` \| `new` \| `member` | drives tone softening + VIP auto-populate |
| lifetimeRevenue | number | |
| isVip | boolean | auto or manual |
| tenureMonths | number | |
| timezone | string | IANA tz for customer-local quiet-hours check |
| customerDso | number | this customer's avg days-to-pay |
| onTimeRate | number | 0–1 |
| priorLateCount | number | |
| brokenPromiseCount | number | |
| priorDisputes | number | |
| cardOnFile | boolean | |

### Invoice
| Field | Type | Notes |
|---|---|---|
| id | string | |
| customerId | string | |
| amount | number | vs. ~$2–5K enforcement floor |
| daysOverdue | number | |
| jobType | `emergency` \| `scheduled` \| `commercial` \| `insurance` | |
| depositTaken | boolean | |
| disputed | boolean | |
| status | `overdue` \| `sent` \| `paid` \| `halted` | |
| segment | `forgot` \| `cant_pay` \| `disputes` \| `wont_pay` \| `unknown` | last classification |
| confidence | number | 0–1, last classification |
| thread | Message[] | |

### Message
| Field | Type | Notes |
|---|---|---|
| id | string | |
| direction | `out` \| `in` | |
| body | string | |
| status | `draft` \| `queued` \| `sent` \| `deferred` | |
| intent | `promise` \| `dispute` \| `already_paid` \| `info_request` \| `other` \| null | inbound only |
| promiseDate | string \| null | if a promise was made |
| createdAt | string | ISO |

### ProSettings
| Field | Type | Notes |
|---|---|---|
| persistence | 0–100 | gentle ↔ keep at it |
| tone | 0–100 | warm ↔ firm |
| leashDefault | `L0` \| `L1` \| `L2` | default autonomy |
| segmentAutonomy | Record<segment, level> | per-segment override |
| loopMeInThreshold | number | dollars |
| baselineDso | number | the Pro's own average |
| vipIds | string[] | |

### EvalCase (`lib/cases.json`)
| Field | Type | Notes |
|---|---|---|
| id | number | 1–15 |
| title | string | |
| kind | `classify` \| `guardrail` \| `reply` \| `tone` | |
| input | object | context and/or customer reply |
| expected | object | `{ action, segment?, escalate?, halt?, freezeAll?, deferred? }` |
| p0 | boolean | is this a P0 cardinal/guardrail case |
| errorClassOnMiss | `P0` \| `P1` \| `P2` \| `P3` | |

## Derived

- **Weighted recovery** (`lib/weighting.ts`): `uplift × dollarsAtRisk`, scaled by
  amount, daysOverdue, and `customerDso / baselineDso` (relative-DSO risk). Used to
  rank the AR list and credit the dashboard.
- **relativeDso** = `customerDso / baselineDso` — "high DSO" means high vs. this Pro.
