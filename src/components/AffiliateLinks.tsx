"use client";

import { useTranslation } from "@/hooks/useTranslation";
import {
  AIRALO_REFERRAL_URL,
  AIRWALLEX_REFERRAL_URL,
  BINANCE_REFERRAL_URL,
  COINBASE_REFERRAL_URL,
  KOINLY_REFERRAL_URL,
  WISE_REFERRAL_URL,
  hasAiraloLink,
  hasAirwallexLink,
  hasBinanceLink,
  hasCoinbaseLink,
  hasKoinlyLink,
  hasWiseLink,
} from "@/lib/affiliates";

// Monetization strip — first content block under the toolbar, above the
// currency list, so it's always above the fold. Single slim row (not a tall
// card) to stay out of the converter's way. Solid brand-color buttons with a
// "Sponsored" disclosure (localized across all 30 locales; the button labels
// stay English-only for now — the v1 state).
// Buttons are ordered by cross-border moment (positioning A, 2026-10-09):
// Send (Wise) · Travel (Airalo) · Tax (Koinly) · Trade (Coinbase/Binance) ·
// Business (Airwallex).
// Renders nothing while the referral URLs are placeholders (see affiliates.ts).
export default function AffiliateLinks() {
  const i18n = useTranslation();
  if (!hasWiseLink() && !hasCoinbaseLink() && !hasBinanceLink() && !hasAiraloLink() && !hasKoinlyLink() && !hasAirwallexLink()) return null;

  return (
    <section
      aria-label={i18n.home.sponsored}
      // Horizontally scrollable (never clips a button on narrow viewports —
      // overflow-hidden cut "Buy crypto" in half on phones). The anchors are
      // display-only links: draggable={false} so the touch drag-drop polyfill
      // can't pull a button out of the strip mid-drag (seen live 2026-10-08).
      className="no-scrollbar mb-2 flex flex-nowrap items-center gap-2 overflow-x-auto rounded-lg border border-base-300 bg-base-200/60 px-2.5 py-1.5"
    >
      <span className="text-[9px] uppercase tracking-wider opacity-40 shrink-0">{i18n.home.sponsored}</span>
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
      {hasAiraloLink() && (
        <a
          href={AIRALO_REFERRAL_URL}
          target="_blank"
          rel="noopener sponsored"
          draggable={false}
          className="btn btn-xs shrink-0 whitespace-nowrap border-0 bg-[#F43F5E] text-white hover:bg-[#d92f4d] text-[11px] px-2"
        >
          Get travel eSIM &rarr;
        </a>
      )}
      {hasKoinlyLink() && (
        <a
          href={KOINLY_REFERRAL_URL}
          target="_blank"
          rel="noopener sponsored"
          draggable={false}
          className="btn btn-xs shrink-0 whitespace-nowrap border-0 bg-[#4F46E5] text-white hover:bg-[#3f39c4] text-[11px] px-2"
        >
          Crypto tax reports &rarr;
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
      {hasAirwallexLink() && (
        <a
          href={AIRWALLEX_REFERRAL_URL}
          target="_blank"
          rel="noopener sponsored"
          draggable={false}
          className="btn btn-xs shrink-0 whitespace-nowrap border-0 bg-[#0B1F4B] text-white hover:bg-[#16295c] text-[11px] px-2"
        >
          Business FX accounts &rarr;
        </a>
      )}
    </section>
  );
}
