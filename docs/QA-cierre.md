# Revisión del cierre por capítulos

Fuente visual: el diseño existente aprobado de Voyageurs, con su paleta nocturna, papel crema, portadocumentos de apertura izquierda y las imágenes locales. Se aplicaron los cambios de estructura y tipografía solicitados; no se introdujo otra identidad visual.

| Revisión | Resultado |
|---|---|
| Tipografía | PT Serif en preguntas, respuestas, títulos, confirmaciones y cierre. Se eliminaron las dos fuentes de exhibición anteriores y su carga. |
| Encuesta 5 | Cinco preguntas y tres opciones por pregunta. Opciones declarativas en ambos idiomas; pregunta 4 sin repetición y tratamiento francés coherente. |
| Valoración | Cinco estrellas y pregunta centradas; «Opcional» discreto. Sin opción cero ni botón de limpiar. Los ceros de sesiones antiguas se interpretan como sin calificar. |
| Materiales | Interior y bordes más livianos. Acceso explícito a la parada 4; la previa cinematográfica del cuaderno es opcional. En la primera visita el avance queda disponible al pie de la pantalla. |
| Llegada | Relato con tres momentos al desplazar, recuerdos secuenciales con imágenes reales y un capítulo independiente para el mural. No se fuerza el desplazamiento. |
| Recuerdos | Vista previa y descarga usan la misma imagen, nombre y reflexión. Se inspeccionó un PNG en francés con nombre y frase larga. |
| Menú | Cierre del pasaporte y acceso a cinco partes. No ofrece encuestas ni nuevas publicaciones de huellas. Conservado al recargar; acceso rápido al menú durante la exploración. |
| Audio | Espacio visible para la grabación pendiente; sin audio ficticio. Efectos de interfaz sintetizados localmente después de una interacción. Botón de silencio persistente, con etiqueta AR/FR. |
| Mural | Texto anónimo escrito con textContent, cola de moderación conservada y formulario oculto al recibir una huella. Notas intercaladas en área con desplazamiento; páginas de 40 mediante cursor. |
| Tamaños | Navegador a 1363 × 936 y aplicación dentro de un viewport real de iframe de 390 × 844, sin desbordamiento horizontal. La página auxiliar temporal se retira de la entrega. |

## Pruebas

- Compilación TypeScript/Vite completada y cinco pruebas nativas Node aprobadas (moderación y estructura/redacción de la encuesta).
- Recorrido nuevo con nombre: embarque, expectativas, despegue, continuación directa a la práctica sin previa, tres situaciones, reflexión, encuesta final y llegada.
- Confirmación con botones ordenados; cinco estrellas centradas; fuente de la confirmación verificada mediante estilo calculado.
- Vista previa descargada, cambio AR/FR y personalización del recuerdo; cierre al menú, recarga y regreso a materiales sin enlaces a encuestas.
- Prueba en viewport de 390 px de recuerdos, mural, cierre, menú, acceso rápido y portadocumentos.
- API del mural: páginas válidas 200 y cursor inválido 400. Se mantienen JWT, permisos de tablas y validación de publicaciones del servidor. No se crearon mensajes públicos para decorar el mural.
- Los errores observados en consola corresponden a la extensión del navegador de pruebas. No se observaron errores de la aplicación en esos recorridos.

## Límites concretos

La grabación de Cyntia sigue pendiente. Las encuestas conservan su almacenamiento de sesión; el mural usa el servidor compartido. El filtro de lenguaje sigue siendo una primera barrera y requiere revisar los mensajes pendientes. La revisión estrecha verifica el diseño a 390 px, sin sustituir pruebas táctiles en un dispositivo físico. Las notas intercaladas se poblarán con mensajes reales aprobados; el estado vacío no simula visitantes.

## Revisión siguiente: audio, dos hojas y modo revivir

La primera encuesta conserva las intenciones originales de sus tres opciones. En la corrección posterior se restauran las tarjetas previas y se mejora su redacción. Las envolventes de audio tienen pruebas de cobertura de toda la aceleración, ascenso, transición final y aterrizaje. Las notas iniciales del mural son editoriales y están rotuladas como bienvenida. «Revivir» es una rama temporal: no escribe respuestas en la sesión original ni ejecuta POST para la huella.

Comprobación alojada de esta revisión: ambas hojas muestran solo sus contenidos; la repetición recorrió expectativas, tres situaciones y cinco respuestas temporales, aterrizaje y huella de prueba. Al terminar reaparecieron el nombre y la frase originales. La huella temporal se cierra con confirmación sin publicarse. La postal descargada fue inspeccionada con acuarela, sellos AR/FR y texto legible. En el navegador no se observaron errores de la aplicación; los errores de extensión siguen siendo ajenos al sitio.

## Corrección de escritura y scroll del mural

El sonido de firma usa un recorte de una grabación de lapicera sobre papel (CC0; origen y tratamiento en `src/assets/pen-writing-LICENSE.md`). Se reemplazaron los cinco pulsos sintéticos; si el archivo no carga hay un roce continuo sin golpeteos. Se restauraron las tarjetas y radios del diseño anterior de la primera encuesta y se ajustaron las tres frases, conservando sus intenciones e identificadores. El mural conserva su scroll interno y usa encadenamiento nativo (`overscroll-behavior-y: auto`) para que el desplazamiento continúe en la página al alcanzar sus límites.

## Resultados y cierre encadenado

El cierre mantiene su capa opaca hasta mostrar el menú; el pasaporte cierra, sube y sale girando por abajo. El del menú entra con caída y rebote. Las encuestas y estrellas confirmadas se envían a una función propia, con upsert por UUID y cola local de reintentos. El panel `/onboard/resultados/` valida el PIN en Edge y utiliza sesiones HMAC de una hora. Las tres tablas nuevas tienen RLS y ningún permiso público; la lectura anónima se rechaza. Los mensajes aceptados por el filtro del mural se autopublican y los dudosos se rechazan, sin cola manual nueva. Diez pruebas Node aprobadas y compilación TS/Vite completa.

Verificación alojada: lectura sin sesión 401, PIN incorrecto 401, PIN correcto con sesión firmada 200, sesión alterada 401, respuestas inválidas 422 y acceso directo a tablas denegado. Enviar expectativa, completar encuesta y reintentar la expectativa conserva una sola visita completa y su valoración. El recorrido real de navegador confirmó recepción de cinco respuestas y cinco estrellas; iniciar Revivir y responder no cambió el total. Se verificó el menú publicado, su pasaporte y la frase revisada. El ingreso visual por PIN se deja al usuario; el flujo del PIN y sus agregados sí se verificaron directamente contra la API real. Los registros de prueba identificados se retiran del panel.
