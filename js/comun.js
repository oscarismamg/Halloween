/* =========================================================
   Lógica compartida TV + celulares.
   Los roles se calculan con una semilla: la TV y cada celular
   obtienen EXACTAMENTE el mismo resultado sin necesitar servidor.
   ========================================================= */

function hashTexto(str) {
  // cyrb53
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

function crearAzar(semilla) {
  // mulberry32
  let a = hashTexto(String(semilla)) >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function barajar(arr, azar = Math.random) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(azar() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function elegir(arr, azar = Math.random) {
  return arr[Math.floor(azar() * arr.length)];
}

/* ---------- Partidas codificadas en el enlace del QR ---------- */

// Parámetros: g (juego), s (semilla), n (nombres), y opciones del juego.
function crearEnlaceJugador(params) {
  const url = new URL('jugador.html', location.href);
  url.search = '';
  const p = new URLSearchParams();
  p.set('g', params.g);
  p.set('s', params.s);
  p.set('n', params.n.map(encodeURIComponent).join('~'));
  Object.keys(params).forEach(k => {
    if (!['g', 's', 'n'].includes(k)) p.set(k, String(params[k]));
  });
  url.hash = p.toString();
  return url.toString();
}

function leerEnlaceJugador(hash) {
  const p = new URLSearchParams(hash.replace(/^#/, ''));
  if (!p.get('g') || !p.get('s') || !p.get('n')) return null;
  const datos = {};
  p.forEach((v, k) => { datos[k] = v; });
  datos.n = p.get('n').split('~').map(decodeURIComponent);
  return datos;
}

/* ---------- El Impostor ---------- */
// Devuelve { categoria, palabra, impostores: [índices] } para la ronda r
function calcularImpostor(semilla, nombres, numImpostores, categoria, ronda) {
  const azar = crearAzar(`${semilla}|impostor|${ronda}`);
  let cat = categoria;
  const claves = Object.keys(IMPOSTOR_CATEGORIAS);
  if (!IMPOSTOR_CATEGORIAS[cat]) cat = elegir(claves, azar);
  const palabra = elegir(IMPOSTOR_CATEGORIAS[cat].palabras, azar);
  const orden = barajar(nombres.map((_, i) => i), azar);
  const impostores = orden.slice(0, Math.min(numImpostores, nombres.length - 1));
  return { categoria: cat, nombreCategoria: IMPOSTOR_CATEGORIAS[cat].nombre, palabra, impostores };
}

/* ---------- Asesino del Pueblo ---------- */
// Devuelve arreglo de roles (uno por jugador) para la partida r
function calcularAsesino(semilla, nombres, numAsesinos, conCurandera, conDetective, ronda) {
  const azar = crearAzar(`${semilla}|asesino|${ronda}`);
  const orden = barajar(nombres.map((_, i) => i), azar);
  const aldeanos = barajar(ALDEANOS, azar);
  const roles = new Array(nombres.length);
  let k = 0;
  for (let i = 0; i < numAsesinos; i++) roles[orden[k++]] = { tipo: 'asesino' };
  if (conCurandera) roles[orden[k++]] = { tipo: 'curandera' };
  if (conDetective) roles[orden[k++]] = { tipo: 'detective' };
  let a = 0;
  while (k < orden.length) roles[orden[k++]] = { tipo: 'aldeano', personaje: aldeanos[a++ % aldeanos.length] };
  return roles;
}

const INFO_ROLES = {
  asesino: { nombre: 'ASESINO', emoji: '🔪', color: '#ff2d55', bando: 'asesinos' },
  curandera: { nombre: 'LA CURANDERA', emoji: '🌿', color: '#34c759', bando: 'pueblo' },
  detective: { nombre: 'EL DETECTIVE', emoji: '🔍', color: '#0a84ff', bando: 'pueblo' },
  aldeano: { nombre: 'ALDEANO', emoji: '🏚️', color: '#ff9f0a', bando: 'pueblo' }
};

function asesinosRecomendados(n) {
  if (n <= 6) return 1;
  if (n <= 11) return 2;
  return 3;
}
function impostoresRecomendados(n) {
  return n >= 9 ? 2 : 1;
}

function escaparHTML(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function generarQR(texto, tamCelda = 8) {
  const qr = qrcode(0, 'L');
  qr.addData(texto);
  qr.make();
  return qr.createSvgTag({ cellSize: tamCelda, margin: 2, scalable: true });
}
