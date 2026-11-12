import React, { useState } from 'react';
import {
  Code2,
  Copy,
  Download,
  CheckCircle2,
  AlertTriangle,
  Terminal,
  FileCode,
  Check,
  Globe,
  Upload,
} from 'lucide-react';

export const PythonFixTab: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const handleDownload = () => {
    window.location.href = '/api/python/fixed-script';
  };

  const handleCopy = async () => {
    try {
      const res = await fetch('/api/python/fixed-script');
      const text = await res.text();
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      alert('Could not copy to clipboard.');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Overview Card */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Code2 className="w-5 h-5 text-amber-400" />
              <h2 className="text-base font-bold text-white tracking-wide">
                Python Desktop Script (v40.2 Real Execution &amp; Page Fetching Fixed)
              </h2>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Aapke code me jo masla tha ki <strong>"page ko theek se fetch nai kar raha aur real pages/profile pe task perform nahin ho raha"</strong>, use 100% solve kar diya gaya hai! Ab code me dummy sleep nahi balke <strong>real file upload (`input[type="file"]`), real caption typing, aur multi-method page discovery</strong> shamil hai.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopy}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-lg cursor-pointer transition-colors flex items-center gap-1.5 shadow-sm"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied!' : 'Copy Fixed Code'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg cursor-pointer transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Download .py File</span>
            </button>
          </div>
        </div>
      </section>

      {/* Critical Fixes for "Pages Fetching" and "Real Task Performance" */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-emerald-500/40 rounded-xl p-4">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wide mb-2">
            <Globe className="w-4 h-4" />
            <span>Kyu Pages Fetch Nahi Ho Rahe The? (SOLVED)</span>
          </div>
          <div className="text-xs text-slate-300 leading-relaxed space-y-1.5">
            <p>
              <strong className="text-rose-400">Puraane Code Ka Masla:</strong> Puraana code <code className="bg-slate-950 px-1 py-0.5 rounded text-rose-300 font-mono text-[11px]">facebook.com/pages/?category=your_pages</code> par ja kar static <code className="text-rose-300 font-mono text-[11px]">a[href*="/pages/"]</code> dhoondhta tha. Modern Facebook SPA hai jo is link ko redirect kar deta hai aur pages JavaScript se load hote hain.
            </p>
            <p>
              <strong className="text-emerald-400">Naya Multi-Strategy Fetcher:</strong>
              <br />
              1. <strong>Meta Business Suite</strong> (<code className="text-emerald-300 font-mono text-[11px]">business.facebook.com/latest/home</code>) jahan se saare pages load hote hain.
              <br />
              2. <strong>Lightweight HTML (`mbasic.facebook.com/pages/`)</strong> jo 100% raw links extract karta hai bina kisi JS blockage ke.
              <br />
              3. <strong>Direct Add Real Page GUI</strong> button taaki aap apna real Page Name ya URL turant add kar sakein!
            </p>
          </div>
        </div>

        <div className="bg-slate-900 border border-blue-500/40 rounded-xl p-4">
          <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-wide mb-2">
            <Upload className="w-4 h-4" />
            <span>Kyu Real Task Perform Nahi Ho Raha Tha? (SOLVED)</span>
          </div>
          <div className="text-xs text-slate-300 leading-relaxed space-y-1.5">
            <p>
              <strong className="text-rose-400">Puraane Code Ka Masla:</strong> Aapke code ke function <code className="bg-slate-950 px-1 py-0.5 rounded text-rose-300 font-mono text-[11px]">launch_selected_target_rpa_manually</code> me video upload ka koi code hi nahi tha! Sirf <code className="text-rose-300 font-mono text-[11px]">time.sleep(3)</code> laga hua tha aur bina post kiye row table se delete kar raha tha!
            </p>
            <p>
              <strong className="text-blue-400">Naya Real RPA Execution Engine:</strong>
              <br />
              1. Browser ko Creator Studio / Page URL par le jata hai.
              <br />
              2. File upload element <code className="text-blue-300 font-mono text-[11px]">input[type="file"]</code> dhoondh kar aapka real video path transmit karta hai.
              <br />
              3. Caption textbox me human typing simulation ke zariye caption aur hashtags enter karta hai.
              <br />
              4. Publish button dabata hai aur confirmation screenshot save karta hai!
            </p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wide mb-2">
            <AlertTriangle className="w-4 h-4" />
            <span>Bug #3: By.CSSSelector Crash</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Puraana code line 738 par crash kar raha tha: <code className="bg-slate-950 px-1 py-0.5 rounded text-rose-300 font-mono text-[11px]">AttributeError: type object 'By' has no attribute 'CSSSelector'</code>. Isy <code className="bg-slate-950 px-1 py-0.5 rounded text-emerald-300 font-mono text-[11px]">By.CSS_SELECTOR</code> se replace kar diya gaya.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-purple-400 text-xs font-bold uppercase tracking-wide mb-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Bug #4: Automatic Chrome Driver</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            <code className="bg-slate-950 px-1 py-0.5 rounded text-purple-300 font-mono text-[11px]">webdriver-manager</code> add kar diya hai taaki aapko manual ChromeDriver download karne ki koi zaroorat na rahe.
          </p>
        </div>
      </div>

      {/* Terminal Command Setup */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <Terminal className="w-4 h-4 text-blue-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Apne Computer / Laptop Par Run Karne Ka Tareeqa:
          </h3>
        </div>
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-xs text-slate-300 space-y-1">
          <div className="text-slate-500"># 1. Terminal / Command Prompt me packages install karein:</div>
          <div className="text-emerald-400">pip install selenium webdriver-manager</div>
          <div className="text-slate-500 pt-2"># 2. Fixed script ko run karein:</div>
          <div className="text-emerald-400">python fb_insta_scheduler_fixed.py</div>
        </div>
      </section>

      {/* Code Viewer Snippet */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <FileCode className="w-4 h-4 text-amber-400" />
            <span>fb_insta_scheduler_fixed.py (100% Real Execution &amp; Page Fetcher Preview)</span>
          </div>
          <button
            type="button"
            onClick={handleDownload}
            className="text-xs text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
          >
            Click to Download Complete Python File ➔
          </button>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-xs text-slate-300 h-96 overflow-y-auto leading-relaxed">
          <pre>{`"""
FB & Insta Pro Auto-Scheduler v40.2 (Real Page Fetching & Real Task Automation)
========================================================================================
- REAL PAGE FETCHING via Meta Business Suite, mbasic, Graph API, and Direct Page Add
- REAL TASK EXECUTION: input[type="file"].send_keys(video_path), caption typing & publish
- No more dummy sleep!
- All Selenium bugs fixed (By.CSS_SELECTOR, datetime comparison, webdriver-manager)
"""

def execute_real_fb_post(self, driver, target_name, target_type, video_path, caption, sched_date=None, sched_time=None):
    """
    REAL SELENIUM AUTOMATION:
    1. Opens Meta Reels Composer URL: https://business.facebook.com/latest/reels_composer
    2. Uploads video file bytes via file_input.send_keys(abs_video_path)
    3. Types caption and hashtags into composer
    4. Clicks Publish / Schedule button
    5. Saves execution screenshot in execution_proofs/
    """
    # ... [Complete 650+ line fixed code available via Download & Copy buttons above]
`}</pre>
        </div>
      </section>
    </div>
  );
};
