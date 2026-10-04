import { forwardRef } from 'react'
import { Loader } from 'lucide-react'

/**
 * Boton.
 *
 * Variantes: primario (la accion principal de la pantalla), secundario
 * (acompana al primario), neutro (acciones terciarias) y peligro (las que
 * destruyen informacion: anular, rechazar).
 *
 * Sin sombras difuminadas ni degradados: en un panel administrativo el peso
 * visual se gana con jerarquia, no con adornos.
 */

const VARIANTES = {
  // El texto del primario es un token, no blanco fijo: en tema oscuro la marca
  // se aclara hasta #8994f7 y el blanco sobre ella baja a 2,6:1. brand-ink
  // invierte con el tema —blanco en claro, casi negro en oscuro—.
  primario:
    'bg-brand text-brand-ink border border-transparent hover:bg-brand/90 active:bg-brand/95',
  secundario:
    'bg-surface text-ink border border-line hover:border-line-strong hover:bg-canvas',
  neutro:
    'bg-transparent text-ink-muted border border-transparent hover:bg-canvas hover:text-ink',
  // danger-on, no white: al pasar el raton el relleno se vuelve el rojo del
  // tema, que en oscuro es claro, y el texto tiene que volverse oscuro con el.
  peligro:
    'bg-surface text-danger border border-danger-line hover:bg-danger hover:text-danger-on hover:border-danger',
}

const TAMANOS = {
  sm: 'h-8 px-3 text-[13px] gap-1.5',
  md: 'h-9 px-4 text-sm gap-2',
}

const Boton = forwardRef(function Boton(
  {
    variante = 'secundario',
    tamano = 'md',
    cargando = false,
    deshabilitado = false,
    className = '',
    children,
    type = 'button',
    ...props
  },
  ref,
) {
  const inactivo = deshabilitado || cargando

  return (
    <button
      ref={ref}
      type={type}
      // aria-busy comunica que la accion esta en curso sin quitar el foco: si el
      // boton se deshabilita al pulsarlo, el foco se pierde y un usuario de
      // teclado queda tirado en el cuerpo del documento.
      aria-busy={cargando || undefined}
      disabled={inactivo}
      className={[
        'inline-flex items-center justify-center rounded-md font-medium',
        'transition-colors duration-150',
        'disabled:cursor-not-allowed disabled:opacity-50',
        VARIANTES[variante],
        TAMANOS[tamano],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {cargando && <Loader size={15} className="animate-spin" aria-hidden="true" />}
      {children}
    </button>
  )
})

export default Boton