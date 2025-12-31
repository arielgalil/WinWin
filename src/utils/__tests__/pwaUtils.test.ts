import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prewarmKioskAssets } from '../pwaUtils';

describe('pwaUtils', () => {
    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: true })));
    });

    it('should call fetch for each critical asset', async () => {
        await prewarmKioskAssets();
        
        const fetchMock = vi.mocked(fetch);
        // We expect at least 2 calls (fonts and material symbols)
        expect(fetchMock).toHaveBeenCalledTimes(2);
        
        const calls = fetchMock.mock.calls.map(call => call[0]);
        expect(calls).toContain('https://fonts.googleapis.com/css2?family=Noto+Sans+Hebrew:wght@300;400;500;700;800;900&family=Heebo:wght@300;400;500;700;800;900&display=swap');
        expect(calls).toContain('https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block');
    });

    it('should use no-cors mode for fetches', async () => {
        await prewarmKioskAssets();
        
        const fetchMock = vi.mocked(fetch);
        const options = fetchMock.mock.calls[0][1];
        expect(options).toMatchObject({ mode: 'no-cors' });
    });

    it('should fail silently if fetch fails', async () => {
        vi.stubGlobal('fetch', vi.fn(() => Promise.reject('Network error')));
        
        // Should not throw
        await expect(prewarmKioskAssets()).resolves.not.toThrow();
    });
});
