import React, { useState, useEffect } from 'react';
import {
  Clock,
  Play,
  Square,
  Search,
  Eye,
  Trash2,
  Undo2,
  CheckCircle2,
  AlertCircle,
  Video,
  Sparkles,
} from 'lucide-react';
import { TargetItem } from '../types';

interface SchedulerTabProps {
  targets: TargetItem[];
  setTargets: React.Dispatch<React.SetStateAction<TargetItem[]>>;
  isEngineRunning: boolean;
  onToggleEngine: () => void;
  deletedStack: TargetItem[];
  setDeletedStack: React.Dispatch<React.SetStateAction<TargetItem[]>>;
  onLaunchRpa: (target: TargetItem) => void;
  onPreviewVideo: (urlOrPath: string, name: string) => void;
  onLog: (level: 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR' | 'RPA', msg: string) => void;
}

export const SchedulerTab: React.FC<SchedulerTabProps> = ({
  targets,
  setTargets,
  isEngineRunning,
  onToggleEngine,
  deletedStack,
  setDeletedStack,
  onLaunchRpa,
  onPreviewVideo,
  onLog,
}) => {
  // Live system clock
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(
    targets[0]?.id || null
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const selectedTarget = targets.find((t) => t.id === selectedTargetId) || targets[0] || null;

  const handleDeleteTarget = (target: TargetItem) => {
    setDeletedStack((prev) => [...prev, target]);
    setTargets((prev) => prev.filter((t) => t.id !== target.id));
    onLog('INFO', `Removed target [${target.profileName}] from master scheduler.`);
  };

  const handleUndoDelete = () => {
    if (deletedStack.length === 0) return;
    const last = deletedStack[deletedStack.length - 1];
    setDeletedStack((prev) => prev.slice(0, -1));
    setTargets((prev) => [...prev, last]);
    onLog('SUCCESS', `Restored [${last.profileName}] to scheduler queue.`);
  };

  // Format date time string
  const formatClock = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };

  // Calculate time remaining for target
  const getTimeRemainingStr = (target: TargetItem) => {
    try {
      const targetDt = new Date(`${target.date}T${target.time}:00`);
      const diffMs = targetDt.getTime() - currentTime.getTime();
      if (diffMs <= 0) {
        return '⏰ Due Now / Past';
      }
      const diffSecs = Math.floor(diffMs / 1000);
      const hours = Math.floor(diffSecs / 3600);
      const mins = Math.floor((diffSecs % 3600) / 60);
      const secs = diffSecs % 60;
      if (hours > 0) return `in ${hours}h ${mins}m`;
      return `in ${mins}m ${secs}s`;
    } catch {
      return 'Scheduled';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Live System Clock & Engine Status */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Live System Clock &amp; Real-Time Engine
              </div>
              <div className="text-xl font-bold font-mono text-white tracking-tight tabular-nums mt-0.5">
                {formatClock(currentTime)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs font-medium text-slate-400">
                Engine State
              </div>
              <div
                className={`text-sm font-semibold flex items-center gap-1.5 justify-end ${
                  isEngineRunning ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {isEngineRunning ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>ACTIVE &amp; Monitoring (30s Cron)</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-rose-400" />
                    <span>STOPPED (Standby)</span>
                  </>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={onToggleEngine}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all shadow-sm flex items-center gap-2 cursor-pointer ${
                isEngineRunning
                  ? 'bg-rose-600 hover:bg-rose-500 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
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
                  <span>Arm Background Engine</span>
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* 2. Advanced Target Inspector & Master Scheduler Grid */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide uppercase flex items-center gap-2">
              <Eye className="w-4 h-4 text-blue-400" />
              Advanced Target Inspector &amp; On-Demand RPA Launcher
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Click any row below to inspect target details or launch live visual RPA execution.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {selectedTarget && (
              <button
                type="button"
                onClick={() => onLaunchRpa(selectedTarget)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors shadow-sm flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                <span>Launch Live Visual RPA Window</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleUndoDelete}
              disabled={deletedStack.length === 0}
              className="px-3 py-2 bg-purple-500/10 hover:bg-purple-500/20 disabled:opacity-30 text-purple-300 border border-purple-500/30 text-xs font-semibold rounded-lg cursor-pointer transition-colors flex items-center gap-1.5"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>Undo ({deletedStack.length})</span>
            </button>
          </div>
        </div>

        {targets.length === 0 ? (
          <div className="p-10 text-center text-slate-500 border border-dashed border-slate-800 rounded-lg text-xs">
            No targets in the master scheduler queue. All orders completed or table cleared!
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-800 rounded-lg">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-semibold uppercase text-[11px] tracking-wider">
                  <th className="py-2.5 px-3">Profile / Page Name</th>
                  <th className="py-2.5 px-3 text-center">Type</th>
                  <th className="py-2.5 px-3">Assigned Video Path</th>
                  <th className="py-2.5 px-3">Caption</th>
                  <th className="py-2.5 px-3 text-center">Schedule Date</th>
                  <th className="py-2.5 px-3 text-center">Time</th>
                  <th className="py-2.5 px-3 text-center">Trigger In</th>
                  <th className="py-2.5 px-3 text-center w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-950/30">
                {targets.map((item) => {
                  const isSelected = selectedTargetId === item.id;
                  return (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedTargetId(item.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-blue-600/15 border-l-2 border-blue-500'
                          : 'hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="py-2.5 px-3 font-semibold text-slate-200">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate max-w-[190px]">{item.profileName}</span>
                        </div>
                      </td>

                      <td className="py-2.5 px-3 text-center">
                        <span className="text-[10px] font-semibold text-slate-300 font-mono">
                          {item.type}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 max-w-[240px]">
                        <span className="truncate font-mono text-[11px] text-slate-300 block">
                          {item.videoName || item.videoPath}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 max-w-[220px]">
                        <span className="truncate text-slate-400 block">{item.caption}</span>
                      </td>

                      <td className="py-2.5 px-3 text-center font-mono tabular-nums text-slate-300">
                        {item.date}
                      </td>

                      <td className="py-2.5 px-3 text-center font-mono tabular-nums text-emerald-400 font-semibold">
                        {item.time}
                      </td>

                      <td className="py-2.5 px-3 text-center font-mono tabular-nums text-amber-300 text-[11px]">
                        {getTimeRemainingStr(item)}
                      </td>

                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onLaunchRpa(item);
                            }}
                            className="p-1 text-blue-400 hover:text-blue-300 rounded cursor-pointer"
                            title="Run RPA Now"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTarget(item);
                            }}
                            className="p-1 text-slate-400 hover:text-rose-400 rounded cursor-pointer"
                            title="Remove Target"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Selected Target Live Inspector Drawer */}
        {selectedTarget && (
          <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-blue-400" />
                <span>Selected Target Inspector:</span>
                <span className="text-blue-400">{selectedTarget.profileName}</span>
                <span className="text-[10px] font-mono text-slate-500">
                  (Type: {selectedTarget.type})
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onPreviewVideo(selectedTarget.videoPath, selectedTarget.videoName || selectedTarget.profileName)}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium rounded flex items-center gap-1.5 cursor-pointer"
                >
                  <Video className="w-3 h-3 text-blue-400" />
                  <span>Preview Media</span>
                </button>

                <button
                  type="button"
                  onClick={() => onLaunchRpa(selectedTarget)}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold rounded flex items-center gap-1.5 cursor-pointer"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Run Live RPA Now</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
              <div>
                <span className="text-slate-500 block text-[11px]">Assigned Video Path:</span>
                <span className="text-slate-200 break-all">{selectedTarget.videoPath}</span>
              </div>

              <div>
                <span className="text-slate-500 block text-[11px]">Scheduled Trigger:</span>
                <span className="text-emerald-400 font-bold">
                  {selectedTarget.date} at {selectedTarget.time} ({getTimeRemainingStr(selectedTarget)})
                </span>
              </div>

              <div>
                <span className="text-slate-500 block text-[11px]">Auto-Cleanup Rule:</span>
                <span className="text-purple-300">
                  Auto-removes row from table on 200 OK delivery confirmation
                </span>
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-slate-900 text-xs">
              <span className="text-slate-500 font-mono text-[11px] block mb-1">
                Post Caption &amp; Hashtags:
              </span>
              <p className="p-2.5 rounded bg-slate-900/90 text-slate-200 text-xs border border-slate-800/60 leading-relaxed font-sans">
                {selectedTarget.caption}
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
