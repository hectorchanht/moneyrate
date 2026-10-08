// Shareable rate-card image: hand-rolled canvas (no extra deps), shared via
// the Web Share API (Level 2 files) with a download fallback. Portrait 4:5
// suits chat apps and social posts.

export interface RateCardRow {
  code: string;
  text: string; // pre-formatted converted value, e.g. "70.12"
}

const W = 1080;
const H = 1350;

export async function shareRateCard(opts: {
  baseCur: string;
  amount: string;
  rows: RateCardRow[];
  footerDate: string;
}): Promise<'shared' | 'downloaded' | 'failed'> {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'failed';

    // Background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, W, H);
    // Subtle top glow
    const glow = ctx.createRadialGradient(W / 2, 0, 50, W / 2, 0, 700);
    glow.addColorStop(0, 'rgba(80,120,255,0.18)');
    glow.addColorStop(1, 'rgba(80,120,255,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#8b8b8b';
    ctx.font = '600 40px system-ui, sans-serif';
    ctx.fillText('💱 MONEYRATE', W / 2, 130);

    ctx.fillStyle = '#ffffff';
    ctx.font = '700 110px system-ui, sans-serif';
    ctx.fillText(`${opts.amount} ${opts.baseCur.toUpperCase()}`, W / 2, 270);

    // Divider
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(90, 330, W - 180, 2);

    // Rows
    const rows = opts.rows.slice(0, 8);
    const startY = 440;
    const lineH = 104;
    rows.forEach((r, i) => {
      const y = startY + i * lineH;
      ctx.textAlign = 'left';
      ctx.fillStyle = '#bdbdbd';
      ctx.font = '600 54px system-ui, sans-serif';
      ctx.fillText(r.code.toUpperCase(), 110, y);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.font = '700 54px system-ui, sans-serif';
      ctx.fillText(r.text, W - 110, y);
    });

    // Footer
    ctx.textAlign = 'center';
    ctx.fillStyle = '#6e6e6e';
    ctx.font = '400 34px system-ui, sans-serif';
    ctx.fillText(`moneyrate.lol · ${opts.footerDate}`, W / 2, H - 90);

    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/png'));
    if (!blob) return 'failed';
    const file = new File([blob], 'moneyrate-rates.png', { type: 'image/png' });

    if (typeof navigator !== 'undefined' && 'canShare' in navigator && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: 'moneyrate' });
      return 'shared';
    }
    // Download fallback (desktop / no Web Share files support)
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'moneyrate-rates.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    return 'downloaded';
  } catch {
    // navigator.share throws AbortError when the user cancels the sheet —
    // treat as a non-error from the caller's perspective.
    return 'failed';
  }
}
