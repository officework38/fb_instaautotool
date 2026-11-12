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
  ExternalLink,
  KeyRound,
} from 'lucide-react';
import { FbApiConfig, SavedSession, TargetItem } from '../types';
import { SAMPLE_VIDEOS } from '../data/initialData';

interface LoginHubTabProps {
  activeSession: SavedSession | null;
  fbConfig: FbApiConfig;
  setFbConfig: React.Dispatch<React.SetStateAction<FbApiConfig>>;
  onSessionChanged: (session: SavedSession | null) => void;
  onAddTargetDirect: (target: TargetItem) => void;
  onAttachPagesDirect: (targets: TargetItem[]) => void;
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
  fbConfig,
  setFbConfig,
  onSessionChanged,
  onAttachPagesDirect,
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

  // OPTION 1: Real Facebook ID / Email / Phone & Password Login
  const [manualUsername, setManualUsername] = useState('');
  const [manualPassword, setManualPassword] = useState('');
  const [manual2FA, setManual2FA] = useState('');
  const [needs2FAHighlight, setNeeds2FAHighlight] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberManualLogin, setRememberManualLogin] = useState(true);
  const [isManualBusy, setIsManualBusy] = useState(false);

  // OPTION 2: Real Live-Verified Facebook Cookies Login
  const [cookieNickname, setCookieNickname] = useState('');
  const [cookieSource, setCookieSource] = useState<'mobile_app' | 'mobile_browser' | 'cookie_vault'>('cookie_vault');
  const [cookiesInput, setCookiesInput] = useState('');
  const [rememberCookies, setRememberCookies] = useState(true);
  const [isCookiesBusy, setIsCookiesBusy] = useState(false);

  // OPTION 3: Real Chrome Profile Choose & CDP/Folder Verification
  const [chromeProfilePreset, setChromeProfilePreset] = useState('Default');
  const [chromeCustomName, setChromeCustomName] = useState('');
  const [chromeUserDataPath, setChromeUserDataPath] = useState(
    'C:\\Users\\Administrator\\AppData\\Local\\Google\\Chrome\\User Data'
  );
  const [chromeDebugPort, setChromeDebugPort] = useState('9222');
  const [chromeProfileEmailHint, setChromeProfileEmailHint] = useState<string | null>(null);
  const [chromeUploadedCookiesText, setChromeUploadedCookiesText] = useState<string | null>(null);
  const [chromeUploadedDbBase64, setChromeUploadedDbBase64] = useState<string | null>(null);
  const [isChromeBusy, setIsChromeBusy] = useState(false);

  // Facebook Official App Selector (Real OAuth / Access Token / Verified Session)
  const [selectedMobileApp, setSelectedMobileApp] = useState<
    'fb_official' | 'fb_lite' | 'fb_mobile_web'
  >('fb_official');
  const [officialAppId, setOfficialAppId] = useState(fbConfig.appId || '');
  const [officialAccessToken, setOfficialAccessToken] = useState(fbConfig.accessToken || '');
  const [mobileAppNickname, setMobileAppNickname] = useState('Facebook Official App');
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

  // Helper: Map real fetched Facebook Pages into Content TargetItem rows (+3m slot) and attach
  const buildAndAttachPages = (
    pages: Array<{ id: string; name: string; link?: string; pageToken?: string }>
  ) => {
    if (!pages || pages.length === 0) return 0;

    const dt = new Date(Date.now() + 3 * 60 * 1000);
    const yyyy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const dd = String(dt.getDate()).padStart(2, '0');
    const hh = String(dt.getHours()).padStart(2, '0');
    const min = String(dt.getMinutes()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    const timeStr = `${hh}:${min}`;

    const mappedTargets: TargetItem[] = pages.map((p, idx) => {
      const sample = SAMPLE_VIDEOS[idx % SAMPLE_VIDEOS.length];
      return {
        id: `target-fb-${Date.now()}-${p.id || idx}`,
        profileName: p.name,
        type: 'Page',
        pageId: p.id,
        pageToken: p.pageToken,
        pageUrl: p.link || `https://facebook.com/${p.id}`,
        videoPath: sample.path,
        videoName: sample.name,
        mediaType: 'video',
        caption: `Trending update on ${p.name}!`,
        date: dateStr,
        time: timeStr,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
    });

    onAttachPagesDirect(mappedTargets);
    return mappedTargets.length;
  };

  // Helper: Open native installed Facebook Official App on mobile device without window.open
  const launchInstalledFacebookApp = (appType: 'fb_official' | 'fb_lite' | 'fb_mobile_web', oauthFallbackUrl?: string) => {
    try {
      const ua = navigator.userAgent || '';
      const isAndroid = /Android/i.test(ua);
      const isIOS = /iPhone|iPad|iPod/i.test(ua);
      const fallback = encodeURIComponent(oauthFallbackUrl || 'https://m.facebook.com/');
      let launchUrl = oauthFallbackUrl || '';

      if (appType === 'fb_mobile_web' && oauthFallbackUrl) {
        launchUrl = oauthFallbackUrl;
      } else if (isAndroid) {
        const pkg = appType === 'fb_lite' ? 'com.facebook.lite' : 'com.facebook.katana';
        launchUrl = `intent://feed/#Intent;package=${pkg};scheme=fb;S.browser_fallback_url=${fallback};end`;
      } else if (isIOS) {
        launchUrl = 'fb://feed/';
      }

      if (launchUrl) {
        const a = document.createElement('a');
        a.href = launchUrl;
        a.target = '_top';
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        onLog('INFO', `Launched Facebook app URI [${appType}].`);
      }
    } catch {}
  };

  // OPTION 1 Handler: Real Live Facebook ID / Email / Phone & Password Login
  const handleManualCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);
    setNeeds2FAHighlight(false);

    const user = manualUsername.trim();
    const pass = manualPassword;
    if (!user || !pass) {
      setStatusMessage({
        type: 'error',
        text: 'Apna original Facebook Email / Phone / ID aur Password enter karein.',
      });
      return;
    }

    setIsManualBusy(true);
    onLog('INFO', `Logging into live facebook.com for [${user}]...`);
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
        if (data?.requires2FA) {
          setNeeds2FAHighlight(true);
        }
        throw new Error(data.error || 'Facebook login verify nahi ho saka.');
      }

      onSessionChanged(data.session);
      setSavedSessions((prev) => [
        data.session,
        ...prev.filter((s) => s.id !== data.session.id),
      ]);
      setManualPassword('');
      setManual2FA('');

      const attachedCount = Array.isArray(data.pages) ? buildAndAttachPages(data.pages) : 0;
      onLog(
        'SUCCESS',
        `Verified real Facebook login for [${data.session.nickname}] (ID: ${data.session.c_user}). Fetched ${attachedCount} real Page(s).`
      );
      onNotify(`Verified ${data.session.nickname} (${attachedCount} Page(s))!`);
      setStatusMessage({
        type: 'success',
        text: `Original Facebook login verified (${data.session.nickname}) · ${attachedCount} Page(s) fetched. Moving to Content...`,
      });
      setTimeout(() => onGoToContent(), 600);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
      onLog('ERROR', `Facebook login rejected: ${err.message}`);
    } finally {
      setIsManualBusy(false);
    }
  };

  // OPTION 2 Handler: Import Cookies (.txt or .json)
  const handleImportCookiesTxt = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ((ev.target?.result as string) || '').trim();
      if (!text) {
        setStatusMessage({ type: 'error', text: 'Selected file empty hai.' });
        return;
      }
      setCookiesInput(text);
      const baseName = file.name.replace(/\.(txt|json)$/i, '');
      if (baseName && !cookieNickname) setCookieNickname(baseName);
      setStatusMessage({
        type: 'info',
        text: `Cookies loaded from "${file.name}". Click "Verify Cookies on Facebook & Go to Content".`,
      });
      onLog('INFO', `Loaded cookies file [${file.name}] for live verification.`);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // OPTION 2 Handler: Real Live Verification of Facebook Cookies
  const handleCookiesLogin = async () => {
    setStatusMessage(null);
    const raw = cookiesInput.trim();
    if (!raw) {
      setStatusMessage({
        type: 'error',
        text: 'Valid Facebook cookies (semicolon string, JSON array, ya Netscape .txt) paste karein.',
      });
      return;
    }

    setIsCookiesBusy(true);
    onLog('INFO', 'Verifying Facebook cookies live against facebook.com...');
    try {
      const res = await fetch('/api/fb/cookies-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cookies: raw,
          nickname: cookieNickname.trim() || undefined,
          source: cookieSource,
          saveSession: rememberCookies,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success || !data.session) {
        throw new Error(data.error || 'Facebook ne cookies reject kar di hain.');
      }

      onSessionChanged(data.session);
      setSavedSessions((prev) => [
        data.session,
        ...prev.filter((s) => s.id !== data.session.id),
      ]);

      const attachedCount = Array.isArray(data.pages) ? buildAndAttachPages(data.pages) : 0;
      onLog(
        'SUCCESS',
        `Live cookies verified for [${data.session.nickname}] (ID: ${data.session.c_user}). Fetched ${attachedCount} real Page(s).`
      );
      onNotify(`Cookies Verified (${data.session.nickname}) · ${attachedCount} Page(s)!`);
      setStatusMessage({
        type: 'success',
        text: `Live Facebook cookies verified (${data.session.nickname}) · ${attachedCount} Page(s) attached. Moving to Content...`,
      });
      setTimeout(() => onGoToContent(), 600);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
      onLog('WARN', `Cookie verification rejected: ${err.message}`);
    } finally {
      setIsCookiesBusy(false);
    }
  };

  // OPTION 3 Handler: Pick Chrome Profile Folder and extract Preferences + Cookies/export if readable
  const handlePickChromeProfileFolder = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    const firstRel = (fileList[0] as any).webkitRelativePath || fileList[0].name;
    const rootFolder = firstRel.split('/')[0] || 'Default';

    if (/^(Default|Profile \d+)$/i.test(rootFolder)) {
      setChromeProfilePreset(
        rootFolder.toLowerCase() === 'default' ? 'Default' : rootFolder
      );
    } else {
      setChromeProfilePreset('Custom');
      setChromeCustomName(rootFolder);
    }
    setChromeUserDataPath(`Chrome Profile: ${rootFolder}`);

    setChromeProfileEmailHint(null);
    setChromeUploadedCookiesText(null);
    setChromeUploadedDbBase64(null);

    // Inspect Preferences JSON inside picked Chrome folder for real account name/email
    const prefsFile = fileList.find((f) => {
      const rel = ((f as any).webkitRelativePath || f.name).replace(/\\/g, '/');
      return rel.endsWith('/Preferences') || f.name === 'Preferences';
    });
    if (prefsFile && prefsFile.size < 2 * 1024 * 1024) {
      try {
        const text = await prefsFile.text();
        const parsed = JSON.parse(text);
        const acct = parsed?.account_info?.[0];
        const profileName = parsed?.profile?.name;
        const label = acct?.email || acct?.full_name || profileName;
        if (label) setChromeProfileEmailHint(String(label));
      } catch {}
    }

    // Look for plain cookie exports inside picked folder first
    const exportFile = fileList.find((f) => /\.(txt|json)$/i.test(f.name) && /cookie/i.test(f.name));
    if (exportFile && exportFile.size < 2 * 1024 * 1024) {
      try {
        const txt = await exportFile.text();
        if (txt.includes('c_user') && txt.includes('xs')) {
          setChromeUploadedCookiesText(txt);
        }
      } catch {}
    }

    // Read Chrome SQLite Cookies DB if under 8MB
    const cookiesDbFile = fileList.find((f) => {
      const rel = ((f as any).webkitRelativePath || f.name).replace(/\\/g, '/');
      return rel.endsWith('/Network/Cookies') || rel.endsWith('/Cookies') || f.name === 'Cookies';
    });
    if (cookiesDbFile && cookiesDbFile.size > 0 && cookiesDbFile.size <= 8 * 1024 * 1024) {
      try {
        const buf = await cookiesDbFile.arrayBuffer();
        const bytes = new Uint8Array(buf);
        let binary = '';
        const chunk = 0x8000;
        for (let i = 0; i < bytes.length; i += chunk) {
          binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
        }
        setChromeUploadedDbBase64(btoa(binary));
      } catch {}
    }

    setStatusMessage({
      type: 'info',
      text: `Selected Chrome Profile "${rootFolder}". Click "Verify Chrome Profile & Go to Content" to validate live Facebook login.`,
    });
    onLog('INFO', `Inspected Chrome profile folder [${rootFolder}].`);
    e.target.value = '';
  };

  // OPTION 3 Handler: Verify Real Chrome Profile Session (CDP Port 9222 / Unencrypted Cookies)
  const handleChromeProfileLogin = async () => {
    setStatusMessage(null);
    const selectedProfile =
      chromeProfilePreset === 'Custom'
        ? chromeCustomName.trim() || 'Custom_Profile'
        : chromeProfilePreset;

    setIsChromeBusy(true);
    onLog('INFO', `Checking live Chrome Profile [${selectedProfile}] for active Facebook login...`);
    try {
      const res = await fetch('/api/fb/chrome-profile-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileDirectory: selectedProfile,
          userDataPath: chromeUserDataPath.trim(),
          port: chromeDebugPort.trim() || '9222',
          uploadedCookiesText: chromeUploadedCookiesText || undefined,
          uploadedCookiesDbBase64: chromeUploadedDbBase64 || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success || !data.session) {
        throw new Error(
          data.error || 'Selected Chrome profile me verified Facebook login nahi mili.'
        );
      }

      onSessionChanged(data.session);
      setSavedSessions((prev) => [
        data.session,
        ...prev.filter((s) => s.id !== data.session.id),
      ]);

      const attachedCount = Array.isArray(data.pages) ? buildAndAttachPages(data.pages) : 0;
      onLog(
        'SUCCESS',
        `Chrome Profile [${selectedProfile}] verified (${data.session.nickname}) · ${attachedCount} real Page(s) fetched.`
      );
      onNotify(`Chrome Profile Verified · ${attachedCount} Page(s) Attached!`);
      setStatusMessage({
        type: 'success',
        text: `Chrome profile verified (${data.session.nickname}) · ${attachedCount} Page(s) attached. Moving to Content...`,
      });
      setTimeout(() => onGoToContent(), 600);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
      onLog('WARN', `Chrome profile check: ${err.message}`);
    } finally {
      setIsChromeBusy(false);
    }
  };

  // Restore saved real session & verify/fetch its real pages
  const handleQuickRestoreSaved = async (session: SavedSession) => {
    setStatusMessage({ type: 'info', text: `Verifying saved session "${session.nickname}"...` });
    try {
      await fetch(`/api/fb/saved-sessions/${session.id}/activate`, { method: 'POST' });
    } catch {}

    onSessionChanged({ ...session, isActive: true, lastUsed: new Date().toISOString() });
    await handleConnectMobileApp('fb_official', false, session.cookies, session.accessToken);
  };

  // OFFICIAL APP HANDLER 1: Trigger Real Facebook Official OAuth Dialog (App Links / Mobile App / Web)
  const handleOfficialFacebookOAuth = () => {
    setStatusMessage(null);
    const cleanAppId = officialAppId.trim() || fbConfig.appId.trim();
    if (!cleanAppId || !/^\d{8,}$/.test(cleanAppId)) {
      setStatusMessage({
        type: 'error',
        text: 'Official Facebook OAuth open karne ke liye valid numeric Meta App ID enter karein (ya neeche apna real User Access Token paste karein / Option 1-2 se login verify karein).',
      });
      return;
    }

    setFbConfig((prev) => ({ ...prev, appId: cleanAppId }));
    const redirectUri = `${window.location.origin}${window.location.pathname}`;
    const oauthUrl = `https://m.facebook.com/v19.0/dialog/oauth?client_id=${encodeURIComponent(
      cleanAppId
    )}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=token&scope=pages_show_list,pages_read_engagement,pages_manage_posts,public_profile`;

    onLog('INFO', `Launching real Facebook Official OAuth dialog (App ID: ${cleanAppId})...`);
    launchInstalledFacebookApp(selectedMobileApp, oauthUrl);
    window.location.assign(oauthUrl);
  };

  // OFFICIAL APP HANDLER 2: Open Official Mobile App + Verify Real Token / Real Active Session & Fetch Real Pages
  const handleConnectMobileApp = async (
    overrideApp?: 'fb_official' | 'fb_lite' | 'fb_mobile_web',
    launchNative = true,
    overrideCookies?: string,
    overrideToken?: string
  ) => {
    const activeApp = overrideApp || selectedMobileApp;
    setStatusMessage(null);
    setIsMobileAppBusy(true);

    const appLabel =
      activeApp === 'fb_official'
        ? 'Facebook Official App'
        : activeApp === 'fb_lite'
        ? 'Facebook Lite App'
        : 'Mobile Browser (m.facebook.com)';
    const appPackage =
      activeApp === 'fb_official'
        ? 'com.facebook.katana'
        : activeApp === 'fb_lite'
        ? 'com.facebook.lite'
        : 'm.facebook.com';

    const tokenToUse = (overrideToken ?? officialAccessToken.trim()) || activeSession?.accessToken || '';
    const cookiesToUse = (overrideCookies ?? activeSession?.cookies) || '';

    if (launchNative && (tokenToUse || cookiesToUse)) {
      launchInstalledFacebookApp(activeApp);
    }

    try {
      const res = await fetch('/api/fb/mobile-app/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appType: activeApp,
          appPackage,
          appLabel,
          nickname: mobileAppNickname.trim() || appLabel,
          pin: mobileAppPin.trim() || undefined,
          accessToken: tokenToUse || undefined,
          cookies: cookiesToUse || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success || !data.session) {
        if (launchNative) {
          // Still open installed FB app on mobile so user can login/get session if desired
          launchInstalledFacebookApp(activeApp);
        }
        throw new Error(
          data.error || 'Facebook Official App par abhi koi original login verified nahi hai.'
        );
      }

      onSessionChanged(data.session);
      setSavedSessions((prev) => [
        data.session,
        ...prev.filter((s) => s.id !== data.session.id),
      ]);
      if (tokenToUse) {
        setFbConfig((prev) => ({ ...prev, accessToken: tokenToUse, isValid: true }));
      }

      const attachedCount = Array.isArray(data.pages) ? buildAndAttachPages(data.pages) : 0;
      onLog(
        'SUCCESS',
        `Verified [${appLabel}] (${data.session.nickname} · ID: ${data.session.c_user}). Fetched ${attachedCount} REAL Page(s)!`
      );
      onNotify(`${data.session.nickname} Verified · ${attachedCount} Real Page(s)!`);
      setStatusMessage({
        type: 'success',
        text: `Original Facebook App verified (${data.session.nickname}) · ${attachedCount} REAL Page(s) Content page par attach ho gaye hain.`,
      });
      setTimeout(() => onGoToContent(), 600);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
      onLog('WARN', `Facebook Official App verification: ${err.message}`);
    } finally {
      setIsMobileAppBusy(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header & Active Verified Session Bar */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-lg font-bold text-white tracking-tight text-balance">
            Facebook Original Login Gateway — Live Account &amp; Page Verification
          </h1>
          <p className="text-xs text-slate-400">
            Option 1: Original FB ID &amp; Password · Option 2: Live Cookies Verification · Option 3: Real Chrome Profile (Port 9222 / Profile DB) · Official Facebook App OAuth/Token. Sirf verified account par hi Pages fetch hokar Content page par aayenge.
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

      {/* 3 Original Login Option Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* OPTION 1: Real Facebook Username / Email / Phone & Password Login */}
        <form
          onSubmit={handleManualCredentialsLogin}
          className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between gap-4"
        >
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="text-[11px] font-mono font-semibold text-blue-400">
                Option 01 · Live Facebook Auth
              </div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Original ID &amp; Password Login</span>
              </h2>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Real `facebook.com` par direct verify hota hai. Agar ID, password, ya 2FA ghalat hoga to Facebook ka real error aayega; verify hone par real Pages fetch honge.
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
                    placeholder="Enter original Facebook password"
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
                  2FA Security Code {needs2FAHighlight ? '(Required by Facebook)' : '(If Enabled)'}
                </label>
                <input
                  type="text"
                  value={manual2FA}
                  onChange={(e) => setManual2FA(e.target.value)}
                  placeholder="6-digit authenticator / SMS code"
                  className={`w-full bg-slate-950 rounded-lg px-3 py-2 text-xs font-mono tabular-nums text-slate-100 placeholder:text-slate-600 focus:outline-none border ${
                    needs2FAHighlight
                      ? 'border-amber-500 focus:border-amber-400'
                      : 'border-slate-800 focus:border-blue-500'
                  }`}
                />
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer pt-0.5">
                <input
                  type="checkbox"
                  checked={rememberManualLogin}
                  onChange={(e) => setRememberManualLogin(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-blue-500 focus:ring-0"
                />
                <span>Verified session vault me save karein</span>
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
            <span>{isManualBusy ? 'Verifying on Facebook...' : 'Login & Verify on Facebook'}</span>
          </button>
        </form>

        {/* OPTION 2: Live Verified Facebook Cookies Login */}
        <section className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between gap-4">
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="text-[11px] font-mono font-semibold text-emerald-400">
                Option 02 · Live Cookie Verification
              </div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Cookie className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Login with Real Cookies</span>
              </h2>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              `c_user` aur `xs` cookies string, JSON export, ya Netscape `.txt` upload karein. Server `facebook.com` par live check karke real profile &amp; Pages fetch karega.
            </p>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    Account Label (Optional)
                  </label>
                  <input
                    type="text"
                    value={cookieNickname}
                    onChange={(e) => setCookieNickname(e.target.value)}
                    placeholder="Auto-detect from FB"
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
                    <option value="cookie_vault">Desktop Chrome</option>
                    <option value="mobile_app">Facebook Mobile App</option>
                    <option value="mobile_browser">Mobile Browser</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-medium text-slate-300">
                    Facebook Cookies (Header / JSON / .txt) *
                  </label>
                  <label className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer font-semibold">
                    <Upload className="w-3 h-3" />
                    <span>Choose .txt / .json</span>
                    <input
                      type="file"
                      accept=".txt,.json"
                      onChange={handleImportCookiesTxt}
                      className="hidden"
                    />
                  </label>
                </div>
                <textarea
                  rows={4}
                  value={cookiesInput}
                  onChange={(e) => setCookiesInput(e.target.value)}
                  placeholder="c_user=...; xs=...; datr=...; sb=... (or Cookie-Editor JSON export)"
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
                <span>Verify hone par vault me save karein</span>
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
            <span>{isCookiesBusy ? 'Checking Live Cookies...' : 'Verify Cookies & Go to Content'}</span>
          </button>
        </section>

        {/* OPTION 3: Real Chrome Profile Choose & Live CDP / Profile Cookie Verification */}
        <section className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between gap-4">
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="text-[11px] font-mono font-semibold text-amber-400">
                Option 03 · Live Chrome Profile Bridge
              </div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Chrome className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Connect Real Chrome Profile</span>
              </h2>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Apna Chrome Profile choose karein (live CDP Port <span className="font-mono text-slate-300">9222</span> ya Profile folder ke unencrypted cookies). Real logged-in Facebook session milne par hi aage badhega.
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
                    Custom Profile Name
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
                {chromeProfileEmailHint && (
                  <p className="text-[11px] text-emerald-400 mt-1">
                    Detected Chrome Account: {chromeProfileEmailHint}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Chrome Remote Debug Port (Live Browser)
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
                    Verified Saved Accounts (Re-Verify &amp; Fetch Pages):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {savedSessions.slice(0, 3).map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleQuickRestoreSaved(s)}
                        className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 text-[11px] rounded-md cursor-pointer truncate max-w-[170px]"
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
            <span>
              {isChromeBusy ? 'Verifying Chrome Session...' : 'Verify Chrome Profile & Go to Content'}
            </span>
          </button>
        </section>
      </div>

      {/* Facebook Official App Real OAuth & Token Connection Section */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-blue-400 shrink-0" />
              <span>Facebook Official App Login &amp; Real Page Fetcher</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Same Official Facebook App (<span className="font-mono text-slate-300">com.facebook.katana</span>) se original OAuth login ya User Access Token verify karein — jab tak original Facebook account verify nahi hoga, koi dummy page add nahi hoga.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOfficialFacebookOAuth}
            className="px-3.5 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 text-xs font-semibold rounded-lg cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open Official Facebook OAuth Login</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1">
              Facebook Mobile App
            </label>
            <select
              value={selectedMobileApp}
              onChange={(e) => {
                const val = e.target.value as 'fb_official' | 'fb_lite' | 'fb_mobile_web';
                setSelectedMobileApp(val);
                if (val === 'fb_official') setMobileAppNickname('Facebook Official App');
                else if (val === 'fb_lite') setMobileAppNickname('Facebook Lite App');
                else setMobileAppNickname('Facebook Mobile Browser');
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
            >
              <option value="fb_official">Facebook Official App (com.facebook.katana)</option>
              <option value="fb_lite">Facebook Lite App (com.facebook.lite)</option>
              <option value="fb_mobile_web">Facebook Mobile Browser (m.facebook.com)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1">
              Meta App ID (For Official App OAuth)
            </label>
            <input
              type="text"
              value={officialAppId}
              onChange={(e) => setOfficialAppId(e.target.value)}
              placeholder="e.g. 123456789012345"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono tabular-nums text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1 flex items-center gap-1">
              <KeyRound className="w-3 h-3 text-blue-400" />
              <span>Real FB User Access Token (Optional)</span>
            </label>
            <input
              type="password"
              value={officialAccessToken}
              onChange={(e) => setOfficialAccessToken(e.target.value)}
              placeholder="EAAB... (from Facebook App / Explorer)"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <button
              type="button"
              onClick={() => handleConnectMobileApp(undefined, true)}
              disabled={isMobileAppBusy}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
            >
              {isMobileAppBusy ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Smartphone className="w-3.5 h-3.5" />
              )}
              <span>
                {isMobileAppBusy ? 'Verifying on Facebook...' : 'Open App, Verify & Fetch Real Pages'}
              </span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
