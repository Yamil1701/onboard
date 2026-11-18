# Voyageurs, tous à bord !

Experiencia web bilingüe para la muestra de Práctica Docente IV del Profesorado de Francés. 30 de noviembre de 2026, 20 h, Profesorado Superior de Lenguas Vivas N.º 6007.

Repositorio: `Yamil1701/onboard`. El boleto muestra el título en el idioma activo.

## Decisiones acordadas

La experiencia se abre desde un QR y se diseña primero para celular. Las seis paradas forman un recorrido guiado. Al aterrizar, la bitácora permite volver directamente a los trabajos, materiales y actividades. Las estaciones 1 y 4 conservan la numeración del stand. El selector AR / FR está siempre visible y conserva la parada, la lectura abierta y las respuestas al cambiar de idioma.

| Parada | Experiencia |
|---|---|
| Bienvenida | Un panel de aeropuerto introduce el destino mientras se prepara la primera escena. Ventanilla, pista nocturna, pase de embarque y sello al tocar Embarcar. La carga inicial termina cuando la escena puede mostrarse. Los documentos y videos se cargan al abrirlos. |
| Antes de despegar | Encuesta real de expectativas, dentro de la web. Una pregunta con tres opciones: adaptar una clase, participar del juego o llevarse ideas para la futura Práctica IV. |
| Pasaporte y materiales | Un portadocumentos de viaje reúne el informe en PDF, las fichas de BSPA y Turismo y el archivo de trabajos. El informe y las galerías se abren dentro del sitio. Cerrar o usar Atrás devuelve al punto de partida. |
| ¿Confirmás o verificás? | El cuaderno de a bordo abre una página de las prácticas. Una transición de libro a escena de aula sitúa al visitante dentro de ese recuerdo. Las decisiones recuperan la anécdota del litchi y lo aprendido al verificar. |
| Antes de aterrizar | Cinco preguntas sobre expectativas, presentaciones, materiales, aplicación a la futura práctica y aprendizaje personal. Avance visible, revisión y envío dentro del recorrido. |
| Llegada | Descenso suave, reflexión, sello final y despedida. Después, pasaporte y postal personales en PNG y un mural anónimo compartido, con moderación en el servidor. |

## Pasaporte personal y encuestas

El nombre opcional se escribe sobre el pase de embarque y se conserva en la sesión. La llegada genera un pasaporte escolar y una postal en PNG, con ese nombre y la reflexión elegida en el cuaderno. Se pueden guardar sin publicar ningún dato personal.

Las encuestas inicial y final y las estrellas se envían de forma anónima al servidor. `/onboard/resultados/` reúne sus totales con acceso por PIN validado en el servidor. El nombre y las decisiones del cuaderno siguen en la sesión local. La cola de envíos reintenta sin duplicar visitas; el modo revivir no genera resultados. Ver [backend/voyageurs-surveys/README.md](backend/voyageurs-surveys/README.md).

El mural de la llegada sí se comparte entre visitantes mediante una función de Supabase. Recibe solo el mensaje anónimo, su idioma y un identificador aleatorio para evitar duplicados. El nombre del pasaporte no se envía. La moderación se repite en el servidor y el contenido dudoso se rechaza para reformularlo; todo mensaje aceptado se publica automáticamente. La configuración y las instrucciones para revisar el mural están en [backend/voyageurs-wall/README.md](backend/voyageurs-wall/README.md).

La grabación de Cyntia aún no fue entregada. El cierre presenta una reflexión escrita basada en el cuaderno. Para habilitar el audio real y su transcripción se completa `src/arrival-config.ts`; no hay voz sintética ni reproducción automática.

## Dirección visual y técnica

- Avión y pista con capas 2D. GSAP para el sello y las transiciones principales.
- La ruta y el avión indican el avance. El lector desacelera la experiencia: fondo quieto, lectura cómoda y regreso claro. PDF.js es la primera opción a probar con el PDF real en Safari móvil y Chrome Android. Usar HTML para los contenidos que se beneficien de una lectura adaptada.
- Mantener el alcance de una implementación inicial breve. Escritorio queda para después de cerrar el recorrido móvil. Definir alojamiento, recepción de encuestas y materiales definitivos durante el diseño.

## Entrega para Work o Codex

1. Completar el storyboard móvil con estados de carga, teclado abierto, sello, despegue y encuesta. Elegir dos o tres referencias y anotar qué tomar de cada una.
2. Encargar una primera entrega acotada: introducción, bienvenida, renglón opcional del nombre y transición al voto. Pedir una vista previa funcional y una grabación corta en tamaño móvil. Verificar el embarque con y sin nombre y el cambio de idioma durante el recorrido.
3. Con la dirección visual aprobada, incorporar la carpeta y probar abrir un documento y volver al mismo lugar. Luego completar las encuestas reales, la actividad, la llegada y la bitácora.
4. Para cada entrega, adjuntar los fotogramas aprobados, el texto bilingüe y los comportamientos esperados. Registrar las decisiones visuales pendientes antes de implementarlas. El próximo encargo termina en la primera vista previa móvil.

## Vista previa móvil

El pasaporte lleva a «Antes de despegar». Al guardar la respuesta aparece «Despegar», que inicia el vuelo y abre «Pasaporte y materiales». Se puede leer el informe y recorrer el archivo bilingüe de trabajos. El cuaderno integrado al portadocumentos abre la parada 4, «¿Confirmás o verificás?», como un recuerdo de las prácticas. La foto permanece quieta con la invitación «¿Listo para ser profe por un momento?» hasta tocar «Continuar», también con movimiento reducido. Incluye las tres situaciones del informe, consulta de apoyos, una respuesta para compartir, la anécdota real, una reflexión personal y el sello de las estaciones 1 y 4. Después del sello se abre la parada 5, «Antes de aterrizar», con cinco preguntas, regreso a la anterior, revisión editable y confirmación. La parada 6 cierra el vuelo con una breve llegada cinematográfica, omisible y respetuosa del movimiento reducido. La despedida precede a un botón que revela los recuerdos y el mural, sin avanzar automáticamente.

Las preguntas de cierre de `src/final-survey-copy.ts` recuperan la versión bilingüe de la conversación del 15/11, asociada al mensaje de Tía Mimi del 14/11 a las 21:30. Sus opciones se conservan. El selector de idioma y la recarga mantienen respuestas, pregunta y revisión; el enlace en materiales permite retomar la parada 5 después de visitarla o completar el cuaderno. Se recuerda la expectativa inicial al comenzar la encuesta. La finalización conserva el avance en la sesión y envía las respuestas anónimas al servidor; la confirmación indica si el envío está recibido o pendiente.

El nombre, la encuesta inicial y las decisiones de la actividad se conservan en la sesión del navegador. Recargar o cambiar de idioma conserva el avance. La línea del viaje conserva la parada más avanzada, aunque se cierre el cuaderno para revisar materiales. Los textos de `src/workshop-copy.ts` adaptan el informe, págs. 4 y 7–8. Las escenas de aula y del litchi son imágenes ilustrativas creadas para la web. El avance usa almacenamiento de sesión y las encuestas confirmadas tienen un envío centralizado independiente. «Reiniciar» vuelve al inicio y limpia los datos de esta visita, conservando el idioma.

PT Serif se aloja localmente para los textos de lectura, con su licencia en `src/assets/fonts/`. PT Serif también se usa en todos los títulos y confirmaciones. El cambio AR/FR conserva el estado y mueve el indicador del selector, con banderas decorativas y foco visible para teclado.

Fotos y PDF aceptan gestos horizontales sobre la imagen o la hoja, además de sus botones. `src/page-swipes.ts` filtra movimientos cortos, diagonales, desplazamientos verticales y gestos con varios dedos. En PDF, la navegación gestual se suspende al ampliar la hoja o la vista del navegador, para permitir desplazar y ampliar el documento.

```sh
npm ci
npm run dev
npm run build
```

Usá Node.js 24. GitHub Actions compila y publica en [GitHub Pages](https://yamil1701.github.io/onboard/) al incorporar cambios a `main`.

## Archivo de trabajos

Cada colección vive en `src/archive-data.json`. Tiene un título por idioma y una lista ordenada de imágenes con sus leyendas. Las imágenes WebP van en `public/materiales/archivo/<colección>/`. El resumen y el paginador calculan sus totales a partir de la lista. Para agregar una colección se usa un identificador breve en minúsculas y se agrega su imagen `portada.webp` junto a los demás archivos de la colección.

Las 71 láminas recibidas están en el archivo temático, incluyendo el cuadro y las tres versiones de tarjetas de artículos partitivos. Los espacios de BSPA y Turismo esperan las versiones definitivas de sus materiales de presentación.

La revisión final agrupa las cinco respuestas en filas editables con lápiz. Antes de confirmar ofrece cinco estrellas centradas y opcionales. La valoración elegida se conserva al cambiar de idioma y recargar. Las preguntas de ambas encuestas usan PT Serif; toda la interfaz usa la misma familia legible. La foto del aula solo se usa como previa, antes de la actividad.

## Cierre y exploración

Materiales ofrece un botón visible para continuar a la parada 4 sin abrir la previa del cuaderno. El cuaderno mantiene su entrada cinematográfica opcional. El portadocumentos conserva su bisagra izquierda con bordes, sombras e interior más livianos.

La llegada tiene tres capítulos: despedida con aparición progresiva al desplazar, dos recuerdos con vistas previas reales y descarga, y el mural anónimo. El audio de Cyntia tiene un espacio visible identificado como próximo; no se simula una grabación. Las notas se intercalan dentro de un área con desplazamiento y carga por páginas. Publicar una huella cierra su formulario; todo mensaje aceptado por el filtro se publica inmediatamente.

«Terminar viaje» cierra el pasaporte, lo eleva y lo deja caer girando. Mantiene el fondo opaco hasta el cambio al menú, donde el pasaporte cae y rebota en su lugar. Se pueden repetir pasaporte, despegue, materiales, actividad y despedida/recuerdos, sin reabrir encuestas ni publicar nuevas huellas. La recarga conserva el cierre y el acceso al menú.

Los sonidos de interfaz, papel, sellos, vuelo y cierre se sintetizan localmente con Web Audio, a volumen discreto. Empiezan solo después de una interacción; el botón junto a AR/FR silencia inmediatamente todo el sonido y conserva la preferencia. El audio real también respeta ese silencio. Las animaciones respetan movimiento reducido y el desplazamiento es nativo.

## Audio y segunda visita

El primer toque en «Comenzar el viaje» inicia el cartel de letras con su claqueteo y habilita el audio según las reglas del navegador. El pasaporte aparece con un woosh, terminar de editar el nombre produce un trazo de lapicera y el sello tiene impacto grave y textura de papel. Turbinas y viento comparten un diseño sonoro y cubren todo el despegue y aterrizaje; las fases se declaran en `src/flight-timing.ts`. Silenciar regula el canal maestro sin congelar el reloj de la cinemática.

El portadocumentos conserva su fondo y se divide en dos hojas: informe/BSPA/Turismo y cuaderno/archivos. Un botón explícito cambia de hoja; continuar a la parada 4 queda en el flujo normal debajo del portadocumentos. La nueva ruta diferencia el avance recorrido de la ubicación actual del avión.

La postal usa una acuarela de Salta y París como marca de agua y dos estampillas ilustrativas de AR/FR. La cubierta sin fondo se comparte entre el inicio, el recuerdo que se abre, el cierre y el menú. Las tres notas editoriales del mural están identificadas como notas de bienvenida; no simulan visitantes.

El enlace discreto «Revivir el viaje» reinicia una visita temporal. En este modo el guardado de sesión no reemplaza la visita original y el formulario de la huella no llama al servidor ni actualiza su identificador local. Al terminar, se restaura el recorrido original y su menú. Recargar también recupera la visita original. Las encuestas de la primera visita se reúnen en el panel privado de resultados.

La ilustración y el recorte fueron creados con el generador de imágenes integrado. Los assets listos para web están en `src/assets/postcard-watermark.webp` y `src/assets/passport-cutout.webp`. El arte conecta arquitectura de Salta, Andes y viñedos con París, en acuarela y tinta suave sobre transparencia. El recorte conserva la cubierta azul y dorada y elimina el blanco exterior.

La firma usa ahora una grabación breve de lapicera sobre papel bajo CC0, con su origen documentado junto al archivo. El mural permite el encadenamiento del scroll hacia la página al alcanzar sus límites.

## Vista previa al compartir

El HTML inicial incluye título, descripción e imagen Open Graph y Twitter Cards sin depender de JavaScript. La portada local `/social/voyageurs-preview.jpg` mide 1200 × 630 y usa el pasaporte y la pista del proyecto. Canonical y `og:url` apuntan al enlace limpio `https://yamil1701.github.io/onboard/`. Los servicios de chat deciden la presentación final y pueden conservar una vista anterior en caché.

## Actualización del archivo de trabajos

La lámina de carnes usa la versión con nombres. «Etapas de la vinificación» reemplaza el título anterior. La colección de partitivos reúne el cuadro de negación y las tarjetas roja, blanca y azul; su portada muestra las propias tarjetas. Un acceso independiente dentro de Archivos de trabajo abre cuatro recursos digitales: LearningApps, Quizlet, el video de YouTube de la secuencia y el reel de Instagram indicado por Cyntia. Todos abren una pestaña nueva y conservan el recorrido. Los espacios de BSPA y Turismo permanecen pendientes y sin cambios.

Los dos QR recibidos como Wordwall y video apuntan a la misma URL de YouTube. Se conserva ese video una sola vez; el enlace real de Wordwall queda por recibir. Las capturas de QR y sus anuncios del visor no se publican como láminas.
