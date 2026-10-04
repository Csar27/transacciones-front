import { fichaEstado } from '../utils/estados'

/**
 * Distintivo de estado.
 *
 * El color sale de la ficha del estado y no de una clase de Tailwind: la clase
 * tendria que escribirse a mano y obliga a mantener la paleta en dos sitios.
 *
 * El tinte de fondo se compone con color-mix() al 8% del color del estado. Con
 * color-mix y no con el metodo antiguo de pegar "14" al hexadecimal porque el
 * color ahora es una variable CSS —`var(--color-estado-1)`— y un valor con dos
 * digitos pegados al final no es un color.
 *
 * Componer sobre el color en vez de pintar un fondo opaco es lo que hace que la
 * insignia siga leyendose en los dos temas: el fondo siempre queda sobre el
 * color de la pagina y el texto conserva el contraste completo del estado.
 */
export default function InsigniaEstado({ estado, className = '' }) {
  const { nombre, color } = fichaEstado(estado)

  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-full px-2 py-[3px]',
        'text-xs font-medium whitespace-nowrap',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        backgroundColor: `color-mix(in srgb, ${color} 8%, transparent)`,
        color,
      }}
    >
      <span
        aria-hidden="true"
        className="h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: color }}
      />
      {nombre}
    </span>
  )
}