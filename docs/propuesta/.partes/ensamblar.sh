#!/usr/bin/env bash
# Ensambla los dos documentos imprimibles a partir de:
#   - la cabecera original (doctype + head + CSS + fuentes woff2 en base64), intacta
#   - el cuerpo reescrito, con marcadores
#   - los bloques que no se tocan: SVG del isologotipo y las capturas WebP en base64
#
# Los bloques base64 nunca pasan por un editor: se copian con `sed r`, byte a byte.
set -euo pipefail

D="F:/GitHub/expojuy-retro/docs/propuesta"
P="$D/.partes"

sustituir() {
  # $1 marcador, $2 archivo con el contenido
  sed -e "/$1/{r $2" -e 'd;}'
}

# ── Memoria descriptiva ────────────────────────────────────────────────────
{
  cat "$P/cabecera.part"
  cat "$P/cuerpo-memoria.html" \
    | sustituir '@@SVG@@'          "$P/svg.part" \
    | sustituir '@@IMG_INICIO@@'   "$P/img-inicio.part" \
    | sustituir '@@IMG_MAPA@@'     "$P/img-mapa.part" \
    | sustituir '@@IMG_ENTRADAS@@' "$P/img-entradas.part"
} > "$D/memoria-descriptiva-purple.html"

# ── Declaración de uso de IA ───────────────────────────────────────────────
{
  cat "$P/cabecera-ia.part"
  cat "$P/cuerpo-declaracion.html" | sustituir '@@SVG@@' "$P/svg.part"
} > "$D/declaracion-ia-purple.html"

echo "OK"
wc -c "$D/memoria-descriptiva-purple.html" "$D/declaracion-ia-purple.html"
