import { afterEach, describe, expect, it } from 'vitest'
import {
  TEMA_SERVIDOR,
  alternarTema,
  elegirTema,
  seguirSistema,
  temaContrario,
  temaEfectivo,
  temaElegido,
} from './tema'

/**
 * Precedencia entre el tema del sistema y el que elige la persona.
 *
 * Se prueba con stubs de `window` y `document` en lugar de `environment:
 * 'jsdom'` porque el resto de la suite corre en 'node' a proposito —no hay
 * tests de componentes— y no merece la pena arrastrar jsdom por ocho pruebas
 * de logica.
 *
 * Lo que NO se prueba, y no se puede: que los tokens del CSS existan. El
 * contraste de cada valor esta medido y documentado en el README; que la hoja
 * los aplique es cosa del navegador.
 */

let almacen = {}
let prefiereOscuro = false
let atributoHtml = undefined

function montarWindow() {
  globalThis.window = {
    get localStorage() {
      return {
        getItem: (k) => (k in almacen ? almacen[k] : null),
        setItem: (k, v) => {
          almacen[k] = String(v)
        },
        removeItem: (k) => {
          delete almacen[k]
        },
      }
    },
    matchMedia: () => ({
      get matches() {
        return prefiereOscuro
      },
      addEventListener() {},
    }),
  }
  globalThis.document = {
    get documentElement() {
      return {
        get dataset() {
          return new Proxy(
            {},
            {
              get: (_t, k) => (k === 'tema' ? atributoHtml : undefined),
              set: (_t, k, v) => {
                if (k === 'tema') atributoHtml = v
              },
              deleteProperty: (_t, k) => {
                if (k === 'tema') atributoHtml = undefined
              },
            },
          )
        },
      }
    },
  }
}

afterEach(() => {
  almacen = {}
  prefiereOscuro = false
  atributoHtml = undefined
  delete globalThis.window
  delete globalThis.document
})

describe('tema', () => {
  it('sin eleccion guardada, manda el sistema', () => {
    montarWindow()

    prefiereOscuro = false
    expect(temaEfectivo()).toBe('claro')

    prefiereOscuro = true
    expect(temaEfectivo()).toBe('oscuro')
  })

  it('con eleccion guardada, manda la eleccion sobre el sistema', () => {
    montarWindow()

    // El sistema dice claro, pero hay eleccion: gana la eleccion.
    prefiereOscuro = false
    elegirTema('oscuro')
    expect(temaEfectivo()).toBe('oscuro')

    // Y al reves: la eleccion clara vale aunque el sistema pida oscuro.
    prefiereOscuro = true
    elegirTema('claro')
    expect(temaEfectivo()).toBe('claro')
  })

  it('un valor corrupto en localStorage se descarta', () => {
    montarWindow()

    almacen['transacciones.tema'] = 'oscuro-con-tildes'
    expect(temaElegido()).toBeNull()

    // Sin eleccion, vuelve a mandar el sistema.
    prefiereOscuro = true
    expect(temaEfectivo()).toBe('oscuro')
  })

  it('elegir escribe el atributo en <html>', () => {
    montarWindow()

    elegirTema('oscuro')
    expect(atributoHtml).toBe('oscuro')

    elegirTema('claro')
    expect(atributoHtml).toBe('claro')
  })

  it('seguir al sistema QUITA el atributo, no escribe "claro"', () => {
    montarWindow()

    elegirTema('oscuro')
    seguirSistema()
    expect(atributoHtml).toBeUndefined()

    // Y con el atributo fuera, el sistema vuelve a mandar de verdad.
    prefiereOscuro = true
    expect(temaEfectivo()).toBe('oscuro')
  })

  it('alternar va al contrario del tema efectivo', () => {
    montarWindow()

    // En claro, alternar lleva a oscuro.
    alternarTema()
    expect(temaEfectivo()).toBe('oscuro')

    // Y de vuelta.
    alternarTema()
    expect(temaEfectivo()).toBe('claro')
  })

  it('temaContrario coincide con lo que hace alternar', () => {
    montarWindow()

    for (const delSistema of [false, true]) {
      for (const inicial of ['claro', 'oscuro']) {
        prefiereOscuro = delSistema
        elegirTema(inicial)

        const esperado = temaContrario()

        alternarTema()
        expect(temaEfectivo()).toBe(esperado)
      }
    }
  })

  it('TEMA_SERVIDOR es un tema que existe', () => {
    expect(['claro', 'oscuro']).toContain(TEMA_SERVIDOR)
  })
})

