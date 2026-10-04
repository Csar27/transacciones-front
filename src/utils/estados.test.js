import { describe, expect, it } from 'vitest'
import {
  ESTADO,
  ESTADOS,
  TRANSICIONES,
  accionesDisponibles,
  esTerminal,
  esVencenable,
  fichaEstado,
  puedeTransitar,
} from './estados'

/**
 * Estos tests son el espejo de las reglas del dominio en C#:
 *
 *   Core/Models/Solicitud.cs  ->  EsTransicionValida
 *   Core/Models/Solicitud.cs  ->  EstadosTerminales, EstadosVencenables
 *   CrossCutting/Enums        ->  EnumEstadoSolicitud
 *
 * Si el backend anade una transicion y aqui no, el boton no aparece y la accion
 * sigue siendo posible por la API. No hay ningun error visible: simplemente la
 * interfaz se queda corta. Estos tests son la alarma.
 */

describe('valores de estado', () => {
  it('mantiene los valores que se persisten en la columna Estado', () => {
    expect(ESTADO.BARRADOR).toBe(0)
    expect(ESTADO.REGISTRADA).toBe(1)
    expect(ESTADO.APROBADA).toBe(2)
    expect(ESTADO.RECHAZADA).toBe(3)
    expect(ESTADO.VENCIDA).toBe(4)
    expect(ESTADO.ANULADA).toBe(5)
  })

  it('devuelve una ficha neutra para un valor desconocido', () => {
    // Si el backend anade un estado y la interfaz no lo conoce, no debe romperse:
    // se muestra el numero y se sigue usando la tabla.
    const ficha = fichaEstado(99)

    expect(ficha.nombre).toBe('Estado 99')

    // El color es una referencia a variable CSS, no un hexadecimal: tiene que
    // poder cambiar con el tema. Comprobar el patron de la variable es lo que
    // detecta que alguien ha vuelto a escribir un # fijo y ha roto el oscuro.
    expect(ficha.color).toBe('var(--color-ink-muted)')
  })

  it('cada estado apunta a su variable de la hoja de estilo', () => {
    // Los seis deben existir en estilos.css con el mismo nombre. Si alguien
    // renombra una variable aqui y no alla, el estado se queda sin pintar y
    // esto no lo detecta: solo el navegador. Lo que se comprueba es que el
    // patron no se rompa — que es lo que evita el color hexadecimal.
    for (const estado of ESTADOS) {
      expect(estado.color).toMatch(/^var\(--color-estado-[0-5]\)$/)
    }

    // Y los seis valores del enum tienen ficha: ni mas ni menos, porque el
    // indice del enum ES el valor de la columna Estado en la base.
    expect(ESTADOS.map((e) => e.valor)).toEqual([0, 1, 2, 3, 4, 5])
  })
})

describe('transiciones', () => {
  it('no permiteIr de un estado terminal a ningun otro', () => {
    for (const terminal of [ESTADO.RECHAZADA, ESTADO.VENCIDA, ESTADO.ANULADA]) {
      for (const destino of [ESTADO.APROBADA, ESTADO.RECHAZADA, ESTADO.ANULADA]) {
        expect(puedeTransitar(terminal, destino)).toBe(false)
      }
    }
  })

  it('solo permite aprobar, rechazar o anular desde Registrada', () => {
    expect(accionesDisponibles(ESTADO.REGISTRADA).map((accion) => accion.id)).toEqual([
      'aprobar',
      'rechazar',
      'anular',
    ])
  })

  it('desde Aprobada solo deja anular', () => {
    expect(accionesDisponibles(ESTADO.APROBADA).map((accion) => accion.id)).toEqual(['anular'])
  })

  it('no ofrece ninguna accion en un estado terminal', () => {
    expect(accionesDisponibles(ESTADO.RECHAZADA)).toHaveLength(0)
    expect(accionesDisponibles(ESTADO.VENCIDA)).toHaveLength(0)
    expect(accionesDisponibles(ESTADO.ANULADA)).toHaveLength(0)
  })

  it('no ofrece Vencida como accion: la marca el job, no el usuario', () => {
    // Hay transicion Registrada -> Vencida, pero no hay boton. Si se anadiera,
    // el backend responderia 400 con SOL-003.
    expect(puedeTransitar(ESTADO.REGISTRADA, ESTADO.VENCIDA)).toBe(true)
    expect(accionesDisponibles(ESTADO.REGISTRADA).map((accion) => accion.destino)).not.toContain(
      ESTADO.VENCIDA,
    )
  })

  it('tiene siete transiciones, las mismas que el dominio', () => {
    expect(TRANSICIONES).toHaveLength(7)
  })
})

describe('conjuntos de estados', () => {
  it('Rechazada, Vencida y Anulada son finales', () => {
    expect(esTerminal(ESTADO.RECHAZADA)).toBe(true)
    expect(esTerminal(ESTADO.VENCIDA)).toBe(true)
    expect(esTerminal(ESTADO.ANULADA)).toBe(true)
    expect(esTerminal(ESTADO.REGISTRADA)).toBe(false)
    expect(esTerminal(ESTADO.APROBADA)).toBe(false)
  })

  it('una solicitud Aprobada NO vence, aunque no sea final', () => {
    // Es la distincion que importa para el medidor de vigencia. Aprobada sigue
    // abierta pero el job de vencimiento no la toca; pintar el reloj ahi seria
    // mostrar un contador que no corresponde a nada.
    expect(esTerminal(ESTADO.APROBADA)).toBe(false)
    expect(esVencenable(ESTADO.APROBADA)).toBe(false)
  })

  it('solo Registrada (y Borrador) tienen el reloj en marcha', () => {
    expect(esVencenable(ESTADO.REGISTRADA)).toBe(true)
    expect(esVencenable(ESTADO.BARRADOR)).toBe(true)
    expect(esVencenable(ESTADO.RECHAZADA)).toBe(false)
  })
})