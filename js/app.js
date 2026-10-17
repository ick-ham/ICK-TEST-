/* ICK 자율성과지표 성과관리 — 화면 로직
 * 데이터는 data/data.js(window.PM_DATA)에서 읽습니다. 로그인·접속코드 없이 누구나 볼 수 있는 정적 페이지입니다.
 */
(function () {
  'use strict';
  var D = window.PM_DATA;
  var $ = function (s) { return document.querySelector(s); };
  var f1 = d3.format(',.1f');
  var round1 = function (x) { return Math.round(x * 10) / 10; };
  var isNil = function (v) { return v === null || v === undefined || v === ''; };
  var mk = function (tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; return e; };
  var num = function (v, unit) {
    if (isNil(v)) return '—';
    if (unit === '점' && v < 1) return d3.format('.2~f')(v);
    if (unit !== '%' && unit !== '점' && Number.isInteger(+v)) return d3.format(',')(v);
    return f1(v);
  };

  if (!D) { document.getElementById('take').textContent = '데이터 파일(data/data.js)을 불러오지 못했습니다.'; return; }

  // ---------- 계산 ----------
  var y1 = D.indexSummary.map(function (r) {
    return { index: r.index, target: r.t1, actual: r.a1, rate: round1(r.a1 / r.t1 * 100) };
  });
  var y1Met = y1.filter(function (r) { return r.rate >= 100; }).length;
  var y1Avg = round1(d3.mean(y1, function (r) { return r.rate; }));

  var y2 = D.indexSummary.map(function (s) {
    var cs = D.components.filter(function (c) { return c.index === s.index; });
    var missing = cs.filter(function (c) { return isNil(c.q2); }).map(function (c) { return c.comp; });
    var interim = missing.length ? null : round1(d3.sum(cs, function (c) { return (c.q2 / c.t3) * 100 * c.weight; }));
    return { index: s.index, target: s.t2, interim: interim, rate: interim === null ? null : round1(interim / s.t2 * 100), status: missing.length ? missing.join(', ') + ' 입력 대기' : '중간 집계' };
  });
  var y2Rates = y2.filter(function (r) { return r.rate !== null; }).map(function (r) { return r.rate; });

  var compRates = new Map(D.components.map(function (c) {
    return [c.comp, { r1: isNil(c.a1) ? null : round1(c.a1 / c.t1 * 100), r2: isNil(c.q2) ? null : round1(c.q2 / c.t2 * 100) }];
  }));

  // ---------- 헤더 ----------
  var take = $('#take');
  take.replaceChildren();
  var b = function (t) { return mk('b', '', String(t)); };
  take.append("1차년도('25)에는 자율성과지표 " + y1.length + '개 중 ', b(y1Met), '개가 목표를 달성했고, 평균 달성도는 ', b(f1(y1Avg)), '%입니다. ');
  if (y2Rates.length) {
    take.append("2차년도('26)는 " + D.meta.asOf + ' 기준으로 산출 가능한 지표가 2차 목표의 ', b(Math.floor(d3.min(y2Rates))), '~', b(Math.floor(d3.max(y2Rates))), '% 수준입니다.');
    var waiting = y2.filter(function (r) { return r.interim === null; }).map(function (r) { return r.index; });
    if (waiting.length) take.append(' ' + waiting.join(', ') + '는 입력 대기 중인 값이 있어 아직 산출되지 않았습니다.');
  }
  $('#y2-basis').textContent = D.meta.asOf + ' 중간 집계 · 진척률 = 현재 지수 ÷ 2차 목표 × 100';
  $('#foot').textContent = '출처: ' + D.meta.sources + ' · 데이터 갱신일 ' + D.meta.updated;

  // ---------- 실시간 날짜 ----------
  var nowFmt = new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', year: 'numeric', month: 'long', day: 'numeric', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false });
  var tick = function () { $('#pm-now').textContent = nowFmt.format(new Date()) + ' 현재'; };
  tick(); setInterval(tick, 15000);

  // ---------- 화면 모드 ----------
  var modeBtns = Array.prototype.slice.call(document.querySelectorAll('#mode-seg button'));
  var setMode = function (m, save) {
    if (m === 'auto') delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = m;
    modeBtns.forEach(function (x) { x.setAttribute('aria-pressed', String(x.dataset.mode === m)); });
    if (save) { try { localStorage.setItem('pm-mode', m); } catch (e) {} }
  };
  modeBtns.forEach(function (x) { x.addEventListener('click', function () { setMode(x.dataset.mode, true); }); });
  setMode(document.documentElement.dataset.theme || 'auto', false);

  // ---------- 도넛 ----------
  function donut(host, o) {
    var box = mk('div', 'pm-dn' + (o.small ? ' sm' : ''));
    box.append(mk('div', 'pm-dn-name', o.name));
    var ch = mk('div', 'pm-dn-chart');
    var S = 120, R = 52, W = o.small ? 11 : 12, C = 2 * Math.PI * R;
    var svg = d3.select(ch).append('svg').attr('viewBox', '0 0 ' + S + ' ' + S).attr('role', 'img')
      .attr('aria-label', o.name + ' ' + (o.rate === null ? '산출 전' : f1(o.rate) + '%'));
    var g = svg.append('g').attr('transform', 'translate(' + S / 2 + ',' + S / 2 + ') rotate(-90)');
    g.append('circle').attr('r', R).attr('fill', 'none').attr('stroke', 'var(--cds-chart-grid)').attr('stroke-width', W);
    if (o.rate !== null) {
      var main = Math.min(o.rate, 100) / 100;
      var col = o.judge && o.rate < 100 ? 'var(--cds-chart-status-critical)' : 'var(--ick-blue)';
      g.append('circle').attr('class', 'pm-arc').attr('r', R).attr('fill', 'none').attr('stroke', col).attr('stroke-width', W)
        .attr('stroke-linecap', main >= 1 ? 'butt' : 'round').attr('stroke-dasharray', C + ' ' + C).attr('stroke-dashoffset', C * (1 - main));
      if (o.rate > 100) {
        var r2 = R - W / 2 - 5, C2 = 2 * Math.PI * r2, over = Math.min(o.rate - 100, 100) / 100;
        g.append('circle').attr('r', r2).attr('fill', 'none').attr('stroke', 'var(--ick-red)').attr('stroke-width', 4).attr('stroke-linecap', 'round')
          .attr('stroke-dasharray', C2 + ' ' + C2).attr('stroke-dashoffset', C2 * (1 - over));
      }
    }
    var mid = mk('div', 'pm-dn-mid'), v = mk('div', 'pm-dn-val');
    if (o.rate === null) v.textContent = '—'; else { v.textContent = f1(o.rate); v.append(mk('small', '', '%')); }
    mid.append(v, mk('div', 'pm-dn-lab', o.rate === null ? '입력 대기' : o.lab));
    ch.append(mid); box.append(ch);
    if (o.sub) {
      var s = mk('div', 'pm-dn-sub');
      o.sub.forEach(function (kv, i) { if (i) s.append(' · '); s.append(kv[0] + ' '); s.append(mk('b', '', kv[1])); });
      box.append(s);
    }
    host.append(box);
  }

  $('.lg-main').style.background = 'var(--ick-blue)';
  $('.lg-over').style.background = 'var(--ick-red)';
  $('.lg-bad').style.background = 'var(--cds-chart-status-critical)';

  // ---------- 1차년도 ----------
  (function () {
    var el = $('#y1-donuts');
    y1.forEach(function (r) { donut(el, { name: r.index, rate: r.rate, judge: true, lab: '달성도', sub: [['실적', f1(r.actual)], ['목표', f1(r.target)]] }); });
    var tb = $('#y1-table tbody');
    D.indexSummary.forEach(function (r, i) {
      var tr = mk('tr'), rt = y1[i].rate;
      tr.append(mk('td', '', r.no + ' ' + r.index), mk('td', 'muted', f1(r.base)), mk('td', '', f1(r.t1)), mk('td', 'em', f1(r.a1)),
        mk('td', rt >= 100 ? 'ok' : 'bad', f1(rt) + '%'), mk('td', '', f1(r.t2)), mk('td', 'muted', f1(r.t3)));
      tb.append(tr);
    });
  })();

  // ---------- 2차년도 ----------
  (function () {
    var el = $('#y2-donuts'), tb = $('#y2-table tbody');
    y2.forEach(function (r) {
      donut(el, { name: r.index, rate: r.rate, judge: false, lab: '진척률', sub: r.interim === null ? [['2차 목표', f1(r.target)]] : [['현재', f1(r.interim)], ['목표', f1(r.target)]] });
      var tr = mk('tr');
      tr.append(mk('td', '', r.index), mk('td', '', f1(r.target)), mk('td', 'em', r.interim === null ? '—' : f1(r.interim)), mk('td', '', r.rate === null ? '—' : f1(r.rate) + '%'));
      var st = mk('td', 'wrap'); st.append(mk('span', 'pm-pill ' + (r.interim === null ? 'warn' : 'info'), r.status)); tr.append(st);
      tb.append(tr);
    });
  })();

  // ---------- 세부 탭 ----------
  var tab = D.indexSummary[0].index, basis = 'r2';
  var short = function (name) { return name.replace('혁신지수', ''); };
  var tabsEl = $('#tabs');
  D.indexSummary.forEach(function (r, i) {
    var bt = mk('button', '', r.no + ' ' + short(r.index));
    bt.type = 'button'; bt.setAttribute('role', 'tab'); bt.id = 'tab-' + i; bt.dataset.i = r.index;
    bt.addEventListener('click', function () { tab = r.index; detail(); });
    tabsEl.append(bt);
  });
  var baseBtns = Array.prototype.slice.call(document.querySelectorAll('#basis-seg button'));
  baseBtns.forEach(function (x) { x.addEventListener('click', function () { basis = x.dataset.basis; detail(); }); });

  function detail() {
    tabsEl.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-selected', String(x.dataset.i === tab)); });
    baseBtns.forEach(function (x) { x.setAttribute('aria-pressed', String(x.dataset.basis === basis)); });
    var sr = D.indexSummary.find(function (r) { return r.index === tab; });
    $('#def-d').textContent = sr.definition;
    $('#def-f').textContent = sr.index + ' = ' + sr.formula;
    $('#def-g').textContent = sr.goal;
    var el = $('#c-donuts'), tb = $('#c-table tbody');
    el.replaceChildren(); tb.replaceChildren();
    D.components.filter(function (r) { return r.index === tab; }).forEach(function (r) {
      var rr = compRates.get(r.comp), rate = rr[basis];
      var sub = basis === 'r1'
        ? [['실적', num(r.a1, r.unit) + (isNil(r.a1) ? '' : r.unit)], ['목표', num(r.t1, r.unit) + r.unit]]
        : [['현재', num(r.q2, r.unit) + (isNil(r.q2) ? '' : r.unit)], ['목표', num(r.t2, r.unit) + r.unit]];
      donut(el, { name: r.comp + ' (' + Math.round(r.weight * 100) + '%)', rate: rate, judge: basis === 'r1', lab: basis === 'r1' ? '1차 달성률' : '2차 진척률', sub: sub, small: true });
      var tr = mk('tr');
      tr.append(mk('td', '', r.comp + ' (' + r.unit + ')'), mk('td', 'muted', d3.format('.0%')(r.weight)), mk('td', 'muted', num(r.base, r.unit)), mk('td', '', num(r.t1, r.unit)),
        mk('td', 'em', num(r.a1, r.unit)), mk('td', '', num(r.t2, r.unit)), mk('td', 'em', num(r.q2, r.unit)), mk('td', 'muted', num(r.t3, r.unit)), mk('td', 'wrap muted', r.dept));
      var fl = mk('td', 'wrap'); if (r.flag) fl.append(mk('span', 'pm-pill warn', r.flag)); tr.append(fl);
      tb.append(tr);
    });
  }
  detail();

  // ---------- 점검 사항 ----------
  (function () {
    var cls = { '반영': 'info', '수정 완료': 'ok', '확인 필요': 'warn', '보고서 수정 필요': 'bad' };
    var tb = $('#issue-table tbody');
    D.issues.forEach(function (r) {
      var tr = mk('tr');
      tr.append(mk('td', 'muted', String(r.no)));
      var k = mk('td', 'wrap'); k.append(mk('span', 'pm-pill ' + (cls[r.kind] || ''), r.kind)); tr.append(k);
      tr.append(mk('td', 'wrap muted', r.where), mk('td', 'wrap', r.item), mk('td', 'wrap', r.action));
      tb.append(tr);
    });
  })();

  // 링크로 특정 영역(#year1, #year2, #detail, #issues) 바로 열기
  if (location.hash) { var t = document.getElementById(location.hash.slice(1)); if (t) t.scrollIntoView(); }
})();
