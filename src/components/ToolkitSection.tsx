"use client";

import { useAtom } from "jotai";
import { useTranslation } from "@/hooks/useTranslation";
import { currency2DisplayAtom, hapticsAtom } from "@/lib/atoms";
import { vibrate } from "@/lib/fns";
import { BellSvg, DownloadSvg, GlobeSvg, ReverseSvg, TableSvg, XSvg } from "@/lib/svgs";
import AlertsSection from "./RateAlerts";

// Cross-border money toolkit — the small "life between currencies" strip
// under the converter (positioning A, 2026-10-09). Moments:
// rate alerts, tax-ready FX averages (downloadable CSV), plus the trip
// planner, rate compare and batch convert tools (added 2026-10-10).
// (A "send money abroad" Wise affiliate button used to sit here — removed
// 2026-11-21 under VOLUNTARY MONEY ONLY; see lib/affiliates.ts.)
// Labels are localized across all 30 locales (same keys as AffiliateLinks)
// so they react to language change.
//
// 2026-10-10: the strip wraps instead of scrolling horizontally — nothing
// here should ever be draggable/scrollable. Rate alerts opens its OWN modal
// (rate_alerts_modal) rendering the shared <AlertsSection/>; no more
// reaching into the currency modal's Settings tab via DOM.
export default function ToolkitSection({ baseCur }: { baseCur: string }) {
  const [haptics] = useAtom(hapticsAtom);
  const [currency2Display] = useAtom(currency2DisplayAtom);
  const i18n = useTranslation();

  const openAlerts = () => {
    vibrate(haptics);
    const modal = document.getElementById("rate_alerts_modal") as HTMLDialogElement | null;
    if (modal && !modal.open) modal.showModal();
  };

  const year = new Date().getFullYear();
  const item =
    "btn btn-sm shrink-0 whitespace-nowrap gap-1.5 text-[11px] px-2.5 btn-ghost border border-base-300";

  return (
    <>
      <section
        aria-label={i18n.home.toolkit}
        className="mb-2 mt-1 flex flex-wrap items-center gap-2 px-0.5 py-1"
      >
        <span className="text-[9px] uppercase tracking-wider opacity-40 shrink-0">{i18n.home.toolkit}</span>
        <button type="button" onClick={openAlerts} className={item} aria-label={i18n.home.toolkitAlerts} title={i18n.home.toolkitAlerts}>
          <BellSvg className="size-4" />
        </button>
        <a
          href={`/api/tax-csv?base=${encodeURIComponent(baseCur.toUpperCase())}&year=${year}`}
          className={item}
          aria-label={i18n.home.toolkitTax} title={i18n.home.toolkitTax}
        >
          <DownloadSvg className="size-4" />
        </a>
        <a href="/trip" className={item} aria-label={i18n.home.toolkitTrip} title={i18n.home.toolkitTrip}>
          <GlobeSvg className="size-4" />
        </a>
        <a href="/compare" className={item} aria-label={i18n.home.toolkitCompare} title={i18n.home.toolkitCompare}>
          <ReverseSvg className="size-4" />
        </a>
        <a href="/batch" className={item} aria-label={i18n.home.toolkitBatch} title={i18n.home.toolkitBatch}>
          <TableSvg className="size-4" />
        </a>
      </section>

      <dialog id="rate_alerts_modal" className="modal" aria-label={i18n.settings.rateAlerts}>
        <div className="modal-box max-w-[460px] p-4">
          <form method="dialog">
            <button type="submit" aria-label="Close" className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
              <XSvg className="size-4" />
            </button>
          </form>
          <AlertsSection currencies={currency2Display} baseCur={baseCur} />
        </div>
        <form method="dialog" className="modal-backdrop">
          <button type="submit">close</button>
        </form>
      </dialog>
    </>
  );
}
