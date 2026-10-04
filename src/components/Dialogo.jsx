import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

/**
 * Dialogo modal.
 *
 * Es el unico componente que se abre "encima de todo", asi que concentra los
 * cuatro comportamientos que hacen que un modal sea usable de verdad:
 *
 *  1. Escape cierra.
 *  2. El foco entra al abrirse y vuelve al elemento que lo abrio al cerrarse.
 *     Sin devolverlo, el usuario de teclado queda con el foco en el cuerpo del
 *     documento y tiene que recorrer toda la pagina con Tab para volver.
 *  3. Tab circula dentro del dialogo y no se escapa al fondo.
 *  4. role="dialog" + aria-modal, con el titulo y la descripcion enlazados por id.
 *
 * Se pinta en un portal contra document.body: un modal dentro del flujo normal
 * queda limitado por el overflow de sus ancestros y se corta a media pantalla.
 */

const SELECTOR_FOCALIZABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

const ANCHOS = {
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-2xl',
}

export default function Dialogo({
  abierto,
  titulo,
  descripcion,
  onCerrar,
  children,
  pie,
  ancho = 'md',
  cerrarAlPulsarFondo = true,
}) {
  const idTitulo = useId()
  const idDescripcion = useId()
  const panelRef = useRef(null)
  const elementoOrigenRef = useRef(null)

  // onCerrar suele ser una funcion en linea, distinta en cada render. Guardarla
  // en una ref mantiene los efectos de abajo sin dependencias que cambien: si
  // el de Escape se re-suscribiera en cada render, añadiria y quitaria el
  // listener continuamente sin motivo.
  const cerrarRef = useRef(onCerrar)

  cerrarRef.current = onCerrar

  // Escape
  useEffect(() => {
    if (!abierto) return undefined

    const alPulsarEscape = (evento) => {
      if (evento.key === 'Escape') cerrarRef.current?.()
    }

    document.addEventListener('keydown', alPulsarEscape)

    return () => document.removeEventListener('keydown', alPulsarEscape)
  }, [abierto])

  // Foco: entrada, retencion y devolucion.
  useEffect(() => {
    if (!abierto) return undefined

    elementoOrigenRef.current = document.activeElement

    const panel = panelRef.current
    const primerFoco = panel?.querySelector(SELECTOR_FOCALIZABLE)

    // Si el dialogo no tiene nada focalizable, el propio panel recibe el foco
    // (por eso lleva tabIndex=-1). Sin esto, el foco se queda en el cuerpo.
    ;(primerFoco ?? panel)?.focus()

    const alPulsarTab = (evento) => {
      if (evento.key !== 'Tab' || !panel) return

      const focalizables = Array.from(panel.querySelectorAll(SELECTOR_FOCALIZABLE)).filter(
        (elemento) => elemento.getClientRects().length > 0,
      )

      if (focalizables.length === 0) {
        evento.preventDefault()

        return
      }

      const primero = focalizables[0]
      const ultimo = focalizables[focalizables.length - 1]

      if (evento.shiftKey && document.activeElement === primero) {
        evento.preventDefault()
        ultimo.focus()
      } else if (!evento.shiftKey && document.activeElement === ultimo) {
        evento.preventDefault()
        primero.focus()
      }
    }

    document.addEventListener('keydown', alPulsarTab)

    return () => {
      document.removeEventListener('keydown', alPulsarTab)
      elementoOrigenRef.current?.focus?.()
    }
  }, [abierto])

  // El fondo no debe desplazarse mientras hay un dialogo encima.
  useEffect(() => {
    if (!abierto) return undefined

    const previo = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previo
    }
  }, [abierto])

  if (!abierto) return null

  return createPortal(
    <div
      className="velo fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
      onMouseDown={(evento) => {
        // Solo cierra si el raton cae en el fondo, no si esta dentro del panel.
        if (cerrarAlPulsarFondo && evento.target === evento.currentTarget) onCerrar()
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        aria-describedby={descripcion ? idDescripcion : undefined}
        tabIndex={-1}
        className={[
          'w-full bg-surface border border-line shadow-2xl',
          'rounded-t-lg sm:rounded-lg',
          'max-h-[92dvh] sm:max-h-[85vh] flex flex-col outline-none',
          ANCHOS[ancho],
        ].join(' ')}
      >
        <header className="flex items-start justify-between gap-4 px-5 py-4 border-b border-line">
          <div className="min-w-0">
            <h2 id={idTitulo} className="text-base font-semibold text-ink tracking-[-0.01em]">
              {titulo}
            </h2>
            {descripcion && (
              <p id={idDescripcion} className="mt-1 text-[13px] text-ink-muted">
                {descripcion}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="shrink-0 -mr-1 -mt-1 p-1.5 rounded-md text-ink-muted hover:bg-canvas hover:text-ink"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </header>

        <div className="px-5 py-4 overflow-y-auto">{children}</div>

        {pie && (
          <footer className="px-5 py-3.5 border-t border-line bg-canvas/60 rounded-b-lg">
            {pie}
          </footer>
        )}
      </div>
    </div>,
    document.body,
  )
}