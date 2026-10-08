#!/usr/bin/env node
// MoneyRate MCP server — exposes the MoneyRate public API (moneyrate.lol) as
// Model Context Protocol tools over stdio. Zero dependencies: plain Node 18+,
// JSON-RPC 2.0 line-delimited on stdin/stdout.
//
// Usage with Claude Desktop (~/.claude.json or claude_desktop_config.json):
//   { "mcpServers": { "moneyrate": {
//       "command": "npx",
//       "args": ["-y", "moneyrate-mcp"],
//       "env": { "MONEYRATE_BASE_URL": "https://moneyrate.lol" }
//   } } }
//
// Or via npx once published: npx -y moneyrate-mcp
//
// Free tier: 1,000 requests/day/IP. Paid tier (100,000/day) needs a Gumroad
// license key — pass it as the `license_key` argument or set it per call.
// Get one at the product page linked from https://moneyrate.lol/api-docs
const BASE = (process.env.MONEYRATE_BASE_URL || "https://moneyrate.lol").replace(/\/$/, "");
const MAX_CHARS = 8000; // trim tool output so a big payload can't flood context

const TOOLS = [
  {
    name: "convert_currency",
    description:
      "Convert an amount from one currency to another using live rates (fiat + crypto). Returns the rate, converted result, rate date and the API tier used.",
    inputSchema: {
      type: "object",
      properties: {
        from: { type: "string", description: "Source currency code, e.g. USD, EUR, BTC" },
        to: { type: "string", description: "Target currency code, e.g. EUR, JPY, ETH" },
        amount: { type: "number", description: "Amount to convert", default: 1 },
        license_key: { type: "string", description: "Paid-tier Gumroad license key (optional; 100,000 req/day vs 1,000 free)" },
      },
      required: ["from", "to"],
    },
    call: async (a) => {
      const p = new URLSearchParams();
      p.set("from", String(a.from).toUpperCase());
      p.set("to", String(a.to).toUpperCase());
      p.set("amount", String(a.amount ?? 1));
      if (a.license_key) p.set("license_key", String(a.license_key));
      return fetchJson(`/api/convert?${p.toString()}`);
    },
  },
  {
    name: "currency_chart",
    description:
      "Historical monthly rates for a currency pair (e.g. q=\"USD-EUR\"). Returns a compact summary — point count, first/last date and value, min/max — not the full series, to keep context small.",
    inputSchema: {
      type: "object",
      properties: {
        q: { type: "string", description: 'Currency pair as "TARGET-BASE", e.g. "USD-EUR", "BTC-USD"' },
      },
      required: ["q"],
    },
    call: async (a) => {
      const body = await fetchJson(`/api/currencyChart?q=${encodeURIComponent(String(a.q).toUpperCase())}`);
      if (body?.isError) return body;
      let parsed;
      try { parsed = JSON.parse(body.content[0].text); } catch { return body; }
      const data = Array.isArray(parsed?.data) ? parsed.data : [];
      const summary = data.length
        ? (() => {
            const values = data.map((d) => d.value).filter((v) => Number.isFinite(v));
            const first = data[0], last = data[data.length - 1];
            return {
              title: parsed.title ?? null,
              points: data.length,
              first: { date: first.date, value: first.value },
              last: { date: last.date, value: last.value },
              min: Math.min(...values),
              max: Math.max(...values),
            };
          })()
        : { title: parsed?.title ?? null, points: 0, note: "no chart data" };
      return { content: [{ type: "text", text: trim(JSON.stringify(summary)) }] };
    },
  },
];

async function fetchJson(path) {
  const res = await fetch(BASE + path, {
    headers: { "User-Agent": "moneyrate-mcp/1.0.0 (+https://moneyrate.lol)" },
  });
  const text = await res.text();
  let body;
  try { body = JSON.parse(text); } catch { body = { raw: text.slice(0, 2000) }; }
  if (!res.ok) {
    return { isError: true, content: [{ type: "text", text: `HTTP ${res.status}: ${JSON.stringify(body).slice(0, 500)}` }] };
  }
  return { content: [{ type: "text", text: trim(JSON.stringify(body)) }] };
}

function trim(text) {
  if (text.length > MAX_CHARS) text = text.slice(0, MAX_CHARS) + `… (truncated at ${MAX_CHARS} chars)`;
  return text;
}

function respond(id, result) {
  process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id, result }) + "\n");
}
function respondError(id, code, message) {
  process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id, error: { code, message } }) + "\n");
}

async function handle(msg) {
  if (msg.jsonrpc !== "2.0" || typeof msg.method !== "string") return;
  const { id, method, params } = msg;
  try {
    if (method === "initialize") {
      respond(id, {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: { name: "moneyrate", version: "1.0.0" },
      });
    } else if (method === "tools/list") {
      respond(id, {
        tools: TOOLS.map(({ name, description, inputSchema }) => ({ name, description, inputSchema })),
      });
    } else if (method === "tools/call") {
      const tool = TOOLS.find((t) => t.name === params?.name);
      if (!tool) {
        respond(id, { isError: true, content: [{ type: "text", text: `unknown tool: ${params?.name}` }] });
        return;
      }
      respond(id, await tool.call(params?.arguments || {}));
    } else if (method === "ping") {
      respond(id, {});
    } else if (id !== undefined) {
      respondError(id, -32601, `method not found: ${method}`);
    }
    // notifications (no id): no response
  } catch (e) {
    if (id !== undefined) respondError(id, -32603, e instanceof Error ? e.message : String(e));
  }
}

// Line-delimited JSON-RPC on stdin.
let buf = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  buf += chunk;
  let i;
  while ((i = buf.indexOf("\n")) >= 0) {
    const line = buf.slice(0, i).trim();
    buf = buf.slice(i + 1);
    if (!line) continue;
    try {
      void handle(JSON.parse(line));
    } catch {
      /* ignore malformed line */
    }
  }
});
