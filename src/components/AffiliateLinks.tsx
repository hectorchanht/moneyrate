"use client";

import {
  COINBASE_REFERRAL_URL,
  WISE_REFERRAL_URL,
  hasCoinbaseLink,
  hasWiseLink,
} from "@/lib/affiliates";

// Tasteful, on-theme monetization strip under the converter list.
// Renders nothing while the referral URLs are placeholders (see affiliates.ts).
// NOTE (v1): English-only strings; the site's 30 locales fall back to these.
export default function AffiliateLinks() {
  if (!hasWiseLink() && !hasCoinbaseLink()) return null;

  return (
    <div className="mt-2 mb-4 text-center">
      <p className="text-xs opacity-60 mb-2">Need to move money for real?</p>
      <div className="flex flex-wrap justify-center gap-2">
        {hasWiseLink() && (
          <a
            href={WISE_REFERRAL_URL}
            target="_blank"
            rel="noopener sponsored"
            className="btn btn-outline btn-sm"
          >
            Send money abroad &rarr;
          </a>
        )}
        {hasCoinbaseLink() && (
          <a
            href={COINBASE_REFERRAL_URL}
            target="_blank"
            rel="noopener sponsored"
            className="btn btn-outline btn-sm"
          >
            Buy crypto &rarr;
          </a>
        )}
      </div>
    </div>
  );
}
