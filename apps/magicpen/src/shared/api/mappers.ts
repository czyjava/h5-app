import type {
  ColoringCard,
  DiamondBillItem,
  HomeCard,
  InspirationChannel,
  InspirationPost,
  InteractiveScene,
  MediaAsset,
  UserProfile,
  UserWork,
} from '@/entities/magicpen/types';
import { createEmptyProfile } from '@/shared/api/emptySnapshot';

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as UnknownRecord) : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function responseData(response: unknown): unknown {
  return asRecord(response).data;
}

function getMediaUrl(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  const record = asRecord(value);
  const image = asRecord(record.image);
  const cover = asRecord(record.cover);
  const video = asRecord(record.video);
  return (
    asString(record.url) ||
    asString(image.small) ||
    asString(cover.small) ||
    asString(record.small) ||
    asString(image.large) ||
    asString(cover.large) ||
    asString(record.large) ||
    asString(video.small) ||
    asString(video.url)
  );
}

function media(value: unknown, alt: string): MediaAsset {
  return {
    url: getMediaUrl(value),
    type: 'image',
    alt,
  };
}

function firstMediaSource(candidates: unknown[]) {
  return candidates.find((candidate) => Boolean(getMediaUrl(candidate))) ?? candidates[0];
}

function tagMatches(value: unknown, target: string) {
  return asArray(value).some((item) => {
    if (typeof item === 'string') {
      return item === target;
    }
    const record = asRecord(item);
    return record.tagKey === target || record.displayValue === target;
  });
}

function communityPostCover(record: UnknownRecord) {
  const dynamicCover = asRecord(record.coverDynamic);
  const mediaList = asArray(record.mediaList);

  // 原 APP 社区流的视频和图片封面分布在不同结构里，按静态封面、视频首帧、单图、媒体列表的优先级取第一个可展示资源。
  return firstMediaSource([
    record.coverStatic,
    asRecord(dynamicCover.singleVideo),
    asRecord(dynamicCover.singleImage),
    mediaList[0],
    record.cover,
    record.material,
    record.work,
  ]);
}

function parseHomeDescription(value: unknown) {
  const emptyDescription = { description: '', subtitles: [] as string[], topRightIcon: '' };
  try {
    const parsed = JSON.parse(asString(value, '{}'));
    return {
      description: asString(parsed.description),
      subtitles: asArray(parsed.subtitles).map((item) => asString(item)).filter(Boolean),
      topRightIcon: asString(parsed.topRightIcon),
    };
  } catch {
    return emptyDescription;
  }
}

function themeByTitle(title: string): HomeCard['theme'] {
  if (title.includes('扫描')) return 'scan';
  if (title.includes('教')) return 'teach';
  if (title.includes('拼豆')) return 'beads';
  if (title.includes('马良')) return 'magic';
  return 'adventure';
}

function queryValueFromUrl(value: unknown, key: string) {
  const rawUrl = asString(value);
  if (!rawUrl) {
    return '';
  }
  try {
    return new URL(rawUrl, 'https://nav.wanmeixiangsu.cn').searchParams.get(key) ?? '';
  } catch {
    // jumpLink 有时来自运营配置，解析失败时只跳过该字段，不影响卡片展示。
    return '';
  }
}

export function mapRecommendList(response: unknown): HomeCard[] {
  const data = asArray(responseData(response));
  return data.map((item, index) => {
    const record = asRecord(item);
    const title = asString(record.name, asString(record.title, `功能 ${index + 1}`));
    const desc = parseHomeDescription(record.description);
    const thumbnails = asArray(record.outMaterial).map((materialItem) => media(materialItem, title));
    const jumpLink = asString(record.jumpLink);
    const templateCode = asString(record.templateCode, queryValueFromUrl(jumpLink, 'templateCode'));
    return {
      id: asString(record.recommendCode, asString(record.code, templateCode || `home-${index}`)),
      title,
      subtitle: desc.description,
      badge: desc.topRightIcon ? '限时免费' : undefined,
      theme: themeByTitle(title),
      thumbnails,
      tags: desc.subtitles,
      templateCode,
      price: asNumber(record.price, 0),
    } satisfies HomeCard;
  });
}

export function mapCommunityChannels(response: unknown): InspirationChannel[] {
  const items = asArray(asRecord(responseData(response)).itemList);
  return items.map((item, index) => {
    const record = asRecord(item);
    return {
      key: asString(record.channelKey, `channel-${index}`),
      label: asString(record.displayName, asString(record.name, `频道 ${index + 1}`)),
    };
  });
}

export function mapCommunityPosts(response: unknown): InspirationPost[] {
  const data = responseData(response);
  const items = asArray(asRecord(data).itemList).length ? asArray(asRecord(data).itemList) : asArray(data);
  return items.map((item, index) => {
    const record = asRecord(item);
    const author = asRecord(record.author);
    const cover = communityPostCover(record);
    const title = asString(record.templateName, asString(record.title, `作品 ${index + 1}`));
    return {
      id: asString(record.postKey, asString(record.code, `post-${index}`)),
      author: asString(author.nickname, asString(record.nickname, '')),
      authorAvatar: media(author.avatar, `${asString(author.nickname, '作者')}头像`),
      channel: asString(record.channelKey, ''),
      cover: media(cover, title),
      remakes: asNumber(record.useCount, asNumber(record.remakeCount, 0)),
      liked: asBoolean(record.liked, asBoolean(record.likedByCurrentUser, asBoolean(record.favoritedByCurrentUser))),
      hot: tagMatches(record.tags, '热门') || tagMatches(record.tags, 'hot'),
      templateTitle: title,
      templateCode: asString(record.templateCode),
      templatePrice: asNumber(record.price, 0),
    } satisfies InspirationPost;
  });
}

export function mapColoringCards(response: unknown): ColoringCard[] {
  const groups = asArray(asRecord(responseData(response)).materialGroup);
  const firstGroup = asRecord(groups[0]);
  return asArray(firstGroup.items).map((item, index) => {
    const record = asRecord(item);
    const title = asString(record.desc, asString(record.name, `涂色卡 ${index + 1}`));
    const price = asNumber(record.price, 0);
    const status = asNumber(record.status, 1);
    return {
      id: asString(record.itemCode, asString(record.code, `color-${index}`)),
      title,
      image: media(record.image, `${title}线稿`),
      locked: status !== 1 && price > 0,
      price,
    } satisfies ColoringCard;
  });
}

export function mapInteractiveModels(response: unknown): InteractiveScene[] {
  const items = asArray(asRecord(responseData(response)).itemList);
  return items.map((item, index) => {
    const record = asRecord(item);
    const title = asString(record.name, asString(record.title, `互动场景 ${index + 1}`));
    return {
      id: asString(record.code, `scene-${index}`),
      title,
      description: asString(record.description),
      cover: media(record.displayVideo || record.coverImage, title),
      progress: {
        done: asNumber(record.finishedCount, 0),
        total: asNumber(record.totalCount, 0),
      },
    } satisfies InteractiveScene;
  });
}

export function mapGenerationList(response: unknown): UserWork[] {
  return asArray(responseData(response)).map((item, index) => {
    const record = asRecord(item);
    const title = asString(record.name, asString(record.title, `作品 ${index + 1}`));
    const workType = asNumber(record.workType, 2);
    return {
      id: asString(record.code, asString(record.workCode, `work-${index}`)),
      title,
      cover: media(record.cover, title),
      kind: workType === 2 ? 'video' : 'photo',
      satisfied: Boolean(record.satisfied),
    } satisfies UserWork;
  });
}

function formatBillTime(value: unknown) {
  const time = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(time) || time <= 0) {
    return '';
  }
  const date = new Date(time);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  const hour = `${date.getHours()}`.padStart(2, '0');
  const minute = `${date.getMinutes()}`.padStart(2, '0');
  const second = `${date.getSeconds()}`.padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

export function mapTokenBills(response: unknown): DiamondBillItem[] {
  const data = responseData(response);
  const items = asArray(data).length ? asArray(data) : asArray(asRecord(data).itemList);
  return items.map((item, index) => {
    const record = asRecord(item);
    const rawAmount = asNumber(record.amount, asNumber(record.value, 0));
    const type = asString(record.type).toUpperCase() === 'OUT' ? 'out' : 'in';
    const signedAmount = type === 'out' ? -Math.abs(rawAmount) : Math.abs(rawAmount);
    const time = formatBillTime(record.tradeTime || record.createTime || record.time);
    return {
      id: asString(record.billNo, asString(record.code, `${time || 'bill'}-${index}`)),
      title: asString(record.remark, asString(record.title, '钻石变动')),
      time,
      amount: signedAmount,
      type,
    } satisfies DiamondBillItem;
  });
}

export function mapProfile(balanceResponse: unknown, renewalResponse: unknown, currentUserResponse?: unknown): UserProfile {
  const balanceData = asRecord(responseData(balanceResponse));
  const renewalData = asRecord(responseData(renewalResponse));
  const currentData = asRecord(responseData(currentUserResponse));
  const currentUserInfo = asRecord(currentData.userInfo);
  // 登录态昵称和头像来自认证域 current-user，余额/会员信息仍来自业务域接口。
  const currentProfile = Object.keys(currentUserInfo).length ? currentUserInfo : currentData;
  return {
    ...createEmptyProfile(),
    nickname: asString(currentProfile.nickname, asString(balanceData.nickname, asString(renewalData.nickname))),
    avatar: asString(currentProfile.avatar, asString(balanceData.avatar, asString(renewalData.avatar))),
    diamonds: asNumber(balanceData.balance, asNumber(balanceData.amount, asNumber(balanceData.value, 0))),
    vipExpire: asString(renewalData.vipExpireDate, asString(renewalData.expireDate)),
    level: asString(currentProfile.level, asString(balanceData.level, asString(renewalData.level))),
  };
}
