import { useSyncExternalStore } from 'react'
import { TEMA_SERVIDOR, suscribir, temaEfectivo } from '../utils/tema'

/**
 * Tema que se esta viendo ahora mismo, y se vuelve a renderizar al cambiar.
 *
 * useSyncExternalStore y no un useState con suscripcion manual: el valor sale
 * de fuera de React —del atributo del <html> y de localStorage—, y esta es la
 * forma de que React lo lea sin desincronizarse en modo concurrente.
 *
 * El tercer argumento es el valor en servidor. No hay <html> ahi, asi que se
 * asume claro: si se devolviera algo distinto, la marca inicial no coincidiria
 * con lo que pinta el cliente y React avisaria de una discrepancia de
 * hidratacion.
 */
export function useTema() {
  return useSyncExternalStore(suscribir, temaEfectivo, () => TEMA_SERVIDOR)
}