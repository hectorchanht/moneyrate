import CountryImg from '@/components/CountryImg';
import DragHandle from '@/components/DragHandle';
import { evalMathExpression, getResponsiveCryptoDp } from '@/lib/fns';
import { CheckSvg, CopySvg, CrossSvg, EmptySvg } from '@/lib/svgs';
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

  // Base-amount field supports math expressions (e.g. "5+3*2"); null = not editing.
  const [expr, setExpr] = useState<string | null>(null);
  const onBaseChange = (raw: string) => {
    setExpr(raw);
    const result = evalMathExpression(raw);
    if (result !== null) onValueChange(result); // apply live whenever the expression is valid
  };

  const [copied, setCopied] = useState(false);
  const onCopy = async (e: React.MouseEvent) => {
    e.stopPropagation(); // don't also trigger the row's set-as-base click
    try {
      await navigator.clipboard.writeText(`${val2Show} ${cur.toUpperCase()}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // clipboard unavailable (insecure context / denied)
    }
  };

  return (
    // The highlight box wraps ONLY the row content — the divider renders
    // after it (outside), so the box never swallows the divider line or
    // leaves dead space inside it (seen live 2026-10-08).
    <div
      id='currencyItem'
      data-tour={isBase ? 'tour-base-row' : undefined}
      style={style}
    >
      <div
        // The base row (the amount you're converting FROM) gets a soft highlight
        // so it stands out from the converted rows.
        className={isBase ? 'rounded-xl bg-primary/10 px-3 -mx-3 ring-1 ring-inset ring-primary/25' : undefined}
      >
      <div className='flex gap-2 items-center'>
        <div className='flex w-full justify-between items-center gap-2'>
          {isEditing && <DragHandle onDragStart={() => onDragStart(cur)} />}
          <a
            href={isBase ? undefined : `/chart?q=${(baseCur + '-' + cur).toUpperCase()}`}
            className="text-start tooltip flex items-center gap-2 h-[42px] w-[300px]"
            data-tip={name ?? ''}
            // The flag/link is display-only: never start a native drag (the
            // <img> inside is already draggable={false}; links drag by default too).
            draggable={false}
          >
            <CountryImg code={cur} />
            {cur.toUpperCase()}
          </a>

          {isBase ? (
            <input
              type="text"
              // Numeric keypad on mobile; desktop keyboards still get the full
              // math-expression support (e.g. "5+3*2") via the text type.
              inputMode="decimal"
              value={expr !== null ? expr : (currencyValue === 0 ? '' : currencyValue.toString())}
              onFocus={() => setExpr(currencyValue === 0 ? '' : currencyValue.toString())}
              onChange={(e) => onBaseChange(e.target.value)}
              onBlur={() => setExpr(null)}
              onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
              placeholder="100"
              aria-label={`${cur.toUpperCase()} amount (supports math, e.g. 5+3)`}
              data-tour="tour-amount-input"
              className={`bg-base-200 h-[2em] w-[inherit] max-w-[240px] text-end tabular-nums`}
            />
          ) : (
            // Click a currency to make it the active (editable) one — the input moves to this row.
            <div
              role="button"
              tabIndex={0}
              onClick={() => onSelectBase(cur)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectBase(cur); } }}
              className='w-[240px] text-end tabular-nums cursor-pointer focus:outline focus:outline-1 focus:outline-base-content/40'
              aria-label={`Set ${cur.toUpperCase()} as base currency`}
              title="Tap to edit this currency"
            >
              <div>{val2Show}</div>
              {/* Line space is reserved while yesterday's rates load, so their arrival doesn't shift the row (CLS). */}
              {!isEditing && (typeof changePct === 'number' && isFinite(changePct) ? (
                <div className={`text-[10px] leading-none tabular-nums ${changePct >= 0 ? 'text-green-700 [[data-theme=dark]_&]:text-green-500' : 'text-red-600 [[data-theme=dark]_&]:text-red-400'}`}>
                  {changePct >= 0 ? '▲' : '▼'} {Math.abs(changePct).toFixed(2)}%
                </div>
              ) : <div className="h-[10px]" aria-hidden="true" />)}
            </div>
          )}

          {isBase
            ? (isEditing ? <EmptySvg /> : null)
            : (isEditing
              ? <button type="button" onClick={() => onRemove(cur)} aria-label={`Remove ${cur.toUpperCase()}`} className="shrink-0">
                  <CrossSvg className={'cursor-pointer size-6'} />
                </button>
              : (
                <button
                  type="button"
                  onClick={onCopy}
                  title="Copy value"
                  aria-label={`Copy ${cur.toUpperCase()} value`}
                  className="shrink-0 opacity-40 hover:opacity-100"
                >
                  {copied ? <CheckSvg className="size-5" /> : <CopySvg className="size-5" />}
                </button>
              ))}
        </div>
      </div>
      </div>
      {showDivider ? <div className="divider my-2" aria-hidden="true" /> : null}
    </div>
  );
};

export default memo(CurrencyRow);
