import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { FileText, PanelLeft, BookOpen, X } from 'lucide-react'
import BotonCorrelacion from '../components/BotonCorrelacion'
import BotonTema from '../components/BotonTema'

/**
 * Estructura de la aplicacion: lateral fijo en escritorio, cajon en movil y
 * cabecera con la barra superior.
 *
 * El lateral tiene tres estados porque son los tres que se dan de verdad:
 *  - estrecho (64px): se ve el icono, el texto no.
 *  - ancho (240px): icono y texto.
 *  - cajon: por debajo de 1024px, con velo y cierre automatico al navegar.
 *
 * Se elige 1024px y no 768 porque por debajo de 1024 no cabe el texto de los
 * items junto a la tabla sin que el contenido se quede en un hueco estrecho.
 */

const CLAVE_RAIL = 'transacciones-lateral-estrecho'

/** Swagger de la API. Se abre en otra pestana porque es otro origen. */
const RUTA_DOCUMENTACION = import.meta.env.VITE_PROXY_TARGET
  ? `${import.meta.env.VITE_PROXY_TARGET}/swagger`
  : 'http://localhost:5250/swagger'

const ENLACES = [
  { to: '/', etiqueta: 'Solicitudes', Icono: FileText, exacto: true },
  { to: RUTA_DOCUMENTACION, etiqueta: 'Documentacion', Icono: BookOpen, externo: true },
]

export default function LayoutPrincipal() {
  const [estrecho, setEstrecho] = useState(() => {
    try {
      return localStorage.getItem(CLAVE_RAIL) === '1'
    } catch {
      // Modo privado o almacenamiento bloqueado: se empieza ancho.
      return false
    }
  })
  const [cajonAbierto, setCajonAbierto] = useState(false)
  const ubicacion = useLocation()

  useEffect(() => {
    setCajonAbierto(false)
  }, [ubicacion.pathname])

  // Al cambiar de ruta la pagina vuelve arriba.
  //
  // React Router trae <ScrollRestoration /> para esto, pero exige un DATA router
  // (createBrowserRouter + RouterProvider) y esta app usa BrowserRouter: montado
  // aqui lanzaba "useScrollRestoration must be used within a data router" y
  // dejaba la pagina en blanco. Como no hay loaders ni actions, un reset manual
  // por ruta cumple lo mismo en cuatro lineas y sin tocar el router.
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [ubicacion.pathname])

  function alternarEstrecho() {
    setEstrecho((valor) => {
      const nuevo = !valor

      try {
        localStorage.setItem(CLAVE_RAIL, nuevo ? '1' : '0')
      } catch {
        // Si no se puede guardar, el cambio se aplica igual en esta sesion.
      }

      return nuevo
    })
  }

  return (
    <div className="min-h-dvh">
      {/* Lateral fijo: solo en escritorio. */}
      <aside
        className={`hidden lg:flex lg:flex-col shrink-0 border-r border-line bg-surface
          fixed inset-y-0 left-0 z-30 transition-[width] duration-200
          ${estrecho ? 'w-16' : 'w-60'}`}
      >
        <Marca estrecho={estrecho} />

        <nav className="flex-1 px-2 py-3">
          <ListaEnlaces estrecho={estrecho} />
        </nav>

        <div className="border-t border-line p-2">
          <button
            type="button"
            onClick={alternarEstrecho}
            aria-label={estrecho ? 'Ampliar el menu' : 'Estrechar el menu'}
            className="flex w-full items-center gap-3 rounded-md px-2 py-2
              text-ink-muted hover:bg-canvas hover:text-ink"
          >
            <PanelLeft size={16} aria-hidden="true" className="shrink-0" />
            {!estrecho && <span className="text-[13px]">Estrechar</span>}
          </button>
        </div>
      </aside>

      {/* Cajon de movil. */}
      {cajonAbierto && (
        <div className="lg:hidden">
          <div
            className="velo fixed inset-0 z-40"
            onClick={() => setCajonAbierto(false)}
            aria-hidden="true"
          />

          <aside
            role="dialog"
            aria-label="Menu de navegacion"
            className="fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r
              border-line bg-surface"
          >
            <div className="flex items-center justify-between border-b border-line">
              <Marca />
              <button
                type="button"
                onClick={() => setCajonAbierto(false)}
                aria-label="Cerrar el menu"
                className="mr-2 rounded-md p-2 text-ink-muted hover:bg-canvas hover:text-ink"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>

            <nav className="flex-1 px-2 py-3">
              <ListaEnlaces />
            </nav>
          </aside>
        </div>
      )}

      <div className={`transition-[padding] duration-200 ${estrecho ? 'lg:pl-16' : 'lg:pl-60'}`}>
        <header
          className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b
            border-line bg-surface px-4"
        >
          <button
            type="button"
            onClick={() => setCajonAbierto(true)}
            aria-label="Abrir el menu"
            className="-ml-1 rounded-md p-2 text-ink-muted hover:bg-canvas hover:text-ink lg:hidden"
          >
            <PanelLeft size={17} aria-hidden="true" />
          </button>

          {/* En movil el lateral esta oculto, asi que la marca vive aqui. */}
          <span className="text-sm font-semibold tracking-[-0.01em] text-ink lg:hidden">
            Solicitudes
          </span>

          <div className="ml-auto flex items-center gap-2">
            <BotonTema />
            <BotonCorrelacion />
          </div>
        </header>

        <main className="px-4 py-5 sm:px-6 sm:py-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function Marca({ estrecho = false }) {
  return (
    <div className="flex h-14 items-center gap-2.5 border-b border-line px-4">
      <span
        aria-hidden="true"
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[5px] bg-brand
          text-[11px] font-bold text-brand-ink"
      >
        T
      </span>

      {!estrecho && (
        <span className="min-w-0">
          <span className="block truncate text-[13px] font-semibold text-ink">Transacciones</span>
          <span className="block truncate text-xs text-ink-muted">Solicitudes</span>
        </span>
      )}
    </div>
  )
}

function ListaEnlaces({ estrecho = false }) {
  return (
    <ul className="flex flex-col gap-0.5">
      {ENLACES.map(({ to, etiqueta, Icono, exacto, externo }) => (
        <li key={to}>
          {externo ? (
            // Enlace externo: un <a> normal. Un NavLink con una URL absoluta
            // intentaria enrutarla dentro de la aplicacion y se quedaria en
            // blanco.
            <a
              href={to}
              target="_blank"
              rel="noreferrer"
              title={estrecho ? etiqueta : undefined}
              className="flex items-center gap-3 rounded-md px-2 py-2 text-[13px]
                text-ink-muted transition-colors hover:bg-canvas hover:text-ink"
            >
              <Icono size={16} aria-hidden="true" className="shrink-0" />
              {!estrecho && <span className="truncate">{etiqueta}</span>}
            </a>
          ) : (
            <NavLink
              to={to}
              end={exacto}
              title={estrecho ? etiqueta : undefined}
              className={({ isActive }) =>
                [
                  'flex items-center gap-3 rounded-md px-2 py-2 text-[13px] transition-colors',
                  isActive
                    ? 'bg-brand-tint font-medium text-brand'
                    : 'text-ink-muted hover:bg-canvas hover:text-ink',
                ].join(' ')
              }
            >
              <Icono size={16} aria-hidden="true" className="shrink-0" />
              {!estrecho && <span className="truncate">{etiqueta}</span>}
            </NavLink>
          )}
        </li>
      ))}
    </ul>
  )
}