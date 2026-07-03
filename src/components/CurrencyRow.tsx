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
    <div id='currencyItem' style={style}>
      <div className='flex gap-2 h-42 items-center'>
        <div className='flex w-full justify-between items-center gap-2'>
          {isEditing && <DragHandle onDragStart={() => onDragStart(cur)} />}
          <a
            href={isBase ? undefined : `/chart?q=${(baseCur + '-' + cur).toUpperCase()}`}
            className="text-start tooltip flex items-center gap-2 h-[42px] w-[300px]"
            data-tip={name ?? ''}
          >
            <CountryImg code={cur} />
            {cur.toUpperCase()}
          </a>

          {isBase ? (
            <input
              type="text"
              inputMode="text"
              value={expr !== null ? expr : (currencyValue === 0 ? '' : currencyValue.toString())}
              onFocus={() => setExpr(currencyValue === 0 ? '' : currencyValue.toString())}
              onChange={(e) => onBaseChange(e.target.value)}
              onBlur={() => setExpr(null)}
              onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
              placeholder="100"
              aria-label={`${cur.toUpperCase()} amount (supports math, e.g. 5+3)`}
              className={`bg-base-200 h-[2em] w-[inherit] max-w-[240px] text-end`}
            />
          ) : (
            // Click a currency to make it the active (editable) one — the input moves to this row.
            <div
              role="button"
              tabIndex={0}
              onClick={() => onSelectBase(cur)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectBase(cur); } }}
              className='w-[240px] text-end cursor-pointer focus:outline focus:outline-1 focus:outline-base-content/40'
              aria-label={`Set ${cur.toUpperCase()} as base currency`}
              title="Tap to edit this currency"
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
      {showDivider ? <div className="divider my-2" /> : <br />}
    </div>
  );
};

export default memo(CurrencyRow);
