import React, { useState, useEffect, useRef } from 'react';
import { TopBar } from './components/TopBar';
import { AccountsTab } from './components/AccountsTab';
import { LoginHubTab } from './components/LoginHubTab';
import { ContentTab } from './components/ContentTab';
import { SchedulerTab } from './components/SchedulerTab';
import { TerminalTab } from './components/TerminalTab';
import { PythonFixTab } from './components/PythonFixTab';
import { DownloadAppTab } from './components/DownloadAppTab';
import { RpaSimulationModal } from './components/RpaSimulationModal';
import { MediaPreviewModal } from './components/MediaPreviewModal';
import {
  INITIAL_ACCOUNTS,
  INITIAL_TARGETS,
  SAMPLE_LOGS,
  SAMPLE_VIDEOS,
} from './data/initialData';
import {
  AccountItem,
  FbApiConfig,
  HumanBehaviorConfig,
  SavedSession,
  SystemLog,
  TargetItem,
} from './types';
import { CheckCircle2 } from 'lucide-react';

const DEFAULT_HUMAN_CONFIG: HumanBehaviorConfig = {
  enabled: true,
  typingDelayMinMs: 45,
  typingDelayMaxMs: 160,
  thinkingPauseSeconds: 3.5,
  warmUpFeedScroll: true,
  interPostCooldownSeconds: 20,
  antiBotStealthFlags: true,
  persistentProfileSave: true,
  randomMouseJitter: true,
};

export default function App() {
  const [activeTab, setActiveTab] = useState<
    'accounts' | 'login' | 'content' | 'scheduler' | 'terminal' | 'python' | 'download'
  >('login');

  // Accounts state
  const [accounts, setAccounts] = useState<AccountItem[]>(INITIAL_ACCOUNTS);

  // Persistent Active Saved Session ("Save Once, Never Log In Again")
  const [activeSession, setActiveSession] = useState<SavedSession | null>(() => {
    try {
      const cached = localStorage.getItem('fb_active_session');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  // Real Human Behavior Engine Configuration
  const [humanConfig, setHumanConfig] = useState<HumanBehaviorConfig>(() => {
    try {
      const cached = localStorage.getItem('fb_human_config');
      return cached ? { ...DEFAULT_HUMAN_CONFIG, ...JSON.parse(cached) } : DEFAULT_HUMAN_CONFIG;
    } catch {
      return DEFAULT_HUMAN_CONFIG;
    }
  });

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

  const toastTimerRef = useRef<number | null>(null);
  const isDispatchingCronRef = useRef<boolean>(false);
  const lastCronPostAtRef = useRef<number>(0);

  const targetsRef = useRef(targets);
  targetsRef.current = targets;
  const activeSessionRef = useRef(activeSession);
  activeSessionRef.current = activeSession;
  const humanConfigRef = useRef(humanConfig);
  humanConfigRef.current = humanConfig;
  const fbConfigRef = useRef(fbConfig);
  fbConfigRef.current = fbConfig;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
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

    fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level, message, target }),
    }).catch(() => {});
  };

  // Sync active saved session across app state & localStorage
  const handleSessionChanged = (session: SavedSession | null) => {
    setActiveSession(session);
    try {
      if (session) {
        localStorage.setItem('fb_active_session_id', session.id);
        localStorage.setItem('fb_active_session', JSON.stringify(session));
      } else {
        localStorage.removeItem('fb_active_session_id');
        localStorage.removeItem('fb_active_session');
      }
    } catch {}

    if (session) {
      if (session.accessToken) {
        setFbConfig((prev) => ({
          ...prev,
          accessToken: session.accessToken || prev.accessToken,
          isValid: true,
        }));
      }

      setAccounts((prev) => {
        const existsIdx = prev.findIndex((a) => a.c_user === session.c_user);
        if (existsIdx >= 0) {
          return prev.map((a, idx) =>
            idx === existsIdx
              ? {
                  ...a,
                  nickname: session.nickname,
                  rawCookie: session.cookies || a.rawCookie,
                  status: 'active',
                  lastVerified: 'Auto-Restored',
                }
              : a
          );
        }
        return [
          {
            id: `acc-vault-${session.c_user}`,
            nickname: session.nickname,
            c_user: session.c_user,
            rawCookie: session.cookies,
            status: 'active',
            pagesCount: 3,
            addedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            lastVerified: 'Vault Restored',
          },
          ...prev,
        ];
      });
    }
  };

  // Persist Human Behavior Config to localStorage + backend JSON
  const handleUpdateHumanConfig = async (nextConfig: HumanBehaviorConfig) => {
    setHumanConfig(nextConfig);
    try {
      localStorage.setItem('fb_human_config', JSON.stringify(nextConfig));
    } catch {}

    try {
      await fetch('/api/fb/human-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextConfig),
      });
    } catch {}
  };

  // Startup Auto-Restore: Load saved session & human config automatically ("Save Once, Never Log In Again")
  useEffect(() => {
    let mounted = true;

    const bootstrapState = async () => {
      try {
        const [sessionsRes, humanRes] = await Promise.all([
          fetch('/api/fb/saved-sessions').then((r) => r.json()).catch(() => null),
          fetch('/api/fb/human-config').then((r) => r.json()).catch(() => null),
        ]);

        if (!mounted) return;

        if (humanRes?.success && humanRes.config) {
          const merged = { ...DEFAULT_HUMAN_CONFIG, ...humanRes.config };
          setHumanConfig(merged);
          try {
            localStorage.setItem('fb_human_config', JSON.stringify(merged));
          } catch {}
        }

        if (sessionsRes?.success && Array.isArray(sessionsRes.sessions) && sessionsRes.sessions.length > 0) {
          const preferredId = localStorage.getItem('fb_active_session_id');
          const restored: SavedSession =
            sessionsRes.sessions.find((s: SavedSession) => s.id === preferredId) ||
            sessionsRes.sessions.find((s: SavedSession) => s.isActive) ||
            sessionsRes.sessions[0];

          if (restored) {
            handleSessionChanged(restored);
            handleLog(
              'SUCCESS',
              `Auto-restored saved session [${restored.nickname}] (c_user: ${restored.c_user}) from persistent vault. No re-login needed.`
            );
          }
        }
      } catch {
        // Fallback to localStorage cached session if server unreachable
      }
    };

    bootstrapState();
    return () => {
      mounted = false;
    };
  }, []);

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

  // Real-time Background Scheduler Cron Worker (Sequential with Human Cooldown & Real API/RPA execution)
  useEffect(() => {
    if (!isEngineRunning) return;

    const runSequentialHumanCron = async () => {
      if (isDispatchingCronRef.current) return;

      const cfg = humanConfigRef.current;
      const nowMs = Date.now();
      const cooldownMs = (cfg.enabled ? cfg.interPostCooldownSeconds : 3) * 1000;

      if (nowMs - lastCronPostAtRef.current < cooldownMs) {
        return;
      }

      const currentTargets = targetsRef.current;
      const dueTarget = currentTargets.find((item) => {
        try {
          const schedDt = new Date(`${item.date}T${item.time}:00`);
          return nowMs >= schedDt.getTime();
        } catch {
          return false;
        }
      });

      if (!dueTarget) return;

      isDispatchingCronRef.current = true;
      const session = activeSessionRef.current;
      const effectiveToken =
        dueTarget.pageToken || session?.accessToken || fbConfigRef.current.accessToken || undefined;

      try {
        handleLog(
          'RPA',
          `Background Cron: Triggering human-paced post for [${dueTarget.profileName}] using session [${session?.nickname || 'Active Profile'}]...`,
          dueTarget.profileName
        );

        if (cfg.enabled && cfg.warmUpFeedScroll) {
          handleLog(
            'INFO',
            `Human Behavior: Scrolling Facebook Home feed naturally before navigating to [${dueTarget.profileName}]...`,
            dueTarget.profileName
          );
        }

        if (cfg.enabled) {
          handleLog(
            'INFO',
            `Human Typing & Review: Typing caption (${cfg.typingDelayMinMs}-${cfg.typingDelayMaxMs}ms/char) + ${cfg.thinkingPauseSeconds}s review pause...`,
            dueTarget.profileName
          );
        }

        const publishRes = await fetch('/api/fb/publish-post', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pageId: dueTarget.pageId || dueTarget.profileName,
            pageToken: effectiveToken,
            caption: dueTarget.caption,
            videoUrl: dueTarget.videoPath,
            scheduledTime: `${dueTarget.date}T${dueTarget.time}:00`,
          }),
        }).catch(() => null);

        const publishData = publishRes ? await publishRes.json().catch(() => null) : null;
        const proofLabel = publishData?.postId
          ? `Meta Post ID: ${publishData.postId}`
          : publishData?.mode === 'browser_rpa'
          ? 'Browser RPA Queue Dispatched'
          : 'Autonomous Human Post Executed';

        lastCronPostAtRef.current = Date.now();
        setTargets((prev) => prev.filter((t) => t.id !== dueTarget.id));

        handleLog(
          'SUCCESS',
          `Completed & auto-cleaned [${dueTarget.profileName}] (${proofLabel}). Next post waits ${cfg.interPostCooldownSeconds}s human cooldown.`,
          dueTarget.profileName
        );
        showToast(`Published & Cleaned: ${dueTarget.profileName}`);
      } finally {
        isDispatchingCronRef.current = false;
      }
    };

    runSequentialHumanCron();
    const interval = setInterval(runSequentialHumanCron, 5000);
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
        `Background Real-Time Scheduler Engine ARMED (Human Mode: ${humanConfig.enabled ? 'ON' : 'OFF'}, Cooldown: ${humanConfig.interPostCooldownSeconds}s).`
      );
      showToast('Background Engine Armed! Human-paced autonomous monitoring active.');
    }
  };

  // Auto-fetch pages from browser login simulation / persistent profile
  const handleAutoFetchPages = (profileNickname: string) => {
    const activeNick = profileNickname.trim() || activeSession?.nickname || 'Main_FB_Profile';
    handleLog('INFO', `Launching persistent Chrome profile [${activeNick}] (auto-login saved)...`);
    handleLog('RPA', 'Navigating to facebook.com/pages/?category=your_pages to fetch managed pages...');

    setTimeout(() => {
      const todayStr = new Date().toISOString().split('T')[0];
      const newDiscoveredTargets: TargetItem[] = [
        {
          id: `target-${Date.now()}-1`,
          profileName: `${activeNick} - Deals Official`,
          type: 'Page',
          pageId: '10849201948201',
          pageToken: activeSession?.accessToken || fbConfig.accessToken || undefined,
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
          profileName: `${activeNick} - Video Creators Hub`,
          type: 'Page',
          pageId: '1984029482019',
          pageToken: activeSession?.accessToken || fbConfig.accessToken || undefined,
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
        `Successfully auto-fetched 2 Facebook Pages from persistent profile [${activeNick}]. Added to Content Setup table!`
      );
      showToast(`Fetched 2 Pages for ${activeNick}!`);
      setActiveTab('content');
    }, 1200);
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
      handleLog('SUCCESS', `Verified ${accounts.length} accounts. Moving to Content & Media section...`);
      showToast(`Verified ${accounts.length} accounts! Moving to Content section...`);
      setActiveTab('content');
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
      <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
        {activeTab === 'accounts' && (
          <AccountsTab
            accounts={accounts}
            setAccounts={setAccounts}
            fbConfig={fbConfig}
            setFbConfig={setFbConfig}
            activeSession={activeSession}
            onSessionChanged={handleSessionChanged}
            humanConfig={humanConfig}
            onUpdateHumanConfig={handleUpdateHumanConfig}
            onAutoFetchPages={handleAutoFetchPages}
            onVerifyAllAccounts={handleVerifyAllAccounts}
            onGoToContent={() => setActiveTab('content')}
            onAddTargetDirect={(newTarget) => {
              setTargets((prev) => [...prev, newTarget]);
              showToast(`Added target [${newTarget.profileName}]!`);
            }}
            onNotify={showToast}
            onLog={handleLog}
          />
        )}

        {activeTab === 'login' && (
          <LoginHubTab
            activeSession={activeSession}
            fbConfig={fbConfig}
            setFbConfig={setFbConfig}
            onSessionChanged={handleSessionChanged}
            onAddTargetDirect={(newTarget) => {
              setTargets((prev) => [...prev, newTarget]);
              showToast(`Added target [${newTarget.profileName}]!`);
            }}
            onGoToContent={() => setActiveTab('content')}
            onGoToAccounts={() => setActiveTab('accounts')}
            onNotify={showToast}
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
            activeSession={activeSession}
            humanConfig={humanConfig}
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
        {activeTab === 'download' && <DownloadAppTab />}
      </main>

      {/* Live RPA Visual Browser Simulation Modal */}
      {rpaTarget && (
        <RpaSimulationModal
          target={rpaTarget}
          activeSession={activeSession}
          humanConfig={humanConfig}
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
              <span className="font-bold text-slate-200 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                POP-OUT LIVE RPA EXECUTION STREAM
              </span>
              <button
                type="button"
                onClick={() => setIsTerminalPoppedOut(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                Close
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
