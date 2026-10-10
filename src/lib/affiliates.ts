// Monetization: affiliate links.
//
// All links are live (Hector's real invite links, 2026-10-08).
// While a URL is empty (or not an http URL), its button is NOT rendered —
// no broken links ever go live.

export const WISE_REFERRAL_URL = "https://wise.com/invite/dic/hotungc3";
export const COINBASE_REFERRAL_URL = "https://advanced.coinbase.com/join/F95MLKD?src=referral-link";
export const BINANCE_REFERRAL_URL = "https://www.binance.com/activity/referral-entry/CPA?ref=CPA_0027L6WVRQ";
// Added 2026-10-08 — Hector signs up for each program and pastes his link;
// empty (non-http) URLs render nothing, so the buttons appear automatically
// once the links land.
export const AIRALO_REFERRAL_URL = ""; // e.g. https://www.airalo.com/... (up to 10% via Impact)
export const KOINLY_REFERRAL_URL = ""; // e.g. https://koinly.io/?via=... (20%+, 140+ countries)
export const AIRWALLEX_REFERRAL_URL = ""; // via Impact (US$200/referral + up to 20% rev share)

export const hasWiseLink = () => WISE_REFERRAL_URL.startsWith("http");
export const hasCoinbaseLink = () => COINBASE_REFERRAL_URL.startsWith("http");
export const hasBinanceLink = () => BINANCE_REFERRAL_URL.startsWith("http");
export const hasAiraloLink = () => AIRALO_REFERRAL_URL.startsWith("http");

// MoneyRate Pro: Hector's own Gumroad membership product ($5/mo). The
// license key it issues unlocks Pro in the app + API (verified via
// /api/license against Gumroad v2). Live since 2026-10-10; subdomain moved to dawnlimited 2026-10-10.
export const GUMROAD_PRO_URL = "https://dawnlimited.gumroad.com/l/iyywbo";
export const hasKoinlyLink = () => KOINLY_REFERRAL_URL.startsWith("http");
export const hasAirwallexLink = () => AIRWALLEX_REFERRAL_URL.startsWith("http");
