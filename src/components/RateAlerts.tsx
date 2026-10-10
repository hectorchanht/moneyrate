"use client";

// Rate-alert UI — extracted from CurrencyListModal.tsx 2026-10-10 so the
// toolkit's Rate alerts button can open its OWN modal instead of reaching
// into the currency modal's Settings tab via DOM. Single source of truth:
// both the currency modal's Settings tab and the toolkit modal render
// <AlertsSection/>, so the Push/Email alert forms stay in sync.
import { useAtom } from 'jotai';
import React, { useEffect, useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { hapticsAtom, proAtom, rateAlertsAtom } from '@/lib/atoms';
import { isSupporter } from '@/lib/affiliates';
import { vibrate } from '@/lib/fns';
import { BellSvg, CrossSvg, MailSvg, TrendDownSvg, TrendUpSvg } from '@/lib/svgs';
import { AlertDirection, AlertKind, RateAlert } from '@/lib/types';

const FREE_ALERT_LIMIT = 3;
// Supporter unlock (2026-10-10): verified tip-jar tippers (isSupporter(),
// localStorage "dawn_supporter") get a raised cap — a goodwill unlock,
// client-side only. Pro (license key) stays unlimited; the free plan stays
// at 3. No currently-free feature was limited to make room for this.
const SUPPORTER_ALERT_LIMIT = 10;

const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Alert target form shared by the Push and Email tabs: From / To / Target /
// direction picker + submit. One component so both tabs always look and
// behave the same (unified 2026-10-09 — previously two stacked sections
// with duplicated forms).
interface AlertTargetFormProps {
  currencies: string[];
  from: string;
  to: string;
  target: string;
  direction: AlertDirection;
  setFrom: (c: string) => void;
  setTo: (c: string) => void;
  setTarget: (s: string) => void;
  setDirection: (d: AlertDirection) => void;
  submitLabel: React.ReactNode;
  submitDisabled: boolean;
  onSubmit: () => void;
  // Push tab only: 'target' hits a rate level, 'pct' fires on a 24h % move.
  // Defaults to 'target' (the Email tab never passes a kind).
  kind?: AlertKind;
}

// Icon direction picker — trend arrows instead of text-only buttons.
// Labels are overridable: the % move alert uses Rises/Falls instead of
// Above/Below.
const DirectionPicker: React.FC<{
  direction: AlertDirection;
  setDirection: (d: AlertDirection) => void;
  aboveLabel?: string;
  belowLabel?: string;
}> = ({ direction, setDirection, aboveLabel, belowLabel }) => {
  const [haptics] = useAtom(hapticsAtom);
  const t = useTranslation();
  const pick = (d: AlertDirection) => { vibrate(haptics); setDirection(d); };
  const cls = (d: AlertDirection) =>
    `btn join-item flex-1 gap-1.5 ${direction === d ? 'btn-primary' : 'btn-ghost'}`;
  const up = aboveLabel ?? t.settings.alertAbove;
  const down = belowLabel ?? t.settings.alertBelow;
  return (
    <div className="join flex-1" role="radiogroup" aria-label={`${up} / ${down}`}>
      <button type="button" role="radio" aria-checked={direction === 'above'} className={cls('above')} onClick={() => pick('above')}>
        <TrendUpSvg className="size-4 shrink-0" />{up}
      </button>
      <button type="button" role="radio" aria-checked={direction === 'below'} className={cls('below')} onClick={() => pick('below')}>
        <TrendDownSvg className="size-4 shrink-0" />{down}
      </button>
    </div>
  );
};

const AlertTargetForm: React.FC<AlertTargetFormProps> = ({
  currencies, from, to, target, direction,
  setFrom, setTo, setTarget, setDirection,
  submitLabel, submitDisabled, onSubmit, kind = 'target',
}) => {
  const t = useTranslation();
  const isPct = kind === 'pct';
  const targetLabel = isPct ? t.settings.alertPctThreshold : t.settings.alertTarget;
  return (
    <>
      <div className="grid grid-cols-2 gap-2 mb-2">
        <label className="flex flex-col gap-1 min-w-0">
          <span className="text-xs opacity-70">{t.settings.alertFrom}</span>
          {/* Default-size selects: select-sm clipped the selected value on
              some Android builds (seen live 2026-10-09). Code-only labels:
              "JPY — Japanese Yen" truncated to "JPY …" in half-width selects
              (seen live 2026-10-08). */}
          <select className="select select-bordered w-full truncate" value={from} onChange={(e) => setFrom(e.target.value)} aria-label={t.settings.alertFrom}>
            {currencies.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 min-w-0">
          <span className="text-xs opacity-70">{t.settings.alertTo}</span>
          <select className="select select-bordered w-full truncate" value={to} onChange={(e) => setTo(e.target.value)} aria-label={t.settings.alertTo}>
            {currencies.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
          </select>
        </label>
      </div>
      <label className="flex flex-col gap-1 mb-2">
        <span className="text-xs opacity-70">{targetLabel}</span>
        <input
          type="number" inputMode="decimal" min="0" step="any"
          className="input input-bordered w-full"
          placeholder={isPct ? '3' : '160'}
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          aria-label={targetLabel}
        />
      </label>
      <div className="flex gap-2 mb-2">
        <DirectionPicker
          direction={direction}
          setDirection={setDirection}
          aboveLabel={isPct ? t.settings.alertRises : undefined}
          belowLabel={isPct ? t.settings.alertFalls : undefined}
        />
        <button type="button" className="btn btn-primary flex-1" onClick={onSubmit} disabled={submitDisabled}>
          {submitLabel}
        </button>
      </div>
    </>
  );
};

// Push (device-notification) alerts tab. Alerts are evaluated in page.tsx
// whenever fresh rates arrive; this component is CRUD + permission only.
// Free plan cap on rate alerts; supporters get 10; Pro (license key in
// Settings) is unlimited.
const PushAlertsTab: React.FC<{ currencies: string[]; baseCur: string }> = ({ currencies, baseCur }) => {
  const [alerts, setAlerts] = useAtom(rateAlertsAtom);
  const [haptics] = useAtom(hapticsAtom);
  const [pro] = useAtom(proAtom);
  const [capHit, setCapHit] = useState(false);
  // Read on mount (not during render) so SSR/hydration always starts from
  // the free-plan copy — same pattern as AffiliateLinks' dismissed flag.
  const [supporter, setSupporter] = useState(false);
  useEffect(() => { setSupporter(isSupporter()); }, []);
  const alertLimit = supporter ? SUPPORTER_ALERT_LIMIT : FREE_ALERT_LIMIT;
  const t = useTranslation();
  const [from, setFrom] = useState(baseCur);
  const [to, setTo] = useState(currencies.find(c => c !== baseCur) ?? '');
  const [target, setTarget] = useState('');
  const [direction, setDirection] = useState<AlertDirection>('above');
  const [kind, setKind] = useState<AlertKind>('target');
  const [perm, setPerm] = useState<string>(typeof Notification !== 'undefined' ? Notification.permission : 'unsupported');

  const addAlert = () => {
    const targetNum = parseFloat(target);
    if (!from || !to || from === to || !(targetNum > 0)) return;
    if (!pro && alerts.length >= alertLimit) { setCapHit(true); vibrate(haptics); return; }
    vibrate(haptics);
    const alert: RateAlert = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      from, to, target: targetNum, direction, kind,
      triggered: false, createdAt: Date.now(),
    };
    setAlerts(prev => [...prev, alert]);
    setTarget('');
  };

  const requestPermission = async () => {
    try {
      const p = await Notification.requestPermission();
      setPerm(p);
      vibrate(haptics);
    } catch { /* Notification API unsupported */ }
  };

  const canAdd = parseFloat(target) > 0 && !!from && !!to && from !== to;

  return (
    <div>
      {perm !== 'granted' && perm !== 'unsupported' && (
        <button type="button" className="btn btn-outline w-full mb-2" onClick={requestPermission}>
          {t.settings.alertEnableNotifications}{perm === 'denied' ? ' (blocked — allow in browser settings)' : ''}
        </button>
      )}

      {/* Alert kind: target rate vs 24h % move. Email alerts stay target-only —
          the server cron has no 24h-ago rates to compare against. */}
      <div className="join w-full mb-2" role="radiogroup" aria-label={`${t.settings.alertKindTarget} / ${t.settings.alertKindPct}`}>
        <button
          type="button" role="radio" aria-checked={kind === 'target'}
          className={`btn join-item flex-1 gap-1.5 ${kind === 'target' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => { vibrate(haptics); setKind('target'); }}
        >
          🎯 {t.settings.alertKindTarget}
        </button>
        <button
          type="button" role="radio" aria-checked={kind === 'pct'}
          className={`btn join-item flex-1 gap-1.5 ${kind === 'pct' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => { vibrate(haptics); setKind('pct'); }}
        >
          📈 {t.settings.alertKindPct}
        </button>
      </div>

      <AlertTargetForm
        currencies={currencies}
        from={from} to={to} target={target} direction={direction}
        setFrom={setFrom} setTo={setTo} setTarget={setTarget} setDirection={setDirection}
        submitLabel={t.settings.alertAdd}
        submitDisabled={!canAdd}
        onSubmit={addAlert}
        kind={kind}
      />

      {!pro && (
        <p className="text-xs opacity-60 mb-2">
          {capHit
            ? <>{supporter ? 'Supporter plan' : 'Free plan'} allows {alertLimit} alerts — <a href="/api-docs#pro" className="link">go Pro</a> for unlimited.</>
            : <>{supporter ? 'Supporter plan' : 'Free plan'}: {alertLimit} alerts · <a href="/api-docs#pro" className="link">Pro</a> for unlimited</>}
        </p>
      )}
      {alerts.length === 0 ? (
        <p className="text-xs opacity-50 mb-1">{t.settings.alertNoAlerts}</p>
      ) : (
        <ul className="flex flex-col gap-1 mb-1">
          {alerts.map(a => (
            <li key={a.id} className="flex items-center gap-2 text-sm bg-base-200 rounded px-2 py-1.5">
              <span className="flex-1 tabular-nums">
                {(a.kind ?? 'target') === 'pct' ? (
                  <>{a.from.toUpperCase()}→{a.to.toUpperCase()} {a.direction === 'above' ? '↗' : '↘'} {a.direction === 'above' ? '≥' : '≤'}{a.target}%</>
                ) : (
                  <>1 {a.from.toUpperCase()} {a.direction === 'above' ? '≥' : '≤'} {a.target} {a.to.toUpperCase()}</>
                )}
                {a.triggered && <span className="badge badge-success badge-sm ml-2">{t.settings.alertTriggered}</span>}
              </span>
              {a.triggered && (
                <button type="button" className="btn btn-ghost btn-xs" onClick={() => { vibrate(haptics); setAlerts(prev => prev.map(x => x.id === a.id ? { ...x, triggered: false } : x)); }}>
                  {t.settings.alertRearm}
                </button>
              )}
              <button type="button" className="btn btn-ghost btn-xs" aria-label={`${t.settings.alertDelete} 1 ${a.from.toUpperCase()} ${a.to.toUpperCase()}`} onClick={() => { vibrate(haptics); setCapHit(false); setAlerts(prev => prev.filter(x => x.id !== a.id)); }}>
                <CrossSvg className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// Email rate alerts via Resend (English-only strings — same precedent as
// AffiliateLinks). One active alert per email address (v1); firing is
// one-shot, resubscribing re-arms. Needs RESEND_API_KEY on Vercel.
const EmailAlertsTab: React.FC<{ currencies: string[]; baseCur: string }> = ({ currencies, baseCur }) => {
  const [haptics] = useAtom(hapticsAtom);
  const [email, setEmail] = useState('');
  const [from, setFrom] = useState(baseCur);
  const [to, setTo] = useState(currencies.find(c => c !== baseCur) ?? '');
  const [target, setTarget] = useState('');
  const [direction, setDirection] = useState<AlertDirection>('above');
  const [status, setStatus] = useState<'idle' | 'sending' | 'ok' | 'dup' | 'bad' | 'off'>('idle');

  const subscribe = async () => {
    const targetNum = parseFloat(target);
    if (!EMAIL_OK.test(email) || !from || !to || from === to || !(targetNum > 0)) return;
    setStatus('sending');
    try {
      const res = await fetch('/api/alerts/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), base: from, target: to, direction, target_rate: targetNum }),
      });
      if (res.ok) { setStatus('ok'); setTarget(''); }
      else if (res.status === 409) setStatus('dup');
      else if (res.status === 503) setStatus('off');
      else setStatus('bad');
    } catch {
      setStatus('bad');
    }
    vibrate(haptics);
  };

  const ok = EMAIL_OK.test(email) && from && to && from !== to && parseFloat(target) > 0;

  return (
    <div>
      <p className="text-xs opacity-60 mb-2">
        One email when your target hits — no app open needed. One active alert per address.
      </p>
      <label className="flex flex-col gap-1 mb-2">
        <span className="text-xs opacity-70">Email</span>
        <input
          type="email" inputMode="email"
          className="input input-bordered w-full"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setStatus('idle'); }}
          aria-label="Email for alerts"
        />
      </label>
      <AlertTargetForm
        currencies={currencies}
        from={from} to={to} target={target} direction={direction}
        setFrom={setFrom} setTo={setTo}
        setTarget={(s) => { setTarget(s); setStatus('idle'); }}
        setDirection={setDirection}
        submitLabel={status === 'sending' ? 'Subscribing…' : 'Notify me'}
        submitDisabled={!ok || status === 'sending'}
        onSubmit={subscribe}
      />
      {status === 'ok' && <p className="text-xs text-success mb-1">Subscribed — check your inbox for confirmation.</p>}
      {status === 'dup' && <p className="text-xs text-warning mb-1">This email already has an active alert.</p>}
      {status === 'bad' && <p className="text-xs text-error mb-1">Something went wrong — try again.</p>}
      {status === 'off' && <p className="text-xs text-warning mb-1">Email alerts aren&apos;t configured yet.</p>}
    </div>
  );
};

// Alerts section: Push (device notifications) and Email tabs sharing one
// target form (AlertTargetForm). Tabbed 2026-10-09 — the two alert types were
// stacked sections with duplicated From/To/Target forms.
const AlertsSection: React.FC<{ currencies: string[]; baseCur: string }> = ({ currencies, baseCur }) => {
  const [tab, setTab] = useState<'push' | 'email'>('push');
  const [haptics] = useAtom(hapticsAtom);
  const t = useTranslation();
  const cls = (name: 'push' | 'email') => `tab gap-1.5 ${tab === name ? 'tab-active' : ''}`;
  return (
    <div>
      <div className="label">
        <span className="label-text flex items-center gap-2"><BellSvg className="size-5" />{t.settings.rateAlerts}</span>
      </div>
      <div role="tablist" aria-label={t.settings.rateAlerts} className="tabs tabs-boxed mb-2">
        <button type="button" role="tab" aria-selected={tab === 'push'} className={cls('push')} onClick={() => { vibrate(haptics); setTab('push'); }}>
          <BellSvg className="size-4" />{t.settings.alertTabPush}
        </button>
        <button type="button" role="tab" aria-selected={tab === 'email'} className={cls('email')} onClick={() => { vibrate(haptics); setTab('email'); }}>
          <MailSvg className="size-4" />{t.settings.alertTabEmail}
        </button>
      </div>
      {tab === 'push'
        ? <PushAlertsTab currencies={currencies} baseCur={baseCur} />
        : <EmailAlertsTab currencies={currencies} baseCur={baseCur} />}
    </div>
  );
};

export default AlertsSection;
