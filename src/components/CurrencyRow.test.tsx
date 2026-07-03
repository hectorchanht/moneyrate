// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
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
  onDragStart: vi.fn(),
  onSelectBase: vi.fn(),
  onRemove: vi.fn(),
  onValueChange: vi.fn(),
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

  it('renders an editable input for the base currency', () => {
    render(<CurrencyRow {...baseProps} cur="USD" val={1} name="US Dollar" />);
    const input = screen.getByRole('spinbutton') as HTMLInputElement;
    expect(input.value).toBe('100');
  });

  it('shows a 24h change badge with direction', () => {
    const { rerender } = render(<CurrencyRow {...baseProps} cur="EUR" val={0.9} name="Euro" changePct={1.5} />);
    expect(screen.getByText(/▲ 1\.50%/)).toBeTruthy();

    rerender(<CurrencyRow {...baseProps} cur="EUR" val={0.9} name="Euro" changePct={-2.25} />);
    expect(screen.getByText(/▼ 2\.25%/)).toBeTruthy();
  });
});
