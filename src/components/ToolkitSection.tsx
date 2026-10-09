"use client";

import { useAtom } from "jotai";
import { hapticsAtom } from "@/lib/atoms";
import { vibrate } from "@/lib/fns";
import { BellSvg, DownloadSvg, ShareSvg } from "@/lib/svgs";
import { WISE_REFERRAL_URL } from "@/lib/affiliates";

// Cross-border money toolkit — the small "life between currencies" strip
// under the converter (positioning A, 2026-10-09). Three moments:
// rate alerts, tax-ready FX averages (downloadable CSV), and the cheapest
// way to send money abroad (Wise affiliate link).
// Labels are English-only in v1 — same precedent as the AffiliateLinks
// button labels (the "Sponsored" disclosure carries the localization).
export default function ToolkitSection({ baseCur }: { baseCur: string }) {
  const [haptics] = useAtom(hapticsAtom);

  const openAlerts = () => {
    vibrate(haptics);
    // The alert form lives on the Settings tab of the currency modal —
    // open the modal, then switch to that tab. No modal change needed:
    // the tab buttons are reachable by their accessible labels.
    const modal = document.getElementById("currency_list_modal") as HTMLDialogElement | null;
    if (!modal) return;
    if (!modal.open) modal.showModal();
    const settingsTab = modal.querySelector('[role="tab"][aria-label="Settings"]') as HTMLElement | null;
    settingsTab?.click();
  };

  const year = new Date().getFullYear();
  const item =
    "btn btn-sm shrink-0 whitespace-nowrap gap-1.5 text-[11px] px-2.5 btn-ghost border border-base-300";

  return (
    <section
      aria-label="Money toolkit"
      className="no-scrollbar mb-2 mt-1 flex flex-nowrap items-center gap-2 overflow-x-auto px-0.5 py-1"
    >
      <span className="text-[9px] uppercase tracking-wider opacity-40 shrink-0">Toolkit</span>
      <button type="button" onClick={openAlerts} className={item}>
        <BellSvg className="size-4" /> Rate alerts
      </button>
      <a
        href={`/api/tax-csv?base=${encodeURIComponent(baseCur.toUpperCase())}&year=${year}`}
        className={item}
        aria-label={`Download ${year} FX averages CSV for tax filing`}
      >
        <DownloadSvg className="size-4" /> Tax-ready FX averages
      </a>
      <a
        href={WISE_REFERRAL_URL}
        target="_blank"
        rel="noopener sponsored"
        draggable={false}
        className={item}
      >
        <ShareSvg className="size-4" /> Send money cheapest
      </a>
    </section>
  );
}
