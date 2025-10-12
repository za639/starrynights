(() => {
  const editor = document.getElementById('editor');
  const sound = document.getElementById('enterSound');

  window.addEventListener('pointerdown', () => editor.focus());
  editor.focus();

  let lastCaret = { x: window.innerWidth/2, y: window.innerHeight/2 };

  function getCaretRect() {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return null;
    const range = sel.getRangeAt(0).cloneRange();
    if (range.getClientRects().length === 0) {
      const span = document.createElement('span');
      span.textContent = '\u200C';
      range.insertNode(span);
      const rect = span.getBoundingClientRect();
      span.remove();
      sel.removeAllRanges(); sel.addRange(range);
      return rect;
    }
    const rects = range.getClientRects();
    return rects[rects.length - 1] || null;
  }

  // ===== Effects =====
  function starsEffect(x, y) {
    const n = 8 + Math.floor(Math.random()*6);
    for (let i = 0; i < n; i++) {
      const el = document.createElement('div');
      el.className = 'star';
      const a = Math.random()*Math.PI*2;
      const r1 = 12 + Math.random()*24;
      const r2 = r1 + 22 + Math.random()*28;
      el.style.left = x + 'px';
      el.style.top  = y + 'px';
      el.style.setProperty('--x',  (Math.cos(a)*r1) + 'px');
      el.style.setProperty('--y',  (Math.sin(a)*r1) + 'px');
      el.style.setProperty('--x2', (Math.cos(a)*r2) + 'px');
      el.style.setProperty('--y2', (Math.sin(a)*r2) + 'px');
      el.addEventListener('animationend', () => el.remove());
      document.body.appendChild(el);
    }
  }

  function moonEffect(x, y) {
    const el = document.createElement('div');
    el.className = 'moon';
    el.style.left = x + 'px';
    el.style.top  = y + 'px';
    // gentle drift
    const ang = Math.random()*Math.PI*2, dist = 40 + Math.random()*40;
    el.style.setProperty('--mx', Math.cos(ang)*dist + 'px');
    el.style.setProperty('--my', Math.sin(ang)*dist + 'px');
    el.addEventListener('animationend', () => el.remove());
    document.body.appendChild(el);
  }

  function blackHoleEffect(x, y) {
    // center singularity
    const hole = document.createElement('div');
    hole.className = 'hole';
    hole.style.left = x + 'px'; hole.style.top = y + 'px';
    hole.addEventListener('animationend', () => hole.remove());
    document.body.appendChild(hole);

    // swirling ring
    const ring = document.createElement('div');
    ring.className = 'accretion';
    ring.style.left = x + 'px'; ring.style.top = y + 'px';
    ring.addEventListener('animationend', () => ring.remove());
    document.body.appendChild(ring);

    // specks around, sucked to center
    const specks = 60;
    for (let i=0; i<specks; i++) {
      const sp = document.createElement('div');
      sp.className = 'speck';
      // start scattered in a big circle
      const a = Math.random()*Math.PI*2;
      const r = 40 + Math.random()*240;
      const tx = Math.cos(a)*r, ty = Math.sin(a)*r;
      sp.style.left = x + 'px'; sp.style.top = y + 'px';
      sp.style.setProperty('--tx', tx+'px');
      sp.style.setProperty('--ty', ty+'px');
      // slight color variation
      sp.style.background = `hsl(${200+Math.random()*60} 95% ${60+Math.random()*20}%)`;
      sp.style.boxShadow = '0 0 6px rgba(180,220,255,.9)';
      sp.style.animationDelay = (Math.random()*0.12)+'s';
      sp.addEventListener('animationend', () => sp.remove());
      document.body.appendChild(sp);
    }
    // play sound
    if (sound) {
      sound.currentTime = 0;
      sound.play().catch(()=>{});
    }

  }

  function flash() {
    const editor = document.getElementById('editor');
    editor.classList.remove('flash'); void editor.offsetWidth; editor.classList.add('flash');
  }

  // ===== Key handling =====
  editor.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey) return;

    // Update caret position (pre-insert)
    const rect = getCaretRect();
    if (rect) lastCaret = { x: rect.right, y: rect.bottom };

    flash();

    // ENTER => black hole
    if (e.key === 'Enter') {
      requestAnimationFrame(() => blackHoleEffect(lastCaret.x, lastCaret.y));
      return; // let browser insert newline naturally
    }

    // Printable keys: detect lower / UPPER case A-Z
    if (e.key.length === 1) {
      const k = e.key;
      const isLower = /[a-z]/.test(k);
      const isUpper = /[A-Z]/.test(k);

      requestAnimationFrame(() => {
        if (isLower)      starsEffect(lastCaret.x, lastCaret.y);
        else if (isUpper) moonEffect(lastCaret.x, lastCaret.y);
        else              starsEffect(lastCaret.x, lastCaret.y); // fallback
      });
    }

    // Backspace/Tab etc.: mild star fallback for feedback
    if (e.key === 'Backspace' || e.key === 'Tab') {
      requestAnimationFrame(() => starsEffect(lastCaret.x, lastCaret.y));
    }
  });

  // Keep caret cached after edits/clicks
  editor.addEventListener('keyup', () => {
    const rect = getCaretRect();
    if (rect) lastCaret = { x: rect.right, y: rect.bottom };
  });
  editor.addEventListener('mouseup', () => {
    const rect = getCaretRect();
    if (rect) lastCaret = { x: rect.right, y: rect.bottom };
  });

  // Paste: trigger black hole for fun
  editor.addEventListener('paste', () => {
    setTimeout(() => {
      const rect = getCaretRect();
      if (rect) lastCaret = { x: rect.right, y: rect.bottom };
      blackHoleEffect(lastCaret.x, lastCaret.y);
    }, 0);
  });
})();
