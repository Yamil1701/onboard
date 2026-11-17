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
| Última estación | Cinco preguntas sobre expectativas, presentaciones, materiales, aplicación a la futura práctica y aprendizaje personal. Avance visible, revisión y envío dentro del recorrido. |
| Llegada | Regreso a la ventanilla, sello final y pausa antes de ofrecer el recuerdo, la bitácora y el canal de WhatsApp posterior a la experiencia. El cierre visual se afina después de probar el resto. |

## Pasaporte personal y encuestas

Propuesta de interacción: tocar el renglón «Nombre y apellido» sobre el propio pase. Es un campo de texto real, integrado al papel, con etiqueta visible y teclado nativo. Un solo campo, editable, sin separar ni normalizar nombres. «Embarcar» funciona aunque se deje en blanco. Al aterrizar, la acción «Guardar mi pase» genera un PNG limpio del boleto con su sello y, si se escribió, el nombre.

Los formularios propios son las preguntas y opciones dibujadas como parte de la escena. Por ejemplo, la encuesta inicial puede ser una tarjeta con tres opciones grandes que se marcan al tocar. Detrás, un servicio mínimo recibe las respuestas para que el equipo pueda consultarlas. El nombre se reutiliza sin pedir que se escriba otra vez. Propuesta: mostrarlo al enviar y dejar que la persona elija si quiere adjuntarlo. Conservar las respuestas ante un error de conexión y permitir reintentar sin duplicarlas.

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

El pasaporte lleva a «Antes de despegar». Al guardar la respuesta aparece «Despegar», que inicia el vuelo y abre «Pasaporte y materiales». Se puede leer el informe y recorrer el archivo bilingüe de trabajos. El cuaderno integrado al portadocumentos abre la parada 4, «¿Confirmás o verificás?», como un recuerdo de las prácticas. La foto permanece quieta con la invitación «¿Listo para ser profe por un momento?» hasta tocar «Continuar», también con movimiento reducido. Incluye las tres situaciones del informe, consulta de apoyos, una respuesta para compartir, la anécdota real, una reflexión personal y el sello de las estaciones 1 y 4. Después del sello se abre la parada 5, «Última estación», con cinco preguntas, regreso a la anterior, revisión editable y confirmación. La parada 6 sigue prevista.

Las preguntas de cierre de `src/final-survey-copy.ts` recuperan la versión bilingüe de la conversación del 15/11, asociada al mensaje de Tía Mimi del 14/11 a las 21:30. Sus opciones se conservan. El selector de idioma y la recarga mantienen respuestas, pregunta y revisión; el enlace en materiales permite retomar la parada 5 después de visitarla o completar el cuaderno. Se recuerda la expectativa inicial al comenzar la encuesta. La finalización conserva los resultados en la sesión, sin afirmar un envío al servidor.

El nombre, la encuesta inicial y las decisiones de la actividad se conservan en la sesión del navegador. Recargar o cambiar de idioma conserva el avance. La línea del viaje conserva la parada más avanzada, aunque se cierre el cuaderno para revisar materiales. Los textos de `src/workshop-copy.ts` adaptan el informe, págs. 4 y 7–8. Las escenas de aula y del litchi son imágenes ilustrativas creadas para la web. El envío usa almacenamiento de sesión y no tiene un servidor de encuestas conectado. «Reiniciar» vuelve al inicio y limpia los datos de esta visita, conservando el idioma.

PT Serif se aloja localmente para los textos de lectura, con su licencia en `src/assets/fonts/`. Noto Serif Display se usa en los títulos. El cambio AR/FR conserva el estado y mueve el indicador del selector, con banderas decorativas y foco visible para teclado.

Fotos y PDF aceptan gestos horizontales sobre la imagen o la hoja, además de sus botones. `src/page-swipes.ts` filtra movimientos cortos, diagonales, desplazamientos verticales y gestos con varios dedos. En PDF, la navegación gestual se suspende al ampliar la hoja o la vista del navegador, para permitir desplazar y ampliar el documento.

```sh
npm ci
npm run dev
npm run build
```

Usá Node.js 24. GitHub Actions compila y publica en [GitHub Pages](https://yamil1701.github.io/onboard/) al incorporar cambios a `main`.

## Archivo de trabajos

Cada colección vive en `src/archive-data.json`. Tiene un título por idioma y una lista ordenada de imágenes con sus leyendas. Las imágenes WebP van en `public/materiales/archivo/<colección>/`. El resumen y el paginador calculan sus totales a partir de la lista. Para agregar una colección se usa un identificador breve en minúsculas y se agrega su imagen `portada.webp` junto a los demás archivos de la colección.

Las 67 láminas recibidas están en el archivo temático. Los espacios de BSPA y Turismo esperan las versiones definitivas de sus materiales de presentación.
