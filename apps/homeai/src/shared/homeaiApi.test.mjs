import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeHomeAiSnapshot } from './homeaiMappers.mjs';

test('normalizeHomeAiSnapshot maps user, work, and discover payloads with fallbacks', () => {
  const snapshot = normalizeHomeAiSnapshot({
    user: { nickname: '设计师', userId: 42, credit: 18, vipName: 'VIP 体验' },
    generationList: {
      list: [
        {
          recordCode: 'r1',
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
  assert.equal(snapshot.works[0].coverUrl, 'https://cdn.example.com/a.png');
  assert.equal(snapshot.works[0].status, 'FINISHED');
  assert.equal(snapshot.discover[0].tag, '室内');
});

test('normalizeHomeAiSnapshot keeps native empty mine defaults without account payload', () => {
  const snapshot = normalizeHomeAiSnapshot();

  assert.equal(snapshot.user.nickname, '沉愿');
  assert.equal(snapshot.user.diamondCount, 0);
  assert.deepEqual(snapshot.works, []);
});
