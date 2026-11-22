# 🎉 Noches de Fiesta: Halloween 🎃 y Posada 🎄

Este repo tiene dos web apps de juegos para la TV:

| App | Enlace | Estilo |
|---|---|---|
| 🎄 **Noche de Posada** | `https://oscarismamg.github.io/Halloween/posada/` | Tipo Jackbox: cada celular es un control que manda respuestas, votos y botonazos en tiempo real |
| 🎃 **Noche de Halloween** | `https://oscarismamg.github.io/Halloween/` | Roles secretos por QR (funciona sin servidor) |

---

# 🎄 Noche de Posada

## Cómo se juega
1. En tu iPhone abre **`…/Halloween/posada/`** en Safari, toca **"¡Pásele, pásele!"** y duplica la pantalla en la TV.
2. La TV muestra un **QR** y un **código de sala** de 4 letras. Cada invitado lo escanea, escribe su nombre y su celular se vuelve su control. Pueden entrar o salir cuando quieran.
3. Elige un juego del menú. En cada juego puedes sacar a quien no quiera jugar.

> **Requiere internet** en la TV y en todos los celulares. Lo ideal es que todos estén en el WiFi de la casa. La conexión es directa entre celulares (WebRTC con PeerJS): gratis, sin cuentas y sin instalar nada. Si alguien bloquea su celular o se le cierra la página, al volver se reconecta solo y recupera su pantalla.

### 🎯 100 Posaderos Dijeron
Al estilo de 100 Mexicanos Dijeron, con 28 preguntas en tono picosito.
- Alguien hace de **🎤 conductor**: ve las respuestas en su celular y las destapa en la TV conforme las digan (aunque las digan con otras palabras). El conductor no juega.
- **Cara a cara:** un jugador de cada equipo (🫔 Los Tamales vs ☕ Los Champurrados). El primero que aprieta **¡BASTA!** en su celular contesta.
- **Control:** el equipo ganador contesta por turnos. Su celular avisa "¡TE TOCA!".
- **3 taches ❌** y el otro equipo puede **robar** con una sola respuesta.
- Las últimas rondas valen **doble y triple**. El equipo ganador recibe +3 en el marcador de la noche.
- 🛟 Si el conductor se desconecta, en la TV hay un botón de **control manual** (pero muestra las respuestas en pantalla).

### 😂 Respuestas Chuscas
Al estilo de Quiplash, con más de 90 frases en tono picosito.
- A cada quien le llegan **2 frases** para completar en su celular, con lo más chistoso posible.
- En la TV se enfrentan las respuestas de dos en dos, **sin decir de quién son**, y la voz las lee en voz alta.
- Todos votan desde el celular. Si alguien se lleva todos los votos: **🌶️ ¡CHUSCAZO!** con puntos extra.
- Son 2 rondas (la segunda vale doble) y una **ronda final** donde todos contestan la misma frase.
- Quien no juegue puede votar como público. Al final: 🥇 +3, 🥈 +2 y 🥉 +1 en el marcador de la noche.

### 🎴 Lotería Navideña
36 cartas navideñas con versos chuscos ("El Cuñado: llegó sin traer nada, y se acabó la botellada").
- Cada quien tiene **su tabla de 16 cartas en el celular** y toca las cartas para ponerles frijolito 🫘.
- La TV canta las cartas con voz. Puedes pausar o cambiar la velocidad.
- Se gana con línea, 4 esquinas o tabla llena. El botón **¡LOTERÍA!** se valida solo, y si alguien canta lotería sin tenerla, la TV lo exhibe: "¡Lotería FALSA!". El ganador recibe +3 en el marcador de la noche.

### 👉 ¿Quién es más probable?
40 preguntas sobre el grupo ("…que diga 'ya me voy' y se quede dos horas más").
- Todos votan en secreto desde el celular por alguien del grupo.
- La TV corona al más votado y **revela quién votó por quién**.
- Quien vota con la mayoría gana puntos por "conocer a su banda".

### 🤥 Mentiras Navideñas
Al estilo de Fibbage, con 23 datos reales y rarísimos de Navidad.
- Cada quien inventa una mentira para llenar el hueco. Si escribes la verdad, el celular te avisa y te pide otra.
- Todas las opciones se muestran en minúsculas, para que la verdad no se delate por cómo está escrita.
- Luego todos buscan la verdad entre las mentiras: encontrarla da +500 y cada persona que cae en tu mentira te da +250.

### 🔔 Adivina el Villancico
30 acertijos de emojis: villancicos, canciones y películas navideñas.
- En la TV aparecen los espacios del título y **cada 6 segundos se destapa una letra**.
- Quien aprieta **¡BASTA!** **escribe su respuesta en el celular** y se revisa sola, aceptando faltas de ortografía.
- Entre menos letras destapadas, más puntos (de 100 a 20). Si fallas, la TV muestra lo que escribiste y quedas fuera de ese acertijo.
- Si la revisión automática se equivoca, el anfitrión toca **"✔ Sí se vale"**.

### 🪅 Rompe la Piñata
Carrera de toques: todos le pegan desde su celular lo más rápido que puedan.
- El golpe final se lleva +300 y quien dio más golpes, +100.
- La vida de la piñata se ajusta a cuántos juegan.

En todos los juegos con puntos, al final el 🥇 recibe +3, el 🥈 +2 y el 🥉 +1 en el marcador de la noche.

### 🎲 Dado de Regalos (intercambio con robo)
Dado gigante en 3D para dinámicas de robar e intercambiar regalos. Cada quien trae 1 regalo de broma y 1 regalo bueno.
- **Dinámicas listas:** 🤡 *Broma Bomba* (regalos de broma, se abren al tomarlos), 🎁 *El Gran Robo* (regalos buenos, se abren al final), ⚖️ *Par toma, impar roba* y 🎲 *Solo el dado*. Puedes **editar el texto de cada cara**.
- **Turnos:** con turnos activados, la TV dice a quién le toca y **esa persona tira desde su celular** (o se tira desde la TV). El que sigue recibe un aviso.
- **⏱️ Ronda relámpago:** 3 minutos de tiros rápidos; al sonar la alarma, cada quien se queda con el regalo que tiene en las manos.
- **Reglas de candado sugeridas:** un regalo robado 3 veces queda congelado 🔒 y no se vale robar de regreso en el turno inmediato.
- **Orden sugerido:** primero *Broma Bomba* para calentar y luego *El Gran Robo* con los regalos de $200, cerrando con la ronda relámpago.

### 🤖 Jugadores de prueba
¿Quieres probar un juego y no tienes suficientes celulares? En el menú toca **🤖 + Jugador de prueba** una o varias veces.
- Los robots juegan solos: aprietan ¡BASTA!, escriben respuestas chistosas, votan, marcan su tabla de lotería y le pegan a la piñata.
- No pueden ser conductores en 100 Posaderos.
- Para sacar a uno, tócalo en la lista de jugadores. Para sacarlos a todos: **⚙️ Ajustes → Quitar jugadores de prueba**.

### ✏️ Corregir puntos
Si alguien se equivocó al votar o quieres premiar o castigar a alguien, toca **✏️ Puntos** en la barra de arriba (está en todas las pantallas) o **✏️ Corregir puntos** en el menú.
- Se abre una ventana encima del juego, sin interrumpirlo.
- Puedes escribir el número exacto o usar −5, −1, +1 y +5.
- Corriges los puntos **del juego en curso** (en 100 Posaderos, los de cada equipo y el banco de la ronda) y los del **marcador de la noche** de cada persona.

**Marcador → 👑 Coronación** para coronar al Rey o Reina de la Posada.

### 🗓️ Orden sugerido para la posada
1. 🪅 **Rompe la Piñata**, para despertar a todos.
2. 😂 **Respuestas Chuscas**.
3. 🎯 **100 Posaderos Dijeron**.
4. 🍽️ Cena + 🎴 **Lotería Navideña**, que es tranquila y para todas las edades.
5. 🤥 **Mentiras Navideñas** y 🔔 **Adivina el Villancico**.
6. 👉 **¿Quién es más probable?**, cuando ya hay confianza 😏.
7. 👑 **Coronación**.

### ✏️ Agregar tus propias preguntas
Todo el contenido está en `posada/js/datos-posada.js`: preguntas, frases, cartas de lotería, datos de Mentiras y acertijos. Puedes agregar chismes y apodos del grupo.

### 🔊 Si no se oye en la TV
Quita el **modo silencio** del iPhone, sube el volumen y en ⚙️ Ajustes toca "Probar sonido". La app fuerza la sesión de audio en modo reproducción para que suene aunque el iPhone esté en silencio.

---

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
- QR generado con [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) (MIT). Conexión en tiempo real con [PeerJS](https://peerjs.com) (MIT).

Para probar en tu compu: `python3 -m http.server` y abre `http://localhost:8000`.
