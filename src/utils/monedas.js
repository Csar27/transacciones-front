/**
 * Monedas admitidas.
 *
 * Codigos ISO 4217. El backend solo exige tres caracteres
 * (`CrearSolicitudDto.Moneda` lleva `[StringLength(3, 3)]`) y guarda en
 * `NVARCHAR(3)`, asi que la lista de aqui es una decision de la interfaz, no un
 * contrato del servidor.
 *
 * Por eso es una lista CERRADA: el desplegable no deja escribir un codigo
 * fuera de ella. Un campo de texto libre obligaba a acordarse de las tres
 * letras y toleraba cosas como "pen " o "p3n", que la API aceptaba y luego
 * nadie sabe interpretarlas al sumar montos.
 *
 * Si en algun momento hace falta una moneda que no esta aqui, se anade a esta
 * lista. No hay mas sitio donde decidirlo.
 *
 * El orden importa: la moneda por defecto del backend es PEN, y el primer
 * elemento es el que se elige al abrir el desplegable.
 */

export const MONEDAS = [
  { codigo: 'PEN', nombre: 'Sol peruano', simbolo: 'S/' },
  { codigo: 'USD', nombre: 'Dolar estadounidense', simbolo: '$' },
  { codigo: 'EUR', nombre: 'Euro', simbolo: '€' },
  { codigo: 'GBP', nombre: 'Libra esterlina', simbolo: '£' },
  { codigo: 'CHF', nombre: 'Franco suizo', simbolo: 'CHF ' },
  { codigo: 'CAD', nombre: 'Dolar canadiense', simbolo: 'CA$' },
  { codigo: 'MXN', nombre: 'Peso mexicano', simbolo: 'MX$' },
  { codigo: 'COP', nombre: 'Peso colombiano', simbolo: 'COL$' },
  { codigo: 'CLP', nombre: 'Peso chileno', simbolo: 'CLP$' },
  { codigo: 'ARS', nombre: 'Peso argentino', simbolo: 'AR$' },
  { codigo: 'BRL', nombre: 'Real brasileño', simbolo: 'R$' },
  { codigo: 'UYU', nombre: 'Peso uruguayo', simbolo: '$U ' },
  { codigo: 'JPY', nombre: 'Yen japones', simbolo: '¥' },
]

/*
  Sobre los simbolos:

  Solo PEN, EUR, GBP y JPY tienen un simbolo limpio de un solo caracter. El
  dollar es el problema:yen "USD $", "MXN MX$", "COP COL$" y "UYU $U" son TODOS
  un dollar a simple vista, y en una columna con montos de paises distintos eso
  es una ambiguedad real, no un detalle tipografico. Por eso las que se
  confunden llevan prefijo.

  CHF no tiene simbolo internacional: se pone el codigo.

  Los que llevan espacio al final ("CHF ", "$U ") lo llevan porque se leen como
  un prefijo, no pegados a la cifra.
*/

/** Codigos aceptados, para validar sin recorrer la lista de objetos. */
export const CODIGOS_MONEDA = MONEDAS.map((moneda) => moneda.codigo)

/** La moneda por defecto. Tiene que coincidir con el default del DTO. */
export const MONEDA_POR_DEFECTO = 'PEN'

/**
 * Simbolo de una moneda.
 *
 * Si el codigo no esta en la lista se devuelve el propio codigo: una moneda
 * inesperada se muestra igual, y con su identificador, en vez de desaparecer.
 */
export function simboloDe(codigo) {
  return MONEDAS.find((moneda) => moneda.codigo === codigo)?.simbolo ?? `${codigo ?? ''} `
}

/** Nombre de una moneda, o el codigo si no se conoce. */
export function nombreDe(codigo) {
  return MONEDAS.find((moneda) => moneda.codigo === codigo)?.nombre ?? codigo ?? '—'
}