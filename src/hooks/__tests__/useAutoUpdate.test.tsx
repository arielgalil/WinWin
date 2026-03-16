import { renderHook, act } from '@testing-library/react';
import { useAutoUpdate } from '../useAutoUpdate';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('useAutoUpdate', () => {
  let updateServiceWorkerMock: (reloadPage?: boolean) => Promise<void>;

  beforeEach(() => {
    updateServiceWorkerMock = vi.fn().mockResolvedValue(undefined) as any;
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should not refresh immediately when update is available', () => {
    renderHook(() => useAutoUpdate({ needRefresh: true, updateServiceWorker: updateServiceWorkerMock }));
    expect(updateServiceWorkerMock).not.toHaveBeenCalled();
  });

  it('should refresh after 60 seconds of idle time', () => {
    renderHook(() => useAutoUpdate({ needRefresh: true, updateServiceWorker: updateServiceWorkerMock }));

    act(() => {
      vi.advanceTimersByTime(60000);
    });

    expect(updateServiceWorkerMock).toHaveBeenCalledWith(true);
  });

  it('should not start timer when needRefresh is false', () => {
    renderHook(() => useAutoUpdate({ needRefresh: false, updateServiceWorker: updateServiceWorkerMock }));

    act(() => {
      vi.advanceTimersByTime(60000);
    });

    expect(updateServiceWorkerMock).not.toHaveBeenCalled();
  });

  it('should reset the timer when an interaction occurs', () => {
    renderHook(() => useAutoUpdate({ needRefresh: true, updateServiceWorker: updateServiceWorkerMock }));

    act(() => {
      vi.advanceTimersByTime(30000); // 30s passed
    });

    // Simulate interaction
    act(() => {
      const event = new MouseEvent('mousemove');
      document.dispatchEvent(event);
    });

    act(() => {
      vi.advanceTimersByTime(40000); // Another 40s (total 70s since start, 40s since interaction)
    });

    expect(updateServiceWorkerMock).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(20000); // Another 20s (60s since interaction)
    });

    expect(updateServiceWorkerMock).toHaveBeenCalledWith(true);
  });
});
