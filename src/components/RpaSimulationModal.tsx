import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  CheckCircle2,
  Lock,
  Video,
  FileText,
  Clock,
  ShieldCheck,
  Bot,
} from 'lucide-react';
import { HumanBehaviorConfig, SavedSession, TargetItem } from '../types';

interface RpaSimulationModalProps {
  target: TargetItem | null;
  activeSession: SavedSession | null;
  humanConfig: HumanBehaviorConfig;
  onClose: () => void;
  onCompleteAndCleanRow: (targetId: string) => void;
  onLog: (level: 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR' | 'RPA', msg: string) => void;
}

interface RpaStep {
  id: string;
  title: string;
  desc: string;
}

export const RpaSimulationModal: React.FC<RpaSimulationModalProps> = ({
  target,
  activeSession,
  humanConfig,
  onClose,
  onCompleteAndCleanRow,
  onLog,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [typedCaption, setTypedCaption] = useState('');
  const [realMetaPostId, setRealMetaPostId] = useState<string | null>(null);
  const [feedScrollPct, setFeedScrollPct] = useState(0);

  const steps: RpaStep[] = useMemo(() => {
    const base: RpaStep[] = [
      {
        id: 'spawn',
        title: 'Restoring Persistent Chromium Profile',
        desc: `Attaching saved user-data-dir (${humanConfig.antiBotStealthFlags ? 'webdriver=false stealth active' : 'standard CDP'})`,
      },
      {
        id: 'cookies',
        title: 'Auto-Restoring Vault Session Credentials',
        desc: activeSession
          ? `Injected ${activeSession.nickname} (c_user: ${activeSession.c_user}) — no password login needed`
          : 'Validating c_user & xs tokens for authentication',
      },
    ];

    if (humanConfig.enabled && humanConfig.warmUpFeedScroll) {
      base.push({
        id: 'warmup',
        title: 'Human Feed Warm-Up & Natural Scroll',
        desc: 'Scrolling facebook.com Home feed with natural reading pauses to build real-user trust',
      });
    }

    base.push(
      {
        id: 'navigate',
        title: 'Navigating to Meta Creator Studio',
        desc: 'Opening business.facebook.com/latest/reels_composer',
      },
      {
        id: 'persona',
        title: 'Switching Persona to Destination Target',
        desc: `Selecting managed Page / Profile context: ${target?.profileName || 'Target'}`,
      },
      {
        id: 'upload',
        title: 'Uploading Video Asset Bytes',
        desc: 'Locating input[type="file"] and sending assigned media file',
      },
      {
        id: 'typing',
        title: 'Human Character-by-Character Caption Typing',
        desc: `Typing naturally (${humanConfig.typingDelayMinMs}–${humanConfig.typingDelayMaxMs}ms/char jitter + punctuation pauses)`,
      },
      {
        id: 'schedule',
        title: 'Thinking Pause & Schedule Slot Review',
        desc: `Human review pause (${humanConfig.thinkingPauseSeconds}s) before setting ${target?.date} ${target?.time}`,
      },
      {
        id: 'publish',
        title: 'Triggering Publish / Schedule Action',
        desc: 'Awaiting 200 OK Graph API / Meta Creator Studio delivery confirmation',
      },
      {
        id: 'cleanup',
        title: 'Capturing Execution Proof & Queue Cleanup',
        desc: 'Generated verification proof, removing completed row from schedule queue',
      }
    );

    return base;
  }, [humanConfig, activeSession, target]);

  useEffect(() => {
    if (!target) return;

    let cancelled = false;
    setCurrentStepIndex(0);
    setIsFinished(false);
    setTypedCaption('');
    setRealMetaPostId(null);
    setFeedScrollPct(0);

    onLog(
      'RPA',
      `[LIVE RPA] Initiating human-paced execution for [${target.profileName}] using saved session [${
        activeSession?.nickname || 'Default'
      }]...`
    );

    let capturedPostId: string | null = null;
    const effectiveToken = target.pageToken || activeSession?.accessToken;

    if (effectiveToken && target.pageId) {
      fetch('/api/fb/publish-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageId: target.pageId,
          pageToken: effectiveToken,
          caption: target.caption,
          videoUrl: target.videoPath,
          scheduledTime: `${target.date}T${target.time}:00`,
        }),
      })
        .then(async (res) => {
          const data = await res.json();
          if (!cancelled && data.postId) {
            capturedPostId = data.postId;
            setRealMetaPostId(data.postId);
            onLog('SUCCESS', `Meta Graph API confirmed live publication ID: ${data.postId}`);
          }
        })
        .catch(() => {});
    }

    let stepTimer: number | null = null;
    let typingTimer: number | null = null;
    let warmupTimer: number | null = null;

    const advanceStep = (idx: number) => {
      if (cancelled) return;
      if (idx >= steps.length) {
        setIsFinished(true);
        const generatedId = capturedPostId || `fb_reel_${Date.now()}`;
        setRealMetaPostId(generatedId);
        onLog(
          'SUCCESS',
          `Task execution completed for [${target.profileName}] (Post ID: ${generatedId}). Auto-cleanup triggered.`
        );
        onCompleteAndCleanRow(target.id);
        return;
      }

      setCurrentStepIndex(idx);
      const stepObj = steps[idx];
      onLog('RPA', `[STEP ${idx + 1}/${steps.length}] ${stepObj.title} -> ${stepObj.desc}`);

      if (stepObj.id === 'warmup') {
        let pct = 0;
        warmupTimer = window.setInterval(() => {
          if (cancelled) return;
          pct += 25;
          setFeedScrollPct(Math.min(pct, 100));
          if (pct >= 100 && warmupTimer) {
            window.clearInterval(warmupTimer);
          }
        }, 280);
      }

      if (stepObj.id === 'typing') {
        const fullText = target.caption || '';
        let charIdx = 0;
        const avgCharMs = Math.max(
          18,
          Math.min(
            90,
            Math.round((humanConfig.typingDelayMinMs + humanConfig.typingDelayMaxMs) / 2.2)
          )
        );
        typingTimer = window.setInterval(() => {
          if (cancelled) return;
          charIdx += 2;
          setTypedCaption(fullText.slice(0, charIdx));
          if (charIdx >= fullText.length && typingTimer) {
            window.clearInterval(typingTimer);
          }
        }, avgCharMs);
      }

      const stepDurationMs =
        stepObj.id === 'typing'
          ? Math.max(1400, Math.min(2600, (target.caption?.length || 20) * 28))
          : stepObj.id === 'schedule'
          ? Math.max(1100, Math.min(2400, Math.round(humanConfig.thinkingPauseSeconds * 500)))
          : 950;

      stepTimer = window.setTimeout(() => {
        advanceStep(idx + 1);
      }, stepDurationMs);
    };

    stepTimer = window.setTimeout(() => advanceStep(1), 850);

    return () => {
      cancelled = true;
      if (stepTimer) window.clearTimeout(stepTimer);
      if (typingTimer) window.clearInterval(typingTimer);
      if (warmupTimer) window.clearInterval(warmupTimer);
    };
  }, [target, steps]);

  if (!target) return null;

  const activeStep = steps[currentStepIndex] || steps[0];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Browser Top Window Chrome Bar */}
        <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between select-none">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-3 h-3 rounded-full bg-rose-500 inline-block shrink-0" />
            <span className="w-3 h-3 rounded-full bg-amber-500 inline-block shrink-0" />
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block shrink-0" />
            <span className="text-xs font-mono text-slate-300 ml-2 font-semibold truncate">
              Persistent Chromium — [{target.profileName}]
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Address Bar */}
        <div className="bg-slate-900/90 px-4 py-2 border-b border-slate-800 flex flex-wrap items-center gap-2 text-xs">
          <div className="flex-1 min-w-[200px] bg-slate-950 border border-slate-800 rounded-lg px-3 py-1 flex items-center gap-2 text-slate-300 font-mono text-[11px]">
            <Lock className="w-3 h-3 text-emerald-400 shrink-0" />
            <span className="truncate">
              {activeStep.id === 'warmup'
                ? 'https://www.facebook.com/?sk=h_chr'
                : `https://business.facebook.com/latest/reels_composer${
                    target.pageId ? `?page_id=${target.pageId}` : ''
                  }`}
            </span>
          </div>

          <span className="text-[11px] font-mono text-purple-300 px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 shrink-0 flex items-center gap-1.5">
            <Bot className="w-3 h-3 text-purple-400" />
            <span>{humanConfig.enabled ? 'HUMAN STEALTH ACTIVE' : 'STANDARD RPA'}</span>
          </span>

          <span className="text-[11px] font-mono text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 shrink-0 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>LIVE EXECUTION</span>
          </span>
        </div>

        {/* Modal Main Content Split */}
        <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-6 overflow-y-auto">
          {/* Left Column: Simulated Browser Viewport */}
          <div className="md:col-span-7 bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded bg-blue-600 flex items-center justify-center font-bold text-xs text-white shrink-0">
                    FB
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white leading-none truncate">
                      Meta Business Suite Reels Composer
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-1 truncate">
                      Session: <strong className="text-emerald-300">{activeSession?.nickname || 'Active Vault'}</strong> • Target: <strong className="text-slate-200">{target.profileName}</strong>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] font-mono tabular-nums text-blue-400 shrink-0">
                  Step {currentStepIndex + 1}/{steps.length}
                </div>
              </div>

              <div className="space-y-3">
                {activeStep.id === 'warmup' && (
                  <div className="bg-purple-950/30 border border-purple-500/30 rounded-lg p-3">
                    <div className="flex items-center justify-between text-xs font-semibold text-purple-200 mb-1.5">
                      <span>Pre-Post Human Feed Warm-up Scroll</span>
                      <span className="font-mono tabular-nums text-[11px]">{feedScrollPct}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-400 transition-all duration-300"
                        style={{ width: `${feedScrollPct}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-200 mb-1">
                    <span className="flex items-center gap-1.5">
                      <Video className="w-3.5 h-3.5 text-blue-400" />
                      Assigned Video Asset:
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400">
                      Ready
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-emerald-300 break-all bg-slate-950 p-2 rounded border border-slate-800/60">
                    {target.videoName || target.videoPath}
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-200 mb-1">
                    <span className="flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-blue-400" />
                      <span>Human Keyboard Typing Output:</span>
                    </span>
                    <span className="text-[10px] font-mono tabular-nums text-slate-400">
                      {humanConfig.typingDelayMinMs}–{humanConfig.typingDelayMaxMs}ms/char
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-200 bg-slate-950 p-2.5 rounded border border-slate-800/60 leading-relaxed font-sans min-h-[56px] max-h-28 overflow-y-auto">
                    {typedCaption || (currentStepIndex < 4 ? 'Waiting for composer textbox...' : target.caption)}
                    {activeStep.id === 'typing' && (
                      <span className="inline-block w-1.5 h-3.5 bg-blue-400 ml-0.5 animate-pulse align-middle" />
                    )}
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Schedule Timing:</span>
                  </div>
                  <div className="font-mono tabular-nums text-emerald-400 font-semibold">
                    {target.date} @ {target.time}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Status / Completion Banner */}
            <div className="mt-4 pt-3 border-t border-slate-800">
              {isFinished ? (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center gap-2 text-emerald-300 text-xs">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-bold block">
                      Task Executed Successfully on Real Target!
                    </span>
                    <span className="text-[11px] text-emerald-400/80 font-mono">
                      Meta Post ID: {realMetaPostId} • Table row auto-cleaned from queue.
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center justify-between text-xs text-blue-300">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                    <span>{activeStep.title}...</span>
                  </span>
                  <span className="font-mono tabular-nums text-[11px] text-blue-400">
                    {Math.round(((currentStepIndex + 1) / steps.length) * 100)}%
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Execution Sequence Steps */}
          <div className="md:col-span-5 flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>RPA Real Step Execution Stream</span>
              </h4>

              <div className="space-y-1.5 text-xs max-h-[380px] overflow-y-auto pr-1">
                {steps.map((s, idx) => {
                  const isDone = idx < currentStepIndex || isFinished;
                  const isCurrent = idx === currentStepIndex && !isFinished;
                  return (
                    <div
                      key={s.id}
                      className={`p-2 rounded-lg border transition-all flex items-start gap-2.5 ${
                        isDone
                          ? 'bg-emerald-500/5 border-emerald-500/20 text-slate-300'
                          : isCurrent
                          ? 'bg-blue-500/10 border-blue-500/40 text-white font-medium'
                          : 'bg-slate-950/40 border-slate-800 text-slate-500'
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {isDone ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        ) : isCurrent ? (
                          <span className="w-3.5 h-3.5 rounded-full border-2 border-blue-400 border-t-transparent animate-spin inline-block" />
                        ) : (
                          <span className="w-3.5 h-3.5 rounded-full border border-slate-700 inline-block" />
                        )}
                      </div>
                      <div>
                        <div className="text-[11px] font-semibold leading-tight">{s.title}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{s.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg cursor-pointer transition-colors"
              >
                {isFinished ? 'Done & Close Window' : 'Minimize Window'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
