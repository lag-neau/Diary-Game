// 대본 읽기. 형식은 docs/05-대본-쓰는-법.md 참고.

export function parseScript(text, file = '대본') {
  const nodes = [];
  const labels = {};
  const diary = [];
  const lines = text.replace(/\r/g, '').split('\n');
  let choice = null;

  const fail = (n, msg) => { throw new Error(`${file} ${n}번째 줄: ${msg}`); };
  const flush = () => { if (choice) { nodes.push(choice); choice = null; } };

  lines.forEach((raw, i) => {
    const n = i + 1;
    const line = raw.trim();
    if (!line || line.startsWith('#') || line.startsWith('//')) return;

    if (line.startsWith('*')) {
      // * 선택지 글 -> 이동할곳 {깃발}
      const m = line.match(/^\*\s*(.+?)\s*->\s*(\S+)\s*(?:\{(.+?)\})?$/);
      if (!m) fail(n, '선택지는 "* 글 -> 이동할곳 {깃발}" 모양이어야 해요.');
      if (!choice) choice = { type: 'choice', options: [], line: n };
      choice.options.push({ text: m[1], go: m[2], flags: m[3] ? m[3].split(/[,\s]+/).filter(Boolean) : [] });
      return;
    }
    flush();

    let m;
    if ((m = line.match(/^==\s*(.+?)\s*==$/))) {
      if (labels[m[1]] !== undefined) fail(n, `"${m[1]}" 이름이 두 번 나와요.`);
      labels[m[1]] = nodes.length;
      nodes.push({ type: 'label', name: m[1], line: n });
      return;
    }
    if (line.startsWith('@일기줄')) {
      // @일기줄 아이디 | 조건 | 일기 문장 | 지우면 (또는 "고정")
      const parts = line.replace(/^@일기줄\s*/, '').split('|').map(s => s.trim());
      if (parts.length !== 4) fail(n, '일기줄은 "아이디 | 조건 | 문장 | 지우면" 네 칸이에요.');
      const [id, cond, text, after] = parts;
      diary.push({ id, cond, text, fixed: after === '고정', after: after === '고정' ? '' : after, line: n });
      return;
    }
    if (line.startsWith('@')) {
      const [cmd, ...args] = line.slice(1).split(/\s+/);
      nodes.push({ type: 'cmd', cmd, args, rest: line.slice(1 + cmd.length).trim(), line: n });
      return;
    }
    if ((m = line.match(/^([^:@*]{1,14}):\s*(.+)$/))) {
      nodes.push({ type: 'say', who: m[1].trim(), text: m[2], line: n });
      return;
    }
    fail(n, '무슨 줄인지 모르겠어요. 대사는 "이름: 대사", 해설은 "@글 내용"으로 써 주세요.');
  });
  flush();

  // 이동할 곳이 실제로 있는지 확인
  nodes.forEach(nd => {
    const targets = nd.type === 'choice' ? nd.options.map(o => o.go)
      : nd.type === 'cmd' && nd.cmd === '이동' ? [nd.args[0]]
      : nd.type === 'cmd' && nd.cmd === '만약' ? [nd.rest.split('->')[1]?.trim()] : [];
    targets.forEach(t => { if (labels[t] === undefined) fail(nd.line, `"${t}"(으)로 갈 수 없어요. "== ${t} ==" 이 없어요.`); });
  });
  return { nodes, labels, diary };
}

/** 조건 확인: "항상", "깃발", "!깃발", "깃발1 깃발2"(모두) */
export function check(cond, flags) {
  if (!cond || cond === '항상') return true;
  return cond.split(/\s+/).every(c => (c.startsWith('!') ? !flags.has(c.slice(1)) : flags.has(c)));
}
