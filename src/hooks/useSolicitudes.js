import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  anularSolicitud,
  aprobarSolicitud,
  crearSolicitud,
  listarSolicitudes,
  obtenerCorrelacion,
  obtenerSolicitud,
  rechazarSolicitud,
} from '../api/solicitudes'
import { esUuid } from '../utils/formateo'

/**
 * Hooks de TanStack Query.
 *
 * Prefijo de clave comun: 'solicitudes'. Asi una sola invalidacion alcanza a las
 * dos familias, listado y detalle.
 */
export const CLAVE = 'solicitudes'
const CLAVE_LISTADO = [CLAVE, 'listado']
const CLAVE_DETALLE = [CLAVE, 'detalle']

/** Cuanto se considera fresco un listado antes de ir a la red otra vez. */
const FRESCURA_LISTADO = 15_000

/**
 * Listado paginado con filtros.
 *
 * `placeholderData` conserva la pagina anterior mientras llega la siguiente. Sin
 * esto, cambiar de pagina vacia la tabla entera y luego la repinta: un parpadeo
 * que en una tabla de datos parece que se han perdido los resultados.
 *
 * `enabled` bloquea la consulta si el filtro de cliente no es un UUID. Es el
 * requisito de no castigar al servidor con peticiones que van a fallar, y de
 * paso evita un 400 por clienteId.
 */
export function useListarSolicitudes(filtros) {
  const clienteId = filtros.clienteId?.trim()
  const clienteValido = !clienteId || esUuid(clienteId)

  return useQuery({
    queryKey: [...CLAVE_LISTADO, filtros],
    queryFn: ({ signal }) => listarSolicitudes(filtros, { signal }),
    enabled: clienteValido,
    placeholderData: (anterior) => anterior,
    staleTime: FRESCURA_LISTADO,
  })
}

/** Detalle de una solicitud. */
export function useDetalleSolicitud(id) {
  return useQuery({
    queryKey: [...CLAVE_DETALLE, id],
    queryFn: ({ signal }) => obtenerSolicitud(id, { signal }),
    enabled: Boolean(id),
  })
}

/** Alta. Tras crear se invalida el listado, que es lo unico que cambia. */
export function useCrearSolicitud() {
  const cliente = useQueryClient()

  return useMutation({
    mutationFn: crearSolicitud,
    onSuccess: () => {
      cliente.invalidateQueries({ queryKey: CLAVE_LISTADO })
    },
  })
}

/**
 * Aprobar, rechazar y anular comparten forma: un PUT a un endpoint, el backend
 * devuelve la solicitud ya actualizada y hay que reflejarla en las dos vistas.
 *
 * El fallo que arregla esto era sutil: se invalidaba SOLO el listado. Y
 * `invalidateQueries` refetchea unicamente las consultas ACTIVAS. Con la
 * pantalla de detalle abierta, el listado no esta activo, asi que se quedaba
 * marcado como viejo sin redibujarse: al volver a la lista, el estado seguia
 * siendo el anterior. La transicion se habia guardado y la pantalla mentia.
 *
 * Ahora, en este orden:
 *
 *  1. El detalle se escribe con la respuesta: la API devuelve el DTO completo
 *     tras la transicion, asi que no hace falta otra ida al servidor para pintar
 *     lo que ya esta en la mano.
 *  2. La fila se actualiza en TODAS las paginas cacheadas del listado, sin
 *     esperar al refetch. Da el cambio en el acto en lugar de un parpadeo.
 *  3. Se invalida el detalle y el listado para confirmar contra el servidor. Es
 *     una llamada extra, y aun asi compensa: lo que se muestra es el estado
 *     guardado, no una prediccion.
 */
function useTransicion(operacion) {
  const cliente = useQueryClient()

  return useMutation({
    mutationFn: operacion,
    onSuccess: (solicitud) => {
      if (!solicitud?.id) return

      cliente.setQueryData([...CLAVE_DETALLE, solicitud.id], solicitud)

      cliente.setQueriesData({ queryKey: CLAVE_LISTADO }, (pagina) => {
        if (!pagina?.items) return pagina

        return {
          ...pagina,
          items: pagina.items.map((item) =>
            item.id === solicitud.id ? solicitud : item,
          ),
        }
      })

      cliente.invalidateQueries({ queryKey: CLAVE_LISTADO })
      cliente.invalidateQueries({ queryKey: [...CLAVE_DETALLE, solicitud.id] })
    },
  })
}

export function useAprobarSolicitud() {
  return useTransicion(aprobarSolicitud)
}

/**
 * El rechazo necesita id Y motivo, asi que la operacion se envuelve.
 *
 * useMutation entrega `variables` a `mutationFn` como un UNICO argumento. Si se
 * pasara `rechazarSolicitud` directamente, recibiria el objeto entero como id
 * —que interpolado en la ruta daba ".../{id,motivo}/rechazar", un 404— y el
 * contexto de la mutacion como motivo —"[object Object]" en el query param.
 */
export function useRechazarSolicitud() {
  return useTransicion(({ id, motivo }) => rechazarSolicitud({ id, motivo }))
}

export function useAnularSolicitud() {
  return useTransicion(anularSolicitud)
}

/**
 * Id de correlacion.
 *
 * Va como mutacion y no como consulta a proposito: cada llamada debe dar un id
 * NUEVO y no uno cacheado. Como consulta, TanStack devolveria el mismo valor
 * durante 15 segundos y el soporte recibiria un id que ya no corresponde a nada.
 */
export function useCorrelacion() {
  return useMutation({ mutationFn: obtenerCorrelacion })
}