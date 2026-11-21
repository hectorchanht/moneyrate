"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { track } from "@/lib/analytics";
import { TIP_JAR_URL, hasTipJarLink } from "@/lib/affiliates";

// Support strip — first content block under the toolbar, above the
// currency list, so it's always above the fold. Single slim row (not a
// tall card) to stay out of the converter's way.
//
// 2026-11-21 — VOLUNTARY MONEY ONLY (Hector's decision): this strip used
// to carry third-party affiliate/referral buttons (Wise, Coinbase,
// Binance, …). They were all removed; the strip now carries exactly one
// thing — Hector's own tip jar, the voluntary "buy me a coffee" channel.
// (Component name kept for import stability.)
//
// The strip hides ONLY on the explicit opt-in flag: supporters flip "Hide
// sponsored strip" in Settings → Supporter, which sets localStorage
// "dawn_sponsored_hidden" and dispatches a "dawn-sponsored-visibility"
// window event (listened to below) so the strip hides/shows immediately,
// no reload needed. The supporter flag "dawn_supporter" (set on tip
// verification) alone NEVER hides the strip — see isSupporter() in
// lib/affiliates.ts. (The "sponsored" names in the persisted keys/event
// are historical and intentionally kept — renaming them would orphan
// existing users' saved visibility choices.)
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
  if (!hasTipJarLink()) return null;

  return (
    <section
      aria-label={i18n.home.tipJar}
      // Horizontally scrollable (never clips on narrow viewports). The
      // anchor is display-only: draggable={false} so the touch drag-drop
      // polyfill can't pull it out of the strip mid-drag (seen live
      // 2026-10-08).
      className="no-scrollbar mb-2 flex flex-nowrap items-center gap-2 overflow-x-auto rounded-lg border border-base-300 bg-base-200/60 px-2.5 py-1.5"
    >
      <a
        href={TIP_JAR_URL}
        target="_blank"
        rel="noopener"
        draggable={false}
        onClick={() => track('tip_jar_opened', { location: 'sponsored_strip' })}
        className="btn btn-xs shrink-0 whitespace-nowrap border-0 bg-[#F0A832] text-black hover:bg-[#d9972a] text-[11px] px-2"
      >
        {i18n.home.tipJar} &rarr;
      </a>
    </section>
  );
}
