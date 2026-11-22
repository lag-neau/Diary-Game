import { drawScene } from './art.js';

const TIME = { 낮: 'day', 아침: 'morning', 저녁: 'eve', 밤: 'night', 어스름: 'dim', 불빛: 'lamp' };
const TIME_LABEL = { day: '낮', morning: '아침', eve: '저녁', night: '밤', dim: '밤', lamp: '밤' };
const GROUND = { day: '#dccfb5', morning: '#e3d6bb', eve: '#c9a98c', night: '#3b3a4a', dim: '#4a4658', lamp: '#8f7a68' };

export function createStage({ stageEl, rainEl, fadeEl, hudTimeEl, talkEl }) {
  let current = { scene: null, time: 'day', cast: [], rain: false, day: 1 };
  let outdoor = false;

  const fit = () => {
    const svg = stageEl.querySelector('svg');
    if (svg) svg.setAttribute('preserveAspectRatio', innerWidth >= 800 && innerWidth / innerHeight > 1 ? 'xMidYMax meet' : 'xMidYMax slice');
  };
  addEventListener('resize', fit);

  const wait = (ms) => new Promise(r => setTimeout(r, ms));

  function paintHud() {
    hudTimeEl.textContent = current.scene === '검정' ? '' : `${current.day}일째 · ${TIME_LABEL[current.time]}`;
  }

  function applyRain() {
    rainEl.hidden = !(current.rain && outdoor);
    stageEl.classList.toggle('raining', current.rain);
  }

  async function set(scene, timeWord = '낮', cast = [], { instant = false } = {}) {
    const time = TIME[timeWord] || timeWord || 'day';
    const changed = scene !== current.scene || time !== current.time || cast.join() !== current.cast.join();
    if (!changed) return;
    if (!instant && current.scene) { fadeEl.classList.add('on'); await wait(500); }
    const out = drawScene(scene, time, cast);
    stageEl.innerHTML = out.svg;
    outdoor = out.outdoor;
    current = { ...current, scene, time, cast };
    document.body.className = `t-${time}`;
    talkEl.style.setProperty('--ground', GROUND[time]);
    fit();
    applyRain();
    paintHud();
    if (!instant) { await wait(60); fadeEl.classList.remove('on'); await wait(350); }
  }

  return {
    set,
    get state() { return { ...current }; },
    setDay(n) { current.day = n; paintHud(); },
    rain(on) { current.rain = on; applyRain(); },
    async shake() { stageEl.classList.remove('shake'); void stageEl.offsetWidth; stageEl.classList.add('shake'); await wait(500); },
    async blackout(on) { fadeEl.classList.toggle('on', on); await wait(520); },
    async restore(st) {
      current.day = st.day || 1;
      current.rain = !!st.rain;
      current.scene = null;
      await set(st.scene || '검정', st.time || 'day', st.cast || [], { instant: true });
    },
  };
}
