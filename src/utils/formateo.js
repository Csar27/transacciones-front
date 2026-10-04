/**
 * Formateo y fechas.
 *
 * Lo unico delicado aqui son las fechas. Ver la nota de `limitesDeRangoLocal`.
 */

import { simboloDe } from './monedas'

const LOCAL_MONEDA = 'es-PE'
const LOCAL_FECHA = 'es-PE'
const MS_POR_DIA = 86_400_000

const formatoMonto = new Intl.NumberFormat(LOCAL_MONEDA, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const formatoFecha = new Intl.DateTimeFormat(LOCAL_FECHA, { dateStyle: 'medium' })

const formatoFechaHora = new Intl.DateTimeFormat(LOCAL_FECHA, {
  dateStyle: 'medium',
  timeStyle: 'short',
})

/**
 * Monto con su simbolo de moneda: 9999999.99 + "PEN" -> "S/9,999,999.99".
 *
 * El simbolo va DELANTE y pegado a la cifra, sin espacio: en una columna de la
 * tabla la separacion cuesta espacio horizontal y no aporta nada.
 *
 * Se usa el simbolo del catalogo de `monedas.js` y no el de Intl
 * (`style: 'currency'`), porque Intl decide el separador segun el locale y en
 * es-PE un dolar sale como "US$ 1,500.00": un prefijo de dos letras donde el
 * resto de las monedas tiene una. Aqui el formato es el mismo para todas.
 */
export function formatearMonto(valor, moneda) {
  if (valor === null || valor === undefined) return '—'

  const numero = formatoMonto.format(Number(valor))

  return moneda ? `${simboloDe(moneda)}${numero}` : numero
}

/**
 * Fechas que llegan de la API.
 *
 * El backend guarda `FechaSolicitud` con DateTime.UtcNow, asi que la mayoria
 * llegan como "2026-10-04T03:55:39.4524819Z". `new Date` las interpreta como UTC.
 *
 * Las filas insertadas a mano con GETDATE() no traen la "Z" y JavaScript las
 * interpreta como hora LOCAL, que es justo como se insertaron. Por eso no hace
 * falta normalizar a mano: los dos formatos que produce el backend se leen
 * bien con el parseo nativo.
 */
export function aFecha(valor) {
  if (!valor) return null

  const fecha = new Date(valor)

  return Number.isNaN(fecha.getTime()) ? null : fecha
}

export function formatearFecha(valor) {
  const fecha = aFecha(valor)

  return fecha ? formatoFecha.format(fecha) : '—'
}

export function formatearFechaHora(valor) {
  const fecha = aFecha(valor)

  return fecha ? formatoFechaHora.format(fecha) : '—'
}

/**
 * Un UUID completo son 36 caracteres y ocupa media columna. En la tabla se
 * muestran los 8 primeros; el entero va en el title para poder copiarlo.
 */
export function formatearUuid(valor) {
  if (!valor) return '—'

  return String(valor).slice(0, 8)
}

export function esUuid(valor) {
  if (typeof valor !== 'string') return false

  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    valor.trim(),
  )
}

/**
 * Dias que faltan para vencer. Math.ceil hace que "0" signifique "vence hoy":
 * si faltan seis horas, un floor daria 0 y seria indistinguible de "ayer".
 *
 * Negativo = ya vencio.
 */
export function diasRestantes(fechaVencimiento, ahora = new Date()) {
  const fecha = aFecha(fechaVencimiento)

  if (!fecha) return null

  return Math.ceil((fecha.getTime() - ahora.getTime()) / MS_POR_DIA)
}

/** Texto de la vigencia, en la voz de quien lee: "vence en 12 dias". */
export function textoVigencia(fechaVencimiento, ahora = new Date()) {
  const dias = diasRestantes(fechaVencimiento, ahora)

  if (dias === null) return '—'
  if (dias < 0) return `vencio hace ${Math.abs(dias)} dias`
  if (dias === 0) return 'vence hoy'
  if (dias === 1) return 'vence manana'

  return `vence en ${dias} dias`
}

/**
 * Fraccion de vigencia consumida, de 0 a 1. Es lo que dibuja el medidor.
 *
 * Se mide desde la fecha de solicitud, no desde el origen de la epoca: asi el
 * medidor dice " cuanto de SU plazo lleva gastado", que es la pregunta util.
 */
export function fraccionVigencia(fechaSolicitud, fechaVencimiento, ahora = new Date()) {
  const inicio = aFecha(fechaSolicitud)
  const fin = aFecha(fechaVencimiento)

  if (!inicio || !fin) return 0

  const total = fin.getTime() - inicio.getTime()

  // Plazo de cero: no hay barra que dibujar. Se devuelve 1 para que no se
  // interprete como "sin plazo consumed" sino como "ya se cumple".
  if (total <= 0) return 1

  const consumido = ahora.getTime() - inicio.getTime()
  const fraccion = consumido / total

  return Math.min(1, Math.max(0, fraccion))
}

/**
 * Convierte las fechas que elige el usuario en el rango UTC que espera la API.
 *
 * POR QUE HAY QUE HACER ESTA CONVERSION, que es el punto mas facil de equivocar
 * de toda la aplicacion:
 *
 * - El backend guarda `FechaSolicitud` con DateTime.UtcNow.
 * - El repositorio filtra con `FechaSolicitud >= @desde`, sin convertir nada.
 * - El usuario elige "2026-10-03" en un date picker, que significa MEDIANOCHE
 *   LOCAL de ese dia.
 *
 * Si se mandara "2026-10-03" tal cual, el servidor lo leeria como las 00:00 UTC
 * y descartaria las solicitudes creadas entre las 00:00 y las 05:00 hora local
 * (UTC-5). No habria ningun error: el filtro simplemente devolveria menos filas
 * de las que el usuario espera, y sin una fila de diferencia nadie se entera.
 *
 * Asi que "desde" se ancla a las 00:00:00.000 LOCAL y "hasta" a las
 * 23:59:59.999 LOCAL, y ambos se convierten a instante UTC.
 *
 * @param {string} desdeISO Fecha "YYYY-MM-DD" o vacia.
 * @param {string} hastaISO Fecha "YYYY-MM-DD" o vacia.
 * @returns {{ desde: string | null, hasta: string | null }} Instantes ISO UTC.
 */
export function limitesDeRangoLocal(desdeISO, hastaISO) {
  return {
    desde: extremoLocalAUtc(desdeISO, 0, 0, 0, 0),
    hasta: extremoLocalAUtc(hastaISO, 23, 59, 59, 999),
  }
}

function extremoLocalAUtc(fechaISO, hora, minuto, segundo, milisegundo) {
  if (!fechaISO) return null

  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fechaISO.trim())

  if (!partes) return null

  const [, anio, mes, dia] = partes

  // El constructor con numeros usa la zona horaria local, que es lo que se
  // quiere: se parte de "este dia del calendario del usuario" y se converte.
  const local = new Date(
    Number(anio),
    Number(mes) - 1,
    Number(dia),
    hora,
    minuto,
    segundo,
    milisegundo,
  )

  return Number.isNaN(local.getTime()) ? null : local.toISOString()
}

/**
 * Copia al portapapeles. Devuelve false si el navegador lo bloquea, para que la
 * interfaz pueda avisar en vez de fingir que se copio.
 */
export async function copiarAlPortapapeles(texto) {
  if (!texto) return false

  try {
    await navigator.clipboard.writeText(texto)

    return true
  } catch {
    return false
  }
}