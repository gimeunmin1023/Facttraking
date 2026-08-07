// index.html 안의 엔진 블록만 떼어내 node 에서 그대로 실행한다.
// 엔진은 단일 소스이며 여기서 복제하지 않는다.
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const START = '/* ==FACTTRACE-ENGINE-START== */';
const END = '/* ==FACTTRACE-ENGINE-END== */';
const a = html.indexOf(START), b = html.indexOf(END);
if (a < 0 || b < 0) { console.error('엔진 블록을 찾지 못했습니다.'); process.exit(1); }

const code = html.slice(a + START.length, b);
new Function(code).call(globalThis);
const FT = globalThis.FT;

let fail = 0;
const res = FT.selftest();
fail += res.total - res.pass;

// --- 회귀: 기존 facttrace 내보내기(구버전 스키마)가 그대로 읽히는가 ---
const legacyPath = path.join(__dirname, 'fixtures', 'legacy-demo.json');
if (fs.existsSync(legacyPath)) {
  const d = JSON.parse(fs.readFileSync(legacyPath, 'utf8'));
  const model = { locations: FT.LOCATION_SEED, entities: FT.ENTITY_SEED, duration: 300 };
  const claims = d.claims.map(c => FT.upgradeClaim(c, model));
  const out = FT.analyze(claims, model);

  const t = [];
  const ok = (n, c) => t.push({ name: n, pass: !!c });

  ok('구버전 14건 전부 승격', claims.length === 14);
  ok('B2 책상 부인으로 해석', (() => {
    const c = claims.find(x => x.id === 'B2');
    return c && c.kind === 'denial' && c.locationId === 'L_DESK' && c.polarity === 'no';
  })());
  ok('B5 책상 구역으로 해석', (() => {
    const c = claims.find(x => x.id === 'B5');
    return c && c.locationId === 'L_DESK';
  })());
  ok('B2↔B5 모순 재검출', out.conflicts.some(c =>
    !c.gapOnly && [c.a.id, c.b.id].sort().join() === 'B2,B5'));
  ok('B 미설명 50초 재현', out.gaps.B === 50);
  ok('A·C 미설명 시간 없음', out.gaps.A === 0 && out.gaps.C === 0);
  ok('용의 순위 1위는 B', out.scores[0].speaker === 'B');
  ok('B 통일성이 가장 낮음',
    out.scores.every(s => s.speaker === 'B' || s.stage1.unity > out.scores.find(x => x.speaker === 'B').stage1.unity));

  t.forEach(x => { console.log((x.pass ? 'PASS  ' : 'FAIL  ') + x.name); if (!x.pass) fail++; });
  console.log(t.filter(x => x.pass).length + '/' + t.length + ' passed  (legacy regression)');
}

// --- 시나리오: 세 사람이 돈 위치를 다르게 말한다 (기존 데모가 못 잡던 것) ---
const samplePath = path.join(__dirname, '..', 'samples', 'case-money.json');
if (fs.existsSync(samplePath)) {
  const d = JSON.parse(fs.readFileSync(samplePath, 'utf8'));
  const model = { locations: d.locations || FT.LOCATION_SEED, entities: d.entities || FT.ENTITY_SEED, duration: d.duration || 300 };
  const claims = d.claims.map(c => FT.upgradeClaim(c, model));
  const out = FT.analyze(claims, model);

  const t = [];
  const ok = (n, c) => t.push({ name: n, pass: !!c });
  const r2 = out.conflicts.filter(c => c.rule.indexOf('R2') === 0);
  const r3 = out.conflicts.filter(c => c.rule.indexOf('R3') === 0);

  ok('R2 돈 위치 교차 모순 검출', r2.length >= 2);
  ok('R2 는 hard 로 뜬다', r2.every(c => c.severity === 'hard'));
  ok('R3 목격 대 부인 검출', r3.length >= 1);
  ok('물증과 충돌한 건은 R7 가중', out.conflicts.some(c => c.rule.indexOf('/R7') > 0));
  ok('용의 순위 1위는 B', out.scores[0].speaker === 'B');
  ok('1위와 2위가 유의미하게 벌어짐', out.scores[0].suspicion - out.scores[1].suspicion >= 5);

  t.forEach(x => { console.log((x.pass ? 'PASS  ' : 'FAIL  ') + x.name); if (!x.pass) fail++; });
  console.log(t.filter(x => x.pass).length + '/' + t.length + ' passed  (money scenario)');
  console.log('\n순위: ' + out.scores.map(s => s.speaker + ' ' + s.suspicion).join('  |  '));
  console.log('모순: ' + out.conflicts.map(c => c.rule + '(' + c.sev + ')').join(' '));
}

process.exit(fail ? 1 : 0);
