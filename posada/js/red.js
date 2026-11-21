/* =========================================================
   Conexión en tiempo real TV <-> celulares (PeerJS / WebRTC).
   La TV crea la "sala"; cada celular se conecta directamente.
   Para pruebas: ?servidor=localhost:9000 usa un servidor propio.
   ========================================================= */

const PREFIJO_SALA = 'nochedeposada-v1-';

function opcionesPeer() {
  const q = new URLSearchParams(location.search);
  const servidor = q.get('servidor');
  const base = { debug: 0 };
  if (!servidor) return base; // Servidor gratuito de PeerJS (incluye STUN/TURN)
  const [host, puerto] = servidor.split(':');
  return Object.assign(base, {
    host, port: +(puerto || 443), path: '/', secure: q.get('seguro') !== '0',
    config: { iceServers: [] }
  });
}
function paramServidor() {
  const q = new URLSearchParams(location.search);
  const extra = new URLSearchParams();
  ['servidor', 'seguro'].forEach(k => { if (q.get(k)) extra.set(k, q.get(k)); });
  const s = extra.toString();
  return s ? '&' + s : '';
}

/* ---------------- Lado TV (anfitrión) ---------------- */
const RedTV = (() => {
  let peer = null;
  const conexiones = new Map(); // uid -> conn
  const vistos = new Map();     // uid -> último ping
  let manejadores = {};
  let codigo = null;
  let intentos = 0;

  function crearSala(cod, m) {
    codigo = cod;
    manejadores = m;
    abrir();
    setInterval(revisarVivos, 4000);
  }

  function abrir() {
    if (peer) { try { peer.destroy(); } catch (e) { } }
    manejadores.estado && manejadores.estado('conectando');
    peer = new Peer(PREFIJO_SALA + codigo, opcionesPeer());
    peer.on('open', () => { intentos = 0; manejadores.estado && manejadores.estado('lista'); });
    peer.on('connection', conn => {
      conn.on('data', d => recibir(conn, d));
      conn.on('close', () => { if (conn.uid && conexiones.get(conn.uid) === conn) { conexiones.delete(conn.uid); manejadores.salio && manejadores.salio(conn.uid); } });
      conn.on('error', () => { });
    });
    peer.on('disconnected', () => { manejadores.estado && manejadores.estado('reconectando'); setTimeout(() => { if (peer && !peer.destroyed) peer.reconnect(); }, 1500); });
    peer.on('error', e => {
      if (e.type === 'unavailable-id') {
        // Pasa al recargar la página: el servidor aún recuerda la sala anterior
        intentos++;
        manejadores.estado && manejadores.estado('reclamando');
        if (intentos > 8) { manejadores.codigoOcupado && manejadores.codigoOcupado(); return; }
        setTimeout(abrir, 3000);
      } else if (['network', 'server-error', 'socket-error', 'socket-closed'].includes(e.type)) {
        manejadores.estado && manejadores.estado('sin-red');
        setTimeout(abrir, 4000);
      }
    });
  }

  function recibir(conn, d) {
    if (!d || typeof d !== 'object') return;
    if (d.t === 'hola') {
      const uid = String(d.uid || '').slice(0, 40);
      if (!uid) return;
      const anterior = conexiones.get(uid);
      if (anterior && anterior !== conn) { try { anterior.close(); } catch (e) { } }
      conn.uid = uid;
      conexiones.set(uid, conn);
      vistos.set(uid, Date.now());
      manejadores.llego && manejadores.llego(uid, String(d.nombre || '').slice(0, 14));
      return;
    }
    if (!conn.uid) return;
    vistos.set(conn.uid, Date.now());
    if (d.t === 'ping') { enviar(conn.uid, { t: 'pong' }); return; }
    manejadores.mensaje && manejadores.mensaje(conn.uid, d);
  }

  function revisarVivos() {
    const ahora = Date.now();
    vistos.forEach((t, uid) => {
      if (ahora - t > 16000 && conexiones.has(uid)) {
        const c = conexiones.get(uid);
        conexiones.delete(uid);
        try { c.close(); } catch (e) { }
        manejadores.salio && manejadores.salio(uid);
      }
    });
  }

  function enviar(uid, msg) {
    const c = conexiones.get(uid);
    if (c && c.open) { try { c.send(msg); return true; } catch (e) { } }
    return false;
  }
  function conectado(uid) { const c = conexiones.get(uid); return !!(c && c.open); }
  function expulsar(uid) {
    enviar(uid, { t: 'expulsado' });
    const c = conexiones.get(uid);
    setTimeout(() => { try { c && c.close(); } catch (e) { } }, 300);
    conexiones.delete(uid);
  }

  return { crearSala, enviar, conectado, expulsar };
})();

/* ---------------- Lado celular (jugador) ---------------- */
const RedCel = (() => {
  let peer = null, conn = null;
  let datos = null, manejadores = {};
  let ultimoPong = 0, timerPing = null, reconectando = false, espera = 1000;

  function unirse(codigo, uid, nombre, m) {
    datos = { codigo, uid, nombre };
    manejadores = m;
    conectar();
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && !(conn && conn.open)) reconectar(true);
    });
    clearInterval(timerPing);
    timerPing = setInterval(() => {
      if (conn && conn.open) {
        try { conn.send({ t: 'ping' }); } catch (e) { }
        if (Date.now() - ultimoPong > 13000) reconectar(true);
      }
    }, 4000);
  }

  function conectar() {
    manejadores.estado && manejadores.estado('conectando');
    if (!peer || peer.destroyed) {
      peer = new Peer(opcionesPeer());
      peer.on('open', abrirConexion);
      peer.on('disconnected', () => { if (!peer.destroyed) peer.reconnect(); });
      peer.on('error', e => {
        if (e.type === 'peer-unavailable') manejadores.estado && manejadores.estado('sin-sala');
        else manejadores.estado && manejadores.estado('sin-red');
        reconectar(false);
      });
    } else if (peer.open) abrirConexion();
  }

  function abrirConexion() {
    if (conn) { try { conn.close(); } catch (e) { } }
    conn = peer.connect(PREFIJO_SALA + datos.codigo, { reliable: true });
    conn.on('open', () => {
      espera = 1000; reconectando = false;
      ultimoPong = Date.now();
      conn.send({ t: 'hola', uid: datos.uid, nombre: datos.nombre });
      manejadores.estado && manejadores.estado('conectado');
    });
    conn.on('data', d => {
      ultimoPong = Date.now();
      if (d && d.t === 'pong') return;
      manejadores.mensaje && manejadores.mensaje(d);
    });
    conn.on('close', () => reconectar(false));
    conn.on('error', () => reconectar(false));
  }

  function reconectar(inmediato) {
    if (reconectando && !inmediato) return;
    reconectando = true;
    manejadores.estado && manejadores.estado('reconectando');
    setTimeout(() => {
      reconectando = false;
      if (conn && conn.open) return;
      if (peer && (peer.destroyed || peer.disconnected)) { try { peer.destroy(); } catch (e) { } peer = null; }
      conectar();
    }, inmediato ? 200 : espera);
    espera = Math.min(espera * 2, 8000);
  }

  function enviar(msg) {
    if (conn && conn.open) { try { conn.send(msg); return true; } catch (e) { } }
    return false;
  }

  return { unirse, enviar };
})();
