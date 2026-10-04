# Gestión de Solicitudes — Interfaz web

Aplicación React para la API de Transacciones: registrar solicitudes con monto
y vigencia, y gestionarlas hasta su estado final.

No contiene reglas de negocio. Si una solicitud se puede aprobar o no, lo dice
el backend; aquí se refleja lo que responda.

---

## Puesta en marcha

```powershell
cd D:\projects\Transacciones\frontend

npm install
npm run dev
```

Abre **http://localhost:5173**.

La API tiene que estar escuchando en el puerto 5250. Si está en otro sitio:

```powershell
# .env
VITE_PROXY_TARGET=http://localhost:5250
```

### Comandos

> **Si el navegador no refleja los cambios del código, Vite tiene su watcher
> muerto** y hay que reiniciarlo. Es un fallo silencioso: los ficheros se
> guardan bien, el navegador sigue sirviendo el bundle viejo, y parece que la
> corrección no funciona. Para comprobar si es eso, escribe un comentario
> absurdo en cualquier componente y búscalo en el código servido por
> `http://localhost:5173/src/...`: si no aparece, el watcher está muerto.
>
> ```powershell
> # Ctrl+C, y luego:
> Remove-Item -Recurse -Force node_modules\.vite -ErrorAction SilentlyContinue
> npm run dev
> ```
>
> Después, **Ctrl+Shift+R** en el navegador.

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo con proxy hacia la API |
| `npm run build` | Compila a `dist/` |
| `npm run preview` | Sirve `dist/` para comprobar el resultado |
| `npm run lint` | ESLint |
| `npm run lint:fix` | ESLint corrigiendo lo corregible |
| `npm run format` | Prettier escribe los cambios |
| `npm test` | Vitest, una pasada |
| `npm run test:watch` | Vitest en continuo |

---

## Variables de entorno

Copia `.env.example` a `.env`. No hay ninguna obligatoria: los valores por
defecto ya apuntan al entorno de desarrollo.

| Variable | Por defecto | Para qué |
|---|---|---|
| `VITE_API_URL` | `/api` | Base de Axios. Relativa a propósito. |
| `VITE_PROXY_TARGET` | `http://localhost:5250` | A dónde reenvía el proxy de Vite. |

**Por qué `VITE_API_URL` es relativa.** La API acepta CORS desde
`localhost:4200` y `localhost:5173`. Con una URL absoluta, la petición sale del
navegador y depende de esa lista. Con `/api`, sale del mismo origen que el
servidor de Vite, que la reenvía: no hay CORS que esperar.

---

## Estructura

```
src/
├── api/                       Acceso a datos. No sabe nada de React.
│   ├── cliente.js             Instancia de Axios, interceptores, ErrorApi
│   └── solicitudes.js         Un método por endpoint
│
├── components/                Piezas reutilizables, sin conocimiento del dominio
│   ├── Boton.jsx              Cuatro variantes, estado de carga
│   ├── BotonCorrelacion.jsx   Pide un id de correlación y lo copia
│   ├── BotonTema.jsx          Interruptor claro/oscuro
│   ├── Campo.jsx              Label + error + ayuda, cableado de accesibilidad
│   ├── CamposTexto.jsx        Entrada, AreaTexto y Selector con la misma clase
│   ├── Confirmar.jsx          Confirmación de una acción sin datos
│   ├── Dialogo.jsx            Modal: Escape, foco atrapado, portal
│   ├── Esqueleto.jsx          Esqueletos de carga y anuncio para lectores
│   ├── InsigniaEstado.jsx     Distintivo de estado
│   ├── MapaEstados.jsx        La máquina de estados dibujada
│   ├── MedidorVigencia.jsx    Barra de plazo consumido
│   ├── Paginacion.jsx         Ventana de páginas con huecos
│   ├── PanelError.jsx         Error con reintento e id de correlación
│   ├── SelectorCliente.jsx    Combobox: se elige por nombre, se envía el UUID
│   ├── Vacio.jsx              Pantalla vacía con llamada a la acción
│   └── (los .test.js viven junto a lo que prueban, en api/ y utils/)
│
├── features/solicitudes/      Todo lo propio del módulo
│   ├── components/
│   │   ├── DialogoRechazo.jsx     Motivo obligatorio
│   │   ├── Filtros.jsx            Barra de filtros
│   │   └── FormularioSolicitud.jsx
│   └── pages/
│       ├── DetalleSolicitud.jsx
│       └── ListaSolicitudes.jsx
│
├── hooks/                     TanStack Query y utilidades
│   ├── useDebounce.js
│   ├── useSolicitudes.js
│   └── useTema.js              Suscripción al tema, sin React en utils/
│
├── layouts/
│   └── LayoutPrincipal.jsx    Lateral, cabecera, cajon de móvil
│
├── pages/
│   └── NoEncontrado.jsx       404
│
├── utils/                     Sin dependencias de React
│   ├── clientesDemo.js        Catálogo de ejemplo — se sustituye por la API
│   ├── estados.js             Enum, tabla de transiciones, color por variable
│   ├── formateo.js            Fechas, montos, UUID
│   ├── monedas.js             Catálogo cerrado de monedas ISO 4217
│   ├── tema.js                Tema claro/oscuro. Sin React, a propósito
│   └── validacion.js          Esquemas Zod
│
├── App.jsx                    Rutas y proveedores
├── main.jsx                   Punto de entrada
└── estilos.css                Tokens de diseño
```

La regla es `components/` para lo reutilizable y `features/` para lo del
dominio. Un componente que sabe qué es una solicitud vive en `features/`.

---

## Decisiones técnicas

### El contrato tiene dos formatos y la app habla uno

La API devuelve los errores con la misma forma que los aciertos:

```json
{ "exito": false, "codigo": "GEN-404", "mensaje": "…", "correlationId": "…" }
```

El interceptor de `api/cliente.js` desenvuelve el `exito: true` y convierte
cualquier fallo en un `ErrorApi` con siempre los mismos campos. A partir de ahí,
ningún componente sabe que existió un sobre.

**Un 200 con `exito: false` también es un error.** El interceptor lo comprueba,
porque un cliente que solo mire el status daría por buena una respuesta de
error.

También acepta ProblemDetails, aunque la API no lo emita. Son veinte líneas y
evitan reescribir el cliente el día que la API lo adopte.

### Los errores de campo llegan al campo, no a un banner

Un 400 trae `datos` con un mensaje por propiedad. `FormularioSolicitud` los
inyecta con `setError` para que aparezcan bajo el input que corresponde. Si solo
se mostrara el mensaje global, el usuario tendría que adivinar cuál de los cinco
campos está mal.

### La tabla de estados es una copia del dominio, y hay tests

`utils/estados.js` reproduce `EnumEstadoSolicitud`, `EsTransicionValida`,
`EstadosTerminales` y `EstadosVencenables` del backend.

| Estado | Aprobar | Rechazar | Anular |
|---|:--:|:--:|:--:|
| Borrador | — | — | ✓ |
| Registrada | ✓ | ✓ | ✓ |
| Aprobada | — | — | ✓ |
| Rechazada · Vencida · Anulada | — | — | — |

`estados.test.js` es el espejo de esa tabla. Si el backend añade una transición
y aquí no, el botón no aparece y la acción sigue siendo posible por la API: no
hay ningún error visible, solo una interfaz que se queda corta. El test es la
alarma.

### El reloj solo corre donde la vigencia corre

`EstadosVencenables` en el backend es `{ Borrador, Registrada }`. Una solicitud
**Aprobada no vence**, aunque tampoco sea terminal. Por eso el medidor de
vigencia solo se dibuja en esos estados; en el resto se muestra una raya.

Pintar un contador en una solicitud ya decidida sería información falsa.

### Los filtros de fecha se convierten a UTC antes de enviarse

El backend guarda `FechaSolicitud` con `DateTime.UtcNow` y filtra con
`FechaSolicitud >= @desde`, sin convertir nada.

Si el selector de fechas mandara `2026-10-03` tal cual, el servidor lo leería
como medianoche **UTC** y descartaría las solicitudes creadas entre las 00:00 y
las 05:00 hora local. No habría ningún error: el filtro simplemente devolvería
menos filas.

`limitesDeRangoLocal` ancla `desde` a las 00:00:00.000 locales y `hasta` a las
23:59:59.999 locales, y convierte ambos a instante UTC. Es el test con más valor
de todo el proyecto: si falla, no se ve ningún error, solo un listado
"incompleto".

### Los botones no son fijos

Salen de `accionesDisponibles(estado)`. Si una solicitud está Aprobada, no hay
"Aprobar". Una acción que no es posible no se muestra ni se ofrece como botón
gris: en una pantalla de detalle, un botón que no va a hacer nada solo hace
perder el tiempo.

El mapa de estados es información, no el mecanismo: `role="img"` con
descripción, y los botones llevan su propio estado deshabilitado y su texto.

### El monto lleva el símbolo de su moneda, y la moneda es una lista cerrada

`formatearMonto(1500, 'PEN')` devuelve `S/1,500.00`, no `1,500.00 PEN`. El código
ISO desaparece del rótulo y pasa a la ficha de datos del detalle, donde hay sitio
para escribir `PEN — Sol peruano`.

El símbolo sale de `utils/monedas.js` y **no** de `Intl` con `style: 'currency'`.
Intl decide el separador según el locale, y en `es-PE` el dólar sale como
`US$ 1,500.00`: un prefijo de dos letras donde el resto de monedas tiene uno. Con
el catálogo propio el formato es idéntico para las trece.

El prefijo no es decorativo. `USD $`, `MXN MX$`, `COP COL$` y `UYU $U` son **todos
un dólar a simple vista**, y en una columna con montos de países distintos eso es
ambigüedad real. Las que se confunden llevan prefijo; `CHF` no tiene símbolo
internacional y se muestra el código.

La moneda es un **desplegable cerrado**. El backend solo exige tres caracteres
(`[StringLength(3, 3)]`, columna `NVARCHAR(3)`), pero un campo libre obligaba a
acordarse de las letras y toleraba `"pen "` o `"p3n"`, que la API aceptaba sin
protestar y nadie sabe interpretar después al sumar montos.

### Cada transición redibuja la vista, y refresca si algo se pierde

Aprobar, rechazar y anular devuelven la solicitud ya actualizada, así que la
respuesta se escribe en la caché del detalle y la fila se actualiza en **todas**
las páginas cacheadas del listado, sin esperar al refetch.

Antes solo se invalidaba el listado, y `invalidateQueries` refetchea
únicamente las consultas **activas**: con el detalle abierto, el listado quedaba
marcado como viejo sin redibujarse. La transición se guardaba y la pantalla
mentía.

Hay un segundo caso, más raro y más importante: si la petición **se guardó pero
se perdió la respuesta** —un timeout, una caída de red— la mutación falla, el
detalle se refresca, y la verdad la dice el servidor: o aparece el estado nuevo,
o confirma que no se guardó. Sin ese refetch, un `catch` que solo muestra un
toast deja al usuario creyendo que no pasó nada.

### El cliente se elige por nombre, no se teclea un UUID

La API pide un `clienteId` que es una **referencia a otro sistema**: el catálogo
de clientes (`CatalogoService` → `localhost:5202`, declarado en
`ExternalApis:CatalogoUrl`). Esta aplicación es un tercer consumidor: recibe el
identificador, no lo emite.

Por eso el alta **no genera un UUID**. Un `crypto.randomUUID()` resolvería el
formulario y crearía una solicitud apuntando a un cliente que no existe en
ningún sitio: ni un reporte ni una reconciliación posterior la podrían
arreglar. Generar identificadores automáticamente solo es correcto cuando el
mismo sistema que crea la entidad puede crearla; aquí el cliente es de otro.

Mientras el catálogo no exista, `SelectorCliente.jsx` ofrece una lista de
clientes de ejemplo y rellena el UUID al elegir. Sigue aceptando un UUID
pegado, por si el cliente se dio de alta en otro sitio y aquí no está todavía.

Debajo del campo se muestra el UUID exacto que se va a enviar. Sin esa línea,
elegir "Comercial del Norte" no dice qué dato se guarda — y es justo lo que hizo
el campo incomprensible desde el principio.

**Para conectar el catálogo real:** se borra `utils/clientesDemo.js` y se cambia
una llamada en `SelectorCliente.jsx` —`buscarClientes(texto)` por un `useQuery`
contra `GET /api/clientes?search=`. Ese endpoint debe devolver `ClienteDto`
(`Id`, `Codigo`, `RazonSocial`, `Correo`, `Activo`), que ya existe en el
backend. La forma del objeto no cambia, y por eso el selector ya pide
exactamente esos campos.

### El identificador de cliente se valida antes de consultar

Un `clienteId` que no es UUID haría que `[FromQuery] Guid?` fallara al enlazarlo
y devolvería un 400. El error se muestra bajo el campo y el hook desactiva la
consulta (`enabled`), así que ni se llega a pedir.

### Autenticación preparada, no implementada

```js
import { definirProveedorDeToken } from './api/cliente'

definirProveedorDeToken(() => localStorage.getItem('token'))
```

Si devuelve un token, el interceptor añade `Authorization: Bearer`. Hoy devuelve
`null` y no se manda cabecera. No hay que tocar el cliente ni los servicios.

---

## Diseño

El panel tiene dos ejes: **el estado** y **el tiempo**. Casi todo lo visual sale
de ahí.

### Tokens

| Token | Valor | Uso |
|---|---|---|
| `canvas` | `#F1F3F9` | Fondo: papel frío con un toque de índigo |
| `surface` | `#FFFFFF` | Tabla, tarjetas y modales |
| `ink` | `#14171F` | Texto principal |
| `ink-muted` | `#666E85` | Texto secundario |
| `brand` | `#4338CA` | Primario |
| `line` | `#E1E4EE` | Filetes de 1 px |

El índigo es `#4338CA` y no el `#4F46E5` de la paleta por defecto de Tailwind:
el de por defecto es tan habitual que acaba funcionando como color de marca de
cualquier plantilla.

Estados: Borrador `#64748B` · Registrada `#1D4ED8` · Aprobada `#15803D` ·
Rechazada `#B91C1C` · Vencida `#B45309` · Anulada `#475569`.

Anulada es gris oscuro y no gris claro a propósito: un gris de valor `#94A3B8`
sobre fondo claro se queda en 2,3:1 y no pasa el mínimo AA.

Una sola familia, **Inter**, con cifras de ancho fijo en todo el documento
(`font-variant-numeric: tabular-nums`). Los montos y los códigos tienen que
alinearse en columna; con cifras proporcionales el ojo no encuentra la fila.

### Los dos momentos distintivos

**La columna Vigencia.** Una barra de 64 px que mide el plazo consumido, de la
fecha de solicitud a la de vencimiento, con el texto de lo que queda al lado. El
color va con la urgencia, no con el estado. Al lado de seis estados distintos,
"vence en 12 días" obliga a leer; un relleno de barra se distingue de un vistazo.

**El mapa de estados en el detalle.** Cada fila es una transición permitida,
"origen —— destino", con las que salen del estado actual destacadas. Es la tabla
del dominio dibujada, no una ilustración.

### Tema oscuro

Interruptor en la cabecera. Sin atributo en `<html>` manda la preferencia del
sistema; en cuanto se pulsa, la elección queda guardada en `localStorage` y gana
sobre el sistema.

El interruptor **muestra el tema al que se va**, no el que hay: es un botón de
acción, y un icono de luna junto a un panel oscuro se lee como "estás en oscuro"
cuando lo que quiere decir es "pulsa para pasar a claro".

#### Cada token tiene su valor oscuro, y no es el mismo

No es un inverso automático. El índigo `#4338CA` del tema claro da **2,26:1**
sobre la superficie oscura: reutilizarlo sería el fallo clásico de un tema
oscuro hecho a medias.

| Token | Claro | Oscuro | Sobre `surface` |
|---|---|---|---|
`canvas` | `#f1f3f9` | `#0b0c11` | |
`surface` | `#ffffff` | `#16171d` | |
`ink` | `#14171f` | `#eaebee` | 15,00 |
`ink-muted` | `#666e85` | `#9598a4` | 6,22 |
`brand` | `#4338ca` | `#8994f7` | 6,51 |
`brand-ink` | `#ffffff` | `#0c0e1c` | botón 6,98 |
`danger` | `#b91c1c` | `#f9786a` | 6,75 |
`danger-body` | `#7f1d1d` | `#ffc1b7` | 11,55 |

Todos los valores se calcularon en OKLCH conservando el matiz del tema claro y
subiendo la luminosidad. **Subir solo la luz sin bajar la croma produce néon**
sobre fondo oscuro, así que la croma va a la baja en todos.

`brand-ink` invierte con el tema: es el texto *sobre* un relleno de marca, y en
oscuro el relleno se aclara, luego el texto tiene que oscurecerse. Lo mismo con
`danger-on` en el botón de peligro al pasar el ratón.

#### Los estados se miden sobre su fondo real, no sobre la superficie

La insignia se pinta con el color del estado al 8 % de alfa sobre la página, así
que el fondo donde vive el texto no es `surface` sino esa composición. Medido
sobre ella:

```
Borrador 6,41 · Registrada 6,56 · Aprobada 7,70 · Rechazada 5,64 · Vencida 7,47 · Anulada 5,07
```

`Anulada` necesita `L=0,655` en oscuro y no `0,600`: a 0,600 se queda en **4,15**
y no pasa AA. En claro el gris es oscuro (`#475569`, 6,7:1) porque un gris claro
sobre papel se queda en 2,3:1 — los dos temas necesitan direcciones opuestas, y
no es un error que el mismo token sea claro en uno y oscuro en el otro.

#### El rojo de peligro es una familia, no un hexadecimal

Aparecía como hex suelto en nueve ficheros. Sin token, en oscuro `#7f1d1d` sobre
superficie oscura da **1,78:1** y `bg-[#fdf5f5]` se convierte en un rectángulo
blanco de **16,65:1** en mitad de una pantalla negra. Ahora son `danger`,
`danger-on`, `danger-line`, `danger-tint` y `danger-body`.

#### La escala de urgencia ya no está duplicada

`MedidorVigencia` usaba `#b91c1c`, `#b45309` y `#1d4ed8` — exactamente los
tonos de Rechazada, Vencida y Registrada. La paleta estaba en dos sitios, que es
justo lo que el catálogo de estados advertía. Ahora usa `var(--color-estado-3)`,
`var(--color-estado-4)` y `var(--color-estado-1)`, y no se puede
desincronizar.

### Lo que no está

Sin tarjetas KPI: no hay endpoint de métricas y fabricarlas sería mentir. Sin
sombras salvo en modales. Sin etiquetas en mayúsculas, sin `→` en los botones,
sin puntos medios en los metadatos. Todo el texto en oraciones, alineado a la
izquierda; los números a la derecha y nada centrado.

**No hay estado "automático" en el interruptor.** Seguir al sistema es el punto
de partida, pero en cuanto se pulsa la elección queda guardada y volver a
automático exige borrar el almacenamiento local del navegador. Es una
limitación asumida: un control de tres segmentos no cabe en una cabecera densa
sin competir con el contenido. Si algún día hace falta, el sitio es
`BotonTema.jsx`, con un menú de tres opciones — no un gesto oculto.

---

## Accesibilidad

- Etiquetas asociadas por `id`, errores con `role="alert"` y `aria-describedby`
- `role="dialog"` con `aria-modal`, cierre con Escape, foco atrapado y devuelto
  al elemento de origen
- El código de cada fila es un enlace real: la navegación por teclado funciona
  sin `tabIndex` en el `<tr>`
- `aria-current="page"` en la página activa
- Un único anillo de foco en toda la aplicación
- `prefers-reduced-motion` respetado
- El id de correlación se puede copiar desde la pantalla de error y desde el
  botón de la cabecera

---

## Pruebas

```powershell
npm test
```

Cinco suites sobre lo que puede romperse en silencio:

| Fichero | Qué cubre |
|---|---|
| `api/cliente.test.js` | Los dos formatos de error, la correlación, las claves de campo |
| `utils/estados.test.js` | La tabla de transiciones, contra el dominio, y que el color sea variable CSS |
| `utils/formateo.test.js` | El rango de fechas en UTC, y el medidor de vigencia |
| `utils/tema.test.js` | Precedencia sistema / elección, valor corrupto en `localStorage`, el ciclo de alternar |
| `utils/validacion.test.js` | Los límites del formulario, contra `CrearSolicitudDto` |

No hay pruebas de componentes: no se pidió y el coste sube más que el
beneficio. Lo que sí tiene pruebas es la lógica pura y compartida.

`tema.test.js` monta `window` y `document` como stubs en lugar de pedir
`jsdom`, porque el resto de la suite corre en `environment: 'node'` a propósito y
no merece la pena arrastrar jsdom por siete pruebas.

**Lo que no tiene pruebas es el CSS.** Que los tokens oscuros existan y tengan
contraste está medido y documentado arriba; que la hoja los aplique lo decide el
navegador, y eso no lo cubre Vitest.