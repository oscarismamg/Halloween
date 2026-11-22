/* =========================================================
   Más juegos de la Posada: Lotería, ¿Quién es más probable?,
   Mentiras Navideñas, Adivina el Villancico y Rompe la Piñata.
   Usa las funciones de tv-posada.js (pantalla, ponerVista, etc.)
   ========================================================= */

JUEGOS.push(
  { id: 'loteria', icono: '🎴', nombre: 'Lotería Navideña', desc: 'Tu tabla en el celular' },
  { id: 'probable', icono: '👉', nombre: '¿Quién es más probable?', desc: 'Vota por quien del grupo…' },
  { id: 'mentiras', icono: '🤥', nombre: 'Mentiras Navideñas', desc: 'Engaña a todos con tu mentira' },
  { id: 'villancico', icono: '🔔', nombre: 'Adivina el Villancico', desc: 'Emojis y botón ¡BASTA!' },
  { id: 'pinata', icono: '🪅', nombre: 'Rompe la Piñata', desc: '¡Dale, dale, dale!' }
);

/* ---------------- Utilidades compartidas ---------------- */
function quitarAcentos(s) { return String(s).normalize('NFD').replace(/[̀-ͯ]/g, ''); }
function normalizar(s) { return quitarAcentos(s).toLowerCase().replace(/[^a-z0-9ñ ]/g, ' ').replace(/\b(el|la|los|las|un|una|de|del)\b/g, ' ').replace(/\s+/g, ' ').trim(); }
function distancia(a, b) {
  const m = a.length, n = b.length, d = Array.from({ length: m + 1 }, (_, i) => [i]);
  for (let j = 1; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[m][n];
}
function seParece(a, b) {
  const x = normalizar(a), y = normalizar(b);
  if (!x || !y) return false;
  if (x === y) return true;
  if (y.length >= 4 && (x.includes(y) || y.includes(x))) return true;
  return distancia(x, y) <= Math.max(1, Math.floor(y.length / 5));
}
function tomarAlAzar(lista, claveUsadas, n) {
  if (!P[claveUsadas]) P[claveUsadas] = [];
  let disp = lista.map((_, i) => i).filter(i => !P[claveUsadas].includes(i));
  if (disp.length < n) { P[claveUsadas] = []; disp = lista.map((_, i) => i); }
  const el = barajar(disp).slice(0, n);
  P[claveUsadas].push(...el); guardar();
  return el.map(i => lista[i]);
}
function premiarTop(puntos) {
  const orden = Object.keys(puntos).filter(u => puntos[u] > 0).sort((a, b) => puntos[b] - puntos[a]);
  [3, 2, 1].forEach((p, i) => { if (orden[i]) sumarPuntos([orden[i]], p); });
  return orden;
}
function htmlRanking(puntos) {
  const t = Object.keys(puntos).sort((a, b) => puntos[b] - puntos[a]), med = ['🥇', '🥈', '🥉'];
  return `<div class="marcador ${t.length > 7 ? 'dos' : ''}">${t.map((u, i) => `<div class="marcador-fila" style="grid-template-columns:3em 1fr auto"><span class="pos">${med[i] || i + 1}</span><span>${ficha(u)}</span><span class="pts">${puntos[u]}</span></div>`).join('')}</div>`;
}
function pantallaFinal(titulo, puntos, onOtra) {
  const orden = premiarTop(puntos);
  Juego.iniciar({ llego: vistaLobby });
  pantalla('fin-extra', `
    ${barra(titulo)}
    <div class="contenido">
      <h2>${orden[0] ? `🏆 ¡Gana ${ficha(orden[0])}!` : '🏆 Resultados'}</h2>
      ${htmlRanking(puntos)}
      <p class="centro tenue">Marcador de la noche: 🥇 +3 · 🥈 +2 · 🥉 +1</p>
      <div class="fila"><button class="btn secundario" data-a="otra">🔁 Otra partida</button><button class="btn secundario" data-a="marcador">🏆 Marcador de la noche</button><button class="btn" data-a="menu">◀ Menú</button></div>
    </div>`, { salir: menu, menu, marcador: pantallaMarcador, otra: onOtra });
  conectados().forEach(u => vistaEspera(u, orden[0] === u ? '¡GANASTE! 🏆' : '¡Se acabó!', puntos[u] != null ? `Hiciste ${puntos[u]} puntos` : 'Mira la TV 📺', orden[0] === u ? '🏆' : '🎄'));
  Sonido.reproducir('navidad'); lluvia();
  if (orden[0]) Sonido.decir(`¡Gana ${nombre(orden[0])}!`);
}

/* Configuración genérica: quién juega + ajustes numéricos */
function crearConfig({ clave, titulo, min, ajustes = [], opciones = null, nota = '', onSeguir }) {
  let cfg = null;
  function config() {
    if (!cfg) { cfg = { sel: new Set(conectados()) }; ajustes.forEach(a => cfg[a.k] = a.def); if (opciones) cfg[opciones.k] = opciones.def; }
    pintar();
  }
  function seleccion() { return [...cfg.sel].filter(enLinea); }
  function pintar() {
    conectados().forEach(u => { if (!cfg.vistos || !cfg.vistos.has(u)) cfg.sel.add(u); });
    cfg.vistos = new Set(conectados());
    Juego.iniciar({ refrescar: () => { if (pantallaActual === 'cfg-' + clave) pintar(); }, llego: vistaLobby });
    const n = seleccion().length;
    pantalla('cfg-' + clave, `
      ${barra(titulo)}
      <div class="contenido" style="justify-content:flex-start">
        <h3>🙋 ¿Quién juega?</h3>
        ${htmlSeleccion(cfg.sel)}
        ${(ajustes.length || opciones) ? `<div class="tarjeta">
          ${opciones ? `<div class="ajuste">${opciones.etiqueta}<span class="fila" style="gap:.5em">${opciones.valores.map(o => `<button class="btn chico ${cfg[opciones.k] === o.v ? '' : 'secundario'}" data-a="opcion" data-v="${o.v}">${o.t}</button>`).join('')}</span></div>` : ''}
          ${ajustes.map(a => `<div class="ajuste">${a.etiqueta}<span class="contador"><button class="btn secundario chico" data-a="menos" data-k="${a.k}">−</button><b>${cfg[a.k]}</b><button class="btn secundario chico" data-a="mas" data-k="${a.k}">+</button></span></div>`).join('')}
          ${nota ? `<p class="tenue" style="margin:.3em 0 0">${nota}</p>` : ''}
        </div>` : ''}
        <div class="fila"><button class="btn grande" data-a="seguir" ${n < min ? 'disabled' : ''}>Siguiente ▶</button></div>
        ${n < min ? `<p class="centro tenue">Se necesitan al menos ${min} jugadores</p>` : ''}
      </div>`, {
      salir: confirmarSalida,
      alternar: d => { cfg.sel.has(d.uid) ? cfg.sel.delete(d.uid) : cfg.sel.add(d.uid); pintar(); },
      opcion: d => { cfg[opciones.k] = d.v; pintar(); },
      menos: d => { const a = ajustes.find(x => x.k === d.k); cfg[a.k] = Math.max(a.min, cfg[a.k] - a.paso); pintar(); },
      mas: d => { const a = ajustes.find(x => x.k === d.k); cfg[a.k] = Math.min(a.max, cfg[a.k] + a.paso); pintar(); },
      seguir: () => onSeguir(barajar(seleccion()), cfg)
    });
  }
  return config;
}

/* =========================================================
   🎴 LOTERÍA NAVIDEÑA
   ========================================================= */
const Loteria = (() => {
  let L = null;
  const PATRONES = {
    linea: [[0, 1, 2, 3], [4, 5, 6, 7], [8, 9, 10, 11], [12, 13, 14, 15], [0, 4, 8, 12], [1, 5, 9, 13], [2, 6, 10, 14], [3, 7, 11, 15], [0, 5, 10, 15], [3, 6, 9, 12]],
    esquinas: [[0, 3, 12, 15]],
    llena: [Array.from({ length: 16 }, (_, i) => i)]
  };
  const NOMBRE_MODO = { linea: 'Línea (fila, columna o diagonal)', esquinas: '4 esquinas', llena: 'Tabla llena' };

  const config = crearConfig({
    clave: 'loteria', titulo: '🎴 Lotería Navideña', min: 1,
    opciones: { k: 'modo', etiqueta: '¿Cómo se gana?', def: 'linea', valores: [{ v: 'linea', t: '➖ Línea' }, { v: 'esquinas', t: '🔲 Esquinas' }, { v: 'llena', t: '🟥 Llena' }] },
    ajustes: [{ k: 'intervalo', etiqueta: 'Segundos entre cartas', def: 7, min: 3, max: 20, paso: 1 }],
    nota: 'Quien no juegue no recibe tabla. ¡Pueden ponerle frijolitos de verdad a la pantalla! 🫘',
    onSeguir: (ps, cfg) => pantallaReglas('🎴 Lotería Navideña', [
      'Cada quien tiene <b>su tabla</b> en el celular, con 16 cartas navideñas.',
      'La TV va <b>cantando</b> las cartas con su verso. Si la tienes, <b>tócala</b> en tu celular para marcarla 🫘.',
      `Se gana con: <b>${NOMBRE_MODO[cfg.modo]}</b>. Cuando la tengas, aprieta <b>¡LOTERÍA!</b>`,
      'El celular revisa solo. Si gritas lotería sin tenerla… ¡te quemas frente a todos! 😂'
    ], 'Lotería navideña. Cada quien tiene su tabla en el celular. La tele va cantando las cartas. Si la tienes, márcala. Cuando completes tu tabla, aprieta lotería. ¡Pero cuidado con las loterías falsas!', () => iniciar(ps, cfg))
  });

  function iniciar(ps, cfg) {
    L = { id: 'lot' + Date.now().toString(36), participantes: ps, modo: cfg.modo, intervalo: cfg.intervalo, tablas: {}, mazo: barajar(CARTAS_LOTERIA.map((_, i) => i)), cantadas: [], pausado: false, ganador: null, actual: null, cfg };
    ps.forEach(u => { L.tablas[u] = barajar(CARTAS_LOTERIA.map((_, i) => i)).slice(0, 16); });
    Juego.iniciar({ llego: u => ponerVista(u, vistaPara(u)), mensaje, salio: () => { } });
    pintar();
    conectados().forEach(u => ponerVista(u, vistaPara(u)));
    Sonido.decir('¡Corre y se va! Ahí va la primera.').then(() => setTimeout(cantar, 600));
  }

  function vistaPara(u) {
    if (!L.tablas[u]) return { tipo: 'espera', emoji: '🍿', titulo: 'Estás de público', texto: 'Entras en la siguiente partida' };
    const ult = L.actual != null ? CARTAS_LOTERIA[L.actual] : null;
    const v = { tipo: 'tabla', id: L.id, modo: NOMBRE_MODO[L.modo], cartas: L.tablas[u].map(i => ({ n: CARTAS_LOTERIA[i].n, e: CARTAS_LOTERIA[i].e })), ultima: ult ? { n: ult.n, e: ult.e } : null, num: L.cantadas.length };
    if (esBot(u)) v.botMarcadas = L.tablas[u].map((c, pos) => (L.cantadas.includes(c) ? pos : -1)).filter(p => p >= 0);
    return v;
  }

  function pintar() {
    const c = L.actual != null ? CARTAS_LOTERIA[L.actual] : null;
    pantalla('loteria', `
      ${barra(`🎴 Lotería · ${NOMBRE_MODO[L.modo]}`)}
      <div class="contenido" style="gap:1.5vh">
        <div class="dos-columnas" style="align-items:center">
          <div class="carta-loteria ${c ? 'aparecer' : ''}" id="cartaActual">
            ${c ? `<div class="num-carta">${L.cantadas.length}</div><div class="emoji-carta">${c.e}</div><div class="nombre-carta">${c.n}</div>` : '<div class="emoji-carta">🎴</div><div class="nombre-carta">¡Corre y se va!</div>'}
          </div>
          <div style="display:flex;flex-direction:column;gap:1.2vh">
            <div class="narracion" id="verso" style="font-size:clamp(1.1rem,3.6vmin,2.4rem);font-style:italic">${c ? `“${escaparHTML(c.v)}”` : ''}</div>
            <div class="mini-cartas">${CARTAS_LOTERIA.map((x, i) => `<span class="mini-carta ${L.cantadas.includes(i) ? 'salio' : ''}" title="${x.n}">${x.e}</span>`).join('')}</div>
            <div class="fila">
              <button class="btn secundario" data-a="pausa">${L.pausado ? '▶ Seguir' : '⏸ Pausa'}</button>
              <button class="btn secundario" data-a="lento">🐢 Más lento</button>
              <button class="btn secundario" data-a="rapido">🐇 Más rápido</button>
              <span class="etiqueta">${L.intervalo}s</span>
            </div>
          </div>
        </div>
        <div id="avisoLoteria" class="centro"></div>
      </div>`, {
      salir: () => { clearTimeout(L.timer); L.terminada = true; confirmarSalida(); },
      pausa: () => { L.pausado = !L.pausado; if (!L.pausado) cantar(); else clearTimeout(L.timer); pintar(); },
      lento: () => { L.intervalo = Math.min(20, L.intervalo + 1); pintar(); },
      rapido: () => { L.intervalo = Math.max(3, L.intervalo - 1); pintar(); }
    });
    alSalir(() => { clearTimeout(L.timer); });
  }

  async function cantar() {
    clearTimeout(L.timer);
    if (L.pausado || L.ganador || L.terminada || pantallaActual !== 'loteria') return;
    if (!L.mazo.length) { Sonido.decir('¡Se acabaron las cartas! Revisen bien sus tablas.'); return; }
    L.actual = L.mazo.pop();
    L.cantadas.push(L.actual);
    const c = CARTAS_LOTERIA[L.actual];
    pintar();
    Sonido.reproducir('cascabeles', 0.4);
    conectados().forEach(u => ponerVista(u, vistaPara(u)));
    const t0 = Date.now();
    await Sonido.decir(`${c.v}... ¡${c.n}!`, { tono: 1, velocidad: 1 });
    if (L.ganador || L.pausado || L.terminada) return;
    const espera = Math.max(1500, L.intervalo * 1000 - (Date.now() - t0));
    L.timer = setTimeout(cantar, espera);
  }

  function mensaje(u, m) {
    if (m.t !== 'loteria' || !L || L.ganador || m.id !== L.id || !L.tablas[u]) return;
    const marcadas = new Set((m.marcadas || []).map(Number));
    const tabla = L.tablas[u];
    const valida = PATRONES[L.modo].some(p => p.every(pos => marcadas.has(pos) && L.cantadas.includes(tabla[pos])));
    if (valida) return ganar(u, marcadas);
    if (m.bot) return; // los robots solo cantan lotería cuando la tienen
    // Lotería falsa
    Sonido.reproducir('tache'); temblar();
    const av = document.getElementById('avisoLoteria');
    if (av) { av.innerHTML = `<h2 class="aparecer" style="margin:0">😂 ¡Lotería FALSA de ${ficha(u)}! 🔥</h2>`; setTimeout(() => { if (av) av.innerHTML = ''; }, 4000); }
    Sonido.decir(`¡Falsa! ${nombre(u)} se quemó.`);
    vistaEspera(u, '¡Te quemaste! 🔥', 'Esa no era lotería… revisa bien tus cartas', '🫣');
    setTimeout(() => { if (L && !L.ganador) ponerVista(u, vistaPara(u)); }, 3000);
  }

  function ganar(u, marcadas) {
    L.ganador = u; clearTimeout(L.timer);
    Sonido.callar();
    sumarPuntos([u], 3);
    const tabla = L.tablas[u];
    Juego.iniciar({ llego: vistaLobby });
    pantalla('loteria-fin', `
      ${barra('🎴 ¡LOTERÍA!')}
      <div class="contenido">
        <h1 class="aparecer">🎉 ¡LOTERÍA! 🎉</h1>
        <div class="palabra-gigante">${ficha(u)}</div>
        <div class="tabla-tv">${tabla.map((i, pos) => `<div class="celda-tabla ${marcadas.has(pos) && L.cantadas.includes(i) ? 'marcada' : ''}"><span>${CARTAS_LOTERIA[i].e}</span><small>${CARTAS_LOTERIA[i].n}</small></div>`).join('')}</div>
        <p class="centro tenue">+3 puntos en el marcador de la noche · Salieron ${L.cantadas.length} cartas</p>
        <div class="fila"><button class="btn secundario" data-a="otra">🔁 Otra partida</button><button class="btn secundario" data-a="marcador">🏆 Marcador</button><button class="btn" data-a="menu">◀ Menú</button></div>
      </div>`, { salir: menu, menu, marcador: pantallaMarcador, otra: config });
    destello(); Sonido.reproducir('fanfarria'); lluvia(['🎴', '🫘', '🎉', '⭐'], 60);
    Sonido.decir(`¡Lotería! ¡Gana ${nombre(u)}!`);
    conectados().forEach(x => vistaEspera(x, x === u ? '¡GANASTE! 🎉' : `¡Lotería de ${nombre(u)}!`, x === u ? '+3 puntos para ti' : 'A la próxima… 🫘', x === u ? '🏆' : '🎴'));
  }

  return { config };
})();

/* =========================================================
   👉 ¿QUIÉN ES MÁS PROBABLE?
   ========================================================= */
const Probable = (() => {
  let Q = null;
  const config = crearConfig({
    clave: 'probable', titulo: '👉 ¿Quién es más probable?', min: 3,
    ajustes: [{ k: 'preguntas', etiqueta: 'Preguntas', def: 8, min: 3, max: 20, paso: 1 }],
    nota: 'Los que no jueguen no aparecen como opción… pero sí pueden votar 😏',
    onSeguir: (ps, cfg) => pantallaReglas('👉 ¿Quién es más probable?', [
      'Sale una pregunta tipo <b>"¿Quién es más probable que se duerma antes de las 12?"</b>',
      'Cada quien vota <b>en secreto</b> desde su celular por alguien del grupo (sí, te puedes votar a ti 😅).',
      'La TV revela quién se llevó más votos… <b>y quién votó por quién</b> 👀.',
      'Si votaste por el que ganó, te llevas puntos por <b>conocer bien a tu banda</b>.'
    ], '¿Quién es más probable? Sale una pregunta y cada quien vota en secreto por alguien del grupo. Luego la tele revela quién ganó, y quién votó por quién. Si votas con la mayoría, ganas puntos.', () => {
      Q = { candidatos: ps, preguntas: tomarAlAzar(PREGUNTAS_PROBABLE, 'usadasProbable', cfg.preguntas), idx: 0, puntos: {}, coronas: {} };
      ps.forEach(u => { Q.puntos[u] = 0; Q.coronas[u] = 0; });
      Juego.iniciar({ llego, mensaje, salio: () => { } , puntos: puntosDe('¿Quién es más probable?', () => Q.puntos) });
      pregunta();
    })
  });

  function opciones() { return Q.candidatos.filter(u => J(u)).map(u => ({ k: u, letra: J(u).emoji, texto: J(u).nombre })); }

  function pregunta() {
    const p = Q.preguntas[Q.idx];
    if (!p) return pantallaFinal('👉 ¿Quién es más probable?', Q.puntos, config);
    Q.fase = 'votar'; Q.votos = {};
    pantalla('probable', `
      ${barra(`👉 Pregunta ${Q.idx + 1} de ${Q.preguntas.length}`)}
      <div class="contenido">
        <div class="frase-chusca aparecer">${escaparHTML(p)}</div>
        <div id="reloj" class="reloj" style="font-size:clamp(3rem,13vmin,8rem)"></div>
        <div class="barra-tiempo"><div id="barraTiempo"></div></div>
        <p class="narracion" style="font-size:clamp(1rem,3vmin,2rem)">📱 ¡Voten en secreto! <span id="votosCuenta">0</span>/${conectados().length}</p>
        <div class="fila"><button class="btn secundario" data-a="ya">⏩ Ver resultados</button></div>
      </div>`, { salir: confirmarSalida, ya: revelar });
    Q.reloj = iniciarReloj(20, revelar);
    conectados().forEach(u => ponerVista(u, { tipo: 'votar', id: 'p' + Q.idx, frase: p, opciones: opciones(), titulo: '¿Quién?' }));
    Sonido.decir(p, { tono: 1, velocidad: 1 });
  }

  function revelar() {
    if (Q.fase !== 'votar') return;
    Q.fase = 'resultado'; Q.reloj && Q.reloj.detener(); Sonido.callar();
    const conteo = {};
    Object.entries(Q.votos).forEach(([v, k]) => { (conteo[k] = conteo[k] || []).push(v); });
    const orden = Object.keys(conteo).sort((a, b) => conteo[b].length - conteo[a].length);
    const max = orden.length ? conteo[orden[0]].length : 0;
    const ganadores = orden.filter(u => conteo[u].length === max);
    const total = Object.keys(Q.votos).length;
    ganadores.forEach(g => { if (Q.coronas[g] != null) Q.coronas[g]++; (conteo[g] || []).forEach(v => { if (Q.puntos[v] != null) Q.puntos[v] += 100; }); });
    pantalla('probable-res', `
      ${barra(`👉 Pregunta ${Q.idx + 1} de ${Q.preguntas.length}`)}
      <div class="contenido" style="gap:1.4vh">
        <div class="frase-chusca" style="font-size:clamp(1.1rem,3.6vmin,2.4rem)">${escaparHTML(Q.preguntas[Q.idx])}</div>
        ${!ganadores.length ? '<h2>Nadie votó 🦗</h2>'
        : ganadores.length <= 3 ? `<h1 class="aparecer" style="margin:0">👑 ${ganadores.map(ficha).join(' y ')}</h1>`
          : `<h2 class="aparecer" style="margin:0">🤝 ¡Empate entre ${ganadores.length}! Cada quien con ${max} ${max === 1 ? 'voto' : 'votos'}</h2>`}
        <div class="barras-votos ${orden.length > 6 ? 'dos' : ''}">
          ${orden.map(u => `<div class="fila-barra"><span class="quien">${ficha(u)}</span>
            <div class="barra-votos grande"><div style="width:${Math.round(conteo[u].length / total * 100)}%"></div></div>
            <span class="votantes">${conteo[u].map(v => J(v) ? J(v).emoji : '').join(' ')}</span></div>`).join('')}
        </div>
        <p class="centro tenue" style="margin:0">Quienes votaron por ${ganadores.length > 1 ? 'los ganadores' : 'el ganador'}: +100 por conocer a su banda</p>
        <div class="fila"><button class="btn grande" data-a="sig">${Q.idx + 1 >= Q.preguntas.length ? '🏆 Resultados' : 'Siguiente ▶'}</button></div>
      </div>`, { salir: confirmarSalida, sig: () => { Q.idx++; pregunta(); } });
    conectados().forEach(u => vistaEspera(u, ganadores.includes(u) ? '👑 ¡Fuiste tú!' : 'Resultados en la TV 📺', ganadores.includes(u) ? 'El pueblo ha hablado 😂' : (ganadores.includes(Q.votos[u]) ? '¡Le atinaste! +100' : 'No votaste con la mayoría'), ganadores.includes(u) ? '👑' : '👀'));
    if (ganadores.length) { Sonido.reproducir('redoble', 1.5); setTimeout(() => Sonido.decir(ganadores.length <= 3 ? `¡${ganadores.map(nombre).join(' y ')}!` : `¡Empate entre ${ganadores.length} personas!`), 1600); destello(); }
  }

  function llego(u) {
    if (Q && Q.fase === 'votar' && !Q.votos[u]) return ponerVista(u, { tipo: 'votar', id: 'p' + Q.idx, frase: Q.preguntas[Q.idx], opciones: opciones(), titulo: '¿Quién?' });
    const v = vistas.get(u); v ? ponerVista(u, v) : vistaLobby(u);
  }
  function mensaje(u, m) {
    if (m.t !== 'voto' || !Q || Q.fase !== 'votar' || m.id !== 'p' + Q.idx || Q.votos[u]) return;
    if (!Q.candidatos.includes(m.k)) return;
    Q.votos[u] = m.k;
    Sonido.reproducir('tic');
    vistaEspera(u, '¡Voto secreto registrado! 🤫', 'Espera los resultados', '✅');
    const el = document.getElementById('votosCuenta'); if (el) el.textContent = Object.keys(Q.votos).length;
    if (conectados().every(x => Q.votos[x])) setTimeout(revelar, 700);
  }
  return { config };
})();

/* =========================================================
   🤥 MENTIRAS NAVIDEÑAS
   ========================================================= */
const Mentiras = (() => {
  let M = null;
  const config = crearConfig({
    clave: 'mentiras', titulo: '🤥 Mentiras Navideñas', min: 2,
    ajustes: [{ k: 'preguntas', etiqueta: 'Preguntas', def: 6, min: 3, max: 15, paso: 1 }, { k: 'tiempo', etiqueta: 'Segundos para escribir', def: 60, min: 30, max: 180, paso: 15 }],
    onSeguir: (ps, cfg) => pantallaReglas('🤥 Mentiras Navideñas', [
      'Sale un <b>dato real</b> (y rarísimo) de Navidad con un hueco.',
      'Cada quien escribe en su celular una <b>mentira creíble</b> para llenar el hueco.',
      'Después todos ven las mentiras mezcladas con <b>la verdad</b>, y tienen que encontrarla.',
      'Encontrar la verdad: <b>+500</b>. Por cada persona que caiga en tu mentira: <b>+250</b> 😈. La última pregunta vale doble.'
    ], 'Mentiras navideñas. Sale un dato real con un hueco. Cada quien escribe una mentira creíble. Luego todos tienen que encontrar la verdad entre las mentiras. Si alguien cae en tu mentira, ganas puntos.', () => {
      M = { participantes: ps, preguntas: tomarAlAzar(PREGUNTAS_MENTIRAS, 'usadasMentiras', cfg.preguntas), idx: 0, puntos: {}, tiempo: cfg.tiempo };
      ps.forEach(u => M.puntos[u] = 0);
      Juego.iniciar({ llego, mensaje, salio: () => { } , puntos: puntosDe('Mentiras Navideñas', () => M.puntos) });
      escribir();
    })
  });
  const frase = q => escaparHTML(q.p).replace(/_{3,}/g, '<span class="hueco">&nbsp;</span>');
  const mult = () => (M.idx === M.preguntas.length - 1 ? 2 : 1);

  function escribir() {
    const q = M.preguntas[M.idx];
    if (!q) return pantallaFinal('🤥 Mentiras Navideñas', M.puntos, config);
    M.fase = 'escribir'; M.mentiras = {}; M.votos = {};
    pantalla('mentiras', `
      ${barra(`🤥 Pregunta ${M.idx + 1} de ${M.preguntas.length}${mult() > 1 ? ' · ¡vale doble!' : ''}`)}
      <div class="contenido">
        <div class="frase-chusca aparecer">${frase(q)}</div>
        <h3 class="centro">✍️ Escriban una mentira creíble en su celular</h3>
        <div id="reloj" class="reloj" style="font-size:clamp(3rem,12vmin,7rem)"></div>
        <div class="barra-tiempo"><div id="barraTiempo"></div></div>
        <div id="progreso"></div>
        <div class="fila"><button class="btn secundario" data-a="ya">⏩ Ya, a votar</button></div>
      </div>`, { salir: confirmarSalida, ya: votar });
    M.reloj = iniciarReloj(M.tiempo, votar);
    progreso();
    conectados().forEach(u => (M.participantes.includes(u) ? vistaEscribir(u) : vistaEspera(u, 'Eres público 🍿', 'En un momento te toca adivinar la verdad', '🍿')));
    Sonido.decir(sinEmojis(q.p), { tono: 1, velocidad: 1 });
  }
  function vistaEscribir(u, error) {
    const q = M.preguntas[M.idx];
    ponerVista(u, { tipo: 'escribir', id: 'm' + M.idx, frase: q.p, n: M.idx + 1, total: M.preguntas.length, instr: 'Escribe una MENTIRA creíble 🤥', error, max: 40, minusculas: true });
  }
  function progreso() {
    const el = document.getElementById('progreso');
    if (el) el.innerHTML = `<div class="fichas">${M.participantes.map(u => `<span class="ficha ${M.mentiras[u] ? 'activa' : 'apagada'}">${M.mentiras[u] ? '✅' : '✍️'} ${ficha(u)}</span>`).join('')}</div>`;
  }

  function votar() {
    if (M.fase !== 'escribir') return;
    M.fase = 'votar'; M.reloj && M.reloj.detener();
    const q = M.preguntas[M.idx];
    // Agrupar mentiras iguales
    const grupos = [];
    Object.entries(M.mentiras).forEach(([u, t]) => {
      const g = grupos.find(x => normalizar(x.texto) === normalizar(t));
      g ? g.autores.push(u) : grupos.push({ texto: t, autores: [u] });
    });
    const casa = barajar(q.m || []).filter(t => !grupos.some(g => seParece(g.texto, t)));
    while (grupos.length + 1 < 4 && casa.length) grupos.push({ texto: casa.pop(), autores: [], casa: true });
    // Todo en minúsculas y sin punto final, para que ninguna opción se delate por cómo está escrita
    const aMinusculas = t => String(t).toLocaleLowerCase('es-MX').replace(/[.。]+$/, '').trim();
    M.opciones = barajar([...grupos, { texto: q.v, autores: [], verdad: true }]).map((o, i) => ({ ...o, texto: aMinusculas(o.texto), k: String(i), letra: 'ABCDEFGHIJKLMNOPQRS'[i] }));
    pantalla('mentiras-votar', `
      ${barra(`🤥 Pregunta ${M.idx + 1} de ${M.preguntas.length}`)}
      <div class="contenido" style="gap:1.4vh">
        <div class="frase-chusca" style="font-size:clamp(1.1rem,3.8vmin,2.6rem)">${frase(q)}</div>
        <h3 class="centro" style="margin:0">🕵️ ¿Cuál es la VERDAD? Voten en su celular</h3>
        <div class="respuestas-chuscas muchas ${M.opciones.length > 9 ? 'compactas' : ''}">${M.opciones.map(o => `<div class="resp-chusca aparecer"><span class="letra-resp">${o.letra}</span><span>${escaparHTML(o.texto)}</span></div>`).join('')}</div>
        <div class="fila entre"><div id="reloj" class="reloj" style="font-size:clamp(2.5rem,9vmin,5rem)"></div>
          <span class="narracion" style="font-size:clamp(1rem,3vmin,2rem)"><span id="votosCuenta">0</span>/${conectados().length} votos</span>
          <button class="btn secundario" data-a="ya">⏩ Revelar</button></div>
      </div>`, { salir: confirmarSalida, ya: revelar });
    M.reloj = iniciarReloj(25, revelar);
    conectados().forEach(u => ponerVista(u, vistaVoto(u)));
  }
  function vistaVoto(u) {
    const q = M.preguntas[M.idx];
    return { tipo: 'votar', id: 'mv' + M.idx, frase: q.p, titulo: '¿Cuál es la verdad? 🕵️', opciones: M.opciones.filter(o => !o.autores.includes(u)).map(o => ({ k: o.k, letra: o.letra, texto: o.texto })) };
  }

  function revelar() {
    if (M.fase !== 'votar') return;
    M.fase = 'resultado'; M.reloj && M.reloj.detener();
    const q = M.preguntas[M.idx], x = mult();
    const elecciones = {};
    Object.entries(M.votos).forEach(([v, k]) => (elecciones[k] = elecciones[k] || []).push(v));
    M.opciones.forEach(o => {
      const quienes = elecciones[o.k] || [];
      if (o.verdad) quienes.forEach(v => { if (M.puntos[v] != null) M.puntos[v] += 500 * x; });
      else o.autores.forEach(a => { if (M.puntos[a] != null) M.puntos[a] += 250 * x * quienes.length; });
    });
    const orden = M.opciones.slice().sort((a, b) => (a.verdad ? 1 : 0) - (b.verdad ? 1 : 0));
    pantalla('mentiras-res', `
      ${barra(`🤥 Pregunta ${M.idx + 1} de ${M.preguntas.length}`)}
      <div class="contenido" style="gap:1.2vh">
        <div class="frase-chusca" style="font-size:clamp(1rem,3.4vmin,2.3rem)">${escaparHTML(q.p).replace(/_{3,}/g, `<span class="verdad-txt">${escaparHTML(q.v)}</span>`)}</div>
        <div class="respuestas-chuscas muchas ${orden.length > 9 ? 'compactas' : ''}">${orden.map(o => {
      const quienes = elecciones[o.k] || [];
      return `<div class="resp-chusca ${o.verdad ? 'ganadora' : ''}">
            <span class="letra-resp">${o.letra}</span>
            <div style="flex:1"><div>${escaparHTML(o.texto)}</div>
              <div class="autor">${o.verdad ? '✅ ¡LA VERDAD!' : o.casa ? '🏠 Mentira de la casa' : `🤥 Mentira de ${o.autores.map(ficha).join(', ')}`}
                ${quienes.length ? ` · ${o.verdad ? 'la encontraron' : 'cayeron'}: ${quienes.map(v => J(v) ? J(v).emoji : '').join(' ')}` : ''}
                ${!o.verdad && !o.casa && quienes.length ? ` <b>(+${250 * x * quienes.length})</b>` : ''}</div></div>
          </div>`;
    }).join('')}</div>
        <div class="fila"><button class="btn grande" data-a="sig">${M.idx + 1 >= M.preguntas.length ? '🏆 Resultados' : 'Siguiente ▶'}</button></div>
      </div>`, { salir: confirmarSalida, sig: () => { M.idx++; escribir(); } });
    conectados().forEach(u => {
      const eligio = M.opciones.find(o => o.k === M.votos[u]);
      vistaEspera(u, eligio ? (eligio.verdad ? '¡Encontraste la verdad! 🎉' : '¡Caíste! 🤥') : 'Resultados en la TV', `La verdad: ${q.v}`, eligio && eligio.verdad ? '✅' : '🤥');
    });
    Sonido.reproducir('redoble', 1.5);
    setTimeout(() => Sonido.decir(`La verdad es: ${q.v}.`, { tono: 1, velocidad: 1 }), 1600);
  }

  function llego(u) {
    if (!M) return vistaLobby(u);
    if (M.fase === 'escribir' && M.participantes.includes(u) && !M.mentiras[u]) return vistaEscribir(u);
    if (M.fase === 'votar' && !M.votos[u]) return ponerVista(u, vistaVoto(u));
    const v = vistas.get(u); v ? ponerVista(u, v) : vistaLobby(u);
  }
  function mensaje(u, m) {
    if (!M) return;
    if (m.t === 'respuesta' && M.fase === 'escribir' && m.id === 'm' + M.idx && M.participantes.includes(u)) {
      const t = String(m.texto || '').replace(/\s+/g, ' ').trim().slice(0, 40);
      if (!t) return;
      if (seParece(t, M.preguntas[M.idx].v)) return vistaEscribir(u, '¡Esa es la VERDAD! 🤫 Escribe una mentira');
      M.mentiras[u] = t;
      Sonido.reproducir('tic');
      vistaEspera(u, '¡Mentira guardada! 😈', 'Espera a los demás…', '🤥');
      progreso();
      if (M.participantes.every(p => M.mentiras[p] || !enLinea(p))) setTimeout(votar, 800);
      return;
    }
    if (m.t === 'voto' && M.fase === 'votar' && m.id === 'mv' + M.idx && !M.votos[u]) {
      const o = M.opciones.find(x => x.k === m.k);
      if (!o || o.autores.includes(u)) return;
      M.votos[u] = m.k;
      Sonido.reproducir('tic');
      vistaEspera(u, '¡Voto registrado! 🕵️', 'Espera la revelación…', '✅');
      const el = document.getElementById('votosCuenta'); if (el) el.textContent = Object.keys(M.votos).length;
      if (conectados().every(x => M.votos[x])) setTimeout(revelar, 700);
    }
  }
  return { config };
})();

/* =========================================================
   🔔 ADIVINA EL VILLANCICO
   Se van destapando letras del título; quien aprieta ¡BASTA!
   escribe su respuesta en el celular y se revisa sola.
   ========================================================= */
const Villancico = (() => {
  let V = null;
  const SEG_LETRA = 6;
  const config = crearConfig({
    clave: 'villancico', titulo: '🔔 Adivina el Villancico', min: 2,
    ajustes: [{ k: 'acertijos', etiqueta: 'Acertijos', def: 10, min: 5, max: 30, paso: 1 }],
    nota: 'Villancicos, canciones y películas navideñas en emojis.',
    onSeguir: (ps, cfg) => pantallaReglas('🔔 Adivina el Villancico', [
      'En la TV aparecen <b>emojis</b> y los espacios del título. <b>Cada pocos segundos se destapa una letra</b> 🔤.',
      'Si ya sabes cuál es, aprieta <b>¡BASTA!</b> y <b>escribe la respuesta en tu celular</b>. Se revisa sola (no importan las faltas de ortografía).',
      'Entre <b>menos letras</b> destapadas, <b>más puntos</b> (de 100 a 20).',
      'Si fallas, quedas fuera de ese acertijo y los demás siguen intentando.'
    ], 'Adivina el villancico. Aparecen emojis y se van destapando letras del título. Si sabes cuál es, aprieta basta y escribe la respuesta en tu celular. Entre menos letras, más puntos.', () => {
      V = { participantes: ps, acertijos: tomarAlAzar(ACERTIJOS_EMOJI, 'usadasVillancico', cfg.acertijos), idx: 0, puntos: {} };
      ps.forEach(u => V.puntos[u] = 0);
      Juego.iniciar({ llego: u => ponerVista(u, vistaPara(u)), mensaje, salio: () => { }, puntos: puntosDe('Adivina el Villancico', () => V.puntos) });
      acertijo();
    })
  });

  // Respuestas aceptadas: el título completo y las partes entre paréntesis o después de ":"
  function aceptadas(r) {
    const partes = [r, r.replace(/\(.*?\)/g, ''), ...(r.match(/\((.*?)\)/g) || []).map(x => x.slice(1, -1)), ...r.split(':')];
    return [...new Set(partes.map(x => x.trim()).filter(x => normalizar(x).length >= 2))];
  }
  function esCorrecta(texto, r) { return aceptadas(r).some(a => seParece(texto, a)); }
  function posLetras(r) { return [...r].map((ch, i) => /[\p{L}\p{N}]/u.test(ch) ? i : -1).filter(i => i >= 0); }
  function valorActual() { return Math.max(20, 100 - V.reveladas.size * 10); }
  function tituloOculto(r) {
    return [...r].map((ch, i) => {
      if (ch === ' ') return '<span class="hueco-palabra"></span>';
      if (!/[\p{L}\p{N}]/u.test(ch) || V.revelado || V.reveladas.has(i)) return `<span class="letra-v ${i === V.ultima && !V.revelado ? 'nueva' : ''}">${escaparHTML(ch)}</span>`;
      return '<span class="letra-v oculta">_</span>';
    }).join('');
  }

  function acertijo() {
    const a = V.acertijos[V.idx];
    if (!a) return pantallaFinal('🔔 Adivina el Villancico', V.puntos, config);
    V.basta = null; V.fuera = new Set(); V.revelado = false; V.reveladas = new Set(); V.intento = null; V.ganador = null;
    V.pendientes = barajar(posLetras(a.r));
    pintar();
    Sonido.reproducir('cascabeles', 0.6);
  }
  function destaparLetra() {
    if (!V.pendientes.length) return;
    V.ultima = V.pendientes.pop(); V.reveladas.add(V.ultima);
    if (!V.pendientes.length) { V.revelado = true; Sonido.decir(`Nadie le atinó. Era: ${V.acertijos[V.idx].r}`); }
    pintar();
  }
  function relojLetras() {
    let s = SEG_LETRA;
    const id = setInterval(() => {
      if (V.basta || V.revelado) return;
      s--;
      const el = document.getElementById('sigLetra'); if (el) el.textContent = s;
      if (s <= 0) { clearInterval(id); Sonido.reproducir('tic'); destaparLetra(); }
    }, 1000);
    alSalir(() => clearInterval(id));
  }

  function pintar() {
    const a = V.acertijos[V.idx];
    let estado;
    if (V.revelado) estado = V.ganador ? `✅ ¡${ficha(V.ganador)} le atinó! +${V.ganador_pts}` : '😶 Nadie le atinó';
    else if (V.basta) estado = `🔔 ${ficha(V.basta)} está escribiendo su respuesta… <span id="relojBasta"></span>`;
    else estado = `📱 ¿Ya sabes? ¡Aprieta BASTA! · Vale <b>${valorActual()}</b> pts · nueva letra en <b id="sigLetra">${SEG_LETRA}</b>s`;
    pantalla('villancico', `
      ${barra(`🔔 Acertijo ${V.idx + 1} de ${V.acertijos.length}`)}
      <div class="contenido" style="gap:1.6vh">
        <div class="centro"><span class="etiqueta">${escaparHTML(a.c)}</span></div>
        <div class="emojis-acertijo aparecer">${a.e}</div>
        <div class="titulo-oculto">${tituloOculto(a.r)}</div>
        ${V.intento ? `<p class="centro narracion aparecer" style="margin:0">❌ ${ficha(V.intento.u)} escribió: «${escaparHTML(V.intento.t)}»</p>` : ''}
        <div class="centro narracion" style="font-size:clamp(1rem,3vmin,2rem)">${estado}</div>
        ${V.fuera.size && !V.revelado ? `<p class="centro tenue" style="margin:0">Fuera de este acertijo: ${[...V.fuera].map(ficha).join(' ')}</p>` : ''}
        <div class="fila">
          ${V.revelado ? `<button class="btn grande" data-a="sig">${V.idx + 1 >= V.acertijos.length ? '🏆 Resultados' : 'Siguiente ▶'}</button>`
        : V.basta ? '<button class="btn secundario" data-a="sinRespuesta">⏭ No contestó</button>'
          : `${V.intento ? `<button class="btn verde" data-a="siSeVale">✔ Sí se vale lo de ${escaparHTML(nombre(V.intento.u))}</button>` : ''}
             <button class="btn secundario" data-a="letra">🔤 Destapar letra</button>
             <button class="btn secundario" data-a="revelar">👀 Revelar todo</button>`}
        </div>
        ${htmlRankingMini()}
      </div>`, {
      salir: confirmarSalida,
      letra: () => { Sonido.reproducir('tic'); destaparLetra(); },
      revelar: () => { V.revelado = true; pintar(); Sonido.decir(a.r); },
      siSeVale: () => { const u = V.intento.u; V.fuera.delete(u); acierto(u); },
      sinRespuesta: () => fallo(V.basta, '(no contestó a tiempo)'),
      sig: () => { V.idx++; acertijo(); }
    });
    conectados().forEach(u => ponerVista(u, vistaPara(u)));
    if (V.basta && !V.revelado) {
      let s = 25; const quien = V.basta;
      const pintarS = () => { const el = document.getElementById('relojBasta'); if (el) el.textContent = `(${s}s)`; };
      pintarS();
      const id = setInterval(() => { s--; pintarS(); if (s <= 0) { clearInterval(id); if (V.basta === quien && !V.revelado) fallo(quien, '(no contestó a tiempo)'); } }, 1000);
      alSalir(() => clearInterval(id));
    } else if (!V.revelado) relojLetras();
  }
  function htmlRankingMini() {
    const t = Object.keys(V.puntos).filter(u => V.puntos[u] > 0).sort((a, b) => V.puntos[b] - V.puntos[a]).slice(0, 6);
    return t.length ? `<div class="fichas">${t.map(u => `<span class="ficha">${ficha(u)} · ${V.puntos[u]}</span>`).join('')}</div>` : '';
  }
  function vistaPara(u) {
    const a = V.acertijos[V.idx];
    if (!V.participantes.includes(u)) return { tipo: 'espera', emoji: '🍿', titulo: 'Estás de público', texto: '¡Échale porras!' };
    if (V.revelado) return { tipo: 'espera', emoji: V.ganador === u ? '🎉' : '🎶', titulo: a.r, texto: V.ganador === u ? `¡Le atinaste! +${V.ganador_pts}` : 'Mira la TV 📺' };
    if (V.basta === u) return { tipo: 'escribir', id: 'v' + V.idx, frase: `${a.e}  (${a.c})`, instr: '¿Cuál es? Escríbelo 🎶', max: 60, n: 1, total: 1, sinTip: true };
    if (V.fuera.has(u)) return { tipo: 'espera', emoji: '🙊', titulo: 'Quedaste fuera', texto: 'De este acertijo. ¡En el siguiente sí!' };
    return { tipo: 'basta', activo: !V.basta, perdi: !!V.basta, titulo: V.basta ? `${nombre(V.basta)} está contestando…` : '¿Ya sabes cuál es? ¡APRIETA!' };
  }
  function acierto(u) {
    const pts = valorActual();
    V.puntos[u] = (V.puntos[u] || 0) + pts;
    V.ganador = u; V.ganador_pts = pts; V.revelado = true; V.basta = null; V.intento = null;
    Sonido.reproducir('exito'); lluvia(['🎶', '🔔', '⭐'], 25); destello();
    pintar();
    Sonido.decir(`¡Correcto, ${nombre(u)}! ${V.acertijos[V.idx].r}.`);
  }
  function fallo(u, texto) {
    V.fuera.add(u); V.basta = null; V.intento = { u, t: texto };
    Sonido.reproducir('tache');
    if (V.participantes.filter(enLinea).every(p => V.fuera.has(p))) { V.revelado = true; Sonido.decir(`Nadie le atinó. Era: ${V.acertijos[V.idx].r}`); }
    pintar();
  }
  function mensaje(u, m) {
    if (!V) return;
    if (m.t === 'basta' && !V.basta && !V.revelado && !V.fuera.has(u) && V.participantes.includes(u)) {
      V.basta = u; V.intento = null;
      Sonido.reproducir('timbre');
      pintar();
      Sonido.decir(`¡${nombre(u)}!`);
      return;
    }
    if (m.t === 'respuesta' && V.basta === u && m.id === 'v' + V.idx) {
      const t = String(m.texto || '').trim().slice(0, 60);
      if (!t) return;
      if (esCorrecta(t, V.acertijos[V.idx].r)) acierto(u); else fallo(u, t);
    }
  }
  return { config };
})();

/* =========================================================
   🪅 ROMPE LA PIÑATA
   ========================================================= */
const Pinata = (() => {
  let Pi = null;
  const PINATAS = ['🪅', '⭐', '🎄', '🫏'];
  const config = crearConfig({
    clave: 'pinata', titulo: '🪅 Rompe la Piñata', min: 1,
    ajustes: [{ k: 'rondas', etiqueta: 'Piñatas', def: 3, min: 1, max: 6, paso: 1 }],
    nota: 'Carrera de toques: el que da el último golpe se lleva la piñata.',
    onSeguir: (ps, cfg) => pantallaReglas('🪅 Rompe la Piñata', [
      'Cuando la TV diga <b>¡DALE!</b>, toca el botón de tu celular <b>lo más rápido que puedas</b>.',
      'Cada toque es un palazo a la piñata 💥.',
      'El que dé <b>el golpe final</b> se lleva <b>+300</b>, y el que más golpes dio, <b>+100</b>.',
      '¡Cuidado con aventar el celular! 📱💨'
    ], 'Rompe la piñata. Cuando la tele diga dale, toca el botón de tu celular lo más rápido que puedas. El que dé el golpe final se lleva la piñata.', () => {
      Pi = { participantes: ps, rondas: cfg.rondas, ronda: 0, puntos: {} };
      ps.forEach(u => Pi.puntos[u] = 0);
      Juego.iniciar({ llego: u => ponerVista(u, vistaPara(u)), mensaje, salio: () => { } , puntos: puntosDe('Rompe la Piñata', () => Pi.puntos) });
      ronda();
    })
  });

  function vistaPara(u) {
    if (!Pi.participantes.includes(u)) return { tipo: 'espera', emoji: '🍿', titulo: 'Estás de público', texto: '¡Canta "dale, dale, dale"! 🎶' };
    if (Pi.fase === 'golpes') return { tipo: 'dale', activo: true, id: 'pi' + Pi.ronda };
    if (Pi.fase === 'rota') return { tipo: 'espera', emoji: Pi.ultimo === u ? '🏆' : '🍬', titulo: Pi.ultimo === u ? '¡LA ROMPISTE!' : `¡La rompió ${nombre(Pi.ultimo)}!`, texto: `Diste ${Pi.golpes[u] || 0} golpes` };
    return { tipo: 'dale', activo: false, id: 'pi' + Pi.ronda };
  }

  async function ronda() {
    if (Pi.ronda >= Pi.rondas) return pantallaFinal('🪅 Rompe la Piñata', Pi.puntos, config);
    const activos = Pi.participantes.filter(enLinea).length || 1;
    Pi.fase = 'lista'; Pi.golpes = {}; Pi.ultimo = null;
    Pi.vidaMax = Pi.vida = 35 * activos + 20;
    Pi.emoji = PINATAS[Pi.ronda % PINATAS.length];
    pintar();
    conectados().forEach(u => ponerVista(u, vistaPara(u)));
    let cancelado = false;
    alSalir(() => { cancelado = true; });
    await Sonido.decir(`Piñata ${Pi.ronda + 1}. ¿Listos?`);
    for (const n of ['3', '2', '1']) {
      if (cancelado) return;
      const el = document.getElementById('cuentaPinata'); if (el) { el.textContent = n; el.classList.remove('aparecer'); void el.offsetWidth; el.classList.add('aparecer'); }
      Sonido.reproducir('tic'); await pausa(800);
    }
    if (cancelado) return;
    Pi.fase = 'golpes';
    const el = document.getElementById('cuentaPinata'); if (el) el.textContent = '¡DALE!';
    Sonido.reproducir('timbre');
    conectados().forEach(u => ponerVista(u, vistaPara(u)));
  }

  function pintar() {
    pantalla('pinata', `
      ${barra(`🪅 Piñata ${Pi.ronda + 1} de ${Pi.rondas}`)}
      <div class="contenido" style="gap:1.4vh">
        <div class="cuerda"></div>
        <div class="pinata-tv" id="pinata">${Pi.emoji}</div>
        <div class="medidor" style="max-width:900px;width:100%;margin:0 auto"><div id="vida" style="width:100%"></div></div>
        <div class="centro reloj" id="cuentaPinata" style="font-size:clamp(2.5rem,10vmin,6rem)"></div>
        <p class="centro tenue" style="margin:0;font-style:italic">🎶 Dale, dale, dale, no pierdas el tino… 🎶</p>
        <div id="topGolpes" class="fichas"></div>
      </div>`, { salir: confirmarSalida });
  }

  let ultimoSonido = 0;
  function mensaje(u, m) {
    if (m.t !== 'golpes' || !Pi || Pi.fase !== 'golpes' || !Pi.participantes.includes(u) || m.id !== 'pi' + Pi.ronda) return;
    const n = Math.max(0, Math.min(6, +m.n || 0)); // máximo ~30 toques por segundo
    if (!n) return;
    Pi.golpes[u] = (Pi.golpes[u] || 0) + n;
    Pi.vida -= n;
    Pi.ultimo = u;
    const p = document.getElementById('pinata');
    if (p) p.style.transform = `rotate(${(Math.random() * 40 - 20).toFixed(0)}deg) scale(${(1 + Math.random() * 0.12).toFixed(2)})`;
    const v = document.getElementById('vida'); if (v) v.style.width = Math.max(0, Pi.vida / Pi.vidaMax * 100) + '%';
    if (Date.now() - ultimoSonido > 90) { Sonido.reproducir(Math.random() < .5 ? 'tic' : 'tac'); ultimoSonido = Date.now(); }
    const top = document.getElementById('topGolpes');
    if (top) top.innerHTML = Object.keys(Pi.golpes).sort((a, b) => Pi.golpes[b] - Pi.golpes[a]).slice(0, 8).map(x => `<span class="ficha">${ficha(x)} · ${Pi.golpes[x]}</span>`).join('');
    if (Pi.vida <= 0) rota();
  }

  function rota() {
    Pi.fase = 'rota';
    const top = Object.keys(Pi.golpes).sort((a, b) => Pi.golpes[b] - Pi.golpes[a])[0];
    Pi.puntos[Pi.ultimo] = (Pi.puntos[Pi.ultimo] || 0) + 300;
    if (top) Pi.puntos[top] = (Pi.puntos[top] || 0) + 100;
    destello(); temblar();
    Sonido.reproducir('platillo'); Sonido.reproducir('fanfarria');
    lluvia(['🍬', '🍭', '🍊', '🥜', '🍫', '🎉'], 90);
    pantalla('pinata-rota', `
      ${barra(`🪅 Piñata ${Pi.ronda + 1} de ${Pi.rondas}`)}
      <div class="contenido">
        <h1 class="aparecer">💥 ¡LA ROMPIÓ! 💥</h1>
        <div class="palabra-gigante">${ficha(Pi.ultimo)}</div>
        <p class="centro narracion">Golpe final: +300 · Más golpes: ${top ? ficha(top) : '—'} (${top ? Pi.golpes[top] : 0}) +100</p>
        <div class="fila"><button class="btn grande" data-a="sig">${Pi.ronda + 1 >= Pi.rondas ? '🏆 Resultados' : '🪅 Otra piñata'}</button></div>
      </div>`, { salir: confirmarSalida, sig: () => { Pi.ronda++; ronda(); } });
    conectados().forEach(u => ponerVista(u, vistaPara(u)));
    Sonido.decir(`¡${nombre(Pi.ultimo)} rompió la piñata!`);
  }
  return { config };
})();

REGISTRO.loteria = Loteria;
REGISTRO.probable = Probable;
REGISTRO.mentiras = Mentiras;
REGISTRO.villancico = Villancico;
REGISTRO.pinata = Pinata;
