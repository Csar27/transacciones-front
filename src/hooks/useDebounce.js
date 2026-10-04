import { useEffect, useState } from 'react'

/**
 * Retrasa la propagacion de un valor.
 *
 * Se usa en los filtros de texto: escribir "SOL-2026" son siete peticiones al
 * servidor, siete resultados intermedios y siete parpadeos de tabla. Con el
 * retardo solo se consulta cuando el usuario deja de escribir.
 *
 * `inicialInmediato` evita el primer retraso, que es lo que se quiere al
 * limpiar un filtro: el resultado debe aparecer ya.
 */
export function useDebounce(valor, retardo = 350, inicialInmediato = false) {
  const [diferido, setDiferido] = useState(valor)

  useEffect(() => {
    if (inicialInmediato) {
      setDiferido(valor)

      return undefined
    }

    const temporizador = setTimeout(() => setDiferido(valor), retardo)

    return () => clearTimeout(temporizador)
  }, [valor, retardo, inicialInmediato])

  return diferido
}