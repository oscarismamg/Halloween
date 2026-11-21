/* =========================================================
   NOCHE DE POSADA — Pantalla de la TV (estilo Jackbox)
   ========================================================= */

const CLAVE = 'noche-posada-v1';
const app = document.getElementById('app');

/* ---------------- Estado guardado ---------------- */
function nuevoCodigo() {
  const letras = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  let c = '';
  for (let i = 0; i < 4; i++) c += letras[Math.floor(Math.random() * letras.length)];
  return c;
}
function estadoInicial() {
  return { sala: nuevoCodigo(), jugadores: {}, orden: [], usadasPosaderos: [], usadasChuscas: [], ajustes: { efectos: true, voz: true } };
}
let P = (() => {
  try { return Object.assign(estadoInicial(), JSON.parse(localStorage.getItem(CLAVE)) || {}); }
  catch { return estadoInicial(); }
})();
function guardar() { localStorage.setItem(CLAVE, JSON.stringify(P)); }
Object.assign(Sonido.config, P.ajustes, { ambiente: false });

const J = uid => P.jugadores[uid];
const nombre = uid => (J(uid) ? J(uid).nombre : '?');
const ficha = uid => (J(uid) ? `${J(uid).emoji} ${escaparHTML(J(uid).nombre)}` : '?');
const enLinea = uid => RedTV.conectado(uid);
const conectados = () => P.orden.filter(enLinea);
function sumarPuntos(uids, n) { uids.forEach(u => { if (J(u)) J(u).puntos = Math.max(0, (J(u).puntos || 0) + n); }); guardar(); }
const sinEmojis = s => String(s).replace(/\p{Extended_Pictographic}/gu, '').replace(/_{2,}/g, ' blanco ');

/* ---------------- Motor de pantallas ---------------- */
let acciones = {}, limpiezas = [], pantallaActual = '';
function alSalir(fn) { limpiezas.push(fn); }
function pantalla(nombrePantalla, html, acc = {}) {
  limpiezas.forEach(f => { try { f(); } catch (e) { } });
  limpiezas = [];
  pantallaActual = nombrePantalla;
  acciones = acc;
  app.innerHTML = html;
}
document.addEventListener('click', ev => {
  const el = ev.target.closest('[data-a]');
  if (!el) return;
  const fn = acciones[el.dataset.a];
  if (fn) { ev.preventDefault(); fn(el.dataset, el); }
});
document.addEventListener('pointerdown', () => { Sonido.activar(); mantenerEncendida(); }, { passive: true });

let candado = null;
async function mantenerEncendida() {
  try { if ('wakeLock' in navigator && !candado) { candado = await navigator.wakeLock.request('screen'); candado.addEventListener('release', () => { candado = null; }); } } catch (e) { }
}
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') mantenerEncendida(); });

function barra(titulo, conSalir = true) {
  return `<div class="barra-superior">
    <div class="titulo-juego">${titulo}</div>
    <div class="fila" style="gap:.6em">
      <span class="etiqueta">Sala <b>${P.sala}</b> · ${conectados().length} 📱</span>
      ${conSalir ? '<button class="btn secundario chico" data-a="salir">✕ Salir</button>' : ''}
    </div>
  </div>`;
}
function confirmarSalida() { if (confirm('¿Terminar este juego y volver al menú?')) { Juego.terminar(); menu(); } }

function destello() { const d = document.createElement('div'); d.className = 'destello'; document.body.appendChild(d); setTimeout(() => d.remove(), 800); }
function lluvia(emojis = ['🎁', '⭐', '❄️', '🎄', '🍬'], n = 45) {
  const c = document.createElement('div'); c.className = 'lluvia';
  for (let i = 0; i < n; i++) {
    const s = document.createElement('span'); s.textContent = elegir(emojis);
    s.style.left = Math.random() * 100 + 'vw'; s.style.animationDuration = 2.5 + Math.random() * 3 + 's'; s.style.animationDelay = Math.random() * 2 + 's';
    c.appendChild(s);
  }
  document.body.appendChild(c); setTimeout(() => c.remove(), 8000);
}
function temblar() { app.classList.remove('temblar'); void app.offsetWidth; app.classList.add('temblar'); }

function iniciarReloj(segundos, onFin) {
  let restante = segundos, total = segundos, pausado = false;
  const pintar = () => {
    const r = document.getElementById('reloj'), b = document.getElementById('barraTiempo');
    if (r) { r.textContent = restante >= 60 ? `${Math.floor(restante / 60)}:${String(restante % 60).padStart(2, '0')}` : restante; r.classList.toggle('urgente', restante <= 10); }
    if (b) b.style.width = (restante / total * 100) + '%';
  };
  pintar();
  const id = setInterval(() => {
    if (pausado) return;
    restante--;
    if (restante <= 5 && restante > 0) Sonido.reproducir(restante % 2 ? 'tic' : 'tac');
    pintar();
    if (restante <= 0) { clearInterval(id); Sonido.reproducir('alarma'); onFin && onFin(); }
  }, 1000);
  alSalir(() => clearInterval(id));
  return { detener() { clearInterval(id); }, agregar(s) { restante += s; total = Math.max(total, restante); pintar(); }, pausar() { pausado = !pausado; } };
}
const pausa = ms => new Promise(r => setTimeout(r, ms));

/* =========================================================
   VISTAS DE LOS CELULARES
   ========================================================= */
const vistas = new Map();
let seq = 0;
function ponerVista(uid, v) {
  v.seq = ++seq;
  vistas.set(uid, v);
  RedTV.enviar(uid, { t: 'vista', v, yo: J(uid) ? { nombre: J(uid).nombre, emoji: J(uid).emoji, puntos: J(uid).puntos || 0 } : null });
}
function vistaEspera(uid, titulo, texto = 'Mira la TV 📺', emoji = '🎄', extra = {}) {
  ponerVista(uid, Object.assign({ tipo: 'espera', titulo, texto, emoji }, extra));
}
function vistaLobby(uid) { vistaEspera(uid, '¡Ya estás dentro!', 'Espera a que empiece el juego. Mira la TV 📺', J(uid) ? J(uid).emoji : '🎄'); }

/* Interfaz común para los juegos */
const Juego = {
  actual: null,
  iniciar(j) { this.actual = j; },
  terminar() { this.actual = null; conectados().forEach(vistaLobby); },
  llego(uid) { if (this.actual && this.actual.llego) this.actual.llego(uid); else vistaLobby(uid); },
  mensaje(uid, d) { if (this.actual && this.actual.mensaje) this.actual.mensaje(uid, d); },
  salio(uid) { if (this.actual && this.actual.salio) this.actual.salio(uid); }
};

/* =========================================================
   RED
   ========================================================= */
let estadoRed = 'conectando';
function iniciarRed() {
  RedTV.crearSala(P.sala, {
    estado: e => {
      estadoRed = e;
      const el = document.getElementById('estadoRed');
      if (el) el.innerHTML = textoEstadoRed();
    },
    codigoOcupado: () => { P.sala = nuevoCodigo(); guardar(); location.reload(); },
    llego: (uid, nom) => {
      let j = J(uid);
      if (!j) {
        nom = (nom || 'Invitado').trim() || 'Invitado';
        // Evitar nombres repetidos
        let base = nom, k = 2;
        while (Object.values(P.jugadores).some(x => x.nombre.toLowerCase() === nom.toLowerCase())) nom = `${base} ${k++}`;
        const usados = new Set(Object.values(P.jugadores).map(x => x.emoji));
        j = { uid, nombre: nom, emoji: EMOJIS_POSADA.find(e => !usados.has(e)) || elegir(EMOJIS_POSADA), puntos: 0 };
        P.jugadores[uid] = j; P.orden.push(uid); guardar();
        Sonido.reproducir('cascabeles', 0.6);
      } else if (!P.orden.includes(uid)) { P.orden.push(uid); guardar(); }
      Juego.llego(uid);
      refrescarListas();
    },
    salio: uid => { Juego.salio(uid); refrescarListas(); },
    mensaje: (uid, d) => {
      if (d.t === 'renombrar' && d.nombre) {
        const n = String(d.nombre).trim().slice(0, 14);
        if (n && !Object.values(P.jugadores).some(x => x.uid !== uid && x.nombre.toLowerCase() === n.toLowerCase())) { J(uid).nombre = n; guardar(); refrescarListas(); }
        const v = vistas.get(uid); if (v) ponerVista(uid, v);
        return;
      }
      Juego.mensaje(uid, d);
    }
  });
}
function textoEstadoRed() {
  return ({
    lista: '🟢 Sala abierta', conectando: '🟡 Abriendo la sala…', reconectando: '🟡 Reconectando…',
    reclamando: '🟡 Recuperando la sala…', 'sin-red': '🔴 Sin internet. Reintentando…'
  })[estadoRed] || estadoRed;
}
function enlaceControl() {
  return new URL(`control.html?sala=${P.sala}${paramServidor()}`, location.href).toString();
}
// Refresca la lista de jugadores visible sin redibujar toda la pantalla
function refrescarListas() {
  document.querySelectorAll('[data-lista-jugadores]').forEach(el => { el.innerHTML = htmlJugadores(el.dataset.listaJugadores === 'expulsar'); });
  document.querySelectorAll('[data-contador]').forEach(el => { el.textContent = conectados().length; });
  if (Juego.actual && Juego.actual.refrescar) Juego.actual.refrescar();
}
function htmlJugadores(conExpulsar) {
  if (!P.orden.length) return '<p class="tenue centro">Nadie se ha unido todavía… 🦗</p>';
  return `<div class="fichas">${P.orden.map(uid => `
    <span class="ficha ${enLinea(uid) ? 'activa' : 'apagada'}" ${conExpulsar ? `data-a="expulsar" data-uid="${uid}"` : ''}>${ficha(uid)}</span>`).join('')}</div>`;
}

/* =========================================================
   MENÚ / SALA
   ========================================================= */
const JUEGOS = [
  { id: 'posaderos', icono: '🎯', nombre: '100 Posaderos Dijeron', desc: 'Dos equipos, un tablero y ¡Basta!' },
  { id: 'chuscas', icono: '😂', nombre: 'Respuestas Chuscas', desc: 'Lo más chistoso gana votos' }
];
const REGISTRO = {}; // id -> objeto con config(); se llena al final de cada juego

function menu() {
  Juego.terminar();
  pantalla('menu', `
    <div class="contenido" style="gap:2vh">
      <h1 style="margin:0">🎄 Noche de Posada 🎄</h1>
      <div class="dos-columnas" style="align-items:start">
        <div class="centro">
          <div class="qr-caja" style="width:min(34vmin,70vw)" data-enlace="${escaparHTML(enlaceControl())}">${generarQR(enlaceControl())}</div>
          <div class="codigo-sala">${P.sala}</div>
          <p class="tenue" style="margin:0" id="estadoRed">${textoEstadoRed()}</p>
        </div>
        <div style="display:flex;flex-direction:column;gap:1.6vh">
          <p style="margin:0">📱 <b>Escanea el QR</b> con tu celular para unirte. Tu celular será tu control.</p>
          <div class="tarjeta" style="max-height:30vh;overflow:auto">
            <h3 style="margin-top:0">Jugadores (<span data-contador>${conectados().length}</span> conectados)</h3>
            <div data-lista-jugadores="expulsar">${htmlJugadores(true)}</div>
          </div>
          <div class="menu-juegos">
            ${JUEGOS.map(j => `
              <button class="juego-boton" data-a="juego" data-id="${j.id}">
                <span class="icono">${j.icono}</span>
                <span><div class="nombre">${j.nombre}</div><div class="desc">${j.desc}</div></span>
              </button>`).join('')}
          </div>
        </div>
      </div>
      <div class="fila">
        <button class="btn secundario" data-a="marcador">🏆 Marcador</button>
        <button class="btn secundario" data-a="ajustes">⚙️ Ajustes</button>
      </div>
    </div>`, {
    juego: d => { Sonido.reproducir('cascabeles'); REGISTRO[d.id].config(); },
    marcador: pantallaMarcador,
    ajustes: pantallaAjustes,
    expulsar: d => { if (confirm(`¿Sacar a ${nombre(d.uid)} de la sala? (pierde sus puntos)`)) { RedTV.expulsar(d.uid); delete P.jugadores[d.uid]; P.orden = P.orden.filter(u => u !== d.uid); guardar(); refrescarListas(); } }
  });
}

/* ---------------- Marcador y coronación ---------------- */
function ranking() { return P.orden.map(J).filter(Boolean).sort((a, b) => (b.puntos || 0) - (a.puntos || 0)); }
function pantallaMarcador() {
  const r = ranking(), med = ['🥇', '🥈', '🥉'];
  pantalla('marcador', `
    ${barra('🏆 Marcador de la Posada', false)}
    <div class="contenido" style="justify-content:flex-start">
      <div class="marcador ${r.length > 7 ? 'dos' : ''}">
        ${r.map((j, i) => `<div class="marcador-fila"><span class="pos">${med[i] || i + 1}</span><span>${j.emoji} ${escaparHTML(j.nombre)}</span><span class="pts">${j.puntos || 0}</span>
          <span class="fila" style="gap:.3em;flex-wrap:nowrap"><button class="btn secundario chico" data-a="menos" data-uid="${j.uid}">−</button><button class="btn secundario chico" data-a="mas" data-uid="${j.uid}">+</button></span></div>`).join('') || '<p class="tenue centro">Sin jugadores todavía</p>'}
      </div>
      <div class="fila">
        <button class="btn secundario" data-a="volver">◀ Menú</button>
        <button class="btn secundario" data-a="reiniciar">🔄 Poner en cero</button>
        <button class="btn grande" data-a="coronar">👑 Coronación</button>
      </div>
    </div>`, {
    volver: menu,
    mas: d => { sumarPuntos([d.uid], 1); pantallaMarcador(); },
    menos: d => { sumarPuntos([d.uid], -1); pantallaMarcador(); },
    reiniciar: () => { if (confirm('¿Poner todos los puntos en cero?')) { Object.values(P.jugadores).forEach(j => j.puntos = 0); guardar(); pantallaMarcador(); } },
    coronar: coronacion
  });
}
async function coronacion() {
  const r = ranking().filter(j => (j.puntos || 0) > 0);
  if (!r.length) { alert('Nadie tiene puntos todavía 🎄'); return; }
  let cancelado = false;
  pantalla('corona', `<div class="contenido"><h1>👑 La Coronación 👑</h1><div id="escena" class="narracion"></div><div class="fila"><button class="btn secundario" data-a="volver">◀ Volver</button></div></div>`, { volver: pantallaMarcador });
  alSalir(() => { cancelado = true; });
  const esc = document.getElementById('escena');
  esc.textContent = 'Esta noche, entre ponche, tamales y piñatas…';
  await Sonido.decir('Esta noche, entre ponche, tamales y piñatas, solo uno será coronado como el rey de la posada.');
  const puestos = r.slice(0, 3).reverse();
  const et = { 3: '🥉 Tercer lugar', 2: '🥈 Segundo lugar', 1: '👑 ¡EL REY DE LA POSADA!' };
  for (let i = 0; i < puestos.length; i++) {
    if (cancelado) return;
    const lugar = puestos.length - i, j = puestos[i];
    esc.innerHTML = `<div>${et[lugar]}</div><div class="tenue">🥁 …</div>`;
    Sonido.reproducir('redoble', 2.5); await pausa(2700); if (cancelado) return;
    esc.innerHTML = `<div>${et[lugar]}</div><div class="palabra-gigante aparecer">${j.emoji} ${escaparHTML(j.nombre)}</div><div class="tenue">${j.puntos} puntos</div>`;
    if (lugar === 1) { Sonido.reproducir('navidad'); lluvia(['👑', '🎄', '⭐', '🎁', '✨'], 70); destello(); }
    await Sonido.decir(lugar === 1 ? `¡Y el rey de la posada es... ${j.nombre}! ¡Felicidades!` : `En ${lugar === 3 ? 'tercer' : 'segundo'} lugar: ${j.nombre}.`);
    await pausa(1500);
  }
}

/* ---------------- Ajustes ---------------- */
function pantallaAjustes() {
  const fila = (k, t) => `<label class="ajuste">${t}<span class="interruptor"><input type="checkbox" data-k="${k}" ${P.ajustes[k] ? 'checked' : ''}><span></span></span></label>`;
  pantalla('ajustes', `
    ${barra('⚙️ Ajustes', false)}
    <div class="contenido">
      <div class="tarjeta" style="max-width:760px;width:100%;margin:0 auto">
        ${fila('voz', '🗣️ Voz del presentador')}
        ${fila('efectos', '🔊 Efectos de sonido')}
        <p class="tenue">¿No se oye en la TV? Quita el modo silencio del iPhone, sube el volumen y toca "Probar sonido".</p>
      </div>
      <div class="fila">
        <button class="btn secundario" data-a="probar">🔊 Probar sonido</button>
        <button class="btn secundario" data-a="sala">🔁 Nueva sala (nuevo código)</button>
        <button class="btn secundario" data-a="borrar">🗑️ Borrar jugadores y puntos</button>
        <button class="btn" data-a="volver">◀ Menú</button>
      </div>
    </div>`, {
    volver: menu,
    probar: () => { Sonido.reproducir('navidad'); Sonido.decir('¡Bienvenidos a la posada! Pásele, pásele.'); },
    sala: () => { if (confirm('¿Crear una sala nueva? Todos tendrán que volver a escanear el QR.')) { P.sala = nuevoCodigo(); guardar(); location.reload(); } },
    borrar: () => { if (confirm('¿Borrar jugadores y puntos?')) { const sala = P.sala; P = estadoInicial(); P.sala = sala; guardar(); location.reload(); } }
  });
  app.querySelectorAll('input[data-k]').forEach(i => i.addEventListener('change', () => { P.ajustes[i.dataset.k] = i.checked; Object.assign(Sonido.config, P.ajustes); guardar(); }));
}

/* ---------------- Selección de participantes ---------------- */
function htmlSeleccion(sel) {
  const lista = conectados();
  if (!lista.length) return '<p class="tenue centro">Nadie conectado. Escaneen el QR del menú 📱</p>';
  return `<div class="fichas">${lista.map(uid => `<button class="ficha ${sel.has(uid) ? 'activa' : 'apagada'}" data-a="alternar" data-uid="${uid}">${ficha(uid)}</button>`).join('')}</div>
  <p class="tenue centro" style="margin:.4em 0 0">Juegan <b>${[...sel].filter(enLinea).length}</b> · toca un nombre para sacarlo (quien no quiera jugar, no pasa nada 😉)</p>`;
}

function pantallaReglas(titulo, reglas, voz, onSeguir) {
  pantalla('reglas', `
    ${barra(titulo)}
    <div class="contenido">
      <h2>📜 Cómo se juega</h2>
      <div class="tarjeta" style="max-width:1100px;margin:0 auto">
        <ol style="font-size:clamp(1rem,3vmin,1.8rem);line-height:1.45;margin:0;padding-left:1.3em">${reglas.map(r => `<li>${r}</li>`).join('')}</ol>
      </div>
      <div class="fila"><button class="btn secundario" data-a="leer">🔊 Leer en voz alta</button><button class="btn grande" data-a="seguir">¡Vámonos! ▶</button></div>
    </div>`, { salir: confirmarSalida, leer: () => Sonido.decir(voz), seguir: onSeguir });
  Sonido.decir(voz);
}

/* =========================================================
   🎯 100 POSADEROS DIJERON
   ========================================================= */
const Posaderos = (() => {
  let F = null, cfg = null;
  const NOMBRES_EQ = [{ nombre: 'Los Tamales', emoji: '🫔' }, { nombre: 'Los Champurrados', emoji: '☕' }];

  function config() {
    if (!cfg) cfg = { sel: new Set(conectados()), conductor: null, rondas: 4 };
    pintarConfig();
  }
  function pintarConfig() {
    conectados().forEach(u => { if (!cfg.vistos || !cfg.vistos.has(u)) cfg.sel.add(u); });
    cfg.vistos = new Set(conectados());
    if (cfg.conductor && !enLinea(cfg.conductor)) cfg.conductor = null;
    Juego.iniciar({ refrescar: () => { if (pantallaActual === 'pos-config') pintarConfig(); }, llego: vistaLobby });
    const lista = conectados();
    pantalla('pos-config', `
      ${barra('🎯 100 Posaderos Dijeron')}
      <div class="contenido" style="justify-content:flex-start">
        <h3>🎤 ¿Quién conduce? <span class="tenue" style="font-weight:600">(ve las respuestas en su celular y controla el tablero, no juega)</span></h3>
        <div class="fichas">${lista.map(u => `<button class="ficha ${cfg.conductor === u ? 'elegida' : ''}" data-a="conductor" data-uid="${u}">${cfg.conductor === u ? '🎤 ' : ''}${ficha(u)}</button>`).join('') || '<p class="tenue">Nadie conectado</p>'}</div>
        <h3>🙋 ¿Quién juega?</h3>
        ${htmlSeleccion(cfg.sel)}
        <div class="tarjeta"><div class="ajuste">Rondas
          <span class="contador"><button class="btn secundario chico" data-a="rMenos">−</button><b>${cfg.rondas}</b><button class="btn secundario chico" data-a="rMas">+</button></span></div>
          <p class="tenue" style="margin:.3em 0 0">Las últimas rondas valen doble y triple 💰</p>
        </div>
        <div class="fila"><button class="btn grande" data-a="seguir" ${!cfg.conductor || jugadoresSel().length < 2 ? 'disabled' : ''}>Armar equipos ▶</button></div>
        ${!cfg.conductor ? '<p class="centro tenue">Elige a alguien para conducir 🎤</p>' : ''}
      </div>`, {
      salir: confirmarSalida,
      conductor: d => { cfg.conductor = d.uid; cfg.sel.delete(d.uid); pintarConfig(); },
      alternar: d => { cfg.sel.has(d.uid) ? cfg.sel.delete(d.uid) : cfg.sel.add(d.uid); if (d.uid === cfg.conductor) cfg.conductor = null; pintarConfig(); },
      rMenos: () => { cfg.rondas = Math.max(2, cfg.rondas - 1); pintarConfig(); },
      rMas: () => { cfg.rondas = Math.min(8, cfg.rondas + 1); pintarConfig(); },
      seguir: () => armar()
    });
  }
  function jugadoresSel() { return [...cfg.sel].filter(u => enLinea(u) && u !== cfg.conductor); }

  function armar(revolver = true) {
    const ids = barajar(jugadoresSel());
    if (revolver || !F) {
      F = { conductor: cfg.conductor, equipos: NOMBRES_EQ.map(e => ({ ...e, miembros: [], pts: 0, turno: 0 })), rondas: cfg.rondas, ronda: 0, R: null };
      ids.forEach((u, i) => F.equipos[i % 2].miembros.push(u));
    }
    Juego.iniciar({ llego: llegoPos, mensaje: mensajePos, refrescar: () => { } });
    pantalla('pos-equipos', `
      ${barra('🎯 Equipos')}
      <div class="contenido">
        ${htmlEquipos()}
        <p class="centro">🎤 Conduce: <b>${ficha(F.conductor)}</b></p>
        <div class="fila"><button class="btn secundario" data-a="revolver">🔀 Revolver</button><button class="btn grande" data-a="reglas">Siguiente ▶</button></div>
      </div>`, { salir: confirmarSalida, revolver: () => armar(true), reglas });
    actualizarVistas();
  }

  function htmlEquipos(conPuntos = false, resaltar = -1) {
    return `<div class="equipos">${F.equipos.map((e, i) => `
      <div class="equipo ${i === resaltar ? 'turno' : ''}">
        <h3 class="centro">${e.emoji} ${e.nombre}</h3>
        ${conPuntos ? `<div class="pts-equipo">${e.pts}</div>` : ''}
        <div class="fichas">${e.miembros.map(u => `<span class="ficha ${enLinea(u) ? '' : 'apagada'}">${ficha(u)}</span>`).join('')}</div>
      </div>`).join('')}</div>`;
  }

  function reglas() {
    pantallaReglas('🎯 100 Posaderos Dijeron', [
      'Encuestamos a 100 posaderos 🎄. Hay que adivinar <b>las respuestas más populares</b>.',
      '<b>Cara a cara:</b> un jugador de cada equipo. El primero en apretar <b>¡BASTA!</b> en su celular contesta en voz alta.',
      'El equipo que gana el cara a cara tiene el <b>control</b>: cada integrante, por turnos, dice una respuesta.',
      'Con <b>3 taches ❌</b> pierden el control y el otro equipo puede <b>robarse</b> todos los puntos con una sola respuesta.',
      'El 🎤 <b>conductor</b> ve las respuestas en su celular y las va destapando. ¡Gana el equipo con más puntos!'
    ], 'Cien posaderos dijeron. Encuestamos a cien posaderos y hay que adivinar las respuestas más populares. En el cara a cara, el primero en apretar basta en su celular contesta. Con tres taches, el otro equipo se puede robar los puntos.', () => nuevaRonda());
  }

  function multiplicador(r) {
    if (F.rondas >= 3 && r === F.rondas - 1) return 3;
    if (F.rondas >= 3 && r === F.rondas - 2) return 2;
    return 1;
  }
  function elegirPregunta() {
    let disp = PREGUNTAS_POSADEROS.map((_, i) => i).filter(i => !P.usadasPosaderos.includes(i));
    if (!disp.length) { P.usadasPosaderos = []; disp = PREGUNTAS_POSADEROS.map((_, i) => i); }
    const i = elegir(disp);
    P.usadasPosaderos.push(i); guardar();
    return PREGUNTAS_POSADEROS[i];
  }

  function nuevaRonda() {
    const q = elegirPregunta();
    const cara = F.equipos.map(e => e.miembros.length ? e.miembros[F.ronda % e.miembros.length] : null);
    F.R = { q, rev: new Set(), taches: 0, fase: 'intro', control: null, banco: 0, mult: multiplicador(F.ronda), cara, basta: null, ganador: null, ultimoRev: -1, robo: false };
    pintar();
    Sonido.reproducir('navidad');
    Sonido.decir(`Ronda ${F.ronda + 1}${F.R.mult > 1 ? `. ¡Puntos ${F.R.mult === 2 ? 'dobles' : 'triples'}!` : ''}. Cara a cara: ${cara.filter(Boolean).map(nombre).join(' contra ')}.`);
  }

  function turnoActual() {
    const e = F.equipos[F.R.control];
    return e && e.miembros.length ? e.miembros[e.turno % e.miembros.length] : null;
  }
  function avanzarTurno() { const e = F.equipos[F.R.control]; if (e) e.turno++; }

  /* ---------- Dibujo del tablero ---------- */
  function pintar() {
    const R = F.R, total = R.q.a.length;
    const mitad = Math.ceil(total / 2);
    const celda = i => {
      const [t, p] = R.q.a[i];
      const visible = R.rev.has(i);
      return `<div class="casilla ${visible ? 'destapada' : ''} ${i === R.ultimoRev ? 'aparecer' : ''}">
        ${visible ? `<span class="texto-casilla">${escaparHTML(t)}</span><span class="puntos-casilla">${p}</span>` : `<span class="numero-casilla">${i + 1}</span>`}
      </div>`;
    };
    const titFase = {
      intro: `Cara a cara: ${R.cara.filter(Boolean).map(ficha).join(' 🆚 ')}`,
      cara: R.basta ? `🔔 ¡${ficha(R.basta)} apretó primero! Contesta…` : `Cara a cara: ${R.cara.filter(Boolean).map(ficha).join(' 🆚 ')} · ¡aprieten BASTA!`,
      control: `${F.equipos[R.control]?.emoji} ${F.equipos[R.control]?.nombre} tienen el control · Turno de <b>${turnoActual() ? ficha(turnoActual()) : '—'}</b>`,
      robo: `🦹 ¡${F.equipos[1 - R.control].emoji} ${F.equipos[1 - R.control].nombre} pueden ROBAR! Pónganse de acuerdo…`,
      fin: R.ganador != null ? `🏆 La ronda es para ${F.equipos[R.ganador].emoji} ${F.equipos[R.ganador].nombre} (+${R.banco * R.mult})` : ''
    }[R.fase];
    pantalla('pos-tablero', `
      ${barra(`🎯 Ronda ${F.ronda + 1} de ${F.rondas}${R.mult > 1 ? ` · <span style="color:var(--naranja2)">x${R.mult}</span>` : ''}`)}
      <div class="contenido" style="gap:1.4vh;justify-content:flex-start">
        <div class="fila entre" style="flex-wrap:nowrap">
          <div class="marcador-equipo ${R.control === 0 ? 'turno' : ''}">${F.equipos[0].emoji}<div class="pts-equipo">${F.equipos[0].pts}</div></div>
          <div class="centro" style="flex:1">
            <div class="tenue" style="font-size:clamp(.9rem,2.2vmin,1.3rem)">${R.fase === 'intro' ? 'Encuestamos a 100 posaderos…' : 'Encuestamos a 100 posaderos:'}</div>
            <div class="pregunta-tablero">${R.fase === 'intro' ? '🤫 ¿Listos?' : escaparHTML(R.q.p)}</div>
          </div>
          <div class="marcador-equipo ${R.control === 1 ? 'turno' : ''}">${F.equipos[1].emoji}<div class="pts-equipo">${F.equipos[1].pts}</div></div>
        </div>
        <div class="tablero">
          <div class="columna-tablero">${Array.from({ length: mitad }, (_, i) => celda(i)).join('')}</div>
          <div class="columna-tablero">${Array.from({ length: total - mitad }, (_, i) => celda(i + mitad)).join('')}</div>
        </div>
        <div class="fila entre" style="flex-wrap:nowrap">
          <div class="taches">${[0, 1, 2].map(i => `<span class="${i < R.taches ? 'on' : ''}">❌</span>`).join('')}</div>
          <div class="narracion" style="font-size:clamp(1rem,3vmin,2rem);flex:1">${titFase}</div>
          <div class="banco">💰 ${R.banco}${R.mult > 1 ? ` <small>x${R.mult}</small>` : ''}</div>
        </div>
        <div class="fila" style="opacity:.7"><span class="tenue">🎤 ${ficha(F.conductor)} controla desde su celular</span>
          <button class="btn secundario chico" data-a="manual">🛟 Control desde aquí</button></div>
      </div>`, { salir: confirmarSalida, manual: controlManual });
    actualizarVistas();
  }

  function bigX() {
    const x = document.createElement('div');
    x.className = 'gran-tache'; x.textContent = '❌';
    document.body.appendChild(x);
    setTimeout(() => x.remove(), 1200);
    Sonido.reproducir('tache');
    temblar();
  }

  /* ---------- Comandos (del conductor o del control manual) ---------- */
  function comando(c, arg) {
    const R = F.R;
    if (!R) return;
    if (c === 'leer' && R.fase === 'intro') {
      R.fase = 'cara'; R.basta = null; pintar();
      Sonido.decir(`Encuestamos a cien posaderos: ${R.q.p}. ¡Basta!`, { tono: 0.95, velocidad: 1 });
      return;
    }
    if (c === 'otraBasta' && R.fase === 'cara') { R.basta = null; pintar(); return; }
    if (c === 'controla' && (R.fase === 'cara' || R.fase === 'intro')) {
      R.control = +arg; R.fase = 'control'; pintar();
      Sonido.decir(`¡${F.equipos[R.control].nombre} tienen el control! Le toca a ${nombre(turnoActual())}.`);
      return;
    }
    if (c === 'revelar') {
      const i = +arg;
      if (R.rev.has(i) || i < 0 || i >= R.q.a.length) return;
      R.rev.add(i); R.ultimoRev = i;
      Sonido.reproducir('ding');
      if (R.fase === 'cara' || R.fase === 'control') R.banco += R.q.a[i][1];
      if (R.fase === 'control') {
        avanzarTurno();
        if (R.rev.size === R.q.a.length) return finRonda(R.control, false);
      } else if (R.fase === 'robo') {
        R.banco += R.q.a[i][1];
        return finRonda(1 - R.control, true);
      }
      pintar();
      if (R.fase !== 'fin') Sonido.decir(`${R.q.a[i][0]}. ${R.q.a[i][1]} puntos.`, { tono: 0.95, velocidad: 1.05 });
      return;
    }
    if (c === 'tache') {
      if (R.fase === 'control') {
        R.taches++; avanzarTurno();
        bigX();
        if (R.taches >= 3) { R.fase = 'robo'; setTimeout(() => { pintar(); Sonido.decir(`¡Tres taches! ${F.equipos[1 - R.control].nombre}, pónganse de acuerdo. Tienen una oportunidad para robar.`); }, 900); }
        else setTimeout(pintar, 900);
      } else if (R.fase === 'robo') { bigX(); setTimeout(() => finRonda(R.control, false), 900); }
      else if (R.fase === 'cara') bigX();
      return;
    }
    if (c === 'saltar' && R.fase === 'control') { avanzarTurno(); pintar(); return; }
    if (c === 'siguiente' && R.fase === 'fin') {
      F.ronda++;
      if (F.ronda >= F.rondas) return final();
      return nuevaRonda();
    }
  }

  function finRonda(ganador, robo) {
    const R = F.R;
    R.fase = 'fin'; R.ganador = ganador; R.robo = robo;
    F.equipos[ganador].pts += R.banco * R.mult;
    pintar();
    Sonido.reproducir('exito');
    lluvia([F.equipos[ganador].emoji, '⭐', '🎉'], 30);
    Sonido.decir(robo ? `¡Robo exitoso! ${F.equipos[ganador].nombre} se llevan ${R.banco * R.mult} puntos.` : `¡${F.equipos[ganador].nombre} se llevan ${R.banco * R.mult} puntos!`);
  }

  function final() {
    const [a, b] = F.equipos;
    const empate = a.pts === b.pts;
    const gan = empate ? F.equipos : [a.pts > b.pts ? a : b];
    gan.forEach(e => sumarPuntos(e.miembros, 3));
    Juego.iniciar({ llego: vistaLobby });
    pantalla('pos-final', `
      ${barra('🎯 Resultado final')}
      <div class="contenido">
        <h1 class="aparecer">${empate ? '🤝 ¡Empate!' : `🏆 ¡Ganan ${gan[0].emoji} ${gan[0].nombre}!`}</h1>
        ${htmlEquipos(true)}
        <p class="centro tenue">Ganadores: +3 puntos en el marcador de la noche</p>
        <div class="fila"><button class="btn secundario" data-a="otra">🔁 Otra partida</button><button class="btn secundario" data-a="marcador">🏆 Marcador</button><button class="btn" data-a="menu">◀ Menú</button></div>
      </div>`, { salir: menu, menu, marcador: pantallaMarcador, otra: config });
    conectados().forEach(u => vistaEspera(u, empate ? '¡Empate!' : `¡Ganan ${gan[0].nombre}!`, gan.some(e => e.miembros.includes(u)) ? '+3 puntos para ti 🎉' : 'Ni modo… ¡a la próxima! 🎄', empate ? '🤝' : gan[0].emoji));
    Sonido.reproducir('navidad'); lluvia();
    Sonido.decir(empate ? '¡Empate! Nadie se rinde en esta posada.' : `¡Ganan ${gan[0].nombre}!`);
  }

  /* ---------- Control manual desde la TV (respaldo) ---------- */
  function controlManual() {
    if (!confirm('⚠️ El control manual muestra las respuestas EN LA TV. Úsalo solo si el conductor se desconectó. ¿Continuar?')) return;
    const R = F.R;
    const b = (c, arg, t, estilo = 'secundario') => `<button class="btn ${estilo}" data-a="cmd" data-c="${c}" data-arg="${arg ?? ''}">${t}</button>`;
    pantalla('pos-manual', `
      ${barra('🛟 Control manual')}
      <div class="contenido">
        <p class="narracion">${escaparHTML(R.q.p)}</p>
        <div class="fila">${R.q.a.map(([t, p], i) => b('revelar', i, `${R.rev.has(i) ? '✅' : i + 1}. ${escaparHTML(t)} (${p})`, R.rev.has(i) ? 'secundario' : '')).join('')}</div>
        <div class="fila">${botonesFase().map(x => b(x.c, x.arg, x.txt, x.estilo)).join('')}</div>
        <div class="fila"><button class="btn grande" data-a="volver">📺 Volver al tablero</button></div>
      </div>`, { salir: confirmarSalida, volver: pintar, cmd: d => { comando(d.c, d.arg); if (F.R && F.R.fase !== 'fin' && pantallaActual !== 'pos-final') controlManual(); } });
  }

  function botonesFase() {
    const R = F.R, eq = F.equipos;
    switch (R.fase) {
      case 'intro': return [{ c: 'leer', txt: '📢 Leer la pregunta y activar ¡BASTA!', estilo: '' }];
      case 'cara': return [
        { c: 'tache', txt: '❌ No está', estilo: 'rojo' },
        { c: 'otraBasta', txt: '🔄 Reactivar ¡BASTA!' },
        { c: 'controla', arg: 0, txt: `${eq[0].emoji} Control: ${eq[0].nombre}`, estilo: 'verde' },
        { c: 'controla', arg: 1, txt: `${eq[1].emoji} Control: ${eq[1].nombre}`, estilo: 'verde' }];
      case 'control': return [{ c: 'tache', txt: '❌ Tache', estilo: 'rojo' }, { c: 'saltar', txt: '⏭ Saltar turno' }];
      case 'robo': return [{ c: 'tache', txt: '❌ Falló el robo', estilo: 'rojo' }];
      case 'fin': return [{ c: 'siguiente', txt: F.ronda + 1 >= F.rondas ? '🏆 Ver resultado final' : '▶ Siguiente ronda', estilo: '' }];
    }
    return [];
  }

  /* ---------- Celulares ---------- */
  function equipoDe(u) { return F ? F.equipos.findIndex(e => e.miembros.includes(u)) : -1; }
  function vistaPara(u) {
    const R = F && F.R;
    if (u === F.conductor) {
      if (!R) return { tipo: 'espera', emoji: '🎤', titulo: 'Eres el conductor', texto: 'Cuando empiece la ronda verás aquí las respuestas y los botones. ¡Que no te vean la pantalla!' };
      return {
        tipo: 'conductor', pregunta: R.q.p, fase: R.fase, mult: R.mult, banco: R.banco, taches: R.taches,
        respuestas: R.q.a.map(([t, p], i) => ({ t, p, rev: R.rev.has(i) })),
        estado: pantallaTexto(), basta: R.basta ? nombre(R.basta) : null,
        botones: botonesFase()
      };
    }
    const k = equipoDe(u);
    if (k < 0) return { tipo: 'espera', emoji: '🍿', titulo: 'Estás de público', texto: '¡Echa porras! Entras en la siguiente partida.' };
    const eq = F.equipos[k];
    const base = { emoji: eq.emoji, equipo: `${eq.emoji} ${eq.nombre}` };
    if (!R) return { ...base, tipo: 'espera', titulo: `Eres de ${eq.nombre}`, texto: 'Mira la TV 📺' };
    if (R.fase === 'intro' || R.fase === 'cara') {
      if (R.cara.includes(u)) {
        return { ...base, tipo: 'basta', activo: R.fase === 'cara' && !R.basta, gane: R.basta === u, perdi: R.basta && R.basta !== u, titulo: R.fase === 'intro' ? '¡Te toca el cara a cara!' : (R.basta === u ? '¡Ganaste! Contesta en voz alta 🗣️' : R.basta ? `${nombre(R.basta)} apretó primero 😬` : '¡APRIETA!') };
      }
      return { ...base, tipo: 'espera', titulo: 'Cara a cara', texto: `${R.cara.filter(Boolean).map(nombre).join(' 🆚 ')}` };
    }
    if (R.fase === 'control') {
      if (k === R.control) return turnoActual() === u ? { ...base, tipo: 'espera', emoji: '🗣️', titulo: '¡TE TOCA!', texto: 'Di tu respuesta en voz alta', vibrar: true } : { ...base, tipo: 'espera', titulo: 'Tu equipo tiene el control', texto: `Turno de ${nombre(turnoActual())}` };
      return { ...base, tipo: 'espera', emoji: '👀', titulo: 'Ustedes podrían robar', texto: 'Pongan atención a las respuestas que faltan…' };
    }
    if (R.fase === 'robo') {
      if (k !== R.control) return { ...base, tipo: 'espera', emoji: '🦹', titulo: '¡A ROBAR!', texto: 'Pónganse de acuerdo y digan UNA respuesta', vibrar: true };
      return { ...base, tipo: 'espera', emoji: '🤞', titulo: 'Crucen los dedos', texto: 'El otro equipo intenta robar' };
    }
    if (R.fase === 'fin') return { ...base, tipo: 'espera', emoji: R.ganador === k ? '🎉' : '😩', titulo: R.ganador === k ? '¡Ganaron la ronda!' : 'Perdieron la ronda', texto: 'Mira la TV 📺' };
    return { ...base, tipo: 'espera', titulo: 'Mira la TV 📺', texto: '' };
  }
  function pantallaTexto() {
    const R = F.R;
    return { intro: 'Lee la pregunta cuando estén listos', cara: R.basta ? `🔔 ${nombre(R.basta)} apretó primero` : 'Esperando ¡BASTA!…', control: `Turno de ${nombre(turnoActual())}`, robo: '¡El otro equipo intenta robar! Si atinan, toca su respuesta', fin: 'Ronda terminada · toca las que faltaron para enseñarlas 👀' }[R.fase];
  }
  function actualizarVistas() { conectados().forEach(u => ponerVista(u, vistaPara(u))); }
  function llegoPos(u) {
    if (F && u !== F.conductor && equipoDe(u) < 0 && F.R) {
      // Recién llegado: se suma al equipo con menos gente
      const e = F.equipos[0].miembros.length <= F.equipos[1].miembros.length ? F.equipos[0] : F.equipos[1];
      e.miembros.push(u);
    }
    ponerVista(u, vistaPara(u));
  }
  function mensajePos(u, d) {
    const R = F && F.R;
    if (d.t === 'basta' && R && R.fase === 'cara' && !R.basta && R.cara.includes(u)) {
      R.basta = u;
      Sonido.reproducir('timbre');
      destello();
      pintar();
      Sonido.decir(`¡${nombre(u)}!`);
      return;
    }
    if (d.t === 'cmd' && u === F.conductor) comando(d.c, d.arg);
  }

  return { config };
})();

/* =========================================================
   😂 RESPUESTAS CHUSCAS
   ========================================================= */
const Chuscas = (() => {
  let C = null, cfg = null;

  function config() {
    if (!cfg) cfg = { sel: new Set(conectados()), tiempo: 90 };
    pintarConfig();
  }
  function pintarConfig() {
    conectados().forEach(u => { if (!cfg.vistos || !cfg.vistos.has(u)) cfg.sel.add(u); });
    cfg.vistos = new Set(conectados());
    Juego.iniciar({ refrescar: () => { if (pantallaActual === 'ch-config') pintarConfig(); }, llego: vistaLobby });
    const n = participantesSel().length;
    pantalla('ch-config', `
      ${barra('😂 Respuestas Chuscas')}
      <div class="contenido" style="justify-content:flex-start">
        <h3>🙋 ¿Quién juega?</h3>
        ${htmlSeleccion(cfg.sel)}
        <div class="tarjeta"><div class="ajuste">Segundos para escribir
          <span class="contador"><button class="btn secundario chico" data-a="tMenos">−</button><b>${cfg.tiempo}</b><button class="btn secundario chico" data-a="tMas">+</button></span></div>
          <p class="tenue" style="margin:.3em 0 0">Quienes no jueguen pueden votar como público 🍿</p>
        </div>
        <div class="fila"><button class="btn grande" data-a="seguir" ${n < 3 ? 'disabled' : ''}>Siguiente ▶</button></div>
        ${n < 3 ? '<p class="centro tenue">Se necesitan al menos 3 jugadores</p>' : ''}
      </div>`, {
      salir: confirmarSalida,
      alternar: d => { cfg.sel.has(d.uid) ? cfg.sel.delete(d.uid) : cfg.sel.add(d.uid); pintarConfig(); },
      tMenos: () => { cfg.tiempo = Math.max(45, cfg.tiempo - 15); pintarConfig(); },
      tMas: () => { cfg.tiempo = Math.min(240, cfg.tiempo + 15); pintarConfig(); },
      seguir: reglas
    });
  }
  function participantesSel() { return [...cfg.sel].filter(enLinea); }

  function reglas() {
    pantallaReglas('😂 Respuestas Chuscas', [
      'A cada quien le llegan <b>2 frases</b> a su celular. Complétalas con lo más chistoso que se te ocurra ✍️.',
      'Cada frase la contestan <b>dos personas</b>. En la TV se enfrentan las dos respuestas… <b>sin decir de quién son</b>.',
      'Todos los demás votan desde su celular por la que más les guste. Cada voto da puntos.',
      'Si te llevas <b>todos los votos</b>: ¡CHUSCAZO! 🌶️ puntos extra.',
      'Son 2 rondas (la segunda vale doble) y una <b>ronda final</b> donde todos contestan la misma frase.'
    ], 'Respuestas chuscas. A cada quien le llegan dos frases a su celular. Complétalas con lo más chistoso que se te ocurra. Luego se enfrentan las respuestas en la tele y todos votan. Si te llevas todos los votos, es un chuscazo.', () => {
      C = { participantes: barajar(participantesSel()), ronda: 1, puntos: {} };
      C.participantes.forEach(u => C.puntos[u] = 0);
      Juego.iniciar({ llego: llegoCh, mensaje: mensajeCh, salio: () => { }, refrescar: () => { } });
      rondaEscribir();
    });
  }

  function tomarFrases(lista, usadasClave, n) {
    let disp = lista.map((_, i) => i).filter(i => !P[usadasClave].includes(i));
    if (disp.length < n) { P[usadasClave] = []; disp = lista.map((_, i) => i); }
    const elegidas = barajar(disp).slice(0, n);
    P[usadasClave].push(...elegidas); guardar();
    return elegidas.map(i => lista[i]);
  }

  /* ---------- Escritura ---------- */
  function rondaEscribir() {
    const ps = C.participantes, n = ps.length;
    C.fase = 'escribir';
    if (C.ronda <= 2) {
      const frases = tomarFrases(FRASES_CHUSCAS, 'usadasChuscas', n);
      const orden = barajar(ps);
      C.duelos = frases.map((f, i) => ({ id: `r${C.ronda}-${i}`, frase: f, autores: [orden[i], orden[(i + 1) % n]], resp: {}, votos: {} }));
    } else {
      C.duelos = [{ id: 'final', frase: elegir(FRASES_FINALES), autores: ps.slice(), resp: {}, votos: {}, final: true }];
    }
    C.pendientes = {};
    ps.forEach(u => C.pendientes[u] = C.duelos.filter(d => d.autores.includes(u)).map(d => d.id));
    const titulo = C.ronda <= 2 ? `Ronda ${C.ronda}${C.ronda === 2 ? ' · ¡puntos dobles!' : ''}` : '🌶️ Ronda final';
    pantalla('ch-escribir', `
      ${barra(`😂 ${titulo}`)}
      <div class="contenido">
        <h2>✍️ ¡A escribir en su celular!</h2>
        <div id="reloj" class="reloj" style="font-size:clamp(3rem,15vmin,9rem)"></div>
        <div class="barra-tiempo"><div id="barraTiempo"></div></div>
        <div id="progreso"></div>
        <div class="fila"><button class="btn secundario" data-a="mas">+30 s</button><button class="btn secundario" data-a="ya">⏩ Ya, a votar</button></div>
      </div>`, { salir: confirmarSalida, mas: () => reloj.agregar(30), ya: terminarEscritura });
    const reloj = iniciarReloj(C.ronda <= 2 ? cfg.tiempo : Math.round(cfg.tiempo * 0.75), terminarEscritura);
    C.reloj = reloj;
    pintarProgreso();
    conectados().forEach(u => (ps.includes(u) ? siguienteFrase(u) : vistaEspera(u, 'Eres público 🍿', 'En un momento te toca votar', '🍿')));
    Sonido.reproducir('cascabeles');
    Sonido.decir(C.ronda <= 2 ? `${titulo}. Revisen su celular y escriban lo más chistoso que se les ocurra.` : 'Ronda final. Todos contestan la misma frase. ¡Lúzcanse!');
  }
  function pintarProgreso() {
    const el = document.getElementById('progreso');
    if (!el) return;
    el.innerHTML = `<div class="fichas">${C.participantes.map(u => `<span class="ficha ${C.pendientes[u].length ? 'apagada' : 'activa'}">${C.pendientes[u].length ? '✍️' : '✅'} ${ficha(u)}</span>`).join('')}</div>`;
  }
  function siguienteFrase(u) {
    const id = C.pendientes[u] && C.pendientes[u][0];
    if (!id) return vistaEspera(u, '¡Listo! 😎', 'Espera a que terminen los demás…', '✅');
    const d = C.duelos.find(x => x.id === id);
    const total = C.duelos.filter(x => x.autores.includes(u)).length;
    ponerVista(u, { tipo: 'escribir', id, frase: d.frase, n: total - C.pendientes[u].length + 1, total });
  }
  function terminarEscritura() {
    if (C.fase !== 'escribir') return;
    C.fase = 'votar';
    if (C.reloj) C.reloj.detener();
    C.duelos.forEach(d => d.autores.forEach(u => { if (!d.resp[u]) d.resp[u] = elegir(RESPUESTAS_OLVIDADAS); }));
    C.idx = 0;
    C.ordenDuelos = barajar(C.duelos);
    setTimeout(votarDuelo, 400);
  }

  /* ---------- Votación ---------- */
  async function votarDuelo() {
    const d = C.ordenDuelos[C.idx];
    if (!d) return marcadorRonda();
    C.fase = 'votar';
    d.votos = {};
    const opciones = barajar(d.autores).map((u, i) => ({ k: u, letra: 'ABCDEFGHIJKLMNOP'[i], texto: d.resp[u] }));
    d.opciones = opciones;
    const votantes = conectados().filter(u => !d.autores.includes(u) || d.final);
    d.votantes = votantes;
    pantalla('ch-votar', `
      ${barra(d.final ? '🌶️ Ronda final' : `😂 Ronda ${C.ronda} · Duelo ${C.idx + 1} de ${C.ordenDuelos.length}`)}
      <div class="contenido" style="gap:1.6vh">
        <div class="frase-chusca">${escaparHTML(d.frase).replace(/_{3,}/g, '<span class="hueco">&nbsp;</span>')}</div>
        <div class="respuestas-chuscas ${opciones.length > 2 ? 'muchas' : ''}">
          ${opciones.map(o => `<div class="resp-chusca aparecer"><span class="letra-resp">${o.letra}</span><span>${escaparHTML(o.texto)}</span></div>`).join(opciones.length === 2 ? '<div class="vs">VS</div>' : '')}
        </div>
        <div class="fila entre" style="align-items:center">
          <div id="reloj" class="reloj" style="font-size:clamp(2.5rem,10vmin,6rem)"></div>
          <div class="narracion" style="font-size:clamp(1rem,3vmin,2rem)">📱 ¡Voten en su celular! <span id="votosCuenta">0</span>/${votantes.length}</div>
          <button class="btn secundario" data-a="ya">⏩ Ver resultados</button>
        </div>
      </div>`, { salir: confirmarSalida, ya: () => revelarDuelo(d) });
    const r = iniciarReloj(d.final ? 30 : 20, () => revelarDuelo(d));
    d.reloj = r;
    conectados().forEach(u => {
      if (votantes.includes(u)) {
        const ops = opciones.filter(o => o.k !== u).map(o => ({ k: o.letra, letra: o.letra, texto: o.texto }));
        ponerVista(u, { tipo: 'votar', id: d.id, frase: d.frase, opciones: ops, titulo: d.final ? '¿Cuál es la mejor?' : '¿Cuál te gusta más?' });
      } else vistaEspera(u, '¡Es tu frase! 🤞', 'Los demás están votando… pon tu mejor cara de inocente 😇', '🤞');
    });
    // El presentador lee la frase y las respuestas
    await Sonido.decir(sinEmojis(d.frase), { tono: 1, velocidad: 1 });
    if (pantallaActual !== 'ch-votar') return;
    if (opciones.length <= 4) for (const o of opciones) { if (pantallaActual !== 'ch-votar') return; await Sonido.decir(sinEmojis(o.texto), { tono: 1.05, velocidad: 1 }); }
  }

  function revelarDuelo(d) {
    if (C.fase !== 'votar' || C.ordenDuelos[C.idx] !== d) return;
    C.fase = 'resultado';
    if (d.reloj) d.reloj.detener();
    Sonido.callar();
    const mult = d.final ? 3 : C.ronda;
    const total = Object.keys(d.votos).length;
    const conteo = {}; d.opciones.forEach(o => conteo[o.k] = []);
    Object.entries(d.votos).forEach(([v, k]) => { if (conteo[k]) conteo[k].push(v); });
    let chuscazo = null;
    d.opciones.forEach(o => {
      const n = conteo[o.k].length;
      if (C.puntos[o.k] != null) C.puntos[o.k] += n * 100 * mult;
      if (!d.final && total >= 2 && n === total) chuscazo = o.k;
    });
    if (chuscazo && C.puntos[chuscazo] != null) C.puntos[chuscazo] += 200 * mult;
    const ordenadas = d.final ? d.opciones.slice().sort((a, b) => conteo[b.k].length - conteo[a.k].length) : d.opciones;
    pantalla('ch-resultado', `
      ${barra(d.final ? '🌶️ Ronda final' : `😂 Ronda ${C.ronda} · Duelo ${C.idx + 1} de ${C.ordenDuelos.length}`)}
      <div class="contenido" style="gap:1.4vh">
        <div class="frase-chusca">${escaparHTML(d.frase).replace(/_{3,}/g, '<span class="hueco">&nbsp;</span>')}</div>
        <div class="respuestas-chuscas ${d.opciones.length > 2 ? 'muchas' : ''}">
          ${ordenadas.map(o => {
      const n = conteo[o.k].length, pct = total ? Math.round(n / total * 100) : 0;
      return `<div class="resp-chusca ${chuscazo === o.k ? 'ganadora' : ''}">
              <span class="letra-resp">${o.letra}</span>
              <div style="flex:1">
                <div>${escaparHTML(o.texto)}</div>
                <div class="autor aparecer">✍️ ${ficha(o.k)} · <b>${n} ${n === 1 ? 'voto' : 'votos'}</b> ${n ? `(+${n * 100 * mult})` : ''}</div>
                <div class="votantes">${conteo[o.k].map(v => J(v) ? J(v).emoji : '').join(' ')}</div>
                <div class="barra-votos"><div style="width:${pct}%"></div></div>
              </div>
            </div>`;
    }).join(d.opciones.length === 2 ? '<div class="vs">VS</div>' : '')}
        </div>
        ${chuscazo ? `<h1 class="aparecer" style="margin:0">🌶️ ¡CHUSCAZO! 🌶️ <span style="font-size:.5em">${ficha(chuscazo)} +${200 * mult}</span></h1>` : ''}
        <div class="fila"><button class="btn grande" data-a="sig">${C.idx + 1 >= C.ordenDuelos.length ? '🏆 Marcador' : 'Siguiente duelo ▶'}</button></div>
      </div>`, { salir: confirmarSalida, sig: () => { C.idx++; votarDuelo(); } });
    conectados().forEach(u => vistaEspera(u, 'Resultados en la TV 📺', d.autores.includes(u) ? `Te votaron ${conteo[u] ? conteo[u].length : 0} ${conteo[u] && conteo[u].length === 1 ? 'persona' : 'personas'}` : '¡Gracias por votar!', d.autores.includes(u) ? '✍️' : '🗳️'));
    if (chuscazo) { Sonido.reproducir('fanfarria'); destello(); lluvia(['🌶️', '😂', '🔥'], 35); Sonido.decir(`¡Chuscazo de ${nombre(chuscazo)}!`); }
    else if (total === 0) Sonido.decir('¿Nadie votó? Qué posada tan tímida.');
    else { Sonido.reproducir('exito'); const top = ordenadas.slice().sort((a, b) => conteo[b.k].length - conteo[a.k].length)[0]; Sonido.decir(`Esa respuesta fue de ${nombre(top.k)}.`); }
  }

  function tabla() {
    return C.participantes.slice().sort((a, b) => C.puntos[b] - C.puntos[a]);
  }
  function marcadorRonda() {
    const t = tabla(), med = ['🥇', '🥈', '🥉'];
    const ultima = C.ronda >= 3;
    pantalla('ch-marcador', `
      ${barra(`😂 ${ultima ? 'Resultado final' : `Fin de la ronda ${C.ronda}`}`)}
      <div class="contenido">
        <h2>${ultima ? `🏆 ¡${ficha(t[0])} es la persona más chusca!` : '🏆 Así van'}</h2>
        <div class="marcador ${t.length > 7 ? 'dos' : ''}">${t.map((u, i) => `<div class="marcador-fila" style="grid-template-columns:3em 1fr auto"><span class="pos">${med[i] || i + 1}</span><span>${ficha(u)}</span><span class="pts">${C.puntos[u]}</span></div>`).join('')}</div>
        ${ultima ? '<p class="centro tenue">Marcador de la noche: 🥇 +3 · 🥈 +2 · 🥉 +1</p>' : ''}
        <div class="fila">${ultima ? '<button class="btn secundario" data-a="otra">🔁 Otra partida</button><button class="btn secundario" data-a="marcador">🏆 Marcador de la noche</button><button class="btn" data-a="menu">◀ Menú</button>'
        : `<button class="btn grande" data-a="sig">${C.ronda === 2 ? '🌶️ Ronda final' : 'Ronda 2 ▶'}</button>`}</div>
      </div>`, {
      salir: confirmarSalida, menu, marcador: pantallaMarcador, otra: config,
      sig: () => { C.ronda++; rondaEscribir(); }
    });
    if (ultima) {
      [3, 2, 1].forEach((p, i) => { if (t[i] && C.puntos[t[i]] > 0) sumarPuntos([t[i]], p); });
      Juego.iniciar({ llego: vistaLobby });
      Sonido.reproducir('navidad'); lluvia(['😂', '🌶️', '🎄', '⭐']);
      Sonido.decir(`¡${nombre(t[0])} es la persona más chusca de la posada!`);
    } else Sonido.decir(`Así van. En primer lugar: ${nombre(t[0])}.`);
    conectados().forEach(u => vistaEspera(u, ultima ? '¡Se acabó!' : 'Así van…', C.puntos[u] != null ? `Llevas ${C.puntos[u]} puntos` : 'Mira la TV 📺', '🏆'));
  }

  /* ---------- Mensajes de los celulares ---------- */
  function llegoCh(u) {
    if (!C) return vistaLobby(u);
    if (C.fase === 'escribir' && C.pendientes[u]) return siguienteFrase(u);
    if (C.fase === 'votar') {
      const d = C.ordenDuelos[C.idx];
      if (d && d.opciones && (!d.autores.includes(u) || d.final) && !d.votos[u]) {
        if (!d.votantes.includes(u)) d.votantes.push(u);
        return ponerVista(u, { tipo: 'votar', id: d.id, frase: d.frase, opciones: d.opciones.filter(o => o.k !== u).map(o => ({ k: o.letra, letra: o.letra, texto: o.texto })), titulo: '¿Cuál te gusta más?' });
      }
    }
    const v = vistas.get(u);
    if (v) ponerVista(u, v); else vistaEspera(u, 'Mira la TV 📺', 'Entras en la siguiente partida', '🍿');
  }
  function mensajeCh(u, m) {
    if (m.t === 'respuesta' && C.fase === 'escribir') {
      const d = C.duelos.find(x => x.id === m.id);
      if (!d || !d.autores.includes(u) || !C.pendientes[u]) return;
      const texto = String(m.texto || '').replace(/\s+/g, ' ').trim().slice(0, 80);
      if (!texto) return;
      d.resp[u] = texto;
      C.pendientes[u] = C.pendientes[u].filter(id => id !== m.id);
      Sonido.reproducir('tic');
      siguienteFrase(u);
      pintarProgreso();
      if (C.participantes.every(p => !C.pendientes[p].length || !enLinea(p))) setTimeout(terminarEscritura, 800);
      return;
    }
    if (m.t === 'voto' && C.fase === 'votar') {
      const d = C.ordenDuelos[C.idx];
      if (!d || d.id !== m.id || (d.autores.includes(u) && !d.final) || d.votos[u]) return;
      const op = d.opciones.find(o => o.letra === m.k);
      if (!op || op.k === u) return;
      d.votos[u] = op.k;
      Sonido.reproducir('tic');
      vistaEspera(u, '¡Voto registrado! 🗳️', 'Espera los resultados en la TV', '✅');
      const el = document.getElementById('votosCuenta'); if (el) el.textContent = Object.keys(d.votos).length;
      const faltan = d.votantes.filter(v => enLinea(v) && !d.votos[v]);
      if (!faltan.length) setTimeout(() => revelarDuelo(d), 700);
    }
  }

  return { config };
})();

REGISTRO.posaderos = Posaderos;
REGISTRO.chuscas = Chuscas;

/* ---------------- Arranque ---------------- */
function bienvenida() {
  pantalla('bienvenida', `
    <div class="contenido" style="align-items:center">
      <h1 style="font-size:clamp(3rem,13vmin,9rem)">🎄 Noche de<br>Posada</h1>
      <p class="tenue centro">Gira tu iPhone horizontal y duplica la pantalla en la TV 📺<br>Quita el modo silencio y sube el volumen 🔊</p>
      <button class="btn grande" data-a="entrar">🕯️ ¡Pásele, pásele!</button>
    </div>`, {
    entrar: async () => {
      Sonido.activar(); mantenerEncendida();
      Sonido.reproducir('navidad'); lluvia(['❄️', '⭐', '🎄'], 30);
      menu();
      await Sonido.decir('¡Bienvenidos a la posada! Escaneen el código con su celular para unirse.');
    }
  });
}
window.addEventListener('DOMContentLoaded', () => { iniciarRed(); bienvenida(); });
