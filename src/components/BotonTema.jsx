import { Moon, Sun } from 'lucide-react'
import { useTema } from '../hooks/useTema'
import { alternarTema, temaContrario } from '../utils/tema'
import Boton from './Boton'

/**
 * Interruptor de tema claro / oscuro.
 *
 * Muestra el tema al que se va, no el que hay. Es un boton de accion, no un
 * indicador de estado: un icono de luna junto a un panel oscuro se lee como
 * "estas en oscuro" cuando lo que quiere decir es "pulsa para pasar a claro".
 * El texto y el aria-label lo dicen sin ambiguedad en las dos direcciones.
 *
 * No hay un tercer estado. "Automatico" es el punto de partida —sin atributo en
 * <html> manda la preferencia del sistema— pero en cuanto se pulsa, la eleccion
 * queda guardada y no hay forma de volver a automatico sin borrar el
 * almacenamiento local del navegador. Es una LIMITACION, no un descuido: se
 * acepta porque un control de tres segmentos no cabe en una cabecera densa sin
 * competir con el espacio del contenido.
 *
 * Si algun dia hace falta volver a automatico, el sitio es este fichero: un
 * menu con las tres opciones, no un gesto oculto que solo sepa hacer quien
 * escribio el codigo.
 */
export default function BotonTema() {
  const destino = temaContrario()
  const oscuroAhora = useTema() === 'oscuro'

  return (
    <Boton
      variante="neutro"
      tamano="sm"
      onClick={alternarTema}
      aria-label={oscuroAhora ? 'Usar el tema claro' : 'Usar el tema oscuro'}
      title={
        oscuroAhora
          ? 'Pasar al tema claro'
          : 'Pasar al tema oscuro. Hasta que se pulse, sigue la preferencia del sistema.'
      }
    >
      {oscuroAhora ? (
        <Sun size={15} aria-hidden="true" />
      ) : (
        <Moon size={15} aria-hidden="true" />
      )}

      <span className="hidden sm:inline">{destino === 'oscuro' ? 'Oscuro' : 'Claro'}</span>
    </Boton>
  )
}