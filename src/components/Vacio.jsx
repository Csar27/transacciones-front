/**
 * Pantalla vacia.
 *
 * Un hueco vacio es una invitacion a actuar, no un sitio triste: dice que falta
 * y ofrece el boton que lo llena. Cuando hay filtros puestos y no sale nada, el
 * texto es el de los filtros y la accion es limpiarlos, porque el problema casi
 * nunca es que no haya solicitudes.
 */
export default function Vacio({ icono: Icono, titulo, descripcion, accion }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      {Icono && (
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-canvas text-ink-muted">
          <Icono size={20} aria-hidden="true" />
        </span>
      )}

      <p className="text-sm font-semibold text-ink">{titulo}</p>

      {descripcion && (
        <p className="max-w-[52ch] text-[13px] leading-relaxed text-ink-muted">{descripcion}</p>
      )}

      {accion && <div className="mt-1">{accion}</div>}
    </div>
  )
}