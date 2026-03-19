
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon, TrashIcon, CopyIcon, BugIcon, RefreshIcon } from './Icons';
import { useLanguage } from '../../hooks/useLanguage';

const MotionDiv = motion.div as any;

interface LogEntry {
  id: number;
  time: string;
  type: 'log' | 'error' | 'warn';
  msg: string;
}

const APP_VERSION = (import.meta as any).env?.VITE_APP_VERSION ?? '—';

type UpdateStatus = 'idle' | 'checking' | 'up_to_date' | 'update_found' | 'no_sw';

export const DebugConsole: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { t, dir } = useLanguage();
  const [logs, setLogs] = useState<LogEntry[]>((window as any).__LOGS__ || []);
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>('idle');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleNewLog = () => {
      setLogs([...((window as any).__LOGS__ || [])]);
    };
    window.addEventListener('app-log-added', handleNewLog);
    return () => window.removeEventListener('app-log-added', handleNewLog);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const clearLogs = () => {
    (window as any).__LOGS__ = [];
    setLogs([]);
  };

  const copyToClipboard = () => {
    const text = logs.map(l => `[${l.time}] [${l.type.toUpperCase()}] ${l.msg}`).join('\n');
    navigator.clipboard.writeText(text);
    alert(t('logs_copied'));
  };

  const checkAndForceUpdate = async () => {
    if (!('serviceWorker' in navigator)) {
      setUpdateStatus('no_sw');
      setTimeout(() => setUpdateStatus('idle'), 3000);
      return;
    }

    setUpdateStatus('checking');

    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (!reg) {
        setUpdateStatus('no_sw');
        setTimeout(() => setUpdateStatus('idle'), 3000);
        return;
      }

      // Force check for new version
      await reg.update();

      const waiting = reg.waiting;
      const installing = reg.installing;

      if (waiting || installing) {
        // There's a new SW waiting or installing — send skipWaiting
        const sw = waiting || installing;
        setUpdateStatus('update_found');
        sw!.postMessage({ type: 'SKIP_WAITING' });
        setTimeout(() => window.location.reload(), 1500);
      } else {
        // No new SW found — hard reload to bust cache
        setUpdateStatus('up_to_date');
        setTimeout(() => setUpdateStatus('idle'), 3000);
      }
    } catch {
      setUpdateStatus('no_sw');
      setTimeout(() => setUpdateStatus('idle'), 3000);
    }
  };

  const forceHardReload = async () => {
    // Unregister SW, clear caches, then reload
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(r => r.unregister()));
    }
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    }
    window.location.reload();
  };

  const updateStatusLabel = () => {
    switch (updateStatus) {
      case 'checking': return t('debug_checking');
      case 'up_to_date': return t('debug_up_to_date');
      case 'update_found': return t('debug_update_found');
      case 'no_sw': return t('debug_no_sw');
      default: return null;
    }
  };

  const statusColor = () => {
    switch (updateStatus) {
      case 'up_to_date': return 'text-emerald-400';
      case 'update_found': return 'text-blue-400';
      case 'no_sw': return 'text-yellow-400';
      default: return 'text-zinc-400';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 sm:p-8" dir={dir}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
          <MotionDiv
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-2xl h-[80vh] bg-slate-950 border border-white/10 rounded-3xl shadow-2xl flex flex-col pointer-events-auto overflow-hidden relative"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-slate-900/50 gap-3">
              {/* Title + version */}
              <div className="flex items-center gap-2.5 min-w-0">
                <BugIcon className="w-5 h-5 text-red-500 shrink-0" />
                <div className="flex flex-col leading-tight min-w-0">
                  <span className="font-black text-sm text-red-400 uppercase tracking-tight leading-none">
                    {t('debug_console_title')}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono leading-none mt-0.5">
                    v{APP_VERSION}
                  </span>
                </div>
              </div>

              {/* Update controls */}
              <div className="flex items-center gap-2 flex-1 justify-center">
                <button
                  onClick={checkAndForceUpdate}
                  disabled={updateStatus === 'checking' || updateStatus === 'update_found'}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/30 rounded-xl text-blue-300 text-[11px] font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  title={t('debug_check_update')}
                >
                  <RefreshIcon className={`w-3.5 h-3.5 ${updateStatus === 'checking' ? 'animate-spin' : ''}`} />
                  {t('debug_check_update')}
                </button>
                <button
                  onClick={forceHardReload}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600/20 hover:bg-orange-600/40 border border-orange-500/30 rounded-xl text-orange-300 text-[11px] font-bold transition-all"
                  title={t('debug_force_update')}
                >
                  <RefreshIcon className="w-3.5 h-3.5" />
                  {t('debug_force_update')}
                </button>
                {updateStatus !== 'idle' && (
                  <span className={`text-[10px] font-bold ${statusColor()}`}>
                    {updateStatusLabel()}
                  </span>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={copyToClipboard} className="p-1.5 hover:bg-white/10 rounded-xl text-blue-400 transition-colors" title={t('copy_all')}>
                  <CopyIcon className="w-4 h-4" />
                </button>
                <button onClick={clearLogs} className="p-1.5 hover:bg-white/10 rounded-xl text-slate-400 transition-colors" title={t('clear_action')}>
                  <TrashIcon className="w-4 h-4" />
                </button>
                <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-xl text-white transition-colors">
                  <XIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Logs List */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-[10px] custom-scrollbar">
              {logs.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-600 italic">No logs yet...</div>
              ) : (
                logs.map(log => (
                  <div key={log.id} className={`p-2 rounded-lg border leading-relaxed break-all ${log.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                      log.type === 'warn' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-300' :
                        'bg-white/5 border-white/5 text-slate-300'
                    }`}>
                    <span className="opacity-50 mx-2">[{log.time}]</span>
                    {log.msg}
                  </div>
                ))
              )}
            </div>

          </MotionDiv>
        </div>
      )}
    </AnimatePresence>
  );
};
