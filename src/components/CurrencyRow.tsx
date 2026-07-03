import CountryImg from '@/components/CountryImg';
import DragHandle from '@/components/DragHandle';
import { getResponsiveCryptoDp } from '@/lib/fns';
import { CrossSvg, EmptySvg } from '@/lib/svgs';
import { CSSProperties, memo, useState } from 'react';

export interface CurrencyRowProps {
  cur: string;
  val: number;
  currencyValue: number;
  baseCur: string;
  isEditing: boolean;
  windowWidth: number;
  defaultCurrencyValueDp: number;
  name?: string;
  changePct?: number;
  showDivider: boolean;
  style?: CSSProperties;
  onDragStart: (cur: string) => void;
  onSelectBase: (cur: string) => void;
  onRemove: (cur: string) => void;
  onValueChange: (value: number) => void;
}

const CurrencyRow = ({
  cur,
  val,
  currencyValue,
  baseCur,
  isEditing,
  windowWidth,
  defaultCurrencyValueDp,
  name,
  changePct,
  showDivider,
  style,
  onDragStart,
  onSelectBase,
  onRemove,
  onValueChange,
}: CurrencyRowProps) => {
  const isBase = cur === baseCur;
  const valMultiplied = val * currencyValue;
  const cryptoDp = getResponsiveCryptoDp(windowWidth, isEditing);

  const dp2Show = ((currencyValue === 0) || (valMultiplied > 1))
    ? defaultCurrencyValueDp
    : defaultCurrencyValueDp > cryptoDp ? defaultCurrencyValueDp : cryptoDp;

  const val2Show = (valMultiplied).toLocaleString(undefined, { minimumFractionDigits: dp2Show, maximumFractionDigits: dp2Show }) ?? 0;

  // Local edit state so a non-base row can be typed into (two-way conversion) while keeping the
  // formatted display when not being edited.
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  // Typing a value into row `cur` back-solves the base amount so every row updates live.
  const onDraftChange = (raw: string) => {
    setDraft(raw);
    const n = parseFloat(raw);
    if (!isNaN(n) && val) onValueChange(n / val);
  };

  const inputClass = 'bg-black h-[2em] w-[inherit] max-w-[240px] text-end';

  return (
    <div id='currencyItem' style={style}>
      <div className='flex gap-2 h-42 items-center'>
        <div className='flex w-full justify-between items-center gap-2'>
          {isEditing && <DragHandle onDragStart={() => onDragStart(cur)} />}

          <div className="flex items-center gap-2 h-[42px] w-[300px]">
            <button
              type="button"
              onClick={() => onSelectBase(cur)}
              title="Set as base currency"
              aria-label={`Set ${cur.toUpperCase()} as base currency`}
              className="shrink-0"
            >
              <CountryImg code={cur} />
            </button>
            <a
              href={isBase ? undefined : `/chart?q=${(baseCur + '-' + cur).toUpperCase()}`}
              className="text-start tooltip"
              data-tip={name ?? ''}
            >
              {cur.toUpperCase()}
            </a>
          </div>

          {isBase ? (
            <input
              min={0}
              step="any"
              onChange={(e) => onValueChange(parseFloat(e.target.value))}
              value={currencyValue === 0 ? '' : currencyValue.toString()}
              type="number"
              placeholder="100"
              className={inputClass}
            />
          ) : editing ? (
            <input
              autoFocus
              min={0}
              step="any"
              type="number"
              value={draft}
              onChange={(e) => onDraftChange(e.target.value)}
              onBlur={() => setEditing(false)}
              onKeyDown={(e) => { if (e.key === 'Enter') setEditing(false); }}
              className={inputClass}
            />
          ) : (
            <div
              className='w-[240px] text-end cursor-text'
              onClick={() => { setDraft(String(valMultiplied)); setEditing(true); }}
              title="Tap to edit"
            >
              <div>{val2Show}</div>
              {!isEditing && typeof changePct === 'number' && isFinite(changePct) && (
                <div className={`text-[10px] leading-none ${changePct >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {changePct >= 0 ? '▲' : '▼'} {Math.abs(changePct).toFixed(2)}%
                </div>
              )}
            </div>
          )}

          {isBase
            ? (isEditing ? <EmptySvg /> : null)
            : (isEditing
              ? <CrossSvg className={'cursor-pointer size-6 shrink-0'} onClick={() => onRemove(cur)} />
              : null)}
        </div>
      </div>
      {showDivider ? <div className="divider my-2" /> : <br />}
    </div>
  );
};

export default memo(CurrencyRow);
