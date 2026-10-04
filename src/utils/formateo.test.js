import { describe, expect, it } from 'vitest'
import { esUuid, fraccionVigencia, limitesDeRangoLocal } from './formateo'

/**
 * El caso de las fechas es el mas facil de equivocarse de toda la aplicacion y
 * el mas dificil de detectar a ojo: si el rango sale mal, el servidor devuelve
 * menos filas y no hay ningun error, solo un listado que "parece" corto.
 *
 * Se prueban los limites de una zona horaria con desfase negativo, que es donde
 * el error se hace visible.
 */

const DESFASTE_HORAS = 5

describe('limitesDeRangoLocal', () => {
  it('devuelve null si no hay rango', () => {
    expect(limitesDeRangoLocal('', '')).toEqual({ desde: null, hasta: null })
  })

  it('ancla "desde" a la medianoche local y "hasta" al final del dia local', () => {
    const { desde, hasta } = limitesDeRangoLocal('2026-10-03', '2026-10-03')

    // "hasta" tiene que ser unas 24 horas despues de "desde". Si los dos se
    // anclaran a medianoche, el rango incluiria el dia completo solo por
    // casualidad y ademas un dia de margen cuando el desfase es negativo.
    const diferencia = new Date(hasta).getTime() - new Date(desde).getTime()

    expect(diferencia).toBe(24 * 60 * 60 * 1000 - 1)
  })

  it('devuelve instantes UTC, no fechas locales sin zona', () => {
    const { desde, hasta } = limitesDeRangoLocal('2026-10-03', '2026-10-04')

    // Sin la "Z" el motor lo interpretaria como hora local, que es justo lo que
    // hay que evitar.
    expect(desde.endsWith('Z')).toBe(true)
    expect(hasta.endsWith('Z')).toBe(true)
  })

  it('incluye un registro creado a las 2 de la madrugada del dia elegido', () => {
    // Este es el invariante que importa, y donde falla si la conversion se
    // olvida: en una zona UTC-5, las 02:00 locales son las 07:00 UTC. Mandando
    // "2026-10-03" tal cual, el servidor leeria 00:00 UTC y esta fila caeria
    // fuera del rango sin avisar.
    const { desde, hasta } = limitesDeRangoLocal('2026-10-03', '2026-10-03')

    const creado = new Date(2026, 9, 3, 2, 0, 0, 0).getTime()

    expect(new Date(desde).getTime()).toBeLessThanOrEqual(creado)
    expect(new Date(hasta).getTime()).toBeGreaterThanOrEqual(creado)
  })

  it('incluye tambien el ultimo momento del dia, hasta las 23:59', () => {
    const { desde, hasta } = limitesDeRangoLocal('2026-10-03', '2026-10-03')

    const casiNoche = new Date(2026, 9, 3, 23, 59, 30, 0).getTime()

    expect(new Date(hasta).getTime()).toBeGreaterThanOrEqual(casiNoche)
  })

  it('excluye un registro del dia anterior', () => {
    const { desde } = limitesDeRangoLocal('2026-10-03', '2026-10-03')

    const ayer = new Date(2026, 9, 2, 23, 59, 0, 0).getTime()

    expect(new Date(desde).getTime()).toBeGreaterThan(ayer)
  })

  it('el desfase de la zona no cambia el resultado', () => {
    // El mismo caso debe cumplirse con desfase positivo y negativo. Si el test
    // pasara solo con uno, estaria midiendo el reloj de esta maquina.
    const { desde, hasta } = limitesDeRangoLocal('2026-10-03', '2026-10-03')

    const conDesfasePositivo = new Date(desde).getTime() + DESFASTE_HORAS * 3_600_000
    const conDesfaseNegativo = new Date(hasta).getTime() - DESFASTE_HORAS * 3_600_000

    expect(conDesfasePositivo).toBeLessThanOrEqual(conDesfaseNegativo)
  })

  it('ignora un formato de fecha que no es ISO', () => {
    expect(limitesDeRangoLocal('03/10/2026', '').desde).toBeNull()
  })
})

describe('esUuid', () => {
  it('acepta un UUID con o sin mayusculas', () => {
    expect(esUuid('3fa85f64-5717-4562-b3fc-2c963f66afa6')).toBe(true)
    expect(esUuid('3FA85F64-5717-4562-B3FC-2C963F66AFA6')).toBe(true)
  })

  it('rechaza un identificador de cliente mal formado', () => {
    // Este filtro llega a un [FromQuery] Guid?, asi que un valor invalido
    // provoca un 400. La consulta ni se lanza: el hook lo desactiva.
    expect(esUuid('no-es-un-uuid')).toBe(false)
    expect(esUuid('3fa85f64-5717-4562')).toBe(false)
    expect(esUuid('')).toBe(false)
    expect(esUuid(null)).toBe(false)
  })
})

describe('fraccionVigencia', () => {
  const inicio = '2026-10-01T00:00:00Z'
  const fin = '2026-10-11T00:00:00Z'

  it('mide la parte del plazo ya consumida', () => {
    const ahora = new Date('2026-10-06T00:00:00Z')

    expect(fraccionVigencia(inicio, fin, ahora)).toBeCloseTo(0.5, 5)
  })

  it('se mantiene entre 0 y 1 aunque ahora este fuera del rango', () => {
    expect(fraccionVigencia(inicio, fin, new Date('2026-09-01T00:00:00Z'))).toBe(0)
    expect(fraccionVigencia(inicio, fin, new Date('2026-12-01T00:00:00Z'))).toBe(1)
  })

  it('devuelve 1 si el plazo es cero, para no dibujar una barra vacia', () => {
    expect(fraccionVigencia(inicio, inicio, new Date(inicio))).toBe(1)
  })
})