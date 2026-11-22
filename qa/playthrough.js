// 1일째 자동 플레이 점검: node qa/playthrough.js <주소> <결과폴더> <폰|컴퓨터> <선택1|선택2|...> <지울줄번호>
const { chromium } = require('playwright');
const [url, out, device = '폰', picks = '', eraseIdx = '2'] = process.argv.slice(2);
const vp = device === '폰' ? { width: 390, height: 844 } : { width: 1280, height: 800 };
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: vp, deviceScaleFactor: 1, hasTouch: device === '폰' });
  const errors = [];
  p.on('pageerror', e => errors.push(e.message));
  p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()); });
  await p.goto(url, { waitUntil: 'networkidle' });
  await p.evaluate(() => localStorage.clear());
  await p.reload({ waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: `${out}/${device}-00-제목.png` });
  await p.click('#btn-new');
  const plan = picks.split('|').filter(Boolean);
  let shot = 1, lastScene = '', log = [];
  for (let step = 0; step < 900; step++) {
    await p.waitForTimeout(150);
    const st = await p.evaluate(() => ({
      diary: !document.querySelector('#diary').hidden,
      ending: !document.querySelector('#ending').hidden,
      choices: [...document.querySelectorAll('.choice')].map(b => b.textContent),
      line: document.querySelector('#line').textContent,
      hud: document.querySelector('#hud-time').textContent,
      scene: document.querySelector('#stage').innerHTML.length + document.body.className,
      wait: document.querySelector('#box').classList.contains('wait'),
    }));
    if (st.ending) { await p.waitForTimeout(300); await p.screenshot({ path: `${out}/${device}-${String(shot++).padStart(2,'0')}-끝.png` }); log.push('[끝] ' + await p.textContent('#ending-body')); break; }
    if (st.diary) {
      await p.waitForTimeout(900);
      await p.screenshot({ path: `${out}/${device}-${String(shot++).padStart(2,'0')}-일기장.png` });
      const boxes = await p.$$eval('.entry canvas', cs => cs.map(c => { const r = c.getBoundingClientRect(); return [r.x, r.y, r.width, r.height]; }));
      // 먼저 지울 수 없는 첫 줄을 문질러 본다
      const rubOn = async (bx) => {
        const [x, y, w, h] = bx;
        await p.mouse.move(x + 5, y + 10); await p.mouse.down();
        for (let pass = 0; pass < 4; pass++) for (let yy = y + 6; yy < y + h; yy += 10) { await p.mouse.move(x + 5, yy, { steps: 2 }); await p.mouse.move(x + w - 5, yy, { steps: 12 }); }
        await p.mouse.up();
      };
      await rubOn(boxes[0]); await p.waitForTimeout(300);
      log.push('[고정 줄 문지름] ' + await p.textContent('#diary-hint'));
      await p.screenshot({ path: `${out}/${device}-${String(shot++).padStart(2,'0')}-미끄러짐.png` });
      // 절반만 문지르고 다른 줄로 옮기기
      const half = boxes[Number(eraseIdx) === 1 ? 2 : 1];
      await p.mouse.move(half[0] + 5, half[1] + 10); await p.mouse.down(); await p.mouse.move(half[0] + half[2] / 2, half[1] + 10, { steps: 10 }); await p.mouse.up();
      await rubOn(boxes[Number(eraseIdx)]);
      await p.waitForTimeout(400);
      await p.screenshot({ path: `${out}/${device}-${String(shot++).padStart(2,'0')}-지움.png` });
      await p.waitForTimeout(1600);
      continue;
    }
    if (st.choices.length) {
      const want = plan.shift();
      const pick = st.choices.find(c => c === want) || st.choices[0];
      await p.screenshot({ path: `${out}/${device}-${String(shot++).padStart(2,'0')}-선택.png` });
      log.push(`[선택] ${st.choices.join(' / ')} → ${pick}`);
      await p.click(`.choice >> text="${pick}"`);
      continue;
    }
    if (st.scene !== lastScene && st.wait) { lastScene = st.scene; await p.screenshot({ path: `${out}/${device}-${String(shot++).padStart(2,'0')}-${st.hud.replace(/ · /,'-') || '검정'}.png` }); }
    if (st.wait) { log.push(`  ${st.line}`); await p.click('#box'); }
  }
  console.log(log.join('\n'));
  console.log('오류:', errors.length ? errors : '없음');
  await b.close();
})();
