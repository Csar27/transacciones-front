import { fichaEstado } from '../utils/estados'

/**
 * Distintivo de estado.
 *
 * El color sale de la ficha del estado y no de una clase de Tailwind: la clase
 * tendria que escribirse a mano y obliga a mantener la paleta en dos sitios.
 *
 * El tinte de fondo se compone anadiendo alpha al hexadecimal del color
 * (8%, "14" en hexadecimal), de modo que el fondo siempre queda sobre el color
 * de la pagina y el texto conserva el contraste completo del color.
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
      style={{ backgroundColor: `${color}14`, color }}
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