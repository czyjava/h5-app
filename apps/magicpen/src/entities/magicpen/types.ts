export type AppTab = 'home' | 'inspiration' | 'capture' | 'coloring' | 'profile';

export type ApiMode = 'live';

export interface ApiStatus {
  mode: ApiMode;
  host: string;
  signed: boolean;
  tokenReady: boolean;
  source: 'pending' | 'live' | 'partial' | 'error';
  endpointCount: number;
  message: string;
  loadedAt: string;
}

export interface MediaAsset {
  url: string;
  type: 'image' | 'video';
  alt: string;
}

export interface HomeCard {
  id: string;
  title: string;
  subtitle: string;
  badge?: string;
  theme: 'scan' | 'teach' | 'beads' | 'magic' | 'adventure';
  thumbnails: MediaAsset[];
  tags: string[];
  templateCode?: string;
  price?: number;
}

export interface InspirationChannel {
  key: string;
  label: string;
}

export interface InspirationPost {
  id: string;
  author: string;
  authorAvatar: MediaAsset;
  channel: string;
  cover: MediaAsset;
  remakes: number;
  liked: boolean;
  hot?: boolean;
  templateTitle: string;
  templateCode?: string;
  templatePrice: number;
}

export interface ColoringCard {
  id: string;
  title: string;
  image: MediaAsset;
  locked: boolean;
  price: number;
}

export interface InteractiveScene {
  id: string;
  title: string;
  description: string;
  cover: MediaAsset;
  progress: {
    done: number;
    total: number;
  };
}

export interface UserWork {
  id: string;
  title: string;
  cover: MediaAsset;
  kind: 'video' | 'photo';
  satisfied: boolean;
}

export interface DiamondBillItem {
  id: string;
  title: string;
  time: string;
  amount: number;
  type: 'in' | 'out';
}

export interface UserProfile {
  nickname: string;
  avatar: string;
  diamonds: number;
  vipExpire: string;
  level: string;
}

export interface MagicPenSnapshot {
  apiStatus: ApiStatus;
  homeCards: HomeCard[];
  channels: InspirationChannel[];
  posts: InspirationPost[];
  coloringCards: ColoringCard[];
  interactiveScenes: InteractiveScene[];
  works: UserWork[];
  tokenBills: DiamondBillItem[];
  profile: UserProfile;
}
