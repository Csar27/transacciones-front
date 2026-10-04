import { useState } from 'react'
import toast from 'react-hot-toast'
import { Fingerprint } from 'lucide-react'
import { useCorrelacion } from '../hooks/useSolicitudes'
import { copiarAlPortapapeles } from '../utils/formateo'
import Boton from './Boton'

/**
 * Boton de correlacion.
 *
 * Llama a /api/solicitudes/correlacion y copia el id devuelto.
 *
 * El backend genera un id por peticion y lo devuelve en la cabecera de todas las
 * respuestas. Este boton pide uno NUEVO para que el usuario pueda abrir un ticket
 * antes de que ocurra el fallo, en lugar de tener que buscarlo despues en un
 * mensaje de error.
 */
export default function BotonCorrelacion() {
  const [mensaje, setMensaje] = useState('')
  const { mutate, isPending } = useCorrelacion()

  function solicitarYCopiar() {
    mutate(undefined, {
      onSuccess: async ({ correlacionId }) => {
        if (!correlacionId) {
          setMensaje('La API no devolvio un id')

          return
        }

        // Se copia una sola vez: el resultado decide las dos cosas, el texto del
        // boton y el aviso. Copiar dos veces seria copiar y volver a copiar.
        const copiado = await copiarAlPortapapeles(correlacionId)

        setMensaje(copiado ? 'Copiado' : 'Id listo')

        if (copiado) {
          toast.success('Id de correlacion copiado')
        } else {
          // Sin portapapeles el id se muestra entero, para no perderlo.
          toast(`Id de correlacion: ${correlacionId}`, { icon: '⚠' })
        }
      },
      onError: (error) => {
        setMensaje('Error')
        toast.error(error.mensaje)
      },
    })
  }

  return (
    <Boton
      variante="neutro"
      tamano="sm"
      onClick={solicitarYCopiar}
      cargando={isPending}
      title="Pide un id de correlacion a la API y lo copia al portapapeles"
    >
      <Fingerprint size={15} aria-hidden="true" />
      <span className="hidden sm:inline">{mensaje || 'Correlacion'}</span>
    </Boton>
  )
}