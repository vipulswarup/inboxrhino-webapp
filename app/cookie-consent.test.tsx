import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { CONSENT_KEY, CookieConsent, readConsent } from './cookie-consent';

vi.mock('./google-analytics', () => ({ GoogleAnalytics: ({ consent }: { consent: boolean }) => <span data-testid="analytics">{String(consent)}</span> }));
vi.mock('next/link', () => ({ default: ({ children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => <a {...props}>{children}</a> }));
beforeEach(() => localStorage.clear());
afterEach(cleanup);
it('blocks analytics until an explicit opt-in and supports withdrawal', () => {
  render(<CookieConsent />);
  expect(screen.getByTestId('analytics')).toHaveTextContent('false');
  fireEvent.click(screen.getByRole('button', { name: 'Accept analytics' }));
  expect(screen.getByTestId('analytics')).toHaveTextContent('true');
  expect(readConsent()).toBe(true);
  document.cookie = '_ga=test; path=/';
  fireEvent.click(screen.getByRole('button', { name: 'Cookie settings' }));
  fireEvent.click(screen.getByRole('button', { name: 'Reject optional cookies' }));
  expect(screen.getByTestId('analytics')).toHaveTextContent('false');
  expect(readConsent()).toBe(false);
  expect(document.cookie).not.toContain('_ga=');
});
it('remembers rejection and rejects malformed or expired preferences', () => {
  localStorage.setItem(CONSENT_KEY, JSON.stringify({ accepted: false, time: Date.now() }));
  render(<CookieConsent />);
  expect(screen.queryByRole('region', { name: 'Cookie preferences' })).toBeNull();
  expect(screen.getByTestId('analytics')).toHaveTextContent('false');
  localStorage.setItem(CONSENT_KEY, JSON.stringify({ accepted: true, time: 0 }));
  expect(readConsent()).toBeNull();
  localStorage.setItem(CONSENT_KEY, 'invalid');
  expect(readConsent()).toBeNull();
});
