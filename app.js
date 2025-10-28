(() => {
  const canvas = document.getElementById('canvas');

  // ===== State machine =====
  // 'night' | 'sunrise' | 'day' | 'sunset'
  let mode = 'night';
  let isTransitioning = false;

  // ===== WebAudio =====
  let audioCtx = null;
  function ensureAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
  }
  function envGain(time, a=0.005, d=0.15, s=0.0) {
    const g = audioCtx.createGain();
    g.gain.setValueAtTime(0.0001, time);
    g.gain.exponentialRampToValueAtTime(1.0, time + a);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0001, s), time + a + d);
    return g;
  }
  // SFX
  function playStar(){ const t=audioCtx.currentTime,o=audioCtx.createOscillator();o.type='sine';o.frequency.setValueAtTime(880,t);o.frequency.exponentialRampToValueAtTime(1760,t+0.06);const g=envGain(t,0.002,0.12,0.0001);g.gain.value=0.5;o.connect(g).connect(audioCtx.destination);o.start(t);o.stop(t+0.15); }
  function playMoon(){ const t=audioCtx.currentTime,o=audioCtx.createOscillator();o.type='triangle';o.frequency.setValueAtTime(180,t);o.frequency.exponentialRampToValueAtTime(140,t+0.18);const g=envGain(t,0.005,0.2,0.0001);g.gain.value=0.6;o.connect(g).connect(audioCtx.destination);o.start(t);o.stop(t+0.22); }
  function noiseBuffer(sec=0.6){ const r=audioCtx.sampleRate,len=Math.floor(r*sec),b=audioCtx.createBuffer(1,len,r),d=b.getChannelData(0); for(let i=0;i<len;i++) d[i]=(Math.random()*2-1)*0.8; return b; }
  function playGalaxy(){ const t=audioCtx.currentTime,src=audioCtx.createBufferSource(); src.buffer=noiseBuffer(0.7); const bp=audioCtx.createBiquadFilter(); bp.type='bandpass'; bp.frequency.setValueAtTime(400,t); bp.frequency.exponentialRampToValueAtTime(2200,t+0.6); const g=envGain(t,0.005,0.6,0.0001); g.gain.value=0.4; src.connect(bp).connect(g).connect(audioCtx.destination); src.start(t); src.stop(t+0.7); }
  function playMeteor(){ const t=audioCtx.currentTime,o=audioCtx.createOscillator(); o.type='sawtooth'; o.frequency.setValueAtTime(1100,t); o.frequency.exponentialRampToValueAtTime(220,t+0.5); const hp=audioCtx.createBiquadFilter(); hp.type='highpass'; hp.frequency.setValueAtTime(500,t); const g=envGain(t,0.002,0.5,0.0001); g.gain.value=0.4; o.connect(hp).connect(g).connect(audioCtx.destination); o.start(t); o.stop(t+0.52); }
  function playSunrise(){ const t=audioCtx.currentTime,master=audioCtx.createGain(); master.gain.setValueAtTime(0.0001,t); master.gain.exponentialRampToValueAtTime(0.7,t+0.8); master.gain.exponentialRampToValueAtTime(0.0001,t+2.4); const o1=audioCtx.createOscillator(),o2=audioCtx.createOscillator(); o1.type='triangle'; o2.type='triangle'; o1.frequency.setValueAtTime(220,t); o2.frequency.setValueAtTime(277.18,t); o1.detune.setValueAtTime(-6,t); o2.detune.setValueAtTime(+3,t); const nf=audioCtx.createBiquadFilter(); nf.type='highpass'; nf.frequency.setValueAtTime(800,t); const noise=audioCtx.createBufferSource(); noise.buffer=(function(){ const r=audioCtx.sampleRate,len=Math.floor(r*1.2),b=audioCtx.createBuffer(1,len,r),d=b.getChannelData(0); for(let i=0;i<len;i++) d[i]=(Math.random()*2-1)*0.35; return b; })(); const og=audioCtx.createGain(),og2=audioCtx.createGain(),ng=audioCtx.createGain(); og.gain.value=0.3; og2.gain.value=0.25; ng.gain.value=0.15; o1.connect(og).connect(master); o2.connect(og2).connect(master); noise.connect(nf).connect(ng).connect(master); master.connect(audioCtx.destination); o1.start(t); o2.start(t); noise.start(t); o1.stop(t+2.4); o2.stop(t+2.4); noise.stop(t+2.4); }
  function playDusk(){ const t=audioCtx.currentTime,master=audioCtx.createGain(); master.gain.setValueAtTime(0.6,t); master.gain.exponentialRampToValueAtTime(0.0001,t+1.4); const o1=audioCtx.createOscillator(),o2=audioCtx.createOscillator(); o1.type='triangle'; o2.type='triangle'; o1.frequency.setValueAtTime(277.18,t); o1.frequency.exponentialRampToValueAtTime(196.00,t+1.2); o2.frequency.setValueAtTime(220.00,t); o2.frequency.exponentialRampToValueAtTime(174.61,t+1.2); const nf=audioCtx.createBiquadFilter(); nf.type='lowpass'; nf.frequency.setValueAtTime(1800,t); nf.frequency.exponentialRampToValueAtTime(400,t+1.2); const noise=audioCtx.createBufferSource(); noise.buffer=(function(){ const r=audioCtx.sampleRate,len=Math.floor(r*1.2),b=audioCtx.createBuffer(1,len,r),d=b.getChannelData(0); for(let i=0;i<len;i++) d[i]=(Math.random()*2-1)*0.25; return b; })(); const og=audioCtx.createGain(),og2=audioCtx.createGain(),ng=audioCtx.createGain(); og.gain.value=0.22; og2.gain.value=0.2; ng.gain.value=0.12; o1.connect(og).connect(master); o2.connect(og2).connect(master); noise.connect(nf).connect(ng).connect(master); master.connect(audioCtx.destination); o1.start(t); o2.start(t); noise.start(t); o1.stop(t+1.5); o2.stop(t+1.5); noise.stop(t+1.5); }

  // ===== Visual helpers =====
  function flash(){ canvas.classList.remove('flash'); void canvas.offsetWidth; canvas.classList.add('flash'); }
  function splash(x,y){ const el=document.createElement('div'); el.className='splash'; el.style.left=x+'px'; el.style.top=y+'px'; el.addEventListener('animationend',()=>el.remove()); document.body.appendChild(el); }

  // Effects
  function starsEffect(x,y){ const n=10+Math.floor(Math.random()*8); for(let i=0;i<n;i++){ const el=document.createElement('div'); el.className='star'; const a=Math.random()*Math.PI*2, r1=24+Math.random()*34, r2=r1+40+Math.random()*40; el.style.left=x+'px'; el.style.top=y+'px'; el.style.setProperty('--x',(Math.cos(a)*r1)+'px'); el.style.setProperty('--y',(Math.sin(a)*r1)+'px'); el.style.setProperty('--x2',(Math.cos(a)*r2)+'px'); el.style.setProperty('--y2',(Math.sin(a)*r2)+'px'); el.addEventListener('animationend',()=>el.remove()); document.body.appendChild(el);} splash(x,y); playStar(); }
  function moonEffect(x,y){ const el=document.createElement('div'); el.className='moon'; el.style.left=x+'px'; el.style.top=y+'px'; const a=Math.random()*Math.PI*2, d=60+Math.random()*60; el.style.setProperty('--mx',Math.cos(a)*d+'px'); el.style.setProperty('--my',Math.sin(a)*d+'px'); el.addEventListener('animationend',()=>el.remove()); document.body.appendChild(el); splash(x,y); playMoon(); }
  function galaxyEffect(x,y){ const ring=document.createElement('div'); ring.className='galaxy'; ring.style.left=x+'px'; ring.style.top=y+'px'; const a=Math.random()*Math.PI*2, d=40+Math.random()*40; ring.style.setProperty('--gx',Math.cos(a)*d+'px'); ring.style.setProperty('--gy',Math.sin(a)*d+'px'); ring.addEventListener('animationend',()=>ring.remove()); document.body.appendChild(ring); const specks=44; for(let i=0;i<specks;i++){ const sp=document.createElement('div'); sp.className='speck'; const ang=Math.random()*Math.PI*2, r=60+Math.random()*260; sp.style.left=x+'px'; sp.style.top=y+'px'; sp.style.setProperty('--tx',Math.cos(ang)*r+'px'); sp.style.setProperty('--ty',Math.sin(ang)*r+'px'); sp.style.animationDelay=(Math.random()*0.14)+'s'; sp.addEventListener('animationend',()=>sp.remove()); document.body.appendChild(sp);} splash(x,y); playGalaxy(); }
  function meteorEffect(x,y){ const el=document.createElement('div'); el.className='meteor'; const ang=(Math.random()*60-30)*Math.PI/180, len=360+Math.random()*260; el.style.left=x+'px'; el.style.top=y+'px'; el.style.setProperty('--sx',-Math.cos(ang)*14+'px'); el.style.setProperty('--sy',-Math.sin(ang)*14+'px'); el.style.setProperty('--ex',Math.cos(ang)*len+'px'); el.style.setProperty('--ey',Math.sin(ang)*len+'px'); el.style.setProperty('--rot',ang+'rad'); el.addEventListener('animationend',()=>el.remove()); document.body.appendChild(el); splash(x,y); playMeteor(); }

  // Sun helpers
  function sunEl(){ let s=document.querySelector('.sun'); if(!s){ s=document.createElement('div'); s.className='sun'; document.body.appendChild(s);} return s; }

  // ===== Transitions =====
  function startSunrise(){
    if(isTransitioning) return;
    isTransitioning = true;
    mode = 'sunrise';
    clearCosmos();
    document.body.classList.remove('sunset','day');
    document.body.classList.add('sunrise');
    const s = sunEl(); s.classList.remove('set'); s.classList.add('rise');
    playSunrise();
    setTimeout(()=>{
      document.body.classList.remove('sunrise');
      document.body.classList.add('day');
      s.classList.remove('rise');
      // Pin the sun visibly in the sky for day mode
      s.style.top = '45vh';
      s.style.left = '50vw';
      s.style.opacity = '1';
      s.style.transform = 'translate(-50%,-50%) scale(1)';
      mode = 'day';
      isTransitioning = false;
    }, 2200);
  }

  function startSunset(){
    if(isTransitioning) return;
    isTransitioning = true;
    mode = 'sunset';
    const s = sunEl(); s.classList.remove('rise'); s.classList.add('set');
    document.body.classList.remove('sunrise'); document.body.classList.add('sunset');
    playDusk();
    setTimeout(()=>{
      document.body.classList.remove('day','sunset'); // back to pure night classes
      // Remove sun after it sets
      if (s && s.parentNode) s.remove();
      mode = 'night';
      isTransitioning = false;
    }, 1500);
  }

  // Utilities
  function clearCosmos(){ document.querySelectorAll('.star,.moon,.galaxy,.speck,.splash,.meteor').forEach(n=>n.remove()); }
  function randomXY(){ const m=40; return { x: m + Math.random()*(window.innerWidth - m*2), y: m + Math.random()*(window.innerHeight - m*2) }; }
  function randomEffect(x,y){ [starsEffect,moonEffect,galaxyEffect,meteorEffect][Math.floor(Math.random()*4)](x,y); }

  // ===== Interactions =====
  canvas.addEventListener('pointerdown', ()=>{ canvas.focus(); ensureAudio(); });
  canvas.addEventListener('keydown', (e)=>{
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    e.preventDefault();
    ensureAudio();
    flash();

    if (e.key === ' ') { startSunrise(); return; }
    if (mode === 'day' || mode === 'sunrise') { startSunset(); return; }
    if (isTransitioning) return; // ignore spawns mid-transition

    const {x,y} = randomXY();
    randomEffect(x,y);
  });

  // Focus initially
  canvas.focus();
})();