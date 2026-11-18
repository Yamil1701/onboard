# Resultados Voyageurs

Página independiente en `/onboard/resultados/` (GitHub Pages añade la barra final). Reúne las expectativas iniciales, las cinco respuestas finales y las estrellas opcionales. El nombre, las decisiones del juego y las huellas no se envían a esta tabla.

## Servidor y acceso

Proyecto existente Chofer Utilities (`laraxhjvidedicozimsr`), función `voyageurs-surveys`, JWT del gateway habilitado y clave pública anon del sitio. Solo se agregan objetos `voyageurs_*`. Las tablas y RPC no tienen permisos para anon ni authenticated; RLS queda habilitado sin políticas públicas y solo Edge accede con `service_role`.

La página solicita un PIN. La comparación se hace en Edge contra un hash con sal privada en `voyageurs_results_access`; el PIN no se incluye en la web ni en este repositorio. Tras verificarlo, el servidor emite una sesión firmada HMAC, válida por una hora. El navegador la conserva en sessionStorage y la elimina al cerrar sesión. El endpoint de lectura rechaza solicitudes sin sesión o con firma o fecha inválidas. Se permiten ocho intentos de PIN por red en diez minutos; los contadores almacenan un hash de red, nunca la dirección original. CORS solo admite el sitio y el desarrollo local.

`schema.sql` registra el esquema de la migración `voyageurs_private_survey_results`. El hash del PIN se aprovisiona por separado mediante una escritura administrativa; no hay PIN por defecto ni ruta pública para cambiarlo.

## Envío

- Un UUID por visita enlaza encuesta inicial y final. La base hace upsert: reintentar no duplica y una expectativa tardía no borra una encuesta final ni sus estrellas.
- El servidor valida idiomas, opciones, cantidad exacta de respuestas y valoración de 1 a 5 o nula. El valor nulo se excluye del promedio.
- El frontend pone los envíos confirmados por el visitante en una cola local antes de intentar la red. Reintenta al recuperar conexión, volver a la pestaña o cada 30 segundos. Los errores no bloquean el viaje.
- Las decisiones sin confirmar no salen del dispositivo. Revivir no genera envíos nuevos. No se importan resultados históricos que solo estaban en otros navegadores.
- El panel obtiene agregados de todas las filas y las últimas 100 visitas anónimas. Permite actualizar y cerrar sesión.

## Comprobación

`node --test tests/*.test.ts`, `npm run build`. Comprobar además en el endpoint real: PIN correcto/incorrecto, lectura anónima denegada, sesión alterada denegada, tablas y RPC privadas, entrada inicial/final y reintento idempotente, rating nulo y respuestas inválidas. Eliminar únicamente los registros de prueba identificados al terminar.
