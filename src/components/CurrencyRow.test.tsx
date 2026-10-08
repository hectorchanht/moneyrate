// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import CurrencyRow from './CurrencyRow';

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: unknown; alt?: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={typeof src === 'string' ? src : ''} alt={alt ?? ''} />
  ),
}));

const baseProps = {
  currencyValue: 100,
  baseCur: 'USD',
  isEditing: false,
  windowWidth: 888,
  defaultCurrencyValueDp: 2,
  showDivider: true,
  showChangePct: true,
  compact: false,
  copyFormat: 'value' as const,
  haptics: false,
  isPinned: false,
  onDragStart: vi.fn(),
  onSelectBase: vi.fn(),
  onRemove: vi.fn(),
  onValueChange: vi.fn(),
  onTogglePin: vi.fn(),
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('CurrencyRow', () => {
  it('renders the converted value for a non-base currency', () => {
    render(<CurrencyRow {...baseProps} cur="EUR" val={0.9} name="Euro" />);
    expect(screen.getByText('90.00')).toBeTruthy();
  });

  it('makes the clicked currency the active (base) input', async () => {
    const user = userEvent.setup();
    const onSelectBase = vi.fn();
    render(<CurrencyRow {...baseProps} cur="EUR" val={0.9} name="Euro" onSelectBase={onSelectBase} />);

    await user.click(screen.getByText('90.00'));
    expect(onSelectBase).toHaveBeenCalledWith('EUR');
  });

  it('renders an editable amount input for the base currency', () => {
    render(<CurrencyRow {...baseProps} cur="USD" val={1} name="US Dollar" />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('100');
  });

  it('evaluates a math expression typed into the base amount', () => {
    const onValueChange = vi.fn();
    render(<CurrencyRow {...baseProps} cur="USD" val={1} name="US Dollar" onValueChange={onValueChange} />);

    fireEvent.change(screen.getByRole('textbox'), { target: { value: '5+3' } });
    expect(onValueChange).toHaveBeenLastCalledWith(8);
  });

  it('shows a 24h change badge with direction', () => {
    const { rerender } = render(<CurrencyRow {...baseProps} cur="EUR" val={0.9} name="Euro" changePct={1.5} />);
    expect(screen.getByText(/▲ 1\.50%/)).toBeTruthy();

    rerender(<CurrencyRow {...baseProps} cur="EUR" val={0.9} name="Euro" changePct={-2.25} />);
    expect(screen.getByText(/▼ 2\.25%/)).toBeTruthy();
  });

  it('copies the "value CODE" text to the clipboard', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });

    render(<CurrencyRow {...baseProps} cur="EUR" val={0.9} name="Euro" />);
    await user.click(screen.getByRole('button', { name: /copy eur value/i }));

    expect(writeText).toHaveBeenCalledWith('90.00 EUR');
  });

  it('copies the full "amount BASE = value CODE" text when copyFormat is full', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });

    render(<CurrencyRow {...baseProps} cur="EUR" val={0.9} name="Euro" copyFormat="full" />);
    await user.click(screen.getByRole('button', { name: /copy eur value/i }));

    expect(writeText).toHaveBeenCalledWith('100 USD = 90.00 EUR');
  });

  it('hides the 24h change badge when showChangePct is false', () => {
    render(<CurrencyRow {...baseProps} cur="EUR" val={0.9} name="Euro" changePct={1.5} showChangePct={false} />);
    expect(screen.queryByText(/1\.50%/)).toBeNull();
  });

  it('toggles pin on pin-button click', async () => {
    const user = userEvent.setup();
    const onTogglePin = vi.fn();
    render(<CurrencyRow {...baseProps} cur="EUR" val={0.9} name="Euro" onTogglePin={onTogglePin} />);
    await user.click(screen.getByRole('button', { name: /pin eur to top/i }));
    expect(onTogglePin).toHaveBeenCalledWith('EUR');
  });

  it('shows the filled pin state when pinned', () => {
    render(<CurrencyRow {...baseProps} cur="EUR" val={0.9} name="Euro" isPinned />);
    expect(screen.getByRole('button', { name: /unpin eur/i })).toBeTruthy();
  });

  it('compacts huge converted values so they never overlap the code', () => {
    // 500 BTC → ~41M USD: compact display, full precision kept for copy.
    render(<CurrencyRow {...baseProps} cur="USD" val={82869.75} name="US Dollar" baseCur="BTC" currencyValue={500} />);
    expect(screen.getByText('41.43M')).toBeTruthy();
  });

  it('copies full precision even when the display is compacted', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });

    render(<CurrencyRow {...baseProps} cur="USD" val={82869.75} name="US Dollar" baseCur="BTC" currencyValue={500} copyFormat="value" />);
    await user.click(screen.getByRole('button', { name: /copy usd value/i }));

    expect(writeText).toHaveBeenCalledWith('41,434,875.00 USD');
  });
});
