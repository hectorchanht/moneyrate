// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider, createStore } from 'jotai';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { currency2DisplayAtom } from '@/lib/atoms';
import SearchBar from './SearchBar';

// next/image needs the Next runtime; render a plain <img> in tests.
vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: unknown; alt?: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={typeof src === 'string' ? src : ''} alt={alt ?? ''} />
  ),
}));

const renderSearchBar = (data: Record<string, string>, displayed: string[] = []) => {
  const store = createStore();
  store.set(currency2DisplayAtom, displayed);
  return render(
    <Provider store={store}>
      <LanguageProvider>
        <SearchBar data={data} />
      </LanguageProvider>
    </Provider>
  );
};

afterEach(() => cleanup());

describe('SearchBar', () => {
  it('renders no dropdown and no stray "0" when nothing matches', async () => {
    const user = userEvent.setup();
    const { container } = renderSearchBar({ USD: 'US Dollar', EUR: 'Euro' });

    await user.type(screen.getByRole('textbox'), 'zzzzz');

    expect(screen.queryByText('USD')).toBeNull();
    // Regression: the `matched.length && ...` guard used to render a literal "0".
    expect(container.textContent).not.toContain('0');
  });

  it('lists a matching currency', async () => {
    const user = userEvent.setup();
    renderSearchBar({ USD: 'US Dollar', EUR: 'Euro' });

    await user.type(screen.getByRole('textbox'), 'eur');

    expect(screen.getByText('EUR')).toBeTruthy();
  });

  it('dedupes a currency whose code and name both match', async () => {
    const user = userEvent.setup();
    renderSearchBar({ USD: 'USD Dollar', EUR: 'Euro' });

    await user.type(screen.getByRole('textbox'), 'usd');

    // Would be 2 rows without the Set-based dedupe.
    expect(screen.getAllByText('USD')).toHaveLength(1);
  });

  it('excludes currencies already being displayed', async () => {
    const user = userEvent.setup();
    renderSearchBar({ USD: 'US Dollar', EUR: 'Euro' }, ['USD']);

    await user.type(screen.getByRole('textbox'), 'us');

    expect(screen.queryByText('USD')).toBeNull();
  });
});
