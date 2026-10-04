/**
 * Tema claro u oscuro.
 *
 * "Automatico" no es un valor guardado: es la ausencia de eleccion. Sin
 * atributo en <html>, manda la preferencia del sistema, y el CSS lo resuelve
 * solo. Elegir una u otra escribe data-tema, que gana sobre el sistema.
 *
 * El color NO se guarda aqui: vive en estilos.css, en un unico sitio, y aqui
 * solo se decide que atributo lleva el <html>. Un boton que reescribiera los
 * tokens en linea tendria la paleta en dos ficheros, que es el problema que
 * este archivo evita.
 *
 * Este modulo NO importa React: lo consume un hook, en hooks/useTema.js. La
 * regla de utils/ es que no dependa de React, y el unico Subscriber que hace
 * falta es una funcion que devuelve la baja —eso lo resuelve cualquier
 * library, sin un hook.
 */

const CLAVE = 'transacciones.tema'
const VALORES = ['claro', 'oscuro']

/** Suscriptores. Un unico array porque solo hay una fuente de verdad. */
const suscriptores = new Set()

function sistemaPrefiereOscuro() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-color-scheme: dark)').matches
  )
}

/** Lo que el usuario eligio, o null si no ha elegido nada. */
export function temaElegido() {
  try {
    const guardado = window.localStorage.getItem(CLAVE)
    return VALORES.includes(guardado) ? guardado : null
  } catch {
    // Modo privado o almacenamiento bloqueado: se sigue la preferencia del
    // sistema, que es mejor que romperse.
    return null
  }
}

/** El tema que se esta viendo ahora mismo. */
export function temaEfectivo() {
  return temaElegido() ?? (sistemaPrefiereOscuro() ? 'oscuro' : 'claro')
}

function avisar() {
  for (const fn of suscriptores) fn()
}

/**
 * Escribe el atributo en <html>.
 *
 * Si no hay eleccion, se QUITA el atributo en vez de escribir "claro": asi el
 * sistema puede volver a mandar cuando la preferencia del sistema cambie.
 */
export function aplicarTema(elegido) {
  const raiz = document.documentElement

  if (elegido) {
    raiz.dataset.tema = elegido
  } else {
    delete raiz.dataset.tema
  }
}

/** Fija un tema y lo recuerda. */
export function elegirTema(tema) {
  if (tema === null) {
    try {
      window.localStorage.removeItem(CLAVE)
    } catch {
      /* sin almacenamiento, la eleccion dura lo que la pestana */
    }
  } else {
    try {
      window.localStorage.setItem(CLAVE, tema)
    } catch {
      /* idem */
    }
  }

  aplicarTema(tema)
  avisar()
}

/** El otro tema. */
export function temaContrario() {
  return temaEfectivo() === 'oscuro' ? 'claro' : 'oscuro'
}

export function alternarTema() {
  elegirTema(temaContrario())
}

/** Vuelve a dejar que mande el sistema. */
export function seguirSistema() {
  elegirTema(null)
}

/**
 * Sincroniza <html> con lo guardado y avisa si cambia la preferencia del
 * sistema. Se llama una vez al arrancar.
 *
 * El atributo NO se pone aqui si no hay eleccion, y por eso tampoco hace falta
 * quitarlo: el HTML de entrada no lo lleva.
 */
export function iniciarTema() {
  aplicarTema(temaElegido())

  // Mientras el usuario no elija, un cambio en el del sistema tiene que verse.
  // Con data-tema ya escrito no se toca nada: la eleccion manda.
  window
    .matchMedia?.('(prefers-color-scheme: dark)')
    .addEventListener?.('change', () => {
      if (temaElegido() === null) avisar()
    })
}

/**
 * Alta en las notificaciones de cambio de tema. Devuelve la baja.
 *
 * Es la unica pieza que necesita el hook, y por eso se exporta: para no meter
 * `useSyncExternalStore` —que si es React— dentro de utils/.
 */
export function suscribir(alCambiar) {
  suscriptores.add(alCambiar)

  return () => suscriptores.delete(alCambiar)
}

/** El tema tal como se ve en el servidor, donde no hay <html>. */
export const TEMA_SERVIDOR = 'claro'