// Monetization: affiliate links.
//
// Both links are live (Hector's real invite links, 2026-10-08).
// While a URL is empty (or not an http URL), its button is NOT rendered —
// no broken links ever go live.

export const WISE_REFERRAL_URL = "https://wise.com/invite/dic/hotungc3";
export const COINBASE_REFERRAL_URL = "https://advanced.coinbase.com/join/F95MLKD?src=referral-link";

export const hasWiseLink = () => WISE_REFERRAL_URL.startsWith("http");
export const hasCoinbaseLink = () => COINBASE_REFERRAL_URL.startsWith("http");
