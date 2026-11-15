# Voyageurs, tous à bord !

Experiencia web bilingüe para la muestra de Práctica Docente IV del Profesorado de Francés. 30 de noviembre de 2026, 20 h, Profesorado Superior de Lenguas Vivas N.º 6007.

Repositorio: `Yamil1701/onboard`. El título de la experiencia queda en francés.

## Decisiones acordadas

La experiencia se abre desde un QR y se diseña primero para celular. Las seis paradas forman un recorrido guiado. Al aterrizar, la bitácora permite volver directamente a los trabajos, materiales y actividades. Las estaciones 1 y 4 conservan la numeración del stand. El selector AR / FR está siempre visible y conserva la parada, la lectura abierta y las respuestas al cambiar de idioma.

| Parada | Experiencia |
|---|---|
| Bienvenida | Un panel de aeropuerto introduce el destino mientras se prepara la primera escena. Ventanilla, pista nocturna, pase de embarque y sello al tocar Embarcar. La carga inicial termina cuando la escena puede mostrarse. Los documentos y videos se cargan al abrirlos. |
| Antes de despegar | Encuesta real de expectativas, dentro de la web. Una pregunta con tres opciones: adaptar una clase, participar del juego o llevarse ideas para la futura Práctica IV. |
| Pasaporte y materiales | Una carpeta de viaje abre el índice, el informe y los materiales de BSPA, Turismo y las demás exposiciones según estén disponibles. Vista de lectura tranquila dentro del sitio. Cerrar o usar Atrás devuelve al punto exacto. |
| ¿Confirmás o verificás? | Una decisión ante una duda en el aula revela la anécdota del litchi y lo que se aprendió al verificar. |
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

Incluye la bienvenida y la encuesta inicial. El nombre y la respuesta de prueba se conservan en la sesión del navegador. El envío usa almacenamiento de sesión y no tiene un servidor de encuestas conectado.

```sh
npm ci
npm run dev
npm run build
```

Usá Node.js 24. GitHub Actions compila y publica en [GitHub Pages](https://yamil1701.github.io/onboard/) al incorporar cambios a `main`.
