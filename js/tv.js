/* =========================================================
   NOCHE DE HALLOWEEN — Pantalla principal (la que va a la TV)
   ========================================================= */

const CLAVE = 'noche-halloween-v1';
const app = document.getElementById('app');

/* ---------------- Estado guardado ---------------- */
function estadoInicial() {
  return {
    jugadores: [],
    semilla: Math.random().toString(36).slice(2, 8),
    partidas: 0,
    triviaUsadas: [],
    ajustes: { efectos: true, voz: true, ambiente: true }
  };
}
let E = (() => {
  try { return Object.assign(estadoInicial(), JSON.parse(localStorage.getItem(CLAVE)) || {}); }
  catch { return estadoInicial(); }
})();
function guardar() { localStorage.setItem(CLAVE, JSON.stringify(E)); }
Object.assign(Sonido.config, E.ajustes);

const jugadorPorId = id => E.jugadores.find(j => j.id === id);
const nombreDe = id => { const j = jugadorPorId(id); return j ? j.nombre : '?'; };
const fichaDe = id => { const j = jugadorPorId(id); return j ? `${j.emoji} ${escaparHTML(j.nombre)}` : '?'; };
function sumarPuntos(ids, n) {
  ids.forEach(id => { const j = jugadorPorId(id); if (j) j.puntos = Math.max(0, (j.puntos || 0) + n); });
  guardar();
}

/* ---------------- Motor de pantallas ---------------- */
let acciones = {};
let limpiezas = [];
function alSalir(fn) { limpiezas.push(fn); }

function pantalla(html, acc = {}) {
  limpiezas.forEach(f => { try { f(); } catch (e) { } });
  limpiezas = [];
  Sonido.callar();
  acciones = acc;
  app.innerHTML = html;
  window.scrollTo(0, 0);
}

document.addEventListener('click', ev => {
  const el = ev.target.closest('[data-a]');
  if (!el) return;
  const fn = acciones[el.dataset.a];
  if (fn) { ev.preventDefault(); fn(el.dataset, el); }
});

function barra(titulo, conSalir = true) {
  return `<div class="barra-superior">
    <div class="titulo-juego">${titulo}</div>
    ${conSalir ? '<button class="btn secundario chico" data-a="salir">✕ Salir</button>' : ''}
  </div>`;
}
function confirmarSalida() {
  if (confirm('¿Salir de este juego y volver al menú?')) inicio();
}

/* ---------------- Efectos visuales ---------------- */
function destello() {
  const d = document.createElement('div');
  d.className = 'destello';
  document.body.appendChild(d);
  setTimeout(() => d.remove(), 800);
}
function lluvia(emojis = ['🦇', '🎃', '👻', '🍬', '💀'], cantidad = 40) {
  const c = document.createElement('div');
  c.className = 'lluvia';
  for (let i = 0; i < cantidad; i++) {
    const s = document.createElement('span');
    s.textContent = elegir(emojis);
    s.style.left = Math.random() * 100 + 'vw';
    s.style.animationDuration = 2.5 + Math.random() * 3 + 's';
    s.style.animationDelay = Math.random() * 2 + 's';
    c.appendChild(s);
  }
  document.body.appendChild(c);
  setTimeout(() => c.remove(), 8000);
}
function temblar() {
  app.classList.remove('temblar'); void app.offsetWidth; app.classList.add('temblar');
}

/* ---------------- Temporizador reutilizable ---------------- */
function formatoTiempo(s) {
  const m = Math.floor(s / 60), r = s % 60;
  return m > 0 ? `${m}:${String(r).padStart(2, '0')}` : String(r);
}
// Monta un temporizador dentro de los elementos #reloj y #barraTiempo
function iniciarReloj(segundos, onFin, { tic = true } = {}) {
  let restante = segundos, total = segundos, pausado = false;
  const pintar = () => {
    const r = document.getElementById('reloj');
    const b = document.getElementById('barraTiempo');
    if (r) {
      r.textContent = formatoTiempo(restante);
      r.classList.toggle('urgente', restante <= 10);
    }
    if (b) b.style.width = (restante / total * 100) + '%';
  };
  pintar();
  const id = setInterval(() => {
    if (pausado) return;
    restante--;
    if (restante <= 10 && restante > 0 && tic) Sonido.reproducir(restante % 2 ? 'tic' : 'tac');
    pintar();
    if (restante <= 0) {
      clearInterval(id);
      Sonido.reproducir('alarma');
      onFin && onFin();
    }
  }, 1000);
  alSalir(() => clearInterval(id));
  return {
    pausar() { pausado = !pausado; return pausado; },
    agregar(s) { restante += s; total = Math.max(total, restante); pintar(); },
    terminar() { restante = 1; pausado = false; },
    detener() { clearInterval(id); }
  };
}

/* ---------------- Mantener pantalla encendida ---------------- */
let candado = null;
async function mantenerEncendida() {
  try {
    if ('wakeLock' in navigator && !candado) {
      candado = await navigator.wakeLock.request('screen');
      candado.addEventListener('release', () => { candado = null; });
    }
  } catch (e) { }
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') mantenerEncendida();
});
document.addEventListener('pointerdown', () => {
  Sonido.activar();
  mantenerEncendida();
}, { once: false, passive: true });

/* ---------------- Selector de participantes ---------------- */
// Devuelve HTML de fichas seleccionables. `sel` es un Set de ids.
function htmlSeleccion(sel) {
  if (!E.jugadores.length) return '<p class="tenue centro">Primero agrega jugadores en el menú 👥</p>';
  return `<div class="fichas">${E.jugadores.map(j =>
    `<button class="ficha ${sel.has(j.id) ? 'activa' : 'apagada'}" data-a="alternar" data-id="${j.id}">${j.emoji} ${escaparHTML(j.nombre)}</button>`
  ).join('')}</div>
  <p class="tenue centro" style="margin:.4em 0 0">Juegan <b>${sel.size}</b> · toca un nombre para sacarlo o meterlo (quien no juegue, no pasa nada 😉)</p>`;
}
function seleccionInicial() {
  return new Set(E.jugadores.filter(j => j.activo !== false).map(j => j.id));
}

/* ---------------- Pantalla de reglas ---------------- */
function pantallaReglas(titulo, icono, reglas, textoVoz, onSeguir) {
  pantalla(`
    ${barra(titulo)}
    <div class="contenido">
      <h2>${icono} Cómo se juega</h2>
      <div class="tarjeta" style="max-width:1100px;margin:0 auto">
        <ol style="font-size:clamp(1rem,3vmin,1.9rem);line-height:1.45;margin:0;padding-left:1.3em">
          ${reglas.map(r => `<li>${r}</li>`).join('')}
        </ol>
      </div>
      <div class="fila">
        <button class="btn secundario" data-a="leer">🔊 Leer en voz alta</button>
        <button class="btn grande" data-a="seguir">¡Entendido! ▶</button>
      </div>
    </div>`, {
    salir: confirmarSalida,
    leer: () => Sonido.decir(textoVoz),
    seguir: onSeguir
  });
  Sonido.decir(textoVoz);
}

/* =========================================================
   INICIO
   ========================================================= */
const JUEGOS = [
  { id: 'mimica', icono: '🎭', nombre: 'Mímica Embrujada', desc: 'Por equipos: actúa sin hablar' },
  { id: 'impostor', icono: '🕵️', nombre: 'El Impostor', desc: 'Todos saben la palabra… menos uno' },
  { id: 'asesino', icono: '🔪', nombre: 'El Asesino de San Espanto', desc: 'Roles secretos, noches y acusaciones' },
  { id: 'trivia', icono: '🧠', nombre: 'Trivia de Terror', desc: 'Leyendas, películas y Día de Muertos' },
  { id: 'ruleta', icono: '🎡', nombre: 'Ruleta Maldita', desc: 'Verdad o reto… si te atreves' },
  { id: 'disfraces', icono: '🧛', nombre: 'Concurso de Disfraces', desc: 'Pasarela y aplausómetro' }
];

function inicio() {
  const n = E.jugadores.length;
  pantalla(`
    <div class="contenido" style="gap:2.2vh">
      <div class="centro">
        <h1>🎃 Noche de Halloween 🎃</h1>
        <p class="tenue" style="margin:0">${n ? `${n} almas en pena registradas 👻` : 'Primero registra a los jugadores 👇'}</p>
      </div>
      <div class="menu-juegos">
        ${JUEGOS.map(j => `
          <button class="juego-boton" data-a="juego" data-id="${j.id}">
            <span class="icono">${j.icono}</span>
            <span><div class="nombre">${j.nombre}</div><div class="desc">${j.desc}</div></span>
          </button>`).join('')}
      </div>
      <div class="fila">
        <button class="btn ${n ? 'secundario' : 'grande'}" data-a="jugadores">👥 Jugadores</button>
        <button class="btn secundario" data-a="marcador">🏆 Marcador</button>
        <button class="btn secundario" data-a="ayuda">📺 Cómo conectar</button>
        <button class="btn secundario" data-a="ajustes">⚙️ Ajustes</button>
      </div>
    </div>`, {
    jugadores: pantallaJugadores,
    marcador: pantallaMarcador,
    ayuda: pantallaAyuda,
    ajustes: pantallaAjustes,
    juego: d => {
      if (E.jugadores.length < 2 && d.id !== 'ruleta') { alert('Primero agrega a los jugadores 👥'); return pantallaJugadores(); }
      Sonido.reproducir('puerta');
      ({ mimica: Mimica.config, impostor: Impostor.config, asesino: Asesino.config, trivia: Trivia.config, ruleta: Ruleta.inicio, disfraces: Disfraces.config })[d.id]();
    }
  });
  Sonido.iniciarAmbiente();
}

/* =========================================================
   JUGADORES
   ========================================================= */
function pantallaJugadores() {
  const pintar = () => {
    pantalla(`
      ${barra('👥 Jugadores', false)}
      <div class="contenido" style="justify-content:flex-start">
        <form id="formJugador" class="fila" autocomplete="off">
          <input type="text" id="nombreNuevo" placeholder="Nombre del jugador" maxlength="16" style="flex:1;min-width:200px">
          <button class="btn" type="submit">➕ Agregar</button>
        </form>
        <p class="tenue centro" style="margin:0">Toca un nombre para marcarlo como <b>descansando</b> 😴 (no se le incluye por defecto). Recomendado: hasta 15 jugadores.</p>
        <div class="fichas">
          ${E.jugadores.map(j => `
            <span class="ficha ${j.activo === false ? 'apagada' : 'activa'}">
              <span data-a="alternar" data-id="${j.id}">${j.emoji} ${escaparHTML(j.nombre)}</span>
              <span class="x" data-a="borrar" data-id="${j.id}">✕</span>
            </span>`).join('') || '<p class="tenue">Todavía no hay nadie… 🕸️</p>'}
        </div>
        <div class="fila" style="margin-top:auto">
          <button class="btn grande" data-a="listo">Listo ✔</button>
        </div>
      </div>`, {
      alternar: d => { const j = jugadorPorId(+d.id); j.activo = j.activo === false; guardar(); pintar(); },
      borrar: d => {
        const j = jugadorPorId(+d.id);
        if (confirm(`¿Borrar a ${j.nombre}? (pierde sus puntos)`)) {
          E.jugadores = E.jugadores.filter(x => x.id !== j.id); guardar(); pintar();
        }
      },
      listo: inicio
    });
    const form = document.getElementById('formJugador');
    form.addEventListener('submit', ev => {
      ev.preventDefault();
      const input = document.getElementById('nombreNuevo');
      const nombre = input.value.trim().replace(/[~]/g, '');
      if (!nombre) return;
      if (E.jugadores.some(j => j.nombre.toLowerCase() === nombre.toLowerCase())) { alert('Ya existe alguien con ese nombre. Agrega un apellido o apodo 😉'); return; }
      const usados = new Set(E.jugadores.map(j => j.emoji));
      const emoji = EMOJIS.find(e => !usados.has(e)) || elegir(EMOJIS);
      const id = E.jugadores.reduce((m, j) => Math.max(m, j.id), 0) + 1;
      E.jugadores.push({ id, nombre, emoji, activo: true, puntos: 0 });
      guardar();
      pintar();
      setTimeout(() => document.getElementById('nombreNuevo')?.focus(), 50);
    });
  };
  pintar();
}

/* =========================================================
   MARCADOR Y CORONACIÓN
   ========================================================= */
function ranking() {
  return E.jugadores.slice().sort((a, b) => (b.puntos || 0) - (a.puntos || 0));
}
function pantallaMarcador() {
  const r = ranking();
  const medallas = ['🥇', '🥈', '🥉'];
  pantalla(`
    ${barra('🏆 Marcador de la Noche', false)}
    <div class="contenido" style="justify-content:flex-start">
      <div class="marcador">
        ${r.map((j, i) => `
          <div class="marcador-fila">
            <span class="pos">${medallas[i] || i + 1}</span>
            <span>${j.emoji} ${escaparHTML(j.nombre)}</span>
            <span class="pts">${j.puntos || 0}</span>
            <span class="fila" style="gap:.3em;flex-wrap:nowrap">
              <button class="btn secundario chico" data-a="menos" data-id="${j.id}">−</button>
              <button class="btn secundario chico" data-a="mas" data-id="${j.id}">+</button>
            </span>
          </div>`).join('') || '<p class="tenue centro">Sin jugadores todavía</p>'}
      </div>
      <div class="fila">
        <button class="btn secundario" data-a="volver">◀ Menú</button>
        <button class="btn secundario" data-a="reiniciar">🔄 Reiniciar puntos</button>
        <button class="btn grande" data-a="coronar">👑 Coronación final</button>
      </div>
    </div>`, {
    volver: inicio,
    mas: d => { sumarPuntos([+d.id], 1); pantallaMarcador(); },
    menos: d => { sumarPuntos([+d.id], -1); pantallaMarcador(); },
    reiniciar: () => { if (confirm('¿Poner todos los puntos en cero?')) { E.jugadores.forEach(j => j.puntos = 0); guardar(); pantallaMarcador(); } },
    coronar: coronacion
  });
}

async function coronacion() {
  const r = ranking().filter(j => (j.puntos || 0) > 0);
  if (!r.length) { alert('Nadie tiene puntos todavía 👻'); return; }
  let cancelado = false;
  pantalla(`<div class="contenido"><h1>👑 La Coronación 👑</h1><div id="escena" class="narracion oscura"></div>
    <div class="fila"><button class="btn secundario" data-a="volver">◀ Volver</button></div></div>`,
    { volver: () => { cancelado = true; pantallaMarcador(); } });
  alSalir(() => { cancelado = true; });
  const escena = document.getElementById('escena');
  const pausa = ms => new Promise(r => setTimeout(r, ms));
  Sonido.detenerAmbiente();
  escena.textContent = 'Esta noche, entre monstruos, fantasmas y almas en pena…';
  await Sonido.decir('Esta noche, entre monstruos, fantasmas y almas en pena, solo uno será coronado como el rey de la noche de Halloween.');
  const puestos = r.slice(0, 3).reverse();
  const etiquetas = { 3: '🥉 Tercer lugar', 2: '🥈 Segundo lugar', 1: '👑 ¡EL REY DE LA NOCHE!' };
  for (let i = 0; i < puestos.length; i++) {
    if (cancelado) return;
    const lugar = puestos.length - i;
    const j = puestos[i];
    escena.innerHTML = `<div>${etiquetas[lugar]}</div><div class="tenue">🥁 …</div>`;
    Sonido.reproducir('redoble', 2.5);
    await pausa(2700);
    if (cancelado) return;
    escena.innerHTML = `<div>${etiquetas[lugar]}</div><div class="palabra-gigante aparecer">${j.emoji} ${escaparHTML(j.nombre)}</div><div class="tenue">${j.puntos} puntos</div>`;
    if (lugar === 1) { Sonido.reproducir('fanfarria'); lluvia(['👑', '🎃', '🦇', '🍬', '✨'], 70); destello(); }
    await Sonido.decir(lugar === 1 ? `¡Y el rey de la noche es... ${j.nombre}! ¡Muajajajá!` : `En ${lugar === 3 ? 'tercer' : 'segundo'} lugar: ${j.nombre}.`);
    await pausa(1500);
  }
}

/* =========================================================
   AYUDA Y AJUSTES
   ========================================================= */
function pantallaAyuda() {
  const enlace = new URL('jugador.html', location.href).toString();
  pantalla(`
    ${barra('📺 Cómo conectar', false)}
    <div class="contenido">
      <div class="dos-columnas">
        <div>
          <div class="qr-caja">${generarQR(enlace)}</div>
          <p class="centro tenue">Página para celulares</p>
        </div>
        <div class="tarjeta">
          <h3>Para la TV (anfitrión)</h3>
          <ol style="font-size:clamp(1rem,2.6vmin,1.5rem);line-height:1.5">
            <li>Conecta el iPhone al mismo WiFi que la TV.</li>
            <li>Abre el <b>Centro de Control</b> → <b>Duplicar pantalla</b> → elige tu TV.</li>
            <li>Gira el iPhone <b>horizontal</b> (quita el bloqueo de rotación) para que llene la TV.</li>
            <li>Sube el volumen: la voz y los sonidos salen por la TV 🔊. Si no se oye nada, quita el modo silencio del iPhone y toca "Probar sonido" en ⚙️ Ajustes.</li>
            <li>Activa <b>No molestar</b> para que no salgan notificaciones en la TV.</li>
          </ol>
          <h3>Para los jugadores</h3>
          <p>No instalan nada: en cada juego secreto aparece un QR en la TV. Lo escanean con la cámara y ven su rol en su celular.</p>
          <p class="tenue">Tip: si el anfitrión también juega a los roles secretos, que abra su rol en otro dispositivo (iPad) o en el celular de alguien de confianza. ¡Lo que sale en tu iPhone sale en la TV!</p>
        </div>
      </div>
      <div class="fila"><button class="btn" data-a="volver">◀ Menú</button></div>
    </div>`, { volver: inicio });
}

function pantallaAjustes() {
  const fila = (clave, texto) => `
    <label class="ajuste">${texto}
      <span class="interruptor"><input type="checkbox" data-clave="${clave}" ${E.ajustes[clave] ? 'checked' : ''}><span></span></span>
    </label>`;
  pantalla(`
    ${barra('⚙️ Ajustes', false)}
    <div class="contenido">
      <div class="tarjeta" style="max-width:700px;width:100%;margin:0 auto">
        ${fila('voz', '🗣️ Voz narradora')}
        ${fila('efectos', '🔊 Efectos de sonido')}
        ${fila('ambiente', '🌫️ Música de ambiente')}
      </div>
      <div class="fila">
        <button class="btn secundario" data-a="probar">🔊 Probar sonido</button>
        <button class="btn secundario" data-a="borrar">🗑️ Borrar todo</button>
        <button class="btn" data-a="volver">◀ Menú</button>
      </div>
    </div>`, {
    volver: inicio,
    probar: () => { Sonido.reproducir('trueno'); Sonido.decir('Bienvenidos... a la noche más tenebrosa del año. Muajajajá.'); },
    borrar: () => { if (confirm('¿Borrar jugadores, puntos y todo?')) { localStorage.removeItem(CLAVE); E = estadoInicial(); guardar(); inicio(); } }
  });
  app.querySelectorAll('input[data-clave]').forEach(inp => inp.addEventListener('change', () => {
    E.ajustes[inp.dataset.clave] = inp.checked;
    Object.assign(Sonido.config, E.ajustes);
    if (inp.dataset.clave === 'ambiente') inp.checked ? Sonido.iniciarAmbiente() : Sonido.detenerAmbiente();
    guardar();
  }));
}

/* ---------------- Helpers de equipos ---------------- */
const NOMBRES_EQUIPOS = ['🎃 Calabazas', '🦇 Murciélagos', '💀 Calaveras', '🕷️ Arañas'];
function armarEquipos(ids, n) {
  const mezcla = barajar(ids);
  const equipos = Array.from({ length: n }, (_, i) => ({ nombre: NOMBRES_EQUIPOS[i], miembros: [], puntos: 0 }));
  mezcla.forEach((id, i) => equipos[i % n].miembros.push(id));
  return equipos;
}
function htmlEquipos(equipos, turno = -1, mostrarPuntos = true) {
  return `<div class="equipos">${equipos.map((e, i) => `
    <div class="equipo ${i === turno ? 'turno' : ''}">
      <h3 class="centro">${e.nombre}</h3>
      ${mostrarPuntos ? `<div class="pts-equipo">${e.puntos}</div>` : ''}
      <div class="fichas">${e.miembros.map(id => `<span class="ficha">${fichaDe(id)}</span>`).join('')}</div>
    </div>`).join('')}</div>`;
}
function premiarEquipos(equipos) {
  const orden = equipos.slice().sort((a, b) => b.puntos - a.puntos);
  const max = orden[0].puntos;
  const ganadores = equipos.filter(e => e.puntos === max);
  const resto = equipos.filter(e => e.puntos !== max);
  ganadores.forEach(e => sumarPuntos(e.miembros, 3));
  if (resto.length) {
    const segundo = Math.max(...resto.map(e => e.puntos));
    resto.filter(e => e.puntos === segundo && e.puntos > 0).forEach(e => sumarPuntos(e.miembros, 1));
  }
  return ganadores;
}
function contadorHTML(accionMenos, accionMas, valor, etiqueta) {
  return `<span class="contador">${etiqueta}
    <button class="btn secundario chico" data-a="${accionMenos}">−</button>
    <b>${valor}</b>
    <button class="btn secundario chico" data-a="${accionMas}">+</button></span>`;
}

/* =========================================================
   🎭 MÍMICA EMBRUJADA
   ========================================================= */
const Mimica = (() => {
  let S = {};

  function config() {
    S = {
      sel: seleccionInicial(),
      modo: 'tv',
      tiempo: 60,
      turnosPorEquipo: 2,
      numEquipos: null,
      cats: new Set(Object.keys(MIMICA_CATEGORIAS))
    };
    pintarConfig();
  }
  function equiposAuto() { return S.sel.size >= 11 ? 3 : 2; }

  function pintarConfig() {
    const ne = S.numEquipos || equiposAuto();
    pantalla(`
      ${barra('🎭 Mímica Embrujada')}
      <div class="contenido" style="justify-content:flex-start">
        <h3>¿Quién juega?</h3>
        ${htmlSeleccion(S.sel)}
        <div class="tarjeta">
          <div class="ajuste">Modo
            <span class="fila" style="gap:.5em">
              <button class="btn chico ${S.modo === 'tv' ? '' : 'secundario'}" data-a="modo" data-m="tv">📺 Palabra en la TV</button>
              <button class="btn chico ${S.modo === 'cel' ? '' : 'secundario'}" data-a="modo" data-m="cel">📱 Papelito en el celular</button>
            </span>
          </div>
          <div class="ajuste">Equipos ${contadorHTML('eqMenos', 'eqMas', ne, '')}</div>
          <div class="ajuste">Segundos por turno ${contadorHTML('tMenos', 'tMas', S.tiempo, '')}</div>
          <div class="ajuste">Turnos por equipo ${contadorHTML('rMenos', 'rMas', S.turnosPorEquipo, '')}</div>
          <div class="ajuste" style="flex-wrap:wrap">Categorías
            <span class="fichas" style="justify-content:flex-end">
              ${Object.entries(MIMICA_CATEGORIAS).map(([k, c]) => `<button class="ficha ${S.cats.has(k) ? 'activa' : 'apagada'}" data-a="cat" data-k="${k}">${c.nombre}</button>`).join('')}
            </span>
          </div>
        </div>
        <div class="fila"><button class="btn grande" data-a="armar" ${S.sel.size < 4 ? 'disabled' : ''}>Armar equipos ▶</button></div>
      </div>`, {
      salir: confirmarSalida,
      alternar: d => { const id = +d.id; S.sel.has(id) ? S.sel.delete(id) : S.sel.add(id); pintarConfig(); },
      modo: d => { S.modo = d.m; pintarConfig(); },
      eqMenos: () => { S.numEquipos = Math.max(2, ne - 1); pintarConfig(); },
      eqMas: () => { S.numEquipos = Math.min(4, ne + 1); pintarConfig(); },
      tMenos: () => { S.tiempo = Math.max(30, S.tiempo - 15); pintarConfig(); },
      tMas: () => { S.tiempo = Math.min(180, S.tiempo + 15); pintarConfig(); },
      rMenos: () => { S.turnosPorEquipo = Math.max(1, S.turnosPorEquipo - 1); pintarConfig(); },
      rMas: () => { S.turnosPorEquipo = Math.min(10, S.turnosPorEquipo + 1); pintarConfig(); },
      cat: d => { S.cats.has(d.k) ? S.cats.delete(d.k) : S.cats.add(d.k); if (!S.cats.size) S.cats.add(d.k); pintarConfig(); },
      armar: () => {
        S.equipos = armarEquipos([...S.sel], S.numEquipos || equiposAuto());
        S.turno = 0;
        S.mazo = [];
        reglas();
      }
    });
  }

  function reglas() {
    const tv = S.modo === 'tv';
    pantallaReglas('🎭 Mímica Embrujada', '🎭', [
      'Se juega por equipos. En cada turno, <b>una persona actúa</b> y <b>su equipo adivina</b>.',
      tv ? 'El actor se para <b>frente a la TV</b> y ve la palabra. <b>Su equipo se voltea de espaldas</b> a la TV para no verla.'
        : 'El actor abre <b>su celular</b> en la sección <b>Mímica</b> y saca papelitos. Nadie más los ve.',
      '<b>Prohibido hablar</b>, hacer sonidos con palabras o señalar cosas. ¡Solo mímica! (Los gruñidos de monstruo sí se valen 🧟)',
      tv ? 'El anfitrión toca <b>✔ Adivinada</b> cuando acierten o <b>⏭ Pasar</b> si está muy difícil.'
        : 'Cada vez que adivinen, el anfitrión toca <b>+1</b>.',
      'Los otros equipos pueden ver pero <b>no soplar</b> 🤫. ¡Gana el equipo con más palabras!'
    ], tv ? 'Mímica embrujada. Por equipos, una persona actúa y su equipo adivina. El actor se para frente a la tele y su equipo se voltea de espaldas. Prohibido hablar. Solo mímica. Bueno... los gruñidos de monstruo sí se valen.'
      : 'Mímica embrujada. Por equipos, una persona actúa y su equipo adivina. El actor saca papelitos en su celular. Prohibido hablar. Solo mímica.',
      mostrarEquipos);
  }

  function mostrarEquipos() {
    pantalla(`
      ${barra('🎭 Equipos')}
      <div class="contenido">
        ${htmlEquipos(S.equipos, -1, false)}
        <div class="fila">
          <button class="btn secundario" data-a="otra">🔀 Revolver equipos</button>
          <button class="btn grande" data-a="empezar">¡A jugar! ▶</button>
        </div>
      </div>`, {
      salir: confirmarSalida,
      otra: () => { S.equipos = armarEquipos([...S.sel], S.equipos.length); mostrarEquipos(); },
      empezar: prepararTurno
    });
  }

  function totalTurnos() { return S.equipos.length * S.turnosPorEquipo; }
  function equipoActual() { return S.equipos[S.turno % S.equipos.length]; }
  function actorActual() {
    const e = equipoActual();
    const vuelta = Math.floor(S.turno / S.equipos.length);
    return e.miembros[vuelta % e.miembros.length];
  }
  function sacarPalabra() {
    if (!S.mazo.length) {
      S.mazo = barajar([...S.cats].flatMap(k => MIMICA_CATEGORIAS[k].palabras.map(p => ({ p, c: MIMICA_CATEGORIAS[k].nombre }))));
    }
    return S.mazo.pop();
  }

  function prepararTurno() {
    const e = equipoActual();
    const actor = actorActual();
    const tv = S.modo === 'tv';
    pantalla(`
      ${barra(`🎭 Turno ${S.turno + 1} de ${totalTurnos()}`)}
      <div class="contenido">
        <h2>${e.nombre}</h2>
        <div class="palabra-gigante aparecer">${fichaDe(actor)}</div>
        <p class="centro narracion">${tv ? `¡Te toca actuar! Ponte frente a la TV.<br>${e.nombre}: <b>¡de espaldas a la TV!</b> 🙈`
        : `¡Te toca actuar! Abre <b>Mímica</b> en tu celular y saca un papelito.<br>${e.nombre} adivina.`}</p>
        <div class="fila"><button class="btn grande verde" data-a="ya">⏱️ ¡Ya! (${S.tiempo} s)</button></div>
        ${htmlEquipos(S.equipos, S.turno % S.equipos.length)}
      </div>`, { salir: confirmarSalida, ya: jugarTurno });
    Sonido.decir(`Turno de ${nombreDe(actor)}, del equipo ${e.nombre.replace(/^\S+\s/, '')}.`);
  }

  function jugarTurno() {
    const e = equipoActual();
    const tv = S.modo === 'tv';
    let aciertos = 0, pasadas = 0;
    let actual = tv ? sacarPalabra() : null;
    let reloj;
    const pintarPalabra = () => {
      const el = document.getElementById('palabra');
      if (el) { el.innerHTML = `<div class="etiqueta">${actual.c}</div><div class="palabra-gigante aparecer">${escaparHTML(actual.p)}</div>`; }
      const c = document.getElementById('aciertos');
      if (c) c.textContent = aciertos;
    };
    pantalla(`
      ${barra(`🎭 ${e.nombre}`)}
      <div class="contenido" style="gap:1.5vh">
        <div class="barra-tiempo"><div id="barraTiempo"></div></div>
        <div class="fila entre" style="align-items:center">
          <div id="reloj" class="reloj" style="font-size:clamp(3rem,14vmin,9rem)"></div>
          <div class="centro"><div class="tenue">Adivinadas</div><div id="aciertos" class="reloj" style="font-size:clamp(3rem,14vmin,9rem)">0</div></div>
        </div>
        ${tv ? '<div id="palabra" class="centro"></div>' : '<p class="narracion">📱 El actor ve el papelito en su celular.<br>Toca <b>+1</b> cada vez que adivinen.</p>'}
        <div class="fila">
          ${tv ? '<button class="btn secundario grande" data-a="pasar">⏭ Pasar</button><button class="btn verde grande" data-a="bien">✔ Adivinada</button>'
        : '<button class="btn verde grande" data-a="bien">+1 ¡Adivinaron!</button><button class="btn secundario" data-a="menos">−1</button>'}
          <button class="btn secundario" data-a="fin">⏹ Terminar turno</button>
        </div>
      </div>`, {
      salir: confirmarSalida,
      bien: () => {
        aciertos++; Sonido.reproducir('exito');
        if (tv) actual = sacarPalabra();
        pintarPalabra();
      },
      menos: () => { aciertos = Math.max(0, aciertos - 1); pintarPalabra(); },
      pasar: () => { pasadas++; Sonido.reproducir('fallo'); actual = sacarPalabra(); pintarPalabra(); },
      fin: () => { reloj.detener(); finTurno(aciertos); }
    });
    if (tv) pintarPalabra();
    reloj = iniciarReloj(S.tiempo, () => finTurno(aciertos));
  }

  function finTurno(aciertos) {
    const e = equipoActual();
    e.puntos += aciertos;
    const ultimo = S.turno + 1 >= totalTurnos();
    pantalla(`
      ${barra('🎭 ¡Se acabó el tiempo!')}
      <div class="contenido">
        <h2>${e.nombre} sumó</h2>
        <div class="palabra-gigante aparecer">${aciertos} ${aciertos === 1 ? 'punto' : 'puntos'}</div>
        ${htmlEquipos(S.equipos, S.turno % S.equipos.length)}
        <div class="fila"><button class="btn grande" data-a="sig">${ultimo ? '🏆 Ver resultados' : 'Siguiente turno ▶'}</button></div>
      </div>`, {
      salir: confirmarSalida,
      sig: () => { if (ultimo) final(); else { S.turno++; prepararTurno(); } }
    });
    Sonido.decir(aciertos === 0 ? '¡Cero puntos! Qué miedo dan... pero de lo malos.' : `¡${aciertos} ${aciertos === 1 ? 'punto' : 'puntos'}!`);
  }

  function final() {
    const ganadores = premiarEquipos(S.equipos);
    const nombres = ganadores.map(g => g.nombre).join(' y ');
    pantalla(`
      ${barra('🎭 Resultados')}
      <div class="contenido">
        <h2>🏆 ¡Ganan ${nombres}!</h2>
        ${htmlEquipos(S.equipos)}
        <p class="centro tenue">Ganadores: +3 puntos cada quien · Segundo lugar: +1</p>
        <div class="fila">
          <button class="btn secundario" data-a="otra">🔁 Otra partida</button>
          <button class="btn" data-a="menu">◀ Menú</button>
        </div>
      </div>`, {
      salir: inicio,
      otra: () => { S.equipos.forEach(e => e.puntos = 0); S.turno = 0; mostrarEquipos(); },
      menu: inicio
    });
    Sonido.reproducir('fanfarria');
    lluvia();
    Sonido.decir(`¡Ganan ${nombres.replace(/[^\wáéíóúñü\s]/gi, '')}!`);
  }

  return { config };
})();

/* =========================================================
   🕵️ EL IMPOSTOR
   ========================================================= */
const Impostor = (() => {
  let S = {};

  function config() {
    S = { sel: seleccionInicial(), cat: 'sorpresa', num: null, debate: 120 };
    pintarConfig();
  }
  function numImp() { return S.num || impostoresRecomendados(S.sel.size); }

  function pintarConfig() {
    pantalla(`
      ${barra('🕵️ El Impostor')}
      <div class="contenido" style="justify-content:flex-start">
        <h3>¿Quién juega?</h3>
        ${htmlSeleccion(S.sel)}
        <div class="tarjeta">
          <div class="ajuste" style="flex-wrap:wrap">Categoría
            <select id="cat">
              <option value="sorpresa" ${S.cat === 'sorpresa' ? 'selected' : ''}>🎲 Sorpresa (cambia cada ronda)</option>
              ${Object.entries(IMPOSTOR_CATEGORIAS).map(([k, c]) => `<option value="${k}" ${S.cat === k ? 'selected' : ''}>${c.nombre}</option>`).join('')}
            </select>
          </div>
          <div class="ajuste">Impostores ${contadorHTML('iMenos', 'iMas', numImp(), '')}</div>
          <div class="ajuste">Tiempo de debate ${contadorHTML('dMenos', 'dMas', formatoTiempo(S.debate), '')}</div>
        </div>
        <div class="fila"><button class="btn grande" data-a="seguir" ${S.sel.size < 4 ? 'disabled' : ''}>Siguiente ▶</button></div>
      </div>`, {
      salir: confirmarSalida,
      alternar: d => { const id = +d.id; S.sel.has(id) ? S.sel.delete(id) : S.sel.add(id); pintarConfig(); },
      iMenos: () => { S.num = Math.max(1, numImp() - 1); pintarConfig(); },
      iMas: () => { S.num = Math.min(Math.max(1, Math.floor((S.sel.size - 1) / 2)), numImp() + 1); pintarConfig(); },
      dMenos: () => { S.debate = Math.max(30, S.debate - 30); pintarConfig(); },
      dMas: () => { S.debate = Math.min(600, S.debate + 30); pintarConfig(); },
      seguir: () => {
        S.ids = [...S.sel];
        S.nombres = S.ids.map(nombreDe);
        S.num = numImp();
        E.partidas++; guardar();
        S.semilla = `${E.semilla}${E.partidas}`;
        S.ronda = 1;
        reglas();
      }
    });
    document.getElementById('cat').addEventListener('change', ev => { S.cat = ev.target.value; });
  }

  function reglas() {
    pantallaReglas('🕵️ El Impostor', '🕵️', [
      'Escanea el QR con tu celular, elige tu nombre y <b>toca la tarjeta</b> para ver tu palabra secreta.',
      `Todos reciben <b>la misma palabra</b>… excepto ${S.num === 1 ? '<b>el impostor</b>, que' : `<b>los ${S.num} impostores</b>, que`} solo ve la categoría 😈`,
      'Por turnos, cada quien dice <b>UNA sola palabra</b> relacionada. Ni muy obvia (el impostor la adivinaría) ni muy rara (sospecharán de ti).',
      'Después debaten y, a la cuenta de 3, <b>todos señalan</b> al que creen que es el impostor.',
      'Si atrapan al impostor, él tiene una última oportunidad: <b>adivinar la palabra</b> para salvarse.'
    ], 'El impostor. Todos reciben la misma palabra secreta, excepto el impostor, que solo sabe la categoría. Por turnos, cada quien dice una sola palabra relacionada. Luego debaten y, a la cuenta de tres, todos señalan al sospechoso. Si atrapan al impostor, tiene una última oportunidad: adivinar la palabra.', reparto);
  }

  function enlace() {
    return crearEnlaceJugador({ g: 'impostor', s: S.semilla, n: S.nombres, i: S.num, c: S.cat });
  }

  function reparto() {
    S.datos = calcularImpostor(S.semilla, S.nombres, S.num, S.cat, S.ronda);
    const primera = S.ronda === 1;
    pantalla(`
      ${barra(`🕵️ Ronda ${S.ronda}`)}
      <div class="contenido">
        <div class="dos-columnas">
          <div><div class="qr-caja" data-enlace="${escaparHTML(enlace())}" ${primera ? "" : 'style="width:min(30vmin,60vw)"'}>${generarQR(enlace())}</div></div>
          <div>
            ${primera ? `<h2 style="text-align:left">📱 Escanea el QR</h2>
              <p>1. Abre la cámara y escanea.<br>2. Elige tu nombre.<br>3. <b>Toca la tarjeta</b> para ver tu palabra. ¡Que nadie vea tu pantalla! 🙈</p>`
        : `<h2 style="text-align:left">🔁 Nueva ronda</h2>
              <p>En tu celular toca <b>"Siguiente ronda ▶"</b> hasta que diga:</p>
              <div class="palabra-gigante" style="text-align:left">Ronda ${S.ronda}</div>
              <p class="tenue">¿Alguien nuevo o cerró la página? Que escanee el QR.</p>`}
            <p class="etiqueta">Juegan ${S.ids.length} · ${S.num} ${S.num === 1 ? 'impostor' : 'impostores'}</p>
          </div>
        </div>
        <div class="fila"><button class="btn grande" data-a="listos">✔ Ya todos vieron su palabra</button></div>
      </div>`, { salir: confirmarSalida, listos: pistas });
    Sonido.decir(primera ? 'Escaneen el código, elijan su nombre y vean su palabra en secreto.' : `Ronda ${S.ronda}. En su celular, toquen siguiente ronda.`);
  }

  function pistas() {
    const orden = barajar(S.ids);
    pantalla(`
      ${barra(`🕵️ Ronda ${S.ronda} · Pistas`)}
      <div class="contenido">
        <h2>🗣️ Cada quien dice UNA palabra</h2>
        <p class="centro">Sigan este orden. ¡Nada de pensarle mucho! ⏳</p>
        <div class="fichas">${orden.map((id, i) => `<span class="ficha ${i === 0 ? 'activa' : ''}"><b>${i + 1}.</b> ${fichaDe(id)}</span>`).join('')}</div>
        <div class="fila">
          <button class="btn secundario" data-a="otra">🔁 Otra vuelta de pistas</button>
          <button class="btn grande" data-a="debate">🗯️ ¡A debatir!</button>
        </div>
      </div>`, { salir: confirmarSalida, otra: pistas, debate });
    Sonido.decir(`Empieza ${nombreDe(orden[0])}. Cada quien diga una sola palabra.`);
  }

  function debate() {
    let reloj;
    pantalla(`
      ${barra(`🕵️ Ronda ${S.ronda} · Debate`)}
      <div class="contenido">
        <h2>🗯️ ¿Quién es el impostor?</h2>
        <div id="reloj" class="reloj"></div>
        <div class="barra-tiempo"><div id="barraTiempo"></div></div>
        <div class="fila">
          <button class="btn secundario" data-a="pausa">⏯ Pausa</button>
          <button class="btn secundario" data-a="mas">+30 s</button>
          <button class="btn grande rojo" data-a="votar">👉 ¡A votar!</button>
        </div>
      </div>`, {
      salir: confirmarSalida,
      pausa: () => reloj.pausar(),
      mas: () => reloj.agregar(30),
      votar
    });
    reloj = iniciarReloj(S.debate, votar);
    Sonido.decir('¡A debatir! ¿Quién de ustedes es el impostor?');
  }

  function votar() {
    cuentaRegresivaSeñalar('🕵️ Votación', '¡SEÑALEN AL IMPOSTOR!', S.ids, acusado => revelar(acusado));
  }

  async function revelar(acusado) {
    const esImpostor = acusado != null && S.datos.impostores.includes(S.ids.indexOf(acusado));
    pantalla(`${barra('🕵️ Revelación')}<div class="contenido"><div id="esc" class="narracion">🥁</div></div>`, { salir: confirmarSalida });
    const esc = document.getElementById('esc');
    if (acusado == null) {
      esc.innerHTML = '¡Empate! Nadie fue acusado… 😬';
      await Sonido.decir('Empate. Nadie fue acusado. El impostor se sale con la suya.');
      return finRonda('impostor');
    }
    esc.innerHTML = `${fichaDe(acusado)}…`;
    Sonido.reproducir('redoble', 2.5);
    await Sonido.decir(`${nombreDe(acusado)}... es...`);
    await new Promise(r => setTimeout(r, 1200));
    if (!document.getElementById('esc')) return;
    if (esImpostor) {
      destello(); temblar();
      Sonido.reproducir('grito');
      pantalla(`
        ${barra('🕵️ Revelación')}
        <div class="contenido">
          <h1 class="aparecer">😈 ¡ERA EL IMPOSTOR! 😈</h1>
          <div class="palabra-gigante">${fichaDe(acusado)}</div>
          <p class="narracion">Última oportunidad: <b>${escaparHTML(nombreDe(acusado))}</b>, ¿cuál es la palabra secreta?</p>
          <div class="fila">
            <button class="btn verde grande" data-a="si">😱 ¡La adivinó!</button>
            <button class="btn rojo grande" data-a="no">❌ No la adivinó</button>
          </div>
        </div>`, { salir: confirmarSalida, si: () => finRonda('impostor-adivino'), no: () => finRonda('pueblo') });
      Sonido.decir(`¡Era el impostor! ${nombreDe(acusado)}, tienes una última oportunidad. ¿Cuál es la palabra secreta?`);
    } else {
      Sonido.reproducir('fallo');
      pantalla(`
        ${barra('🕵️ Revelación')}
        <div class="contenido">
          <h1 class="aparecer">😇 ¡Era inocente!</h1>
          <div class="palabra-gigante">${fichaDe(acusado)}</div>
          <div class="fila"><button class="btn grande" data-a="sig">Ver quién era ▶</button></div>
        </div>`, { salir: confirmarSalida, sig: () => finRonda('impostor') });
      Sonido.decir(`¡Inocente! Acusaron a ${nombreDe(acusado)} injustamente. Muajajajá.`);
    }
  }

  function finRonda(resultado) {
    const impIds = S.datos.impostores.map(i => S.ids[i]);
    const pueblo = S.ids.filter(id => !impIds.includes(id));
    let titulo, nota;
    if (resultado === 'pueblo') { sumarPuntos(pueblo, 1); titulo = '🎉 ¡Gana el pueblo!'; nota = 'Todos los que no eran impostores: +1 punto'; }
    else if (resultado === 'impostor-adivino') { sumarPuntos(impIds, 2); titulo = '😈 ¡El impostor se salvó!'; nota = 'Impostores: +2 puntos'; }
    else { sumarPuntos(impIds, 3); titulo = '😈 ¡Ganan los impostores!'; nota = 'Impostores: +3 puntos'; }
    pantalla(`
      ${barra(`🕵️ Fin de la ronda ${S.ronda}`)}
      <div class="contenido">
        <h2>${titulo}</h2>
        <div class="tarjeta centro">
          <p class="tenue" style="margin:0">La palabra era</p>
          <div class="palabra-gigante">${escaparHTML(S.datos.palabra)}</div>
          <p class="tenue">(${S.datos.nombreCategoria})</p>
          <p>${impIds.length === 1 ? 'El impostor era' : 'Los impostores eran'}: ${impIds.map(id => `<span class="ficha elegida">${fichaDe(id)}</span>`).join(' ')}</p>
        </div>
        <p class="centro tenue">${nota}</p>
        <div class="fila">
          <button class="btn secundario" data-a="menu">◀ Menú</button>
          <button class="btn secundario" data-a="marcador">🏆 Marcador</button>
          <button class="btn grande" data-a="otra">🔁 Siguiente ronda</button>
        </div>
      </div>`, {
      salir: inicio, menu: inicio, marcador: pantallaMarcador,
      otra: () => { S.ronda++; reparto(); }
    });
    if (resultado === 'pueblo') { Sonido.reproducir('fanfarria'); lluvia(['🎉', '🎃', '🍬']); }
    else Sonido.decir('¡Muajajajá!');
  }

  return { config };
})();

/* ---------- Cuenta regresiva "a la de 3, señalen" + elegir acusado ---------- */
async function cuentaRegresivaSeñalar(titulo, grito, candidatos, onElegir) {
  let cancelado = false;
  pantalla(`${barra(titulo)}<div class="contenido"><div id="cuenta" class="reloj"></div></div>`, { salir: confirmarSalida });
  alSalir(() => { cancelado = true; });
  const pausa = ms => new Promise(r => setTimeout(r, ms));
  await Sonido.decir('Piensen bien... a la de tres, todos señalen.');
  for (const n of ['3', '2', '1']) {
    if (cancelado) return;
    const c = document.getElementById('cuenta');
    if (c) { c.textContent = n; c.classList.remove('aparecer'); void c.offsetWidth; c.classList.add('aparecer'); }
    Sonido.reproducir('tic');
    await pausa(900);
  }
  if (cancelado) return;
  Sonido.reproducir('trueno');
  destello();
  let elegido = null;
  const pintar = () => {
    pantalla(`
      ${barra(titulo)}
      <div class="contenido">
        <h1 class="aparecer">👉 ${grito}</h1>
        <p class="centro">¿Quién tiene más dedos apuntándole? Tócalo:</p>
        <div class="fichas">${candidatos.map(id => `<button class="ficha ${elegido === id ? 'elegida' : ''}" data-a="elegir" data-id="${id}">${fichaDe(id)}</button>`).join('')}</div>
        <div class="fila">
          <button class="btn secundario" data-a="empate">🤝 Empate / nadie</button>
          <button class="btn grande rojo" data-a="ok" ${elegido == null ? 'disabled' : ''}>Confirmar ✔</button>
        </div>
      </div>`, {
      salir: confirmarSalida,
      elegir: d => { elegido = +d.id; pintar(); },
      empate: () => onElegir(null),
      ok: () => onElegir(elegido)
    });
  };
  pintar();
}

/* =========================================================
   🔪 EL ASESINO DE SAN ESPANTO
   ========================================================= */
const Asesino = (() => {
  let S = {};
  const EPITAFIOS = [
    'Murió como vivió: hablando de más.',
    'Nunca debió salir por tamales a medianoche.',
    'Dijo "ahorita vengo" y ya no volvió.',
    'Su último deseo: que no se coman su pan de muerto.',
    'Se fue a la luz… y era el refri.',
    'Descanse en paz. O no. Ya veremos.',
    'Le dijeron que no abriera los ojos… y los abrió.',
    'Sus últimas palabras: "¿Qué fue ese ruido?"'
  ];

  function config() {
    S = { sel: seleccionInicial(), num: null, curandera: true, detective: true, revelar: true, debate: 180 };
    pintarConfig();
  }
  function numA() { return S.num || asesinosRecomendados(S.sel.size); }

  function pintarConfig() {
    const sw = (k, t) => `<label class="ajuste">${t}<span class="interruptor"><input type="checkbox" data-k="${k}" ${S[k] ? 'checked' : ''}><span></span></span></label>`;
    pantalla(`
      ${barra('🔪 El Asesino de San Espanto')}
      <div class="contenido" style="justify-content:flex-start">
        <h3>¿Quién juega?</h3>
        ${htmlSeleccion(S.sel)}
        <div class="tarjeta">
          <div class="ajuste">🔪 Asesinos ${contadorHTML('aMenos', 'aMas', numA(), '')}</div>
          ${sw('curandera', '🌿 Con Curandera (protege de noche)')}
          ${sw('detective', '🔍 Con Detective (investiga en su celular)')}
          ${sw('revelar', '💀 Revelar el rol de quien muere')}
          <div class="ajuste">Tiempo de debate ${contadorHTML('dMenos', 'dMas', formatoTiempo(S.debate), '')}</div>
        </div>
        <div class="fila"><button class="btn grande" data-a="seguir" ${S.sel.size < 5 ? 'disabled' : ''}>Siguiente ▶</button></div>
        ${S.sel.size < 5 ? '<p class="centro tenue">Se necesitan al menos 5 jugadores</p>' : ''}
      </div>`, {
      salir: confirmarSalida,
      alternar: d => { const id = +d.id; S.sel.has(id) ? S.sel.delete(id) : S.sel.add(id); pintarConfig(); },
      aMenos: () => { S.num = Math.max(1, numA() - 1); pintarConfig(); },
      aMas: () => { S.num = Math.min(Math.max(1, Math.floor((S.sel.size - 1) / 3)), numA() + 1); pintarConfig(); },
      dMenos: () => { S.debate = Math.max(60, S.debate - 30); pintarConfig(); },
      dMas: () => { S.debate = Math.min(600, S.debate + 30); pintarConfig(); },
      seguir: () => {
        S.ids = [...S.sel];
        S.nombres = S.ids.map(nombreDe);
        S.num = numA();
        E.partidas++; guardar();
        S.semilla = `${E.semilla}${E.partidas}`;
        S.ronda = 1;
        reglas();
      }
    });
    app.querySelectorAll('input[data-k]').forEach(i => i.addEventListener('change', () => { S[i.dataset.k] = i.checked; }));
  }

  function reglas() {
    pantallaReglas('🔪 El Asesino de San Espanto', '🔪', [
      'Escanea el QR, elige tu nombre y mira tu rol <b>en secreto</b>: 🔪 Asesino, 🌿 Curandera, 🔍 Detective o 🏚️ Aldeano.',
      '<b>De noche</b> todos cierran los ojos. La TV llama a cada rol: los asesinos eligen en silencio y <b>tocan el hombro</b> de su víctima. La curandera <b>toca la cabeza</b> de alguien para protegerlo. El detective investiga en su celular.',
      '<b>De día</b>, quien sintió la mano en el hombro lo dice. Si también le tocaron la cabeza… ¡se salvó! 🌿',
      'Todos debaten y, a la cuenta de 3, <b>señalan</b> al sospechoso. El más señalado queda eliminado.',
      'Los muertos son fantasmas 👻: ya no hablan ni votan… pero pueden hacer "uuuuuh".',
      'Gana el <b>pueblo</b> si elimina a todos los asesinos. Ganan los <b>asesinos</b> si llegan a ser tantos como el resto.'
    ], 'El asesino de San Espanto. Cada quien recibe un rol secreto en su celular. De noche, todos cierran los ojos. Los asesinos eligen a su víctima y le tocan el hombro. La curandera toca la cabeza de alguien para protegerlo. El detective investiga en su celular. De día, todos debaten y señalan al sospechoso. Gana el pueblo si elimina a todos los asesinos.', reparto);
  }

  function enlace() {
    return crearEnlaceJugador({ g: 'asesino', s: S.semilla, n: S.nombres, k: S.num, cu: S.curandera ? 1 : 0, de: S.detective ? 1 : 0 });
  }

  function reparto() {
    S.roles = calcularAsesino(S.semilla, S.nombres, S.num, S.curandera, S.detective, S.ronda);
    S.vivos = new Set(S.ids);
    S.noche = 0;
    const primera = S.ronda === 1;
    pantalla(`
      ${barra(`🔪 Partida ${S.ronda}`)}
      <div class="contenido">
        <div class="dos-columnas">
          <div><div class="qr-caja" data-enlace="${escaparHTML(enlace())}" ${primera ? "" : 'style="width:min(30vmin,60vw)"'}>${generarQR(enlace())}</div></div>
          <div>
            ${primera ? `<h2 style="text-align:left">📱 Escanea el QR</h2>
              <p>1. Abre la cámara y escanea.<br>2. Elige tu nombre.<br>3. <b>Toca la tarjeta</b> para ver tu rol. ¡Que nadie vea! 🙈</p>`
        : `<h2 style="text-align:left">🔁 Nueva partida</h2>
              <p>En tu celular toca <b>"Nueva partida ▶"</b> hasta que diga:</p>
              <div class="palabra-gigante" style="text-align:left">Partida ${S.ronda}</div>`}
            <p class="etiqueta">${S.ids.length} jugadores · ${S.num} 🔪${S.curandera ? ' · 🌿' : ''}${S.detective ? ' · 🔍' : ''}</p>
          </div>
        </div>
        <div class="fila"><button class="btn grande" data-a="listos">✔ Todos vieron su rol</button></div>
      </div>`, { salir: confirmarSalida, listos: intro });
    Sonido.decir(primera ? 'Escaneen el código y vean su rol en secreto. Que nadie vea su pantalla.' : `Partida ${S.ronda}. En su celular, toquen nueva partida.`);
  }

  async function intro() {
    let cancelado = false;
    pantalla(`
      ${barra('🔪 San Espanto')}
      <div class="contenido">
        <div class="narracion oscura aparecer">🏚️ Bienvenidos a San Espanto…<br><span class="tenue">un pueblito tranquilo donde nunca pasa nada… hasta hoy.</span></div>
        <div class="fila"><button class="btn grande" data-a="noche">🌙 Que caiga la noche</button></div>
      </div>`, { salir: confirmarSalida, noche: () => { cancelado = true; noche(); } });
    alSalir(() => { cancelado = true; });
    Sonido.reproducir('campana', 2);
    await Sonido.decir('Bienvenidos a San Espanto. Un pueblito tranquilo, donde nunca pasa nada. Bueno... hasta hoy. Porque entre ustedes se esconde un asesino.');
    if (!cancelado) Sonido.reproducir('trueno');
  }

  // Ejecuta una secuencia de pasos narrados con espera
  function secuencia(titulo, pasos, alTerminar) {
    let i = -1, cancelado = false, timer = null;
    const siguiente = async () => {
      clearInterval(timer);
      i++;
      if (cancelado) return;
      if (i >= pasos.length) { cancelado = true; return alTerminar(); }
      const p = pasos[i];
      const esc = document.getElementById('esc');
      const cuenta = document.getElementById('cuentaPaso');
      if (!esc) return;
      esc.innerHTML = `<div class="aparecer">${p.html || p.texto}</div>`;
      cuenta.textContent = '';
      if (p.sonido) Sonido.reproducir(p.sonido);
      const yo = i;
      await Sonido.decir(p.texto, { tono: 0.6, velocidad: 0.85 });
      if (cancelado || yo !== i) return;
      let s = p.espera || 0;
      if (!s) return siguiente();
      cuenta.textContent = s;
      timer = setInterval(() => {
        s--;
        if (cancelado || yo !== i) return clearInterval(timer);
        cuenta.textContent = s > 0 ? s : '';
        if (s <= 0) { clearInterval(timer); siguiente(); }
      }, 1000);
    };
    pantalla(`
      ${barra(titulo)}
      <div class="contenido" style="background:radial-gradient(circle,#1b0b30,#000);border-radius:20px">
        <div style="font-size:12vmin;text-align:center">🌙</div>
        <div id="esc" class="narracion oscura"></div>
        <div id="cuentaPaso" class="reloj" style="font-size:clamp(2.5rem,10vmin,6rem);opacity:.6"></div>
        <div class="fila"><button class="btn secundario" data-a="saltar">⏭ Siguiente paso</button></div>
      </div>`, { salir: confirmarSalida, saltar: () => { Sonido.callar(); siguiente(); } });
    alSalir(() => { cancelado = true; clearInterval(timer); });
    Sonido.detenerAmbiente();
    siguiente();
  }

  function noche() {
    S.noche++;
    const primera = S.noche === 1;
    const pasos = [
      { texto: `Noche ${S.noche}. Cae la noche en San Espanto. Todos... cierren los ojos y agachen la cabeza.`, sonido: 'latido', espera: 5 },
      {
        texto: primera
          ? 'Asesinos... abran los ojos. Mírense entre ustedes: ellos son sus cómplices. Ahora elijan a su víctima en silencio, señalando. Cuando estén de acuerdo, uno de ustedes, tóquele el hombro a la víctima.'
          : 'Asesinos... abran los ojos. Elijan a su víctima en silencio. Cuando estén de acuerdo, uno de ustedes, tóquele el hombro.',
        html: '🔪 Asesinos, abran los ojos…<br><span class="tenue">elijan en silencio y toquen el hombro de su víctima</span>',
        sonido: 'organo', espera: primera ? 30 : 25
      },
      { texto: 'Asesinos... cierren los ojos.', espera: 3 }
    ];
    if (S.curandera) pasos.push(
      { texto: 'Curandera... abre los ojos. Toca la cabeza de alguien para protegerlo esta noche. Si te quieres proteger a ti misma, tócate tu propia cabeza.', html: '🌿 Curandera, abre los ojos…<br><span class="tenue">toca la cabeza de quien quieras proteger</span>', sonido: 'fantasma', espera: 15 },
      { texto: 'Curandera... cierra los ojos.', espera: 3 }
    );
    if (S.detective) pasos.push(
      { texto: 'Detective... abre los ojos. En tu celular, investiga a un sospechoso. Solo uno por noche.', html: '🔍 Detective, abre los ojos…<br><span class="tenue">investiga a alguien en tu celular</span>', sonido: 'puerta', espera: 20 },
      { texto: 'Detective... cierra los ojos.', espera: 3 }
    );
    pasos.push({ texto: 'Los fantasmas recorren el pueblo... y poco a poco... sale el sol.', sonido: 'fantasma', espera: 2 });
    secuencia(`🌙 Noche ${S.noche}`, pasos, amanecer);
  }

  function amanecer() {
    Sonido.reproducir('campana', 2);
    Sonido.iniciarAmbiente();
    let victima = null;
    const vivos = S.ids.filter(id => S.vivos.has(id));
    const pintar = () => {
      pantalla(`
        ${barra(`☀️ Día ${S.noche}`)}
        <div class="contenido">
          <h2>☀️ ¡Todos abran los ojos!</h2>
          <p class="narracion">¿Quién sintió una <b>mano helada</b> en el hombro? 🥶<br><span class="tenue">Que se ponga de pie lentamente…</span></p>
          <div class="fichas">${vivos.map(id => `<button class="ficha ${victima === id ? 'elegida' : ''}" data-a="elegir" data-id="${id}">${fichaDe(id)}</button>`).join('')}</div>
          <div class="fila">
            <button class="btn verde" data-a="salvado">🌿 Lo tocaron, pero se salvó</button>
            <button class="btn secundario" data-a="nadie">😶 Nadie fue atacado</button>
            <button class="btn rojo grande" data-a="muerto" ${victima == null ? 'disabled' : ''}>💀 Confirmar víctima</button>
          </div>
        </div>`, {
        salir: confirmarSalida,
        elegir: d => { victima = +d.id; pintar(); },
        salvado: salvado,
        nadie: async () => { await Sonido.decir('Qué raro... nadie murió anoche. Los asesinos están planeando algo.'); debate(); },
        muerto: () => muerte(victima, 'noche')
      });
    };
    pintar();
    Sonido.decir('Sale el sol en San Espanto. Todos, abran los ojos. ¿Quién sintió una mano helada en el hombro?');
  }

  async function salvado() {
    pantalla(`${barra(`☀️ Día ${S.noche}`)}<div class="contenido"><h1 class="aparecer">🌿 ¡Milagro!</h1>
      <p class="narracion">Los asesinos atacaron… pero <b>la Curandera llegó a tiempo</b>.<br>Nadie murió esta noche.</p>
      <div class="fila"><button class="btn grande" data-a="sig">🗯️ A debatir</button></div></div>`, { salir: confirmarSalida, sig: debate });
    Sonido.reproducir('exito');
    await Sonido.decir('¡Milagro! Los asesinos atacaron, pero la curandera llegó a tiempo con sus hierbitas. Nadie murió esta noche.');
  }

  function rolDe(id) { return S.roles[S.ids.indexOf(id)]; }

  async function muerte(id, como) {
    S.vivos.delete(id);
    const rol = rolDe(id);
    const info = INFO_ROLES[rol.tipo];
    const epitafio = elegir(EPITAFIOS);
    destello(); temblar();
    Sonido.reproducir(como === 'noche' ? 'grito' : 'trueno');
    pantalla(`
      ${barra(como === 'noche' ? `☀️ Día ${S.noche}` : '⚖️ El pueblo decidió')}
      <div class="contenido">
        <h1 class="aparecer">🪦 ${como === 'noche' ? 'Amaneció sin vida' : 'Fue eliminado'}</h1>
        <div class="palabra-gigante">${fichaDe(id)}</div>
        ${S.revelar ? `<p class="centro narracion">Era… <span style="color:${info.color}">${info.emoji} ${info.nombre}</span></p>` : ''}
        <p class="centro tenue" style="font-style:italic">"${epitafio}"</p>
        <div class="fila"><button class="btn grande" data-a="sig">Continuar ▶</button></div>
      </div>`, { salir: confirmarSalida, sig: () => { if (!revisarFin()) (como === 'noche' ? debate() : noche()); } });
    const n = nombreDe(id);
    await Sonido.decir(como === 'noche'
      ? `${n} amaneció sin vida. ${S.revelar ? `Era... ${info.nombre.toLowerCase()}.` : ''} ${epitafio}`
      : `El pueblo ha decidido. ${n} queda eliminado. ${S.revelar ? `Era... ${info.nombre.toLowerCase()}.` : ''}`);
  }

  function conteo() {
    const vivos = S.ids.filter(id => S.vivos.has(id));
    const asesinos = vivos.filter(id => rolDe(id).tipo === 'asesino').length;
    return { asesinos, resto: vivos.length - asesinos };
  }
  function revisarFin() {
    const { asesinos, resto } = conteo();
    if (asesinos === 0) { final('pueblo'); return true; }
    if (asesinos >= resto) { final('asesinos'); return true; }
    return false;
  }

  function debate() {
    let reloj;
    const vivos = S.ids.filter(id => S.vivos.has(id));
    pantalla(`
      ${barra(`🗯️ Día ${S.noche} · Debate`)}
      <div class="contenido">
        <h2>🗯️ ¿Quién es el asesino?</h2>
        <div id="reloj" class="reloj"></div>
        <div class="barra-tiempo"><div id="barraTiempo"></div></div>
        <div class="fichas">${S.ids.map(id => `<span class="ficha ${S.vivos.has(id) ? '' : 'muerto'}">${S.vivos.has(id) ? '' : '👻 '}${fichaDe(id)}</span>`).join('')}</div>
        <p class="centro tenue">Vivos: ${vivos.length} · Los fantasmas 👻 no hablan</p>
        <div class="fila">
          <button class="btn secundario" data-a="pausa">⏯ Pausa</button>
          <button class="btn secundario" data-a="mas">+30 s</button>
          <button class="btn grande rojo" data-a="votar">👉 ¡A votar!</button>
        </div>
      </div>`, {
      salir: confirmarSalida,
      pausa: () => reloj.pausar(),
      mas: () => reloj.agregar(30),
      votar
    });
    reloj = iniciarReloj(S.debate, votar);
    Sonido.decir('¡A debatir! El asesino está entre ustedes.');
  }

  function votar() {
    const vivos = S.ids.filter(id => S.vivos.has(id));
    cuentaRegresivaSeñalar('⚖️ Votación', '¡SEÑALEN AL ASESINO!', vivos, async acusado => {
      if (acusado == null) {
        pantalla(`${barra('⚖️ Votación')}<div class="contenido"><h2>🤝 Empate</h2><p class="narracion">Nadie es eliminado hoy… y la noche se acerca 🌙</p>
          <div class="fila"><button class="btn grande" data-a="sig">🌙 Que caiga la noche</button></div></div>`, { salir: confirmarSalida, sig: noche });
        await Sonido.decir('Empate. Nadie es eliminado hoy. Y la noche se acerca.');
      } else muerte(acusado, 'voto');
    });
  }

  function final(ganador) {
    const pueblo = ganador === 'pueblo';
    const ganadores = S.ids.filter(id => (rolDe(id).tipo === 'asesino') !== pueblo);
    sumarPuntos(ganadores, 2);
    pantalla(`
      ${barra('🔪 Fin de la partida')}
      <div class="contenido" style="justify-content:flex-start">
        <h1 class="aparecer">${pueblo ? '🎉 ¡El pueblo se salvó!' : '🔪 ¡Ganan los asesinos!'}</h1>
        <p class="centro tenue">Ganadores: +2 puntos cada quien</p>
        <div class="fichas">
          ${S.ids.map(id => { const r = rolDe(id), info = INFO_ROLES[r.tipo]; return `<span class="ficha ${S.vivos.has(id) ? '' : 'muerto'}" style="border-color:${info.color}">${fichaDe(id)} · ${info.emoji} ${info.nombre}</span>`; }).join('')}
        </div>
        <div class="fila">
          <button class="btn secundario" data-a="menu">◀ Menú</button>
          <button class="btn secundario" data-a="marcador">🏆 Marcador</button>
          <button class="btn grande" data-a="otra">🔁 Otra partida</button>
        </div>
      </div>`, {
      salir: inicio, menu: inicio, marcador: pantallaMarcador,
      otra: () => { S.ronda++; reparto(); }
    });
    if (pueblo) { Sonido.reproducir('fanfarria'); lluvia(['🎉', '🌿', '🔍', '🏚️']); Sonido.decir('¡El pueblo de San Espanto se salvó! Ya pueden dormir tranquilos. Bueno... casi.'); }
    else { Sonido.reproducir('trueno'); lluvia(['🔪', '🩸', '💀'], 30); Sonido.decir('¡Ganan los asesinos! San Espanto ahora es un pueblo fantasma. Muajajajá.'); }
  }

  return { config };
})();

/* =========================================================
   🧠 TRIVIA DE TERROR
   ========================================================= */
const Trivia = (() => {
  let S = {};

  function config() {
    S = { sel: seleccionInicial(), numEquipos: null, preguntas: 10, tiempo: 20 };
    pintarConfig();
  }
  function equiposAuto() { return S.sel.size >= 10 ? 3 : 2; }

  function pintarConfig() {
    const ne = S.numEquipos || equiposAuto();
    pantalla(`
      ${barra('🧠 Trivia de Terror')}
      <div class="contenido" style="justify-content:flex-start">
        <h3>¿Quién juega?</h3>
        ${htmlSeleccion(S.sel)}
        <div class="tarjeta">
          <div class="ajuste">Equipos ${contadorHTML('eqMenos', 'eqMas', ne, '')}</div>
          <div class="ajuste">Preguntas ${contadorHTML('pMenos', 'pMas', S.preguntas, '')}</div>
          <div class="ajuste">Segundos para pensar ${contadorHTML('tMenos', 'tMas', S.tiempo, '')}</div>
        </div>
        <div class="fila"><button class="btn grande" data-a="armar" ${S.sel.size < 2 ? 'disabled' : ''}>Armar equipos ▶</button></div>
      </div>`, {
      salir: confirmarSalida,
      alternar: d => { const id = +d.id; S.sel.has(id) ? S.sel.delete(id) : S.sel.add(id); pintarConfig(); },
      eqMenos: () => { S.numEquipos = Math.max(2, ne - 1); pintarConfig(); },
      eqMas: () => { S.numEquipos = Math.min(4, ne + 1, S.sel.size); pintarConfig(); },
      pMenos: () => { S.preguntas = Math.max(5, S.preguntas - 5); pintarConfig(); },
      pMas: () => { S.preguntas = Math.min(TRIVIA.length, S.preguntas + 5); pintarConfig(); },
      tMenos: () => { S.tiempo = Math.max(10, S.tiempo - 5); pintarConfig(); },
      tMas: () => { S.tiempo = Math.min(60, S.tiempo + 5); pintarConfig(); },
      armar: () => {
        S.equipos = armarEquipos([...S.sel], Math.min(S.numEquipos || equiposAuto(), S.sel.size));
        // Preguntas no usadas primero
        let disponibles = TRIVIA.map((_, i) => i).filter(i => !E.triviaUsadas.includes(i));
        if (disponibles.length < S.preguntas) { E.triviaUsadas = []; disponibles = TRIVIA.map((_, i) => i); }
        S.lista = barajar(disponibles).slice(0, S.preguntas);
        S.actual = 0;
        reglas();
      }
    });
  }

  function reglas() {
    pantallaReglas('🧠 Trivia de Terror', '🧠', [
      'Se juega por equipos. Aparece una pregunta con <b>4 opciones numeradas</b>.',
      `Cada equipo tiene <b>${S.tiempo} segundos</b> para ponerse de acuerdo en secreto (¡en voz baja! 🤫).`,
      'Cuando suene la alarma, el capitán de cada equipo levanta la mano mostrando <b>1, 2, 3 o 4 dedos</b>.',
      'El anfitrión marca qué equipos acertaron. ¡Gana el equipo con más respuestas correctas!'
    ], 'Trivia de terror. Por equipos. Aparece una pregunta con cuatro opciones. Pónganse de acuerdo en voz baja, y cuando suene la alarma, muestren con los dedos el número de su respuesta: uno, dos, tres o cuatro.', mostrarEquipos);
  }

  function mostrarEquipos() {
    pantalla(`
      ${barra('🧠 Equipos')}
      <div class="contenido">
        ${htmlEquipos(S.equipos, -1, false)}
        <p class="centro tenue">Elijan un capitán por equipo 🙋</p>
        <div class="fila">
          <button class="btn secundario" data-a="otra">🔀 Revolver</button>
          <button class="btn grande" data-a="empezar">¡Primera pregunta! ▶</button>
        </div>
      </div>`, {
      salir: confirmarSalida,
      otra: () => { S.equipos = armarEquipos([...S.sel], S.equipos.length); mostrarEquipos(); },
      empezar: pregunta
    });
  }

  function pregunta() {
    const q = TRIVIA[S.lista[S.actual]];
    let reloj;
    pantalla(`
      ${barra(`🧠 Pregunta ${S.actual + 1} de ${S.lista.length}`)}
      <div class="contenido" style="gap:2vh">
        <div class="barra-tiempo"><div id="barraTiempo"></div></div>
        <div class="fila entre" style="flex-wrap:nowrap;align-items:center">
          <p class="narracion" style="text-align:left;margin:0">${escaparHTML(q.p)}</p>
          <div id="reloj" class="reloj" style="font-size:clamp(3rem,13vmin,8rem);min-width:2em"></div>
        </div>
        <div class="opciones">${q.o.map((o, i) => `<div class="opcion"><span class="letra">${i + 1}</span>${escaparHTML(o)}</div>`).join('')}</div>
        <div class="fila"><button class="btn secundario" data-a="ya">⏩ Ya contestamos</button></div>
      </div>`, { salir: confirmarSalida, ya: () => { reloj.detener(); mostrar(); } });
    reloj = iniciarReloj(S.tiempo, mostrar);
    Sonido.decir(`${q.p} Uno: ${q.o[0]}. Dos: ${q.o[1]}. Tres: ${q.o[2]}. Cuatro: ${q.o[3]}.`, { tono: 0.9, velocidad: 1 });
  }

  async function mostrar() {
    Sonido.callar();
    pantalla(`${barra('🧠 ¡Muestren su respuesta!')}<div class="contenido"><h1 class="aparecer">✋ ¡Capitanes, arriba los dedos! ✋</h1><div class="reloj" id="c3">3</div></div>`, { salir: confirmarSalida });
    for (const n of ['3', '2', '1']) {
      const el = document.getElementById('c3'); if (!el) return;
      el.textContent = n; Sonido.reproducir('tic');
      await new Promise(r => setTimeout(r, 800));
    }
    revelar();
  }

  function revelar() {
    const q = TRIVIA[S.lista[S.actual]];
    const acertaron = new Set();
    E.triviaUsadas.push(S.lista[S.actual]); guardar();
    const pintar = () => {
      pantalla(`
        ${barra(`🧠 Pregunta ${S.actual + 1} de ${S.lista.length}`)}
        <div class="contenido" style="gap:1.6vh">
          <p class="narracion" style="margin:0">${escaparHTML(q.p)}</p>
          <div class="opciones">${q.o.map((o, i) => `<div class="opcion ${i === q.c ? 'correcta' : 'incorrecta'}"><span class="letra">${i + 1}</span>${escaparHTML(o)}</div>`).join('')}</div>
          <p class="centro tenue" style="margin:0">💡 ${escaparHTML(q.d)}</p>
          <h3 class="centro">¿Quién acertó? (toca los equipos)</h3>
          <div class="fila">${S.equipos.map((e, i) => `<button class="ficha ${acertaron.has(i) ? 'activa' : ''}" data-a="eq" data-i="${i}">${acertaron.has(i) ? '✅ ' : ''}${e.nombre} · ${e.puntos + (acertaron.has(i) ? 1 : 0)}</button>`).join('')}</div>
          <div class="fila"><button class="btn grande" data-a="sig">${S.actual + 1 >= S.lista.length ? '🏆 Resultados' : 'Siguiente pregunta ▶'}</button></div>
        </div>`, {
        salir: confirmarSalida,
        eq: d => { const i = +d.i; acertaron.has(i) ? acertaron.delete(i) : (acertaron.add(i), Sonido.reproducir('exito')); pintar(); },
        sig: () => {
          acertaron.forEach(i => S.equipos[i].puntos++);
          S.actual++;
          if (S.actual >= S.lista.length) final(); else pregunta();
        }
      });
    };
    pintar();
    Sonido.decir(`La respuesta correcta es la ${q.c + 1}: ${q.o[q.c]}. ${q.d}`, { tono: 0.9, velocidad: 1 });
  }

  function final() {
    const ganadores = premiarEquipos(S.equipos);
    const nombres = ganadores.map(g => g.nombre).join(' y ');
    pantalla(`
      ${barra('🧠 Resultados')}
      <div class="contenido">
        <h2>🏆 ¡Ganan ${nombres}!</h2>
        ${htmlEquipos(S.equipos)}
        <p class="centro tenue">Ganadores: +3 puntos cada quien · Segundo lugar: +1</p>
        <div class="fila">
          <button class="btn secundario" data-a="marcador">🏆 Marcador</button>
          <button class="btn" data-a="menu">◀ Menú</button>
        </div>
      </div>`, { salir: inicio, menu: inicio, marcador: pantallaMarcador });
    Sonido.reproducir('fanfarria'); lluvia();
    Sonido.decir(`¡Ganan ${nombres.replace(/[^\wáéíóúñü\s]/gi, '')}! Son unos genios del terror.`);
  }

  return { config };
})();

/* =========================================================
   🎡 RULETA MALDITA
   ========================================================= */
const Ruleta = (() => {
  let S = {};
  const COLORES = ['#ff7a18', '#8e44ff', '#1f1233', '#3ddc84', '#ff2d55', '#2a1450'];

  function inicio() {
    S = { sel: seleccionInicial(), angulo: 0, girando: false };
    if (!E.jugadores.length) { alert('Agrega jugadores primero 👥'); return pantallaJugadores(); }
    pintar();
  }

  function dibujar(canvas, etiquetas, angulo) {
    const ctx = canvas.getContext('2d');
    const tam = canvas.width, r = tam / 2;
    ctx.clearRect(0, 0, tam, tam);
    const n = etiquetas.length, arco = Math.PI * 2 / n;
    for (let i = 0; i < n; i++) {
      const a0 = angulo + i * arco - Math.PI / 2;
      ctx.beginPath(); ctx.moveTo(r, r); ctx.arc(r, r, r - 6, a0, a0 + arco); ctx.closePath();
      ctx.fillStyle = COLORES[i % COLORES.length]; ctx.fill();
      ctx.strokeStyle = '#0b0614'; ctx.lineWidth = 4; ctx.stroke();
      ctx.save(); ctx.translate(r, r); ctx.rotate(a0 + arco / 2);
      ctx.textAlign = 'right'; ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.max(16, Math.min(40, 360 / n))}px Nunito, sans-serif`;
      ctx.shadowColor = '#000'; ctx.shadowBlur = 6;
      ctx.fillText(etiquetas[i].slice(0, 14), r - 24, 10);
      ctx.restore();
    }
    ctx.beginPath(); ctx.arc(r, r, r * 0.12, 0, Math.PI * 2); ctx.fillStyle = '#0b0614'; ctx.fill();
    ctx.font = `${r * 0.14}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('💀', r, r + 2);
  }

  function pintar() {
    const ids = [...S.sel];
    pantalla(`
      ${barra('🎡 Ruleta Maldita')}
      <div class="contenido" style="gap:1.5vh">
        <div class="dos-columnas">
          <div class="ruleta-caja"><div class="ruleta-flecha">🔻</div><canvas id="rueda" width="800" height="800"></canvas></div>
          <div style="display:flex;flex-direction:column;gap:2vh">
            <h2>¿A quién le toca? 🎯</h2>
            <p class="centro">Gira la ruleta. Al elegido le toca <b>verdad o reto</b>.</p>
            <div class="fila"><button class="btn grande" data-a="girar" ${ids.length < 2 ? 'disabled' : ''}>🎡 ¡GIRAR!</button></div>
            <details><summary class="tenue" style="cursor:pointer">¿Quién está en la ruleta? (${ids.length})</summary>${htmlSeleccion(S.sel)}</details>
          </div>
        </div>
      </div>`, {
      salir: confirmarSalida,
      alternar: d => { const id = +d.id; S.sel.has(id) ? S.sel.delete(id) : S.sel.add(id); pintar(); },
      girar: () => girar(ids)
    });
    const c = document.getElementById('rueda');
    dibujar(c, ids.map(id => `${jugadorPorId(id).emoji} ${jugadorPorId(id).nombre}`), S.angulo);
  }

  function girar(ids) {
    if (S.girando) return;
    S.girando = true;
    const c = document.getElementById('rueda');
    const etiquetas = ids.map(id => `${jugadorPorId(id).emoji} ${jugadorPorId(id).nombre}`);
    const n = ids.length, arco = Math.PI * 2 / n;
    const inicio = S.angulo;
    const vueltas = Math.PI * 2 * (5 + Math.random() * 3);
    const destino = inicio + vueltas + Math.random() * Math.PI * 2;
    const dur = 4500, t0 = performance.now();
    let ultimoSeg = -1;
    let activo = true;
    alSalir(() => { activo = false; S.girando = false; });
    const paso = ahora => {
      if (!activo) return;
      const t = Math.min(1, (ahora - t0) / dur);
      const e = 1 - Math.pow(1 - t, 4);
      S.angulo = inicio + (destino - inicio) * e;
      dibujar(c, etiquetas, S.angulo);
      const seg = Math.floor(((Math.PI * 2 - (S.angulo % (Math.PI * 2))) % (Math.PI * 2)) / arco);
      if (seg !== ultimoSeg) { ultimoSeg = seg; Sonido.reproducir('tic'); }
      if (t < 1) requestAnimationFrame(paso);
      else {
        S.girando = false;
        const ang = ((Math.PI * 2 - (S.angulo % (Math.PI * 2))) % (Math.PI * 2));
        const idx = Math.floor(ang / arco) % n;
        elegido(ids[idx]);
      }
    };
    requestAnimationFrame(paso);
  }

  function elegido(id) {
    Sonido.reproducir('trueno');
    pantalla(`
      ${barra('🎡 Ruleta Maldita')}
      <div class="contenido">
        <h2>Le tocó a…</h2>
        <div class="palabra-gigante aparecer">${fichaDe(id)}</div>
        <p class="narracion">¿Qué eliges?</p>
        <div class="fila">
          <button class="btn morado grande" data-a="verdad">🤫 Verdad</button>
          <button class="btn rojo grande" data-a="reto">😈 Reto</button>
          <button class="btn secundario grande" data-a="azar">🎲 Que decida la suerte</button>
        </div>
        <div class="fila"><button class="btn secundario chico" data-a="volver">◀ Volver a la ruleta</button></div>
      </div>`, {
      salir: confirmarSalida,
      verdad: () => carta(id, 'verdad'),
      reto: () => carta(id, 'reto'),
      azar: () => carta(id, Math.random() < 0.5 ? 'verdad' : 'reto'),
      volver: pintar
    });
    Sonido.decir(`Le tocó a ${nombreDe(id)}. ¿Verdad... o reto?`);
  }

  function carta(id, tipo) {
    const texto = tipo === 'verdad' ? elegir(VERDADES) : elegir(RETOS);
    pantalla(`
      ${barra('🎡 Ruleta Maldita')}
      <div class="contenido">
        <h2>${tipo === 'verdad' ? '🤫 VERDAD' : '😈 RETO'} para ${fichaDe(id)}</h2>
        <div class="tarjeta aparecer"><div class="narracion">${escaparHTML(texto)}</div></div>
        <div class="fila">
          <button class="btn verde grande" data-a="cumplio">✔ ¡Cumplió! (+1)</button>
          <button class="btn secundario" data-a="otra">🔁 Otra ${tipo}</button>
          <button class="btn rojo" data-a="rajo">🐔 Se rajó</button>
        </div>
      </div>`, {
      salir: confirmarSalida,
      cumplio: () => { sumarPuntos([id], 1); Sonido.reproducir('exito'); pintar(); },
      otra: () => carta(id, tipo),
      rajo: () => castigo(id)
    });
    Sonido.decir(`${tipo === 'verdad' ? 'Verdad' : 'Reto'}: ${texto.replace(/\p{Extended_Pictographic}/gu, '')}`);
  }

  function castigo(id) {
    const c = elegir(CASTIGOS);
    if (c.startsWith('Pierdes 1 punto')) sumarPuntos([id], -1);
    Sonido.reproducir('fallo');
    pantalla(`
      ${barra('🎡 Ruleta Maldita')}
      <div class="contenido">
        <h1 class="aparecer">🐔 ¡SE RAJÓ!</h1>
        <p class="centro narracion">Castigo para ${fichaDe(id)}:</p>
        <div class="tarjeta"><div class="narracion">${escaparHTML(c)}</div></div>
        <div class="fila"><button class="btn grande" data-a="volver">🎡 Volver a la ruleta</button></div>
      </div>`, { salir: confirmarSalida, volver: pintar });
    Sonido.decir(`¡Se rajó! Castigo: ${c.replace(/\p{Extended_Pictographic}/gu, '')}`);
  }

  return { inicio };
})();

/* =========================================================
   🧛 CONCURSO DE DISFRACES
   ========================================================= */
const Disfraces = (() => {
  let S = {};
  let micro = null; // { ctx, analizador, stream }

  function config() {
    S = { sel: seleccionInicial(), cats: new Set(CATEGORIAS_DISFRAZ.map((_, i) => i)), metodo: 'aplausos' };
    pintarConfig();
  }

  function pintarConfig() {
    pantalla(`
      ${barra('🧛 Concurso de Disfraces')}
      <div class="contenido" style="justify-content:flex-start">
        <h3>¿Quién se disfrazó?</h3>
        ${htmlSeleccion(S.sel)}
        <div class="tarjeta">
          <div class="ajuste" style="flex-wrap:wrap">Categorías
            <span class="fichas" style="justify-content:flex-end">
              ${CATEGORIAS_DISFRAZ.map((c, i) => `<button class="ficha ${S.cats.has(i) ? 'activa' : 'apagada'}" data-a="cat" data-i="${i}">${c}</button>`).join('')}
            </span>
          </div>
          <div class="ajuste">Cómo se vota
            <span class="fila" style="gap:.5em">
              <button class="btn chico ${S.metodo === 'aplausos' ? '' : 'secundario'}" data-a="metodo" data-m="aplausos">👏 Aplausómetro</button>
              <button class="btn chico ${S.metodo === 'manos' ? '' : 'secundario'}" data-a="metodo" data-m="manos">✋ Mano alzada</button>
            </span>
          </div>
        </div>
        <div class="fila">
          <button class="btn secundario" data-a="pasarela" ${S.sel.size < 2 ? 'disabled' : ''}>💃 Primero la pasarela</button>
          <button class="btn grande" data-a="votar" ${S.sel.size < 2 ? 'disabled' : ''}>🗳️ Ir a votar ▶</button>
        </div>
      </div>`, {
      salir: confirmarSalida,
      alternar: d => { const id = +d.id; S.sel.has(id) ? S.sel.delete(id) : S.sel.add(id); pintarConfig(); },
      cat: d => { const i = +d.i; S.cats.has(i) ? S.cats.delete(i) : S.cats.add(i); if (!S.cats.size) S.cats.add(i); pintarConfig(); },
      metodo: d => { S.metodo = d.m; pintarConfig(); },
      pasarela: () => { prep(); pasarela(0); },
      votar: () => { prep(); categoria(); }
    });
  }

  function prep() {
    S.ids = barajar([...S.sel]);
    S.listaCats = [...S.cats].sort();
    S.catActual = 0;
  }

  function pasarela(i) {
    if (i >= S.ids.length) return categoria();
    const id = S.ids[i];
    pantalla(`
      ${barra(`💃 Pasarela ${i + 1} de ${S.ids.length}`)}
      <div class="contenido" style="background:radial-gradient(circle at 50% 30%,rgba(255,240,180,.25),transparent 60%)">
        <p class="centro narracion tenue">Desde las profundidades del más allá…</p>
        <div class="palabra-gigante aparecer">${fichaDe(id)}</div>
        <p class="centro">¡Camina, posa y asusta! 📸</p>
        <div class="fila"><button class="btn grande" data-a="sig">${i + 1 >= S.ids.length ? '🗳️ A votar' : 'Siguiente ▶'}</button></div>
      </div>`, { salir: confirmarSalida, sig: () => pasarela(i + 1) });
    Sonido.reproducir('fanfarria');
    Sonido.decir(`Desde las profundidades del más allá... ¡con ustedes: ${nombreDe(id)}!`);
  }

  async function abrirMicro() {
    if (micro) return micro;
    const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
    const AC = window.AudioContext || window.webkitAudioContext;
    const ctx = new AC();
    const fuente = ctx.createMediaStreamSource(stream);
    const analizador = ctx.createAnalyser();
    analizador.fftSize = 1024;
    fuente.connect(analizador);
    micro = { ctx, analizador, stream };
    return micro;
  }
  function cerrarMicro() {
    if (!micro) return;
    micro.stream.getTracks().forEach(t => t.stop());
    micro.ctx.close();
    micro = null;
  }

  function categoria() {
    const nombreCat = CATEGORIAS_DISFRAZ[S.listaCats[S.catActual]];
    const votos = new Map(S.ids.map(id => [id, 0]));
    let midiendo = false;
    const pintar = () => {
      pantalla(`
        ${barra(`🗳️ ${nombreCat}`)}
        <div class="contenido" style="justify-content:flex-start;gap:1.2vh">
          <h2>${nombreCat}</h2>
          <p class="centro tenue" style="margin:0">${S.metodo === 'aplausos' ? 'Toca 👏 junto a cada persona y que el público aplauda y grite durante 4 segundos.' : 'Cuenta las manos levantadas para cada persona.'}</p>
          <div class="marcador ${S.ids.length > 6 ? 'dos' : ''}">
            ${S.ids.map(id => `
              <div class="marcador-fila" style="grid-template-columns:${S.metodo === 'aplausos' ? '1fr 1.2fr auto' : '1fr auto auto'}">
                <span>${fichaDe(id)}</span>
                ${S.metodo === 'aplausos'
          ? `<div class="medidor"><div id="m${id}" style="width:${votos.get(id)}%"></div></div>
                     <button class="btn chico" data-a="medir" data-id="${id}">👏 ${votos.get(id) || 'Medir'}</button>`
          : `<span class="pts centro">${votos.get(id)}</span>
                     <span class="fila" style="gap:.3em;flex-wrap:nowrap"><button class="btn secundario chico" data-a="menos" data-id="${id}">−</button><button class="btn secundario chico" data-a="mas" data-id="${id}">+</button></span>`}
              </div>`).join('')}
          </div>
          <div class="fila">
            ${S.metodo === 'aplausos' ? '<button class="btn secundario chico" data-a="manual">✋ Cambiar a mano alzada</button>' : ''}
            <button class="btn grande" data-a="ganador">🏆 ¡Ver ganador!</button>
          </div>
        </div>`, {
        salir: () => { cerrarMicro(); confirmarSalida(); },
        mas: d => { votos.set(+d.id, votos.get(+d.id) + 1); pintar(); },
        menos: d => { votos.set(+d.id, Math.max(0, votos.get(+d.id) - 1)); pintar(); },
        manual: () => { S.metodo = 'manos'; votos.forEach((_, k) => votos.set(k, 0)); pintar(); },
        medir: async d => {
          if (midiendo) return;
          const id = +d.id;
          try { await abrirMicro(); }
          catch (e) { alert('No se pudo usar el micrófono 🎤. Cambiamos a mano alzada.'); S.metodo = 'manos'; return pintar(); }
          midiendo = true;
          Sonido.callar();
          const barraEl = document.getElementById('m' + id);
          const datos = new Float32Array(micro.analizador.fftSize);
          const muestras = [];
          const t0 = performance.now();
          await new Promise(res => {
            const leer = () => {
              micro.analizador.getFloatTimeDomainData(datos);
              let suma = 0; for (const v of datos) suma += v * v;
              const rms = Math.sqrt(suma / datos.length);
              const nivel = Math.min(100, Math.round(rms * 400));
              muestras.push(nivel);
              if (barraEl) barraEl.style.width = nivel + '%';
              if (performance.now() - t0 < 4000) requestAnimationFrame(leer); else res();
            };
            leer();
          });
          // Puntaje: promedio del 30% más alto
          muestras.sort((a, b) => b - a);
          const top = muestras.slice(0, Math.max(1, Math.floor(muestras.length * 0.3)));
          votos.set(id, Math.round(top.reduce((a, b) => a + b, 0) / top.length));
          midiendo = false;
          pintar();
        },
        ganador: () => ganador(nombreCat, votos)
      });
    };
    pintar();
    Sonido.decir(`Categoría: ${nombreCat.replace(/\p{Extended_Pictographic}/gu, '')}.`);
  }

  async function ganador(nombreCat, votos) {
    const max = Math.max(...votos.values());
    const ganadores = [...votos.entries()].filter(([, v]) => v === max && v > 0).map(([id]) => id);
    pantalla(`${barra(`🏆 ${nombreCat}`)}<div class="contenido"><h2>${nombreCat}</h2><div id="g" class="narracion">🥁 Y el ganador es…</div></div>`, { salir: confirmarSalida });
    Sonido.reproducir('redoble', 2.5);
    await Sonido.decir('Y el ganador es...');
    await new Promise(r => setTimeout(r, 1500));
    if (!document.getElementById('g')) return;
    sumarPuntos(ganadores, 3);
    const ultima = S.catActual + 1 >= S.listaCats.length;
    pantalla(`
      ${barra(`🏆 ${nombreCat}`)}
      <div class="contenido">
        <h2>${nombreCat}</h2>
        <div class="palabra-gigante aparecer">${ganadores.length ? ganadores.map(fichaDe).join('<br>') : 'Nadie 😶'}</div>
        ${ganadores.length ? '<p class="centro tenue">+3 puntos</p>' : ''}
        <div class="fila"><button class="btn grande" data-a="sig">${ultima ? '🏆 Terminar' : 'Siguiente categoría ▶'}</button></div>
      </div>`, {
      salir: () => { cerrarMicro(); inicio(); },
      sig: () => { if (ultima) { cerrarMicro(); pantallaMarcador(); } else { S.catActual++; categoria(); } }
    });
    Sonido.reproducir('fanfarria'); lluvia(['🏆', '🧛', '🎃', '✨']);
    if (ganadores.length) Sonido.decir(`¡${ganadores.map(nombreDe).join(' y ')}!`);
  }

  return { config };
})();

/* ---------------- Arranque ---------------- */
function bienvenida() {
  pantalla(`
    <div class="contenido" style="align-items:center">
      <h1 style="font-size:clamp(3rem,13vmin,9rem)">🎃 Noche de<br>Halloween</h1>
      <p class="tenue centro">Gira tu iPhone horizontal y duplica la pantalla en la TV 📺</p>
      <button class="btn grande" data-a="entrar">🕯️ Entrar… si te atreves</button>
    </div>`, {
    entrar: async () => {
      Sonido.activar();
      mantenerEncendida();
      Sonido.reproducir('trueno');
      destello();
      inicio();
      await Sonido.decir('Bienvenidos... a la noche más tenebrosa del año. Muajajajá.');
    }
  });
}
bienvenida();
