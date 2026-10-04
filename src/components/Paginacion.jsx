import { ChevronLeft, ChevronRight } from 'lucide-react'
import Boton from './Boton'

/**
 * Paginacion.
 *
 * La paginacion es del servidor: el total y el numero de paginas llegan ya
 * calculados en la respuesta. Aqui solo se decide que numeros de pagina se
 * enseunan.
 *
 * La ventana se centra en la pagina actual y mantiene la primera y la ultima
 * visibles. Entre medio se deja un hueco marcado con puntos suspensivos, que es
 * codigo de interfaz: "hay paginas que no se muestran", no un numero roto.
 */

const MAXIMO_VISIBLES = 7

function paginasVisibles(pagina, totalPaginas) {
  const todas = Array.from({ length: totalPaginas }, (_, indice) => indice + 1)

  if (totalPaginas <= MAXIMO_VISIBLES) return todas

  const conjunto = new Set([1, totalPaginas, pagina - 1, pagina, pagina + 1])

  const ordenadas = todas.filter((numero) => conjunto.has(numero))
  const resultado = []

  ordenadas.forEach((numero, indice) => {
    const anterior = ordenadas[indice - 1]

    // Hueco entre dos numeros mostrados: se marca con null.
    if (anterior !== undefined && numero - anterior > 1) {
      resultado.push(null)
    }

    resultado.push(numero)
  })

  return resultado
}

export default function Paginacion({
  pagina,
  totalPaginas,
  totalRegistros,
  tamanoPagina,
  alCambiarPagina,
}) {
  if (!totalRegistros) return null

  const primero = (pagina - 1) * tamanoPagina + 1
  const ultimo = Math.min(pagina * tamanoPagina, totalRegistros)

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-3">
      <p className="text-xs text-ink-muted">
        {primero}–{ultimo} de {totalRegistros}
      </p>

      {totalPaginas > 1 && (
        <nav aria-label="Paginacion" className="flex items-center gap-1">
          <Boton
            variante="neutro"
            tamano="sm"
            onClick={() => alCambiarPagina(pagina - 1)}
            disabled={pagina <= 1}
            aria-label="Pagina anterior"
          >
            <ChevronLeft size={15} aria-hidden="true" />
          </Boton>

          {paginasVisibles(pagina, totalPaginas).map((numero, indice) =>
            numero === null ? (
              <span
                key={`hueco-${indice}`}
                aria-hidden="true"
                className="px-1 text-xs text-ink-muted"
              >
                …
              </span>
            ) : (
              <Boton
                key={numero}
                variante={numero === pagina ? 'primario' : 'neutro'}
                tamano="sm"
                onClick={() => alCambiarPagina(numero)}
                aria-label={`Pagina ${numero}`}
                aria-current={numero === pagina ? 'page' : undefined}
                className="min-w-8 px-2 tabular-nums"
              >
                {numero}
              </Boton>
            ),
          )}

          <Boton
            variante="neutro"
            tamano="sm"
            onClick={() => alCambiarPagina(pagina + 1)}
            disabled={pagina >= totalPaginas}
            aria-label="Pagina siguiente"
          >
            <ChevronRight size={15} aria-hidden="true" />
          </Boton>
        </nav>
      )}
    </div>
  )
}