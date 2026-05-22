import assert from 'node:assert/strict';
import test from 'node:test';
import { buildHomeAiHashRoute, parseHomeAiHashRoute } from './navigation.mjs';

test('parseHomeAiHashRoute maps native feature routes to design page', () => {
  assert.deepEqual(parseHomeAiHashRoute('#/default'), {
    page: 'design',
    featureCode: 'interior',
    nativePath: 'default',
  });
  assert.deepEqual(parseHomeAiHashRoute('#/default?featureCode=living_room'), {
    page: 'design',
    featureCode: 'living_room',
    nativePath: 'default',
  });
  assert.deepEqual(parseHomeAiHashRoute('#/func_splash?featureCode=renovation'), {
    page: 'design',
    featureCode: 'renovation',
    nativePath: 'func_splash',
  });
  assert.deepEqual(parseHomeAiHashRoute('#/single_category?featureCode=garden'), {
    page: 'design',
    featureCode: 'garden',
    nativePath: 'single_category',
  });
});

test('parseHomeAiHashRoute maps standalone pages and invalid hash safely', () => {
  assert.deepEqual(parseHomeAiHashRoute('#/mine'), { page: 'mine' });
  assert.deepEqual(parseHomeAiHashRoute('#/api-debug'), { page: 'api-debug' });
  assert.deepEqual(parseHomeAiHashRoute('#/%'), { page: 'home' });
});

test('buildHomeAiHashRoute keeps feature route semantics', () => {
  assert.equal(buildHomeAiHashRoute({ page: 'design', featureCode: 'living_room' }), '#/default?featureCode=living_room');
  assert.equal(buildHomeAiHashRoute({ page: 'design', featureCode: 'bedroom' }), '#/default?featureCode=bedroom');
  assert.equal(buildHomeAiHashRoute({ page: 'design', featureCode: 'floor_plan' }), '#/template_list?featureCode=floor_plan');
  assert.equal(buildHomeAiHashRoute({ page: 'discover' }), '#/discover');
  assert.equal(buildHomeAiHashRoute({ page: 'home' }), '#/');
});
