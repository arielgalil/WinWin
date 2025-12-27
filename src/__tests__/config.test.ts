import { describe, it, expect } from 'vitest';
import { TIMEOUTS } from '../config';

describe('CONFIG Constants', () => {
  it('should have correct timeout values', () => {
    expect(TIMEOUTS.loadingScreenOptionsMs).toBe(4000);
    expect(TIMEOUTS.toastDurationMs).toBe(4000);
    expect(TIMEOUTS.authProfileFetchMs).toBe(6000);
    expect(TIMEOUTS.authSafetyTimeoutMs).toBe(8000);
  });
});
