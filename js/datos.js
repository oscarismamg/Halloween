/* =========================================================
   Datos de la Noche de Halloween (compartidos TV + celulares)
   ¡OJO! Si cambias las listas de IMPOSTOR, cambia para todos
   al mismo tiempo (TV y celulares usan este mismo archivo).
   ========================================================= */

const EMOJIS = ['🎃','👻','💀','🦇','🕷️','🧛','🧟','🧙','🐺','🕸️','🍬','🔮','⚰️','🧹','🌕','🐈‍⬛','🦉','🍭','🪦','👽'];

/* ---------- El Impostor: categorías y palabras ---------- */
const IMPOSTOR_CATEGORIAS = {
  monstruos: {
    nombre: 'Monstruos',
    palabras: ['Vampiro','Hombre lobo','Momia','Zombi','Fantasma','Bruja','Frankenstein','Esqueleto','Chupacabras','La Llorona','Duende','Gárgola','Calabaza asesina','Payaso diabólico','Nahual','Demonio','Muñeco poseído','Sirena maldita','Hada oscura','Extraterrestre']
  },
  halloween: {
    nombre: 'Cosas de Halloween',
    palabras: ['Calabaza','Telaraña','Escoba','Caldero','Dulces','Disfraz','Vela','Murciélago','Gato negro','Ataúd','Lápida','Luna llena','Sombrero de bruja','Máscara','Calcetín de araña','Bola de cristal','Poción','Cementerio','Casa embrujada','Antifaz']
  },
  muertos: {
    nombre: 'Día de Muertos',
    palabras: ['Altar','Cempasúchil','Pan de muerto','Calaverita de azúcar','Papel picado','Catrina','Veladora','Panteón','Copal','Mole','Tamales','Xoloitzcuintle','Calaverita literaria','Fotografía del abuelo','Sal','Agua bendita','Mezcal','Chocolate caliente','Calabaza en tacha','Alebrije']
  },
  peliculas: {
    nombre: 'Películas y personajes',
    palabras: ['Coco','Hotel Transylvania','Los Locos Addams','Merlina','Beetlejuice','El extraño mundo de Jack','Los Cazafantasmas','Scooby-Doo','Chucky','Freddy Krueger','Jason','Pennywise','Annabelle','Casper','Abracadabra','Monster House','Coraline','Gremlins','Drácula','E.T.']
  },
  lugares: {
    nombre: 'Lugares tenebrosos',
    palabras: ['Panteón','Hospital abandonado','Bosque oscuro','Sótano','Ático','Castillo','Isla de las Muñecas','Callejón del Beso','Hacienda abandonada','Túnel','Elevador','Escuela de noche','Iglesia vieja','Cueva','Pantano','Feria abandonada','Morgue','Mansión','Faro','Pozo']
  },
  comida: {
    nombre: 'Comida de fiesta',
    palabras: ['Pozole','Tamales','Pan de muerto','Chocolate','Paleta de caramelo','Gomitas','Palomitas','Pizza','Hot dogs','Calabaza en tacha','Churros','Atole','Elote','Esquites','Mazapán','Tamarindo','Pastel','Galletas','Ponche','Manzana acaramelada']
  }
};

/* ---------- Mímica: papelitos ---------- */
const MIMICA_CATEGORIAS = {
  monstruos: { nombre: '🧟 Monstruos', palabras: ['Vampiro','Hombre lobo','Momia','Zombi','Fantasma','Bruja en escoba','Frankenstein','Esqueleto bailando','Chupacabras','La Llorona','Payaso diabólico','Muñeco poseído','Gárgola','Calabaza viviente','Extraterrestre','Sirena','Duende travieso','Gato negro','Murciélago','Araña gigante','Hombre invisible','Monstruo del lago','Cíclope','Medusa'] },
  acciones: { nombre: '😱 Acciones de terror', palabras: ['Salir de un ataúd','Huir de un zombi','Tallar una calabaza','Pedir dulces','Escaparse de una telaraña','Ver una película de miedo','Escuchar un ruido raro','Prender una vela que se apaga','Hacer una poción','Volar en escoba','Desenterrar un tesoro','Ponerse un disfraz apretado','Tropezar en el panteón','Morder un cuello','Aullar a la luna','Leer un libro maldito','Esconderse debajo de la cama','Abrir una puerta que rechina','Bailar Thriller','Caer en un pozo','Comerse todos los dulces','Asustar a alguien','Atrapar un fantasma','Caminar como momia'] },
  peliculas: { nombre: '🎬 Películas y personajes', palabras: ['Coco','Hotel Transylvania','Los Locos Addams','Merlina bailando','Los Cazafantasmas','Scooby-Doo','Chucky','Freddy Krueger','Jason','Pennywise','Casper','El extraño mundo de Jack','Gremlins','King Kong','Tiburón','E.T.','Drácula','Beetlejuice','Harry Potter','Shrek','Monsters Inc.','Ghostbusters','El Exorcista','Psicosis'] },
  muertos: { nombre: '🌼 Día de Muertos', palabras: ['Poner el altar','Catrina elegante','Comer pan de muerto','Escribir una calaverita','Encender veladoras','Llevar flores al panteón','Mariachi esqueleto','Pintarse la cara de calavera','Desfile de muertos','Xoloitzcuintle','Papel picado','Tocar la guitarra como Miguel de Coco','Tomar chocolate caliente','Hacer tamales','Alebrije volador'] },
  animales: { nombre: '🦇 Animales tenebrosos', palabras: ['Murciélago','Búho','Cuervo','Lobo','Gato negro','Araña','Serpiente','Rata','Escorpión','Murciélago dormido','Tarántula','Sapo','Cucaracha','Lechuza','Polilla','Alacrán','Zopilote','Tiburón','Pulpo','Medusa'] }
};

/* ---------- Asesino del Pueblo: personajes ---------- */
const ALDEANOS = [
  'Don Chencho, el panadero que vende pan de muerto todo el año',
  'Doña Chona, la vecina chismosa que todo lo ve desde su ventana',
  'El sepulturero que le tiene miedo a la oscuridad',
  'Tía Cuca, que ya vio tres fantasmas esta semana',
  'El tamalero de las 7 de la noche',
  'El sacristán que toca las campanas a deshoras',
  'El niño que jura que vio al Chupacabras',
  'La señora de los 14 gatos negros',
  'El cartero que entrega cartas del más allá',
  'El mariachi desvelado que canta en el panteón',
  'La maestra de piano que solo toca canciones tristes',
  'El doctor del pueblo… de animales',
  'El presidente municipal que nunca está',
  'La abuelita que hace el mejor pozole del pueblo',
  'El taxista que siempre recoge a una señora de blanco',
  'La florista que vende cempasúchil',
  'El velador que se duerme en su turno'
];

/* ---------- Trivia de Terror ----------
   c = índice de la respuesta correcta (0-3) */
const TRIVIA = [
  { p: '¿De dónde viene originalmente la tradición de Halloween?', o: ['Estados Unidos','Irlanda (los celtas)','México','Francia'], c: 1, d: 'Viene del Samhain, una fiesta celta de hace más de 2,000 años en la que se creía que los muertos regresaban.' },
  { p: 'Antes de las calabazas, ¿qué tallaban los irlandeses para hacer sus linternas?', o: ['Sandías','Cocos','Nabos','Melones'], c: 2, d: 'Tallaban nabos y papas. Al llegar a América descubrieron que la calabaza era mucho más fácil de tallar.' },
  { p: '¿Quién escribió la novela "Frankenstein"?', o: ['Bram Stoker','Mary Shelley','Edgar Allan Poe','Stephen King'], c: 1, d: 'Mary Shelley la empezó con apenas 18 años, en un reto entre amigos para escribir historias de terror.' },
  { p: 'En la novela, ¿cómo se llama el monstruo creado por el Dr. Frankenstein?', o: ['Frankenstein','Igor','No tiene nombre','Boris'], c: 2, d: 'Frankenstein es el doctor. El monstruo nunca recibe nombre… ¡pero todos le decimos Frankenstein!' },
  { p: '¿De qué región venía el Conde Drácula?', o: ['Transilvania','Escocia','Siberia','Toscana'], c: 0, d: 'Transilvania es una región real de Rumania, famosa por sus castillos.' },
  { p: '¿Quién escribió "Drácula"?', o: ['Mary Shelley','Bram Stoker','Julio Verne','Oscar Wilde'], c: 1, d: 'Bram Stoker lo publicó en 1897.' },
  { p: 'Según la leyenda, ¿a quién busca La Llorona?', o: ['A sus hijos','A su esposo','Sus joyas','Su casa'], c: 0, d: '"¡Aaay, mis hijos!" Es una de las leyendas más antiguas de México.' },
  { p: '¿En qué ciudad está el famoso Callejón del Beso?', o: ['Puebla','Guanajuato','Oaxaca','Zacatecas'], c: 1, d: 'Dicen que si una pareja se besa en el tercer escalón tendrá 15 años de felicidad.' },
  { p: '¿Dónde está la tenebrosa Isla de las Muñecas?', o: ['Cozumel','Acapulco','Xochimilco','Isla Mujeres'], c: 2, d: 'Está en los canales de Xochimilco, llena de muñecas colgadas de los árboles.' },
  { p: '¿Qué flor es la más típica del Día de Muertos?', o: ['Rosa','Girasol','Cempasúchil','Tulipán'], c: 2, d: 'Su color y olor ayudan a guiar a las almas hacia el altar.' },
  { p: '¿Quién creó a la famosa Catrina (originalmente "La Calavera Garbancera")?', o: ['Diego Rivera','José Guadalupe Posada','Frida Kahlo','Rufino Tamayo'], c: 1, d: 'Posada la dibujó y Diego Rivera la bautizó como "Catrina" en uno de sus murales.' },
  { p: '¿Qué película de Pixar trata sobre el Día de Muertos?', o: ['Up','Coco','Luca','Ratatouille'], c: 1, d: 'Coco se estrenó en 2017 y ganó el Óscar a mejor película animada.' },
  { p: 'En "Coco", ¿cómo se llama el perro xoloitzcuintle de Miguel?', o: ['Pepita','Dante','Chilo','Firulais'], c: 1, d: 'Dante. ¡Su nombre es un homenaje al poeta que escribió sobre un viaje al inframundo!' },
  { p: 'En "Los Cazafantasmas" (1984), ¿qué monstruo gigante ataca Nueva York?', o: ['King Kong','Godzilla','El hombre de malvavisco','Un pastel gigante'], c: 2, d: 'El famoso "Stay Puft", un hombre de malvavisco del tamaño de un edificio.' },
  { p: 'Según las leyendas, ¿qué alimento ahuyenta a los vampiros?', o: ['Chile','Ajo','Cebolla','Limón'], c: 1, d: 'El ajo. Aunque en México quizá los espantaríamos mejor con chile habanero.' },
  { p: '¿Qué metal puede herir a un hombre lobo?', o: ['Oro','Cobre','Plata','Hierro'], c: 2, d: 'Una bala de plata, según las películas clásicas.' },
  { p: '¿Cuándo se transforma un hombre lobo?', o: ['En luna llena','En eclipse','Los martes','Cuando tiene hambre'], c: 0, d: '¡Auuuuuu!' },
  { p: '¿Qué significa "Trick or treat"?', o: ['Feliz noche','Dulce o truco','Dame dinero','Abre la puerta'], c: 1, d: 'En México muchos niños dicen: "¡Queremos Halloween!"' },
  { p: '¿En qué película una niña dice "Ya están aquí" frente a la televisión?', o: ['El Exorcista','Poltergeist','El Resplandor','Annabelle'], c: 1, d: 'Poltergeist (1982). Desde entonces nadie ve igual la estática de la tele.' },
  { p: '¿Cómo se llama el payaso de la película "It (Eso)"?', o: ['Pennywise','Krusty','Bozo','Chucky'], c: 0, d: 'Pennywise aparece cada 27 años en el pueblo de Derry.' },
  { p: '¿En qué hotel ocurre "El Resplandor"?', o: ['Hotel Transylvania','Hotel California','Hotel Overlook','Motel Bates'], c: 2, d: '"¡Aquí está Johnny!" El Overlook está inspirado en un hotel real de Colorado.' },
  { p: '¿Qué villano de terror usa un guante con navajas?', o: ['Jason','Freddy Krueger','Michael Myers','Chucky'], c: 1, d: 'Freddy Krueger te ataca… ¡en tus sueños!' },
  { p: '¿Qué tipo de máscara usa Jason Voorhees?', o: ['De payaso','De hockey','De luchador','De calabaza'], c: 1, d: 'Jason no usa la máscara de hockey sino hasta la tercera película.' },
  { p: '¿Cómo se llama el muñeco diabólico de "Child\'s Play"?', o: ['Annabelle','Chucky','Billy','Pinocho'], c: 1, d: 'Su nombre completo es Charles Lee Ray.' },
  { p: 'Según la tradición, ¿qué representan las "bolitas" del pan de muerto?', o: ['Lágrimas','Huesos','Piedras','Dulces'], c: 1, d: 'Representan los huesos, y la bolita de arriba es el cráneo.' },
  { p: '¿Qué es una "calaverita literaria"?', o: ['Un dulce de azúcar','Un verso que se burla de alguien como si ya se hubiera muerto','Un disfraz de esqueleto','Un libro de terror'], c: 1, d: 'Empezaron a publicarse en el siglo XIX para burlarse de los políticos.' },
  { p: 'En las leyendas mexicanas, ¿qué es un nahual?', o: ['Un fantasma de agua','Un brujo que se convierte en animal','Un tipo de tamal','Un duende de las cuevas'], c: 1, d: 'Dicen que se convierten en perros, coyotes, búhos… ¡o guajolotes!' },
  { p: '¿Cuál de estas NO es una película de terror?', o: ['El Conjuro','Mi pobre angelito','Annabelle','La Monja'], c: 1, d: 'Aunque para los ladrones de "Mi pobre angelito" sí fue de terror.' },
  { p: 'En "Scooby-Doo", ¿quién suele estar detrás del fantasma?', o: ['Un fantasma de verdad','Un extraterrestre','Una persona disfrazada','Scrappy-Doo'], c: 2, d: '"¡Y lo hubiera logrado si no fuera por esos chicos entrometidos!"' },
  { p: '¿Qué famoso mago escapista murió precisamente un 31 de octubre?', o: ['David Copperfield','Harry Houdini','Merlín','El Mago de Oz'], c: 1, d: 'Houdini murió el 31 de octubre de 1926 y prometió comunicarse desde el más allá… seguimos esperando.' },
  { p: '¿Qué director mexicano ganó el Óscar por "La forma del agua"?', o: ['Alfonso Cuarón','Guillermo del Toro','Alejandro G. Iñárritu','Luis Buñuel'], c: 1, d: 'Guillermo del Toro, de Guadalajara, también hizo "El laberinto del fauno".' },
  { p: 'En el video de "Thriller", ¿con quién baila Michael Jackson?', o: ['Vampiros','Zombis','Brujas','Esqueletos'], c: 1, d: 'Es uno de los videos musicales más famosos de la historia (1983).' },
  { p: '¿Qué animal acompaña tradicionalmente a las brujas?', o: ['Perro','Gato negro','Tortuga','Conejo'], c: 1, d: 'En la Edad Media se creía que las brujas podían convertirse en gatos negros.' },
  { p: '¿En qué ciudad mexicana hay un famoso Museo de las Momias?', o: ['Guanajuato','Monterrey','Mérida','Tijuana'], c: 0, d: 'Las momias de Guanajuato se formaron de manera natural por el tipo de suelo.' },
  { p: 'En "Los Locos Addams", ¿cómo se llama la mano que camina sola?', o: ['Manitas','Dedos','Garritas','Tito'], c: 1, d: 'En Latinoamérica se llama "Dedos"; en inglés es "Thing".' },
  { p: '¿Cómo se llama la hija de Los Locos Addams?', o: ['Morticia','Merlina','Lurch','Pericles'], c: 1, d: 'Merlina (Wednesday). ¡Y su baile se volvió viral!' },
  { p: '¿Cuántas patas tiene una araña?', o: ['6','8','10','12'], c: 1, d: 'Ocho patas… y muchas tienen ¡ocho ojos!' },
  { p: '¿Quién es el dueño del "Hotel Transylvania"?', o: ['Frankenstein','El Hombre Lobo','Drácula','La Momia'], c: 2, d: 'Drácula lo construyó para proteger a su hija Mavis.' },
  { p: '¿Cuál es el nombre del esqueleto protagonista de "El extraño mundo de Jack"?', o: ['Oogie Boogie','Jack Skellington','Zero','Sally'], c: 1, d: 'Jack es el Rey Calabaza de la Ciudad de Halloween.' },
  { p: '¿Qué se pone en el altar para que las almas no lleguen con sed?', o: ['Un vaso de agua','Refresco','Hielo','Una cubeta'], c: 0, d: 'El agua es para que las almas calmen su sed después del largo viaje.' },
  { p: '¿Cómo se llama el fantasma amigable de las caricaturas?', o: ['Casper','Slimer','Boo','Gasparín'], c: 0, d: 'Casper apareció por primera vez en los años 40.' },
  { p: '¿Qué director hizo "El extraño mundo de Jack" (como productor) y "Beetlejuice"?', o: ['Steven Spielberg','Tim Burton','George Lucas','James Cameron'], c: 1, d: 'Tim Burton es el rey de lo tétrico pero adorable.' },
  { p: 'En "Hocus Pocus" (Abracadabra), ¿cuántas hermanas brujas son?', o: ['Dos','Tres','Cuatro','Cinco'], c: 1, d: 'Las hermanas Sanderson: Winifred, Mary y Sarah.' },
  { p: '¿En qué fecha se celebra Halloween?', o: ['31 de octubre','1 de noviembre','2 de noviembre','13 de octubre'], c: 0, d: 'Halloween viene de "All Hallows\' Eve": la víspera de Todos los Santos.' }
];

/* ---------- Ruleta Maldita ---------- */
const RETOS = [
  'Camina como zombi hasta la puerta y regresa 🧟',
  'Haz tu mejor risa de bruja malvada 🧙',
  'Cuenta una historia de terror en 30 segundos ⏱️',
  'Imita a La Llorona: "¡Aaay, mis hijos!" 😭',
  'Habla como Drácula hasta tu próximo turno 🧛',
  'Baila "Thriller" durante 10 segundos 🕺',
  'Aúlla como hombre lobo a la luna 🐺',
  'Camina como momia alrededor de la mesa 🧻',
  'Inventa una calaverita literaria para la persona de tu derecha 💀',
  'Quédate congelado como estatua de museo embrujado por 20 segundos 🗿',
  'Haz reír a alguien sin tocarlo en 20 segundos 😂',
  'Di "Tres tristes tigres" con voz de fantasma 👻',
  'Canta un pedacito de una canción con voz de ultratumba 🎤',
  'Haz la cara más aterradora que puedas para una foto 📸',
  'Actúa cómo reaccionarías si vieras a un fantasma ahora mismo 😱',
  'Imita a un vampiro que descubre que la comida tiene ajo 🧄',
  'Presenta el noticiero: "Última hora, el Chupacabras atacó…" 📺',
  'Haz una pasarela de 10 segundos como modelo zombi 💃',
  'Da un discurso como si fueras el alcalde de la Ciudad de Halloween 🎩',
  'Haz el sonido de una puerta que rechina 🚪'
];
const VERDADES = [
  '¿Cuál es la película que más miedo te ha dado?',
  '¿Alguna vez has visto o escuchado algo que no puedas explicar?',
  '¿A qué le tienes miedo en secreto?',
  '¿Cuál ha sido tu peor disfraz?',
  '¿Quién de aquí sobreviviría más tiempo en una película de terror?',
  '¿Quién de aquí sería el primero en morir en una película de terror?',
  '¿Cuál es tu dulce favorito de Halloween?',
  'Cuenta la leyenda más tenebrosa que conozcas.',
  '¿Has dormido con la luz prendida por miedo? ¿Cuándo?',
  'Si fueras un monstruo, ¿cuál serías y por qué?',
  '¿Cuál es el susto más grande que te han dado?',
  '¿Qué es lo más vergonzoso que te ha pasado por gritar de miedo?',
  '¿A quién de aquí le confiarías tu vida en un apocalipsis zombi?',
  '¿Qué harías si un fantasma viviera en tu casa?',
  '¿Cuál es el mejor dulce que te han dado pidiendo "Queremos Halloween"?'
];
const CASTIGOS = [
  'Pierdes 1 punto 👻',
  'Hasta el siguiente juego, cada vez que hables empieza con "Muajajá" 😈',
  'Sirve algo de tomar a otra persona como mayordomo de mansión embrujada 🍷',
  'Tienes que hacer el siguiente reto que salga, quieras o no 🎡'
];

/* ---------- Concurso de Disfraces ---------- */
const CATEGORIAS_DISFRAZ = [
  '😱 El más aterrador',
  '😂 El más chistoso',
  '🎨 El más creativo',
  '💃 La mejor pasarela'
];
