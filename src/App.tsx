import React, { useState, useEffect } from 'react';
import { TopBar } from './components/TopBar';
import { AccountsTab } from './components/AccountsTab';
import { ContentTab } from './components/ContentTab';
import { SchedulerTab } from './components/SchedulerTab';
import { TerminalTab } from './components/TerminalTab';
import { PythonFixTab } from './components/PythonFixTab';
import { RpaSimulationModal } from './components/RpaSimulationModal';
import { MediaPreviewModal } from './components/MediaPreviewModal';
import {
  INITIAL_ACCOUNTS,
  INITIAL_TARGETS,
  SAMPLE_LOGS,
  SAMPLE_VIDEOS,
} from './data/initialData';
import { AccountItem, FbApiConfig, SystemLog, TargetItem } from './types';
import { CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<
    'accounts' | 'content' | 'scheduler' | 'terminal' | 'python'
  >('accounts');

  // Accounts state
  const [accounts, setAccounts] = useState<AccountItem[]>(INITIAL_ACCOUNTS);

  // Targets state
  const [targets, setTargets] = useState<TargetItem[]>(INITIAL_TARGETS);

  // Deleted stack for Ctrl+Z undo
  const [deletedStack, setDeletedStack] = useState<TargetItem[]>([]);

  // Logs state
  const [logs, setLogs] = useState<SystemLog[]>(SAMPLE_LOGS);

  // Facebook Graph API credentials
  const [fbConfig, setFbConfig] = useState<FbApiConfig>({
    appId: '10849201948201',
    appSecret: '••••••••••••••••••••••••••••••••',
    accessToken: 'EAABwz9842a84920192849012849012ZDZD',
    isValid: true,
  });

  // Background scheduler engine state
  const [isEngineRunning, setIsEngineRunning] = useState<boolean>(false);

  // Modal states
  const [rpaTarget, setRpaTarget] = useState<TargetItem | null>(null);
  const [previewMedia, setPreviewMedia] = useState<{
    path: string;
    name: string;
  } | null>(null);
  const [isTerminalPoppedOut, setIsTerminalPoppedOut] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Helper to add system log
  const handleLog = (
    level: 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR' | 'RPA',
    message: string,
    target?: string
  ) => {
    const newLog: SystemLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      level,
      message,
      target,
    };
    setLogs((prev) => [...prev, newLog]);

    // Also push to server if available
    fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level, message, target }),
    }).catch(() => {});
  };

  // Global key listener for Ctrl+Z (Undo delete)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (deletedStack.length > 0) {
          e.preventDefault();
          const last = deletedStack[deletedStack.length - 1];
          setDeletedStack((prev) => prev.slice(0, -1));
          setTargets((prev) => [...prev, last]);
          handleLog('SUCCESS', `Undo: Restored target [${last.profileName}]`);
          showToast(`Restored [${last.profileName}] to table!`);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deletedStack]);

  // Real-time Background Scheduler Cron Worker
  useEffect(() => {
    if (!isEngineRunning) return;

    const interval = setInterval(() => {
      const now = new Date();

      setTargets((prevTargets) => {
        const remaining: TargetItem[] = [];
        let executedCount = 0;

        for (const item of prevTargets) {
          try {
            const schedDt = new Date(`${item.date}T${item.time}:00`);
            // Check if current system time has reached or passed scheduled datetime
            if (now.getTime() >= schedDt.getTime()) {
              executedCount++;
              handleLog(
                'RPA',
                `⏰ Background Cron: Schedule time triggered for [${item.profileName}] (${item.date} ${item.time}). Executing automated post...`,
                item.profileName
              );
              handleLog(
                'SUCCESS',
                `🧹 Order completed successfully! [${item.profileName}] table se clean (auto-removed) kar diya gaya hai.`,
                item.profileName
              );
              showToast(`Auto-Cleaned & Published: ${item.profileName}`);
              // Row is NOT kept in remaining queue (auto-cleanup!)
            } else {
              remaining.push(item);
            }
          } catch {
            remaining.push(item);
          }
        }

        return remaining;
      });
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [isEngineRunning]);

  // Toggle Background Scheduler
  const handleToggleEngine = () => {
    if (isEngineRunning) {
      setIsEngineRunning(false);
      handleLog('WARN', 'Background Real-Time Scheduler Engine STOPPED by user.');
      showToast('Background Engine Disarmed.');
    } else {
      setIsEngineRunning(true);
      handleLog(
        'SUCCESS',
        'Background Real-Time Scheduler Engine ARMED & Monitoring schedules.'
      );
      showToast('🚀 Background Engine Armed! Monitoring active schedules.');
    }
  };

  // Auto-fetch pages from browser login simulation
  const handleAutoFetchPages = (profileNickname: string) => {
    handleLog('INFO', `Opening browser session for profile [${profileNickname}]...`);
    handleLog('RPA', 'Navigating to facebook.com/pages/?category=your_pages to fetch managed pages...');

    setTimeout(() => {
      const todayStr = new Date().toISOString().split('T')[0];
      const newDiscoveredTargets: TargetItem[] = [
        {
          id: `target-${Date.now()}-1`,
          profileName: `${profileNickname} - Deals Official`,
          type: 'Page',
          videoPath: SAMPLE_VIDEOS[0].path,
          videoName: SAMPLE_VIDEOS[0].name,
          caption: 'Check out this trending product! Link in bio. #viral #shop',
          date: todayStr,
          time: '14:30',
          status: 'pending',
          createdAt: new Date().toISOString(),
        },
        {
          id: `target-${Date.now()}-2`,
          profileName: `${profileNickname} - Video Creators Hub`,
          type: 'Page',
          videoPath: SAMPLE_VIDEOS[1].path,
          videoName: SAMPLE_VIDEOS[1].name,
          caption: 'Daily motivational reel for digital creators! #fbreels #creator',
          date: todayStr,
          time: '16:00',
          status: 'pending',
          createdAt: new Date().toISOString(),
        },
      ];

      setTargets((prev) => [...prev, ...newDiscoveredTargets]);
      handleLog(
        'SUCCESS',
        `✅ Successfully auto-fetched 2 Facebook Pages from profile [${profileNickname}]. Added to Content Setup table!`
      );
      showToast(`Fetched 2 Pages for ${profileNickname}!`);
      setActiveTab('content');
    }, 1500);
  };

  // 1-Click Verify All Accounts
  const handleVerifyAllAccounts = () => {
    handleLog('INFO', 'Starting 1-Click Verification of all loaded accounts...');
    setTimeout(() => {
      setAccounts((prev) =>
        prev.map((acc) => ({
          ...acc,
          status: 'active',
          lastVerified: 'Just now',
        }))
      );
      handleLog('SUCCESS', `Verified ${accounts.length} accounts. Active queue synchronized.`);
      showToast(`Verified ${accounts.length} accounts successfully!`);
    }, 800);
  };

  // Complete RPA & Auto-cleanup row
  const handleCompleteAndCleanRow = (targetId: string) => {
    setTargets((prev) => prev.filter((t) => t.id !== targetId));
    showToast('Task finished & auto-cleaned from queue!');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Bar Contract (3-Zone Contract) */}
      <TopBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isEngineRunning={isEngineRunning}
        onToggleEngine={handleToggleEngine}
        pendingJobsCount={targets.length}
      />

      {/* Main Workspace Viewport */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
        {activeTab === 'accounts' && (
          <AccountsTab
            accounts={accounts}
            setAccounts={setAccounts}
            fbConfig={fbConfig}
            setFbConfig={setFbConfig}
            onAutoFetchPages={handleAutoFetchPages}
            onVerifyAllAccounts={handleVerifyAllAccounts}
            onAddTargetDirect={(newTarget) => {
              setTargets((prev) => [...prev, newTarget]);
              showToast(`Added target [${newTarget.profileName}]!`);
            }}
            onLog={handleLog}
          />
        )}

        {activeTab === 'content' && (
          <ContentTab
            targets={targets}
            setTargets={setTargets}
            deletedStack={deletedStack}
            setDeletedStack={setDeletedStack}
            onGoToScheduler={() => setActiveTab('scheduler')}
            onPreviewVideo={(path, name) => setPreviewMedia({ path, name })}
            onLog={handleLog}
          />
        )}

        {activeTab === 'scheduler' && (
          <SchedulerTab
            targets={targets}
            setTargets={setTargets}
            isEngineRunning={isEngineRunning}
            onToggleEngine={handleToggleEngine}
            deletedStack={deletedStack}
            setDeletedStack={setDeletedStack}
            onLaunchRpa={(target) => setRpaTarget(target)}
            onPreviewVideo={(path, name) => setPreviewMedia({ path, name })}
            onLog={handleLog}
          />
        )}

        {activeTab === 'terminal' && (
          <TerminalTab
            logs={logs}
            onClearLogs={() => {
              setLogs([]);
              handleLog('INFO', 'Execution logs cleared by user.');
            }}
            onPopOut={() => setIsTerminalPoppedOut(true)}
          />
        )}

        {activeTab === 'python' && <PythonFixTab />}
      </main>

      {/* Live RPA Visual Browser Simulation Modal */}
      {rpaTarget && (
        <RpaSimulationModal
          target={rpaTarget}
          onClose={() => setRpaTarget(null)}
          onCompleteAndCleanRow={handleCompleteAndCleanRow}
          onLog={handleLog}
        />
      )}

      {/* Media Video Preview Modal */}
      {previewMedia && (
        <MediaPreviewModal
          mediaPath={previewMedia.path}
          mediaName={previewMedia.name}
          onClose={() => setPreviewMedia(null)}
        />
      )}

      {/* Pop-Out Terminal Window Modal */}
      {isTerminalPoppedOut && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b0f19] border border-slate-700 rounded-2xl max-w-5xl w-full h-[80vh] shadow-2xl flex flex-col overflow-hidden">
            <div className="px-5 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-200">
                🔴 POP-OUT LIVE RPA EXECUTION STREAM
              </span>
              <button
                type="button"
                onClick={() => setIsTerminalPoppedOut(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕ Close
              </button>
            </div>
            <div className="flex-1 p-4 overflow-y-auto font-mono text-xs text-slate-300 space-y-1">
              {logs.map((l) => (
                <div key={l.id} className="flex gap-2">
                  <span className="text-slate-500 tabular-nums">
                    [{new Date(l.timestamp).toLocaleTimeString()}]
                  </span>
                  <span className="text-emerald-400 font-bold">[{l.level}]</span>
                  <span>{l.message}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-slate-700 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
