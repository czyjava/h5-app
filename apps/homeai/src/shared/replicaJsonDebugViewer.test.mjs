import assert from 'node:assert/strict';
import test from 'node:test';
import { redactJsonText } from '../../../../common/src/redaction.ts';
import { parseReplicaJsonBody } from '../../../../common/src/ui/replicaJsonBody.ts';

test('代理 JSON 响应体脱敏后仍保持可解析，避免调试面板退回原始文本', () => {
  const redacted = redactJsonText(
    JSON.stringify({
      data: {
        authToken: 'secret-token',
        createTime: 13800138000,
        contact: '请联系 13800138000',
      },
    }),
  );

  assert.equal(typeof redacted, 'string');
  const parsed = JSON.parse(redacted);
  assert.equal(parsed.data.authToken, '已脱敏');
  assert.equal(parsed.data.createTime, '手机号已脱敏');
  assert.equal(parsed.data.contact, '请联系 手机号已脱敏');
});

test('调试面板能容错解析历史事件里未加引号的手机号脱敏占位符', () => {
  const parsed = parseReplicaJsonBody(
    '{"data":{"records":[{"createTime":手机号已脱敏86,"finishTime":手机号已脱敏71,"text":"ok"}]}}',
  );

  assert.equal(parsed.parsed, true);
  assert.equal(parsed.repaired, true);
  assert.equal(parsed.value.data.records[0].createTime, '手机号已脱敏86');
  assert.equal(parsed.value.data.records[0].finishTime, '手机号已脱敏71');
});
