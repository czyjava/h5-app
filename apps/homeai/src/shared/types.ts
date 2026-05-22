export type MainTab = 'home' | 'design' | 'discover' | 'mine';

export interface DesignFeature {
  code: string;
  title: string;
  subtitle: string;
  route: string;
  accent: string;
  guideImage: string;
  badImage?: string;
  homeImage?: string;
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

export interface DiscoverImageItem {
  id: string;
  title: string;
  coverUrl: string;
}

export interface DiscoverSection {
  key: string;
  title: string;
  items: DiscoverImageItem[];
}

export interface DiscoverTab {
  key: 'interior' | 'exterior';
  label: string;
  sections: DiscoverSection[];
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
  discoverTabs: DiscoverTab[];
  works: WorkItem[];
  user: UserSummary;
}

export interface HomeAiApiState {
  mode: 'demo' | 'live';
  environmentLabel: string;
  lastError: string;
}
