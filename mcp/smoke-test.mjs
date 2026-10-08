#!/usr/bin/env node
// Smoke test for server.mjs: spins a stub MoneyRate API on loopback, drives the
// MCP server over stdio (initialize → tools/list → tools/call), and asserts
// each step. No network beyond loopback — a live smoke test can't run in CI
// (and would burn the free-tier rate budget anyway).
import http from "node:http";
import { spawn } from "node:child_process";

const CONVERT = { from: "USD", to: "EUR", amount: 2, rate: 0.9, result: 1.8, rateDate: "2026-10-08", tier: "free" };
const CHART = {
  title: "1 USD = ? EUR",
  data: [
    { date: "01/01/2024", value: 0.9, timestamp: 1704067200 },
    { date: "01/02/2024", value: 0.92, timestamp: 1706745600 },
    { date: "01/03/2024", value: 0.88, timestamp: 1709251200 },
  ],
};

const server = http.createServer((req, res) => {
  const body = req.url.startsWith("/api/currencyChart") ? CHART : CONVERT;
  res.writeHead(200, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
});

server.listen(0, "127.0.0.1", () => {
  const port = server.address().port;
  const child = spawn(process.execPath, ["server.mjs"], {
    env: { ...process.env, MONEYRATE_BASE_URL: `http://127.0.0.1:${port}` },
    stdio: ["pipe", "pipe", "pipe"],
  });
  let out = "";
  let err = "";
  child.stdout.on("data", (c) => { out += c; });
  child.stderr.on("data", (c) => { err += c; });
  child.on("error", (e) => { console.error("spawn failed:", e.message); process.exit(1); });
  child.stdin.write(JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: {} }) + "\n");
  child.stdin.write(JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} }) + "\n");
  child.stdin.write(JSON.stringify({
    jsonrpc: "2.0", id: 3, method: "tools/call",
    params: { name: "convert_currency", arguments: { from: "USD", to: "EUR", amount: 2 } },
  }) + "\n");
  child.stdin.write(JSON.stringify({
    jsonrpc: "2.0", id: 4, method: "tools/call",
    params: { name: "currency_chart", arguments: { q: "USD-EUR" } },
  }) + "\n");
  child.stdin.end();

  const timeout = setTimeout(() => { console.error("timed out waiting for server"); child.kill(); process.exit(1); }, 15000);
  child.on("close", (code) => {
    clearTimeout(timeout);
    server.close();
    const lines = out.trim().split("\n").filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } });
    const byId = Object.fromEntries(lines.filter(Boolean).map((m) => [m.id, m]));
    const fails = [];
    if (byId[1]?.result?.serverInfo?.name !== "moneyrate") fails.push("initialize");
    const tools = byId[2]?.result?.tools;
    if (!Array.isArray(tools) || tools.length !== 2) fails.push("tools/list");
    const names = (tools || []).map((t) => t.name).sort().join(",");
    if (names !== "convert_currency,currency_chart") fails.push(`tool names: ${names}`);
    if (!byId[3]?.result?.content?.[0]?.text?.includes('"result":1.8')) fails.push("tools/call convert_currency");
    const chartText = byId[4]?.result?.content?.[0]?.text || "";
    if (!chartText.includes('"points":3') || !chartText.includes('"min":0.88')) fails.push("tools/call currency_chart summary");
    if (code !== 0 && code !== null) fails.push(`exit code ${code}`);
    if (err) fails.push(`stderr: ${err.slice(0, 200)}`);
    if (fails.length) { console.error("SMOKE FAIL:", fails.join("; ")); process.exit(1); }
    console.log("smoke test OK: initialize + tools/list (2 tools) + tools/call (convert + chart summary)");
  });
});
