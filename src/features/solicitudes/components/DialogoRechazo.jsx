import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import Dialogo from '../../../components/Dialogo'
import Campo from '../../../components/Campo'
import { AreaTexto } from '../../../components/CamposTexto'
import Boton from '../../../components/Boton'
import { esquemaRechazo } from '../../../utils/validacion'
import { formatearMonto } from '../../../utils/formateo'

/**
 * Rechazo de solicitud.
 *
 * A diferencia de Aprobar y Anular, el rechazo exige un motivo: va al cuerpo de
 * la peticion y se guarda en la tabla. Por eso el dialogo no se cierra al
 * pulsar fuera: perder medio texto por un clic mal dado es una falta de respeto
 * al trabajo del usuario.
 *
 * El motivo es un query param en la API, no un cuerpo JSON. Aqui se valida
 * igual, porque el backend responde 400 con SOL-004 y el mismo aviso.
 */
export default function DialogoRechazo({
  abierto,
  solicitud,
  alCerrar,
  alRechazar,
  cargando = false,
}) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(esquemaRechazo),
    defaultValues: { motivo: '' },
  })

  // El formulario se vacia al abrir: si se cancela un rechazo y se vuelve a
  // abrir, el motivo anterior no debe aparecer.
  useEffect(() => {
    if (abierto) reset({ motivo: '' })
  }, [abierto, reset])

  const motivo = watch('motivo') ?? ''

  const enviar = handleSubmit(async (valores) => {
    try {
      await alRechazar(valores.motivo)
    } catch (error) {
      if (error.campos?.motivo) {
        setError('motivo', { message: error.campos.motivo[0] })

        return
      }

      toast.error(error.mensaje)
    }
  })

  return (
    <Dialogo
      abierto={abierto}
      titulo="Rechazar solicitud"
      descripcion={
        solicitud
          ? `${solicitud.codigo} · ${formatearMonto(solicitud.monto, solicitud.moneda)}`
          : undefined
      }
      onCerrar={cargando ? () => {} : alCerrar}
      ancho="md"
      cerrarAlPulsarFondo={false}
      pie={
        <div className="flex justify-end gap-2">
          <Boton variante="secundario" onClick={alCerrar} disabled={cargando}>
            Cancelar
          </Boton>
          <Boton variante="peligro" onClick={enviar} cargando={cargando}>
            Rechazar
          </Boton>
        </div>
      }
    >
      <form onSubmit={enviar} noValidate>
        <Campo
          etiqueta="Motivo"
          obligatorio
          error={errors.motivo?.message}
          ayuda="Queda registrado con la solicitud y no se puede modificar despues."
        >
          {(props) => (
            <AreaTexto
              {...props}
              {...register('motivo')}
              rows={4}
              placeholder="Documentacion incompleta"
            />
          )}
        </Campo>

        <div className="mt-1 flex justify-end text-xs text-ink-muted">
          <span className={motivo.length > 500 ? 'text-[#b91c1c]' : undefined}>
            {motivo.length} de 500
          </span>
        </div>
      </form>
    </Dialogo>
  )
}