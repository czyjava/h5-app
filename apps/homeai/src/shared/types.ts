export type MainTab = 'home' | 'design' | 'discover' | 'mine';

export interface DesignFeature {
  code: string;
  title: string;
  subtitle: string;
  route: string;
  accent: string;
  guideImage: string;
  badImage?: string;
  icon: string;
}

export interface DiscoverItem {
  title: string;
  subtitle: string;
  coverUrl: string;
  tag: string;
  buildingType: string;
  spaceType: string;
}

export interface WorkItem {
  id: string;
  title: string;
  status: string;
  coverUrl: string;
  createdAt?: string;
}

export interface UserSummary {
  nickname: string;
  userId: string;
  diamondCount: number;
  vipLabel: string;
}

export interface HomeAiSnapshot {
  banners: string[];
  features: DesignFeature[];
  discover: DiscoverItem[];
  works: WorkItem[];
  user: UserSummary;
}

export interface HomeAiApiState {
  mode: 'demo' | 'live';
  environmentLabel: string;
  lastError: string;
}
