"use client";

import {
  COINBASE_REFERRAL_URL,
  WISE_REFERRAL_URL,
  hasCoinbaseLink,
  hasWiseLink,
} from "@/lib/affiliates";

// Monetization strip — first content block under the toolbar, above the
// currency list, so it's always above the fold. Solid brand-color buttons
// (not ghost outlines) with a clear "Sponsored" disclosure.
// Renders nothing while the referral URLs are placeholders (see affiliates.ts).
// NOTE (v1): English-only strings; the site's 30 locales fall back to these.
export default function AffiliateLinks() {
  if (!hasWiseLink() && !hasCoinbaseLink()) return null;

  return (
    <section
      aria-label="Sponsored links"
      className="mb-3 rounded-xl border border-base-300 bg-base-200/60 px-3 py-2.5"
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <p className="text-sm font-medium">Need to move money for real?</p>
        <span className="text-[10px] uppercase tracking-wider opacity-50 shrink-0">Sponsored</span>
      </div>
      <div className="flex gap-2">
        {hasWiseLink() && (
          <a
            href={WISE_REFERRAL_URL}
            target="_blank"
            rel="noopener sponsored"
            className="btn btn-md flex-1 border-0 bg-[#9FE870] text-black hover:bg-[#86d957] min-h-[44px]"
          >
            Send money abroad &rarr;
          </a>
        )}
        {hasCoinbaseLink() && (
          <a
            href={COINBASE_REFERRAL_URL}
            target="_blank"
            rel="noopener sponsored"
            className="btn btn-md flex-1 border-0 bg-[#0052FF] text-white hover:bg-[#0040c8] min-h-[44px]"
          >
            Buy crypto &rarr;
          </a>
        )}
      </div>
    </section>
  );
}
