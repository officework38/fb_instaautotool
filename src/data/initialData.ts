import { AccountItem, TargetItem, SystemLog } from '../types';

export const INITIAL_ACCOUNTS: AccountItem[] = [
  {
    id: 'acc-1',
    nickname: 'Primary Brand Account (Best You Shopping)',
    c_user: '61561547737841',
    rawCookie: 'datr=z2Niau_VrYxapXvkjmDInemI; sb=z2NianZvQAhzQHGIE8qDKfpJ; c_user=61561547737841; xs=6%3AgKqgsWap84Fqfw%3A2%3A1784833381%3A-1%3A-1%3A%3AAcx92WMHlhPDATmFIp-VnWc3J6zQDfFhQharTGz0FA;',
    status: 'active',
    pagesCount: 4,
    addedAt: '2026-11-12 08:30',
    lastVerified: 'Just now',
  },
  {
    id: 'acc-2',
    nickname: 'Secondary Marketing Profile',
    c_user: '100084920491023',
    rawCookie: 'datr=k8Xkza_VrKlap9vk1mDInemX; sb=k8XkzbnZvQAhzQHGIE8qDKfpK; c_user=100084920491023; xs=3%3AgKqgsWap84Fqfw%3A1%3A1784833381%3A-1%3A-1;',
    status: 'verified',
    pagesCount: 2,
    addedAt: '2026-11-12 09:15',
    lastVerified: '10 mins ago',
  },
];

// Today's date YYYY-MM-DD
const today = new Date();
const formatDate = (d: Date) => d.toISOString().split('T')[0];
const todayStr = formatDate(today);

// Generate times soon for live demoing
const getNextTimeStr = (minutesAhead: number) => {
  const d = new Date(Date.now() + minutesAhead * 60 * 1000);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
};

export const SAMPLE_VIDEOS = [
  {
    name: 'Top Trending Gadgets 2026 Reel',
    path: 'C:/Marketing/Videos/viral_gadgets_reel_01.mp4',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    duration: '0:15',
    size: '18.4 MB',
  },
  {
    name: 'Daily Motivation & Mindset Clip',
    path: 'C:/Marketing/Videos/motivation_success_02.mp4',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
    duration: '0:15',
    size: '22.1 MB',
  },
  {
    name: 'E-commerce Unboxing & Review',
    path: 'C:/Marketing/Videos/unboxing_viral_reel_03.mp4',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
    duration: '0:15',
    size: '15.8 MB',
  },
  {
    name: 'Tech Hacks & Life Tips Shorts',
    path: 'C:/Marketing/Videos/tech_hacks_quick_04.mp4',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
    duration: '0:15',
    size: '19.2 MB',
  },
];

export const INITIAL_TARGETS: TargetItem[] = [
  {
    id: 'target-1',
    profileName: 'Best You Shopping Deals',
    type: 'Page',
    videoPath: SAMPLE_VIDEOS[0].path,
    videoName: SAMPLE_VIDEOS[0].name,
    caption: '🔥 Must-have gadgets you need to see this week! 📦 Link in bio to shop now. #viral #reels #gadgets #shopping #trending',
    date: todayStr,
    time: getNextTimeStr(2),
    status: 'pending',
    pageId: '10849201948201',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'target-2',
    profileName: '@bestyoushop_official',
    type: 'Instagram',
    videoPath: SAMPLE_VIDEOS[1].path,
    videoName: SAMPLE_VIDEOS[1].name,
    caption: 'Start your morning with focus and determination. 💯 Drop a ❤️ if you agree! #motivation #reelsvideo #entrepreneur #mindset',
    date: todayStr,
    time: getNextTimeStr(5),
    status: 'pending',
    pageId: 'ig_9482049182',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'target-3',
    profileName: 'Daily Tech Trends FB Page',
    type: 'Page',
    videoPath: SAMPLE_VIDEOS[2].path,
    videoName: SAMPLE_VIDEOS[2].name,
    caption: 'Wait till the end to see how this works! 😱 What do you think? Comment below 👇 #technews #futuretech #viralfb #fbreels',
    date: todayStr,
    time: getNextTimeStr(8),
    status: 'pending',
    pageId: '1984029482019',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'target-4',
    profileName: 'Global Dropshipping Hub',
    type: 'Group',
    videoPath: SAMPLE_VIDEOS[3].path,
    videoName: SAMPLE_VIDEOS[3].name,
    caption: 'Top 3 productivity hacks that save 10 hours every single week! Share with your team. #businessgrowth #productivity #marketing',
    date: todayStr,
    time: getNextTimeStr(12),
    status: 'pending',
    pageId: 'grp_8492019482',
    createdAt: new Date().toISOString(),
  },
];

export const SAMPLE_LOGS: SystemLog[] = [
  {
    id: 'log-001',
    timestamp: new Date(Date.now() - 360000).toISOString(),
    level: 'INFO',
    message: 'System Engine initialized. Graph API v19.0 client initialized with App Credentials.',
  },
  {
    id: 'log-002',
    timestamp: new Date(Date.now() - 300000).toISOString(),
    level: 'INFO',
    message: 'Loaded session cookies for c_user=61561547737841. Verified authentication tokens valid.',
  },
  {
    id: 'log-003',
    timestamp: new Date(Date.now() - 240000).toISOString(),
    level: 'SUCCESS',
    message: 'Auto-fetched 4 managed Facebook Pages and 1 linked Instagram Business Profile.',
  },
  {
    id: 'log-004',
    timestamp: new Date(Date.now() - 120000).toISOString(),
    level: 'RPA',
    message: 'Standby mode active. Awaiting user to Arm Background Real-Time Scheduler or launch RPA.',
  },
];
