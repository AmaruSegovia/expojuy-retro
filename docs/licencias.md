# Licencias

Las bases del concurso descalifican por usar material sin licencia. Este
archivo registra de dónde sale cada recurso de terceros que el sitio usa o
distribuye, con la licencia **leída del propio paquete o repositorio**, no
supuesta.

Verificado el 14 de septiembre de 2026.

## Recursos que no son de terceros

| Recurso | Situación |
| --- | --- |
| Isologotipo, logotipo y tipografía Ambit | Propiedad de la Cámara de Comercio Exterior de Jujuy. Están para compilar la propuesta, no para redistribuir |
| Íconos de notificación (`/notificaciones/icono`, `/notificaciones/insignia`) | Se generan en el build desde la geometría oficial del isologotipo. No son archivos aparte |
| QR de la entrada digital | Lo aportó el equipo para la demo. Decodificado y verificado: codifica `https://expojuy-retro.vercel.app/` de forma directa, sin redirección intermedia ni marca de agua |
| Fotografías e imágenes | No se usan fotografías de banco de imágenes ni imágenes generadas por IA |

## Dependencias de ejecución

Las que viajan en el sitio publicado. Licencia tomada de su `package.json`.

| Paquete | Versión | Licencia |
| --- | --- | --- |
| next | 16.3.4 | MIT |
| react, react-dom | 19.2.8 | MIT |
| lenis | 1.3.26 | MIT |
| lucide-react | 1.41.0 | ISC |
| clsx | 2.1.1 | MIT |
| tailwind-merge | 3.6.0 | MIT |
| web-push | 3.6.7 | **MPL-2.0** |

### web-push y la MPL-2.0

`web-push` es la única dependencia que no tiene licencia permisiva. La MPL-2.0
es una licencia de código abierto aprobada por la OSI, con copyleft **a nivel
de archivo**: obliga a publicar los cambios que se hagan a los archivos de la
propia librería, no al código que la usa. El sitio la usa como dependencia, sin
modificarla, y solo en el servidor (`src/shared/lib/push/enviar-notificacion.ts`).

Aviso del paquete:

```
Copyright 2015 Marco Castelluccio

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at http://mozilla.org/MPL/2.0/.
```

Si algún día hubiera que parchear la librería, ese parche se publica bajo
MPL-2.0. Mientras se use tal cual, no hay nada que hacer.

Sus dependencias transitivas, verificadas con `pnpm licenses list --prod`:

| Paquete | Licencia |
| --- | --- |
| agent-base, asn1.js, bn.js, debug, http_ece, https-proxy-agent, jwa, jws, minimist, ms, safe-buffer, safer-buffer | MIT |
| inherits, minimalistic-assert | ISC |
| buffer-equal-constant-time | BSD-3-Clause |
| ecdsa-sig-formatter | Apache-2.0 |

## Dependencias de desarrollo

No viajan en el sitio publicado. La que se agregó para las notificaciones es
`@types/web-push` 3.6.4, licencia MIT.

## Íconos de redes: Tabler Icons

Los trazados de `src/shared/components/ui/icono-red.tsx` son de Tabler Icons,
copiados sin modificar. Aviso transcrito del repositorio oficial:

```
MIT License

Copyright (c) 2020-2026 Paweł Kuna

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Íconos de interfaz: Lucide

Los íconos de la interfaz vienen de `lucide-react`, licencia ISC. Parte de sus
íconos derivan de Feather (MIT, Cole Bemis); los dos avisos completos están en
`node_modules/lucide-react/LICENSE` y viajan con el paquete.

```
ISC License

Copyright (c) 2026 Lucide Icons and Contributors

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
```

## Al agregar algo

1. Leer la licencia del paquete o del repositorio, no de un resumen.
2. Si no es MIT, ISC, BSD o Apache, plantearlo antes de instalar.
3. Revisar las dependencias transitivas con `pnpm licenses list --prod`.
4. Anotarlo acá en el mismo commit que lo agrega.
