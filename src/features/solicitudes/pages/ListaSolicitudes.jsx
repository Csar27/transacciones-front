import { useMemo, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ChevronRight, FileSearch, Inbox } from 'lucide-react'
import Filtros, { FILTROS_INICIALES } from '../components/Filtros'
import DialogoRechazo from '../components/DialogoRechazo'
import {
  useCrearSolicitud,
  useListarSolicitudes,
  useRechazarSolicitud,
} from '../../../hooks/useSolicitudes'
import { useDebounce } from '../../../hooks/useDebounce'
import { Cargando, EsqueletoTabla } from '../../../components/Esqueleto'
import Dialogo from '../../../components/Dialogo'
import FormularioSolicitud from '../components/FormularioSolicitud'
import InsigniaEstado from '../../../components/InsigniaEstado'
import MedidorVigencia from '../../../components/MedidorVigencia'
import Paginacion from '../../../components/Paginacion'
import PanelError from '../../../components/PanelError'
import Vacio from '../../../components/Vacio'
import Boton from '../../../components/Boton'
import { ESTADO, esVencenable } from '../../../utils/estados'
import { formatearMonto, formatearUuid } from '../../../utils/formateo'

/**
 * Listado de solicitudes.
 *
 * Los filtros viven en dos estados: uno inmediato, que es lo que el usuario ve
 * mientras escribe, y otro con retardo, que es lo que se consulta. Mezclarlos
 * significa siete peticiones por cada codigo tecleado.
 */
export default function ListaSolicitudes() {
  const navegar = useNavigate()
  const [filtros, setFiltros] = useState(FILTROS_INICIALES)
  const [crearAbierto, setCrearAbierto] = useState(false)
  const [rechazando, setRechazando] = useState(null)

  const codigoDiferido = useDebounce(filtros.codigo)
  const clienteDiferido = useDebounce(filtros.clienteId)

  const aplicados = useMemo(
    () => ({ ...filtros, codigo: codigoDiferido, clienteId: clienteDiferido }),
    [filtros, codigoDiferido, clienteDiferido],
  )

  const { data, isPending, isError, error, isFetching, refetch } = useListarSolicitudes(aplicados)

  const crear = useCrearSolicitud()
  const rechazar = useRechazarSolicitud()

  const hayFiltros = Boolean(
    filtros.codigo || filtros.clienteId || filtros.estado !== '' || filtros.desde || filtros.hasta,
  )

  const filas = data?.items ?? []
  const totalRegistros = data?.totalRegistros ?? 0

  async function alCrear(dto) {
    const solicitud = await crear.mutateAsync(dto)

    setCrearAbierto(false)
    toast.success(`${solicitud.codigo} creada`)
    navegar(`/solicitudes/${solicitud.id}`)
  }

  /**
   * Rechazo lanzado desde la fila del listado.
   *
   * Mismo criterio que en el detalle: el dialogo se cierra si la operacion fue
   * bien y se queda abierto si fallo, para que el error se vea y se pueda
   * reintentar. El refetch cubre el caso en que el servidor guardo y la
   * respuesta se perdio.
   */
  async function alRechazar(motivo) {
    try {
      const actualizada = await rechazar.mutateAsync({
        id: rechazando.id,
        motivo,
      })

      setRechazando(null)

      toast.success(`${actualizada.codigo} rechazada`)
    } catch (error) {
      // Un error por campo lo muestra DialogoRechazo bajo su textarea.
      if (error?.campos?.motivo) throw error

      toast.error(
        error?.mensaje ??
          'No se pudo rechazar. Se ha refrescado el listado para comprobar si se guardo.',
      )

      void refetch()
    }
  }

  return (
    <>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-[-0.02em] text-ink">Solicitudes</h1>
          <p className="mt-0.5 text-[13px] text-ink-muted">
            {totalRegistros > 0
              ? `${totalRegistros} en total`
              : 'Registro y seguimiento de solicitudes'}
          </p>
        </div>

        {isFetching && !isPending && (
          <span className="text-xs text-ink-muted" role="status">
            Actualizando…
          </span>
        )}
      </div>

      <section className="rounded-lg border border-line bg-surface">
        <Filtros
          filtros={filtros}
          alCambiar={setFiltros}
          hayFiltros={hayFiltros}
          alLimpiar={() => setFiltros(FILTROS_INICIALES)}
          alNueva={() => setCrearAbierto(true)}
        />

        {isError ? (
          <div className="p-5">
            <PanelError error={error} alReintentar={() => refetch()} />
          </div>
        ) : isPending ? (
          <Cargando mensaje="Cargando solicitudes">
            <EsqueletoTabla filas={8} columnas={6} />
          </Cargando>
        ) : filas.length === 0 ? (
          hayFiltros ? (
            <Vacio
              icono={FileSearch}
              titulo="Ninguna solicitud coincide"
              descripcion="Prueba a quitar algun filtro o a ampliar el rango de fechas."
              accion={
                <Boton variante="secundario" onClick={() => setFiltros(FILTROS_INICIALES)}>
                  Limpiar filtros
                </Boton>
              }
            />
          ) : (
            <Vacio
              icono={Inbox}
              titulo="Todavia no hay solicitudes"
              descripcion="Crea la primera para empezar a darle seguimiento."
              accion={
                <Boton variante="primario" onClick={() => setCrearAbierto(true)}>
                  Nueva solicitud
                </Boton>
              }
            />
          )
        ) : (
          <>
            <Tabla solicitudes={filas} onRechazar={setRechazando} />
            <Paginacion
              pagina={data.pagina}
              totalPaginas={data.totalPaginas}
              totalRegistros={data.totalRegistros}
              tamanoPagina={data.tamanoPagina}
              alCambiarPagina={(pagina) => setFiltros((actuales) => ({ ...actuales, pagina }))}
            />
          </>
        )}
      </section>

      <Dialogo
        abierto={crearAbierto}
        titulo="Nueva solicitud"
        descripcion="Se registra en estado Registrada, con su vigencia empezando a correr."
        onCerrar={() => setCrearAbierto(false)}
        ancho="lg"
      >
        <FormularioSolicitud
          alCancelar={() => setCrearAbierto(false)}
          alCrear={alCrear}
        />
      </Dialogo>

      <DialogoRechazo
        abierto={Boolean(rechazando)}
        solicitud={rechazando}
        cargando={rechazar.isPending}
        alCerrar={() => setRechazando(null)}
        alRechazar={alRechazar}
      />
    </>
  )
}

function Tabla({ solicitudes, onRechazar }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[56rem] border-collapse">
        <caption className="sr-only">Listado de solicitudes</caption>

        <thead>
          <tr className="border-b border-line">
            <th scope="col" className="px-5 py-2.5 text-left text-xs font-medium text-ink-muted">
              Codigo
            </th>
            <th scope="col" className="px-5 py-2.5 text-left text-xs font-medium text-ink-muted">
              Cliente
            </th>
            <th scope="col" className="px-5 py-2.5 text-right text-xs font-medium text-ink-muted">
              Monto
            </th>
            <th scope="col" className="px-5 py-2.5 text-left text-xs font-medium text-ink-muted">
              Estado
            </th>
            <th scope="col" className="px-5 py-2.5 text-left text-xs font-medium text-ink-muted">
              Vigencia
            </th>
            <th scope="col" className="w-10 px-2 py-2.5">
              <span className="sr-only">Acciones</span>
            </th>
          </tr>
        </thead>

        <tbody>
          {solicitudes.map((solicitud) => (
            <Fila key={solicitud.id} solicitud={solicitud} onRechazar={onRechazar} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Fila({ solicitud, onRechazar }) {
  const navegar = useNavigate()
  const vencenable = esVencenable(solicitud.estado)

  return (
    <tr
      onClick={() => navegar(`/solicitudes/${solicitud.id}`)}
      className="h-12 cursor-pointer border-b border-line transition-colors
        last:border-b-0 hover:bg-canvas"
    >
      <td className="px-5 py-2.5">
        {/* El enlace real es lo que hace accesible la navegacion con teclado.
            El onClick de la fila cubre al raton. */}
        <Link
          to={`/solicitudes/${solicitud.id}`}
          onClick={(evento) => evento.stopPropagation()}
          className="font-medium text-ink hover:text-brand hover:underline
            underline-offset-2"
        >
          {solicitud.codigo}
        </Link>
      </td>

      <td className="px-5 py-2.5 text-[13px] text-ink-muted" title={solicitud.clienteId}>
        {formatearUuid(solicitud.clienteId)}
      </td>

      <td className="px-5 py-2.5 text-right text-[13px] text-ink">
        {formatearMonto(solicitud.monto, solicitud.moneda)}
      </td>

      <td className="px-5 py-2.5">
        <InsigniaEstado estado={solicitud.estado} />
      </td>

      <td className="px-5 py-2.5">
        {vencenable ? (
          <MedidorVigencia solicitud={solicitud} />
        ) : (
          // El medidor solo se dibuja en los estados donde la vigencia corre.
          // Ponerlo en una solicitud ya decidida seria mostrar un reloj que no
          // avanza.
          <span className="text-[13px] text-ink-muted/70" title="Esta solicitud ya no vence.">
            —
          </span>
        )}
      </td>

      <td className="px-2 py-2.5">
        <div className="flex items-center justify-end gap-0.5">
          {/* Rechazar es la unica transicion que se resuelve sin abrir el
              detalle; aprobar y anular exigen revisar la solicitud. */}
          {solicitud.estado === ESTADO.REGISTRADA && (
            <button
              type="button"
              onClick={(evento) => {
                evento.stopPropagation()
                onRechazar(solicitud)
              }}
              aria-label={`Rechazar ${solicitud.codigo}`}
              className="rounded-md px-2 py-1 text-xs font-medium text-danger
                hover:bg-danger-tint"
            >
              Rechazar
            </button>
          )}

          <ChevronRight size={15} aria-hidden="true" className="text-ink-muted/50" />
        </div>
      </td>
    </tr>
  )
}