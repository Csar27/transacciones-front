import { useEffect, useState } from 'react'
import { copiarAlPortapapeles } from '../utils/formateo'

/**
 * Pantalla de error con reintento.
 *
 * Muestra el mensaje que devuelve la API y, si lo hay, el identificador de
 * correlacion con un boton para copiarlo. Ese id es lo que permite que soporte
 * encuentre la peticion en los logs de la API, asi que se ofrece en lugar de
 * escondido en un detalle tecnico.
 */

export default function PanelError({
  error,
  alReintentar,
  titulo = 'No se pudo cargar la informacion',
}) {
  if (!error) return null

  const mensaje = error.mensaje || 'Se produjo un error inesperado. Intentalo de nuevo.'

  return (
    <div role="alert" className="rounded-md border border-danger-line bg-danger-tint px-4 py-3.5">
      <p className="text-sm font-medium text-danger">{titulo}</p>
      <p className="mt-1 text-[13px] text-danger-body">{mensaje}</p>

      {error.correlationId && (
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-danger-line pt-3">
          <span className="text-xs text-danger-body">
            Id de correlacion: <span className="font-medium">{error.correlationId}</span>
          </span>

          <BotonCopiar texto={error.correlationId} />
        </div>
      )}

      {alReintentar && (
        <div className="mt-3">
          <button
            type="button"
            onClick={alReintentar}
            className="text-[13px] font-medium text-danger underline underline-offset-2 hover:no-underline"
          >
            Reintentar
          </button>
        </div>
      )}
    </div>
  )
}

/**
 * Copia un valor al portapapeles y lo confirma en el sitio.
 *
 * Si el navegador bloquea el portapapeles se dice, en vez de mostrar un "Copiado"
 * que no copio: un mensaje de exito falso cuesta mas tiempo que el error.
 */
function BotonCopiar({ texto, etiqueta = 'Copiar' }) {
  const [estado, setEstado] = useMensajeTemporal()

  async function copiar() {
    setEstado((await copiarAlPortapapeles(texto)) ? 'Copiado' : 'No se pudo copiar')
  }

  return (
    <button
      type="button"
      onClick={copiar}
      className="inline-flex items-center gap-1 text-xs font-medium text-danger-body underline underline-offset-2 hover:no-underline"
    >
      {estado || etiqueta}
    </button>
  )
}

/** El texto de confirmacion vuelve a su estado original pasado un momento. */
function useMensajeTemporal(duracion = 2500) {
  const [estado, setEstado] = useState('')

  useEffect(() => {
    if (!estado) return undefined

    const temporizador = setTimeout(() => setEstado(''), duracion)

    return () => clearTimeout(temporizador)
  }, [estado, duracion])

  return [estado, setEstado]
}