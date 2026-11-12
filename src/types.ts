export type TargetType = 'Page' | 'Profile' | 'Instagram' | 'Group';

export interface TargetItem {
  id: string;
  profileName: string;
  type: TargetType;
  videoPath: string;
  videoName?: string;
  caption: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  pageId?: string;
  pageToken?: string;
  pageUrl?: string;
  avatarUrl?: string;
  createdAt: string;
  lastExecutionProof?: string;
}

export interface AccountItem {
  id: string;
  nickname: string;
  c_user: string;
  rawCookie: string;
  status: 'active' | 'verified' | 'unverified' | 'expired';
  pagesCount: number;
  addedAt: string;
  lastVerified?: string;
}

export interface RealFetchedPage {
  id: string;
  name: string;
  category: string;
  pageToken?: string;
  link?: string;
  picture?: string;
  instagramAccount?: {
    id: string;
    username: string;
  } | null;
}

export interface SystemLog {
  id: string;
  timestamp: string;
  level: 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR' | 'RPA';
  message: string;
  target?: string;
}

export interface FbApiConfig {
  appId: string;
  appSecret: string;
  accessToken: string | null;
  tokenType?: string;
  isValid: boolean;
}

export interface SavedSession {
  id: string;
  nickname: string;
  c_user: string;
  source: 'mobile_app' | 'mobile_browser' | 'system_chrome' | 'cookie_vault';
  cookies: string;
  accessToken?: string;
  savedAt: string;
  lastUsed: string;
  isActive: boolean;
  avatarUrl?: string;
}

export interface HumanBehaviorConfig {
  enabled: boolean;
  typingDelayMinMs: number;
  typingDelayMaxMs: number;
  thinkingPauseSeconds: number;
  warmUpFeedScroll: boolean;
  interPostCooldownSeconds: number;
  antiBotStealthFlags: boolean;
  persistentProfileSave: boolean;
  randomMouseJitter: boolean;
}

