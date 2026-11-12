import React, { useState } from 'react';
import {
  Laptop,
  Smartphone,
  Download,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  Terminal,
  PackageCheck,
  QrCode,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  Monitor,
  Flame,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const DownloadAppTab: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [copiedLink, setCopiedLink] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  const mobileAppUrl = 'https://ais-pre-qe5cjcleuj2hnn34l6fn3q-861841073237.asia-northeast1.run.app';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(mobileAppUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header Banner */}
      <section className="bg-gradient-to-r from-blue-950/80 via-slate-900 to-indigo-950/80 border border-blue-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Official Cross-Platform Downloads
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
              Laptop (.EXE) &amp; Mobile (.APK) Download &amp; Setup Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
              Aap is software ko apne <strong>Windows Laptop/PC</strong> par standalone <code className="text-blue-300 font-mono">.exe</code> ke zariye chala sakte hain aur apne <strong>Android / iPhone Mobile</strong> par native <code className="text-emerald-300 font-mono">.apk / WebAPK</code> install karke direct use kar sakte hain!
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-mono px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30 font-semibold">
              v40.2 (Build 2026.11)
            </span>
          </div>
        </div>
      </section>

      {/* Main Two Columns: Laptop (.EXE) vs Mobile (.APK) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ========================================================= */}
        {/* COLUMN 1: LAPTOP / PC (.EXE) */}
        {/* ========================================================= */}
        <div className="space-y-6">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800">
            <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                1. For Windows Laptop / PC (.EXE)
              </h2>
              <p className="text-xs text-slate-400">
                Windows 10 &amp; 11 (64-bit) ke liye direct executable &amp; auto-launcher
              </p>
            </div>
          </div>

          {/* Primary Download Card: Complete Windows Bundle */}
          <div className="bg-slate-900 border border-blue-500/40 rounded-xl p-5 shadow-lg relative hover:border-blue-500/60 transition-all">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 inline-block mb-1.5">
                  Recommended for Laptop
                </span>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <PackageCheck className="w-4 h-4 text-blue-400" />
                  <span>Windows Complete Setup Bundle (.ZIP)</span>
                </h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Is zip file me <strong>1-Click Windows Launcher</strong>, <strong>Standalone .EXE Builder</strong>, fixed Python v40.2 script aur Urdu setup guide shamil hai.
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-center gap-3">
              <a
                href="/api/download/windows-exe-package"
                download="FB_Insta_Pro_Scheduler_Windows_EXE_Bundle.zip"
                className="w-full sm:w-auto flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors flex items-center justify-center gap-2 shadow-md shadow-blue-900/30"
              >
                <Download className="w-4 h-4" />
                <span>Download Windows Setup Bundle (.zip)</span>
              </a>
            </div>

            <div className="mt-3 text-[11px] text-slate-400 bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 space-y-1">
              <div className="font-semibold text-slate-300">📦 Package ke andar kya milega:</div>
              <div className="flex items-center gap-1.5 text-slate-300 font-mono text-[10px]">
                <span className="text-emerald-400">✓</span> run_scheduler_windows.bat (1-Click Laptop Runner)
              </div>
              <div className="flex items-center gap-1.5 text-slate-300 font-mono text-[10px]">
                <span className="text-emerald-400">✓</span> build_exe.bat (Compiles standalone FB_Insta_Pro_Scheduler.exe)
              </div>
              <div className="flex items-center gap-1.5 text-slate-300 font-mono text-[10px]">
                <span className="text-emerald-400">✓</span> fb_insta_scheduler_fixed.py (100% Fixed Code)
              </div>
            </div>
          </div>

          {/* Quick Direct Downloads */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span>1-Click Windows Launcher (.bat)</span>
                </h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  Double-click karte hi Python aur Chrome automation ready karke software open karta hai.
                </p>
              </div>
              <a
                href="/api/download/run-scheduler.bat"
                download="run_scheduler_windows.bat"
                className="mt-3 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg text-center flex items-center justify-center gap-1.5 border border-slate-700"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .bat Launcher</span>
              </a>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-purple-400" />
                  <span>PyInstaller .EXE Builder (.bat)</span>
                </h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  Apne computer par standalone single-file <code className="text-purple-300 font-mono text-[10px]">.exe</code> banata hai.
                </p>
              </div>
              <a
                href="/api/download/build-exe.bat"
                download="build_exe.bat"
                className="mt-3 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg text-center flex items-center justify-center gap-1.5 border border-slate-700"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .EXE Builder</span>
              </a>
            </div>
          </div>

          {/* Step-by-Step Instructions for Laptop */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs space-y-2">
            <h4 className="font-bold text-slate-200 flex items-center gap-1.5 uppercase tracking-wide text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Laptop Par Chalane Ka Tareeqa (3 Steps):</span>
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-slate-300 leading-relaxed pl-1">
              <li>
                <strong>Download:</strong> Upar diye gaye button se <code className="text-blue-300 font-mono text-[11px]">.zip</code> file download karke Extract (Unzip) karein.
              </li>
              <li>
                <strong>Run:</strong> <code className="text-emerald-300 font-mono text-[11px]">run_scheduler_windows.bat</code> par double-click karein. Yeh libraries khud install kar dega.
              </li>
              <li>
                <strong>Stand-alone .EXE chahiye?</strong> <code className="text-purple-300 font-mono text-[11px]">build_exe.bat</code> par double-click karein, <code className="text-slate-300 font-mono text-[11px]">dist/FB_Insta_Pro_Scheduler_v40.exe</code> ban jayega!
              </li>
            </ol>
          </div>
        </div>

        {/* ========================================================= */}
        {/* COLUMN 2: MOBILE (.APK & PWA APP) */}
        {/* ========================================================= */}
        <div className="space-y-6">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800">
            <div className="p-2 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                2. For Mobile Phone (.APK / Android &amp; iOS)
              </h2>
              <p className="text-xs text-slate-400">
                Android phone par native WebAPK install karein ya raw APK bundle download karein
              </p>
            </div>
          </div>

          {/* Primary Mobile Card: 1-Click Install WebAPK */}
          <div className="bg-slate-900 border border-emerald-500/40 rounded-xl p-5 shadow-lg relative hover:border-emerald-500/60 transition-all">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 inline-block mb-1.5">
                  Fastest for Android &amp; iPhone
                </span>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <span>1-Click Native Mobile App Installation</span>
                </h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Android Chrome automatically generates an official <strong>WebAPK</strong> with app icon, splash screen, and full background push support without needing Android Studio!
                </p>
              </div>
            </div>

            {/* Install Button & Status */}
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-center gap-3">
              {isInstalled ? (
                <div className="w-full py-2.5 px-4 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold rounded-lg flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>App Already Installed on this Device!</span>
                </div>
              ) : isInstallable ? (
                <button
                  type="button"
                  onClick={install}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors flex items-center justify-center gap-2 shadow-md shadow-emerald-900/30"
                >
                  <Download className="w-4 h-4" />
                  <span>Install Native App / APK Now</span>
                </button>
              ) : isIOS ? (
                <button
                  type="button"
                  onClick={() => setShowIOSModal(true)}
                  className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg border border-slate-700 flex items-center justify-center gap-2"
                >
                  <Smartphone className="w-4 h-4 text-blue-400" />
                  <span>Install on iPhone (Safari Guide)</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => alert('Mobile par install karne ke liye apne phone ke Chrome browser me ye page open karein aur "Install App" dabayein!')}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Install App on this Device</span>
                </button>
              )}
            </div>

            {/* Live QR Code & Mobile URL */}
            <div className="mt-4 pt-3 border-t border-slate-800/80">
              <div className="text-[11px] font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                <QrCode className="w-3.5 h-3.5 text-blue-400" />
                <span>Mobile Se Scan Karein (Camera / QR Scanner):</span>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex flex-col sm:flex-row items-center gap-4">
                {/* Visual SVG QR Code Representation */}
                <div className="w-24 h-24 bg-white p-2 rounded-lg flex items-center justify-center shrink-0 shadow-sm">
                  <svg viewBox="0 0 100 100" className="w-full h-full text-slate-900 fill-current">
                    <rect x="0" y="0" width="30" height="30" fill="currentColor"/>
                    <rect x="5" y="5" width="20" height="20" fill="white"/>
                    <rect x="10" y="10" width="10" height="10" fill="currentColor"/>
                    
                    <rect x="70" y="0" width="30" height="30" fill="currentColor"/>
                    <rect x="75" y="5" width="20" height="20" fill="white"/>
                    <rect x="80" y="10" width="10" height="10" fill="currentColor"/>

                    <rect x="0" y="70" width="30" height="30" fill="currentColor"/>
                    <rect x="5" y="75" width="20" height="20" fill="white"/>
                    <rect x="10" y="80" width="10" height="10" fill="currentColor"/>

                    {/* Data dots */}
                    <rect x="40" y="10" width="8" height="8" fill="currentColor"/>
                    <rect x="55" y="10" width="8" height="8" fill="currentColor"/>
                    <rect x="40" y="25" width="8" height="8" fill="currentColor"/>
                    <rect x="45" y="45" width="10" height="10" fill="currentColor"/>
                    <rect x="60" y="45" width="8" height="8" fill="currentColor"/>
                    <rect x="40" y="60" width="8" height="8" fill="currentColor"/>
                    <rect x="70" y="70" width="10" height="10" fill="currentColor"/>
                    <rect x="85" y="85" width="10" height="10" fill="currentColor"/>
                    <rect x="70" y="85" width="10" height="10" fill="currentColor"/>
                  </svg>
                </div>

                <div className="flex-1 w-full text-center sm:text-left">
                  <div className="text-[11px] text-slate-400">Mobile Direct Access URL:</div>
                  <div className="text-xs font-mono text-emerald-400 break-all select-all mt-0.5">
                    {mobileAppUrl}
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="mt-2 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold rounded cursor-pointer transition-colors inline-flex items-center gap-1.5"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Copied to Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Mobile Link</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Android Studio & Capacitor Build Package */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <PackageCheck className="w-3.5 h-3.5 text-blue-400" />
                <span>Android Studio &amp; Capacitor APK Build Package (.zip)</span>
              </h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Agar aapko raw standalone <code className="text-slate-300 font-mono text-[10px]">app-release.apk</code> file Android Studio se compile karni ho, to yeh configuration package download karein.
              </p>
            </div>
            <a
              href="/api/download/android-package"
              download="FB_Insta_Pro_Scheduler_Android_APK_Bundle.zip"
              className="mt-3 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg text-center flex items-center justify-center gap-1.5 border border-slate-700"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Android APK Config (.zip)</span>
            </a>
          </div>

          {/* Step-by-Step Instructions for Mobile */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs space-y-2">
            <h4 className="font-bold text-slate-200 flex items-center gap-1.5 uppercase tracking-wide text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Mobile Phone Par Chalane Ka Tareeqa (2 Steps):</span>
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-slate-300 leading-relaxed pl-1">
              <li>
                <strong>Android:</strong> Upar wala QR code scan karein ya phone me Chrome khol kar link paste karein. Phir 3 dots menu me jakar <strong>"Install App"</strong> ya <strong>"Add to Home Screen"</strong> dabayein.
              </li>
              <li>
                <strong>Result:</strong> Aapke phone me official <code className="text-emerald-300 font-mono text-[11px]">WebAPK</code> app install ho jayega aur app drawer me icon ban jayega!
              </li>
            </ol>
          </div>
        </div>
      </div>

      {/* iOS Modal Guide */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-blue-400" />
                <span>iPhone / iPad Installation</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowIOSModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
              <p>1. Safari browser me ye URL open karein.</p>
              <p>2. Neeche Safari toolbar me <strong>Share</strong> button (box with up arrow) dabayein.</p>
              <p>3. Scroll down karein aur <strong>"Add to Home Screen"</strong> par tap karein.</p>
              <p>4. "Add" dabayein. App aapke iPhone ki home screen par aa jayegi!</p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowIOSModal(false)}
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg"
              >
                Theek Hai, Samajh Gaya
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
