import type { Language } from './types';

// Debounce function (example)
export const debounce = (func: (...args: any[]) => void, delay: number) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: any[]) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
};

export const showASCIIArt = () => {
  // https://patorjk.com/software/taag/#p=display&h=1&f=Delta%20Corps%20Priest%201&t=Money%20%0ARate%0Alol
  const art = `
   ▄▄▄▄███▄▄▄▄    ▄██████▄  ███▄▄▄▄      ▄████████ ▄██   ▄        
 ▄██▀▀▀███▀▀▀██▄ ███    ███ ███▀▀▀██▄   ███    ███ ███   ██▄      
 ███   ███   ███ ███    ███ ███   ███   ███    █▀  ███▄▄▄███      
 ███   ███   ███ ███    ███ ███   ███  ▄███▄▄▄     ▀▀▀▀▀▀███      
 ███   ███   ███ ███    ███ ███   ███ ▀▀███▀▀▀     ▄██   ███      
 ███   ███   ███ ███    ███ ███   ███   ███    █▄  ███   ███      
 ███   ███   ███ ███    ███ ███   ███   ███    ███ ███   ███      
  ▀█   ███   █▀   ▀██████▀   ▀█   █▀    ██████████  ▀█████▀       
                                                                      
       ▄████████    ▄████████     ███        ▄████████                
      ███    ███   ███    ███ ▀█████████▄   ███    ███                
      ███    ███   ███    ███    ▀███▀▀██   ███    █▀                 
     ▄███▄▄▄▄██▀   ███    ███     ███   ▀  ▄███▄▄▄                    
    ▀▀███▀▀▀▀▀   ▀███████████     ███     ▀▀███▀▀▀                    
    ▀███████████   ███    ███     ███       ███    █▄                 
      ███    ███   ███    ███     ███       ███    ███                
      ███    ███   ███    █▀     ▄████▀     ██████████                
      ███    ███                                                      
              ▄█        ▄██████▄   ▄█                                          
             ███       ███    ███ ███                                          
             ███       ███    ███ ███                                          
             ███       ███    ███ ███                                          
             ███       ███    ███ ███                                          
             ███       ███    ███ ███                                          
      ███    ███▌    ▄ ███    ███ ███▌    ▄                                    
      ███    █████▄▄██  ▀██████▀  █████▄▄██                                    
             ▀                    ▀                                            
https://github.com/hectorchanht/moneyrate`;
  console.log(art);
};

// Decimal places for a currency row given viewport width and edit mode.
// Extracted from the render loop so it can be unit-tested in isolation.
export const getResponsiveCryptoDp = (windowWidth: number, isEditing: boolean): number => {
  let cryptoDp = 6;
  if (isEditing) {
    if (windowWidth < 410) cryptoDp = 4;
    if (windowWidth < 370) cryptoDp = 3;
  }
  if (windowWidth < 300) cryptoDp = 2;
  return cryptoDp;
};

// Clamp a drag-drop Y offset to a valid splice index so dropping above/below
// the list can't produce a negative or out-of-range insertion point.
export const getDropIndex = (dropY: number, itemHeight: number, length: number): number => {
  const rawIndex = Math.floor(dropY / itemHeight);
  return Math.max(0, Math.min(rawIndex, length - 1));
};

// Safely evaluate a basic arithmetic expression (+ - * / parentheses, decimals,
// unary minus). No eval()/Function() — those are blocked by the production CSP —
// so this uses a shunting-yard parser. Returns null for empty/invalid input.
export const evalMathExpression = (input: string): number | null => {
  if (input == null) return null;
  const s = String(input).replace(/,/g, '').trim();
  if (s === '') return null;
  if (!/^[0-9+\-*/(). ]+$/.test(s)) return null;

  // Tokenize into numbers and single-char operators/parens.
  const tokens: Array<number | string> = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === ' ') { i++; continue; }
    if (/[0-9.]/.test(c)) {
      let num = '';
      while (i < s.length && /[0-9.]/.test(s[i])) num += s[i++];
      const n = parseFloat(num);
      if (!Number.isFinite(n)) return null;
      tokens.push(n);
    } else {
      tokens.push(c);
      i++;
    }
  }

  // Shunting-yard -> RPN. 'u-' is unary minus.
  const prec: Record<string, number> = { 'u-': 4, '*': 3, '/': 3, '+': 2, '-': 2 };
  const out: Array<number | string> = [];
  const ops: string[] = [];
  let prev: number | string | null = null;
  for (const tk of tokens) {
    if (typeof tk === 'number') {
      out.push(tk);
    } else if (tk === '(') {
      ops.push(tk);
    } else if (tk === ')') {
      while (ops.length && ops[ops.length - 1] !== '(') out.push(ops.pop() as string);
      if (!ops.length) return null;
      ops.pop();
    } else {
      let op = tk;
      const unary = op === '-' && (prev === null || prev === '(' || (typeof prev === 'string' && prev !== ')'));
      if (unary) op = 'u-';
      while (ops.length) {
        const top = ops[ops.length - 1];
        if (top === '(') break;
        if (prec[top] > prec[op] || (prec[top] === prec[op] && op !== 'u-')) out.push(ops.pop() as string);
        else break;
      }
      ops.push(op);
    }
    prev = tk;
  }
  while (ops.length) {
    const op = ops.pop() as string;
    if (op === '(') return null;
    out.push(op);
  }

  const st: number[] = [];
  for (const tk of out) {
    if (typeof tk === 'number') {
      st.push(tk);
    } else if (tk === 'u-') {
      if (!st.length) return null;
      st.push(-(st.pop() as number));
    } else {
      if (st.length < 2) return null;
      const b = st.pop() as number;
      const a = st.pop() as number;
      st.push(tk === '+' ? a + b : tk === '-' ? a - b : tk === '*' ? a * b : a / b);
    }
  }
  if (st.length !== 1) return null;
  return Number.isFinite(st[0]) ? st[0] : null;
};

// Sort [code, rate] pairs for display. 'custom' preserves the user's order;
// others return a new array so the stored order is untouched.
export const sortCurrencyPairs = (
  pairs: [string, number][],
  mode: 'custom' | 'name' | 'value' | 'change',
  changeOf?: (cur: string) => number | undefined,
): [string, number][] => {
  if (mode === 'custom') return pairs;
  const copy = [...pairs];
  if (mode === 'name') {
    copy.sort((a, b) => a[0].localeCompare(b[0]));
  } else if (mode === 'value') {
    copy.sort((a, b) => b[1] - a[1]);
  } else if (mode === 'change') {
    copy.sort((a, b) => (changeOf?.(b[0]) ?? -Infinity) - (changeOf?.(a[0]) ?? -Infinity));
  }
  return copy;
};

export const getDataFromLocalStorage = (name: string, defaultValue: any) => {
  if (typeof window === "undefined" || !window || !window.localStorage) return defaultValue
  const lsData = localStorage.getItem(name);
  if (lsData === null) return defaultValue;

  try {
    const lsDataParsed = JSON.parse(lsData);
    return lsDataParsed;
  } catch {
    return lsData
  }
};

export const setDataToLocalStorage = (name: string, value: unknown) => {
  if (typeof window === "undefined" || !window || !window.localStorage) return;
  try {
    localStorage.setItem(name, JSON.stringify(value));
  } catch {
    // Ignore quota / serialization errors — caching is best-effort.
  }
};

// Resolve the best supported tour locale from a list of device language
// preferences (e.g. navigator.languages). Pure and unit-testable — does not
// read `navigator` itself; the client-only read happens at the call site.
// Exact match wins first; otherwise falls back to the first supported tag
// sharing the same base language (via Intl.Locale); otherwise `fallback`.
export const resolveTourLocale = (
  navLangs: readonly string[],
  supported: readonly Language[],
  fallback: Language = 'en'
): Language => {
  const supportedSet = new Set<string>(supported);
  const baseMap = new Map<string, Language>(); // base language subtag -> first matching supported tag
  for (const tag of supported) {
    try {
      const base = new Intl.Locale(tag).language;
      if (!baseMap.has(base)) baseMap.set(base, tag);
    } catch {
      // malformed tag in the supported list itself — skip defensively
    }
  }
  for (const raw of navLangs) {
    if (supportedSet.has(raw)) return raw as Language; // exact match, e.g. 'zh-TW'
    try {
      const base = new Intl.Locale(raw).language;
      const match = baseMap.get(base);
      if (match) return match;
    } catch {
      // malformed navigator.languages entry — skip and try the next candidate
    }
  }
  return fallback;
};