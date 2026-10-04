/**
 * Estados de solicitud.
 *
 * Esto es un ESPEJO del dominio en C#:
 *   - los valores, de Transacciones.CrossCutting/Enums/EnumEstadoSolicitud.cs
 *   - la tabla de transiciones, de Core/Models/Solicitud.cs (EsTransicionValida)
 *   - los estados terminales y vencenables, de las colecciones estaticas del mismo POCO
 *
 * El valor numerico es PARTE DEL CONTRACTO: se persiste en la columna Estado. Si
 * el backend reordena el enum y aqui no, la interfaz empieza a mostrar estados
 * equivocados sin que nada falle.
 *
 * Por eso el enum vive aqui, en un solo archivo, y no repartido en componentes.
 * Cuando cambie el dominio, se toca este archivo.
 */

export const ESTADO = {
  BARRADOR: 0,
  REGISTRADA: 1,
  APROBADA: 2,
  RECHAZADA: 3,
  VENCIDA: 4,
  ANULADA: 5,
}

/**
 * Catalogo de estados. El orden es el del enum.
 *
 * El color es un dato de la ficha, no una clase de Tailwind, porque se aplica
 * en linea: Tailwind no genera utilidades para valores dinamicos y las clases
 * escritas a mano en el componente obligarian a mantener una lista de colores
 * en dos sitios.
 *
 * `descripcion` es la ayuda de la ficha de estado en el detalle. Explica el
 * significado, no el nombre: "Rechazada" ya se lee solo.
 */
export const ESTADOS = [
  {
    valor: ESTADO.BARRADOR,
    nombre: 'Borrador',
    color: '#64748b',
    descripcion: 'Creada pero todavia no enviada.',
  },
  {
    valor: ESTADO.REGISTRADA,
    nombre: 'Registrada',
    color: '#1d4ed8',
    descripcion: 'Pendiente de validacion. Su vigencia corre.',
  },
  {
    valor: ESTADO.APROBADA,
    nombre: 'Aprobada',
    color: '#15803d',
    descripcion: 'Validada. Ya no vence, pero se puede anular.',
  },
  {
    valor: ESTADO.RECHAZADA,
    nombre: 'Rechazada',
    color: '#b91c1c',
    descripcion: 'Rechazada con motivo registrado. Estado final.',
  },
  {
    valor: ESTADO.VENCIDA,
    nombre: 'Vencida',
    color: '#b45309',
    descripcion: 'No se atendio antes de su fecha limite. Estado final.',
  },
  {
    valor: ESTADO.ANULADA,
    nombre: 'Anulada',
    // Gris oscuro, no gris claro: un gris de valor #94a3b8 sobre fondo claro se
    // queda en 2,3:1 y no pasa el minimo AA. El peso visual lo distinguen de
    // Borrador; la etiqueta hace el resto.
    color: '#475569',
    descripcion: 'Anulada por el usuario. Estado final.',
  },
]

/**
 * Transiciones permitidas, en pares [origen, destino].
 *
 * Copia exacta de la tabla del dominio. Se recorre en el mapa de estados del
 * detalle, asi que el orden determina como se dibujan las filas: primero las
 * salidas de Borrador, luego las de Registrada, luego las de Aprobada.
 */
export const TRANSICIONES = [
  [ESTADO.BARRADOR, ESTADO.REGISTRADA],
  [ESTADO.BARRADOR, ESTADO.ANULADA],
  [ESTADO.REGISTRADA, ESTADO.APROBADA],
  [ESTADO.REGISTRADA, ESTADO.RECHAZADA],
  [ESTADO.REGISTRADA, ESTADO.VENCIDA],
  [ESTADO.REGISTRADA, ESTADO.ANULADA],
  [ESTADO.APROBADA, ESTADO.ANULADA],
]

/** Estados desde los que ya no se sale. Espejo de Solicitud.EstadosTerminales. */
export const ESTADOS_TERMINALES = new Set([
  ESTADO.RECHAZADA,
  ESTADO.VENCIDA,
  ESTADO.ANULADA,
])

/**
 * Estados a los que el paso de vencimiento puede marcar como vencidos.
 * Espejo de Solicitud.EstadosVencenables.
 *
 * Ojo: NO es "todo lo que no es terminal". Una solicitud Aprobada sigue
 * abierta pero el job no la toca. Confundir las dos cosas lleva a pintar un
 * contador de dias en una solicitud que ya fue decidida, que es exactamente el
 * error que este archivo evita.
 */
export const ESTADOS_VENCENABLES = new Set([ESTADO.BARRADOR, ESTADO.REGISTRADA])

/**
 * Acciones del detalle y el estado al que llevan.
 *
 * "Vencida" no aparece: no hay boton para vencer una solicitud a mano; el job
 * de Quartz lo hace cuando toca. Si apareciera, el backend responderia 400 con
 * SOL-003.
 */
export const ACCIONES = [
  {
    id: 'aprobar',
    destino: ESTADO.APROBADA,
    etiqueta: 'Aprobar',
    tono: 'primario',
    exigeMotivo: false,
  },
  {
    id: 'rechazar',
    destino: ESTADO.RECHAZADA,
    etiqueta: 'Rechazar',
    tono: 'peligro',
    exigeMotivo: true,
  },
  {
    id: 'anular',
    destino: ESTADO.ANULADA,
    etiqueta: 'Anular',
    tono: 'neutro',
    exigeMotivo: false,
  },
]

/** Devuelve la ficha de estado, o una ficha neutra si el valor no se conoce. */
export function fichaEstado(valor) {
  return (
    ESTADOS.find((estado) => estado.valor === valor) ?? {
      valor,
      nombre: `Estado ${valor}`,
      color: '#666e85',
      descripcion: 'Estado no reconocido por esta version de la interfaz.',
    }
  )
}

export function etiquetaEstado(valor) {
  return fichaEstado(valor).nombre
}

export function colorEstado(valor) {
  return fichaEstado(valor).color
}

export function esTerminal(valor) {
  return ESTADOS_TERMINALES.has(valor)
}

/**
 * True si el job de vencimiento puede actuar sobre este estado.
 * Es la condicion que decide si se dibuja el reloj en la fila.
 */
export function esVencenable(valor) {
  return ESTADOS_VENCENABLES.has(valor)
}

/** True si el dominio permite pasar de `origen` a `destino`. */
export function puedeTransitar(origen, destino) {
  return TRANSICIONES.some(([desde, hacia]) => desde === origen && hacia === destino)
}

/**
 * Acciones disponibles desde un estado, en el orden de ACCIONES.
 *
 * Una solicitud solo se crea en Registrada, asi que Borrador no aparece nunca
 * en pantalla aunque siga en el catalogo: forma parte del dominio y puede que
 * mas adelante haya un endpoint que lo alcance.
 */
export function accionesDisponibles(estado) {
  return ACCIONES.filter((accion) => puedeTransitar(estado, accion.destino))
}

/** Estados alcanzables desde `estado`, en el orden del catalogo. */
export function estadosSiguientes(estado) {
  return ESTADOS.filter((destino) => puedeTransitar(estado, destino.valor))
}