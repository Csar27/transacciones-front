import { FilterX, Plus } from 'lucide-react'
import Campo from '../../../components/Campo'
import { Entrada, Selector } from '../../../components/CamposTexto'
import Boton from '../../../components/Boton'
import { ESTADOS } from '../../../utils/estados'
import { esUuid } from '../../../utils/formateo'

/**
 * Barra de filtros.
 *
 * Va unida a la cabecera de la tabla, no en una tarjeta aparte: filtros y datos
 * son la misma cosa y separarlos con un borde invita a pensar que son dos
 * regiones independientes.
 *
 * La fecha se pide en dia local y se convierte a UTC antes de enviar. Ver
 * `limitesDeRangoLocal`: mandar "2026-10-03" tal cual hace que el servidor
 * descarte las solicitudes de las primeras cinco horas de ese dia.
 */

/** Estado de partida: sin filtros, todo visible. */
export const FILTROS_INICIALES = {
  pagina: 1,
  tamanoPagina: 20,
  codigo: '',
  clienteId: '',
  estado: '',
  desde: '',
  hasta: '',
}

export default function Filtros({ filtros, alCambiar, alLimpiar, alNueva, hayFiltros }) {
  function cambiar(campo) {
    return (evento) => {
      const valor = evento.target.value

      // Cualquier cambio de filtro devuelve el listado a la primera pagina: si
      // se estaba en la 7 con un filtro y se quita, la pagina 7 ya no existe y
      // el usuario ve una lista vacia sin entender por que.
      alCambiar({ ...filtros, [campo]: valor, pagina: 1 })
    }
  }

  const clienteId = filtros.clienteId.trim()
  const clienteMalFormado = clienteId !== '' && !esUuid(clienteId)

  return (
    <div className="border-b border-line">
      <div className="grid grid-cols-1 gap-3 px-5 py-4 sm:grid-cols-2 lg:grid-cols-5">
        <Campo etiqueta="Codigo">
          {(props) => (
            <Entrada
              {...props}
              value={filtros.codigo}
              onChange={cambiar('codigo')}
              placeholder="SOL-2026"
              autoComplete="off"
            />
          )}
        </Campo>

        <Campo
          etiqueta="Cliente"
          error={clienteMalFormado ? 'Debe ser un UUID valido.' : undefined}
          ayuda="Identificador del cliente."
        >
          {(props) => (
            <Entrada
              {...props}
              value={filtros.clienteId}
              onChange={cambiar('clienteId')}
              placeholder="3fa85f64-5717-4562-b3fc-2c963f66afa6"
              autoComplete="off"
              spellCheck={false}
            />
          )}
        </Campo>

        <Campo etiqueta="Estado">
          {(props) => (
            <Selector {...props} value={filtros.estado} onChange={cambiar('estado')}>
              {/* El valor vacio es "todos". El 0 de Borrador es un filtro
                  valido y llega como string desde el DOM: se convierte con
                  Number para no mandar "0" donde la API espera un entero. */}
              <option value="">Todos</option>
              {ESTADOS.map((estado) => (
                <option key={estado.valor} value={estado.valor}>
                  {estado.nombre}
                </option>
              ))}
            </Selector>
          )}
        </Campo>

        <Campo etiqueta="Desde" ayuda="Fecha de solicitud minima.">
          {(props) => (
            <Entrada
              {...props}
              type="date"
              value={filtros.desde}
              onChange={cambiar('desde')}
            />
          )}
        </Campo>

        <Campo etiqueta="Hasta" ayuda="Ultima fecha de solicitud incluida.">
          {(props) => (
            <Entrada
              {...props}
              type="date"
              value={filtros.hasta}
              onChange={cambiar('hasta')}
            />
          )}
        </Campo>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-3">
        <Boton variante="neutro" tamano="sm" onClick={alLimpiar} disabled={!hayFiltros}>
          <FilterX size={14} aria-hidden="true" />
          Limpiar filtros
        </Boton>

        <Boton variante="primario" tamano="sm" onClick={alNueva}>
          <Plus size={14} aria-hidden="true" />
          Nueva solicitud
        </Boton>
      </div>
    </div>
  )
}