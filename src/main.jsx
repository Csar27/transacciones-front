import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './estilos.css'

const contenedor = document.getElementById('root')

// createRoot falla si el elemento no existe: es mejor que un error en blanco
// en la consola que dice exactamente que falta en index.html.
if (!contenedor) {
  throw new Error('No se encontro el elemento #root en index.html.')
}

createRoot(contenedor).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)