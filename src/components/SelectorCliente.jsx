import { useEffect, useId, useMemo, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { buscarClientes, clientePorId, etiquetaCliente } from '../utils/clientesDemo'
import { esUuid } from '../utils/formateo'

/**
 * Selector de cliente.
 *
 * Un combobox: se escribe el nombre o el codigo, la lista se filtra mientras se
 * escribe y al elegir se rellena el UUID. Sigue aceptando un UUID pegado a
 * mano, porque puede que el cliente se haya dado de alta en otro sitio y aqui no
 * este todavia.
 *
 * ---------------------------------------------------------------------------
 * POR QUE NO SE GENERA EL UUID
 * ---------------------------------------------------------------------------
 * La API pide un identificador de cliente que es una REFERENCIA a otro
 * sistema. Inventarlo crearia una solicitud apuntando a un cliente que no
 * existe en ninguna parte: ni un reporte ni una reconcilacion la podrian
 * arreglar. Por eso aqui se elige de una lista, y el UUID es el que corresponde
 * a ese cliente.
 *
 * ---------------------------------------------------------------------------
 * POR QUE LOS CLIENTES VIENEN DE `clientesDemo.js` Y NO DE LA API
 * ---------------------------------------------------------------------------
 * El catalogo real (`CatalogoService` -> localhost:5202) no existe todavia y
 * ningun controller lo expone. Ese fichero tiene el contrato de como sustituir
 * esta lista por la llamada de verdad; aqui solo se consume.
 */

/** Ancho del desplegable: coincide con el input para que no se descentre. */
export default function SelectorCliente({ valor, alCambiar, ...props }) {
  const idLista = useId()

  const [texto, setTexto] = useState('')
  const [seleccionado, setSeleccionado] = useState(() => clientePorId(valor))
  const [abierto, setAbierto] = useState(false)
  const [destacado, setDestacado] = useState(0)

  /**
   * Al vaciarse el valor (reset del formulario) el selector vuelve a empezar.
   *
   * La condicion es "vaciado" y no "cambiado" a proposito: si se sincronizase
   * en cada cambio, al confirmar un UUID pegado a mano se borraria justo lo que
   * el usuario acaba de escribir, porque ese UUID no pertenece a ningun cliente
   * de la lista.
   */
  useEffect(() => {
    if (valor === '') {
      setSeleccionado(null)
      setTexto('')
    }
  }, [valor])

  const resultados = useMemo(
    () => (seleccionado ? buscarClientes('') : buscarClientes(texto)),
    [seleccionado, texto],
  )

  const activo = abierto && resultados[destacado]

  function elegir(cliente) {
    setSeleccionado(cliente)
    setTexto(etiquetaCliente(cliente))
    setAbierto(false)
    setDestacado(0)
    alCambiar(cliente.id)
  }

  /**
   * Resuelve el texto a un UUID.
   *
   * Tres casos, en este orden: no se ha tocado el texto, esta vacio, o es un
   * identificador (de la lista o escrito a mano). Un texto que no es ninguna de
   * esas cosas NO emite valor: se conserva el anterior y deja que el esquema
   * marque el campo al enviar. Inventar un valor para "no dejar nada" seria
   * justo el error que este componente existe para evitar.
   */
  function confirmar() {
    const limpio = texto.trim()

    // Sigue siendo el cliente elegido: no hay nada pendiente.
    if (seleccionado && limpio === etiquetaCliente(seleccionado)) {
      setAbierto(false)

      return
    }

    if (limpio === '') {
      setSeleccionado(null)
      alCambiar('')

      return
    }

    const cliente = clientePorId(limpio)

    if (cliente) {
      setSeleccionado(cliente)
      setTexto(etiquetaCliente(cliente))
      alCambiar(cliente.id)

      return
    }

    if (esUuid(limpio)) {
      setSeleccionado(null)
      alCambiar(limpio)

      return
    }

    if (!seleccionado) alCambiar('')
  }

  function alTeclear(evento) {
    const { key } = evento

    if (key === 'ArrowDown' || key === 'ArrowUp') {
      evento.preventDefault()

      if (!abierto) {
        setAbierto(true)
        setDestacado(0)

        return
      }

      if (resultados.length === 0) return

      setDestacado((indice) =>
        key === 'ArrowDown'
          ? (indice + 1) % resultados.length
          : (indice - 1 + resultados.length) % resultados.length,
      )

      return
    }

    if (key === 'Enter') {
      // Con el desplegable abierto, Enter elige. Sin resultados, Enter confirma
      // lo que haya escrito: asi se pega un UUID y se da Enter.
      if (abierto && resultados[destacado]) {
        evento.preventDefault()
        elegir(resultados[destacado])

        return
      }

      confirmar()

      return
    }

    if (key === 'Escape') setAbierto(false)
  }

  return (
    <div className="relative">
      <div className="relative">
        <input
          {...props}
          type="text"
          role="combobox"
          aria-expanded={abierto}
          aria-controls={idLista}
          aria-autocomplete="list"
          aria-activedescendant={activo ? `${idLista}-${activo.id}` : undefined}
          value={texto}
          onChange={(evento) => {
            setTexto(evento.target.value)
            // Escribir invalida la eleccion anterior: a partir de aqui se
            // busca de nuevo, no se conserva lo que habia.
            setSeleccionado(null)
            setAbierto(true)
            setDestacado(0)
          }}
          onFocus={() => setAbierto(true)}
          onBlur={confirmar}
          onKeyDown={alTeclear}
          placeholder="Construc, CLI-0002, o pega el UUID"
          autoComplete="off"
          spellCheck={false}
          className={`h-9 w-full rounded-md border bg-surface pl-3 pr-9 text-sm text-ink
            transition-colors placeholder:text-ink-muted/60
            hover:border-line-strong focus:outline-none
            ${props['aria-invalid'] ? 'border-danger' : 'border-line'}`}
        />

        <ChevronDown
          size={15}
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted"
        />
      </div>

      {/*
        preventDefault en mousedown IMPORTA: sin el, el input pierde el foco
        antes de que llegue el click, el blur cerraria el desplegable y el
        click caeria en la nada. Es el truco estandar de los combobox.
      */}
      {abierto && resultados.length > 0 && (
        <ul
          id={idLista}
          role="listbox"
          aria-label="Clientes"
          className="absolute z-30 mt-1 w-full overflow-hidden rounded-md border
            border-line bg-surface shadow-lg"
        >
          {resultados.map((cliente, indice) => (
            <li
              key={cliente.id}
              id={`${idLista}-${cliente.id}`}
              role="option"
              aria-selected={indice === destacado}
              onMouseDown={(evento) => evento.preventDefault()}
              onMouseEnter={() => setDestacado(indice)}
              onClick={() => elegir(cliente)}
              className={`flex cursor-pointer items-center justify-between gap-3 px-3 py-2 text-sm
                ${indice === destacado ? 'bg-brand-tint text-brand' : 'text-ink'}`}
            >
              <span className="min-w-0 truncate">{cliente.razonSocial}</span>
              <span className="shrink-0 text-xs text-ink-muted">{cliente.codigo}</span>
            </li>
          ))}
        </ul>
      )}

      {/*
        Se muestra el UUID que va a enviarse. Sin esta linea el usuario elige
        "Comercial del Norte" y no tiene forma de saber que dato se guarda:
        es justo lo que hizo este campo incomprensible desde el principio.
      */}
      {valor && (
        <p className="mt-1.5 flex items-baseline gap-1.5 text-xs text-ink-muted">
          <span className="shrink-0">Se enviara</span>
          <span className="min-w-0 break-all tabular-nums text-ink">{valor}</span>
        </p>
      )}
    </div>
  )
}