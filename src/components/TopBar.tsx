import React from 'react';
import { Play, Square, Activity } from 'lucide-react';

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
  return (
    <header className="flex items-center justify-between gap-6 px-6 py-3.5 bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-40 select-none">
      {/* Zone 1: Brand Wordmark (Single text element wordmark, whitespace-nowrap shrink-0) */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-sm shadow-blue-500/20">
          FB
        </div>
        <span className="text-base font-bold tracking-tight text-white whitespace-nowrap shrink-0">
          FB &amp; Insta Pro Auto-Scheduler <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">v40.2</span>
        </span>
      </div>

      {/* Zone 2: Navigation links */}
      <nav className="hidden lg:flex items-center gap-5 text-xs font-semibold text-slate-300">
        <button
          type="button"
          onClick={() => setActiveTab('accounts')}
          className={`whitespace-nowrap shrink-0 transition-colors py-1 cursor-pointer ${
            activeTab === 'accounts'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'hover:text-white text-slate-400'
          }`}
        >
          1. Accounts &amp; API
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('content')}
          className={`whitespace-nowrap shrink-0 transition-colors py-1 cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'content'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'hover:text-white text-slate-400'
          }`}
        >
          2. Content &amp; Media
          {pendingJobsCount > 0 && (
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {pendingJobsCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('scheduler')}
          className={`whitespace-nowrap shrink-0 transition-colors py-1 cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'scheduler'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'hover:text-white text-slate-400'
          }`}
        >
          3. Master Scheduler
          {isEngineRunning && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('terminal')}
          className={`whitespace-nowrap shrink-0 transition-colors py-1 cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'terminal'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'hover:text-white text-slate-400'
          }`}
        >
          4. Live Terminal
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('python')}
          className={`whitespace-nowrap shrink-0 transition-colors py-1 cursor-pointer text-amber-400 hover:text-amber-300 ${
            activeTab === 'python' ? 'border-b-2 border-amber-400 font-bold' : ''
          }`}
        >
          🐍 Fixed Python
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('download')}
          className={`whitespace-nowrap shrink-0 transition-colors py-1 cursor-pointer text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 font-bold ${
            activeTab === 'download' ? 'border-b-2 border-emerald-400' : ''
          }`}
        >
          <span>📱 Download .EXE &amp; .APK</span>
        </button>
      </nav>

      {/* Zone 3: Actions */}
      <div className="flex items-center gap-2.5 shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab('download')}
          className="hidden sm:flex px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 cursor-pointer transition-colors items-center gap-1.5"
        >
          <span>⬇️ Download App</span>
        </button>

        <button
          type="button"
          onClick={onToggleEngine}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all shadow-sm flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
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
    </header>
  );
};
