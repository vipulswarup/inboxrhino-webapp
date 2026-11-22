// @vitest-environment node
import { expect, it } from 'vitest';
import { app } from './index';

it('redirects API requests to HTTPS while preserving the method and URL', async () => {
  const response = await app.request('http://api.inboxrhino.in/v1/inboxes?limit=1', { method: 'POST' });
  expect(response.status).toBe(308);
  expect(response.headers.get('location')).toBe('https://api.inboxrhino.in/v1/inboxes?limit=1');
});
it('keeps HTTP available for local development', async () => {
  const response = await app.request('http://localhost:8787/health');
  expect(response.status).toBe(200);
});
