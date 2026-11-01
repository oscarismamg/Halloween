/* =========================================================
   NOCHE DE HALLOWEEN — Página del celular de cada jugador
   ========================================================= */

const app = document.getElementById('app');
const partida = leerEnlaceJugador(location.hash);
const MI_NOMBRE = 'halloween-mi-nombre';
let vista = partida ? 'rol' : 'inicio';
let acciones = {};

document.addEventListener('click', ev => {
  const el = ev.target.closest('[data-a]');
  if (!el) return;
  const fn = acciones[el.dataset.a];
  if (fn) { ev.preventDefault(); fn(el.dataset, el); }
});
window.addEventListener('hashchange', () => location.reload());

function vibrar(ms = 40) { if (navigator.vibrate) navigator.vibrate(ms); }

function pantalla(html, acc = {}) {
  acciones = acc;
  const pestañas = `
    <div class="fila" style="margin-top:auto;padding-top:2vh">
      ${partida ? `<button class="btn ${vista === 'rol' ? '' : 'secundario'}" data-a="verRol">🔐 Mi ${partida.g === 'impostor' ? 'palabra' : 'rol'}</button>` : `<button class="btn ${vista === 'inicio' ? '' : 'secundario'}" data-a="verInicio">🏠 Inicio</button>`}
      <button class="btn ${vista === 'mimica' ? '' : 'secundario'}" data-a="verMimica">🎭 Mímica</button>
    </div>`;
  app.innerHTML = html + pestañas;
  acciones.verRol = () => { vista = 'rol'; render(); };
  acciones.verInicio = () => { vista = 'inicio'; render(); };
  acciones.verMimica = () => { vista = 'mimica'; render(); };
}

function render() {
  if (vista === 'mimica') return pantallaMimica();
  if (vista === 'rol' && partida) return pantallaPartida();
  pantallaInicio();
}

/* ---------------- Inicio (sin partida) ---------------- */
function pantallaInicio() {
  pantalla(`
    <div class="contenido">
      <h1>🎃 Noche de Halloween</h1>
      <div class="tarjeta">
        <h3>📺 ¿Cómo funciona?</h3>
        <p>La TV es el tablero. Cuando un juego tenga <b>roles o palabras secretas</b>, en la TV aparecerá un <b>código QR</b>.</p>
        <p>Escanéalo con la cámara de tu celular y aquí verás tu rol en secreto 🤫</p>
        <p class="tenue">No necesitas instalar nada. Sube el brillo y ¡no dejes que nadie vea tu pantalla!</p>
      </div>
      <div class="tarjeta">
        <h3>🎭 ¿Te toca actuar en Mímica?</h3>
        <p>Toca <b>Mímica</b> abajo para sacar papelitos.</p>
      </div>
    </div>`);
}

/* ---------------- Partida (Impostor / Asesino) ---------------- */
const claveRonda = () => `halloween-ronda-${partida.s}`;
function rondaActual() { return +(localStorage.getItem(claveRonda()) || 1); }
function cambiarRonda(d) { localStorage.setItem(claveRonda(), Math.max(1, rondaActual() + d)); }

let miIndice = null;
let visible = false;
let ocultarTimer = null;

function pantallaPartida() {
  const nombres = partida.n;
  if (miIndice == null) {
    const guardado = localStorage.getItem(MI_NOMBRE);
    if (guardado && nombres.includes(guardado) && sessionStorage.getItem('confirmado-' + partida.s)) miIndice = nombres.indexOf(guardado);
  }
  if (miIndice == null) return elegirNombre();
  return tarjetaSecreta();
}

function elegirNombre() {
  const guardado = localStorage.getItem(MI_NOMBRE);
  const titulo = partida.g === 'impostor' ? '🕵️ El Impostor' : '🔪 El Asesino de San Espanto';
  pantalla(`
    <div class="contenido" style="justify-content:flex-start">
      <h2>${titulo}</h2>
      <h3 class="centro">¿Quién eres?</h3>
      <div class="fichas">
        ${partida.n.map((n, i) => `<button class="ficha ${n === guardado ? 'activa' : ''}" style="font-size:1.3rem;padding:.7em 1.1em" data-a="soy" data-i="${i}">${escaparHTML(n)}</button>`).join('')}
      </div>
      <p class="centro tenue">¿No sale tu nombre? Hoy no te toca en este juego 😉 (o pídele al anfitrión que te agregue).</p>
    </div>`, {
    soy: d => {
      const n = partida.n[+d.i];
      if (!confirm(`¿Seguro que eres ${n}?`)) return;
      miIndice = +d.i;
      localStorage.setItem(MI_NOMBRE, n);
      sessionStorage.setItem('confirmado-' + partida.s, '1');
      vibrar();
      render();
    }
  });
}

function contenidoImpostor(r) {
  const d = calcularImpostor(partida.s, partida.n, +partida.i, partida.c, r);
  const soyImpostor = d.impostores.includes(miIndice);
  if (soyImpostor) {
    const otros = d.impostores.filter(i => i !== miIndice).map(i => partida.n[i]);
    return `
      <div style="font-size:5rem">😈</div>
      <div class="titulo-terror" style="font-size:2.6rem;color:var(--rojo)">¡ERES EL IMPOSTOR!</div>
      <p>Categoría: <b>${escaparHTML(d.nombreCategoria)}</b></p>
      ${otros.length ? `<p>Tu cómplice: <b>${otros.map(escaparHTML).join(', ')}</b></p>` : ''}
      <p class="tenue">No sabes la palabra. Escucha las pistas de los demás y di algo que suene creíble. ¡Que no te descubran!</p>`;
  }
  return `
    <div style="font-size:3rem">🤫</div>
    <p class="tenue" style="margin:0">Tu palabra secreta es</p>
    <div class="palabra-gigante" style="font-size:clamp(2.2rem,12vw,4rem)">${escaparHTML(d.palabra)}</div>
    <p>Categoría: <b>${escaparHTML(d.nombreCategoria)}</b></p>
    <p class="tenue">Di UNA palabra relacionada. Ni tan obvia (el impostor la adivinaría) ni tan rara (sospecharán de ti).</p>`;
}

function contenidoAsesino(r) {
  const roles = calcularAsesino(partida.s, partida.n, +partida.k, partida.cu === '1', partida.de === '1', r);
  const mio = roles[miIndice];
  const info = INFO_ROLES[mio.tipo];
  let detalle = '';
  if (mio.tipo === 'asesino') {
    const complices = roles.map((x, i) => x.tipo === 'asesino' && i !== miIndice ? partida.n[i] : null).filter(Boolean);
    detalle = `
      <p>${complices.length ? `Tus cómplices: <b>${complices.map(escaparHTML).join(', ')}</b>` : 'Trabajas <b>solo</b>. Nadie sospechará… ¿o sí?'}</p>
      <p class="tenue">🌙 De noche: cuando la TV llame a los asesinos, abre los ojos, pónganse de acuerdo señalando y <b>uno toca el hombro</b> de la víctima.<br>☀️ De día: actúa normal y culpa a otros 😇</p>`;
  } else if (mio.tipo === 'curandera') {
    detalle = `<p class="tenue">🌙 De noche: cuando te llamen, abre los ojos y <b>toca la cabeza</b> de alguien para protegerlo. Puedes protegerte a ti misma tocándote tu cabeza.<br>Si los asesinos atacan a esa persona… ¡se salva! 🌿</p>`;
  } else if (mio.tipo === 'detective') {
    detalle = `<p class="tenue">🌙 De noche: cuando te llamen, abre los ojos e investiga a <b>una</b> persona aquí abajo. Solo una por noche, ¡palabra de detective!<br>☀️ De día: usa lo que sabes… sin que los asesinos se den cuenta de quién eres.</p>`;
  } else {
    detalle = `<p>Eres <b>${escaparHTML(mio.personaje)}</b>.</p>
      <p class="tenue">No tienes poderes especiales, pero tienes algo mejor: tu intuición (y tu chisme). Descubre a los asesinos y señálalos de día.</p>`;
  }
  return `
    <div style="font-size:5rem">${info.emoji}</div>
    <div class="titulo-terror" style="font-size:2.6rem;color:${info.color}">${info.nombre}</div>
    ${detalle}`;
}

function panelDetective(r) {
  const roles = calcularAsesino(partida.s, partida.n, +partida.k, partida.cu === '1', partida.de === '1', r);
  if (roles[miIndice].tipo !== 'detective') return '';
  const clave = `halloween-det-${partida.s}-${r}`;
  const historial = JSON.parse(localStorage.getItem(clave) || '[]');
  return `
    <div class="tarjeta" id="panelDet">
      <h3>🔍 Investigar</h3>
      <div class="fichas">
        ${partida.n.map((n, i) => i === miIndice ? '' : `<button class="ficha" data-a="investigar" data-i="${i}">${escaparHTML(n)}</button>`).join('')}
      </div>
      <div id="resultadoDet" class="centro" style="min-height:3em"></div>
      ${historial.length ? `<p class="tenue">Investigaciones: ${historial.map(h => `${escaparHTML(partida.n[h.i])} ${h.a ? '🔪' : '😇'}`).join(' · ')}</p>` : ''}
    </div>`;
}

function tarjetaSecreta() {
  const r = rondaActual();
  const esImpostor = partida.g === 'impostor';
  const palabraRonda = esImpostor ? 'Ronda' : 'Partida';
  const contenido = esImpostor ? contenidoImpostor(r) : contenidoAsesino(r);
  pantalla(`
    <div class="contenido" style="justify-content:flex-start;gap:1.5vh">
      <div class="fila entre">
        <span class="etiqueta">${escaparHTML(partida.n[miIndice])}</span>
        <button class="btn secundario chico" data-a="cambiarNombre">No soy yo</button>
      </div>
      <div class="fila" style="flex-wrap:nowrap">
        <button class="btn secundario chico" data-a="rondaMenos" ${r <= 1 ? 'disabled' : ''}>◀</button>
        <div class="titulo-terror" style="font-size:2rem;min-width:6em;text-align:center">${palabraRonda} ${r}</div>
        <button class="btn chico" data-a="rondaMas">${esImpostor ? 'Siguiente ronda' : 'Nueva partida'} ▶</button>
      </div>
      <p class="centro tenue" style="margin:0;font-size:.95rem">El número debe coincidir con el de la TV 📺</p>
      <div id="secreto" class="tarjeta centro" data-a="alternarSecreto" style="min-height:45vh;display:flex;flex-direction:column;justify-content:center;align-items:center;cursor:pointer">
        ${visible ? `<div class="aparecer">${contenido}</div><p class="tenue" style="margin-top:1em">Toca para ocultar 🙈</p>`
      : `<div style="font-size:5rem">🔒</div><div class="titulo-terror" style="font-size:2rem">Toca para ver tu ${esImpostor ? 'palabra' : 'rol'}</div><p class="tenue">Tapa tu pantalla. ¡Que nadie vea! 👀</p>`}
      </div>
      ${!esImpostor && visible ? panelDetective(r) : ''}
    </div>`, {
    alternarSecreto: () => {
      visible = !visible; vibrar(visible ? 60 : 20);
      clearTimeout(ocultarTimer);
      if (visible) ocultarTimer = setTimeout(() => { visible = false; render(); }, 15000);
      render();
    },
    rondaMas: () => { cambiarRonda(1); visible = false; vibrar(); render(); },
    rondaMenos: () => { cambiarRonda(-1); visible = false; render(); },
    cambiarNombre: () => { miIndice = null; visible = false; sessionStorage.removeItem('confirmado-' + partida.s); render(); },
    investigar: d => {
      const i = +d.i;
      const clave = `halloween-det-${partida.s}-${r}`;
      const historial = JSON.parse(localStorage.getItem(clave) || '[]');
      if (!confirm(`¿Investigar a ${partida.n[i]}? (solo una persona por noche)`)) return;
      const roles = calcularAsesino(partida.s, partida.n, +partida.k, partida.cu === '1', partida.de === '1', r);
      const esAsesino = roles[i].tipo === 'asesino';
      historial.push({ i, a: esAsesino });
      localStorage.setItem(clave, JSON.stringify(historial));
      clearTimeout(ocultarTimer);
      ocultarTimer = setTimeout(() => { visible = false; render(); }, 15000);
      render();
      const res = document.getElementById('resultadoDet');
      if (res) res.innerHTML = esAsesino
        ? `<div class="titulo-terror aparecer" style="font-size:2.2rem;color:var(--rojo)">🔪 ¡${escaparHTML(partida.n[i])} ES ASESINO!</div>`
        : `<div class="titulo-terror aparecer" style="font-size:2.2rem;color:var(--verde)">😇 ${escaparHTML(partida.n[i])} es inocente</div>`;
      vibrar(esAsesino ? [100, 50, 100] : 40);
    }
  });
}

/* ---------------- Mímica (papelitos) ---------------- */
let mimicaCats = new Set(Object.keys(MIMICA_CATEGORIAS));
let mimicaMazo = [];
let mimicaActual = null;
let mimicaCuenta = 0;

function sacarPapelito() {
  if (!mimicaMazo.length) {
    mimicaMazo = barajar([...mimicaCats].flatMap(k => MIMICA_CATEGORIAS[k].palabras.map(p => ({ p, c: MIMICA_CATEGORIAS[k].nombre }))));
  }
  mimicaActual = mimicaMazo.pop();
}

function pantallaMimica() {
  pantalla(`
    <div class="contenido" style="justify-content:flex-start;gap:1.5vh">
      <h2>🎭 Papelitos</h2>
      <div class="fichas">
        ${Object.entries(MIMICA_CATEGORIAS).map(([k, c]) => `<button class="ficha ${mimicaCats.has(k) ? 'activa' : 'apagada'}" data-a="cat" data-k="${k}">${c.nombre}</button>`).join('')}
      </div>
      <div class="tarjeta centro" style="min-height:40vh;display:flex;flex-direction:column;justify-content:center;align-items:center">
        ${mimicaActual
      ? `<span class="etiqueta">${mimicaActual.c}</span><div class="palabra-gigante aparecer" style="font-size:clamp(2.2rem,12vw,4rem)">${escaparHTML(mimicaActual.p)}</div>`
      : '<div style="font-size:4rem">📜</div><p>Saca un papelito y actúalo sin hablar.<br><span class="tenue">¡Que nadie de tu equipo vea tu pantalla!</span></p>'}
      </div>
      <div class="fila">
        ${mimicaActual ? `<button class="btn verde grande" data-a="bien">✔ ¡Adivinaron! (${mimicaCuenta})</button><button class="btn secundario" data-a="pasar">⏭ Pasar</button>`
      : '<button class="btn grande" data-a="sacar">📜 Sacar papelito</button>'}
      </div>
      ${mimicaActual ? '<div class="fila"><button class="btn secundario chico" data-a="terminar">⏹ Terminar mi turno</button></div>' : ''}
    </div>`, {
    cat: d => {
      mimicaCats.has(d.k) ? mimicaCats.delete(d.k) : mimicaCats.add(d.k);
      if (!mimicaCats.size) mimicaCats.add(d.k);
      mimicaMazo = [];
      render();
    },
    sacar: () => { mimicaCuenta = 0; sacarPapelito(); vibrar(); render(); },
    bien: () => { mimicaCuenta++; sacarPapelito(); vibrar(60); render(); },
    pasar: () => { sacarPapelito(); vibrar(20); render(); },
    terminar: () => {
      alert(`¡Tu equipo adivinó ${mimicaCuenta} ${mimicaCuenta === 1 ? 'papelito' : 'papelitos'}! 🎉`);
      mimicaActual = null; mimicaCuenta = 0; render();
    }
  });
}

render();
