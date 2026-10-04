import { http } from './cliente'
import { limitesDeRangoLocal } from '../utils/formateo'

/**
 * Servicios del modulo Solicitud.
 *
 * Cada funcion devuelve directamente el payload ya desenvuelto por el
 * interceptor: quien llama trabaja con el objeto, nunca con el sobre.
 */

/**
 * Arma los query params descartando lo que este vacio.
 *
 * Se construye el objeto a mano en lugar de confiar en que axios ignore los
 * undefined: axios los omite, pero no los null, y mandar `estado=` a un
 * `[FromQuery] EnumEstadoSolicitud?` hace que el model binder falle al
 * enlazarlo.
 *
 * Ojo con el 0: `estado=0` es Borrador y es un filtro VALIDO, asi que no se
 * puede descartar con un `if (filtros.estado)` que se traga los ceros.
 */
function construirParams(filtros) {
  const { desde, hasta } = limitesDeRangoLocal(filtros.desde, filtros.hasta)
  const params = {
    pagina: filtros.pagina ?? 1,
    tamanoPagina: filtros.tamanoPagina ?? 20,
  }

  const codigo = filtros.codigo?.trim()

  if (codigo) {
    params.codigo = codigo
  }

  const clienteId = filtros.clienteId?.trim()

  if (clienteId) {
    params.clienteId = clienteId
  }

  if (filtros.estado !== null && filtros.estado !== undefined && filtros.estado !== '') {
    params.estado = filtros.estado
  }

  if (desde) {
    params.desde = desde
  }

  if (hasta) {
    params.hasta = hasta
  }

  return params
}

export async function listarSolicitudes(filtros, opciones = {}) {
  const { data } = await http.get('/solicitudes', {
    params: construirParams(filtros),
    signal: opciones.signal,
  })

  return data
}

export async function obtenerSolicitud(id, opciones = {}) {
  const { data } = await http.get(`/solicitudes/${id}`, { signal: opciones.signal })

  return data
}

export async function crearSolicitud(dto) {
  const { data } = await http.post('/solicitudes', dto)

  return data
}

/**
 * Aprueba la solicitud. Sin cuerpo: el estado de destino va en la ruta.
 *
 * PUT y no PATCH porque la operacion es idempotente: aprobar una solicitud ya
 * aprobada no cambia nada, y PUT declara eso en el propio metodo. PATCH
 * implicaria una modificacion parcial, que es algo mas de lo que ocurre aqui.
 */
export async function aprobarSolicitud(id) {
  const { data } = await http.put(`/solicitudes/${id}/aprobar`)

  return data
}

/**
 * Rechaza la solicitud.
 *
 * Recibe `{ id, motivo }` y no dos argumentos sueltos: useMutation entrega
 * `variables` como un UNICO argumento a mutationFn, asi que una firma
 * `(id, motivo)` recibiria el objeto entero como id y el contexto de la
 * mutacion como motivo.
 *
 * `motivo` va como query param, no en el cuerpo: el backend lo declara con
 * [FromQuery]. El backend responde 400 con el codigo SOL-004 si llega vacio,
 * pero el formulario lo exige antes para no gastar una ida al servidor.
 */
export async function rechazarSolicitud({ id, motivo }) {
  const { data } = await http.put(`/solicitudes/${id}/rechazar`, null, {
    params: { motivo },
  })

  return data
}

export async function anularSolicitud(id) {
  const { data } = await http.put(`/solicitudes/${id}/anular`)

  return data
}

/**
 * Id de correlacion de una peticion nueva, para citarlo al reportar una
 * incidencia. El backend responde { correlacionId }.
 */
export async function obtenerCorrelacion() {
  const { data } = await http.get('/solicitudes/correlacion')

  return data
}