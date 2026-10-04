import { useEffect, useRef } from 'react'
import Dialogo from './Dialogo'
import Boton from './Boton'

/**
 * Confirmacion de una accion.
 *
 * Se usa en Aprobar y Anular, que no piden ningun dato: solo hay que aceptar
 * que la transicion va a ocurrir. Rechazar, que si exige un motivo, tiene su
 * propio dialogo.
 *
 * El boton de confirmar queda cargado mientras la peticion esta en curso y el
 * dialogo no se cierra hasta que el backend responde. Cerrarlo al instante
 * dejaria al usuario sin saber si salio bien.
 */
export default function Confirmar({
  abierto,
  titulo,
  descripcion,
  textoConfirmar = 'Confirmar',
  alConfirmar,
  alCerrar,
  cargando = false,
  peligro = false,
}) {
  const botonRef = useRef(null)

  // Al abrir, el foco entra por defecto en el primer elemento, que es el boton
  // de cerrar. Moverlo al de confirmar evita cerrar sin querer con Enter.
  useEffect(() => {
    if (abierto) botonRef.current?.focus()
  }, [abierto])

  return (
    <Dialogo
      abierto={abierto}
      titulo={titulo}
      descripcion={descripcion}
      onCerrar={cargando ? () => {} : alCerrar}
      ancho="md"
      pie={
        <div className="flex justify-end gap-2">
          <Boton variante="secundario" onClick={alCerrar} disabled={cargando}>
            Cancelar
          </Boton>
          <Boton
            ref={botonRef}
            variante={peligro ? 'peligro' : 'primario'}
            onClick={alConfirmar}
            cargando={cargando}
          >
            {textoConfirmar}
          </Boton>
        </div>
      }
    >
      <p className="text-[13px] text-ink-muted">
        Esta accion no se puede deshacer.
      </p>
    </Dialogo>
  )
}