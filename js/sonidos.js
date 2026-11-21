/* =========================================================
   Efectos de sonido sintetizados (sin archivos) + voz narradora.
   En iPhone el audio se activa con el primer toque en pantalla.
   ========================================================= */

const Sonido = (() => {
  let ctx = null;
  let maestro = null;
  let ambienteNodos = null;
  const config = { efectos: true, voz: true, ambiente: true };

  /* ---------- Truco para iPhone ----------
     iOS silencia Web Audio cuando el interruptor de silencio está activado.
     1) Safari 17+: navigator.audioSession.type = 'playback'
     2) Versiones anteriores: reproducir en bucle un <audio> silencioso
        cambia la sesión de audio a "reproducción" (como Música),
        y así los efectos suenan aunque el iPhone esté en silencio
        y se envían por AirPlay a la TV. */
  let audioSilencioso = null;
  function wavSilencioso() {
    const muestras = 4410; // 0.1 s a 44.1 kHz, 8 bits
    const buf = new Uint8Array(44 + muestras);
    const v = new DataView(buf.buffer);
    const txt = (o, s) => [...s].forEach((c, i) => buf[o + i] = c.charCodeAt(0));
    txt(0, 'RIFF'); v.setUint32(4, 36 + muestras, true); txt(8, 'WAVE');
    txt(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, 44100, true); v.setUint32(28, 44100, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true);
    txt(36, 'data'); v.setUint32(40, muestras, true);
    buf.fill(128, 44);
    let bin = ''; buf.forEach(b => bin += String.fromCharCode(b));
    return 'data:audio/wav;base64,' + btoa(bin);
  }
  function forzarSesionReproduccion() {
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { }
    if (!audioSilencioso) {
      audioSilencioso = document.createElement('audio');
      audioSilencioso.setAttribute('x-webkit-airplay', 'allow');
      audioSilencioso.setAttribute('playsinline', '');
      audioSilencioso.loop = true;
      audioSilencioso.preload = 'auto';
      audioSilencioso.src = wavSilencioso();
      audioSilencioso.style.display = 'none';
      document.body.appendChild(audioSilencioso);
    }
    if (audioSilencioso.paused) {
      const pr = audioSilencioso.play();
      if (pr && pr.catch) pr.catch(() => { });
    }
  }
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && ctx) {
      if (ctx.state !== 'running') ctx.resume();
      if (audioSilencioso && audioSilencioso.paused) audioSilencioso.play().catch(() => { });
    }
  });

  function activar() {
    forzarSesionReproduccion();
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      maestro = ctx.createGain();
      maestro.gain.value = 0.8;
      maestro.connect(ctx.destination);
    }
    if (ctx.state !== 'running') ctx.resume();
    // Desbloquear la voz en iOS con un enunciado vacío
    if ('speechSynthesis' in window && !activar.vozLista) {
      const u = new SpeechSynthesisUtterance(' ');
      u.volume = 0;
      speechSynthesis.speak(u);
      activar.vozLista = true;
    }
  }

  function ruido(duracion) {
    const buf = ctx.createBuffer(1, ctx.sampleRate * duracion, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    return src;
  }

  function tono(frec, inicio, dur, tipo = 'sine', vol = 0.3, frecFinal = null) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = tipo;
    o.frequency.setValueAtTime(frec, inicio);
    if (frecFinal) o.frequency.exponentialRampToValueAtTime(frecFinal, inicio + dur);
    g.gain.setValueAtTime(0.0001, inicio);
    g.gain.exponentialRampToValueAtTime(vol, inicio + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, inicio + dur);
    o.connect(g).connect(maestro);
    o.start(inicio);
    o.stop(inicio + dur + 0.05);
    return o;
  }

  const ef = {
    trueno() {
      const t = ctx.currentTime;
      const n = ruido(3);
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass'; f.frequency.setValueAtTime(900, t); f.frequency.exponentialRampToValueAtTime(80, t + 2.5);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(1.2, t + 0.05);
      g.gain.exponentialRampToValueAtTime(0.4, t + 0.4);
      g.gain.exponentialRampToValueAtTime(0.8, t + 0.6);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 3);
      n.connect(f).connect(g).connect(maestro);
      n.start(t); n.stop(t + 3);
    },
    latido(veces = 3) {
      const t = ctx.currentTime;
      for (let i = 0; i < veces; i++) {
        const b = t + i * 0.9;
        tono(60, b, 0.18, 'sine', 0.9, 40);
        tono(55, b + 0.22, 0.2, 'sine', 0.7, 35);
      }
    },
    grito() {
      const t = ctx.currentTime;
      const o = ctx.createOscillator();
      const lfo = ctx.createOscillator();
      const lfoG = ctx.createGain();
      const g = ctx.createGain();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(700, t);
      o.frequency.linearRampToValueAtTime(1400, t + 0.25);
      o.frequency.exponentialRampToValueAtTime(300, t + 1.3);
      lfo.frequency.value = 9; lfoG.gain.value = 40;
      lfo.connect(lfoG).connect(o.frequency);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.25, t + 0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
      o.connect(g).connect(maestro);
      o.start(t); lfo.start(t); o.stop(t + 1.5); lfo.stop(t + 1.5);
    },
    campana(veces = 1) {
      const t = ctx.currentTime;
      for (let i = 0; i < veces; i++) {
        const b = t + i * 1.6;
        [196, 392, 523, 784].forEach((f, j) => tono(f, b, 2.5 - j * 0.4, 'sine', 0.25 / (j + 1)));
      }
    },
    tic() { tono(1800, ctx.currentTime, 0.04, 'square', 0.08); },
    tac() { tono(1200, ctx.currentTime, 0.04, 'square', 0.08); },
    alarma() {
      const t = ctx.currentTime;
      for (let i = 0; i < 3; i++) tono(140, t + i * 0.35, 0.3, 'square', 0.25);
    },
    exito() {
      const t = ctx.currentTime;
      [523, 659, 784, 1047].forEach((f, i) => tono(f, t + i * 0.1, 0.35, 'triangle', 0.25));
    },
    fallo() {
      const t = ctx.currentTime;
      tono(300, t, 0.3, 'sawtooth', 0.15, 200);
      tono(200, t + 0.3, 0.6, 'sawtooth', 0.15, 90);
    },
    redoble(dur = 2.5) {
      const t = ctx.currentTime;
      const n = ruido(dur);
      const f = ctx.createBiquadFilter();
      f.type = 'bandpass'; f.frequency.value = 1800; f.Q.value = 0.7;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      for (let i = 0; i < dur * 22; i++) {
        const b = t + i / 22;
        g.gain.setValueAtTime(0.15 + (i / (dur * 22)) * 0.5, b);
        g.gain.exponentialRampToValueAtTime(0.02, b + 0.04);
      }
      n.connect(f).connect(g).connect(maestro);
      n.start(t); n.stop(t + dur);
      // platillo final
      setTimeout(() => ef.platillo(), dur * 1000);
    },
    platillo() {
      const t = ctx.currentTime;
      const n = ruido(1.5);
      const f = ctx.createBiquadFilter();
      f.type = 'highpass'; f.frequency.value = 5000;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.6, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
      n.connect(f).connect(g).connect(maestro);
      n.start(t); n.stop(t + 1.5);
      tono(80, t, 0.3, 'sine', 0.8, 40);
    },
    fanfarria() {
      const t = ctx.currentTime;
      const notas = [[392, 0], [392, 0.15], [392, 0.3], [523, 0.45], [659, 0.9], [784, 1.2]];
      notas.forEach(([f, d]) => { tono(f, t + d, 0.4, 'sawtooth', 0.12); tono(f / 2, t + d, 0.4, 'triangle', 0.15); });
      tono(1047, t + 1.5, 1.2, 'sawtooth', 0.12);
    },
    organo() {
      // acorde tenebroso estilo órgano (re menor)
      const t = ctx.currentTime;
      [146.8, 174.6, 220, 293.7, 349.2].forEach(f => {
        tono(f, t, 3, 'sawtooth', 0.05);
        tono(f * 2, t, 3, 'square', 0.02);
      });
    },
    fantasma() {
      const t = ctx.currentTime;
      const o = ctx.createOscillator();
      const lfo = ctx.createOscillator();
      const lfoG = ctx.createGain();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(400, t);
      o.frequency.linearRampToValueAtTime(700, t + 1);
      o.frequency.linearRampToValueAtTime(350, t + 2.2);
      lfo.frequency.value = 5; lfoG.gain.value = 25;
      lfo.connect(lfoG).connect(o.frequency);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.2, t + 0.3);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 2.3);
      o.connect(g).connect(maestro);
      o.start(t); lfo.start(t); o.stop(t + 2.4); lfo.stop(t + 2.4);
    },
    puerta() {
      const t = ctx.currentTime;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      const f = ctx.createBiquadFilter();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(90, t);
      for (let i = 0; i < 12; i++) o.frequency.linearRampToValueAtTime(90 + Math.random() * 120, t + i * 0.12);
      f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = 3;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.3, t + 0.1);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.5);
      o.connect(f).connect(g).connect(maestro);
      o.start(t); o.stop(t + 1.6);
    }
  };

  function reproducir(nombre, ...args) {
    if (!config.efectos) return;
    activar();
    if (!ctx || !ef[nombre]) return;
    try { ef[nombre](...args); } catch (e) { console.warn(e); }
  }

  function iniciarAmbiente() {
    if (!config.ambiente) return;
    activar();
    if (!ctx || ambienteNodos) return;
    const t = ctx.currentTime;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.05, t + 3);
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = 400;
    const oscs = [55, 55.4, 82.4].map(fr => {
      const o = ctx.createOscillator();
      o.type = 'sawtooth'; o.frequency.value = fr;
      o.connect(f); o.start();
      return o;
    });
    const lfo = ctx.createOscillator();
    const lfoG = ctx.createGain();
    lfo.frequency.value = 0.08; lfoG.gain.value = 250;
    lfo.connect(lfoG).connect(f.frequency); lfo.start();
    f.connect(g).connect(maestro);
    ambienteNodos = { g, oscs, lfo };
  }

  function detenerAmbiente() {
    if (!ambienteNodos || !ctx) return;
    const { g, oscs, lfo } = ambienteNodos;
    const t = ctx.currentTime;
    g.gain.cancelScheduledValues(t);
    g.gain.setValueAtTime(g.gain.value, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1);
    setTimeout(() => { oscs.forEach(o => o.stop()); lfo.stop(); }, 1100);
    ambienteNodos = null;
  }

  /* ---------- Voz narradora ---------- */
  let vozElegida = null;
  function buscarVoz() {
    if (!('speechSynthesis' in window)) return null;
    const voces = speechSynthesis.getVoices();
    if (!voces.length) return null;
    const pref = ['es-MX', 'es-US', 'es-419', 'es-ES', 'es'];
    for (const p of pref) {
      const v = voces.find(v => v.lang && v.lang.replace('_', '-').startsWith(p));
      if (v) return v;
    }
    return null;
  }
  if ('speechSynthesis' in window) {
    speechSynthesis.onvoiceschanged = () => { vozElegida = buscarVoz(); };
  }

  // Habla y devuelve una promesa que se resuelve al terminar.
  function decir(texto, { tono = 0.75, velocidad = 0.92 } = {}) {
    return new Promise(resolve => {
      if (!config.voz || !('speechSynthesis' in window)) {
        // Si no hay voz, esperar un tiempo proporcional para dar ritmo
        return setTimeout(resolve, Math.min(4000, 400 + texto.length * 25));
      }
      activar();
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(texto);
      vozElegida = vozElegida || buscarVoz();
      if (vozElegida) u.voice = vozElegida;
      u.lang = vozElegida ? vozElegida.lang : 'es-MX';
      u.pitch = tono;
      u.rate = velocidad;
      let listo = false;
      const fin = () => { if (!listo) { listo = true; resolve(); } };
      u.onend = fin;
      u.onerror = fin;
      // Respaldo por si iOS no dispara onend
      setTimeout(fin, 2500 + texto.length * 110);
      speechSynthesis.speak(u);
    });
  }

  function callar() {
    if ('speechSynthesis' in window) speechSynthesis.cancel();
  }

  return { activar, reproducir, decir, callar, iniciarAmbiente, detenerAmbiente, config };
})();
