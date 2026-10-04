import { fraccionVigencia, formatearFecha, textoVigencia } from '../utils/formateo'

/**
 * Medidor de vigencia.
 *
 * Una barra de 64px que mide el plazo CONSUMIDO, de la fecha de solicitud a la
 * de vencimiento, con el texto de lo que queda al lado.
 *
 * Solo se pinta en los estados vencenables (Borrador y Registrada). En una
 * solicitud Aprobada o en cualquier estado final el reloj no corre, y una barra
 * que baja sola sobre un estado ya decidido seria informacion falsa.
 *
 * Dos motivos por los que se incluye y no basta con la fecha:
 *
 *  - Al lado de 14 estados distintos, "vence en 12 dias" obliga a leer; un
 *    relleno de barra se distingue a un vistazo.
 *  - Ordena por urgencia sin tener que leer nada.
 */
export default function MedidorVigencia({ solicitud, ancho = 'w-16', ahora }) {
  const fraccion = fraccionVigencia(
    solicitud.fechaSolicitud,
    solicitud.fechaVencimiento,
    ahora,
  )

  const vencida = fraccion >= 1
  // El color va con la urgencia, no con el estado: una solicitud Registrada a
  // punto de vencer merece mas atencion que otra recien creada.
  //
  // Estos tres son los MISMOS tonos que los estados Rechazada, Vencida y
  // Registrada. No es coincidencia: azul quieto, ambar de aviso, rojo de
  // urgencia es el mismo criterio con el que se pinta el resto del panel, y
  // estaba duplicado aqui como hexadecimal suelto —que es exactamente como se
  // rompe un tema oscuro—. Ahora la escala de urgencia no se puede
  // desincronizar del catalogo: son las mismas variables.
  const color = vencida
    ? 'var(--color-estado-3)'
    : fraccion >= 0.75
      ? 'var(--color-estado-4)'
      : 'var(--color-estado-1)'

  const titulo =
    `Solicitada el ${formatearFecha(solicitud.fechaSolicitud)}` +
    `, vence el ${formatearFecha(solicitud.fechaVencimiento)}`

  return (
    <div className="flex items-center gap-2" title={titulo}>
      <span
        aria-hidden="true"
        className={`relative block ${ancho} h-1 shrink-0 rounded-full bg-line`}
      >
        <span
          className="block h-1 rounded-full"
          style={{ width: `${Math.round(fraccion * 100)}%`, backgroundColor: color }}
        />
      </span>

      <span
        className={`text-xs whitespace-nowrap ${
          vencida ? 'font-medium text-danger' : 'text-ink-muted'
        }`}
      >
        {textoVigencia(solicitud.fechaVencimiento, ahora)}
      </span>
    </div>
  )
}