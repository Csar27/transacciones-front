/**
 * Estados de carga con esqueleto.
 *
 * El esqueleto replica la forma real de la tabla: misma altura de fila, mismo
 * numero de columnas. Un "cargando" centrado en una pantalla vacia hace saltar
 * el contenido al aparecer y obliga a volver a leer; el esqueleto mantiene la
 * pagina quieta.
 */

function Barra({ ancho }) {
  return <span className={`block h-3 rounded-sm bg-canvas ${ancho}`} />
}

export function EsqueletoTabla({ filas = 8, columnas = 6 }) {
  const anchos = ['w-28', 'w-20', 'w-24', 'w-20', 'w-28', 'w-16']

  return (
    <div aria-hidden="true">
      {Array.from({ length: filas }, (_, indiceFila) => (
        <div
          key={indiceFila}
          className="flex items-center gap-6 border-b border-line px-5 h-12 last:border-b-0"
        >
          {Array.from({ length: columnas }, (_, indiceColumna) => (
            <Barra key={indiceColumna} ancho={anchos[indiceColumna] ?? 'w-20'} />
          ))}
        </div>
      ))}
    </div>
  )
}

export function EsqueletoDetalle({ filas = 6 }) {
  return (
    <div aria-hidden="true" className="flex flex-col gap-3">
      {Array.from({ length: filas }, (_, indice) => (
        <div key={indice} className="flex items-center gap-4">
          <Barra ancho="w-32" />
          <Barra ancho="w-48" />
        </div>
      ))}
    </div>
  )
}

/**
 * Envoltorio que anuncia la carga sin mostrarla.
 *
 * aria-busy avisa a la tecnologia asistiva de que la region se esta Actualizando,
 * y el texto oculto evita que el mensaje exista solo para quien ve.
 */
export function Cargando({ children, mensaje = 'Cargando…', className = '' }) {
  return (
    <div aria-busy="true" aria-live="polite" className={className}>
      <span className="sr-only">{mensaje}</span>
      {children}
    </div>
  )
}