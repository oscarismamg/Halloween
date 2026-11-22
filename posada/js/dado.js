/* =========================================================
   🎲 DADO DE REGALOS: dado gigante para intercambios con robo
   ========================================================= */

JUEGOS.push({ id: 'dado', icono: '🎲', nombre: 'Dado de Regalos', desc: 'Dado gigante para robar regalos' });

const DINAMICAS_DADO = {
  broma: {
    nombre: '🤡 Broma Bomba', desc: 'Regalos de broma, se abren al tomarlos',
    caras: ['🎁 Toma uno del centro y ÁBRELO frente a todos', '😈 REGALA el tuyo a quien tú elijas', '🦹 ROBA un regalo ya abierto', '⬅️ Cambia con quien está a tu IZQUIERDA', '➡️ Cambia con quien está a tu DERECHA', '👑 ¡Tú decides! Cualquiera de las anteriores']
  },
  robo: {
    nombre: '🎁 El Gran Robo', desc: 'Regalos buenos, se abren hasta el final',
    caras: ['🎁 Toma un regalo del CENTRO', '🎁 Toma un regalo del CENTRO', '🦹 ROBA el regalo que quieras', '⬅️ Cambia con quien está a tu IZQUIERDA', '🔄 TODOS pasan su regalo a la izquierda', '🎲 ¡Vuelve a tirar!']
  },
  parimpar: {
    nombre: '⚖️ Par toma, impar roba', desc: 'La versión clásica de posada',
    caras: ['🦹 Impar: ROBA un regalo', '🎁 Par: toma uno del CENTRO', '🦹 Impar: ROBA un regalo', '🎁 Par: toma uno del CENTRO', '🦹 Impar: ROBA un regalo', '🎁 Par: toma uno del CENTRO']
  },
  libre: { nombre: '🎲 Solo el dado', desc: 'Números del 1 al 6, sin reglas', caras: ['1', '2', '3', '4', '5', '6'] }
};

const DadoRegalos = (() => {
  let S = null, cfg = null;
  // Rotación que deja cada cara al frente
  const ROT = { 1: [0, 0], 2: [0, -90], 3: [-90, 0], 4: [90, 0], 5: [0, 90], 6: [0, 180] };
  const PUNTOS = { 1: [5], 2: [1, 9], 3: [1, 5, 9], 4: [1, 3, 7, 9], 5: [1, 3, 5, 7, 9], 6: [1, 3, 4, 6, 7, 9] };

  function carasDe(clave) {
    const guardadas = (P.dadoCaras || {})[clave];
    return guardadas && guardadas.length === 6 ? guardadas : DINAMICAS_DADO[clave].caras.slice();
  }

  function config() {
    if (!cfg) cfg = { sel: new Set(conectados()), dinamica: 'broma', turnos: true, celular: true };
    pintarConfig();
  }
  function pintarConfig() {
    conectados().forEach(u => { if (!cfg.vistos || !cfg.vistos.has(u)) cfg.sel.add(u); });
    cfg.vistos = new Set(conectados());
    Juego.iniciar({ refrescar: () => { if (pantallaActual === 'dado-config') pintarConfig(); }, llego: vistaLobby });
    const caras = carasDe(cfg.dinamica);
    const sw = (k, t) => `<label class="ajuste">${t}<span class="interruptor"><input type="checkbox" data-k="${k}" ${cfg[k] ? 'checked' : ''}><span></span></span></label>`;
    pantalla('dado-config', `
      ${barra('🎲 Dado de Regalos')}
      <div class="contenido" style="justify-content:flex-start">
        <h3>🎁 ¿Qué dinámica?</h3>
        <div class="menu-juegos">${Object.entries(DINAMICAS_DADO).map(([k, d]) => `
          <button class="juego-boton ${cfg.dinamica === k ? 'elegida-din' : ''}" data-a="din" data-k="${k}">
            <span><div class="nombre">${d.nombre}</div><div class="desc">${d.desc}</div></span></button>`).join('')}</div>
        <div class="tarjeta">
          <h3 style="margin-top:0">Caras del dado <span class="tenue" style="font-weight:600">(toca una para cambiar el texto)</span></h3>
          <div class="leyenda-dado">${caras.map((c, i) => `<button class="cara-leyenda" data-a="editar" data-i="${i}"><span class="num-cara">${i + 1}</span>${escaparHTML(c)}</button>`).join('')}</div>
          <div class="fila" style="justify-content:flex-end;margin-top:.5em"><button class="btn secundario chico" data-a="restaurar">↩️ Textos originales</button></div>
        </div>
        <div class="tarjeta">
          ${sw('turnos', '👥 Llevar turnos (en orden)')}
          ${sw('celular', '📱 Cada quien tira desde su celular cuando le toca')}
        </div>
        ${cfg.turnos ? `<h3>🙋 ¿Quién juega? <span class="tenue" style="font-weight:600">(el orden se revuelve al empezar)</span></h3>${htmlSeleccion(cfg.sel)}` : ''}
        <div class="fila"><button class="btn grande" data-a="empezar" ${cfg.turnos && ![...cfg.sel].filter(enLinea).length ? 'disabled' : ''}>🎲 ¡Al dado!</button></div>
      </div>`, {
      salir: confirmarSalida,
      din: d => { cfg.dinamica = d.k; pintarConfig(); },
      editar: d => {
        const i = +d.i, c = carasDe(cfg.dinamica);
        const nuevo = prompt(`Texto para la cara ${i + 1}:`, c[i]);
        if (nuevo && nuevo.trim()) { c[i] = nuevo.trim().slice(0, 80); P.dadoCaras = P.dadoCaras || {}; P.dadoCaras[cfg.dinamica] = c; guardar(); pintarConfig(); }
      },
      restaurar: () => { if (P.dadoCaras) { delete P.dadoCaras[cfg.dinamica]; guardar(); } pintarConfig(); },
      alternar: d => { cfg.sel.has(d.uid) ? cfg.sel.delete(d.uid) : cfg.sel.add(d.uid); pintarConfig(); },
      empezar: iniciar
    });
    app.querySelectorAll('input[data-k]').forEach(i => i.addEventListener('change', () => { cfg[i.dataset.k] = i.checked; pintarConfig(); }));
  }

  function iniciar() {
    S = {
      caras: carasDe(cfg.dinamica), nombreDin: DINAMICAS_DADO[cfg.dinamica].nombre,
      orden: cfg.turnos ? barajar([...cfg.sel].filter(enLinea)) : [], turno: 0,
      girando: false, resultado: null, rx: 0, ry: 0, tiros: 0, reloj: null, historial: []
    };
    Juego.iniciar({ llego: u => ponerVista(u, vistaPara(u)), mensaje, salio: () => { } });
    pintar();
    actualizarCelulares();
    Sonido.reproducir('cascabeles');
    Sonido.decir(`${sinEmojis(S.nombreDin)}. ${S.orden.length ? `Empieza ${nombre(S.orden[0])}.` : '¡A tirar el dado!'}`);
  }

  const actual = () => (S.orden.length ? S.orden[S.turno % S.orden.length] : null);

  function htmlDado() {
    return `<div class="escena-dado"><div class="dado" id="dado" style="transform: rotateX(${S.rx}deg) rotateY(${S.ry}deg)">
      ${[1, 2, 3, 4, 5, 6].map(n => `<div class="cara-dado c${n}">${Array.from({ length: 9 }, (_, i) => `<span class="${PUNTOS[n].includes(i + 1) ? 'pip' : ''}"></span>`).join('')}</div>`).join('')}
    </div></div>`;
  }

  function pintar() {
    pantalla('dado', `
      ${barra(`🎲 ${S.nombreDin}`)}
      <div class="contenido dado-layout">
        <div class="col-dado">
          <div id="turnoDado" class="turno-dado"></div>
          ${htmlDado()}
          <div class="fila">
            <button class="btn grande" data-a="tirar" id="btnTirar">🎲 ¡Tirar!</button>
            ${S.orden.length ? '<button class="btn secundario" data-a="siguiente">⏭ Siguiente turno</button>' : ''}
          </div>
        </div>
        <div class="col-leyenda">
          <div id="resultadoDado" class="resultado-dado"></div>
          <div class="leyenda-dado tv">${S.caras.map((c, i) => `<div class="cara-leyenda" id="ley${i + 1}"><span class="num-cara">${i + 1}</span>${escaparHTML(c)}</div>`).join('')}</div>
          <div class="fila" style="justify-content:flex-start">
            <button class="btn secundario chico" data-a="relampago" id="btnRelampago">⏱️ Ronda relámpago (3 min)</button>
            ${S.orden.length ? '<button class="btn secundario chico" data-a="revolver">🔀 Revolver orden</button>' : ''}
            <span id="relojRelampago" class="reloj-relampago"></span>
          </div>
          ${S.orden.length ? '<div id="ordenDado" class="fichas" style="justify-content:flex-start"></div>' : ''}
        </div>
      </div>`, {
      salir: () => { detenerRelampago(); confirmarSalida(); },
      tirar: () => tirar(null),
      siguiente: siguiente,
      revolver: () => { S.orden = barajar(S.orden); S.turno = 0; S.resultado = null; actualizarTextos(); actualizarCelulares(); },
      relampago: () => (S.reloj ? detenerRelampago() : relampago())
    });
    alSalir(() => detenerRelampago());
    actualizarTextos();
  }

  function actualizarTextos() {
    const t = document.getElementById('turnoDado');
    const u = actual();
    if (t) t.innerHTML = u ? `Turno de <b>${ficha(u)}</b>${cfg.celular && !esBot(u) ? ' · 📱 tira desde tu celular' : ''}` : '';
    const o = document.getElementById('ordenDado');
    if (o) o.innerHTML = S.orden.map((x, i) => `<span class="ficha ${i === S.turno % S.orden.length ? 'activa' : 'apagada'}">${i + 1}. ${ficha(x)}</span>`).join('');
    const r = document.getElementById('resultadoDado');
    if (r) r.innerHTML = S.resultado ? `<div class="aparecer"><span class="num-grande">${S.resultado}</span> ${escaparHTML(S.caras[S.resultado - 1])}</div>` : '<span class="tenue">Tira el dado… 🎲</span>';
    for (let i = 1; i <= 6; i++) { const el = document.getElementById('ley' + i); if (el) el.classList.toggle('activa', S.resultado === i); }
  }

  function tirar(quien) {
    if (S.girando) return;
    S.girando = true; S.resultado = null; S.quienTiro = quien;
    actualizarTextos();
    const n = 1 + Math.floor(Math.random() * 6);
    const [x, y] = ROT[n];
    // Varias vueltas completas + la orientación final
    const vueltasX = 2 + Math.floor(Math.random() * 3), vueltasY = 2 + Math.floor(Math.random() * 3);
    S.rx = (Math.ceil(S.rx / 360) + vueltasX) * 360 + x;
    S.ry = (Math.ceil(S.ry / 360) + vueltasY) * 360 + y;
    const dado = document.getElementById('dado');
    if (dado) { dado.classList.add('girando'); dado.style.transform = `rotateX(${S.rx}deg) rotateY(${S.ry}deg)`; }
    const btn = document.getElementById('btnTirar'); if (btn) btn.disabled = true;
    actualizarCelulares();
    let k = 0; const ruido = setInterval(() => { Sonido.reproducir(k++ % 2 ? 'tic' : 'tac'); }, 110);
    setTimeout(() => {
      clearInterval(ruido);
      if (!document.getElementById('dado')) return;
      dado.classList.remove('girando');
      S.girando = false; S.resultado = n; S.tiros++;
      if (btn) btn.disabled = false;
      Sonido.reproducir('ding'); destello();
      actualizarTextos();
      actualizarCelulares();
      const u = actual();
      Sonido.decir(`¡${n}! ${sinEmojis(S.caras[n - 1])}`, { tono: 1, velocidad: 1 });
      // "Vuelve a tirar": el mismo jugador puede tirar otra vez
      if (/vuelve a tirar/i.test(S.caras[n - 1])) setTimeout(() => { if (S.resultado === n && actual() === u) { S.resultado = null; actualizarTextos(); actualizarCelulares(); } }, 2500);
    }, 1700);
  }

  function siguiente() {
    if (!S.orden.length || S.girando) return;
    S.turno = (S.turno + 1) % S.orden.length;
    S.resultado = null;
    actualizarTextos();
    actualizarCelulares();
    Sonido.reproducir('cascabeles', 0.3);
    Sonido.decir(`Turno de ${nombre(actual())}.`);
  }

  /* ---------- Ronda relámpago ---------- */
  function relampago() {
    let s = 180;
    const el = () => document.getElementById('relojRelampago');
    const pintarR = () => { if (el()) { el().textContent = `⏱️ ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; el().classList.toggle('urgente', s <= 15); } };
    pintarR();
    const b = document.getElementById('btnRelampago'); if (b) b.textContent = '⏹ Detener relámpago';
    Sonido.reproducir('timbre');
    Sonido.decir('¡Ronda relámpago! Tres minutos. Tiren rápido, que se acaba el tiempo.');
    S.reloj = setInterval(() => {
      s--; pintarR();
      if (s <= 10 && s > 0) Sonido.reproducir('tic');
      if (s <= 0) {
        detenerRelampago();
        Sonido.reproducir('alarma'); destello(); temblar(); lluvia(['🎁', '🎉', '⭐'], 60);
        if (el()) el().textContent = '🔔 ¡SE ACABÓ!';
        Sonido.decir('¡Se acabó el tiempo! El regalo que tienes en las manos, es tuyo. ¡A abrirlos!');
      }
    }, 1000);
  }
  function detenerRelampago() {
    if (S && S.reloj) { clearInterval(S.reloj); S.reloj = null; }
    const b = document.getElementById('btnRelampago'); if (b) b.textContent = '⏱️ Ronda relámpago (3 min)';
  }

  /* ---------- Celulares ---------- */
  function vistaPara(u) {
    const turno = actual();
    if (!S.orden.length) return { tipo: 'espera', emoji: '🎲', titulo: 'Mira el dado en la TV', texto: '📺' };
    if (u === turno && cfg.celular) {
      if (S.girando) return { tipo: 'espera', emoji: '🎲', titulo: '¡Rodando!', texto: 'Mira la TV 📺' };
      if (S.resultado) return { tipo: 'espera', emoji: '🎁', titulo: `¡Sacaste ${S.resultado}!`, texto: S.caras[S.resultado - 1] };
      return { tipo: 'dado', titulo: '¡Te toca tirar!', vibrar: true };
    }
    if (u === turno) return { tipo: 'espera', emoji: '🎲', titulo: '¡Te toca!', texto: 'Tira el dado en la TV' };
    const pos = (S.orden.indexOf(u) - S.turno % S.orden.length + S.orden.length) % S.orden.length;
    return { tipo: 'espera', emoji: '🎁', titulo: `Turno de ${nombre(turno)}`, texto: S.orden.includes(u) ? (pos === 1 ? '¡Tú sigues! Prepárate 👀' : `Te toca en ${pos} turnos`) : 'Mira la TV 📺' };
  }
  function actualizarCelulares() { conectados().forEach(u => ponerVista(u, vistaPara(u))); }
  function mensaje(u, m) {
    if (m.t === 'tirar' && S && u === actual() && cfg.celular && !S.girando && !S.resultado) tirar(u);
  }
  return { config };
})();

REGISTRO.dado = DadoRegalos;
