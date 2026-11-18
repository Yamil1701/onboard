# Mural Voyageurs

El mural usa el proyecto existente **Chofer Utilities** de **Yamil17**, ref `laraxhjvidedicozimsr`, seleccionado por el usuario. Solo se agregaron los objetos con prefijo `voyageurs_` y la función `voyageurs-wall`; no se modificaron tablas, datos, autenticación ni políticas de Chofer Utilities.

## Publicación y acceso

- Función: `https://laraxhjvidedicozimsr.supabase.co/functions/v1/voyageurs-wall`.
- JWT habilitado. `src/wall-config.json` contiene solamente la clave pública anon.
- La clave privilegiada se obtiene dentro de Edge desde las variables del entorno; nunca se copia al sitio.
- El frontend no tiene permisos directos sobre las tablas ni sobre la RPC. RLS está habilitado sin políticas públicas, intencionalmente; solo `service_role` accede desde la función.
- GET devuelve únicamente los mensajes aprobados en páginas de 40, con cursor de fecha e identificador, sin identificadores de solicitud ni hashes de red.
- POST normaliza y valida 2–160 caracteres. Rechaza insultos comunes en español, francés e inglés, enlaces, contactos, marcado y repeticiones. Retiene contenido enmascarado o alfabetos no previstos para revisión. Este filtro es una primera barrera, no una garantía de detección total.
- El servidor calcula un HMAC de la dirección de red para limitar a 20 solicitudes nuevas por minuto y red. No guarda la dirección original. El límite admite varias personas conectadas al mismo wifi de la muestra.
- Un UUID por navegador hace idempotentes los reintentos. La interfaz ofrece una huella por dispositivo, incluso después de reiniciar el recorrido; no es autenticación de personas.

`schema.sql` describe la estructura inicial. Los cambios siguientes se aplican como migraciones, sin recrear tablas existentes. Para desplegar Edge se incluyen `backend/voyageurs-wall/index.ts` y su dependencia relativa `src/wall-moderation.ts`, manteniendo las rutas. No hay dependencias remotas ni import map.

## Revisión del mural

En el [editor de tablas de Supabase](https://supabase.com/dashboard/project/laraxhjvidedicozimsr/editor), abrir `public.voyageurs_wall_entries` y filtrar `status = pending`.

- Cambiar a `approved` para publicar un mensaje revisado.
- Cambiar a `rejected` para ocultarlo. Se puede rechazar también un mensaje ya aprobado.
- Evitar publicar datos personales. El nombre del pase no se agrega a los mensajes.

El mural se actualiza al entrar al capítulo y después de publicar. «Ver más huellas» permite recorrer todas las páginas dentro del mural. Un fallo de red conserva el texto y permite reintentar con el mismo identificador, sin duplicar la huella. Los datos de prueba se marcan como rechazados al terminar la verificación.

## Recuerdos y audio

`src/souvenirs.ts` produce dos imágenes PNG en el dispositivo, sin enviar nombre ni reflexión al servidor. Usa las tipografías locales, la imagen de pista y la frase elegida en el cuaderno. Si el nombre está vacío usa una leyenda de viajero. El pasaporte incluye «Recuerdo escolar · Sin valor oficial».

Para agregar la grabación real: colocar un archivo en `public/`, completar `arrivalAudio.src` con su URL bajo la ruta del sitio (`import.meta.env.BASE_URL`) y las dos transcripciones en `src/arrival-config.ts`. El reproductor aparece solo si hay archivo configurado. Se inicia manualmente y se pausa al salir.

## Verificación

```sh
npm run build
node --test tests/wall-moderation.test.ts
git diff --check
```

También se comprueban contra la función desplegada: lectura pública, publicación, reintento idempotente, cola pendiente invisible, rechazo de lenguaje/contactos, y denegación del acceso directo con clave anon. La llegada guarda el avance, permite omitir la animación y respeta el movimiento reducido. Las encuestas siguen siendo locales a la sesión; el mural es la única escritura centralizada agregada en esta entrega.
