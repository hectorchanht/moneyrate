// Money: Hector's own products + voluntary support only.
//
// 2026-11-21 — VOLUNTARY MONEY ONLY (Hector's decision): every third-party
// affiliate/referral link was removed from MoneyRate for good (Wise,
// Coinbase and Binance referrals, plus the never-filled Airalo / Koinly /
// Airwallex placeholders). Third-party institutions' links do not get to
// occupy Dawn's surfaces; the only money-in channels are Hector's own
// products and voluntary support. What remains in this file:
//   1. MoneyRate Pro — Hector's own Gumroad membership product.
//   2. The Tip Jar — voluntary "buy me a coffee" support.
// (The filename is kept for import stability; it no longer holds any
// affiliate links.)

// MoneyRate Pro: Hector's own Gumroad membership product ($5/mo). The
// license key it issues unlocks Pro in the app + API (verified via
// /api/license against Gumroad v2). Live since 2026-10-10; subdomain moved to dawnlimited 2026-10-10.
export const GUMROAD_PRO_URL = "https://dawnlimited.gumroad.com/l/iyywbo";

// Tip jar: Hector's own Gumroad tip-jar product ($1+ pay-what-you-want).
// Rendered in the support strip (see components/AffiliateLinks.tsx).
export const TIP_JAR_URL = "https://dawnlimited.gumroad.com/l/moneyrate-tip";
export const hasTipJarLink = () => TIP_JAR_URL.startsWith("http");

// Supporter status: set in localStorage ("dawn_supporter") on a successful
// tip-jar verification (/api/verify-tip, or the admin-key bypass). Read-only
// helper for future supporter-gated features — nothing is gated behind it
// yet. NOTE: the supporter flag alone never hides the support strip; only
// "dawn_sponsored_hidden" does, and that is set solely by the explicit
// "Hide sponsored strip" toggle in Settings → Supporter. (The
// "dawn_sponsored_hidden" key name is historical — it is persisted user
// state and is intentionally not renamed.)
export const isSupporter = (): boolean => {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem("dawn_supporter") === "1";
  } catch {
    return false;
  }
};
