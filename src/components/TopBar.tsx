import React from 'react';
import { Play, Square } from 'lucide-react';

interface TopBarProps {
  activeTab: 'accounts' | 'content' | 'scheduler' | 'terminal' | 'python' | 'download';
  setActiveTab: (tab: 'accounts' | 'content' | 'scheduler' | 'terminal' | 'python' | 'download') => void;
  isEngineRunning: boolean;
  onToggleEngine: () => void;
  pendingJobsCount: number;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  setActiveTab,
  isEngineRunning,
  onToggleEngine,
  pendingJobsCount,
}) => {
  const navItems: {
    id: TopBarProps['activeTab'];
    label: string;
    shortLabel: string;
    accent?: string;
    badge?: number;
    liveDot?: boolean;
  }[] = [
    { id: 'accounts', label: '1. Accounts & Vault', shortLabel: 'Accounts' },
    { id: 'content', label: '2. Content & Media', shortLabel: 'Content', badge: pendingJobsCount },
    { id: 'scheduler', label: '3. Master Scheduler', shortLabel: 'Scheduler', liveDot: isEngineRunning },
    { id: 'terminal', label: '4. Live Terminal', shortLabel: 'Terminal' },
    { id: 'python', label: 'Fixed Python', shortLabel: 'Python', accent: 'text-amber-400 hover:text-amber-300' },
    { id: 'download', label: 'EXE & APK', shortLabel: 'EXE/APK', accent: 'text-emerald-400 hover:text-emerald-300 font-bold' },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-40 select-none">
      {/* 3-Zone Top Bar Contract */}
      <div className="flex items-center justify-between gap-4 px-4 sm:px-6 py-3.5 max-w-7xl mx-auto">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-xs text-white shadow-sm shadow-blue-500/20">
            FB
          </div>
          <span className="text-sm sm:text-base font-bold tracking-tight text-white whitespace-nowrap shrink-0">
            FB &amp; Insta Pro Auto-Scheduler{' '}
            <span className="text-[11px] font-mono font-semibold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              v40.2
            </span>
          </span>
        </div>

        {/* Zone 2: Navigation links */}
        <nav className="hidden lg:flex items-center gap-5 text-xs font-semibold text-slate-300">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`whitespace-nowrap shrink-0 transition-colors py-1 cursor-pointer flex items-center gap-1.5 ${
                  item.accent ? item.accent : isActive ? 'text-blue-400' : 'hover:text-white text-slate-400'
                } ${isActive ? 'border-b-2 border-current' : ''}`}
              >
                <span>{item.label}</span>
                {typeof item.badge === 'number' && item.badge > 0 && (
                  <span className="text-[10px] font-mono tabular-nums px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {item.badge}
                  </span>
                )}
                {item.liveDot && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Single Primary Action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onToggleEngine}
            className={`px-3.5 sm:px-4 py-2 text-xs font-semibold rounded-lg transition-all shadow-sm flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
              isEngineRunning
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/30'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30'
            }`}
          >
            {isEngineRunning ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Disarm Engine</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Arm Engine</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Mobile / Tablet Navigation Bar */}
      <nav className="lg:hidden flex items-center gap-2 px-4 py-2 border-t border-slate-800/80 bg-slate-950/60 overflow-x-auto text-xs font-semibold">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`whitespace-nowrap shrink-0 px-2.5 py-1.5 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                isActive
                  ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40'
                  : item.accent
                  ? `${item.accent} bg-slate-900 border border-slate-800`
                  : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
              }`}
            >
              <span>{item.shortLabel}</span>
              {typeof item.badge === 'number' && item.badge > 0 && (
                <span className="text-[10px] font-mono tabular-nums px-1 rounded bg-slate-800 text-slate-200">
                  {item.badge}
                </span>
              )}
              {item.liveDot && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
              )}
            </button>
          );
        })}
      </nav>
    </header>
  );
};
