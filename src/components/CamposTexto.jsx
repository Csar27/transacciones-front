/**
 * Controles de texto.
 *
 * Los tres comparten la misma clase base. Si cada formulario compusiera su
 * estilo, un cambio en el alto o en el borde habria que aplicarlo en varios
 * sitios y acabarian divergiendo.
 *
 * El borde de error se decide leyendo aria-invalid, no con una propiedad
 * aparte: Campo ya lo pone, y asi el color de error no puede olvidarse de
 * seguir al estado de validacion.
 */

const CLASE_BASE =
  'w-full rounded-md border bg-surface px-3 text-sm text-ink ' +
  'placeholder:text-ink-muted/60 transition-colors ' +
  'hover:border-line-strong focus:outline-none'

const ALTO = 'h-9'

function clases({ invalido, className = '' }) {
  return [
    CLASE_BASE,
    ALTO,
    invalido ? 'border-danger' : 'border-line',
    'disabled:opacity-60',
    className,
  ].join(' ')
}

function esInvalido(props) {
  return props['aria-invalid'] === true || props['aria-invalid'] === 'true'
}

export function Entrada({ className, ...props }) {
  return <input className={clases({ invalido: esInvalido(props), className })} {...props} />
}

export function AreaTexto({ className, ...props }) {
  return (
    <textarea
      rows={3}
      className={[
        CLASE_BASE,
        'py-2 leading-relaxed resize-y',
        esInvalido(props) ? 'border-danger' : 'border-line',
        className,
      ].join(' ')}
      {...props}
    />
  )
}

export function Selector({ className, children, ...props }) {
  return (
    <select className={clases({ invalido: esInvalido(props), className })} {...props}>
      {children}
    </select>
  )
}