import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { createSafeEmailDocument, emailPreviewCsp, MessageViewer } from './message-viewer';

afterEach(cleanup);

describe('MessageViewer', () => {
  it('opens the newest message in a locked-down iframe', () => {
    render(<MessageViewer />);

    expect(screen.getByRole('heading', { name: 'Verify your email address' })).toBeInTheDocument();
    const frame = screen.getByTitle('Rendered email: Verify your email address');

    expect(frame).toHaveAttribute('sandbox', '');
    expect(frame).toHaveAttribute('referrerpolicy', 'no-referrer');
    expect(frame.getAttribute('srcdoc')).toContain(emailPreviewCsp);
  });

  it('switches between HTML, plain text, and complete headers', async () => {
    const user = userEvent.setup();
    render(<MessageViewer />);

    await user.click(screen.getByRole('tab', { name: /text/i }));
    expect(screen.getByRole('tabpanel', { name: 'Plain text content' })).toHaveTextContent(
      'https://acme.dev/verify/tk_demo_4fr8zk',
    );

    await user.click(screen.getByRole('tab', { name: /headers/i }));
    const headers = screen.getByRole('tabpanel', { name: 'Message headers' });
    expect(within(headers).getByText('Message-ID')).toBeInTheDocument();
    expect(within(headers).getByText('X-Mailer')).toBeInTheDocument();
  });

  it('loads a selected message and shows the attachment safety warning', async () => {
    const user = userEvent.setup();
    render(<MessageViewer />);

    const messageList = screen.getByRole('list');
    await user.click(within(messageList).getByRole('button', { name: /Your August invoice is ready/ }));

    expect(screen.getByRole('heading', { name: 'Your August invoice is ready' })).toBeInTheDocument();
    expect(screen.getByText('invoice-PT-2048.pdf')).toBeInTheDocument();
    expect(screen.getByText(/Files are not malware-scanned/)).toBeInTheDocument();
    expect(screen.getByTitle('Rendered email: Your August invoice is ready')).toBeInTheDocument();
  });

  it('reveals sender and recipient metadata on demand', async () => {
    const user = userEvent.setup();
    render(<MessageViewer />);

    await user.click(screen.getByRole('button', { name: /Acme.*hello@acme.dev/ }));

    const metadata = screen.getByText('From').closest('dl');
    expect(metadata).not.toBeNull();
    expect(within(metadata!).getByText('cheerful-panda-x7k2@test.inboxrhino.in')).toBeInTheDocument();
    expect(within(metadata!).getByText('hello@acme.dev')).toBeInTheDocument();
  });
});

describe('createSafeEmailDocument', () => {
  it('injects a restrictive CSP into documents with and without a head', () => {
    expect(createSafeEmailDocument('<html><head><title>Test</title></head><body /></html>')).toContain(
      `<head><meta http-equiv="Content-Security-Policy" content="${emailPreviewCsp}">`,
    );
    expect(createSafeEmailDocument('<html><body>Test</body></html>')).toContain(
      `<head><meta http-equiv="Content-Security-Policy" content="${emailPreviewCsp}">`,
    );
  });
});
