import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { Info } from 'lucide-react'
import Campo from '../../../components/Campo'
import SelectorCliente from '../../../components/SelectorCliente'
import { AreaTexto, Entrada, Selector } from '../../../components/CamposTexto'
import Boton from '../../../components/Boton'
import { MONEDAS, MONEDA_POR_DEFECTO, simboloDe } from '../../../utils/monedas'
import {
  VALORES_INICIALES_SOLICITUD,
  esquemaCrearSolicitud,
  prepararSolicitud,
} from '../../../utils/validacion'

const LIMITE_OBSERVACION = 500

/**
 * Alta de solicitud.
 *
 * React Hook Form con Zod. Las reglas son las mismas del backend, con los mismos
 * mensajes, y estan en `utils/validacion.js`.
 *
 * Lo importante es que el 400 del servidor tambien aterriza en los campos. La
 * API devuelve `datos` con un mensaje por propiedad; esos mensajes se inyectan
 * con setError para que aparezcan bajo el input que corresponde y no como un
 * aviso suelto. Si solo se mostrara el mensaje global, el usuario tendria que
 * adivinar cual de los cinco campos esta mal.
 */
export default function FormularioSolicitud({ alCancelar, alCrear }) {
  const [errorGeneral, setErrorGeneral] = useState(null)

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    clearErrors,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(esquemaCrearSolicitud),
    defaultValues: VALORES_INICIALES_SOLICITUD,
    mode: 'onBlur',
  })

  // El campo Cliente lo pinta SelectorCliente, no un <input> de RHF, asi que
  // `register` no se extiende sobre el elemento. Se registra igualmente para
  // que el campo exista en el resolver: sin esto, `handleSubmit` no lo
  // validaria y un cliente ausente pasaria sin quejarse.
  register('clienteId')

  const observacion = watch('observacion') ?? ''

/** Moneda elegida, para mostrar su simbolo junto al monto. */
const monedaElegida = watch('moneda') || MONEDA_POR_DEFECTO

  const enviar = handleSubmit(async (valores) => {
    setErrorGeneral(null)

    try {
      await alCrear(prepararSolicitud(valores))
      reset(VALORES_INICIALES_SOLICITUD)
    } catch (error) {
      if (error.campos) {
        Object.entries(error.campos).forEach(([campo, mensajes]) => {
          setError(campo, { type: 'servidor', message: mensajes[0] }, { shouldFocus: true })
        })
      }

      setErrorGeneral(error)
      toast.error(error.mensaje)
    }
  })

  return (
    <form onSubmit={enviar} noValidate className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Campo
        className="sm:col-span-2"
        etiqueta="Cliente"
        obligatorio
        error={errors.clienteId?.message}
        ayuda="Busca por nombre o codigo. También acepta un UUID pegado."
      >
        {(props) => (
          <SelectorCliente
            {...props}
            valor={watch('clienteId')}
            alCambiar={(uuid) => {
              setValue('clienteId', uuid, { shouldDirty: true })
              // Al elegir se borra el error anterior: el mensaje "debe ser un
              // UUID valido" sobre un campo ya resuelto es ruido.
              clearErrors('clienteId')
            }}
          />
        )}
      </Campo>

      <Campo etiqueta="Monto" obligatorio error={errors.monto?.message}>
        {(props) => (
          // El input es type="number": dentro no puede ir un simbolo. Se muestra
          // al lado, y cambia solo al cambiar la moneda del desplegable, para
          // que se vea en que unidades se esta escribiendo.
          <div className="relative">
            <Entrada
              {...props}
              {...register('monto')}
              type="number"
              step="0.01"
              inputMode="decimal"
              placeholder="1500.00"
              className="pr-14"
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute right-3 top-1/2
                -translate-y-1/2 text-sm text-ink-muted"
            >
              {simboloDe(monedaElegida)}
            </span>
          </div>
        )}
      </Campo>

      <Campo etiqueta="Moneda" obligatorio error={errors.moneda?.message}>
        {(props) => (
          <Selector {...props} {...register('moneda')}>
            {MONEDAS.map((moneda) => (
              <option key={moneda.codigo} value={moneda.codigo}>
                {moneda.codigo} — {moneda.nombre}
              </option>
            ))}
          </Selector>
        )}
      </Campo>

      <Campo
        className="sm:col-span-2"
        etiqueta="Vigencia"
        obligatorio
        error={errors.vigenciaDias?.message}
        ayuda="Dias que tendre la solicitud antes de vencer."
      >
        {(props) => (
          <Entrada
            {...props}
            {...register('vigenciaDias')}
            type="number"
            min="1"
            max="365"
            step="1"
            inputMode="numeric"
          />
        )}
      </Campo>

      <Campo
        className="sm:col-span-2"
        etiqueta="Observacion"
        error={errors.observacion?.message}
        ayuda="Opcional. Se conserva con la solicitud."
      >
        {(props) => (
          <AreaTexto {...props} {...register('observacion')} rows={3} />
        )}
      </Campo>

      <div className="sm:col-span-2 -mt-1 flex justify-end text-xs text-ink-muted">
        <span className={observacion.length > LIMITE_OBSERVACION ? 'text-danger' : undefined}>
          {observacion.length} de {LIMITE_OBSERVACION}
        </span>
      </div>

      {errorGeneral && !errorGeneral.campos && (
        <p role="alert" className="sm:col-span-2 flex items-start gap-2 rounded-md bg-danger-tint px-3 py-2.5 text-[13px] text-danger-body">
          <Info size={15} aria-hidden="true" className="mt-px shrink-0" />
          <span>
            {errorGeneral.mensaje}
            {errorGeneral.correlationId && (
              <span className="mt-1 block text-xs opacity-80">
                Id de correlacion: {errorGeneral.correlationId}
              </span>
            )}
          </span>
        </p>
      )}

      <div className="sm:col-span-2 flex justify-end gap-2 border-t border-line pt-4">
        <Boton variante="secundario" onClick={alCancelar} disabled={isSubmitting}>
          Cancelar
        </Boton>

        <Boton type="submit" variante="primario" cargando={isSubmitting}>
          Crear solicitud
        </Boton>
      </div>
    </form>
  )
}