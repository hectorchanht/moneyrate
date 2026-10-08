# moneyrate-api

JavaScript/TypeScript client for the [MoneyRate](https://moneyrate.lol)
public API. Zero runtime dependencies.

```bash
npm install moneyrate-api
```

```ts
import { MoneyRate } from "moneyrate-api";

const api = new MoneyRate();

// Convert 100 USD → EUR
const { result, rate, tier } = await api.convert({ from: "USD", to: "EUR", amount: 100 });

// Historical monthly rates (compact summary — use includeSeries for the full series)
const summary = await api.chart("USD-EUR");
console.log(summary.points, summary.min, summary.max);

// Paid tier: pass your Gumroad license key
const paid = new MoneyRate({ licenseKey: "YOUR_KEY" });
```

## Tiers

- **Free** — 1,000 requests/day/IP, no key needed.
- **Paid** — 100,000 requests/day/IP with a $5/month Gumroad license key
  (see https://moneyrate.lol/api-docs). Pass it per call (`license_key`) or
  once via `new MoneyRate({ licenseKey })`.

Errors throw `MoneyRateError` (with `.status`) carrying the API's message.
