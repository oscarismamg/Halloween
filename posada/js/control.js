/* =========================================================
   NOCHE DE POSADA — Control en el celular de cada jugador
   ========================================================= */

const app = document.getElementById('app');
const q = new URLSearchParams(location.search);
let sala = (q.get('sala') || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);
let uid = localStorage.getItem('posada-uid');
if (!uid) { uid = Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem('posada-uid', uid); }
let miNombre = localStorage.getItem('posada-nombre') || '';
let yo = null;            // { nombre, emoji, puntos } que manda la TV
let vista = null;         // vista actual que manda la TV
let estado = 'inicio';
let enviadoSeq = -1;      // para no mandar dos veces en la misma vista
let acciones = {};

document.addEventListener('click', ev => {
  const el = ev.target.closest('[data-a]');
  if (!el) return;
  const fn = acciones[el.dataset.a];
  if (fn) { ev.preventDefault(); fn(el.dataset, el); }
});
const vibrar = p => { if (navigator.vibrate) navigator.vibrate(p); };

function pintar(html, acc = {}) {
  acciones = acc;
  const cab = yo ? `<div class="fila entre cabecera-cel">
      <span class="etiqueta">${yo.emoji} ${escaparHTML(yo.nombre)}</span>
      <span class="etiqueta">${estadoTexto()}</span>
    </div>` : '';
  app.innerHTML = cab + html;
}
function estadoTexto() {
  return { conectado: '🟢 Sala ' + sala, conectando: '🟡 Conectando…', reconectando: '🟡 Reconectando…', 'sin-sala': '🔴 Sala no encontrada', 'sin-red': '🔴 Sin conexión' }[estado] || '';
}

/* ---------------- Unirse ---------------- */
function pantallaUnirse(error = '') {
  pintar(`
    <div class="contenido">
      <h1>🎄 Noche de Posada</h1>
      <form id="f" class="tarjeta" style="display:flex;flex-direction:column;gap:1rem" autocomplete="off">
        <label><b>Código de sala</b> (lo ves en la TV)
          <input type="text" id="sala" maxlength="4" value="${escaparHTML(sala)}" placeholder="ABCD" style="width:100%;text-transform:uppercase;letter-spacing:.3em;font-size:2rem;text-align:center" autocapitalize="characters"></label>
        <label><b>Tu nombre o apodo</b>
          <input type="text" id="nombre" maxlength="14" value="${escaparHTML(miNombre)}" placeholder="Ej. Tío Beto" style="width:100%;font-size:1.4rem"></label>
        ${error ? `<p style="color:var(--rojo);margin:0">${error}</p>` : ''}
        <button class="btn grande" type="submit">¡Entrar! 🎉</button>
      </form>
    </div>`);
  const f = document.getElementById('f');
  if (!sala) document.getElementById('sala').focus(); else if (!miNombre) document.getElementById('nombre').focus();
  f.addEventListener('submit', ev => {
    ev.preventDefault();
    const s = document.getElementById('sala').value.toUpperCase().replace(/[^A-Z]/g, '');
    const n = document.getElementById('nombre').value.trim().slice(0, 14);
    if (s.length !== 4) return pantallaUnirse('El código tiene 4 letras 😉');
    if (!n) return pantallaUnirse('Escribe tu nombre 😉');
    sala = s; miNombre = n;
    localStorage.setItem('posada-nombre', n);
    history.replaceState(null, '', `?sala=${s}${paramServidor()}`);
    conectar();
  });
}

function conectar() {
  pintar(`<div class="contenido centro"><div style="font-size:5rem">🎄</div><h2>Entrando a la posada…</h2><p class="tenue">Sala ${sala}</p></div>`);
  RedCel.unirse(sala, uid, miNombre, {
    estado: e => {
      estado = e;
      const cab = document.querySelector('.cabecera-cel .etiqueta:last-child');
      if (cab) cab.textContent = estadoTexto();
      if (e === 'sin-sala' && !vista) pintar(`<div class="contenido centro"><div style="font-size:4rem">🤔</div><h2>No encuentro la sala ${sala}</h2>
        <p>Revisa el código en la TV. Seguimos intentando…</p><button class="btn secundario" data-a="cambiar">Cambiar código</button></div>`, { cambiar: () => location.href = `control.html?${paramServidor().slice(1)}` });
    },
    mensaje: m => {
      if (m.t === 'vista') {
        if (m.yo) yo = m.yo;
        const nueva = !vista || vista.seq !== m.v.seq;
        vista = m.v;
        if (nueva) render();
      } else if (m.t === 'expulsado') {
        localStorage.removeItem('posada-uid');
        pintar('<div class="contenido centro"><div style="font-size:4rem">👋</div><h2>El anfitrión te sacó de la sala</h2><p>Escanea el QR otra vez para volver a entrar.</p></div>');
      }
    }
  });
}

/* ---------------- Vistas ---------------- */
function render() {
  if (!vista) return;
  const v = vista;
  if (v.vibrar) vibrar([80, 60, 80]);
  if (v.tipo === 'espera') return vistaEspera(v);
  if (v.tipo === 'basta') return vistaBasta(v);
  if (v.tipo === 'escribir') return vistaEscribir(v);
  if (v.tipo === 'votar') return vistaVotar(v);
  if (v.tipo === 'conductor') return vistaConductor(v);
  if (v.tipo === 'tabla') return vistaTabla(v);
  if (v.tipo === 'dale') return vistaDale(v);
}

function vistaEspera(v) {
  pintar(`
    <div class="contenido centro">
      ${v.equipo ? `<div class="etiqueta" style="font-size:1.1rem;align-self:center">${escaparHTML(v.equipo)}</div>` : ''}
      <div style="font-size:6rem" class="aparecer">${v.emoji || '🎄'}</div>
      <h2>${escaparHTML(v.titulo || '')}</h2>
      <p>${escaparHTML(v.texto || '')}</p>
      ${yo ? `<p class="tenue">Puntos de la noche: <b>${yo.puntos}</b></p>` : ''}
      <button class="btn secundario chico" data-a="renombrar" style="margin-top:2rem">✏️ Cambiar mi nombre</button>
    </div>`, {
    renombrar: () => {
      const n = prompt('Tu nuevo nombre:', yo ? yo.nombre : miNombre);
      if (n && n.trim()) { miNombre = n.trim().slice(0, 14); localStorage.setItem('posada-nombre', miNombre); RedCel.enviar({ t: 'renombrar', nombre: miNombre }); }
    }
  });
}

function vistaBasta(v) {
  pintar(`
    <div class="contenido centro">
      ${v.equipo ? `<div class="etiqueta" style="font-size:1.1rem;align-self:center">${escaparHTML(v.equipo)}</div>` : ''}
      <h2>${escaparHTML(v.titulo)}</h2>
      <button class="boton-basta ${v.activo ? '' : 'inactivo'} ${v.gane ? 'gane' : ''}" data-a="basta" ${v.activo ? '' : 'disabled'}>
        ${v.gane ? '🔔<br>¡TÚ!' : v.perdi ? '😬' : v.activo ? '¡BASTA!' : '⏳<br><small>Espera la pregunta</small>'}
      </button>
    </div>`, {
    basta: () => {
      if (!v.activo || enviadoSeq === v.seq) return;
      enviadoSeq = v.seq;
      RedCel.enviar({ t: 'basta' });
      vibrar(120);
      const b = document.querySelector('.boton-basta');
      if (b) { b.classList.add('inactivo'); b.innerHTML = '🔔'; }
    }
  });
  if (v.gane) vibrar([200, 80, 200]);
}

function vistaEscribir(v) {
  pintar(`
    <div class="contenido" style="justify-content:flex-start;gap:1rem">
      <div class="centro tenue">${v.instr ? escaparHTML(v.instr) : `Frase ${v.n} de ${v.total} ✍️`}</div>
      <div class="tarjeta frase-cel">${escaparHTML(v.frase).replace(/_{3,}/g, '<span class="hueco">&nbsp;</span>')}</div>
      ${v.error ? `<p class="centro aparecer" style="color:var(--naranja2);font-weight:900;margin:0">${escaparHTML(v.error)}</p>` : ''}
      <form id="f" autocomplete="off" style="display:flex;flex-direction:column;gap:1rem">
        <textarea id="resp" maxlength="${v.max || 80}" rows="${v.sinTip ? 2 : 3}" ${v.minusculas || v.sinTip ? 'autocapitalize="none" autocorrect="off" spellcheck="false"' : ''} placeholder="${v.sinTip ? 'Escribe el título…' : v.instr ? 'Tu mentira… 😈' : 'Escribe algo chistoso… 😏'}" class="campo-texto"></textarea>
        <div class="fila entre"><span class="tenue" id="cuenta">0/${v.max || 80}</span><button class="btn grande" type="submit">Enviar 🚀</button></div>
      </form>
      ${v.sinTip ? '<p class="tenue centro" style="font-size:.95rem">No importan las faltas de ortografía 😉</p>' : `<p class="tenue centro" style="font-size:.95rem">${v.instr ? 'Tip: que suene creíble para que caigan 😏' : 'Tip: la gracia es que nadie sepa que fuiste tú 😇'}</p>`}
    </div>`);
  const t = document.getElementById('resp');
  const c = document.getElementById('cuenta');
  t.addEventListener('input', () => { c.textContent = `${t.value.length}/${v.max || 80}`; });
  setTimeout(() => t.focus(), 100);
  document.getElementById('f').addEventListener('submit', ev => {
    ev.preventDefault();
    const texto = t.value.trim();
    if (!texto) { t.focus(); return; }
    if (enviadoSeq === v.seq) return;
    enviadoSeq = v.seq;
    RedCel.enviar({ t: 'respuesta', id: v.id, texto });
    vibrar(40);
    pintar('<div class="contenido centro"><div style="font-size:4rem">🚀</div><h2>¡Enviado!</h2></div>');
  });
}

function vistaVotar(v) {
  pintar(`
    <div class="contenido" style="justify-content:flex-start;gap:1rem">
      <h2 style="margin:0">${escaparHTML(v.titulo || '¡Vota!')}</h2>
      <div class="tarjeta frase-cel" style="font-size:1.05rem">${escaparHTML(v.frase).replace(/_{3,}/g, '<span class="hueco">&nbsp;</span>')}</div>
      ${v.opciones.map(o => `<button class="opcion-voto" data-a="votar" data-k="${escaparHTML(o.k)}"><span class="letra-resp">${escaparHTML(o.letra)}</span><span>${escaparHTML(o.texto)}</span></button>`).join('')}
    </div>`, {
    votar: d => {
      if (enviadoSeq === v.seq) return;
      enviadoSeq = v.seq;
      RedCel.enviar({ t: 'voto', id: v.id, k: d.k });
      vibrar(40);
      pintar('<div class="contenido centro"><div style="font-size:4rem">🗳️</div><h2>¡Votaste!</h2></div>');
    }
  });
}

function vistaConductor(v) {
  pintar(`
    <div class="contenido" style="justify-content:flex-start;gap:.8rem">
      <div class="fila entre"><span class="etiqueta">🎤 Conductor</span><span class="etiqueta">💰 ${v.banco}${v.mult > 1 ? ` x${v.mult}` : ''} · ${'❌'.repeat(v.taches) || 'sin taches'}</span></div>
      <div class="tarjeta" style="padding:.8rem"><b>${escaparHTML(v.pregunta)}</b></div>
      <p class="centro" style="margin:0;font-weight:800;color:var(--naranja2)">${escaparHTML(v.estado || '')}</p>
      <div class="lista-respuestas">
        ${v.respuestas.map((r, i) => `<button class="resp-conductor ${r.rev ? 'revelada' : ''}" data-a="revelar" data-i="${i}" ${r.rev ? 'disabled' : ''}>
          <span class="num">${i + 1}</span><span class="txt">${escaparHTML(r.t)}</span><span class="pts">${r.p}</span></button>`).join('')}
      </div>
      <div class="fila">${v.botones.map(b => `<button class="btn ${b.estilo || 'secundario'}" data-a="cmd" data-c="${b.c}" data-arg="${b.arg ?? ''}">${escaparHTML(b.txt)}</button>`).join('')}</div>
      <p class="tenue" style="font-size:.9rem;margin:0">Toca una respuesta cuando la digan (aunque sea con otras palabras). ¡No dejes que vean tu pantalla! 🤫</p>
    </div>`, {
    revelar: d => { RedCel.enviar({ t: 'cmd', c: 'revelar', arg: d.i }); vibrar(30); },
    cmd: d => { RedCel.enviar({ t: 'cmd', c: d.c, arg: d.arg }); vibrar(30); }
  });
}

/* ---------------- Lotería: tabla ---------------- */
function vistaTabla(v) {
  const clave = 'lot-' + v.id;
  const marcadas = new Set(JSON.parse(localStorage.getItem(clave) || '[]'));
  pintar(`
    <div class="contenido" style="justify-content:flex-start;gap:.8rem">
      <div class="fila entre"><span class="etiqueta">🎴 ${escaparHTML(v.modo)}</span><span class="etiqueta">Carta #${v.num}</span></div>
      <div class="ultima-carta">${v.ultima ? `Salió: <b>${v.ultima.e} ${escaparHTML(v.ultima.n)}</b>` : '¡Corre y se va!'}</div>
      <div class="tabla-cel">
        ${v.cartas.map((c, i) => `<button class="celda-tabla ${marcadas.has(i) ? 'marcada' : ''}" data-a="marcar" data-i="${i}"><span>${c.e}</span><small>${escaparHTML(c.n)}</small></button>`).join('')}
      </div>
      <button class="btn grande boton-loteria" data-a="loteria">🎉 ¡LOTERÍA!</button>
      <p class="tenue centro" style="font-size:.9rem;margin:0">Toca una carta para ponerle frijolito 🫘 (o quitárselo)</p>
    </div>`, {
    marcar: (d, el) => {
      const i = +d.i;
      marcadas.has(i) ? marcadas.delete(i) : marcadas.add(i);
      localStorage.setItem(clave, JSON.stringify([...marcadas]));
      el.classList.toggle('marcada');
      vibrar(15);
    },
    loteria: () => { RedCel.enviar({ t: 'loteria', id: v.id, marcadas: [...marcadas] }); vibrar([60, 40, 60]); }
  });
}

/* ---------------- Piñata: botón para dar golpes ---------------- */
let golpesPendientes = 0, golpesTotales = 0, timerGolpes = null;
function vistaDale(v) {
  if (vistaDale.id !== v.id) { golpesTotales = 0; vistaDale.id = v.id; }
  pintar(`
    <div class="contenido centro">
      <h2>${v.activo ? '¡DALE, DALE, DALE!' : '¿Listos? 🪅'}</h2>
      <button class="boton-basta boton-dale ${v.activo ? '' : 'inactivo'}" id="dale" ${v.activo ? '' : 'disabled'}>${v.activo ? '🪅<br>¡DALE!' : '⏳'}</button>
      <div class="reloj" id="misGolpes" style="font-size:3rem">${golpesTotales}</div>
      <p class="tenue">golpes</p>
    </div>`);
  const b = document.getElementById('dale');
  if (!v.activo) return;
  b.addEventListener('pointerdown', ev => {
    ev.preventDefault();
    golpesPendientes++; golpesTotales++;
    const el = document.getElementById('misGolpes'); if (el) el.textContent = golpesTotales;
    b.classList.remove('golpe'); void b.offsetWidth; b.classList.add('golpe');
    if (navigator.vibrate) navigator.vibrate(8);
  });
  clearInterval(timerGolpes);
  timerGolpes = setInterval(() => {
    if (!vista || vista.tipo !== 'dale' || !vista.activo) { clearInterval(timerGolpes); return; }
    if (golpesPendientes > 0) { const n = Math.min(golpesPendientes, 6); golpesPendientes -= n; RedCel.enviar({ t: 'golpes', id: v.id, n }); }
  }, 200);
}

/* ---------------- Arranque ---------------- */
if (sala && miNombre) conectar();
else pantallaUnirse();
