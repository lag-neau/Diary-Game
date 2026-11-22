// 진행 저장: 이 브라우저에만 저장됩니다.
const KEY = 'diary-game/save-v1';

export function load() {
  try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; }
}
export function save(data) {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* 저장 못 해도 게임은 계속 */ }
}
export function clear() {
  try { localStorage.removeItem(KEY); } catch { /* 무시 */ }
}
