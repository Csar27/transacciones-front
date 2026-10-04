/**
 * Catalogo de clientes de ejemplo.
 *
 * ---------------------------------------------------------------------------
 * ESTE FICHERO ES UN SUSTITUTO TEMPORAL, NO EL CATALOGO REAL.
 * ---------------------------------------------------------------------------
 *
 * El catalogo de verdad vive en otro servicio del ecosistema
 * (`CatalogoService` -> http://localhost:5202, definido en
 * `appsettings.json` como `ExternalApis:CatalogoUrl`). Ese servicio no existe
 * todavia, y ningun controller de esta API lo expone: no hay nada a lo que
 * consultar.
 *
 * Por eso NO se genera un UUID aleatorio en cada alta. Eso crearia una
 * referencia colgante: la solicitud apuntaria a un cliente que no existe en
 * ningun sitio, y ni los reportes ni una reconcilacion posterior la podrian
 * arreglar. Un identificador generado automaticamente solo es correcto cuando
 * el mismo sistema que crea la entidad la puede crear; aqui el cliente es de
 * otro.
 *
 * Que hay en su lugar: una lista fija y visible de clientes de ejemplo, de la
 * que se elige. Sigue siendo un UUID, pero uno con nombre y codigo delante, que
 * es lo que un usuario puede distinguir a simple vista.
 *
 * ---------------------------------------------------------------------------
 * COMO SE SUSTITUYE POR EL CATALOGO REAL
 * ---------------------------------------------------------------------------
 *
 * Cuando exista el servicio, este archivo se borra entero y se cambia UNA cosa
 * en `SelectorCliente.jsx`: la llamada a `buscarClientes()` por un `useQuery`
 * contra `GET /api/clientes?search=`. Ese endpoint tendra que devolver
 * `ClienteDto` (`Id`, `Codigo`, `RazonSocial`, `Correo`, `Activo`), que ya esta
 * definido en el backend como
 * `Transacciones.Core/Models/ClienteDto.cs`. La forma del objeto no cambia, y
 * por eso el selector ya pide exactamente esos campos.
 */

export const CLIENTES_DEMO = [
  {
    id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    codigo: 'CLI-0001',
    razonSocial: 'Constructora Andina S.A.C.',
    correo: 'facturacion@constructora-andina.example',
  },
  {
    id: 'b9b7d023-7c2a-4b6e-9f4d-1a2b3c4d5e6f',
    codigo: 'CLI-0002',
    razonSocial: 'Comercial del Norte E.I.R.L.',
    correo: 'pagos@comercial-norte.example',
  },
  {
    id: 'c56a4180-65aa-42ec-a945-5fd21dec0538',
    codigo: 'CLI-0003',
    razonSocial: 'Transportes Sierra S.A.C.',
    correo: 'administracion@transportes-sierra.example',
  },
  {
    id: 'e8c1f0a2-4d3b-4e9c-8a71-2f6b5c9d0e13',
    codigo: 'CLI-0004',
    razonSocial: 'Distribuidora Lima S.A.C.',
    correo: 'tesoreria@distribuidora-lima.example',
  },
  {
    id: '1a2b3c4d-5e6f-4071-8293-a4b5c6d7e8f9',
    codigo: 'CLI-0005',
    razonSocial: 'Agroexportaciones del Norte S.A.C.',
    correo: 'contabilidad@agroexportaciones.example',
  },
  {
    id: '7d9c3f21-5b8e-4a1c-9d2f-6e3b8c4a1d05',
    codigo: 'CLI-0006',
    razonSocial: 'Servicios Integrales del Sur S.A.C.',
    correo: 'finanzas@servicios-sur.example',
  },
]

/** Cuantos se muestran como maximo. Una lista de veinte taparia el formulario. */
const LIMITE_RESULTADOS = 6

/** Cliente por UUID, o undefined si no es uno de los de ejemplo. */
export function clientePorId(id) {
  return CLIENTES_DEMO.find((cliente) => cliente.id === id)
}

/**
 * Busca por codigo o razon social, y tambien por UUID exacto.
 *
 * La busqueda ignora mayusculas y acentos: escribir "construccion" tiene que
 * encontrar "Construccion", y exigir el acento a un usuario es una barrera
 * absurda en un campo de texto.
 */
export function buscarClientes(termino) {
  const limpio = (termino ?? '').trim().toLowerCase()

  // Sin termino se ofrece el catalogo entero: es la lista corta y es lo que el
  // usuario quiere ver al abrir el desplegable.
  if (limpio === '') return CLIENTES_DEMO.slice(0, LIMITE_RESULTADOS)

  if (CLIENTES_DEMO.some((cliente) => cliente.id === limpio)) {
    const exacto = clientePorId(limpio)

    return [exacto]
  }

  return CLIENTES_DEMO.filter(
    (cliente) =>
      cliente.codigo.toLowerCase().includes(limpio) ||
      cliente.razonSocial.toLowerCase().includes(limpio),
  ).slice(0, LIMITE_RESULTADOS)
}

/** Texto que se escribe en el desplegable al elegir un cliente. */
export function etiquetaCliente(cliente) {
  return `${cliente.codigo} · ${cliente.razonSocial}`
}