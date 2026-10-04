import { describe, expect, it } from 'vitest'
import { VALORES_INICIALES_SOLICITUD, esquemaCrearSolicitud, prepararSolicitud } from './validacion'

/**
 * Los limites del formulario son los mismos del backend:
 *   CrearSolicitudDto -> [Range(0.01, 9999999.99)], [StringLength(3,3)],
 *                        [Range(1,365)], [StringLength(500)]
 *
 * Los mensajes se comparan literalmente. Si divergen del backend, el usuario ve
 * un texto al validar y otro al enviar, y parece que la aplicacion va a medias.
 */

const VALIDO = {
  clienteId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  monto: 1500,
  moneda: 'PEN',
  vigenciaDias: 30,
  observacion: '',
}

function validar(valores) {
  return esquemaCrearSolicitud.safeParse(valores)
}

function primerError(valores, campo) {
  const resultado = validar(valores)

  return resultado.error.issues.find((issue) => issue.path[0] === campo)?.message
}

describe('esquemaCrearSolicitud', () => {
  it('acepta una solicitud valida', () => {
    expect(validar(VALIDO).success).toBe(true)
  })

  it('acepta el texto de ejemplo que trae Swagger tal cual llega', () => {
    expect(validar({ ...VALIDO, moneda: 'str' }).success).toBe(true)
  })

  it('acepta el monto minimo y el maximo, y rechaza lo que queda fuera', () => {
    expect(validar({ ...VALIDO, monto: 0.01 }).success).toBe(true)
    expect(validar({ ...VALIDO, monto: 9_999_999.99 }).success).toBe(true)

    expect(primerError({ ...VALIDO, monto: 0 }, 'monto')).toBe(
      'El monto debe estar entre 0.01 y 9999999.99.',
    )
    expect(primerError({ ...VALIDO, monto: 10_000_000 }, 'monto')).toBe(
      'El monto debe estar entre 0.01 y 9999999.99.',
    )
  })

  it('convierte a numero lo que llega como texto de un input', () => {
    const resultado = validar({ ...VALIDO, monto: '1500.50' })

    expect(resultado.success).toBe(true)
    expect(resultado.data.monto).toBe(1500.5)
  })

  it('rechaza una moneda que no sea de tres letras', () => {
    expect(primerError({ ...VALIDO, moneda: 'PE' }, 'moneda')).toBe(
      'La moneda debe tener 3 caracteres.',
    )
    expect(primerError({ ...VALIDO, moneda: 'PESOS' }, 'moneda')).toBe(
      'La moneda debe tener 3 caracteres.',
    )
  })

  it('pasa la moneda a mayusculas antes de medirla', () => {
    // Sin el toUpperCase antes del length, "pen" se mediria bien pero se
    // guardaria en minusculas y la API lo recibe en mayusculas.
    const resultado = validar({ ...VALIDO, moneda: 'pen' })

    expect(resultado.success).toBe(true)
    expect(resultado.data.moneda).toBe('PEN')
  })

  it('acepta la vigencia en sus dos extremos', () => {
    expect(validar({ ...VALIDO, vigenciaDias: 1 }).success).toBe(true)
    expect(validar({ ...VALIDO, vigenciaDias: 365 }).success).toBe(true)

    expect(primerError({ ...VALIDO, vigenciaDias: 0 }, 'vigenciaDias')).toBe(
      'La vigencia debe estar entre 1 y 365 dias.',
    )
    expect(primerError({ ...VALIDO, vigenciaDias: 366 }, 'vigenciaDias')).toBe(
      'La vigencia debe estar entre 1 y 365 dias.',
    )
  })

  it('exige un identificador de cliente con formato UUID', () => {
    expect(primerError({ ...VALIDO, clienteId: 'cliente-1' }, 'clienteId')).toBe(
      'El identificador de cliente debe ser un UUID valido.',
    )
  })

  it('limita la observacion a 500 caracteres, el ancho de la columna', () => {
    expect(validar({ ...VALIDO, observacion: 'a'.repeat(500) }).success).toBe(true)
    expect(primerError({ ...VALIDO, observacion: 'a'.repeat(501) }, 'observacion')).toBe(
      'La observacion no puede superar los 500 caracteres.',
    )
  })

  it('deja pasar una observacion ausente', () => {
    const { observacion: _omitida, ...sinObservacion } = VALIDO

    expect(validar(sinObservacion).success).toBe(true)
  })
})

describe('prepararSolicitud', () => {
  it('manda null en vez de cadena vacia', () => {
    // Guardar "" produce una columna con un espacio en blanco que despues no se
    // distingue de "la escribio y luego la borro".
    expect(prepararSolicitud({ ...VALIDO, observacion: '' }).observacion).toBeNull()
  })

  it('recorta los espacios de la observacion antes de mandarla', () => {
    expect(prepararSolicitud({ ...VALIDO, observacion: '  hola  ' }).observacion).toBe('hola')
  })
})

describe('valores iniciales', () => {
  it('arranca con la moneda y la vigencia por defecto del backend', () => {
    // Los defaults del C# son Moneda = "PEN" y VigenciaDias = 30.
    expect(VALORES_INICIALES_SOLICITUD.moneda).toBe('PEN')
    expect(VALORES_INICIALES_SOLICITUD.vigenciaDias).toBe(30)
  })
})