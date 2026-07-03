// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import InstallButton from './InstallButton';

afterEach(() => cleanup());

const fireBeforeInstall = () => {
  const evt = new Event('beforeinstallprompt') as Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: string }>;
  };
  evt.prompt = vi.fn().mockResolvedValue(undefined);
  evt.userChoice = Promise.resolve({ outcome: 'accepted' });
  fireEvent(window, evt);
  return evt;
};

describe('InstallButton', () => {
  it('renders nothing until the browser offers an install prompt', () => {
    render(<InstallButton />);
    expect(screen.queryByText(/install app/i)).toBeNull();
  });

  it('shows the button after beforeinstallprompt and triggers the prompt on click', async () => {
    render(<InstallButton />);
    const evt = fireBeforeInstall();

    const btn = await screen.findByText(/install app/i);
    fireEvent.click(btn);
    expect(evt.prompt).toHaveBeenCalled();
  });
});
