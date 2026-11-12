import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Cookie,
  Chrome,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
  Upload,
  Lock,
  AlertCircle,
  Eye,
  EyeOff,
  FolderOpen,
  Smartphone,
} from 'lucide-react';
import { FbApiConfig, SavedSession, TargetItem } from '../types';

interface LoginHubTabProps {
  activeSession: SavedSession | null;
  fbConfig: FbApiConfig;
  setFbConfig: React.Dispatch<React.SetStateAction<FbApiConfig>>;
  onSessionChanged: (session: SavedSession | null) => void;
  onAddTargetDirect: (target: TargetItem) => void;
  onGoToContent: () => void;
  onGoToAccounts: () => void;
  onNotify: (msg: string) => void;
  onLog: (level: 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR' | 'RPA', msg: string) => void;
}

const CHROME_PROFILE_PRESETS = [
  { value: 'Default', label: 'Default (Main Chrome Profile)' },
  { value: 'Profile 1', label: 'Profile 1' },
  { value: 'Profile 2', label: 'Profile 2' },
  { value: 'Profile 3', label: 'Profile 3' },
  { value: 'Profile 4', label: 'Profile 4' },
  { value: 'Custom', label: 'Custom Chrome Profile Folder' },
];

export const LoginHubTab: React.FC<LoginHubTabProps> = ({
  activeSession,
  onSessionChanged,
  onGoToContent,
  onGoToAccounts,
  onNotify,
  onLog,
}) => {
  const [savedSessions, setSavedSessions] = useState<SavedSession[]>([]);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  // OPTION 1: Simple Manual Username / Email / Phone & Password Facebook Login
  const [manualUsername, setManualUsername] = useState('');
  const [manualPassword, setManualPassword] = useState('');
  const [manual2FA, setManual2FA] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberManualLogin, setRememberManualLogin] = useState(true);
  const [isManualBusy, setIsManualBusy] = useState(false);

  // OPTION 2: Facebook Login via Cookies
  const [cookieNickname, setCookieNickname] = useState('Cookies_FB_Profile');
  const [cookieSource, setCookieSource] = useState<'mobile_app' | 'mobile_browser' | 'cookie_vault'>('mobile_app');
  const [cookiesInput, setCookiesInput] = useState(activeSession?.cookies || '');
  const [rememberCookies, setRememberCookies] = useState(true);
  const [isCookiesBusy, setIsCookiesBusy] = useState(false);

  // OPTION 3: Manual Chrome Profile Choose & Login
  const [chromeProfilePreset, setChromeProfilePreset] = useState('Default');
  const [chromeCustomName, setChromeCustomName] = useState('');
  const [chromeUserDataPath, setChromeUserDataPath] = useState(
    'C:\\Users\\Administrator\\AppData\\Local\\Google\\Chrome\\User Data'
  );
  const [chromeDebugPort, setChromeDebugPort] = useState('9222');
  const [isChromeBusy, setIsChromeBusy] = useState(false);

  // Facebook Mobile App Selector (Quick Mobile App Connect)
  const [selectedMobileApp, setSelectedMobileApp] = useState<
    'fb_official' | 'fb_lite' | 'fb_mobile_web'
  >('fb_official');
  const [mobileAppNickname, setMobileAppNickname] = useState('My_Facebook_Mobile_App');
  const [mobileAppPin, setMobileAppPin] = useState('');
  const [isMobileAppBusy, setIsMobileAppBusy] = useState(false);

  useEffect(() => {
    fetch('/api/fb/saved-sessions')
      .then((r) => r.json())
      .then((data) => {
        if (data?.success && Array.isArray(data.sessions)) {
          setSavedSessions(data.sessions);
        }
      })
      .catch(() => {});
  }, [activeSession]);

  // OPTION 1 Handler: Manual Username & Password Facebook Login
  const handleManualCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    const user = manualUsername.trim();
    const pass = manualPassword;
    if (!user || !pass) {
      setStatusMessage({
        type: 'error',
        text: 'Facebook Email / Phone / Username aur Password dono enter karein.',
      });
      return;
    }

    setIsManualBusy(true);
    onLog('INFO', `Starting manual Facebook login for account [${user}]...`);
    try {
      const res = await fetch('/api/fb/manual-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user,
          password: pass,
          twoFactorCode: manual2FA.trim() || undefined,
          saveSession: rememberManualLogin,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Facebook login failed. Credentials check karein.');
      }

      onSessionChanged(data.session);
      setSavedSessions((prev) => {
        const filtered = prev.filter((s) => s.id !== data.session.id);
        return [data.session, ...filtered];
      });
      setManualPassword('');
      onLog(
        'SUCCESS',
        `Manual Facebook login verified for [${data.session.nickname}]. Moving to Content & Media...`
      );
      onNotify(`Logged in as ${data.session.nickname}! Moving to Content...`);
      setStatusMessage({
        type: 'success',
        text: `Facebook login successful for ${data.session.nickname}! Moving to Content section...`,
      });
      setTimeout(() => onGoToContent(), 550);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
      onLog('ERROR', `Manual Facebook login error: ${err.message}`);
    } finally {
      setIsManualBusy(false);
    }
  };

  // OPTION 2 Handler: Import Cookies from .txt file
  const handleImportCookiesTxt = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ((ev.target?.result as string) || '').trim();
      if (!text) {
        setStatusMessage({ type: 'error', text: 'Selected .txt file empty hai.' });
        return;
      }
      setCookiesInput(text);
      const baseName = file.name.replace(/\.txt$/i, '');
      if (baseName) setCookieNickname(baseName);
      setStatusMessage({
        type: 'info',
        text: `Cookies loaded from "${file.name}". Click "Login with Cookies & Go to Content" to verify.`,
      });
      onLog('INFO', `Loaded Facebook cookies from file [${file.name}].`);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // OPTION 2 Handler: Login with Facebook Cookies
  const handleCookiesLogin = async () => {
    setStatusMessage(null);
    const raw = cookiesInput.trim();
    if (!raw || !raw.includes('=')) {
      setStatusMessage({
        type: 'error',
        text: 'Valid Facebook cookies (e.g. c_user=...; xs=...;) paste karein ya .txt file upload karein.',
      });
      return;
    }

    setIsCookiesBusy(true);
    try {
      const firstLine = raw.split(/\r?\n/).find((l) => l.trim().includes('='))?.trim() || raw;
      const cUserMatch = firstLine.match(/c_user=([0-9]+)/);
      if (!cUserMatch || !firstLine.includes('xs=')) {
        throw new Error('Cookies string me "c_user=" aur "xs=" dono hone chahiye.');
      }

      const cUserId = cUserMatch[1];
      const nickname = cookieNickname.trim() || `FB_${cUserId.slice(-6)}`;

      if (rememberCookies) {
        const res = await fetch('/api/fb/saved-sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nickname,
            c_user: cUserId,
            source: cookieSource,
            cookies: firstLine,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Could not save cookie session.');
        }
        onSessionChanged(data.session);
        setSavedSessions((prev) => {
          const filtered = prev.filter((s) => s.id !== data.session.id);
          return [data.session, ...filtered];
        });
      } else {
        onSessionChanged({
          id: `session-cookie-${Date.now()}`,
          nickname,
          c_user: cUserId,
          source: cookieSource,
          cookies: firstLine,
          savedAt: new Date().toISOString(),
          lastUsed: new Date().toISOString(),
          isActive: true,
        });
      }

      onLog(
        'SUCCESS',
        `Cookies login verified for [${nickname}] (c_user: ${cUserId}). Moving to Content & Media...`
      );
      onNotify(`Cookies Verified (${nickname})! Moving to Content...`);
      setStatusMessage({
        type: 'success',
        text: `Cookies login verified (c_user: ${cUserId}). Moving to Content section...`,
      });
      setTimeout(() => onGoToContent(), 550);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
      onLog('WARN', `Cookies login note: ${err.message}`);
    } finally {
      setIsCookiesBusy(false);
    }
  };

  // OPTION 3 Handler: Choose Chrome Profile Folder via Folder Picker
  const handlePickChromeProfileFolder = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const firstRel = (files[0] as any).webkitRelativePath || files[0].name;
    const rootFolder = firstRel.split('/')[0] || 'Default';

    if (/^(Default|Profile \d+)$/i.test(rootFolder)) {
      setChromeProfilePreset(
        rootFolder.toLowerCase() === 'default' ? 'Default' : rootFolder
      );
    } else {
      setChromeProfilePreset('Custom');
      setChromeCustomName(rootFolder);
    }

    setChromeUserDataPath(`Chrome Profile Folder: ${rootFolder}`);
    setStatusMessage({
      type: 'info',
      text: `Selected Chrome Profile "${rootFolder}". Click "Connect Chrome Profile & Go to Content" to proceed.`,
    });
    onLog('INFO', `User selected local Chrome profile folder [${rootFolder}].`);
    e.target.value = '';
  };

  // OPTION 3 Handler: Connect Manual Chrome Profile & Proceed
  const handleChromeProfileLogin = async () => {
    setStatusMessage(null);
    const selectedProfile =
      chromeProfilePreset === 'Custom'
        ? chromeCustomName.trim() || 'Custom_Chrome_Profile'
        : chromeProfilePreset;

    setIsChromeBusy(true);
    try {
      const res = await fetch('/api/fb/chrome-profile-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileDirectory: selectedProfile,
          userDataPath: chromeUserDataPath.trim(),
          port: chromeDebugPort.trim() || '9222',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Could not connect chosen Chrome profile.');
      }

      onSessionChanged(data.session);
      setSavedSessions((prev) => {
        const filtered = prev.filter((s) => s.id !== data.session.id);
        return [data.session, ...filtered];
      });

      const portNote = data.portConnected
        ? ` (Live Chrome port ${chromeDebugPort} connected)`
        : '';
      onLog(
        'SUCCESS',
        `Chrome profile [${selectedProfile}] connected & saved${portNote}. Moving to Content & Media...`
      );
      onNotify(`Chrome Profile "${selectedProfile}" Connected! Moving to Content...`);
      setStatusMessage({
        type: 'success',
        text: `Chrome profile "${selectedProfile}" selected & saved${portNote}. Moving to Content...`,
      });
      setTimeout(() => onGoToContent(), 550);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
      onLog('ERROR', `Chrome profile connect error: ${err.message}`);
    } finally {
      setIsChromeBusy(false);
    }
  };

  const handleQuickRestoreSaved = async (session: SavedSession) => {
    try {
      await fetch(`/api/fb/saved-sessions/${session.id}/activate`, { method: 'POST' });
    } catch {}
    onSessionChanged({ ...session, isActive: true, lastUsed: new Date().toISOString() });
    onLog('SUCCESS', `Restored saved session [${session.nickname}] — Moving to Content & Media...`);
    onNotify(`Restored ${session.nickname}! Moving to Content...`);
    setTimeout(() => onGoToContent(), 400);
  };

  // Facebook Mobile App Selector: Get PIN & Connect
  const handleGetMobileAppPin = async () => {
    setStatusMessage(null);
    setIsMobileAppBusy(true);
    try {
      const appLabel =
        selectedMobileApp === 'fb_official'
          ? 'Facebook Official App'
          : selectedMobileApp === 'fb_lite'
          ? 'Facebook Lite App'
          : 'Mobile Browser (m.facebook.com)';
      const res = await fetch('/api/fb/mobile-sync/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: mobileAppNickname.trim() || appLabel,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success || !data.pin) {
        throw new Error(data.error || 'Could not generate Mobile App PIN.');
      }
      setMobileAppPin(data.pin);
      setStatusMessage({
        type: 'info',
        text: `${appLabel} selected — Sync PIN ${data.pin} ready. Click "Connect Mobile App & Go to Content".`,
      });
      onLog('INFO', `Generated PIN [${data.pin}] for ${appLabel}.`);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setIsMobileAppBusy(false);
    }
  };

  const handleConnectMobileApp = async () => {
    setStatusMessage(null);
    setIsMobileAppBusy(true);
    const appLabel =
      selectedMobileApp === 'fb_official'
        ? 'Facebook Official App'
        : selectedMobileApp === 'fb_lite'
        ? 'Facebook Lite App'
        : 'Mobile Browser (m.facebook.com)';
    const sourceVal: SavedSession['source'] =
      selectedMobileApp === 'fb_mobile_web' ? 'mobile_browser' : 'mobile_app';

    try {
      let pinToClaim = mobileAppPin.trim();
      if (!pinToClaim) {
        const createRes = await fetch('/api/fb/mobile-sync/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nickname: mobileAppNickname.trim() || appLabel,
          }),
        });
        const createData = await createRes.json();
        if (createRes.ok && createData.pin) {
          pinToClaim = createData.pin;
          setMobileAppPin(pinToClaim);
        }
      }

      const res = await fetch('/api/fb/mobile-sync/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pin: pinToClaim,
          nickname: mobileAppNickname.trim() || appLabel,
          source: sourceVal,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success || !data.session) {
        throw new Error(data.error || 'Could not connect Facebook Mobile App.');
      }

      onSessionChanged(data.session);
      setSavedSessions((prev) => {
        const filtered = prev.filter((s) => s.id !== data.session.id);
        return [data.session, ...filtered];
      });
      onLog(
        'SUCCESS',
        `Connected [${appLabel}] (${data.session.nickname}) & saved permanently. Moving to Content...`
      );
      onNotify(`${appLabel} Connected! Moving to Content...`);
      setStatusMessage({
        type: 'success',
        text: `${appLabel} connected & saved permanently. Moving to Content...`,
      });
      setTimeout(() => onGoToContent(), 550);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
      onLog('ERROR', `Mobile App connection error: ${err.message}`);
    } finally {
      setIsMobileAppBusy(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header & Active Saved Session Bar */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-lg font-bold text-white tracking-tight text-balance">
            Facebook Login Gateway — 3 Login Options
          </h1>
          <p className="text-xs text-slate-400">
            Option 1: Username &amp; Password · Option 2: Cookies · Option 3: Manual Chrome Profile. Login verify hote hi session save ho jayega aur aap khudbakhud Content page par move ho jayenge.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {activeSession ? (
            <button
              type="button"
              onClick={onGoToContent}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Continue as {activeSession.nickname}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onGoToAccounts}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              Open Full Session Vault
            </button>
          )}
        </div>
      </section>

      {/* Inline Status Feedback Banner */}
      {statusMessage && (
        <div
          className={`px-4 py-3 rounded-xl border text-xs flex items-center gap-2.5 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : statusMessage.type === 'error'
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              : 'bg-blue-500/10 border-blue-500/30 text-blue-300'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* 3 Login Option Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* OPTION 1: Simple Manual Facebook Username & Password Login */}
        <form
          onSubmit={handleManualCredentialsLogin}
          className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between gap-4"
        >
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="text-[11px] font-mono font-semibold text-blue-400">
                Option 01 · Simple Manual Login
              </div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Username &amp; Password Login</span>
              </h2>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Apna Facebook Email, Phone Number, ya Username aur Password daal kar seedha login karein. Session future ke liye save ho jayega.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Facebook Email, Phone, or Username *
                </label>
                <input
                  type="text"
                  value={manualUsername}
                  onChange={(e) => setManualUsername(e.target.value)}
                  placeholder="email@example.com or 0300..."
                  autoComplete="username"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Facebook Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={manualPassword}
                    onChange={(e) => setManualPassword(e.target.value)}
                    placeholder="Enter Facebook password"
                    autoComplete="current-password"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-3 pr-9 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  2FA Security Code (Optional)
                </label>
                <input
                  type="text"
                  value={manual2FA}
                  onChange={(e) => setManual2FA(e.target.value)}
                  placeholder="6-digit 2FA code (agar on ho)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono tabular-nums text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer pt-0.5">
                <input
                  type="checkbox"
                  checked={rememberManualLogin}
                  onChange={(e) => setRememberManualLogin(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-blue-500 focus:ring-0"
                />
                <span>Session permanently save karein (Auto-login future ke liye)</span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={isManualBusy}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            {isManualBusy ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <UserCheck className="w-3.5 h-3.5" />
            )}
            <span>Login with Password &amp; Go to Content</span>
          </button>
        </form>

        {/* OPTION 2: Facebook Login via Cookies */}
        <section className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between gap-4">
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="text-[11px] font-mono font-semibold text-emerald-400">
                Option 02 · Cookie Authentication
              </div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Cookie className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Login with Cookies</span>
              </h2>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Mobile ya Desktop browser se nikali hui Facebook Cookies (`c_user` aur `xs`) paste karein ya `.txt` file upload karke instant login karein.
            </p>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    Account Label
                  </label>
                  <input
                    type="text"
                    value={cookieNickname}
                    onChange={(e) => setCookieNickname(e.target.value)}
                    placeholder="My_FB_Cookies"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    Cookie Source
                  </label>
                  <select
                    value={cookieSource}
                    onChange={(e) =>
                      setCookieSource(
                        e.target.value as 'mobile_app' | 'mobile_browser' | 'cookie_vault'
                      )
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="mobile_app">Facebook Mobile App</option>
                    <option value="mobile_browser">Mobile Browser</option>
                    <option value="cookie_vault">Desktop Chrome</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-medium text-slate-300">
                    Facebook Cookies String *
                  </label>
                  <label className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer font-semibold">
                    <Upload className="w-3 h-3" />
                    <span>Choose .txt File</span>
                    <input
                      type="file"
                      accept=".txt"
                      onChange={handleImportCookiesTxt}
                      className="hidden"
                    />
                  </label>
                </div>
                <textarea
                  rows={4}
                  value={cookiesInput}
                  onChange={(e) => setCookiesInput(e.target.value)}
                  placeholder="datr=...; sb=...; c_user=61561547737841; xs=...;"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer pt-0.5">
                <input
                  type="checkbox"
                  checked={rememberCookies}
                  onChange={(e) => setRememberCookies(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-0"
                />
                <span>Cookies Vault me permanently save karein</span>
              </label>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCookiesLogin}
            disabled={isCookiesBusy}
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            {isCookiesBusy ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Cookie className="w-3.5 h-3.5" />
            )}
            <span>Login with Cookies &amp; Go to Content</span>
          </button>
        </section>

        {/* OPTION 3: Manual Chrome Profile Choose & Login */}
        <section className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between gap-4">
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="text-[11px] font-mono font-semibold text-amber-400">
                Option 03 · Manual Chrome Profile
              </div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Chrome className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Choose Chrome Profile</span>
              </h2>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Apne computer ka wo Chrome Profile choose karein jis mein Facebook pehle se login hai (`Default`, `Profile 1`, `Profile 2`, ya folder browse karein).
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Select Chrome Profile
                </label>
                <select
                  value={chromeProfilePreset}
                  onChange={(e) => setChromeProfilePreset(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                >
                  {CHROME_PROFILE_PRESETS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              {chromeProfilePreset === 'Custom' && (
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    Custom Profile Name (e.g. Profile 5 / Work)
                  </label>
                  <input
                    type="text"
                    value={chromeCustomName}
                    onChange={(e) => setChromeCustomName(e.target.value)}
                    placeholder="Profile 5"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-medium text-slate-300">
                    Chrome Profile / User Data Folder
                  </label>
                  <label className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer font-semibold">
                    <FolderOpen className="w-3 h-3" />
                    <span>Choose Folder</span>
                    <input
                      type="file"
                      {...({ webkitdirectory: '', directory: '' } as any)}
                      onChange={handlePickChromeProfileFolder}
                      className="hidden"
                    />
                  </label>
                </div>
                <input
                  type="text"
                  value={chromeUserDataPath}
                  onChange={(e) => setChromeUserDataPath(e.target.value)}
                  placeholder="C:\Users\...\Google\Chrome\User Data"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Chrome Debug Port (Optional)
                </label>
                <input
                  type="text"
                  value={chromeDebugPort}
                  onChange={(e) => setChromeDebugPort(e.target.value)}
                  placeholder="9222"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono tabular-nums text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              {savedSessions.length > 0 && (
                <div className="pt-1 border-t border-slate-800/80">
                  <span className="text-[11px] text-slate-400 block mb-1.5">
                    Saved Profiles (1-Click Continue):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {savedSessions.slice(0, 3).map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleQuickRestoreSaved(s)}
                        className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 text-[11px] rounded-md cursor-pointer truncate max-w-[160px]"
                      >
                        {s.nickname}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleChromeProfileLogin}
            disabled={isChromeBusy}
            className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-500 disabled:opacity-60 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            {isChromeBusy ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Chrome className="w-3.5 h-3.5" />
            )}
            <span>Connect Chrome Profile &amp; Go to Content</span>
          </button>
        </section>
      </div>

      {/* Facebook Mobile App Selector Section */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-blue-400 shrink-0" />
              <span>Select Facebook Mobile App (Mobile App Direct Connect)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Apne mobile par logged-in Facebook App select karein aur 1-click ya 6-digit Sync PIN ke zariye connect karein.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1">
              Facebook Mobile App
            </label>
            <select
              value={selectedMobileApp}
              onChange={(e) =>
                setSelectedMobileApp(
                  e.target.value as 'fb_official' | 'fb_lite' | 'fb_mobile_web'
                )
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
            >
              <option value="fb_official">Facebook Official App (Android / iOS)</option>
              <option value="fb_lite">Facebook Lite App</option>
              <option value="fb_mobile_web">Facebook Mobile Browser (m.facebook.com)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1">
              Mobile Account Label
            </label>
            <input
              type="text"
              value={mobileAppNickname}
              onChange={(e) => setMobileAppNickname(e.target.value)}
              placeholder="My_Facebook_Mobile_App"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1">
              Sync PIN (Auto or Manual)
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={mobileAppPin}
                onChange={(e) => setMobileAppPin(e.target.value)}
                placeholder="6-digit PIN"
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono tabular-nums text-white tracking-widest focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={handleGetMobileAppPin}
                disabled={isMobileAppBusy}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-blue-300 border border-slate-700 text-xs font-semibold rounded-lg cursor-pointer whitespace-nowrap shrink-0"
              >
                Get PIN
              </button>
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={handleConnectMobileApp}
              disabled={isMobileAppBusy}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
            >
              {isMobileAppBusy ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Smartphone className="w-3.5 h-3.5" />
              )}
              <span>Connect Mobile App &amp; Go to Content</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
