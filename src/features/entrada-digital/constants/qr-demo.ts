/**
 * QR de la entrada digital de demostración.
 *
 * QUÉ CODIFICA: `https://expojuy-retro.vercel.app/`, el sitio publicado, en
 * forma DIRECTA. Se descartaron dos versiones: una de me-qr.com, que pasa por
 * una redirección propia del generador, y otra con marca de agua. Lo aportó
 * Leandro para la demo.
 *
 * POR QUÉ UNA MATRIZ Y NO EL PNG
 *
 * Los módulos se leyeron del PNG original (1155px, módulo de 35px, 29 x 29,
 * versión 3) y se transcribieron acá. Verificado dos veces: cada módulo
 * muestreado en nueve puntos coincide con el original -0 diferencias en 7569-,
 * y la matriz redibujada se decodifica a la misma URL. Dibujado como SVG, el
 * QR sale nítido a cualquier tamaño y densidad de pantalla; un PNG escalado se
 * desenfoca o, con reescalado sin suavizar, deja módulos de anchos distintos.
 *
 * `1` es módulo oscuro, `0` claro. Sin la zona de silencio: la agrega el
 * componente.
 */
export const QR_DEMO = {
  url: "https://expojuy-retro.vercel.app/",
  modulos: [
    "11111110110011110100001111111",
    "10000010110101110101101000001",
    "10111010111101100010101011101",
    "10111010011100110101101011101",
    "10111010111011010111101011101",
    "10000010000111100100101000001",
    "11111110101010101010101111111",
    "00000000011010100000000000000",
    "10011111101011111100010010111",
    "10001101001010100001000110110",
    "10011011001100100010111000100",
    "01100100000000110111000001001",
    "11101110100101101001001100001",
    "10010000000010000010011111111",
    "11000011100010110111001010101",
    "11111001110111110000011010101",
    "10010011101010000000000001000",
    "11000001010110011111110010110",
    "11111010010011111101010111001",
    "11001101011001000001010001100",
    "11001011100111010101111111110",
    "00000000111001010110100011000",
    "11111110101101010101101011000",
    "10000010110011001111100010011",
    "10111010111011010011111111011",
    "10111010100100111111000100001",
    "10111010000001110101010110111",
    "10000010000011001011010111101",
    "11111110100110110001100010000",
  ],
} as const;
