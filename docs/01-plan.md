# Plan y checklist — ExpoJuy 2026

> Documento de contexto. Ver también `02-estado.md` (dónde estamos) y
> `03-pendientes.md` (qué falta antes de entregar).

## Qué se entrega

Propuesta para la **Primera Edición del Programa Provincial de Desafíos
Tecnológicos**. Equipo Retro, tres integrantes: cada uno hace su prototipo y
después juntan lo mejor. Esto es el prototipo de Leandro.

| Entregable | Estado |
| --- | --- |
| Mockup / prototipo navegable | ✅ https://expojuy-prototipo.vercel.app |
| Memoria descriptiva (PDF) | ✅ `docs/propuesta/memoria-descriptiva-purple.html` → exportar con Ctrl+P |
| Explicación conceptual de la propuesta | ✅ integrada en la memoria (portada y §01/§03) |
| Tecnologías previstas | ✅ memoria §05 + README |
| Declaración de uso de IA | ✅ `docs/propuesta/declaracion-ia-purple.html` → exportar con Ctrl+P |

**Cierre: martes 8 de septiembre de 2026, 23:59.**

La memoria descriptiva debe cubrir: concepto general, objetivos, organización
del contenido, criterios de diseño, tecnologías, estrategia de accesibilidad,
estrategia responsive y uso previsto de IA.

## Fases

| Fase | Qué | Estado |
| --- | --- | --- |
| 0 | Setup: Next 16, Tailwind 4, pnpm, arquitectura, CI, Vercel | ✅ |
| 1 | Sistema de diseño trazable | ✅ |
| 2 | Shell: nav, footer, loader, progreso, volver arriba | ✅ |
| 3 | Secciones de contenido | ✅ 10 de 10 |
| 4 | Responsive + accesibilidad (Lighthouse ≥ 90) | ✅ móvil 93 · escritorio 99, resto 100 |
| 5 | Deploy final | ✅ (automático en cada push) |
| 6 | Memoria descriptiva en PDF + docs de uso de IA | ✅ HTML imprimibles en `docs/propuesta/` |

## Checklist de secciones

El orden es el de `NAV_SECTIONS` en `src/shared/constants/site.ts`, que
gobierna tanto el menú como el orden en la página. El copete numerado de cada
sección es su posición en esa lista.

**Sponsors no está en `NAV_SECTIONS` a propósito**, y por eso va al final y sin
número: es crédito institucional, no un destino al que alguien navegue. La
invariante —una sección lleva número si y solo si está en la nav— está escrita
en el propio `site.ts`. Medido: la barra de escritorio deja 80px de holgura a
1024px y un décimo ítem mide 91, así que tampoco entraba.

- [x] **Inicio** — hero a sangre completa, video de fondo, rotador 3D de pares, dos CTA
- [x] **Sobre ExpoJuy** — slider circular de 4 ejes con asomo del 10%
- [x] **Agenda** — timeline con línea SVG que aparece al scrollear; imagen y texto de un lado, fecha/hora/expositor del otro
- [x] **Expositores** — bento de tres columnas que se deslizan en bucle infinito
      (izquierda y derecha suben, la del medio baja), con la tarjeta ocupando dos
      módulos de la ventana —se ve una entera y la mitad de la siguiente—, imagen
      a sangre con el texto superpuesto y control de pausa. En móvil es una sola columna hacia arriba
      que además se puede arrastrar con el dedo en los dos sentidos
- [x] **Mapa** — plano esquemático del predio, derecho y vertical, con 9 lugares
      señalizados y el recorrido SVG que se dibuja desde el acceso al elegir uno.
      Un cuarto plano, tres cuartos riel de lugares con asomo del 10%
- [x] **Entradas** — mitad píldoras y mitad collage de tres visuales inclinados,
      con el riel infinito de medios de pago abajo, alineado al ancho de 1024px
      y con los bordes desvanecidos. Las píldoras son PESTAÑAS de verdad
      —`tablist`/`tab`/`tabpanel` con tabindex rotante y flechas— y muestran
      TRES TIPOS DE ENTRADA con precio, no métodos de pago: el riel de abajo ya
      cubre los medios, y las dos cosas juntas decían lo mismo. Los tres paneles
      se sirven visibles y los pliega el CSS detrás de `.js`. "Comprar" abre un
      formulario de pago ILUSTRATIVO en un `<dialog>` nativo: no simula un
      checkout, dice qué iría en su lugar y lo declara con un estado vacío
- [x] **Noticias** — slider horizontal de 6 tarjetas con asomo del 10%, puntos y
      flechas. Imagen a sangre con tema, título, copete y fecha superpuestos
- [x] **Preguntas** — acordeón excluyente de 5 preguntas, servido ABIERTO y
      plegado por CSS detrás de `.js`. Cuatro quintos de ancho para el acordeón
      y uno para una franja visual que acompaña su alto
- [x] **Contacto** — tres cuartos de formulario (correo, teléfono, mensaje) y un
      cuarto de franja visual a la derecha, estirada a todo el alto; en móvil
      desaparece. Validación por `ValidityState` con mensajes propios, y el envío
      compone un correo y abre el cliente del usuario: sin backend, "enviar" no
      puede significar "lo guardamos"

Y al final, fuera de la numeración:

- [x] **Sponsors** — grilla de 4×4 de rectángulos acostados con un marcador de
      cuatro esquinas en "L" que VIAJA de una ficha a otra. En escritorio lo
      mueve el puntero y se queda en la última que apuntó; donde no hay puntero
      lo mueve el scroll, en los dos sentidos. En móvil son 2 columnas por 8
      filas. La "J" del isologotipo ocupa el lugar del logotipo del auspiciante,
      en monocromía

      La especificación anterior —3 sliders horizontales infinitos de tamaños
      levemente distintos— se descartó. De paso se evitó heredar el requisito
      completo de WCAG 2.2.2: una grilla que solo se mueve cuando el usuario la
      mueve no necesita control de pausa

## Funcionalidades transversales

- [x] Pantalla de carga con la "J" animada
- [x] Scroll suave (Lenis) con degradación por `prefers-reduced-motion`
- [x] Barra de progreso de lectura
- [x] Botón de volver arriba (aparece pasadas dos pantallas)
- [x] Footer superpuesto al último contenido
- [x] Favicon generado desde la geometría del isologotipo
- [ ] Redes sociales (links en footer ✅; sección propia con transmisiones ⬜)
- [ ] Animación de la "J" reutilizada como estado de carga y vacío

## Descartado a propósito

De las funcionalidades sugeridas por la organización:

- **Agenda interactiva** — se evaluó como sistema de recordatorios; sin backend no aporta
- **Filtro por rubros** — sin una sección con listados filtrables donde encaje.
  El motivo original era que duplicaría los filtros de Expositores; al quedar
  Expositores sin filtros, el descarte se sostiene por la otra mitad del argumento:
  con doce expositores provisorios, filtrar no resuelve un problema real
- **Filtros y buscador de expositores** — estaban en el plan y llegaron a
  implementarse; se sacaron al redefinir la sección como un bento en movimiento.
  Un listado que se desliza solo y un filtro que lo recorta son dos formas de leer
  incompatibles: el filtro pide detener y comparar, el bento pide mirar pasar
- **Panel de novedades** — se cubre reutilizando las últimas noticias
- **Panel para futuras actualizaciones** — ambiguo, sin alcance definido
- **"La mejor foto del evento"** — primero en la lista de recortes: necesita backend, moderación de contenido y pedir DNI. Es la funcionalidad más cara y la menos evaluable en un prototipo

## Criterios de evaluación del jurado

Sirven de guía para priorizar:

innovación · diseño visual · experiencia de usuario · identidad institucional ·
factibilidad técnica · accesibilidad · escalabilidad · calidad de la
presentación · uso responsable de IA · originalidad
