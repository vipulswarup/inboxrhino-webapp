import { describe, expect, it, vi } from 'vitest';
import { deleteObjects } from './utils';

describe('deleteObjects', () => {
  it('deletes in chunks of 1000 keys with one call per chunk', async () => {
    const remove = vi.fn<(keys: string[]) => Promise<void>>(async () => undefined);
    const keys = Array.from({ length: 2500 }, (_, index) => `k${index}`);
    await deleteObjects({ delete: remove } as unknown as R2Bucket, keys);
    expect(remove.mock.calls.map(([chunk]) => chunk.length)).toEqual([1000, 1000, 500]);
  });

  it('makes no call for an empty list', async () => {
    const remove = vi.fn();
    await deleteObjects({ delete: remove } as unknown as R2Bucket, []);
    expect(remove).not.toHaveBeenCalled();
  });
});
