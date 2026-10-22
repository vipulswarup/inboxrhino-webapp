import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MessageViewer } from './message-viewer';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

const liveInbox = { id: 'inbox_1', address: 'a@test.inboxrhino.in', local_part: 'a' };

describe('console UX', () => {
  it('copies a newly created API key with the copy button', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn(async () => undefined);
    vi.spyOn(navigator.clipboard, 'writeText').mockImplementation(writeText);
    render(<MessageViewer mode="live" panel="api-keys" displayMessages={[]} activeInbox={liveInbox} newApiKey="ir_live_abc_secret" />);

    await user.click(screen.getByRole('button', { name: 'Copy API key' }));
    expect(writeText).toHaveBeenCalledWith('ir_live_abc_secret');
    expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument();
  });

  it('tells the user when copying fails', async () => {
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('denied'));
    render(<MessageViewer mode="live" panel="api-keys" displayMessages={[]} activeInbox={liveInbox} newApiKey="ir_live_abc_secret" />);

    await user.click(screen.getByRole('button', { name: 'Copy API key' }));
    expect(screen.getByRole('button', { name: /Copy failed/ })).toBeInTheDocument();
  });

  it('asks for confirmation before deleting an inbox', async () => {
    const user = userEvent.setup();
    const onDeleteInbox = vi.fn();
    render(<MessageViewer mode="live" displayMessages={[]} activeInbox={liveInbox} onDeleteInbox={onDeleteInbox} />);

    await user.click(screen.getByRole('button', { name: 'Delete inbox' }));
    expect(onDeleteInbox).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onDeleteInbox).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Delete inbox' }));
    await user.click(screen.getByRole('button', { name: 'Confirm delete' }));
    expect(onDeleteInbox).toHaveBeenCalledTimes(1);
  });

  it('lets the user dismiss a displayed API key', async () => {
    const user = userEvent.setup();
    const onDismissApiKey = vi.fn();
    render(<MessageViewer mode="live" panel="api-keys" displayMessages={[]} activeInbox={liveInbox} newApiKey="ir_live_abc_secret" onDismissApiKey={onDismissApiKey} />);

    await user.click(screen.getByRole('button', { name: /saved it/ }));
    expect(onDismissApiKey).toHaveBeenCalledTimes(1);
  });
});
