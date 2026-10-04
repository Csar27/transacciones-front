import { Suspense, lazy } from 'react'
import { Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { Loader } from 'lucide-react'

/**
 * Cada pantalla se carga al entrar en ella.
 *
 * En una aplicacion de este tamano la diferencia no es enorme, pero el coste de
 * no hacerlo es que el usuario descarga el detalle de solicitud, la pantalla de
 * error y la de 404 solo para ver el listado.
 */
const LayoutPrincipal = lazy(() => import('./layouts/LayoutPrincipal'))
const ListaSolicitudes = lazy(() => import('./features/solicitudes/pages/ListaSolicitudes'))
const DetalleSolicitud = lazy(() => import('./features/solicitudes/pages/DetalleSolicitud'))
const NoEncontrado = lazy(() => import('./pages/NoEncontrado'))

/**
 * Un error 4xx no se reintenta: la peticion es invalida o el recurso no existe,
 * y repetirla va a fallar igual. Solo se reintenta lo que podria resolverse solo,
 * como un 500 o un problema de red.
 */
function reintentar(fallos, error) {
  const esErrorDePeticion = error?.status >= 400 && error?.status < 500

  return !esErrorDePeticion && fallos < 2
}

const cliente = new QueryClient({
  defaultOptions: {
    queries: {
      // Un listado de solicitudes cambia por minutos, no por segundos: 30s evita
      // pedir lo mismo otra vez al ir y venir del detalle.
      staleTime: 30_000,
      retry: reintentar,
      refetchOnWindowFocus: false,
    },
    mutations: { retry: false },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={cliente}>
      <Routes>
        <Route
          element={
            <Suspense fallback={<CargaDeRuta />}>
              <LayoutPrincipal />
            </Suspense>
          }
        >
          <Route
            index
            element={
              <Suspense fallback={<CargaDeRuta />}>
                <ListaSolicitudes />
              </Suspense>
            }
          />
          <Route
            path="solicitudes/:id"
            element={
              <Suspense fallback={<CargaDeRuta />}>
                <DetalleSolicitud />
              </Suspense>
            }
          />
          <Route
            path="*"
            element={
              <Suspense fallback={<CargaDeRuta />}>
                <NoEncontrado />
              </Suspense>
            }
          />
        </Route>
      </Routes>

      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#14171f',
            color: '#ffffff',
            borderRadius: '6px',
            fontSize: '13px',
          },
        }}
      />
    </QueryClientProvider>
  )
}

/**
 * Marcador de carga entre pantallas.
 *
 * Solo sale un instante al cambiar de ruta, asi que se mantiene minimo: un
 * esqueleto de tabla aqui no tiene sentido porque la tabla que va a aparecer no
 * se sabe aun.
 */
function CargaDeRuta() {
  return (
    <div className="flex min-h-[60dvh] items-center justify-center" role="status">
      <Loader size={20} className="animate-spin text-ink-muted" aria-hidden="true" />
      <span className="sr-only">Cargando</span>
    </div>
  )
}