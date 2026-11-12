import React, { useState, useEffect, useRef } from 'react';
import {
  Terminal,
  Trash2,
  Download,
  Search,
  ExternalLink,
  Pause,
  Play,
  Filter,
} from 'lucide-react';
import { SystemLog } from '../types';

interface TerminalTabProps {
  logs: SystemLog[];
  onClearLogs: () => void;
  onPopOut: () => void;
}

export const TerminalTab: React.FC<TerminalTabProps> = ({
  logs,
  onClearLogs,
  onPopOut,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
  const [autoScroll, setAutoScroll] = useState(true);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      searchTerm === '' ||
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.target && log.target.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesLevel = selectedLevel === 'ALL' || log.level === selectedLevel;

    return matchesSearch && matchesLevel;
  });

  const handleExportLogs = () => {
    const logText = logs
      .map(
        (l) =>
          `[${new Date(l.timestamp).toLocaleTimeString()}] [${l.level}] ${
            l.target ? `{${l.target}} ` : ''
          }${l.message}`
      )
      .join('\n');

    const blob = new Blob([logText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rpa_execution_logs_${Date.now()}.log`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getLevelColor = (level: SystemLog['level']) => {
    switch (level) {
      case 'SUCCESS':
        return 'text-emerald-400';
      case 'WARN':
        return 'text-amber-400';
      case 'ERROR':
        return 'text-rose-400 font-bold';
      case 'RPA':
        return 'text-cyan-400 font-bold';
      case 'INFO':
      default:
        return 'text-slate-300';
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12">
      {/* Terminal Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-blue-400" />
          <h2 className="text-sm font-bold text-white tracking-wide uppercase">
            Live RPA Execution Terminal &amp; Real-Time Logs
          </h2>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
            {logs.length} events
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Level Filter */}
          <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Levels</option>
              <option value="RPA">RPA Only</option>
              <option value="SUCCESS">Success Only</option>
              <option value="WARN">Warnings Only</option>
              <option value="ERROR">Errors Only</option>
              <option value="INFO">Info Only</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search logs..."
              className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 w-full sm:w-44"
            />
          </div>

          {/* Auto Scroll Toggle */}
          <button
            type="button"
            onClick={() => setAutoScroll(!autoScroll)}
            className={`p-1.5 rounded-lg border text-xs cursor-pointer flex items-center gap-1 ${
              autoScroll
                ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
            title={autoScroll ? 'Pause auto-scroll' : 'Resume auto-scroll'}
          >
            {autoScroll ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          {/* Pop-Out */}
          <button
            type="button"
            onClick={onPopOut}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs cursor-pointer"
            title="Pop out window view"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          {/* Export */}
          <button
            type="button"
            onClick={handleExportLogs}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium cursor-pointer flex items-center gap-1"
            title="Download log file"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>

          {/* Clear */}
          <button
            type="button"
            onClick={onClearLogs}
            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs cursor-pointer"
            title="Clear all logs"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal Display Viewport */}
      <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-4 font-mono text-xs shadow-inner h-[580px] overflow-y-auto leading-relaxed select-text">
        <div className="text-slate-500 pb-2 border-b border-slate-800/80 mb-3 flex items-center justify-between text-[11px]">
          <span>FB &amp; INSTA RPA PROCESS EXECUTION STREAM — [CONNECTED]</span>
          <span>UTF-8 // PTY BUFFER</span>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="text-slate-600 italic py-8 text-center">
            No log events matching current filter.
          </div>
        ) : (
          <div className="space-y-1">
            {filteredLogs.map((l) => {
              const timeStr = new Date(l.timestamp).toLocaleTimeString([], {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              });
              return (
                <div key={l.id} className="flex items-start gap-2 group hover:bg-slate-900/50 py-0.5 px-1 rounded">
                  <span className="text-slate-500 shrink-0 select-none tabular-nums text-[11px]">
                    [{timeStr}]
                  </span>
                  <span
                    className={`font-semibold shrink-0 text-[11px] w-14 ${getLevelColor(
                      l.level
                    )}`}
                  >
                    [{l.level}]
                  </span>
                  {l.target && (
                    <span className="text-indigo-300 shrink-0 text-[11px]">
                      @{l.target}:
                    </span>
                  )}
                  <span className="text-slate-200 break-all">{l.message}</span>
                </div>
              );
            })}
            <div ref={terminalEndRef} />
          </div>
        )}
      </div>
    </div>
  );
};
