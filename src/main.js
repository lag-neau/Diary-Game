import { parseScript, check } from './script.js';
import { createStage } from './stage.js';
import { createDiary } from './diary.js';
import { load, save, clear } from './save.js';

const $ = (s) => document.querySelector(s);
const STORY = ['story/day1.txt'];
const TYPE_MS = 32;

const stage = createStage({
  stageEl: $('#stage'), rainEl: $('#rain'), fadeEl: $('#fade'),
  hudTimeEl: $('#hud-time'), talkEl: $('#talk'),
});
const diary = createDiary($('#diary'));

let script = null;
let state = null; // { pc, flags:Set, erased:[{day,id}], day }
let busy = false;

/* ---------- 대화창 ---------- */
const box = $('#box'), whoEl = $('#who'), lineEl = $('#line'), choicesEl = $('#choices');
let advance = null;   // 탭하면 실행
let typing = null;

function type(text) {
  return new Promise((resolve) => {
    let i = 0;
    lineEl.textContent = '';
    box.classList.remove('wait');
    const chars = [...text];
    const tick = () => {
      i++;
      lineEl.textContent = chars.slice(0, i).join('');
      if (i < chars.length) typing = setTimeout(tick, chars[i - 1] === '.' || chars[i - 1] === '…' ? TYPE_MS * 4 : TYPE_MS);
      else { typing = null; resolve(); }
    };
    typing = setTimeout(tick, TYPE_MS);
    advance = () => { clearTimeout(typing); typing = null; lineEl.textContent = text; resolve(); };
  });
}

async function show(who, text) {
  box.classList.toggle('narr', !who);
  whoEl.textContent = who || '';
  choicesEl.innerHTML = '';
  await type(text);
  box.classList.add('wait');
  await new Promise((resolve) => { advance = resolve; });
  box.classList.remove('wait');
  advance = null;
}

function ask(options) {
  return new Promise((resolve) => {
    box.classList.remove('wait');
    choicesEl.innerHTML = '';
    options.forEach((o, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'choice';
      b.textContent = o.text;
      b.addEventListener('click', (ev) => { ev.stopPropagation(); choicesEl.innerHTML = ''; resolve(o); });
      choicesEl.appendChild(b);
      if (i === 0) setTimeout(() => b.focus({ preventScroll: true }), 30);
    });
    advance = null;
  });
}

function tap() { if (advance) advance(); }
$('#game').addEventListener('click', (e) => { if (!e.target.closest('.hud-btn')) tap(); });
addEventListener('keydown', (e) => {
  if (!$('#title').hidden || !$('#diary').hidden || !$('#ending').hidden) return;
  if ((e.key === ' ' || e.key === 'Enter') && !e.target.closest('button')) { e.preventDefault(); tap(); }
});

/* ---------- 실행 ---------- */
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function persist() {
  const st = stage.state;
  save({
    pc: state.pc, flags: [...state.flags], erased: state.erased, day: state.day,
    scene: st.scene, time: st.time, cast: st.cast, rain: st.rain, ended: !!state.ended,
  });
}

async function run() {
  if (busy) return;
  busy = true;
  const { nodes, labels } = script;
  while (state.pc < nodes.length) {
    const nd = nodes[state.pc++];
    if (nd.type === 'label') { persist(); continue; }
    if (nd.type === 'say') { await show(nd.who, nd.text); continue; }
    if (nd.type === 'choice') {
      const o = await ask(nd.options);
      o.flags.forEach(f => state.flags.add(f));
      state.pc = labels[o.go];
      continue;
    }
    const a = nd.args;
    switch (nd.cmd) {
      case '글': await show('', nd.rest); break;
      case '장면': box.style.visibility = 'hidden'; await stage.set(a[0], a[1] || '낮', a.slice(2)); box.style.visibility = ''; break;
      case '날': state.day = Number(a[0]); stage.setDay(state.day); break;
      case '비': stage.rain(a[0] !== '끄기'); break;
      case '흔들림': await stage.shake(); break;
      case '쉬기': await sleep(Number(a[0] || 1) * 1000); break;
      case '깃발': a.forEach(f => state.flags.add(f)); break;
      case '이동': state.pc = labels[a[0]]; break;
      case '만약': {
        const [cond, go] = nd.rest.split('->').map(s => s.trim());
        if (check(cond, state.flags)) state.pc = labels[go];
        break;
      }
      case '일기': await openDiary(nd.rest); break;
      case '아침결과': await morning(); break;
      case '끝': state.ended = true; persist(); busy = false; return showEnding();
      default: console.warn(`모르는 명령: @${nd.cmd} (${nd.line}번째 줄)`);
    }
  }
  busy = false;
}

async function openDiary(weather) {
  const lines = script.diary.filter(d => check(d.cond, state.flags));
  $('#talk').style.visibility = 'hidden';
  const picked = await diary.open({ day: state.day, weather, lines });
  state.erased.push({ day: state.day, id: picked.id, text: picked.text, after: picked.after });
  $('#talk').style.visibility = '';
  await show('', '…잠이 쏟아졌다.');
}

async function morning() {
  const last = state.erased[state.erased.length - 1];
  if (!last) return;
  for (const part of last.after.split('//').map(s => s.trim()).filter(Boolean)) await show('', part);
}

function showEnding() {
  const last = state.erased[state.erased.length - 1];
  $('#ending-kicker').textContent = '첫째 날 끝';
  $('#ending-title').textContent = '지운 줄';
  $('#ending-body').textContent = last
    ? `“${last.text}”\n\n다른 줄을 지우면 다른 아침이 와요.\n2일째는 지금 만드는 중이에요.`
    : '2일째는 지금 만드는 중이에요.';
  $('#ending').hidden = false;
}

/* ---------- 제목 화면 ---------- */
async function start(fresh) {
  const saved = load();
  if (fresh || !saved) {
    clear();
    state = { pc: 0, flags: new Set(), erased: [], day: 1 };
    await stage.restore({ scene: '검정', time: 'night', day: 1 });
  } else {
    state = { pc: saved.pc, flags: new Set(saved.flags), erased: saved.erased || [], day: saved.day || 1, ended: saved.ended };
    await stage.restore(saved);
    if (saved.ended) { $('#title').hidden = true; return showEnding(); }
  }
  $('#title').hidden = true;
  $('#ending').hidden = true;
  run();
}

function showTitle() {
  if (typing) clearTimeout(typing);
  const saved = load();
  $('#btn-continue').hidden = !saved;
  $('#title').hidden = false;
  $('#ending').hidden = true;
}

$('#btn-new').addEventListener('click', () => start(true));
$('#btn-continue').addEventListener('click', () => start(false));
$('#btn-again').addEventListener('click', () => start(true));
$('#btn-home').addEventListener('click', () => { clear(); showTitle(); });
$('#to-title').addEventListener('click', (e) => { e.stopPropagation(); location.reload(); });

async function boot() {
  try {
    const texts = await Promise.all(STORY.map(f => fetch(f, { cache: 'no-cache' }).then(r => { if (!r.ok) throw new Error(`${f}를 못 읽었어요`); return r.text(); })));
    script = parseScript(texts.join('\n'), STORY.join(', '));
  } catch (err) {
    document.body.innerHTML = `<pre style="padding:20px;font:16px/1.5 monospace;white-space:pre-wrap">대본 오류\n${err.message}</pre>`;
    throw err;
  }
  await document.fonts.load("24px 'Gaegu'").catch(() => {});
  showTitle();
}
boot();
