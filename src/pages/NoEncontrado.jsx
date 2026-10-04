import { Link } from 'react-router-dom'

/**
 * Ruta no encontrada.
 *
 * El 404 es el punto de entrada al sitio, asi que no se disimula: ocupa la
 * pantalla y dice exactamente donde se fue el usuario. Un boton de vuelta a
 * inicio, sin adornos.
 */
export default function NoEncontrado() {
  return (
    <div className="flex min-h-[60dvh] items-center">
      <div>
        <p className="text-5xl font-bold tracking-[-0.03em] text-brand">404</p>

        <h1 className="mt-3 text-lg font-semibold tracking-[-0.01em] text-ink">
          Esta pagina no existe
        </h1>

        <p className="mt-1.5 max-w-[52ch] text-[13px] leading-relaxed text-ink-muted">
          La direccion no corresponde a ninguna pantalla de la aplicacion. Puede que
          el enlace estuviera mal escrito.
        </p>

        <Link
          to="/"
          className="mt-5 inline-flex h-9 items-center rounded-md bg-brand px-4
            text-sm font-medium text-brand-ink transition-colors hover:bg-brand/90"
        >
          Volver al listado
        </Link>
      </div>
    </div>
  )
}