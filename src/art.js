// 장면 그림. 모든 그림은 400×300 좌표 위에 그립니다.
// 한 물체(prop)는 "물감(채색) → 연필 선" 순서로 그려서, 앞에 있는 물체가 뒤의 선을 가립니다.

const C = (cx, cy, r) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0z`;
const E = (cx, cy, rx, ry) => `M${cx - rx} ${cy}a${rx} ${ry} 0 1 0 ${2 * rx} 0a${rx} ${ry} 0 1 0 ${-2 * rx} 0z`;
const R = (x, y, w, h) => `M${x} ${y}h${w}v${h}h${-w}z`;

/** parts: [[class, d], ...]
 *  opt.pen: true(채색 모양 그대로 선) | false | [d...] (선만 따로)
 *  opt.extraPen: 채색 모양 선에 더해 그릴 선
 *  opt.solid: 뒤의 선이 비치지 않게 밑칠
 *  opt.at: [x, y] 위치 이동
 *  opt.raw: 마지막에 덧붙일 SVG */
function prop(parts, opt = {}) {
  const { pen = true, extraPen = [], solid = false, at = null, raw = '' } = opt;
  const paths = parts.map(([c, d]) => `<path class="${c}" d="${d}"/>`).join('');
  let penD = [];
  if (pen === true) penD = parts.filter(([c]) => c !== 'shadow').map(([, d]) => d);
  else if (Array.isArray(pen)) penD = pen;
  penD = penD.concat(extraPen);
  const under = solid ? `<g class="under">${parts.filter(([c]) => c !== 'shadow').map(([, d]) => `<path d="${d}"/>`).join('')}</g>` : '';
  const penSvg = penD.length ? `<g class="pen">${penD.map(d => `<path d="${d}"/>`).join('')}</g>` : '';
  const body = `${under}<g class="wc">${paths}</g>${penSvg}${raw}`;
  return at ? `<g transform="translate(${at[0]} ${at[1]})">${body}</g>` : body;
}

/* ---------- 사람 ---------- */
const KID_HEAD = [
  ['skin', C(0, -39, 7.5)],
  ['kidhair', 'M-8 -37q-1 -10 8 -10q9 0 8 10q0 3 -1.5 4l-1 -6q-5 -2 -11 0l-1 6q-1.5 -1 -1.5 -4z'],
  ['hat', 'M-11 -44q11 -3.5 22 0q-11 3 -22 0z M-6 -45q0 -6 6 -6q6 0 6 6z'],
  ['red', 'M-5.8 -46.4h11.6v1.6h-11.6z'],
];
const kid = (x, y) =>
  prop([['shadow', E(0, 1, 11, 2.5)]], { pen: false, at: [x, y] }) +
  prop([
    ['kidpants', 'M-6 -14h4.5v14h-4.5z M2 -14h4.5v14h-4.5z'],
    ['bag', 'M7.5 -28h6q2 0 2 2v11h-8z'],
    ['kid', 'M-8 -14q-1 -17 8 -17q9 0 8 17z'],
    ...KID_HEAD,
  ], { solid: true, at: [x, y] });

const kidHead = (x, y) => prop(KID_HEAD, { solid: true, at: [x, y + 39] });

const gmaSit = (x, y) => prop([
  ['gma', 'M-13 0q-2 -24 12 -26q16 0 15 26z'],
  ['gma', 'M-3 0q8 0 10 6l2 12h-8l-2 -10h-6z'],
  ['skin', C(0, -33, 8)],
  ['white', C(3, -43, 4.5)],
  ['white', 'M-8 -34q0 -10 9 -10q8 0 8 9q-4 -5 -9 -5q-6 0 -8 6z'],
], { solid: true, at: [x, y] });

const gmaStand = (x, y) =>
  prop([['shadow', E(0, 1, 14, 3)]], { pen: false, at: [x, y] }) +
  prop([
    ['gma2', 'M-6 -3h4v3h-4zM2 -3h4v3h-4z'],
    ['gma', 'M-12 -2q-3 -34 12 -34q15 0 12 34z'],
    ['gma', 'M-12 -26q-6 6 -4 14l4 -2zM12 -26q6 6 4 14l-4 -2z'],
    ['skin', C(0, -42, 8)],
    ['white', 'M-8 -43q0 -9 8 -9q8 0 8 9q-2 3 -8 3q-6 0 -8 -3z'],
    ['white', C(0, -51, 4.5)],
  ], { solid: true, at: [x, y] });

const master = (x, y) =>
  prop([['shadow', E(0, 1, 13, 3)]], { pen: false, at: [x, y] }) +
  prop([
    ['navy2', 'M-7 0v-22h6v22zM1 0v-22h6v22z'],
    ['navy', 'M-11 -22q-1 -28 11 -28q12 0 11 28z'],
    ['navy', 'M-11 -44q-5 10 -3 20l4 -1zM11 -44q5 10 3 20l-4 -1z'],
    ['gold', C(0, -40, 1.3) + C(0, -32, 1.3)],
    ['skin', C(0, -57, 8.5)],
    ['navy2', 'M-9 -61q9 -9 18 0v3h-18z'],
    ['navy2', 'M-11 -58h22v2.5h-22z'],
    ['gold', 'M-2 -63h4v2.5h-4z'],
  ], { solid: true, at: [x, y] });

const uncle = (x, y) => prop([
  ['coat2', 'M-10 0h20v3l-3 15h-5l1 -12h-8l1 12h-5l-3 -15z'],
  ['coat', 'M-12 0q-2 -26 12 -27q13 1 12 27z'],
  ['coat', 'M-12 -18q-4 8 -2 16l5 -1zM12 -18q4 8 2 16l-5 -1z'],
  ['skin', C(2, -34, 8)],
  ['fedora', 'M-11 -37q13 -4 26 0q-13 4 -26 0z M-4 -38q0 -10 6 -10q8 0 8 10z'],
], { solid: true, at: [x, y] });

/* ---------- 공통 ---------- */
const CLOUD1 = 'M70 70 q10 -16 28 -8 q14 -12 28 2 q16 0 14 12 h-74 q-8 -2 4 -6z';
const CLOUD2 = 'M250 50 q8 -12 22 -6 q12 -9 22 2 q12 0 10 9 h-58 q-6 -2 4 -5z';
const STARS = [[40,30],[120,22],[160,48],[230,28],[330,40],[20,90],[200,80],[360,90],[-40,50],[440,30],[300,15],[100,110],[-90,95],[480,75]]
  .map(([x, y]) => `<path class="star glow" d="${R(x, y, 1.6, 1.6)}"/>`).join('');

function sky(time, { sun = true, clouds = true } = {}) {
  let s = prop([['sky', R(-400, -60, 1200, 236)]], { pen: false });
  if (clouds) s += prop([['cloud', CLOUD1], ['cloud', CLOUD2]]);
  if (sun && time === 'day') s += prop([['sun', C(156, 48, 18)]]);
  if (sun && time === 'eve') s += prop([['sun', C(186, 160, 20)]], { pen: ['M166 165 A20 20 0 0 1 206 165'] });
  return s;
}

/* ---------- 장면 ---------- */
function station(time, cast) {
  const sleepers = Array.from({ length: 36 }, (_, i) => R(-400 + i * 20, 206, 6, 8)).join('');
  let s = sky(time);
  s += prop([['sea', R(-400, 165, 1200, 60)]], {
    pen: ['M-400 165H800', 'M-60 180q10 -2 20 0M30 185q8 -2 16 0M80 195q10 -2 20 0M200 182q8 -2 16 0M340 190q10 -2 18 0M420 180q10 -2 20 0'],
  });
  s += prop([
    ['hill', 'M214 172 Q244 122 268 120 Q300 119 330 150 L360 172 Z'],
    ['lh', 'M258 121 L274 121 L271 77 L261 77 Z'],
    ['lamp', R(259, 69, 14, 8)],
    ['red', 'M257 69 L266 59 L275 69 Z'],
  ]);
  s += prop([['rail', sleepers], ['rail', R(-400, 208, 708, 3)]], { pen: [R(-400, 208, 708, 3)] });
  s += prop([['red', R(300, 192, 14, 24)]], { extraPen: ['M300 200h14M300 208h14'] });
  s += prop([['plat', R(-400, 222, 1200, 80)], ['edge', R(-400, 222, 1200, 5)]], {
    pen: ['M-400 222H800M-400 227H800', 'M-60 262h30M20 250h30M300 260h40M90 280h24M420 270h30'],
  });
  s += prop([['post', R(116, 176, 3, 48)], ['post', R(151, 176, 3, 48)], ['sign', 'M104 150h62v26h-62z']], {
    solid: true,
    raw: `<text class="signtxt" x="135" y="167" text-anchor="middle" font-size="13">달 섬</text>
          <text class="signtxt" x="135" y="173.5" text-anchor="middle" font-size="5" opacity=".75">종점 · DALSEOM</text>`,
  });
  s += prop([['wood', 'M196 246h66v5h-66z M200 251h4v14h-4z M254 251h4v14h-4z M198 232h62v4h-62z M200 236h3v10h-3z M255 236h3v10h-3z']], { solid: true });
  s += prop([['shadow', E(230, 266, 38, 4)]], { pen: false });
  if (cast.includes('할머니')) s += gmaSit(229, 246);
  if (cast.includes('역장')) s += master(132, 254);
  s += kid(176, 250);
  const fx = `${STARS}<path class="moon glow" d="${C(100, 48, 10)}"/>
    <path class="beam" d="M273 73 L560 40 L560 106 Z"/><path class="lamp glow" d="${R(259, 69, 14, 8)}"/>`;
  return { svg: s, fx, outdoor: true };
}

function yard(time, cast) {
  let s = sky(time, { sun: false });
  s += prop([['wall', R(-400, 70, 1200, 155)]], { pen: false });
  const tiles = Array.from({ length: 50 }, (_, i) => `M${-400 + i * 24} 58v12`).join('');
  s += prop([['roof', R(-400, 54, 1200, 18)]], { pen: ['M-400 54H800M-400 72H800', tiles] });
  const WINS = [92, 222, -120, 420];
  const win = (x) => prop([['glass', R(x, 110, 56, 44)]], { extraPen: [`M${x + 28} 110v44M${x} 132h56`] });
  s += WINS.map(win).join('');
  s += prop([['door', R(160, 118, 44, 104)]], { extraPen: ['M182 118v104', C(188, 172, 1.6)] });
  s += prop([['yard', R(-400, 222, 1200, 80)]], { pen: ['M-400 222H800', 'M20 270h18M120 284h22M250 280h16M360 266h20M-80 262h20M470 280h24'] });
  const jar = (x, b, r) => [['jar', E(x, b - r, r, r)], ['jar', E(x, b - 2 * r, r * 0.6, 2.4)]];
  s += prop([...jar(40, 252, 11), ...jar(66, 248, 9), ...jar(16, 250, 10)], { solid: true });
  s += prop([['wood', R(206, 236, 104, 7)], ['wood2', R(211, 243, 5, 16)], ['wood2', R(300, 243, 5, 16)], ['wood2', R(256, 243, 5, 14)]], { solid: true });
  if (cast.includes('아저씨')) s += uncle(270, 236);
  s += kid(140, 266);
  const glowWin = (x) => `<path class="warm glow" opacity=".9" d="${R(x, 110, 56, 44)}"/>`;
  const fx = `${STARS}${WINS.map(glowWin).join('')}<path class="warm" opacity=".16" d="${E(120, 238, 40, 7)}"/><path class="warm" opacity=".16" d="${E(250, 238, 40, 7)}"/>`;
  return { svg: s, fx, outdoor: true };
}

function kitchen(time, cast) {
  let s = prop([['kwall', R(-400, -60, 1200, 290)]], { pen: false });
  s += prop([['nightglass', R(40, 70, 70, 52)]], { extraPen: ['M75 70v52M40 96h70'] });
  s += `<g class="winrain"><path d="M50 74l-3 10M62 80l-3 10M88 72l-3 10M100 86l-3 10M56 100l-3 10M92 104l-3 10"/></g>`;
  const bowls = ['M150 83q8 7 16 0z', 'M170 83q8 7 16 0z', 'M196 83q8 7 16 0z', 'M152 116q9 7 18 0z', 'M176 116q9 7 18 0z', 'M203 116q5 5 10 0z'];
  s += prop([['cupboard', R(140, 50, 84, 100)]], { solid: true, extraPen: ['M140 83h84M140 116h84'] });
  s += prop(bowls.map(d => ['bowl', d]));
  s += prop([['floor', R(-400, 230, 1200, 80)]], { pen: ['M-400 230H800', 'M-60 262h40M60 252h30M180 280h50M380 258h40'] });
  s += prop([['counter', R(232, 176, 140, 54)], ['wood', R(226, 170, 152, 8)]], { solid: true, extraPen: ['M262 172q20 8 40 0', 'M302 186v30'] });
  s += prop([['bulb', C(200, 36, 6)]], { extraPen: ['M200 -60V30'] });
  if (cast.includes('할머니')) s += gmaStand(292, 262);
  s += kid(110, 268);
  const fx = `<path class="bulb glow" d="${C(200, 36, 9)}"/><path class="warm" opacity=".14" d="${E(200, 240, 160, 26)}"/>`;
  return { svg: s, fx, outdoor: false };
}

function room(time) {
  let s = prop([['rwall', R(-400, -60, 1200, 285)]], { pen: false });
  s += prop([['nightglass', R(150, 56, 100, 52)], ['sea', R(150, 108, 100, 26)]], { pen: [R(150, 56, 100, 78), 'M200 56v78M150 95h100'] });
  s += `<g class="winrain"><path d="M160 62l-3 10M178 70l-3 10M210 64l-3 10M236 76l-3 10M170 104l-3 10M224 110l-3 10M190 90l-3 10"/></g>`;
  s += prop([['jangpan', R(-400, 225, 1200, 90)]], { pen: ['M-400 225H800', 'M-80 260h40M60 290h30M380 272h40'] });
  s += prop([['quilt', 'M40 266v-16q0 -12 12 -12h96q10 0 10 12v16z'], ['quilt2', E(62, 240, 16, 6)]], { solid: true, extraPen: ['M70 252l6 6M100 248l6 6M130 254l6 6'] });
  s += prop([['wood', R(250, 222, 96, 8)], ['wood2', R(256, 230, 84, 22)], ['wood', R(276, 234, 44, 13)], ['wood2', R(256, 252, 6, 8)], ['wood2', R(334, 252, 6, 8)]], { solid: true, extraPen: [C(298, 240.5, 1.6)] });
  s += kid(214, 266);
  const fx = `<path fill="#1d1d33" d="M228 106h5l-1 -18h-3z"/><path class="lamp glow" d="${C(230.5, 86, 2.4)}"/>
    <path class="beam" d="M232 86 L250 79 L250 93 Z"/><path class="warm" opacity=".1" d="M150 134L250 134L310 300L100 300z"/>`;
  return { svg: s, fx, outdoor: false };
}

function train(time) {
  let s = prop([['sky', R(-400, 60, 1200, 50)], ['sea', R(-400, 110, 1200, 50)]], { pen: ['M-400 110H800', 'M-40 124q8 -2 16 0M120 130q8 -2 16 0M300 122q8 -2 16 0M460 128q8 -2 16 0'] });
  const wins = Array.from({ length: 9 }, (_, i) => R(-380 + i * 130, 68, 106, 84)).join('');
  s += `<g class="wc"><path class="tw" fill-rule="evenodd" d="${R(-400, -60, 1200, 360)}${wins}"/></g><g class="pen"><path d="${wins}"/><path d="M-400 30H800"/></g>`;
  s += kidHead(198, 186);
  const seat = (x) => [['seat', `M${x} 252v-54q0 -8 8 -8h70q8 0 8 8v54z`], ['seat2', R(x - 4, 240, 94, 12)]];
  s += prop([...seat(-210), ...seat(-100), ...seat(10), ...seat(155), ...seat(300), ...seat(445)], { solid: true });
  s += prop([['tfloor', R(-400, 262, 1200, 60)]], { pen: ['M-400 262H800'] });
  return { svg: s, fx: '', outdoor: false };
}

function black() {
  return { svg: `<rect x="-400" y="-60" width="1200" height="400" fill="#1d1a22"/>`, fx: '', outdoor: false, dark: true };
}

const SCENES = { 기차: train, 승강장: station, 마당: yard, 부엌: kitchen, 방: room, 검정: black };

const DEFS = `<defs>
  <filter id="wc" x="-10%" y="-10%" width="120%" height="120%">
    <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" seed="3" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="5" result="d"/>
    <feGaussianBlur in="d" stdDeviation="0.6" result="b"/>
    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="8" result="g"/>
    <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -0.9 1.1" result="ga"/>
    <feComposite in="b" in2="ga" operator="in" result="tex"/>
    <feComponentTransfer in="tex"><feFuncA type="linear" slope="0.85"/></feComponentTransfer>
  </filter>
  <filter id="pencil" x="-5%" y="-5%" width="110%" height="110%">
    <feTurbulence type="fractalNoise" baseFrequency="0.08" numOctaves="2" seed="5" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="2.2"/>
  </filter>
  <filter id="glow" x="-100%" y="-100%" width="300%" height="300%">
    <feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  <linearGradient id="beamG" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffe7b0" stop-opacity=".6"/><stop offset="1" stop-color="#ffe7b0" stop-opacity="0"/></linearGradient>
</defs>`;

/** 장면 SVG 만들기. time: day | eve | night | dim | lamp | morning */
export function drawScene(name, time, cast = []) {
  const fn = SCENES[name];
  if (!fn) throw new Error(`없는 장면: ${name}`);
  const sc = fn(time, cast);
  const svg = `<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMax slice" aria-hidden="true">${DEFS}
    ${sc.svg}<rect class="tint" x="-400" y="-60" width="1200" height="400"/><g class="nightfx">${sc.fx}</g></svg>`;
  return { svg, outdoor: sc.outdoor, dark: !!sc.dark };
}

export const sceneNames = Object.keys(SCENES);
