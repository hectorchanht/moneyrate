import { useTranslation } from '@/hooks/useTranslation';
import { GUMROAD_PRO_URL } from '@/lib/affiliates';
import {
  compactRowsAtom,
  copyFormatAtom,
  currency2DisplayAtom,
  defaultCurrencyValueAtom,
  defaultCurrencyValueDpAtom,
  hapticsAtom,
  isDefaultCurrencyValueAtom,
  isEditingAtom,
  languageAtom,
  licenseKeyAtom,
  PERSISTED_ATOM_KEYS,
  proAtom,
  showChangePctAtom,
  showCopyButtonsAtom,
  showPinButtonsAtom,
  sortModeAtom,
  themeModeAtom
} from '@/lib/atoms';
import { DefaultCurrency2Display } from '@/lib/constants';
import { vibrate } from '@/lib/fns';
import { AddSvg, CrossSvg, ListSvg, SettingSvg, TableSvg, XSvg } from '@/lib/svgs';
import { CopyFormat, Language, LanguageCode, SortMode, ThemeMode } from '@/lib/types';
import { useAtom } from 'jotai';
import React, { useEffect, useMemo, useState } from 'react';
import CountryImg from './CountryImg';
import AlertsSection from './RateAlerts';

export type LanguageOption = {
  value: Language;
  label: string;
};

// Shared with the top-bar globe menu (page.tsx) so the dropdown and the
// settings select always list the same 30 languages.
export const languageOptions: LanguageOption[] = [
  { value: 'en', label: 'English' },
  { value: 'zh-TW', label: '繁體中文' },
  { value: 'zh-CN', label: '简体中文' },
  { value: 'ja', label: '日本語' },
  { value: 'ko', label: '한국어' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'es', label: 'Español' },
  { value: 'it', label: 'Italiano' },
  { value: 'pt', label: 'Português' },
  { value: 'ru', label: 'Русский' },
  { value: 'ar', label: 'العربية' },
  { value: 'hi', label: 'हिन्दी' },
  { value: 'bn', label: 'বাংলা' },
  { value: 'pa', label: 'ਪੰਜਾਬੀ' },
  { value: 'ur', label: 'اردو' },
  { value: 'vi', label: 'Tiếng Việt' },
  { value: 'th', label: 'ไทย' },
  { value: 'id', label: 'Bahasa Indonesia' },
  { value: 'ms', label: 'Bahasa Melayu' },
  { value: 'nl', label: 'Nederlands' },
  { value: 'sv', label: 'Svenska' },
  { value: 'no', label: 'Norsk' },
  { value: 'da', label: 'Dansk' },
  { value: 'fi', label: 'Suomi' },
  { value: 'pl', label: 'Polski' },
  { value: 'ro', label: 'Română' },
  { value: 'sk', label: 'Slovenčina' },
  { value: 'sl', label: 'Slovenščina' },
  { value: 'tr', label: 'Türkçe' },
]


interface CurrencyListModalProps {
  data: Record<string, string>;
  baseCur: string;
}

interface CurrencyListTableProps {
  data: Record<string, string>;
}




interface CurrencyListTableProps {
  data: Record<string, string>;
}

// Pro license settings (English-only strings — same precedent as AffiliateLinks).
// The key is a Gumroad license key for the paid tier; verified via /api/license.


const ProSettings: React.FC = () => {
  const [licenseKey, setLicenseKey] = useAtom(licenseKeyAtom);
  const [pro, setPro] = useAtom(proAtom);
  const [haptics] = useAtom(hapticsAtom);
  const [input, setInput] = useState(licenseKey);
  const [status, setStatus] = useState<'idle' | 'checking' | 'ok' | 'bad'>('idle');

  const verify = async () => {
    const key = input.trim();
    if (!key) return;
    setStatus('checking');
    try {
      const res = await fetch(`/api/license?key=${encodeURIComponent(key)}`);
      const json = await res.json();
      if (json?.valid) {
        setLicenseKey(key);
        setPro(true);
        setStatus('ok');
      } else {
        setPro(false);
        setStatus('bad');
      }
    } catch {
      setStatus('bad');
    }
    vibrate(haptics);
  };

  const remove = () => {
    setLicenseKey('');
    setPro(false);
    setInput('');
    setStatus('idle');
    vibrate(haptics);
  };

  return (
    <div>
      <div className="label">
        <span className="label-text flex items-center gap-2">
          ✦ MoneyRate Pro
          {pro && <span className="badge badge-success badge-sm">Active</span>}
        </span>
      </div>
      <p className="text-xs opacity-60 mb-2">
        Unlimited rate alerts + white-label embeds. <a href="/api-docs#pro" className="link">Learn more</a>
      </p>
      {!pro && (
        <a href={GUMROAD_PRO_URL} target="_blank" rel="noopener" className="btn btn-primary btn-sm w-full mb-2">
          ✦ Get Pro — $5/month
        </a>
      )}
      <div className="flex gap-2 mb-1">
        <input
          type="text"
          className="input input-bordered input-sm flex-1 min-w-0 font-mono"
          placeholder="Gumroad license key"
          value={input}
          onChange={(e) => { setInput(e.target.value); setStatus('idle'); }}
          aria-label="Pro license key"
        />
        <button type="button" className="btn btn-sm btn-primary shrink-0" onClick={verify} disabled={!input.trim() || status === 'checking'}>
          {status === 'checking' ? 'Checking…' : pro ? 'Re-verify' : 'Activate'}
        </button>
        {(pro || licenseKey) && (
          <button type="button" className="btn btn-sm btn-ghost shrink-0" onClick={remove}>
            Remove
          </button>
        )}
      </div>
      {status === 'bad' && (
        <p className="text-xs text-error mb-1">That key didn&apos;t verify — check it and try again.</p>
      )}
      {status === 'ok' && (
        <p className="text-xs text-success mb-1">Pro activated — unlimited alerts unlocked.</p>
      )}
    </div>
  );
};


// Sponsored-strip visibility for tippers (English-only strings — same
// precedent as ProSettings). A Gumroad tip-jar license key (verified via
// /api/verify-tip) sets localStorage "dawn_sponsored_hidden", which
// AffiliateLinks honors. The admin license key also verifies here.
const SponsoredStripSettings: React.FC = () => {
  const [haptics] = useAtom(hapticsAtom);
  const [hidden, setHidden] = useState(false);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<'idle' | 'checking' | 'ok' | 'bad'>('idle');

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('dawn_sponsored_hidden') === '1') {
      setHidden(true);
    }
  }, []);

  const verify = async () => {
    const key = input.trim();
    if (!key) return;
    setStatus('checking');
    try {
      const res = await fetch('/api/verify-tip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseKey: key }),
      });
      const json = await res.json();
      if (json?.ok) {
        localStorage.setItem('dawn_sponsored_hidden', '1');
        setHidden(true);
        setStatus('ok');
      } else {
        setStatus('bad');
      }
    } catch {
      setStatus('bad');
    }
    vibrate(haptics);
  };

  const showAgain = () => {
    localStorage.removeItem('dawn_sponsored_hidden');
    setHidden(false);
    setInput('');
    setStatus('idle');
    vibrate(haptics);
  };

  return (
    <div>
      <div className="label">
        <span className="label-text flex items-center gap-2">
          ☕ Sponsored strip
          {hidden && <span className="badge badge-success badge-sm">Hidden</span>}
        </span>
      </div>
      {hidden ? (
        <div>
          <p className="text-xs opacity-60 mb-2">☕ Thanks for tipping — the sponsored strip is hidden.</p>
          <button type="button" className="btn btn-sm btn-ghost" onClick={showAgain}>
            Show again
          </button>
        </div>
      ) : (
        <div>
          <p className="text-xs opacity-60 mb-2">
            Tipped us on Gumroad? Enter the license key from your purchase receipt email to hide the sponsored strip.
          </p>
          <div className="flex gap-2 mb-1">
            <input
              type="text"
              className="input input-bordered input-sm flex-1 min-w-0 font-mono"
              placeholder="Tip license key"
              value={input}
              onChange={(e) => { setInput(e.target.value); setStatus('idle'); }}
              aria-label="Tip license key"
            />
            <button
              type="button"
              className="btn btn-sm btn-primary shrink-0"
              onClick={verify}
              disabled={!input.trim() || status === 'checking'}
            >
              {status === 'checking' ? 'Checking…' : 'Verify'}
            </button>
          </div>
          {status === 'bad' && (
            <p className="text-xs text-error mb-1">That key didn&apos;t verify — check the license key in your Gumroad receipt email.</p>
          )}
        </div>
      )}
    </div>
  );
};


const CurrencySetting: React.FC<{ baseCur: string }> = ({ baseCur }) => {
  const [isDefaultCurrencyValue, setIsDefaultCurrencyValue] = useAtom(isDefaultCurrencyValueAtom);
  const [defaultCurrencyValue, setDefaultCurrencyValue] = useAtom(defaultCurrencyValueAtom);
  const [defaultCurrencyValueDp, setDefaultCurrencyValueDp] = useAtom(defaultCurrencyValueDpAtom);
  const [isEditing, setIsEditing] = useAtom(isEditingAtom);
  const [currency2Display, setCurrency2Display] = useAtom(currency2DisplayAtom);
  const [language, setLanguage] = useAtom(languageAtom);
  const [sortMode, setSortMode] = useAtom(sortModeAtom);
  const [themeMode, setThemeMode] = useAtom(themeModeAtom);
  const [showChangePct, setShowChangePct] = useAtom(showChangePctAtom);
  const [compactRows, setCompactRows] = useAtom(compactRowsAtom);
  const [copyFormat, setCopyFormat] = useAtom(copyFormatAtom);
  const [haptics, setHaptics] = useAtom(hapticsAtom);
  const [showPinButtons, setShowPinButtons] = useAtom(showPinButtonsAtom);
  const [showCopyButtons, setShowCopyButtons] = useAtom(showCopyButtonsAtom);
  const [, setLicenseKey] = useAtom(licenseKeyAtom);
  const [, setPro] = useAtom(proAtom);
  const t = useTranslation();

  const sortOptions: { value: SortMode; label: string }[] = [
    { value: 'custom', label: 'Custom (drag order)' },
    { value: 'name', label: 'Name (A–Z)' },
    { value: 'value', label: 'Value (high → low)' },
    { value: 'change', label: '24h change (high → low)' },
  ];

  const themeOptions: { value: ThemeMode; label: string }[] = [
    { value: 'dark', label: t.settings.themeDark },
    { value: 'light', label: t.settings.themeLight },
    { value: 'system', label: t.settings.themeSystem },
  ];

  const copyFormatOptions: { value: CopyFormat; label: string }[] = [
    { value: 'full', label: t.settings.copyFormatFull },
    { value: 'value', label: t.settings.copyFormatValue },
  ];

  return (
    <div>
      <div className="form-control">
        <label className="label cursor-pointer">
          <input type="checkbox" checked={isEditing} onChange={() => {
            setIsEditing(!isEditing);
          }} className="checkbox" />
          <span className="label-text px-2">
            {t.settings.enableDeleteDragAndDrop}
          </span>
        </label>

        <div className="divider m-0" />

        <label className="label cursor-pointer">
          <input type="checkbox" checked={isDefaultCurrencyValue} onChange={() => {
            setIsDefaultCurrencyValue(!isDefaultCurrencyValue);
          }} className="checkbox" />
          <span className="label-text pl-2 justify-between items-center flex gap-2">
            {t.settings.resetValue}
            {/* No aria-label here: the wrapping <label> already names this
                input; a duplicate label made two controls share one name. */}
            <input type="number" className="w-[50%] bg-base-200" placeholder={defaultCurrencyValue.toString()} disabled={!isDefaultCurrencyValue}
              onChange={(d) => {
                const v = parseInt(d.target.value);
                setDefaultCurrencyValue(isNaN(v) ? 0 : v);
              }}
            />
          </span>
        </label>

        <div className="divider m-0" />

        <label className="label cursor-pointer">

          <span className="label-text pl-2 justify-between items-center flex gap-2">
            {t.settings.setDp}
            <input type="number" className="w-[50%] bg-base-200" placeholder={defaultCurrencyValueDp?.toString() ?? 0}
              aria-label={t.settings.setDp}
              onChange={(d) => {
                setDefaultCurrencyValueDp(isNaN(parseInt(d.target.value)) ? 0 : parseInt(d.target.value ?? 0));
              }}
            />
          </span>
        </label>

        <div className="divider m-0" />

        <label className="label" htmlFor="settings-language">
          <span className="label-text">{t.settings.changeLanguage}</span>
        </label>
        <select
          id="settings-language"
          className="select select-bordered w-full mt-2"
          value={language}
          onChange={(e) => {
            const newLang = languageOptions.find(opt => opt.value === e.target.value)?.value as LanguageCode;
            if (newLang) {
              setLanguage(newLang as Language);
            }
          }}
        >
          {languageOptions.map(({ value, label }) => (
            <option value={value} key={value}>{label}</option>
          ))}
        </select>

        <div className="divider m-0" />

        <label className="label" htmlFor="settings-sort">
          <span className="label-text">Sort by</span>
        </label>
        <select
          id="settings-sort"
          className="select select-bordered w-full mt-2"
          value={sortMode}
          onChange={(e) => setSortMode(e.target.value as SortMode)}
        >
          {sortOptions.map(({ value, label }) => (
            <option value={value} key={value}>{label}</option>
          ))}
        </select>

        <div className="divider m-0" />

        <label className="label" htmlFor="settings-theme">
          <span className="label-text">{t.settings.themeMode}</span>
        </label>
        <select
          id="settings-theme"
          className="select select-bordered w-full mt-2"
          value={themeMode}
          onChange={(e) => { vibrate(haptics); setThemeMode(e.target.value as ThemeMode); }}
        >
          {themeOptions.map(({ value, label }) => (
            <option value={value} key={value}>{label}</option>
          ))}
        </select>

        <div className="divider m-0" />

        <label className="label cursor-pointer">
          <input type="checkbox" checked={showChangePct} onChange={() => { vibrate(haptics); setShowChangePct(!showChangePct); }} className="checkbox" />
          <span className="label-text px-2">
            {t.settings.showChangePct}
          </span>
        </label>

        <div className="divider m-0" />

        <label className="label cursor-pointer">
          <input type="checkbox" checked={compactRows} onChange={() => { vibrate(haptics); setCompactRows(!compactRows); }} className="checkbox" />
          <span className="label-text px-2">
            {t.settings.compactRows}
          </span>
        </label>

        <div className="divider m-0" />

        <label className="label" htmlFor="settings-copy-format">
          <span className="label-text">{t.settings.copyFormat}</span>
        </label>
        <select
          id="settings-copy-format"
          className="select select-bordered w-full mt-2"
          value={copyFormat}
          onChange={(e) => { vibrate(haptics); setCopyFormat(e.target.value as CopyFormat); }}
        >
          {copyFormatOptions.map(({ value, label }) => (
            <option value={value} key={value}>{label}</option>
          ))}
        </select>

        <div className="divider m-0" />

        <label className="label cursor-pointer">
          <input type="checkbox" checked={showPinButtons} onChange={() => { vibrate(haptics); setShowPinButtons(!showPinButtons); }} className="checkbox" />
          <span className="label-text px-2">
            {t.settings.showPinButtons}
          </span>
        </label>

        <div className="divider m-0" />

        <label className="label cursor-pointer">
          <input type="checkbox" checked={showCopyButtons} onChange={() => { vibrate(haptics); setShowCopyButtons(!showCopyButtons); }} className="checkbox" />
          <span className="label-text px-2">
            {t.settings.showCopyButtons}
          </span>
        </label>

        <div className="divider m-0" />

        <label className="label cursor-pointer">
          <input type="checkbox" checked={haptics} onChange={() => { setHaptics(!haptics); vibrate(!haptics); }} className="checkbox" />
          <span className="label-text px-2">
            {t.settings.haptics}
          </span>
        </label>

        <div className="divider m-0" />

        <AlertsSection currencies={currency2Display} baseCur={baseCur} />

        <div className="divider m-0" />

        <ProSettings />

        <div className="divider m-0" />

        <SponsoredStripSettings />

        <div className="divider m-0" />

        <label className="label">
          <span className="label-text">{t.settings.currenciesToDisplay}</span>
        </label>
        <input type="text" className="input input-bordered rounded-none w-full mt-2" placeholder={t.settings.currenciesToDisplaySeparatedByComma}
          value={currency2Display.filter(Boolean).join(',')}
          onChange={(d) => {
            setCurrency2Display(d.target.value.split(',').map(c => c.trim()).filter(Boolean));
          }} />

        <button className="btn btn-primary w-full mt-2" onClick={() => {
          // Remove only this app's persisted keys instead of nuking all same-origin localStorage.
          PERSISTED_ATOM_KEYS.forEach((key) => localStorage.removeItem(key));
          setCurrency2Display(DefaultCurrency2Display);
          setLanguage('en');
          setSortMode('custom');
          setThemeMode('system');
          setShowChangePct(true);
          setCompactRows(false);
          setCopyFormat('full');
          setShowCopyButtons(true);
          setHaptics(true);
          setLicenseKey('');
          setPro(false);
          window.location.reload();
        }}>
          {t.settings.reset}
        </button>

      </div>
    </div>
  );
};


const CurrencyListTable: React.FC<CurrencyListTableProps> = ({ data }) => {
  const [currency2Display, setCurrency2Display] = useAtom(currency2DisplayAtom);
  const [filter, setFilter] = useState('');
  const t = useTranslation();

  const addCurrency2Display = (name: string) => {
    setCurrency2Display(prev => [...prev, name]);
  };

  const removeCurrency2Display = (name: string) => {
    setCurrency2Display(prev => prev.filter(c => c !== name));
  };

  const filteredEntries = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const entries = Object.entries(data ?? {});
    if (!q) return entries;
    return entries.filter(
      ([code, name]) => code.toLowerCase().includes(q) || name.toLowerCase().includes(q)
    );
  }, [data, filter]);

  return <div className="overflow-x-auto">
    {/* NOTE (v1): English-only placeholder; the site's 30 locales fall back to it. */}
    <input
      type="text"
      value={filter}
      onChange={(e) => setFilter(e.target.value)}
      placeholder="Filter currencies…"
      aria-label="Filter currencies"
      className="input input-bordered input-sm w-full mb-2"
    />
    <table className="table">
      <thead>
        <tr>
          <td></td>
          <td></td>
          <th>{t.settings.code}</th>
          <th>{t.settings.name}</th>
        </tr>
      </thead>
      <tbody>
        {filteredEntries.map(([code, name]) => {
          const listed = currency2Display.includes(code);
          return <tr className="hover" key={code}>
            <td className='py-0 pl-0'>
              {/* Real <button>s (not bare SVGs): keyboard-focusable, named for
                  screen readers, and a 44px touch target. */}
              <button
                type="button"
                onClick={() => listed ? removeCurrency2Display(code) : addCurrency2Display(code)}
                aria-label={listed ? `Remove ${code.toUpperCase()} from list` : `Add ${code.toUpperCase()} to list`}
                aria-pressed={listed}
                className="flex items-center justify-center p-2 -m-1 cursor-pointer"
              >
                {listed
                  ? <CrossSvg className={'size-6'} />
                  : <AddSvg className={'size-6'} />}
              </button>
            </td>
            <td className='p-0'><CountryImg code={code} /></td>
            <td className='px-0 text-center'>{code}</td>
            <td className='px-0 truncate' title={name}>{name}</td>
          </tr>
        })}
      </tbody>
    </table>
  </div>
};

const CurrencyListModal: React.FC<CurrencyListModalProps> = ({ data, baseCur }) => {
  // Default to the currency list tab (1): the toolbar icon is a list icon,
  // so users expect the list — not Settings — on open.
  const [activeTab, setActiveTab] = useState(1);

  const openModal = () => {
    const modal = document.getElementById('currency_list_modal') as HTMLDialogElement;
    modal?.showModal();
  };

  const closeModal = () => {
    const modal = document.getElementById('currency_list_modal') as HTMLDialogElement;
    modal?.close();
  };

  return (
    <div className='h-[44px] w-[44px] flex items-center justify-center'>
      <button type="button" onClick={openModal} aria-label="Open currency list and settings" data-tour="tour-list-settings">
        <ListSvg />
      </button>

      <dialog id="currency_list_modal" className="modal"  >

        <div className="modal-box max-w-[460px] p-2" >

          <div role="tablist" className="tabs tabs-bordered mb-2">
            <button type="button" role="tab" aria-label="Currency list" aria-selected={activeTab === 1} className={`tab ${activeTab === 1 ? 'tab-active' : ''}`} onClick={() => setActiveTab(1)}>
              <TableSvg />
            </button>
            <button type="button" role="tab" aria-label="Settings" aria-selected={activeTab === 2} className={`tab ${activeTab === 2 ? 'tab-active' : ''}`} onClick={() => setActiveTab(2)}>
              <SettingSvg />
            </button>
            <button type="button" role="tab" aria-label="Close" className={`tab`} onClick={closeModal}>
              <XSvg />
            </button>
          </div>

          {/* Tab content rendering */}
          {activeTab === 1 && <div>
            <CurrencyListTable data={data} />
          </div>}
          {activeTab === 2 && <div>
            <CurrencySetting baseCur={baseCur} />
          </div>}
          {/* {activeTab === 3 && <div>Content for Tab 3</div>} */}

        </div>

        <form method="dialog" className="modal-backdrop">
          <button onClick={closeModal}>close</button>
        </form>
      </dialog>
    </div>
  );
}

export default CurrencyListModal;
