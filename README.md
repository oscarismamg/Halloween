# 🎃 Noche de Halloween

Web app de juegos de fiesta para jugar **todos juntos frente a la TV**. Un iPhone se duplica en la TV con AirPlay y cada invitado usa su propio celular o iPad para ver su rol secreto.

- ✅ No hay que instalar nada (ni el anfitrión ni los invitados).
- ✅ Funciona sin servidor: los roles se calculan en cada celular a partir del código QR.
- ✅ De 4 a 15 jugadores (o más). En cada juego eliges quién juega; quien no quiera jugar, no pasa nada.
- ✅ Voz narradora en español, efectos de sonido y marcador de toda la noche.

---

## 🌐 1. Publicarla (solo una vez)

1. En GitHub abre el repo → **Settings** → **Pages**.
2. En **Source** elige **Deploy from a branch**.
3. Elige la rama (`main` cuando se haga el merge, o `claude/fervent-mendel-ulhzwn`) y la carpeta **/ (root)** → **Save**.
4. En 1 o 2 minutos queda en: **`https://oscarismamg.github.io/halloween/`**

> Para GitHub Pages gratis el repo debe ser **público** (los repos privados requieren GitHub Pro).

---

## 📺 2. Conectar a la TV (el día de la fiesta)

1. Conecta el iPhone al **mismo WiFi** que la TV.
2. Abre el enlace en **Safari** y toca **"Entrar… si te atreves"**.
3. **Centro de Control → Duplicar pantalla →** elige tu TV.
4. Gira el iPhone **horizontal** (quita el bloqueo de rotación).
5. Sube el volumen: la voz y los efectos salen por la TV.
6. Activa **No molestar** para que no aparezcan notificaciones en la TV.
7. Conecta el cargador: la app mantiene la pantalla encendida.

**Tip:** si quieres que se vea como app, en Safari toca **Compartir → Agregar a inicio**.

### ⚠️ Si el anfitrión también juega a los roles secretos
Todo lo que sale en tu iPhone sale en la TV. Para ver **tu** rol usa otro dispositivo (un iPad o el celular de alguien) y escanea el QR desde ahí.

---

## 👥 3. Registrar jugadores

Menú → **👥 Jugadores** → escribe cada nombre. Si tocas un nombre, esa persona queda **descansando** 😴 y no se incluye por defecto (por ejemplo si la abuela quiere ver un juego sin jugarlo). Además, en cada juego puedes sacar o meter gente antes de empezar.

---

## 🎮 Los juegos

| Juego | Jugadores | ¿Celular? | Duración |
|---|---|---|---|
| 🎭 **Mímica Embrujada** | 4+ (2 a 4 equipos) | Opcional | 15-20 min |
| 🕵️ **El Impostor** | 4+ | ✅ Sí (QR) | 5 min por ronda |
| 🔪 **El Asesino de San Espanto** | 5+ | ✅ Sí (QR) | 15-25 min |
| 🧠 **Trivia de Terror** | 2+ (equipos) | No | 10-15 min |
| 🎡 **Ruleta Maldita** | 2+ | No | Libre |
| 🧛 **Concurso de Disfraces** | 2+ | No | 10 min |

Cada juego empieza con una pantalla de **"Cómo se juega"** que la voz lee en voz alta.

### 🎭 Mímica Embrujada
Por equipos: una persona actúa y su equipo adivina.
- **Modo 📺 Palabra en la TV:** el actor se para frente a la TV y su equipo se voltea de espaldas. El anfitrión toca ✔ o ⏭.
- **Modo 📱 Papelito en el celular:** el actor abre la página de jugador → **🎭 Mímica** y saca papelitos. El anfitrión suma +1 en la TV.

### 🕵️ El Impostor
Todos reciben la misma palabra en su celular, excepto el impostor, que solo ve la categoría. Cada quien dice una palabra relacionada, debaten y a la cuenta de 3 todos señalan. Si atrapan al impostor, todavía puede salvarse adivinando la palabra.
- Para la siguiente ronda **no hay que volver a escanear**: cada quien toca **"Siguiente ronda ▶"** en su celular hasta que el número coincida con la TV.

### 🔪 El Asesino de San Espanto
Roles secretos: 🔪 Asesinos, 🌿 Curandera, 🔍 Detective y 🏚️ Aldeanos (cada aldeano tiene un personaje chistoso). **La TV es la narradora**, así que nadie se queda fuera.
- **Noche:** todos cierran los ojos y la voz llama a cada rol. Los asesinos **tocan el hombro** de su víctima, la curandera **toca la cabeza** de quien protege y el detective investiga en su celular.
- **Día:** quien sintió la mano en el hombro se levanta. Si también le tocaron la cabeza, se salvó. El anfitrión lo marca en la TV.
- Debate → a la cuenta de 3 todos señalan → el más señalado queda eliminado y se revela su rol.
- Asesinos recomendados: 1 (5-6 jugadores), 2 (7-11) y 3 (12-15).

### 🧠 Trivia de Terror
44 preguntas de leyendas mexicanas, Día de Muertos, películas clásicas y para niños. Los equipos responden mostrando 1, 2, 3 o 4 dedos. No se repiten preguntas entre partidas.

### 🎡 Ruleta Maldita
La ruleta elige a alguien y esa persona escoge **verdad o reto**. Si se raja… castigo. Los retos son para todas las edades (nada físico pesado).

### 🧛 Concurso de Disfraces
Pasarela con presentación y luego votación por categoría: más aterrador, más chistoso, más creativo y mejor pasarela.
- **👏 Aplausómetro:** el iPhone mide con el micrófono qué tan fuerte aplauden y gritan.
- **✋ Mano alzada:** cuentas las manos con + y −.

> Si al usar el micrófono el sonido deja de salir por la TV, cambia a **mano alzada** (es una limitación de iOS con AirPlay).

---

## 🏆 Puntos de la noche

| Evento | Puntos |
|---|---|
| Equipo ganador (Mímica / Trivia) | +3 c/u (segundo lugar +1) |
| Impostor: gana el pueblo | +1 a cada no-impostor |
| Impostor: el impostor adivina la palabra / no lo atrapan | +2 / +3 al impostor |
| Asesino: bando ganador | +2 c/u |
| Ruleta: cumple el reto | +1 |
| Disfraces: ganador de categoría | +3 |

Al final ve a **🏆 Marcador → 👑 Coronación final** para coronar al **Rey o Reina de la Noche** con redoble y fanfarria. Desde el marcador también puedes ajustar los puntos a mano.

---

## 🗓️ Orden sugerido para la noche

1. 🧛 **Pasarela de disfraces** al inicio, para lucirse con el disfraz recién puesto (la votación puede ser al final).
2. 🎭 **Mímica**, para romper el hielo y que todos se rían.
3. 🕵️ **El Impostor**, 3 o 4 rondas rápidas para aprender a usar el QR.
4. 🍕 Pausa para cenar + 🎡 **Ruleta Maldita**.
5. 🔪 **El Asesino de San Espanto**, con las luces bajas 🕯️.
6. 🧠 **Trivia de Terror**.
7. 🧛 Votación de disfraces → 👑 **Coronación**.

---

## 🛠️ Detalles técnicos

- HTML, CSS y JavaScript puro, sin compilación. Se puede abrir con cualquier servidor estático.
- `index.html` es la pantalla de la TV y `jugador.html` la del celular de cada invitado.
- `js/datos.js` tiene todas las palabras, preguntas y retos. **Se puede editar** para agregar los tuyos.
- Los roles se calculan con una semilla compartida en el QR (`js/comun.js`), así que la TV y los celulares obtienen el mismo resultado sin conexión entre ellos.
- Jugadores y puntos se guardan en el navegador del iPhone (sobreviven si se recarga la página).
- QR generado con [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) (MIT).

Para probar en tu compu: `python3 -m http.server` y abre `http://localhost:8000`.
