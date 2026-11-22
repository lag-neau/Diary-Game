// 일기장: 한 줄을 지우개로 문질러 지웁니다.

const FONT_FAMILY = "'Gaegu', cursive";
const DONE_AT = 0.2;      // 잉크가 이만큼 남으면 지워진 것으로
const SLIP_AT = 0.9;      // 지울 수 없는 줄은 여기까지 지워지면 미끄러짐

export function createDiary(root) {
  const entriesEl = root.querySelector('#entries');
  const dayEl = root.querySelector('#diary-day');
  const weatherEl = root.querySelector('#diary-weather');
  const hintEl = root.querySelector('#diary-hint');
  const eraserEl = document.querySelector('#eraser');

  function wrap(ctx, text, maxW) {
    const words = text.split(' ');
    const rows = [];
    let row = '';
    for (const w of words) {
      const test = row ? row + ' ' + w : w;
      if (ctx.measureText(test).width > maxW && row) { rows.push(row); row = w; }
      else row = test;
    }
    if (row) rows.push(row);
    return rows;
  }

  function makeEntry(item, width) {
    const el = document.createElement('div');
    el.className = 'entry';
    const cv = document.createElement('canvas');
    el.appendChild(cv);
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const fs = width < 380 ? 22 : 25;
    const lh = 38;
    const ctx = cv.getContext('2d', { willReadFrequently: true });
    ctx.font = `${fs}px ${FONT_FAMILY}`;
    const rows = wrap(ctx, item.text, width - 8);
    const h = rows.length * lh;
    cv.width = Math.round(width * dpr); cv.height = Math.round(h * dpr);
    cv.style.height = h + 'px';

    const paint = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, width, h);
      ctx.font = `${fs}px ${FONT_FAMILY}`;
      ctx.fillStyle = '#3b342c';
      ctx.textBaseline = 'alphabetic';
      rows.forEach((r, i) => ctx.fillText(r, 2, i * lh + lh - 11));
    };
    paint();
    const inkOf = () => {
      const d = ctx.getImageData(0, 0, cv.width, cv.height).data;
      let n = 0;
      for (let i = 3; i < d.length; i += 16) if (d[i] > 60) n++;
      return n;
    };
    const full = inkOf() || 1;
    return { el, cv, ctx, item, paint, ratio: () => inkOf() / full, dpr, width, h, touched: false };
  }

  function open({ day, weather, lines }) {
    return new Promise((resolve) => {
      dayEl.textContent = `${day}일째`;
      weatherEl.textContent = weather || '';
      hintEl.textContent = '지우고 싶은 줄을 손가락이나 마우스로 문질러 보세요.';
      entriesEl.innerHTML = '';
      root.hidden = false;
      const width = entriesEl.clientWidth;
      const entries = lines.map(it => makeEntry(it, width));
      entries.forEach(e => entriesEl.appendChild(e.el));

      let active = null, last = null, done = false, lastCheck = 0;

      const crumbs = (x, y) => {
        if (Math.random() > 0.35) return;
        const c = document.createElement('i');
        c.className = 'crumb';
        c.style.left = x + 'px'; c.style.top = y + 'px';
        c.style.setProperty('--dx', (Math.random() * 30 - 15) + 'px');
        document.body.appendChild(c);
        setTimeout(() => c.remove(), 750);
      };

      const rub = (e, x, y) => {
        const { ctx } = e;
        ctx.globalCompositeOperation = 'destination-out';
        const steps = last ? Math.max(1, Math.ceil(Math.hypot(x - last.x, y - last.y) / 4)) : 1;
        for (let i = 1; i <= steps; i++) {
          const px = last ? last.x + (x - last.x) * i / steps : x;
          const py = last ? last.y + (y - last.y) * i / steps : y;
          const g = ctx.createRadialGradient(px, py, 2, px, py, 15);
          g.addColorStop(0, 'rgba(0,0,0,.55)'); g.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(px, py, 15, 0, Math.PI * 2); ctx.fill();
        }
        last = { x, y };
      };

      const finish = (e) => {
        done = true;
        eraserEl.classList.remove('on');
        e.el.classList.add('gone');
        hintEl.textContent = '';
        setTimeout(() => { root.hidden = true; resolve(e.item); }, 1500);
      };

      const slip = (e) => {
        e.paint();
        e.el.classList.remove('slip'); void e.el.offsetWidth; e.el.classList.add('slip');
        hintEl.textContent = '지우개가 미끄러진다. 이 줄은 지워지지 않는다.';
        active = null; last = null;
      };

      const check = (e, force) => {
        const now = performance.now();
        if (!force && now - lastCheck < 120) return;
        lastCheck = now;
        const r = e.ratio();
        if (e.item.fixed) { if (r < SLIP_AT) slip(e); return; }
        if (r < DONE_AT) finish(e);
      };

      entries.forEach(e => {
        e.cv.addEventListener('pointerdown', (ev) => {
          if (done) return;
          ev.preventDefault();
          e.cv.setPointerCapture(ev.pointerId);
          if (active && active !== e && !active.item.fixed) {
            active.paint();
            hintEl.textContent = '한 줄만 지울 수 있다. 앞의 줄은 다시 또렷해졌다.';
          } else if (!e.item.fixed) hintEl.textContent = ' ';
          active = e; last = null;
          move(ev);
        });
        e.cv.addEventListener('pointermove', (ev) => { if (ev.buttons || ev.pointerType === 'touch') move(ev); else hover(ev); });
        e.cv.addEventListener('pointerup', () => { last = null; if (active === e && !done) check(e, true); });
        e.cv.addEventListener('pointerleave', () => { eraserEl.classList.remove('on'); last = null; });
      });

      function hover(ev) {
        if (done || ev.pointerType === 'touch') return;
        eraserEl.classList.add('on');
        eraserEl.style.left = ev.clientX + 'px'; eraserEl.style.top = ev.clientY + 'px';
      }
      function move(ev) {
        if (done || !active) return;
        const rect = active.cv.getBoundingClientRect();
        const x = ev.clientX - rect.left, y = ev.clientY - rect.top;
        eraserEl.classList.add('on');
        eraserEl.style.left = ev.clientX + 'px'; eraserEl.style.top = (ev.clientY - (ev.pointerType === 'touch' ? 34 : 0)) + 'px';
        if (y < -20 || y > rect.height + 20) return;
        rub(active, x, y);
        crumbs(ev.clientX, ev.clientY);
        check(active, false);
      }
    });
  }

  return { open };
}
