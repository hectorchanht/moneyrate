# moneyrate-mcp

MCP server for the [MoneyRate](https://moneyrate.lol) public API — convert
currencies (fiat + crypto) and fetch historical rate summaries from Claude
Desktop, Claude Code, and other MCP clients. Zero dependencies, plain Node 18+.

## Install

```bash
npx -y moneyrate-mcp
```

## Tools

| Tool | Description |
|---|---|
| `convert_currency` | Convert an amount (`from`, `to`, `amount` default 1, optional `license_key`) using live rates. |
| `currency_chart` | Historical monthly rates for a pair (`q` like `"USD-EUR"`). Returns a compact summary (point count, first/last, min/max) — never the full series. |

The chart tool never dumps hundreds of points into context; for the raw
series, call `GET https://moneyrate.lol/api/currencyChart?q=USD-EUR` directly.

## Claude Desktop config

```json
{
  "mcpServers": {
    "moneyrate": {
      "command": "npx",
      "args": ["-y", "moneyrate-mcp"],
      "env": { "MONEYRATE_BASE_URL": "https://moneyrate.lol" }
    }
  }
}
```

`MONEYRATE_BASE_URL` is optional (defaults to `https://moneyrate.lol`) —
point it at a local dev server or a stub for testing.

## Rate limits

The underlying API is freemium: 1,000 requests/day/IP free, 100,000/day with
a paid license key. Pass the key per call as `license_key`, or get one from
the product page linked at https://moneyrate.lol/api-docs

## Local dev

```bash
node smoke-test.mjs   # stdio smoke test against a loopback stub (no network)
```
