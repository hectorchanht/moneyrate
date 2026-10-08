"use client";

import {
  BINANCE_REFERRAL_URL,
  COINBASE_REFERRAL_URL,
  WISE_REFERRAL_URL,
  hasBinanceLink,
  hasCoinbaseLink,
  hasWiseLink,
} from "@/lib/affiliates";

// Monetization strip — first content block under the toolbar, above the
// currency list, so it's always above the fold. Single slim row (not a tall
// card) to stay out of the converter's way. Solid brand-color buttons with a
// "Sponsored" disclosure.
// Renders nothing while the referral URLs are placeholders (see affiliates.ts).
// NOTE (v1): English-only strings; the site's 30 locales fall back to these.
export default function AffiliateLinks() {
  if (!hasWiseLink() && !hasCoinbaseLink() && !hasBinanceLink()) return null;

  return (
    <section
      aria-label="Sponsored links"
      // Horizontally scrollable (never clips a button on narrow viewports —
      // overflow-hidden cut "Buy crypto" in half on phones). The anchors are
      // display-only links: draggable={false} so the touch drag-drop polyfill
      // can't pull a button out of the strip mid-drag (seen live 2026-10-08).
      className="no-scrollbar mb-2 flex flex-nowrap items-center gap-2 overflow-x-auto rounded-lg border border-base-300 bg-base-200/60 px-2.5 py-1.5"
    >
      {/* Label hides on narrow screens so the buttons get the room. */}
      <p className="hidden min-w-0 flex-1 truncate text-xs opacity-70 min-[480px]:block">Need to move money for real?</p>
      <span className="text-[9px] uppercase tracking-wider opacity-40 shrink-0">Sponsored</span>
      {hasWiseLink() && (
        <a
          href={WISE_REFERRAL_URL}
          target="_blank"
          rel="noopener sponsored"
          draggable={false}
          className="btn btn-xs shrink-0 whitespace-nowrap border-0 bg-[#9FE870] text-black hover:bg-[#86d957] text-[11px] px-2"
        >
          Send money abroad &rarr;
        </a>
      )}
      {hasCoinbaseLink() && (
        <a
          href={COINBASE_REFERRAL_URL}
          target="_blank"
          rel="noopener sponsored"
          draggable={false}
          className="btn btn-xs shrink-0 whitespace-nowrap border-0 bg-[#0052FF] text-white hover:bg-[#0040c8] text-[11px] px-2"
        >
          Buy crypto &rarr;
        </a>
      )}
      {hasBinanceLink() && (
        <a
          href={BINANCE_REFERRAL_URL}
          target="_blank"
          rel="noopener sponsored"
          draggable={false}
          className="btn btn-xs shrink-0 whitespace-nowrap border-0 bg-[#F0B90B] text-black hover:bg-[#d9a90a] text-[11px] px-2"
        >
          Trade on Binance &rarr;
        </a>
      )}
    </section>
  );
}
