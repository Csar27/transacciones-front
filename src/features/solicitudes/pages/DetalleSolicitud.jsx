import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ArrowLeft, Ban, Check, XCircle } from 'lucide-react'
import MapaEstados from '../../../components/MapaEstados'
import InsigniaEstado from '../../../components/InsigniaEstado'
import MedidorVigencia from '../../../components/MedidorVigencia'
import PanelError from '../../../components/PanelError'
import Confirmar from '../../../components/Confirmar'
import DialogoRechazo from '../components/DialogoRechazo'
import Boton from '../../../components/Boton'
import { Cargando, EsqueletoDetalle } from '../../../components/Esqueleto'
import {
  useAnularSolicitud,
  useAprobarSolicitud,
  useDetalleSolicitud,
  useRechazarSolicitud,
} from '../../../hooks/useSolicitudes'
import { accionesDisponibles, esVencenable, fichaEstado } from '../../../utils/estados'
import { formatearFecha, formatearFechaHora, formatearMonto } from '../../../utils/formateo'
import { nombreDe } from '../../../utils/monedas'

/**
 * Detalle de una solicitud.
 *
 * Los botones no son fijos: salen de la tabla de transiciones del dominio. Si
 * una solicitud esta Aprobada, no hay "Aprobar"; si esta Anulada, no hay nada.
 * Las acciones que no son posibles ni se muestran ni se ofrecen como boton
 * deshabilitado: en una pantalla de detalle, un boton gris que no va a hacer
 * nada solo hace perder el tiempo a quien lo ve.
 *
 * Un caso distinto es Rechazar, que aparece en la lista y pide confirmacion
 * aqui. Ese si exige revisar la solicitud.
 */
export default function DetalleSolicitud() {
  const { id } = useParams()
  const navegar = useNavigate()

  const [confirmando, setConfirmando] = useState(null)
  const [rechazando, setRechazando] = useState(false)

  const { data: solicitud, isPending, isError, error, refetch } = useDetalleSolicitud(id)

  const aprobar = useAprobarSolicitud()
  const rechazar = useRechazarSolicitud()
  const anular = useAnularSolicitud()

  if (isError) {
    const noEncontrada = error?.esNoEncontrado

    return (
      <div className="max-w-2xl">
        <EnlaceVolver onClick={() => navegar('/')} />

        <PanelError
          error={
            noEncontrada
              ? {
                  mensaje: 'La solicitud que buscas no existe o fue eliminada.',
                  correlationId: error.correlationId,
                }
              : error
          }
          titulo={noEncontrada ? 'Solicitud no encontrada' : undefined}
          alReintentar={noEncontrada ? undefined : () => refetch()}
        />

        <div className="mt-4">
          <Boton variante="secundario" onClick={() => navegar('/')}>
            Volver al listado
          </Boton>
        </div>
      </div>
    )
  }

  if (isPending) {
    return (
      <Cargando mensaje="Cargando la solicitud">
        <div className="max-w-3xl rounded-lg border border-line bg-surface p-6">
          <EsqueletoDetalle filas={7} />
        </div>
      </Cargando>
    )
  }

  if (!solicitud) return null

  const acciones = accionesDisponibles(solicitud.estado)
  const ficha = fichaEstado(solicitud.estado)

  /**
   * Ejecuta una transicion de estado.
   *
   * El detalle se refresca SIEMPRE, y eso no es un extra: si la peticion se
   * guardo en el servidor pero la respuesta se perdio —un timeout con los
   * reintentos, una caida de red— la mutacion falla, el usuario ve un error, y
   * sin un refetch la pantalla sigue mostrando el estado anterior. Con el
   * refetch, la verdad la dice el servidor: o aparece el estado nuevo, o
   * confirma que no se guardo.
   *
   * El dialogo se cierra solo si la operacion fue bien. Si fallo, se queda
   * abierto para que el usuario vea el motivo y pueda reintentar sin repetir la
   * navegacion.
   */
  async function transicionar(accion) {
    const mutacion = { aprobar, anular }[accion]

    try {
      const actualizada = await mutacion.mutateAsync(solicitud.id)

      setConfirmando(null)

      toast.success(
        `${actualizada.codigo}: ${fichaEstado(actualizada.estado).nombre.toLowerCase()}`,
      )
    } catch (error) {
      toast.error(
        error?.mensaje ??
          'No se pudo completar la operacion. Se ha refrescado el detalle para comprobar si se guardo.',
      )

      void refetch()
    }
  }

  const busy = aprobar.isPending || rechazar.isPending || anular.isPending

  return (
    <>
      <EnlaceVolver onClick={() => navegar('/')} />

      <header className="mt-3 flex flex-wrap items-start justify-between gap-x-8 gap-y-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-[-0.02em] text-ink">
              {solicitud.codigo}
            </h1>
            <InsigniaEstado estado={solicitud.estado} />
          </div>

          <p className="mt-1.5 max-w-[60ch] text-[13px] leading-relaxed text-ink-muted">
            {ficha.descripcion}
          </p>
        </div>

        <div className="text-right">
          <p className="text-xl font-semibold tracking-[-0.01em] text-ink tabular-nums">
            {formatearMonto(solicitud.monto, solicitud.moneda)}
          </p>

          <div className="mt-1.5 flex justify-end">
            {esVencenable(solicitud.estado) ? (
              <MedidorVigencia solicitud={solicitud} ancho="w-24" />
            ) : (
              <span className="text-xs text-ink-muted">
                {solicitud.fechaAprobacion
                  ? `Aprobada el ${formatearFecha(solicitud.fechaAprobacion)}`
                  : 'Sin vigencia'}
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <div className="space-y-4">
          <MapaEstados estadoActual={solicitud.estado} />

          {acciones.length > 0 ? (
            <div className="flex flex-col gap-2">
              {acciones.map((accion) => (
                <AccionBoton
                  key={accion.id}
                  accion={accion}
                  disabled={busy}
                  onClick={() => {
                    if (accion.exigeMotivo) {
                      setRechazando(true)

                      return
                    }

                    setConfirmando(accion.id)
                  }}
                />
              ))}
            </div>
          ) : (
            <p className="rounded-md border border-line bg-surface px-4 py-3 text-[13px] text-ink-muted">
              Esta solicitud esta en un estado final: no admite mas cambios.
            </p>
          )}
        </div>

        <div className="space-y-6">
          {solicitud.motivoRechazo && (
            <section className="rounded-md border border-danger-line bg-danger-tint px-4 py-3.5">
              <h2 className="text-[13px] font-semibold text-danger">Motivo del rechazo</h2>
              <p className="mt-1 text-[13px] leading-relaxed text-danger-body">
                {solicitud.motivoRechazo}
              </p>
            </section>
          )}

          <section className="rounded-md border border-line bg-surface">
            <h2 className="border-b border-line px-4 py-2.5 text-[13px] font-semibold text-ink">
              Datos de la solicitud
            </h2>

            <dl className="grid grid-cols-1 gap-x-8 px-4 py-1 sm:grid-cols-2">
              <Dato etiqueta="Cliente" valor={solicitud.clienteId} completo />
              <Dato etiqueta="Fecha de solicitud" valor={formatearFechaHora(solicitud.fechaSolicitud)} />
              <Dato etiqueta="Fecha de vencimiento" valor={formatearFechaHora(solicitud.fechaVencimiento)} />
              <Dato etiqueta="Vigencia" valor={`${diasDeVigencia(solicitud)} dias`} />
              <Dato
                etiqueta="Moneda"
                valor={`${solicitud.moneda} — ${nombreDe(solicitud.moneda)}`}
              />
              <Dato etiqueta="Observacion" valor={solicitud.observacion} />
              <Dato etiqueta="Fecha de aprobacion" valor={solicitud.fechaAprobacion ? formatearFechaHora(solicitud.fechaAprobacion) : null} />
              <Dato etiqueta="Creado por" valor={solicitud.creadoPor} />
              <Dato etiqueta="Fecha de creacion" valor={formatearFechaHora(solicitud.fechaCreacion)} />
            </dl>
          </section>
        </div>
      </div>

      <Confirmar
        abierto={confirmando === 'aprobar'}
        titulo="Aprobar solicitud"
        descripcion={`${solicitud.codigo} pasara a estado Aprobada.`}
        textoConfirmar="Aprobar"
        cargando={aprobar.isPending}
        alConfirmar={() => transicionar('aprobar')}
        alCerrar={() => setConfirmando(null)}
      />

      <Confirmar
        abierto={confirmando === 'anular'}
        titulo="Anular solicitud"
        descripcion={`${solicitud.codigo} pasara a estado Anulada.`}
        textoConfirmar="Anular"
        peligro
        cargando={anular.isPending}
        alConfirmar={() => transicionar('anular')}
        alCerrar={() => setConfirmando(null)}
      />

      <DialogoRechazo
        abierto={rechazando}
        solicitud={solicitud}
        cargando={rechazar.isPending}
        alCerrar={() => setRechazando(false)}
        alRechazar={async (motivo) => {
          try {
            const actualizada = await rechazar.mutateAsync({
              id: solicitud.id,
              motivo,
            })

            setRechazando(false)

            toast.success(`${actualizada.codigo} rechazada`)
          } catch (error) {
            // Si el servidor devuelve el error asociado a un campo, se relanza para que
            // DialogoRechazo los muestre bajo su textarea: son de un input
            // concreto y un toast no dice donde corregir.
            if (error?.campos?.motivo) throw error

            // Cualquier otro fallo se resuelve aqui. Mismo criterio que
            // transicionar(): el servidor puede haber guardado y perder la
            // respuesta, y el refetch dice la verdad.
            toast.error(
              error?.mensaje ??
                'No se pudo rechazar. Se ha refrescado el detalle para comprobar si se guardo.',
            )

            void refetch()
          }
        }}
      />
    </>
  )
}

function EnlaceVolver({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 text-[13px] text-ink-muted hover:text-ink"
    >
      <ArrowLeft size={14} aria-hidden="true" />
      Volver al listado
    </button>
  )
}

/**
 * Boton de una transicion.
 *
 * El icono y el tono salen de la propia accion, asi que la tabla de acciones y
 * la de estados no pueden desincronizarse en el color.
 */
function AccionBoton({ accion, disabled, onClick }) {
  const Icono = { aprobar: Check, rechazar: XCircle, anular: Ban }[accion.id] ?? Check

  return (
    <Boton variante={accion.tono === 'peligro' ? 'peligro' : accion.tono} onClick={onClick} disabled={disabled}>
      <Icono size={15} aria-hidden="true" />
      {accion.etiqueta}
    </Boton>
  )
}

function Dato({ etiqueta, valor, completo = false }) {
  const vacio = valor === null || valor === undefined || valor === ''

  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line py-2.5 last:border-b-0 sm:last:border-b">
      <dt className="shrink-0 text-[13px] text-ink-muted">{etiqueta}</dt>
      <dd
        className={`min-w-0 text-right text-[13px] text-ink ${completo ? 'break-all' : ''}`}
      >
        {vacio ? <span className="text-ink-muted/70">—</span> : valor}
      </dd>
    </div>
  )
}

/** Dias entre la solicitud y su vencimiento, tal y como los pide el backend. */
function diasDeVigencia(solicitud) {
  const inicio = new Date(solicitud.fechaSolicitud).getTime()
  const fin = new Date(solicitud.fechaVencimiento).getTime()

  return Math.round((fin - inicio) / 86_400_000)
}