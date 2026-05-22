import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');

function read(path) {
  return readFileSync(resolve(root, path), 'utf8');
}

function assertIncludes(file, text, description) {
  const content = read(file);
  if (!content.includes(text)) {
    throw new Error(`${description}：${file} 缺少 ${JSON.stringify(text)}`);
  }
}

function assertMatches(file, pattern, description) {
  const content = read(file);
  if (!pattern.test(content)) {
    throw new Error(`${description}：${file} 未匹配 ${pattern}`);
  }
}

assertIncludes(
  'src/app/model.ts',
  'openCaptureEntry',
  '拍摄入口必须走统一登录拦截，不能直接切到 capture',
);
assertIncludes(
  'src/pages/camera/CameraPage.vue',
  'camera-login-gate',
  '未登录访问拍摄页时需要展示 APP 5.26.0 的登录前置页',
);
assertIncludes(
  'src/pages/profile/ProfilePage.vue',
  'isLoggedIn',
  '我的页需要区分真实登录、演示模式和未登录态',
);
assertIncludes(
  'src/pages/profile/ProfilePage.vue',
  '当前账号未登录',
  '我的页未登录态需要对齐 APP 空状态文案',
);
assertIncludes(
  'src/pages/profile/ProfilePage.vue',
  '口令福利',
  '我的页快捷入口需要补齐 APP 5.26.0 的口令福利',
);
assertIncludes(
  'src/pages/coloring/ColoringPage.vue',
  '入门·水果蔬菜',
  '涂色页分组标题需要对齐 APP 5.26.0',
);
assertIncludes(
  'src/pages/coloring/ColoringPage.vue',
  '待开始',
  '涂色页进度状态需要对齐 APP 5.26.0',
);
assertMatches(
  'src/pages/home/HomePage.vue',
  /<span>开通会员<\/span>/,
  '首页会员入口需要使用 APP 黑色 pill 文案',
);
assertMatches(
  'src/pages/inspiration/InspirationPage.vue',
  /compactNumber\(Math\.min\(post\.remakes,\s*99\)\)/,
  '灵感页做同款次数需要先压到 APP 首屏量级，避免 H5 过大的历史统计破坏对照',
);

console.info('latest APK diff fix contract passed');
