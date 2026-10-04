import axios from 'axios'

/**
 * Cliente HTTP unico de la aplicacion.
 *
 * La API tiene DOS formatos de respuesta y toda la app habla el mismo:
 *
 *   exito  ->  { exito: true, datos: <payload>, mensaje }
 *   error  ->  { exito: false, codigo, mensaje, correlationId, datos? }
 *
 * Este interceptor desenvuelve el primer caso y convierte el segundo en un
 * `ErrorApi` con siempre los mismos campos. A partir de aqui, ningun
 * componente sabe que existio un sobre.
 *
 * Tambien acepta ProblemDetails ({ type, title, detail, errors }) aunque la API
 * actual no lo emite. Cuesta veinte lineas y evita reescribir todo el cliente
 * el dia que la API lo adopte. Si la respuesta tiene `exito` gana ese formato;
 * si no, se interpreta como ProblemDetails.
 */

const BASE_URL = import.meta.env.VITE_API_URL || '/api'

/**
 * Error normalizado de la API.
 *
 * `campos` lleva el detalle campo a campo de un 400 de validacion, en la forma
 * { monto: ['El monto debe estar entre 0.01 y 9999999.99.'] }, con las claves
 * ya en camelCase para que casen con los nombres del formulario.
 */
export class ErrorApi extends Error {
  constructor({ status, codigo, mensaje, correlationId, campos }) {
    super(mensaje)
    this.name = 'ErrorApi'
    this.status = status
    this.codigo = codigo
    this.correlationId = correlationId
    this.campos = campos
  }

  /** Sin conexion con el servidor. Se distingue del error de la API. */
  get esDeRed() {
    return this.status === 0
  }

  get esNoEncontrado() {
    return this.status === 404
  }

  get esConflicto() {
    return this.status === 409
  }
}

export function esErrorApi(error) {
  return error instanceof ErrorApi
}

/* -------------------------------------------------------------------------
   Token
   -------------------------------------------------------------------------
   No hay autenticacion todavia. El enganche queda puesto y documentado: cuando
   exista un login, basta con llamar a `definirProveedorDeToken` con una funcion
   que devuelva el Bearer, y no hay que tocar ni el cliente ni los servicios.

     definirProveedorDeToken(() => localStorage.getItem('token'))

   Si devuelve null o una cadena vacia, no se manda cabecera Authorization.
   ------------------------------------------------------------------------- */
let obtenerToken = () => null

export function definirProveedorDeToken(obtener) {
  obtenerToken = typeof obtener === 'function' ? obtener : () => null
}

export const http = axios.create({
  baseURL: BASE_URL,
  // Un timeout corto: sin el, una API colgada deja el boton en "cargando"
  // indefinidamente y el usuario no sabe si pulsar de nuevo o esperar.
  timeout: 20_000,
  headers: { Accept: 'application/json' },
})

http.interceptors.request.use((config) => {
  const token = obtenerToken()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

http.interceptors.response.use(normalizarExito, (error) => Promise.reject(normalizarError(error)))

/* -------------------------------------------------------------------------
   Normalizacion
   ------------------------------------------------------------------------- */

/**
 * Camino de exito: desenvuelve el sobre.
 *
 * Se exporta por separado del interceptor para poder probarlo sin axios: es una
 * funcion pura sobre la respuesta y su logica es justamente la que conviene
 * verificar, que el payload llegue plano a los servicios.
 */
export function normalizarExito(respuesta) {
  const cuerpo = respuesta.data

  // Un 200 con exito:false tambien es un fallo. Sin esta comprobacion, un
  // cliente que solo mire el status daria por buena una respuesta de error.
  if (tieneSobre(cuerpo) && cuerpo.exito === false) {
    throw construirDesdeSobre(cuerpo, respuesta.status, respuesta.headers)
  }

  return { ...respuesta, data: desenvelope(cuerpo) }
}

export function normalizarError(error) {
  const respuesta = error.response

  if (!respuesta) {
    const esTemporizador = error.code === 'ECONNABORTED'

    return new ErrorApi({
      status: 0,
      codigo: esTemporizador ? 'RED-TIMEOUT' : 'RED-SIN-RESPUESTA',
      mensaje: esTemporizador
        ? 'El servidor tardo demasiado en responder. Intentalo de nuevo.'
        : 'No hay conexion con el servidor. Revisa que la API este encendida.',
      correlationId: null,
      campos: null,
    })
  }

  const cuerpo = respuesta.data

  if (tieneSobre(cuerpo)) {
    return construirDesdeSobre(cuerpo, respuesta.status, respuesta.headers)
  }

  if (cuerpo && typeof cuerpo === 'object') {
    return construirDesdeProblemDetails(cuerpo, respuesta.status, respuesta.headers)
  }

  // Respuesta sin cuerpo o con algo que no es JSON: un 502 de un proxy, por
  // ejemplo. El codigo de estado sigue siendo informacion util.
  return new ErrorApi({
    status: respuesta.status,
    codigo: `GEN-${respuesta.status}`,
    mensaje: `El servidor devolvio ${respuesta.status} sin una respuesta que se pueda leer.`,
    correlationId: leerCorrelationId(respuesta.headers),
    campos: null,
  })
}

function construirDesdeSobre(cuerpo, status, cabeceras) {
  return new ErrorApi({
    status,
    codigo: cuerpo.codigo || `GEN-${status}`,
    mensaje: cuerpo.mensaje || 'La peticion no se pudo completar.',
    correlationId: cuerpo.correlationId || leerCorrelationId(cabeceras),
    campos: normalizarCampos(cuerpo.datos),
  })
}

function construirDesdeProblemDetails(cuerpo, status, cabeceras) {
  const porCampo = normalizarCampos(cuerpo.errors)

  return new ErrorApi({
    status: cuerpo.status || status,
    codigo: 'GEN-400',
    mensaje: cuerpo.detail || cuerpo.title || 'La peticion no se pudo completar.',
    correlationId: leerCorrelationId(cabeceras),
    campos: porCampo,
  })
}

function tieneSobre(cuerpo) {
  return Boolean(cuerpo) && typeof cuerpo === 'object' && 'exito' in cuerpo
}

function desenvelope(cuerpo) {
  return tieneSobre(cuerpo) ? cuerpo.datos : cuerpo
}

/**
 * Convierte el diccionario de errores de validacion a la forma que usa el
 * formulario.
 *
 * Las claves llegan en la notacion de ASP.NET, que es PascalCase y puede venir
 * con el prefijo "payload." si el error esta dentro del cuerpo de la peticion.
 * Se normalizan a camelCase para que coincidan con los nombres de los campos.
 */
function normalizarCampos(datos) {
  if (!datos || typeof datos !== 'object' || Array.isArray(datos)) return null

  const claves = Object.keys(datos)

  if (claves.length === 0) return null

  const salida = {}

  for (const clave of claves) {
    const valor = datos[clave]
    const mensajes = (Array.isArray(valor) ? valor : [valor])
      .filter((mensaje) => mensaje !== null && mensaje !== undefined && mensaje !== '')
      .map(String)

    if (mensajes.length > 0) {
      salida[normalizarClave(clave)] = mensajes
    }
  }

  return Object.keys(salida).length > 0 ? salida : null
}

function normalizarClave(clave) {
  const limpia = clave.replace(/^payload\./i, '')

  return limpia.charAt(0).toLowerCase() + limpia.slice(1)
}

/**
 * El identificador de correlacion sirve para que soporte pueda seguir una
 * incidencia en los logs de la API.
 *
 * El middleware lo devuelve en TODAS las respuestas, asi que se lee de ahi
 * primero; el cuerpo es el segundo sitio donde mirar, por si un proxy
 * intermedio hubiera comido la cabecera.
 */
function leerCorrelationId(cabeceras) {
  if (!cabeceras) return null

  const cabecerasNormalizadas = cabeceras.toJSON ? cabeceras.toJSON() : cabeceras

  return (
    cabecerasNormalizadas['x_correlationid'] ??
    cabecerasNormalizadas['X_correlationId'] ??
    null
  )
}