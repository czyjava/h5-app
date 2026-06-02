import assert from 'node:assert/strict';
import test from 'node:test';
import { mapGenerationDetail, normalizeHomeAiSnapshot } from './homeaiMappers.mjs';

test('normalizeHomeAiSnapshot maps user, work, and discover payloads', () => {
  const snapshot = normalizeHomeAiSnapshot({
    user: { nickname: '设计师', userId: 42, credit: 18, vipName: 'VIP 体验' },
    generationList: {
      list: [
        {
          recordCode: 'r1',
          templateId: 'tpl-1',
          templateName: '客厅改造',
          resultUrl: '//cdn.example.com/a.png',
          generationStatus: 'FINISHED',
        },
      ],
    },
    recommendList: {
      list: [
        {
          title: '现代客厅',
          coverUrl: 'https://cdn.example.com/b.png',
          tag: '室内',
        },
      ],
    },
  });

  assert.equal(snapshot.user.nickname, '设计师');
  assert.equal(snapshot.user.userId, '42');
  assert.equal(snapshot.user.diamondCount, 18);
  assert.equal(snapshot.user.vipActive, false);
  assert.equal(snapshot.works[0].id, 'r1');
  assert.equal(snapshot.works[0].recordId, 'r1');
  assert.equal(snapshot.works[0].templateId, 'tpl-1');
  assert.equal(snapshot.works[0].coverUrl, 'https://cdn.example.com/a.png');
  assert.equal(snapshot.works[0].status, 'FINISHED');
  assert.equal(snapshot.discover[0].tag, '室内');
});

test('normalizeHomeAiSnapshot shows logged-in status when current user has no vip label', () => {
  const snapshot = normalizeHomeAiSnapshot({
    user: {
      nickname: '洋娃娃的暖心',
      userId: 'user-1',
      avatar: '//cdn.example.com/avatar-small.jpg',
      largeAvatar: 'https://cdn.example.com/avatar-large.jpg',
      validDuration: 0,
    },
  });

  assert.equal(snapshot.user.nickname, '洋娃娃的暖心');
  assert.equal(snapshot.user.userId, 'user-1');
  assert.equal(snapshot.user.vipLabel, '已登录');
  assert.equal(snapshot.user.avatar, 'https://cdn.example.com/avatar-large.jpg');
  assert.equal(snapshot.user.vipActive, false);
});

test('normalizeHomeAiSnapshot ignores current-user vip-like fields for member state', () => {
  const snapshot = normalizeHomeAiSnapshot({
    user: { nickname: '会员用户', userId: 'vip-user', validDuration: 30, vipName: 'VIP 体验', vip: true },
  });

  assert.equal(snapshot.user.vipActive, false);
  assert.equal(snapshot.user.vipLabel, '已登录');
});

test('normalizeHomeAiSnapshot maps business permission as active member', () => {
  const snapshot = normalizeHomeAiSnapshot({
    user: { nickname: '会员用户', userId: 'vip-user' },
    userPermission: { hasPermission: true, permissionCodes: ['homeai_vip'], expireTime: 1780000000000 },
  });

  assert.equal(snapshot.user.vipActive, true);
  assert.equal(snapshot.user.vipLabel, 'VIP');
});

test('normalizeHomeAiSnapshot does not synthesize local business data when APIs are empty', () => {
  const snapshot = normalizeHomeAiSnapshot();

  assert.equal(snapshot.user.nickname, '未登录');
  assert.equal(snapshot.user.userId, '-');
  assert.equal(snapshot.user.diamondCount, 0);
  assert.deepEqual(snapshot.works, []);
  assert.deepEqual(snapshot.discover, []);
});

test('normalizeHomeAiSnapshot maps ai-app generation list cover object', () => {
  const snapshot = normalizeHomeAiSnapshot({
    generationList: {
      list: [
        {
          code: 'record-100',
          name: '奶油风客厅',
          templateCode: 'homeai_custom_design',
          status: 3,
          cover: {
            small: '//cdn.example.com/small.png',
            large: 'https://cdn.example.com/large.png',
          },
          createTime: '2026-06-01 10:00:00',
        },
      ],
    },
  });

  assert.equal(snapshot.works[0].id, 'record-100');
  assert.equal(snapshot.works[0].recordId, 'record-100');
  assert.equal(snapshot.works[0].sourceType, 'record');
  assert.equal(snapshot.works[0].templateId, 'homeai_custom_design');
  assert.equal(snapshot.works[0].title, '奶油风客厅');
  assert.equal(snapshot.works[0].status, 'FINISHED');
  assert.equal(snapshot.works[0].coverUrl, 'https://cdn.example.com/large.png');
  assert.equal(snapshot.works[0].createdAt, '2026-06-01 10:00:00');
});

test('mapGenerationDetail maps record detail work list into generation works', () => {
  const detail = mapGenerationDetail({
    code: 'record-200',
    name: '客厅定制设计',
    status: 3,
    templateCode: 'homeai_custom_design',
    createTime: '2026-06-01 11:00:00',
    cover: {
      large: 'https://cdn.example.com/record-cover.png',
    },
    workList: [
      {
        recordCode: 'record-200',
        workCode: 'work-a',
        name: '方案 A',
        content: {
          type: 'IMAGE',
          image: {
            large: 'https://cdn.example.com/work-a.png',
          },
        },
      },
      {
        recordCode: 'record-200',
        workCode: 'work-b',
        name: '方案 B',
        content: {
          type: 'IMAGE',
          image: {
            small: '//cdn.example.com/work-b-small.png',
          },
        },
      },
    ],
  });

  assert.equal(detail.recordId, 'record-200');
  assert.equal(detail.templateCode, 'homeai_custom_design');
  assert.equal(detail.works.length, 2);
  assert.deepEqual(
    detail.works.map((work) => [work.id, work.recordId, work.coverUrl]),
    [
      ['work-a', 'record-200', 'https://cdn.example.com/work-a.png'],
      ['work-b', 'record-200', 'https://cdn.example.com/work-b-small.png'],
    ],
  );
  assert.deepEqual(
    detail.works.map((work) => work.sourceType),
    ['work', 'work'],
  );
});
