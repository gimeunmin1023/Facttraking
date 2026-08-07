// gaze/index.html 의 계산부만 떼어내 node 에서 실행한다. 코드는 한 곳에만 있다.
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'gaze', 'index.html'), 'utf8');
const A = '/* ==GAZE-CORE-START==', B = '/* ==GAZE-CORE-END== */';
const i = html.indexOf(A), j = html.indexOf(B);
if (i < 0 || j < 0) { console.error('계산부를 찾지 못했습니다.'); process.exit(1); }

new Function(html.slice(html.indexOf('*/', i) + 2, j)).call(globalThis);

const res = globalThis.GZ.selftest();
process.exit(res.pass === res.total ? 0 : 1);
