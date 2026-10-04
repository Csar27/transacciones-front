import { useId } from 'react'

/**
 * Campo de formulario.
 *
 * Aporta el cableado de accesibilidad que se olvida con facilidad: label
 * asociado por id, mensaje de error enlazado con aria-describedby y
 * aria-invalid cuando toca.
 *
 * El texto del error se anuncia con role="alert" para que un lector de pantalla
 * lo lea al aparecer, en lugar de esperar a que el usuario vuelva a enfocar el
 * campo.
 */

export default function Campo({
  etiqueta,
  error,
  ayuda,
  obligatorio = false,
  children,
  className = '',
}) {
  const id = useId()
  const idError = `${id}-error`
  const idAyuda = `${id}-ayuda`

  const descritoPor =
    [error ? idError : null, ayuda ? idAyuda : null].filter(Boolean).join(' ') ||
    undefined

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="text-[13px] font-medium text-ink">
        {etiqueta}
        {obligatorio && (
          <span className="ml-1 text-[#b91c1c]" aria-hidden="true">
            *
          </span>
        )}
      </label>

      {children({
        id,
        'aria-invalid': error ? 'true' : undefined,
        'aria-describedby': descritoPor,
      })}

      {ayuda && (
        <p id={idAyuda} className="text-xs text-ink-muted">
          {ayuda}
        </p>
      )}

      {error && (
        <p id={idError} role="alert" className="text-xs text-[#b91c1c]">
          {error}
        </p>
      )}
    </div>
  )
}