import { chromium, type Browser, type Cookie } from 'playwright-core';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export interface RealFacebookPage {
  id: string;
  name: string;
  category: string;
  pageToken?: string;
  link: string;
}

export interface RealFacebookAuthResult {
  success: boolean;
  cUser?: string;
  profileName?: string;
  cookies?: string;
  accessToken?: string;
  pages?: RealFacebookPage[];
  requires2FA?: boolean;
  checkpoint?: boolean;
  chromeOpenedForLogin?: boolean;
  error?: string;
}

export interface ParsedCookieSet {
  playwrightCookies: Array<{
    name: string;
    value: string;
    domain: string;
    path: string;
  }>;
  cookieHeader: string;
  cUser: string | null;
  hasXs: boolean;
}

const KNOWN_CHROMIUM_PATHS = [
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || '',
  '/ms-playwright/chromium_headless_shell-1247/chrome-headless-shell-linux64/chrome-headless-shell',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean);

function resolveChromiumExecutable(): string | undefined {
  for (const p of KNOWN_CHROMIUM_PATHS) {
    if (fs.existsSync(p)) return p;
  }
  try {
    const msRoot = '/ms-playwright';
    if (fs.existsSync(msRoot)) {
      const entries = fs.readdirSync(msRoot);
      for (const entry of entries) {
        if (entry.startsWith('chromium')) {
          const candidate1 = path.join(msRoot, entry, 'chrome-headless-shell-linux64', 'chrome-headless-shell');
          const candidate2 = path.join(msRoot, entry, 'chrome-linux64', 'chrome');
          if (fs.existsSync(candidate1)) return candidate1;
          if (fs.existsSync(candidate2)) return candidate2;
        }
      }
    }
  } catch {}
  return undefined;
}

async function launchStealthBrowser(): Promise<Browser> {
  const executablePath = resolveChromiumExecutable();
  return chromium.launch({
    ...(executablePath ? { executablePath } : {}),
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-blink-features=AutomationControlled',
    ],
  });
}

/**
 * Parses semicolon cookie headers, EditThisCookie/Cookie-Editor JSON arrays,
 * or Netscape tab-separated .txt cookie exports into clean Playwright cookies.
 */
export function parseFacebookCookieInput(rawInput: string): ParsedCookieSet {
  const trimmed = (rawInput || '').trim();
  const cookieMap = new Map<string, { name: string; value: string; domain: string; path: string }>();

  if (!trimmed) {
    return { playwrightCookies: [], cookieHeader: '', cUser: null, hasXs: false };
  }

  // 1. JSON array export format
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed);
      const list = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.cookies) ? parsed.cookies : [];
      for (const item of list) {
        if (item && typeof item.name === 'string' && typeof item.value === 'string') {
          const dom = typeof item.domain === 'string' && item.domain ? item.domain : '.facebook.com';
          if (!dom.includes('facebook.com')) continue;
          cookieMap.set(item.name, {
            name: item.name,
            value: item.value,
            domain: '.facebook.com',
            path: item.path || '/',
          });
        }
      }
    } catch {}
  }

  // 2. Netscape HTTP Cookie File tab-separated lines OR semicolon lines
  if (cookieMap.size === 0) {
    const lines = trimmed.split(/\r?\n/);
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;

      if (line.includes('\t')) {
        const cols = line.split('\t');
        if (cols.length >= 7) {
          const domain = cols[0];
          const cPath = cols[2] || '/';
          const name = cols[5]?.trim();
          const value = cols[6]?.trim();
          if (name && value !== undefined && domain.includes('facebook.com')) {
            cookieMap.set(name, {
              name,
              value,
              domain: '.facebook.com',
              path: cPath,
            });
          }
          continue;
        }
      }

      // Standard key=value; key2=value2
      const pairs = line.split(';');
      for (const pair of pairs) {
        const eqIdx = pair.indexOf('=');
        if (eqIdx <= 0) continue;
        const name = pair.slice(0, eqIdx).trim();
        const value = pair.slice(eqIdx + 1).trim();
        if (!name || !value) continue;
        cookieMap.set(name, {
          name,
          value,
          domain: '.facebook.com',
          path: '/',
        });
      }
    }
  }

  const playwrightCookies = Array.from(cookieMap.values());
  const cookieHeader = playwrightCookies.map((c) => `${c.name}=${c.value}`).join('; ') + (playwrightCookies.length ? ';' : '');
  const cUser = cookieMap.get('c_user')?.value || null;
  const hasXs = Boolean(cookieMap.get('xs')?.value);

  return { playwrightCookies, cookieHeader, cUser, hasXs };
}

function formatCookiesHeader(cookies: Cookie[]): string {
  return (
    cookies
      .filter((c) => c.domain.includes('facebook.com') && c.name && c.value)
      .map((c) => `${c.name}=${c.value}`)
      .join('; ') + ';'
  );
}

async function extractRealProfileAndPagesFromContext(
  page: import('playwright-core').Page,
  fallbackCUser: string
): Promise<{ profileName: string; pages: RealFacebookPage[] }> {
  let profileName = `FB_${fallbackCUser.slice(-6)}`;

  try {
    // Wait briefly for Facebook main shell / user JSON
    await page.waitForTimeout(1500);
    const detectedName = await page.evaluate(() => {
      // Try title or aria-label or inline CurrentUserInitialData JSON
      const html = document.documentElement.innerHTML || '';
      const nameMatch = html.match(/"NAME":"([^"\\]{2,60})"/);
      if (nameMatch && nameMatch[1] && !/facebook/i.test(nameMatch[1])) {
        return nameMatch[1];
      }
      const profileAria = document.querySelector('a[href*="/me/"], a[aria-label*="Profile"], [aria-label="Your profile"] span');
      if (profileAria?.textContent?.trim()) {
        return profileAria.textContent.trim();
      }
      return '';
    });
    if (detectedName) {
      profileName = detectedName;
    }
  } catch {}

  const pagesMap = new Map<string, RealFacebookPage>();

  // Strategy 1: Desktop Facebook Your Pages list
  try {
    await page.goto('https://www.facebook.com/pages/?category=your_pages', {
      waitUntil: 'domcontentloaded',
      timeout: 20000,
    });
    await page.waitForTimeout(2500);

    const scraped = await page.evaluate(() => {
      const results: Array<{ id: string; name: string; link: string }> = [];
      const ignore = new Set([
        'Pages',
        'Create new Page',
        'Create New Page',
        'Discover',
        'Liked Pages',
        'Invites',
        'Business Suite',
        'Meta Business Suite',
        'Promote',
        'Switch Now',
      ]);

      // Extract embedded Page JSON records if Facebook rendered React payload
      const html = document.documentElement.innerHTML || '';
      const jsonMatches = html.matchAll(/"page_id":"(\d+)"[^}]*"name":"([^"\\]{2,80})"/g);
      for (const m of jsonMatches) {
        results.push({
          id: m[1],
          name: m[2],
          link: `https://facebook.com/${m[1]}`,
        });
      }

      // Extract visible managed page anchor links
      const links = Array.from(document.querySelectorAll('div[role="main"] a[href]'));
      for (const a of links) {
        const href = (a as HTMLAnchorElement).href || '';
        const text = (a.textContent || '').trim();
        if (!text || text.length < 2 || text.length > 80 || ignore.has(text)) continue;
        if (
          href.includes('facebook.com/') &&
          !href.includes('/pages/?') &&
          !href.includes('/pages/creation') &&
          !href.includes('/help')
        ) {
          const idMatch = href.match(/id=(\d+)/) || href.match(/facebook\.com\/([^/?#]+)/);
          const pid = idMatch ? idMatch[1] : text.toLowerCase().replace(/\s+/g, '.');
          results.push({ id: pid, name: text, link: href.split('?')[0] });
        }
      }
      return results;
    });

    for (const item of scraped) {
      if (!pagesMap.has(item.name.toLowerCase())) {
        pagesMap.set(item.name.toLowerCase(), {
          id: item.id,
          name: item.name,
          category: 'Facebook Page',
          link: item.link,
        });
      }
    }
  } catch {}

  // Strategy 2: Lightweight mbasic.facebook.com/pages/ fallback
  if (pagesMap.size === 0) {
    try {
      await page.goto('https://mbasic.facebook.com/pages/', {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      });
      const mbasicPages = await page.evaluate(() => {
        const out: Array<{ id: string; name: string; link: string }> = [];
        const links = Array.from(document.querySelectorAll('a[href*="/pages/"], a[href*="profile.php"], table a[href]'));
        for (const a of links) {
          const href = (a as HTMLAnchorElement).href || '';
          const txt = (a.textContent || '').trim();
          if (!txt || txt.length < 2 || txt.length > 80) continue;
          if (/Create|Discover|Liked|Invites|Home|Messages|Notifications|Menu|Help/i.test(txt)) continue;
          if (href.includes('/pages/launch') || href.includes('/story.php') || href.includes('mbasic.facebook.com/')) {
            const idMatch = href.match(/(\d{7,})/);
            if (idMatch) {
              out.push({
                id: idMatch[1],
                name: txt,
                link: `https://facebook.com/${idMatch[1]}`,
              });
            }
          }
        }
        return out;
      });
      for (const item of mbasicPages) {
        if (!pagesMap.has(item.name.toLowerCase())) {
          pagesMap.set(item.name.toLowerCase(), {
            id: item.id,
            name: item.name,
            category: 'Facebook Page',
            link: item.link,
          });
        }
      }
    } catch {}
  }

  return {
    profileName,
    pages: Array.from(pagesMap.values()),
  };
}

/**
 * Verifies raw Facebook cookies live against facebook.com in a real Chromium context.
 * Rejects dummy, expired, or unauthenticated cookies.
 */
export async function verifyFacebookCookiesLive(rawCookies: string): Promise<RealFacebookAuthResult> {
  const parsed = parseFacebookCookieInput(rawCookies);
  if (!parsed.cUser || !parsed.hasXs) {
    return {
      success: false,
      error: 'Invalid cookies: Facebook cookies me valid "c_user" aur "xs" dono lazmi hone chahiye.',
    };
  }

  let browser: Browser | null = null;
  try {
    browser = await launchStealthBrowser();
    const context = await browser.newContext({
      locale: 'en-US',
      extraHTTPHeaders: { 'Accept-Language': 'en-US,en;q=0.9' },
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    });

    await context.addCookies(parsed.playwrightCookies);
    const page = await context.newPage();

    await page.goto('https://www.facebook.com/', { waitUntil: 'domcontentloaded', timeout: 25000 });
    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    const hasLoginInput = (await page.locator('input[name="email"], input[name="pass"]').count()) > 0;

    if (currentUrl.includes('/login') || hasLoginInput) {
      return {
        success: false,
        error:
          'Facebook ne in cookies ko reject kar diya hai (session expired ya fake/invalid hai). Live logged-in Facebook browser se fresh cookies copy karein.',
      };
    }

    if (currentUrl.includes('/checkpoint')) {
      return {
        success: false,
        checkpoint: true,
        error: 'Facebook account Checkpoint / Security Lock par hai. Pehle Facebook app/browser me verify karein.',
      };
    }

    const liveCookies = await context.cookies('https://www.facebook.com');
    const cUserCookie = liveCookies.find((c) => c.name === 'c_user')?.value;
    const xsCookie = liveCookies.find((c) => c.name === 'xs')?.value;

    if (!cUserCookie || !xsCookie) {
      return {
        success: false,
        error: 'Facebook session confirm nahi ho saki — cookies expire ho chuki hain.',
      };
    }

    const { profileName, pages } = await extractRealProfileAndPagesFromContext(page, cUserCookie);
    return {
      success: true,
      cUser: cUserCookie,
      profileName,
      cookies: formatCookiesHeader(liveCookies) || parsed.cookieHeader,
      pages,
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Live Facebook cookie verification error: ${err?.message || 'Connection failed'}`,
    };
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}

/**
 * Performs genuine Facebook Username/Email/Phone + Password login in headless Chromium.
 * Returns exact Facebook error messages on wrong credentials, 2FA prompts, or checkpoints.
 */
export async function performRealFacebookCredentialsLogin(params: {
  username: string;
  password: string;
  twoFactorCode?: string;
}): Promise<RealFacebookAuthResult> {
  const { username, password, twoFactorCode } = params;
  if (!username.trim() || !password) {
    return { success: false, error: 'Facebook ID / Email / Phone aur Password dono required hain.' };
  }

  let browser: Browser | null = null;
  try {
    browser = await launchStealthBrowser();
    const context = await browser.newContext({
      locale: 'en-US',
      extraHTTPHeaders: { 'Accept-Language': 'en-US,en;q=0.9' },
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    });

    const page = await context.newPage();
    await page.goto('https://www.facebook.com/login/', { waitUntil: 'domcontentloaded', timeout: 25000 });

    // Dismiss GDPR cookie banner if present
    try {
      const cookieBtn = page.locator(
        'button[data-cookiebanner="accept_button"], button:has-text("Allow all cookies"), div[role="button"]:has-text("Allow all cookies")'
      ).first();
      if ((await cookieBtn.count()) > 0 && (await cookieBtn.isVisible())) {
        await cookieBtn.click({ timeout: 3000 });
        await page.waitForTimeout(800);
      }
    } catch {}

    await page.waitForSelector('input[name="email"]', { timeout: 12000 });
    await page.fill('input[name="email"]', username.trim());
    await page.fill('input[name="pass"]', password);

    const loginBtn = page.locator('button[name="login"], button[type="submit"], div[role="button"]:has-text("Log in")').first();
    await Promise.all([
      page.waitForLoadState('domcontentloaded', { timeout: 20000 }).catch(() => {}),
      loginBtn.click(),
    ]);

    await page.waitForTimeout(3500);

    let currentUrl = page.url();

    // Handle 2FA if prompted
    const has2FAInput = (await page.locator('input[name="approvals_code"], input[autocomplete="one-time-code"]').count()) > 0;
    if (currentUrl.includes('two_step_verification') || has2FAInput) {
      if (twoFactorCode && twoFactorCode.trim()) {
        const codeField = page.locator('input[name="approvals_code"], input[autocomplete="one-time-code"], input[type="text"]').first();
        await codeField.fill(twoFactorCode.trim());
        const submit2FA = page.locator('button[type="submit"], div[role="button"]:has-text("Continue"), div[role="button"]:has-text("Submit")').first();
        await submit2FA.click().catch(() => {});
        await page.waitForTimeout(4000);
        currentUrl = page.url();
      } else {
        return {
          success: false,
          requires2FA: true,
          error:
            'Facebook 2FA / Login Approval maang raha hai. Apna 6-digit 2FA Security Code enter karke dubara Login click karein.',
        };
      }
    }

    if (currentUrl.includes('/two_step_verification') || currentUrl.includes('/checkpoint')) {
      return {
        success: false,
        checkpoint: true,
        error:
          'Facebook Security Checkpoint ya Device Verification aa gaya hai — apni Facebook mobile app ya browser me login approve karein, ya 2FA code check karein.',
      };
    }

    const cookiesAfter = await context.cookies('https://www.facebook.com');
    const cUserCookie = cookiesAfter.find((c) => c.name === 'c_user')?.value;
    const xsCookie = cookiesAfter.find((c) => c.name === 'xs')?.value;

    if (!cUserCookie || !xsCookie || currentUrl.includes('/login')) {
      const fbErrorText = await page.evaluate(() => {
        const selectors = [
          '#error_box',
          'div._9ay7',
          'div[role="alert"]',
          'div[data-testid="royal_login_error"]',
        ];
        for (const sel of selectors) {
          const el = document.querySelector(sel);
          const txt = el?.textContent?.trim();
          if (txt && txt.length > 4) return txt;
        }
        return '';
      });

      return {
        success: false,
        error:
          fbErrorText ||
          'Facebook login verify nahi ho saka (ghalat ID/password ya Facebook captcha/verification block). Apna ID aur Password check karein.',
      };
    }

    const { profileName, pages } = await extractRealProfileAndPagesFromContext(page, cUserCookie);
    return {
      success: true,
      cUser: cUserCookie,
      profileName,
      cookies: formatCookiesHeader(cookiesAfter),
      pages,
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Real Facebook login failed: ${err?.message || 'Unexpected error'}`,
    };
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}

/**
 * Reads plaintext .facebook.com cookies from a Chromium SQLite Cookies DB if unencrypted.
 * Returns null if cookies are OS-encrypted (e.g. Windows DPAPI v10/v20) or missing.
 */
async function readPlaintextCookiesFromSqlite(dbFilePath: string): Promise<string | null> {
  if (!fs.existsSync(dbFilePath)) return null;
  const pyCode = `
import sqlite3, json, sys
path = sys.argv[1]
conn = sqlite3.connect(f"file:{path}?mode=ro", uri=True)
cur = conn.cursor()
cur.execute("SELECT name, value FROM cookies WHERE host_key LIKE '%facebook.com%' AND value != ''")
rows = cur.fetchall()
conn.close()
print(json.dumps([{"name": r[0], "value": r[1]} for r in rows]))
`;
  try {
    const { stdout } = await execFileAsync('python3', ['-c', pyCode, dbFilePath], { timeout: 5000 });
    const rows = JSON.parse(stdout || '[]') as Array<{ name: string; value: string }>;
    if (!rows.length) return null;
    const header = rows.map((r) => `${r.name}=${r.value}`).join('; ') + ';';
    if (header.includes('c_user=') && header.includes('xs=')) {
      return header;
    }
  } catch {}
  return null;
}

/**
 * Connects to a real Chrome Profile via:
 * 1) Live Chrome Remote Debugging Port (CDP), OR
 * 2) Uploaded/local Chrome Profile cookies JSON/txt or unencrypted SQLite DB.
 * Never fabricates fake Chrome sessions or hashed c_user IDs.
 */
export async function connectChromeProfileReal(params: {
  profileDirectory: string;
  userDataPath?: string;
  port?: string;
  uploadedCookiesText?: string;
  uploadedCookiesDbBase64?: string;
}): Promise<RealFacebookAuthResult> {
  const cleanProfile = (params.profileDirectory || 'Default').trim();
  const cleanPort = (params.port || '9222').trim();

  // 1. If user's Chrome Profile folder included a readable cookies export or SQLite file
  if (params.uploadedCookiesText?.trim()) {
    const verified = await verifyFacebookCookiesLive(params.uploadedCookiesText);
    if (verified.success) {
      return {
        ...verified,
        profileName: verified.profileName || `Chrome (${cleanProfile})`,
      };
    }
    return verified;
  }

  if (params.uploadedCookiesDbBase64?.trim()) {
    const tmpDb = path.join(os.tmpdir(), `chrome_cookies_${Date.now()}.sqlite`);
    try {
      fs.writeFileSync(tmpDb, Buffer.from(params.uploadedCookiesDbBase64, 'base64'));
      const header = await readPlaintextCookiesFromSqlite(tmpDb);
      if (header) {
        return await verifyFacebookCookiesLive(header);
      }
      return {
        success: false,
        error:
          'Chosen Chrome Profile ka Cookies database OS-encrypted (Windows DPAPI) hai. Live Chrome profile connect karne ke liye Chrome ko "--remote-debugging-port=' +
          cleanPort +
          '" ke sath open karein ya Cookies tab se cookies paste karein.',
      };
    } finally {
      try {
        fs.unlinkSync(tmpDb);
      } catch {}
    }
  }

  // 2. Check Live Chrome Remote Debugging Port (127.0.0.1:9222)
  try {
    const versionRes = await fetch(`http://127.0.0.1:${cleanPort}/json/version`, {
      signal: AbortSignal.timeout(1800),
    }).catch(() => null);

    if (versionRes && versionRes.ok) {
      const browser = await chromium.connectOverCDP(`http://127.0.0.1:${cleanPort}`);
      try {
        const contexts = browser.contexts();
        for (const ctx of contexts) {
          const fbCookies = await ctx.cookies('https://www.facebook.com');
          const cUser = fbCookies.find((c) => c.name === 'c_user')?.value;
          const xs = fbCookies.find((c) => c.name === 'xs')?.value;
          if (cUser && xs) {
            const cookieHeader = formatCookiesHeader(fbCookies);
            const verified = await verifyFacebookCookiesLive(cookieHeader);
            if (verified.success) {
              return verified;
            }
          }
        }

        // Chrome is open on CDP port, but not logged into Facebook yet -> open FB login tab inside that live Chrome profile!
        const targetCtx = contexts[0];
        if (targetCtx) {
          const tab = await targetCtx.newPage();
          await tab.goto('https://www.facebook.com/login/', { waitUntil: 'domcontentloaded' }).catch(() => {});
        }

        return {
          success: false,
          chromeOpenedForLogin: true,
          error: `Live Chrome (port ${cleanPort}) connect ho gaya hai aur us me Facebook login page open kar diya gaya hai. Browser me Facebook login complete karke dubara button dabayein.`,
        };
      } finally {
        await browser.close().catch(() => {});
      }
    }
  } catch {}

  // 3. Check local Linux/Host Chrome directory on server if path exists
  const localCandidates = [
    params.userDataPath ? path.join(params.userDataPath, cleanProfile, 'Cookies') : '',
    params.userDataPath ? path.join(params.userDataPath, cleanProfile, 'Network', 'Cookies') : '',
    path.join(os.homedir(), '.config', 'google-chrome', cleanProfile, 'Cookies'),
    path.join(os.homedir(), '.config', 'chromium', cleanProfile, 'Cookies'),
  ].filter(Boolean);

  for (const candidate of localCandidates) {
    if (fs.existsSync(candidate)) {
      const header = await readPlaintextCookiesFromSqlite(candidate);
      if (header) {
        return await verifyFacebookCookiesLive(header);
      }
    }
  }

  return {
    success: false,
    error:
      `Chrome Profile [${cleanProfile}] par koi live Facebook login session nahi mili (Port ${cleanPort} reachable nahi hai). Live Chrome connect karne ke liye apna Chrome "--remote-debugging-port=${cleanPort} --profile-directory=${cleanProfile}" se run karein, ya Option 1 (ID/Password) / Option 2 (Cookies) use karein.`,
  };
}

/**
 * Verifies Facebook Official App via real Graph API User Access Token OR real verified session cookies.
 * Fetches ONLY real managed Facebook Pages from Meta Graph API / live Facebook Pages manager.
 * Never returns hardcoded or dummy pages.
 */
export async function connectOfficialFacebookAppReal(params: {
  accessToken?: string;
  cookies?: string;
}): Promise<RealFacebookAuthResult> {
  const token = (params.accessToken || '').trim();
  const cookies = (params.cookies || '').trim();

  // Path A: Verify via Real Facebook Graph API User Access Token
  if (token) {
    try {
      const meRes = await fetch(
        `https://graph.facebook.com/v19.0/me?fields=id,name,picture{url}&access_token=${encodeURIComponent(token)}`
      );
      const meData = (await meRes.json()) as any;

      if (meData?.error) {
        return {
          success: false,
          error: `Facebook Graph API error: ${meData.error.message || 'Invalid or expired Access Token.'}`,
        };
      }

      if (meData?.id) {
        const accountsRes = await fetch(
          `https://graph.facebook.com/v19.0/me/accounts?fields=id,name,category,access_token,link&access_token=${encodeURIComponent(
            token
          )}`
        );
        const accountsData = (await accountsRes.json()) as any;
        const pages: RealFacebookPage[] = Array.isArray(accountsData?.data)
          ? accountsData.data.map((p: any) => ({
              id: String(p.id),
              name: p.name,
              category: p.category || 'Facebook Page',
              pageToken: p.access_token,
              link: p.link || `https://facebook.com/${p.id}`,
            }))
          : [];

        return {
          success: true,
          cUser: String(meData.id),
          profileName: meData.name || `FB_${meData.id}`,
          accessToken: token,
          cookies: cookies || undefined,
          pages,
        };
      }
    } catch (err: any) {
      return {
        success: false,
        error: `Facebook Graph API connection failed: ${err?.message || 'Network error'}`,
      };
    }
  }

  // Path B: Verify via Live Verified Facebook Session Cookies
  if (cookies) {
    const cookieResult = await verifyFacebookCookiesLive(cookies);
    if (cookieResult.success) {
      return cookieResult;
    }
    return {
      success: false,
      error:
        cookieResult.error ||
        'Facebook Official App verify nahi ho saki — active session invalid/expired hai.',
    };
  }

  return {
    success: false,
    error:
      'Koi original Facebook login verified nahi hai. Pehle Facebook Official OAuth / Access Token enter karein, ya Option 1 (ID/Password) / Option 2 (Cookies) se real Facebook account verify karein.',
  };
}
