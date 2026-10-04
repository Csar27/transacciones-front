import { describe, expect, it } from 'vitest'
import { ErrorApi, normalizarError, normalizarExito } from './cliente'

/**
 * Estos tests cubren el punto mas fragil de toda la aplicacion: el contrato.
 *
 * La API devuelve errores con dos formas posibles y la interfaz solo debe
 * entender una. Si el normalizador se equivoca, el mensaje de error sale
 * "undefined" en pantalla y el id de correlacion desaparece justo cuando hace
 * falta para reportar el fallo.
 */

/** Error de axios simulado. */
function errorAxios(status, data, cabeceras = {}) {
  return { response: { status, data, headers: cabeceras } }
}

describe('normalizarExito', () => {
  it('desenvuelve el payload de un exito', () => {
    const respuesta = normalizarExito({
      status: 200,
      headers: {},
      data: { exito: true, datos: { items: [], totalRegistros: 0 }, mensaje: null },
    })

    expect(respuesta.data).toEqual({ items: [], totalRegistros: 0 })
  })

  it('deja pasar una respuesta sin sobre', () => {
    const respuesta = normalizarExito({ status: 200, headers: {}, data: [1, 2, 3] })

    expect(respuesta.data).toEqual([1, 2, 3])
  })

  it('lanza error aunque el status sea 200 si exito es false', () => {
    // El fallo MUSTIO de este cliente: un 200 con exito:false es un error, y si
    // solo se mira el status, la aplicacion creera que todo fue bien.
    expect(() =>
      normalizarExito({
        status: 200,
        headers: {},
        data: { exito: false, codigo: 'GEN-500', mensaje: 'Fallo interno' },
      }),
    ).toThrow(ErrorApi)
  })
})

describe('normalizarError con el sobre de la API', () => {
  it('lee codigo, mensaje y correlationId del cuerpo', () => {
    const error = normalizarError(
      errorAxios(404, {
        exito: false,
        codigo: 'GEN-404',
        mensaje: 'No se encontro la solicitud.',
        correlationId: 'abc123',
      }),
    )

    expect(error).toBeInstanceOf(ErrorApi)
    expect(error.status).toBe(404)
    expect(error.codigo).toBe('GEN-404')
    expect(error.mensaje).toBe('No se encontro la solicitud.')
    expect(error.correlationId).toBe('abc123')
    expect(error.esNoEncontrado).toBe(true)
  })

  it('toma el correlationId de la cabecera cuando el cuerpo no lo trae', () => {
    const error = normalizarError(
      errorAxios(409, { exito: false, codigo: 'GEN-409', mensaje: 'Conflicto' }, {
        'x_correlationid': 'desde-cabecera',
      }),
    )

    expect(error.correlationId).toBe('desde-cabecera')
    expect(error.esConflicto).toBe(true)
  })

  it('normaliza a camelCase las claves con prefijo payload.', () => {
    const error = normalizarError(
      errorAxios(400, {
        exito: false,
        codigo: 'GEN-400',
        mensaje: 'Datos invalidos.',
        datos: { 'payload.vigenciaDias': ['La vigencia debe estar entre 1 y 365 dias.'] },
      }),
    )

    expect(error.campos).toEqual({
      vigenciaDias: ['La vigencia debe estar entre 1 y 365 dias.'],
    })
  })

  it('normaliza tambien las claves en PascalCase', () => {
    const error = normalizarError(
      errorAxios(400, {
        exito: false,
        codigo: 'GEN-400',
        mensaje: 'Datos invalidos.',
        datos: { Monto: ['El monto debe estar entre 0.01 y 9999999.99.'] },
      }),
    )

    expect(Object.keys(error.campos)).toEqual(['monto'])
  })
})

describe('normalizarError con ProblemDetails', () => {
  it('acepta el otro formato por si la API lo adopta', () => {
    const error = normalizarError(
      errorAxios(400, {
        type: 'https://tools.ietf.org/html/rfc9110#section-15.5.1',
        title: 'One or more validation errors occurred.',
        status: 400,
        detail: 'El campo monto es obligatorio.',
        errors: { Moneda: ['La moneda debe tener 3 caracteres.'] },
      }),
    )

    expect(error.codigo).toBe('GEN-400')
    expect(error.mensaje).toBe('El campo monto es obligatorio.')
    expect(error.campos).toEqual({ moneda: ['La moneda debe tener 3 caracteres.'] })
  })
})

describe('normalizarError sin respuesta del servidor', () => {
  it('distingue un fallo de red de un error de la API', () => {
    const error = normalizarError({ message: 'Network Error' })

    expect(error.status).toBe(0)
    expect(error.esDeRed).toBe(true)
    expect(error.mensaje).toContain('No hay conexion')
  })

  it('distingue el tiempo de espera agotado', () => {
    const error = normalizarError({ code: 'ECONNABORTED' })

    expect(error.codigo).toBe('RED-TIMEOUT')
    expect(error.mensaje).toContain('tardo demasiado')
  })
})