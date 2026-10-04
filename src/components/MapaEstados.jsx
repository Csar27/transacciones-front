import { ESTADOS, TRANSICIONES, fichaEstado } from '../utils/estados'

/**
 * Mapa de la maquina de estados.
 *
 * Dibuja la tabla de transiciones del dominio como una lista de conexiones:
 * cada fila es un movimiento permitido, "origen —— destino". La fila donde el
 * origen es el estado actual se destaca.
 *
 * Es informacion, no el mecanismo de la accion: los botones de abajo son los
 * que de verdad se pulsan, llevan su propio estado deshabilitado y su texto.
 * El mapa no puede ser la unica forma de saber que se puede hacer, asi que se
 * marca como imagen con una descripcion y queda decorativo para el arbol de
 * accesibilidad.
 */

const GRUPOS = ESTADOS.map((origen) => ({
  origen,
  destinos: TRANSICIONES.filter(([desde]) => desde === origen.valor).map(([, hasta]) =>
    fichaEstado(hasta),
  ),
})).filter((grupo) => grupo.destinos.length > 0)

/** aria-label tiene que ser texto plano, no un elemento. */
function descripcionMapa(estadoActual) {
  const { nombre } = fichaEstado(estadoActual)

  return (
    `Maquina de estados de solicitudes. Estado actual: ${nombre}. ` +
    'Las transiciones posibles desde el estado actual aparecen destacadas.'
  )
}

function Fila({ origen, destinos, estadoActual }) {
  const desdeActual = origen.valor === estadoActual

  return (
    <>
      {destinos.map((destino, indice) => {
        const esDestinoActual = destino.valor === estadoActual
        const Connectado = desdeActual || esDestinoActual

        return (
          <div key={`${origen.valor}-${destino.valor}`} className="flex items-center gap-3 py-[3px]">
            {/* El origen solo se escribe en la primera fila del grupo, pero el
                hueco se reserva siempre: asi los destinos de todos los grupos
                quedan alineados en la misma columna. */}
            {indice === 0 ? (
              <span
                className={`w-24 shrink-0 truncate text-[13px] ${
                  desdeActual ? 'font-semibold text-ink' : 'text-ink-muted'
                }`}
              >
                {origen.nombre}
              </span>
            ) : (
              <span aria-hidden="true" className="w-24 shrink-0" />
            )}

            <span
              aria-hidden="true"
              className={`h-px w-7 shrink-0 ${Connectado ? 'bg-brand' : 'bg-line-strong'}`}
            />

            <span
              className={`flex items-center gap-1.5 text-[13px] ${
                Connectado ? 'font-medium text-ink' : 'text-ink-muted'
              }`}
            >
              {esDestinoActual && (
                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-brand" />
              )}
              {destino.nombre}
            </span>
          </div>
        )
      })}
    </>
  )
}

export default function MapaEstados({ estadoActual }) {
  return (
    <figure className="rounded-md border border-line bg-surface">
      <figcaption className="border-b border-line px-4 py-2.5">
        <h3 className="text-[13px] font-semibold text-ink">Maquina de estados</h3>
        <p className="mt-0.5 text-xs text-ink-muted">
          Las transiciones posibles desde el estado actual aparecen destacadas.
        </p>
      </figcaption>

      <div role="img" aria-label={descripcionMapa(estadoActual)}>
        <div className="px-4 py-3">
          {GRUPOS.map((grupo) => (
            <div key={grupo.origen.valor} className="mb-1 last:mb-0">
              <Fila
                origen={grupo.origen}
                destinos={grupo.destinos}
                estadoActual={estadoActual}
              />
            </div>
          ))}
        </div>
      </div>
    </figure>
  )
}