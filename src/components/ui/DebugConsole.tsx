
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon, TrashIcon, CopyIcon, BugIcon } from './Icons';
import { useLanguage } from '../../hooks/useLanguage';

const MotionDiv = motion.div;

interface LogEntry {
  id: number;
  time: string;
  type: 'log' | 'error' | 'warn';
  msg: string;
}

export const DebugConsole: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { t, dir } = useLanguage();
  const [logs, setLogs] = useState<LogEntry[]>((window).__LOGS__ || []);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleNewLog = () => {
      setLogs([...((window).__LOGS__ || [])]);
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
    (window).__LOGS__ = [];
    setLogs([]);
  };

  const copyToClipboard = () => {
    const text = logs.map(l => `[${l.time}] [${l.type.toUpperCase()}] ${l.msg}`).join('\n');
    navigator.clipboard.writeText(text);
    alert(t('logs_copied'));
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
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-slate-900/50">
              <div className="flex items-center gap-3 text-red-500">
                <BugIcon className="w-6 h-6" />
                <span className="font-black text-sm uppercase tracking-tighter">System Debug Console</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={copyToClipboard} className="p-2 hover:bg-white/10 rounded-xl text-blue-400 transition-colors" title={t('copy_all')}>
                  <CopyIcon className="w-5 h-5" />
                </button>
                <button onClick={clearLogs} className="p-2 hover:bg-white/10 rounded-xl text-slate-400 transition-colors" title={t('clear_action')}>
                  <TrashIcon className="w-5 h-5" />
                </button>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl text-white transition-colors">
                  <XIcon className="w-6 h-6" />
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

            {/* Instructions */}
            <div className={`px-6 py-2 bg-black/60 text-[9px] text-slate-500 font-bold border-t border-white/5 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
              {t('debug_tip')}
            </div>
          </MotionDiv>
        </div>
      )}
    </AnimatePresence>
  );
};
