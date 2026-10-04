import { z } from 'zod'
import { esUuid } from './formateo'

/**
 * Esquemas de validacion.
 *
 * Los limites vienen del backend y estan copiados aqui a proposito:
 *   CrearSolicitudDto  -> [Range(0.01, 9999999.99)], [StringLength(3,3)],
 *                         [Range(1,365)], [StringLength(500)]
 *   dbo.Solicitud      -> Observacion NVARCHAR(500), MotivoRechazo NVARCHAR(500)
 *
 * El mensaje de cada regla es IDENTICO al del backend. Si divergen, el usuario
 * ve un texto al validar y otro al enviar, y parece que la aplicacion va a
 * medias. Ademas, cuando la peticion llega al servidor y alli falla otra vez, se
 * dice exactamente lo mismo.
 */

const MONTO_MINIMO = 0.01
const MONTO_MAXIMO = 9_999_999.99
const VIGENCIA_MINIMA = 1
const VIGENCIA_MAXIMA = 365
const TEXTO_MAXIMO = 500

const mensajeMonto = 'El monto debe estar entre 0.01 y 9999999.99.'
const mensajeVigencia = 'La vigencia debe estar entre 1 y 365 dias.'

export const esquemaCrearSolicitud = z.object({
  clienteId: z
    .string()
    .trim()
    .min(1, 'El cliente es obligatorio.')
    .refine(esUuid, 'El identificador de cliente debe ser un UUID valido.'),

  monto: z
    .coerce.number({
      invalid_type_error: 'El monto debe ser un numero.',
      required_error: 'El monto es obligatorio.',
    })
    .min(MONTO_MINIMO, mensajeMonto)
    .max(MONTO_MAXIMO, mensajeMonto),

  // toUpperCase antes que length: si el usuario escribe "pen" son tres
  // caracteres y el backend lo espera en mayusculas.
  moneda: z
    .string()
    .trim()
    .toUpperCase()
    .length(3, 'La moneda debe tener 3 caracteres.'),

  vigenciaDias: z
    .coerce.number({
      invalid_type_error: 'La vigencia debe ser un numero.',
      required_error: 'La vigencia es obligatoria.',
    })
    .int('La vigencia debe ser un numero de dias entero.')
    .min(VIGENCIA_MINIMA, mensajeVigencia)
    .max(VIGENCIA_MAXIMA, mensajeVigencia),

  observacion: z
    .string()
    .trim()
    .max(TEXTO_MAXIMO, 'La observacion no puede superar los 500 caracteres.')
    .optional()
    .or(z.literal('')),
})

export const esquemaRechazo = z.object({
  motivo: z
    .string()
    .trim()
    .min(1, 'El motivo del rechazo es obligatorio.')
    .max(TEXTO_MAXIMO, 'El motivo no puede superar los 500 caracteres.'),
})

/**
 * Prepara los valores del formulario para la API.
 *
 * Una observacion vacia se manda como null en vez de como "": el backend la
 * trimaria igual, pero asi el dato almacenado es NULL y no una cadena en blanco
 * que luego hay que distinguir de "la escribio y la borro".
 */
export function prepararSolicitud(valores) {
  return {
    clienteId: valores.clienteId.trim(),
    monto: valores.monto,
    moneda: valores.moneda,
    vigenciaDias: valores.vigenciaDias,
    observacion: valores.observacion?.trim() ? valores.observacion.trim() : null,
  }
}

/** Valores iniciales del formulario de alta. */
export const VALORES_INICIALES_SOLICITUD = {
  clienteId: '',
  monto: '',
  moneda: 'PEN',
  vigenciaDias: 30,
  observacion: '',
}