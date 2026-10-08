// Monetization: affiliate links.
//
// Hector pastes his real invite links here. While a URL is empty (or not an
// http URL), its button is NOT rendered — no broken links ever go live.
// Two links needed from Hector:
//   1. Wise invite/referral link      -> WISE_REFERRAL_URL
//   2. Coinbase (or other on-ramp) referral link -> COINBASE_REFERRAL_URL

export const WISE_REFERRAL_URL = "https://wise.com/invite/dic/hotungc3";
export const COINBASE_REFERRAL_URL = "";

export const hasWiseLink = () => WISE_REFERRAL_URL.startsWith("http");
export const hasCoinbaseLink = () => COINBASE_REFERRAL_URL.startsWith("http");
