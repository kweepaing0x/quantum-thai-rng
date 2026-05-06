// ── QUANTUM THAI 2D RNG · MAIN APP ──
(function () {
  'use strict';

  let tfOk = false;
  let autoTimer = null;
  let wavePhase = 0;
  const history = [];
  const triggered = { am: false, pm: false };
  let lastDate = '';

  // ── TF.js INIT ──
  if (typeof tf !== 'undefined') {
    tf.ready().then(() => {
      tfOk = true;
      console.log('TF.js ready · backend:', tf.getBackend());
    }).catch(() => { tfOk = false; });
  }

  // ── TIME UTILS ──
  function getThai() {
    return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
  }
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function fmt(n) { return n < 10 ? '0' + n : '' + n; }

  // ── QUANTUM ENTROPY ──
  function quantumNum() {
    const buf = new Uint32Array(8);
    window.crypto.getRandomValues(buf);
    let cryptoVal = buf[0] % 100;
    let tfVal = cryptoVal;
    if (tfOk) {
      try {
        const t = tf.randomUniform([1], 0, 100);
        tfVal = Math.floor(t.dataSync()[0]);
        t.dispose();
        // Second TF pass with different seed
        const t2 = tf.randomNormal([1], 50, 25);
        const n2 = Math.abs(Math.floor(t2.dataSync()[0])) % 100;
        t2.dispose();
        tfVal = (tfVal ^ n2) % 100;
      } catch (e) { }
    }
    // XOR mix all entropy sources
    const mixed = (cryptoVal ^ tfVal ^ (buf[1] % 100) ^ (buf[2] % 100) ^ (buf[3] % 37)) % 100;
    return Math.abs(mixed);
  }

  // ── 3D RING RENDERER ──
  function drawRing3D(cvId, value, maxVal, size, colorA, colorB) {
    const cv = document.getElementById(cvId);
    if (!cv) return;
    const ctx = cv.getContext('2d');
    const W = cv.width, H = cv.height;
    const cx = W / 2, cy = H / 2 + 6;
    const r = W * 0.37;
    const thick = W * 0.085;
    const pct = maxVal > 0 ? value / maxVal : 0;

    ctx.clearRect(0, 0, W, H);

    // 3D perspective squish
    ctx.save();
    ctx.translate(0, H * 0.05);
    ctx.scale(1, 0.68);

    // Shadow ring (depth illusion)
    ctx.beginPath();
    ctx.arc(cx, cy + thick * 0.6, r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = thick + 6;
    ctx.stroke();

    // Track ring
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0, 60, 30, 0.55)';
    ctx.lineWidth = thick;
    ctx.stroke();

    // Inner highlight ring
    ctx.beginPath();
    ctx.arc(cx, cy - 2, r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0,255,120,0.04)';
    ctx.lineWidth = thick - 4;
    ctx.stroke();

    // Filled arc
    if (pct > 0.001) {
      const startA = -Math.PI / 2;
      const endA = startA + pct * Math.PI * 2;

      // Glow layer
      ctx.beginPath();
      ctx.arc(cx, cy, r, startA, endA);
      ctx.strokeStyle = colorB;
      ctx.lineWidth = thick + 6;
      ctx.lineCap = 'round';
      ctx.globalAlpha = 0.35;
      ctx.stroke();
      ctx.globalAlpha = 1;

      // Main arc
      ctx.beginPath();
      ctx.arc(cx, cy, r, startA, endA);
      ctx.strokeStyle = colorA;
      ctx.lineWidth = thick;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Moving dot at tip
      const dotAngle = endA;
      const dx = cx + r * Math.cos(dotAngle);
      const dy = cy + r * Math.sin(dotAngle);
      ctx.beginPath();
      ctx.arc(dx, dy, thick * 0.6, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(dx, dy, thick * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = colorA;
      ctx.fill();
    }

    ctx.restore();

    // Number label
    ctx.font = `900 ${Math.round(W * 0.2)}px Orbitron, monospace`;
    ctx.fillStyle = '#00ffaa';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,255,170,0.6)';
    ctx.shadowBlur = 12;
    ctx.fillText(pad(value), cx, H * 0.44);
    ctx.shadowBlur = 0;
  }

  // ── SPIN & REVEAL ──
  function spinReveal(elId, finalNum, cb) {
    const el = document.getElementById(elId);
    if (!el) return;
    let count = 0;
    const total = 18;
    const iv = setInterval(() => {
      const b = new Uint8Array(1);
      window.crypto.getRandomValues(b);
      el.textContent = fmt(b[0] % 100);
      count++;
      if (count >= total) {
        clearInterval(iv);
        el.textContent = fmt(finalNum);
        el.classList.add('flash');
        setTimeout(() => el.classList.remove('flash'), 600);
        if (cb) cb();
      }
    }, 65);
  }

  // ── GENERATE ──
  function doGenerate(which, label) {
    const n = quantumNum();
    const now = getThai();
    history.unshift({
      n, session: which.toUpperCase(),
      label: label || which.toUpperCase(),
      time: now.toLocaleTimeString('th-TH')
    });
    spinReveal('num-' + which, n, () => {
      const tagEl = document.getElementById('tag-' + which);
      if (tagEl) tagEl.textContent = label ? label + ' · Released' : 'ผลควอนตัม · Released';
      const card = document.getElementById('card-' + which);
      if (card) card.classList.add('lit');
    });
    updateHistory();
  }

  // ── HISTORY ──
  function updateHistory() {
    const div = document.getElementById('hist-chips');
    const countEl = document.getElementById('hist-count');
    if (!div) return;
    if (!history.length) {
      div.innerHTML = '<span class="no-results">ยังไม่มีผล · No results yet</span>';
      return;
    }
    if (countEl) countEl.textContent = history.length + ' result' + (history.length > 1 ? 's' : '');
    div.innerHTML = history.slice(0, 20).map(h =>
      `<div class="hchip ${h.session === 'TEST' ? 'test' : ''}">
        ${fmt(h.n)}<span class="sess-badge">${h.session}</span>
      </div>`
    ).join('');
  }

  // ── QUANTUM WAVE ──
  function drawWave() {
    const cv = document.getElementById('wcv');
    if (!cv) return;
    cv.width = cv.offsetWidth || 560;
    const ctx = cv.getContext('2d');
    const W = cv.width, H = cv.height;
    ctx.clearRect(0, 0, W, H);

    const buf = new Uint8Array(16);
    window.crypto.getRandomValues(buf);

    // Wave 1 — quantum
    ctx.strokeStyle = 'rgba(0,255,120,0.45)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    for (let x = 0; x <= W; x++) {
      const t = x / W;
      const y = H / 2
        + Math.sin(t * 7 + wavePhase) * 10
        + Math.sin(t * 17 + wavePhase * 0.8) * 5
        + ((buf[Math.floor(t * 15)] ?? 128) / 255) * 7 - 3.5;
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Wave 2 — entangled
    ctx.strokeStyle = 'rgba(0,180,255,0.25)';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    for (let x = 0; x <= W; x++) {
      const t = x / W;
      const y = H / 2
        + Math.cos(t * 11 + wavePhase * 1.3) * 7
        + Math.sin(t * 5 + wavePhase * 0.5) * 4;
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Wave 3 — interference
    ctx.strokeStyle = 'rgba(180,100,255,0.18)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    for (let x = 0; x <= W; x++) {
      const t = x / W;
      const y = H / 2
        + Math.sin(t * 23 + wavePhase * 2) * 4
        + Math.cos(t * 9 + wavePhase * 0.6) * 3;
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();

    wavePhase += 0.045;
  }

  // ── COUNTDOWN ──
  function updateCountdown() {
    const now = getThai();
    const h = now.getHours(), m = now.getMinutes(), s = now.getSeconds();
    const tot = h * 3600 + m * 60 + s;
    const am = 11 * 3600;
    const pm = 13 * 3600 + 30 * 60;
    const eod = 24 * 3600;

    let nextSec, thLabel, enLabel, maxSec;

    if (tot < am) {
      nextSec = am - tot;
      thLabel = 'รอบเช้า · 11:00 AM';
      enLabel = 'Morning session';
      maxSec = am;
    } else if (tot < pm) {
      nextSec = pm - tot;
      thLabel = 'รอบบ่าย · 14:30 PM';
      enLabel = 'Afternoon session';
      maxSec = pm - am;
      if (!triggered.am && h === 11 && m === 0 && s < 3) {
        triggered.am = true;
        doGenerate('am', 'รอบเช้า');
      }
    } else {
      nextSec = eod - tot;
      thLabel = 'รอบเช้าพรุ่งนี้ · Tomorrow 11:00';
      enLabel = 'Next morning session';
      maxSec = eod - pm;
      if (!triggered.pm && h === 13 && m === 30 && s < 3) {
        triggered.pm = true;
        doGenerate('pm', 'รอบบ่าย');
      }
    }

    // Reset triggers at midnight
    const dateStr = now.toDateString();
    if (dateStr !== lastDate) {
      lastDate = dateStr;
      triggered.am = false;
      triggered.pm = false;
      const amEl = document.getElementById('num-am');
      const pmEl = document.getElementById('num-pm');
      if (amEl) amEl.textContent = '--';
      if (pmEl) pmEl.textContent = '--';
      document.getElementById('card-am')?.classList.remove('lit');
      document.getElementById('card-pm')?.classList.remove('lit');
      document.getElementById('tag-am').textContent = 'รอการสุ่ม · Waiting';
      document.getElementById('tag-pm').textContent = 'รอการสุ่ม · Waiting';
    }

    const hh = Math.floor(nextSec / 3600);
    const mm = Math.floor((nextSec % 3600) / 60);
    const ss = nextSec % 60;

    // Draw 3D rings
    drawRing3D('ring-h', hh, 12, 100, '#00ffaa', 'rgba(0,255,170,0.5)');
    drawRing3D('ring-m', mm, 60, 124, '#00aaff', 'rgba(0,170,255,0.5)');
    drawRing3D('ring-s', ss, 60, 100, '#aa00ff', 'rgba(170,0,255,0.5)');

    // Labels
    const cdTh = document.getElementById('cd-th');
    const cdEn = document.getElementById('cd-en');
    if (cdTh) cdTh.textContent = 'นับถอยหลังสู่: ' + thLabel;
    if (cdEn) cdEn.textContent = 'Countdown to: ' + enLabel;

    // Clock
    const clockEl = document.getElementById('thai-clock');
    if (clockEl) {
      clockEl.textContent =
        'เวลาประเทศไทย (ICT UTC+7): ' +
        now.toLocaleTimeString('th-TH') + ' · ' +
        now.toLocaleDateString('th-TH', { day: '2-digit', month: 'long', year: 'numeric' });
    }

    // Wave
    drawWave();
  }

  // ── BUTTONS ──
  const testBtn = document.getElementById('testBtn');
  if (testBtn) {
    testBtn.addEventListener('click', () => {
      const now = getThai();
      const h = now.getHours(), mm = now.getMinutes();
      const which = (h < 13 || (h === 13 && mm < 30)) ? 'am' : 'pm';
      const label = which === 'am' ? 'ทดสอบควอนตัม' : 'ทดสอบควอนตัม';
      const n = quantumNum();
      history.unshift({ n, session: 'TEST', time: now.toLocaleTimeString('th-TH') });
      spinReveal('num-' + which, n, () => {
        const tagEl = document.getElementById('tag-' + which);
        if (tagEl) tagEl.textContent = 'ทดสอบควอนตัม · Quantum test';
        document.getElementById('card-' + which)?.classList.add('lit');
      });
      updateHistory();
    });
  }

  const autoBtn = document.getElementById('autoBtn');
  if (autoBtn) {
    autoBtn.addEventListener('click', function () {
      if (autoTimer) {
        clearInterval(autoTimer);
        autoTimer = null;
        this.innerHTML = '▶ สาธิตอัตโนมัติ: ปิด<span>Auto Demo: OFF</span>';
        this.classList.remove('on');
      } else {
        this.innerHTML = '⏹ สาธิตอัตโนมัติ: เปิด<span>Auto Demo: ON</span>';
        this.classList.add('on');
        autoTimer = setInterval(() => {
          const which = Math.random() < 0.5 ? 'am' : 'pm';
          const n = quantumNum();
          const now = getThai();
          history.unshift({ n, session: which.toUpperCase(), time: now.toLocaleTimeString('th-TH') });
          spinReveal('num-' + which, n, () => {
            const tagEl = document.getElementById('tag-' + which);
            if (tagEl) tagEl.textContent = 'สาธิต · Demo';
          });
          updateHistory();
        }, 2400);
      }
    });
  }

  // ── TICK LOOP ──
  updateCountdown();
  setInterval(updateCountdown, 1000);

})();
