"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import {
  AIRALO_REFERRAL_URL,
  AIRWALLEX_REFERRAL_URL,
  BINANCE_REFERRAL_URL,
  COINBASE_REFERRAL_URL,
  KOINLY_REFERRAL_URL,
  TIP_JAR_URL,
  WISE_REFERRAL_URL,
  hasAiraloLink,
  hasAirwallexLink,
  hasBinanceLink,
  hasCoinbaseLink,
  hasKoinlyLink,
  hasTipJarLink,
  hasWiseLink,
} from "@/lib/affiliates";

// Monetization strip — first content block under the toolbar, above the
// currency list, so it's always above the fold. Single slim row (not a tall
// card) to stay out of the converter's way. Solid brand-color buttons with a
// "Sponsored" disclosure and button labels localized across all 30 locales
// (positioning A follow-up, 2026-10-09 — labels now react to language change).
// Button order (2026-10-10): Hector's own tip jar FIRST, then affiliates by
// cross-border moment (positioning A, 2026-10-09): Send (Wise) · Travel
// (Airalo) · Tax (Koinly) · Trade (Coinbase/Binance) · Business (Airwallex).
// Renders nothing while the referral URLs are placeholders (see affiliates.ts).
// The strip hides ONLY on the explicit opt-in flag: supporters flip "Hide
// sponsored strip" in Settings → Supporter, which sets localStorage
// "dawn_sponsored_hidden" and dispatches a "dawn-sponsored-visibility" window
// event (listened to below) so the strip hides/shows immediately, no reload
// needed. The supporter flag "dawn_supporter" (set on tip verification)
// alone NEVER hides the strip — see isSupporter() in lib/affiliates.ts.
export default function AffiliateLinks() {
  const i18n = useTranslation();
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sync = () => setDismissed(localStorage.getItem("dawn_sponsored_hidden") === "1");
    sync();
    window.addEventListener("dawn-sponsored-visibility", sync);
    return () => window.removeEventListener("dawn-sponsored-visibility", sync);
  }, []);
  if (dismissed) return null;
  if (!hasTipJarLink() && !hasWiseLink() && !hasCoinbaseLink() && !hasBinanceLink() && !hasAiraloLink() && !hasKoinlyLink() && !hasAirwallexLink()) return null;

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
      {hasTipJarLink() && (
        <a
          href={TIP_JAR_URL}
          target="_blank"
          rel="noopener"
          draggable={false}
          className="btn btn-xs shrink-0 whitespace-nowrap border-0 bg-[#F0A832] text-black hover:bg-[#d9972a] text-[11px] px-2"
        >
          {i18n.home.tipJar} &rarr;
        </a>
      )}
      {hasWiseLink() && (
        <a
          href={WISE_REFERRAL_URL}
          target="_blank"
          rel="noopener sponsored"
          draggable={false}
          className="btn btn-xs shrink-0 whitespace-nowrap border-0 bg-[#9FE870] text-black hover:bg-[#86d957] text-[11px] px-2"
        >
          {i18n.home.affiliateSend} &rarr;
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
          {i18n.home.affiliateTravel} &rarr;
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
          {i18n.home.affiliateTax} &rarr;
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
          {i18n.home.affiliateBuyCrypto} &rarr;
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
          {i18n.home.affiliateTrade} &rarr;
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
          {i18n.home.affiliateBusiness} &rarr;
        </a>
      )}
    </section>
  );
}
