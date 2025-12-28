import { renderHook, act } from '@testing-library/react';
import { useAutoUpdate } from '../useAutoUpdate';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Mock the virtual module
vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: vi.fn(),
}));

// We need to import it AFTER vi.mock
import { useRegisterSW } from 'virtual:pwa-register/react';

describe('useAutoUpdate', () => {
  let updateServiceWorkerMock: any;
  let setNeedRefreshMock: any;

  beforeEach(() => {
    updateServiceWorkerMock = vi.fn();
    setNeedRefreshMock = vi.fn();
    (useRegisterSW as any).mockReturnValue({
      offlineReady: [false, vi.fn()],
      needRefresh: [false, setNeedRefreshMock],
      updateServiceWorker: updateServiceWorkerMock,
    });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should not refresh immediately when update is available', () => {
    (useRegisterSW as any).mockReturnValue({
      offlineReady: [false, vi.fn()],
      needRefresh: [true, setNeedRefreshMock],
      updateServiceWorker: updateServiceWorkerMock,
    });

    renderHook(() => useAutoUpdate());
    
    expect(updateServiceWorkerMock).not.toHaveBeenCalled();
  });

  it('should refresh after 60 seconds of idle time', () => {
    (useRegisterSW as any).mockReturnValue({
      offlineReady: [false, vi.fn()],
      needRefresh: [true, setNeedRefreshMock],
      updateServiceWorker: updateServiceWorkerMock,
    });

    renderHook(() => useAutoUpdate());
    
    act(() => {
      vi.advanceTimersByTime(60000);
    });

    expect(updateServiceWorkerMock).toHaveBeenCalledWith(true);
  });

  it('should log registration success and error', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    let onRegisteredCallback: any;
    let onRegisterErrorCallback: any;

    (useRegisterSW as any).mockImplementation((options: any) => {
      onRegisteredCallback = options.onRegistered;
      onRegisterErrorCallback = options.onRegisterError;
      return {
        offlineReady: [false, vi.fn()],
        needRefresh: [false, vi.fn()],
        updateServiceWorker: vi.fn(),
      };
    });

    renderHook(() => useAutoUpdate());
    
    onRegisteredCallback('mock-sw');
    expect(consoleSpy).toHaveBeenCalledWith('[PWA] Service Worker registered: ', 'mock-sw');

    onRegisterErrorCallback('mock-error');
    expect(consoleErrorSpy).toHaveBeenCalledWith('[PWA] Service Worker registration error: ', 'mock-error');

    consoleSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('should reset the timer when an interaction occurs', () => {
    (useRegisterSW as any).mockReturnValue({
      offlineReady: [false, vi.fn()],
      needRefresh: [true, setNeedRefreshMock],
      updateServiceWorker: updateServiceWorkerMock,
    });

    renderHook(() => useAutoUpdate());
    
    act(() => {
      vi.advanceTimersByTime(30000); // 30s passed
    });

    // Simulate interaction
    act(() => {
      const event = new MouseEvent('mousemove');
      document.dispatchEvent(event);
    });

    act(() => {
      vi.advanceTimersByTime(40000); // Another 40s passed (Total 70s since start, but 40s since interaction)
    });

    expect(updateServiceWorkerMock).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(20000); // Another 20s passed (Total 60s since interaction)
    });

    expect(updateServiceWorkerMock).toHaveBeenCalledWith(true);
  });
});
