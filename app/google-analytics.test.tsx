import { cleanup, render } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { GoogleAnalytics } from './google-analytics';

const state = vi.hoisted(() => ({ pathname: '/' }));
vi.mock('next/navigation', () => ({ usePathname: () => state.pathname }));
vi.mock('./lib/site', () => ({ GA_MEASUREMENT_ID: 'G-TEST', isPublicAnalyticsHost: () => true }));
vi.mock('next/script', () => ({ default: ({ src }: { src: string }) => <span data-testid="analytics-script" data-src={src} /> }));
afterEach(() => { cleanup(); delete window.gtag; delete window.dataLayer; state.pathname = '/'; });
it('sends no events before consent and sanitizes the page URL after opt-in', () => {
  window.history.replaceState({}, '', '/?token=private#secret');
  const { container, rerender } = render(<GoogleAnalytics consent={false} />);
  expect(container.querySelector('[data-testid="analytics-script"]')).toBeNull();
  expect(window.dataLayer).toBeUndefined();
  rerender(<GoogleAnalytics consent />);
  expect(container.querySelector('[data-testid="analytics-script"]')).not.toBeNull();
  expect(JSON.stringify(window.dataLayer)).not.toMatch(/private|secret|token=/);
  rerender(<GoogleAnalytics consent={false} />);
  expect(container.querySelector('[data-testid="analytics-script"]')).toBeNull();
  expect(Reflect.get(window, 'ga-disable-G-TEST')).toBe(true);
});
it('never instruments authenticated console routes', () => {
  state.pathname = '/console/inboxes';
  const { container } = render(<GoogleAnalytics consent />);
  expect(container.querySelector('[data-testid="analytics-script"]')).toBeNull();
  expect(window.dataLayer).toBeUndefined();
});
