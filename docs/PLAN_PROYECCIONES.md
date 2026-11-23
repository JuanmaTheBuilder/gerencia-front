# Plan: llevar la plantilla «Plan de Negocio Proyecciones» a la aplicación

Estado: **implementado (sprints 0 a 7)**. Decisiones tomadas: salud patronal 8,5 % para todos, intereses de cesantías = 1 % del devengado, y reporte en Excel o PDF desde un solo botón con minilista.

Desviaciones respecto al diseño original:
- Un plan se guarda como un documento JSON en la tabla `planes` (no en las ~10 tablas previstas): se edita y se calcula como un todo y no se consulta por partes.
- El motor está en `Gerencia-back/app/domain/proyecciones/` y se verificó contra la plantilla original recalculada: TIR, VPN y utilidades coinciden sin diferencias.
- El PDF y el Excel se generan en el back (`app/services/reportes_plan.py`); el Excel lleva fórmulas vivas y recalcula a los mismos números que la app.

## 0. Requisitos acordados

1. **Mismos cálculos que la plantilla.** Un solo modo: se reproducen las fórmulas del Excel, aunque tengan defectos. No hay «modo corregido».
2. **Datos organizados de forma más intuitiva** que las 3 hojas: pantallas por tema, autoguardado, filas que se agregan.
3. **Botón «Generar reporte»** que entregue el plan de negocio y de proyecciones con el aspecto de la plantilla, ya con los datos y cálculos.
4. **Sin los nombres de los estudiantes** en la aplicación. El reporte deja esas 4 líneas en blanco para llenarlas a mano al entregar.
5. **La Nómina global se llena y se calcula** dentro de la aplicación, y alimenta el plan.
6. **Reutilizar** lo que ya existe en el front y el back.

## 1. Qué contiene la plantilla

| Hoja | Contenido |
|---|---|
| Proyecciones | Plan financiero 2025 a 2030. 177 celdas de entrada (sin los 4 nombres) |
| Nómina (adjunto) | Costo legal de un empleado con salario mínimo |
| Nomina global | Liquidación de 7 empleados: novedades, devengado, deducciones, provisiones |

Columnas E a J = años 2025 a 2030. Hoy las hojas de nómina no están conectadas a Proyecciones: se copia el total a mano. En la app se conectan.

### 1.1 Proyecciones: qué se llena y qué se calcula

| Bloque (filas) | Se llena | Se calcula |
|---|---|---|
| Datos (1-6) | Empresa, producto | |
| Inversiones (8-20) | Edificaciones, maquinaria, muebles, vehículos, cómputo, diferidos, 6 renglones libres | Inversión total = activos + capital de trabajo de 3 meses |
| Capital de trabajo (21-24) | Mano de obra y gastos adm./ventas, meses 1 a 3 | Total por mes |
| Crecimiento del sector (26) | % anual 2026-2030 | |
| Demanda (28-31) | Cantidad anual, precio inicial | Precio = anterior × (1 + crecimiento). Ingreso = cantidad × precio |
| Cartera (32-34) | % provisión, % crédito (30), % contado (70) | Valor = ingreso × % |
| IPC (36) | % anual 2026-2030 | |
| Materia prima (38-46) | Por insumo: gramos o ml y costo por gramo | Costo por unidad = cantidad × costo. 2025 = costo unidad × cantidad 2025. Siguientes = anterior × (1 + IPC) |
| Margen y pagos (47-49) | % pago contado (30), % crédito (70) | Margen bruto = (ingreso − MP) / ingreso. Pagos = MP × % |
| Mano de obra (51-53) | Se precarga como 5 % de la MP | Total |
| CIF (55-63) | Energía, agua, teléfono y 4 libres | Total |
| Adm. y ventas (65-74) | Nómina adm., nómina ventas, publicidad, comisiones y 4 libres; justificaciones | Total |
| Pérdidas y ganancias (77-88) | % renta, % reserva legal, % dividendos | CMV (MP + MO), utilidad bruta, gastos, provisión, UAI, impuesto, utilidad neta, reserva, dividendos |
| Flujo de caja (91-102) | | Ingresos = ventas de contado. Egresos = MP contado + MO + CIF + gastos + impuesto. Año 0 = −inversión |
| Evaluación (105-107) | Tasa de oportunidad (12 %) | TIR y VPN |

### 1.2 Nómina

**Se llena:** SMLV, auxilio de transporte, nivel ARL y, por empleado: salario, días, incapacidades, comisiones, recargo nocturno, horas extra (diurna, nocturna, festiva diurna, festiva nocturna) y recargo festivo.

**Se calcula:** valor hora = salario / 240; cada novedad = horas × valor hora × factor (0,35 / 1,25 / 1,75 / 0,75 / 2 / 2,5); auxilio solo si el salario es ≤ 2 SMLV, proporcional a los días; devengado; salud 4 % y pensión 4 % del empleado; neto pagado; cesantías 8,33 %, prima 8,33 %, vacaciones 4,17 %, intereses 1 %, pensión 12 %, caja 4 %, ARL; ICBF 3 % y SENA 2 % solo desde 10 SMLV; costo total por empleado.

## 2. Qué significa «mismos cálculos»

El motor reproduce las fórmulas tal cual. Esto incluye estos comportamientos, que **se conservan** y se documentan:

| Comportamiento de la plantilla | Se refleja así en la app |
|---|---|
| Desde 2026 la MP solo sube por IPC, no por la cantidad | Igual. Una nota visible lo explica |
| Los CIF no entran al estado de resultados, solo al flujo de caja | Igual |
| Las ventas a crédito no se cobran ni la MP a crédito se paga | Igual |
| El VPN incluye la inversión del año 0 dentro de `NPV` | Igual (`NPV(tasa, año0:año6)`), para que coincida con el Excel |
| No hay depreciación | Igual |
| El precio crece con el crecimiento del sector | Igual |
| Dividendos y reserva no salen del flujo de caja | Igual |

**Panel «Observaciones del modelo»** (solo informativo, no cambia ningún número): lista cuáles de estos puntos afectan al plan actual. Por ejemplo, avisa si el costo de MP no sigue a la demanda o si hay un año con pérdida. Así quien lo use sabe qué mirar, y el resultado sigue igual al de la plantilla.

### Excepciones: referencias rotas de la nómina
La Nomina global tiene referencias mal alineadas (salta la fila de un empleado, mezcla salarios y riesgos, toma días fijos de 30, una columna llamada «Incapacidades» que recibe horas extra, una celda suelta `N48`). En la app los empleados son una **lista**, así que esos errores no existen: cada empleado usa **sus** propios datos. Es la única diferencia con el Excel y favorece al usuario. Para el caso con 7 empleados correctamente llenados, el cálculo por empleado coincide con las fórmulas de la plantilla.

## 3. Qué hay hoy y qué se reutiliza

### Front (React 19 + Vite + Tailwind 4 + Recharts)
| Existe | Decisión |
|---|---|
| `Layout`, `Sidebar` | **Reutilizar.** Solo se agrega la sección «Plan de negocio» en `menuSections` |
| `DataTable`, `Modal`, `FormField`, `Toast`, `useApi`, `useToast`, `formatters` | **Reutilizar** |
| `api/client.ts` (`get/post/patch/del`) | **Reutilizar.** Falta descargar archivos (blob) para el reporte |
| `Recharts` | **Reutilizar** para las gráficas de resultados |
| Páginas Productos, Recetas, Insumos, Recursos, Precios de venta | **Reutilizar como catálogo**: de ahí se traen datos al plan (botón «Traer desde…») |
| Calculadora, Punto de equilibrio | **Conservar sin cambios** |
| Nueva: tabla por años (azul editable / verde calculado) | **Crear.** Se usa en todas las pantallas del plan |

### Back (FastAPI + SQLAlchemy + Alembic + PostgreSQL)
| Existe | Decisión |
|---|---|
| Modelos de insumos, productos, recetas, recursos, precios, punto de equilibrio | **Reutilizar** |
| `services/` (costos, punto de equilibrio) | Patrón a seguir; el motor nuevo va en su propio módulo |
| Alembic | Una migración nueva por sprint, solo agrega tablas |
| `requirements.txt` | Agregar `openpyxl` (reporte Excel) |

### Deuda que se resuelve primero (verificada)
- **El build del front falla**: `Badge` importado sin uso en Insumos, PreciosVenta, Productos, Recetas y Recursos (TS6133).
- `precio_compra` tiene 2 decimales: insuficiente para costo por gramo. Pasar a 6.
- El catálogo de unidades no trae g ni ml, y no hay conversión kg a g.
- IVA de 21 % en la Calculadora y 19 % fijo en el back.
- Contraseña de PostgreSQL escrita en `app/tests/test_app.py`: moverla a variable de entorno y cambiarla.
- `.env` del front está versionado.
- La API no tiene autenticación.

## 4. Solución

### Navegación
```
Plan de negocio    (selector de plan arriba)
  1 Datos y supuestos     empresa, producto, año inicial, crecimiento, IPC, tasas
  2 Inversiones           activos + capital de trabajo de 3 meses
  3 Demanda y ventas      cantidad, precio, contado/crédito, provisión
  4 Costos                pestañas: Materia prima · Mano de obra · CIF
  5 Gastos adm. y ventas
  6 Nómina                parámetros legales, empleados, novedades, liquidación
Resultados
  7 Pérdidas y ganancias
  8 Flujo de caja
  9 Evaluación            TIR, VPN, gráficas, observaciones del modelo
  10 Reporte              botón «Generar reporte» + vista previa
Catálogo              Productos, Recetas, Insumos, Recursos, Precios
Herramientas          Calculadora, Punto de equilibrio
```
- Autoguardado y recálculo al editar. Filas libres agregables.
- Vacíos o ventas en cero muestran «—», no `#DIV/0!`.
- «Traer desde receta / recursos / nómina» **copia** el dato y muestra el origen; cambiar el catálogo no altera un plan ya hecho.

### Nómina integrada
- Pantalla 6 contiene la **Nomina global** (lista de empleados con área: producción, administración o ventas) y el **cálculo del empleado con salario mínimo** de la hoja «Nómina (adjunto)» como referencia.
- Los totales por área llenan solos: mano de obra (capital de trabajo y costo de ventas) y nómina administrativa y de ventas (gastos). Siguen siendo editables por si se quiere sobrescribir, como hoy en el Excel.
- Valores legales (SMLV 1.423.500, auxilio 200.000, 240 horas, factores) son **parámetros por año**, precargados con los de la plantilla. Hay que verificarlos antes de usar la app con cifras reales.

### Reporte
Botón «Generar reporte» → descarga un **.xlsx** con el mismo aspecto de la plantilla:
- Mismas 3 hojas, nombres, orden de bloques y colores (azul entradas, verde cálculos, gris encabezados).
- Con **fórmulas vivas**, no solo valores: se puede abrir y modificar en Excel.
- Las 4 líneas de nombres de estudiantes quedan **en blanco**.
- Se genera en el back con `openpyxl`, construido desde cero con el mismo diseño. No se llena el archivo original porque sus referencias rotas de nómina producirían números distintos a los de la app.
- Prueba de control: recalcular el .xlsx generado y comparar TIR, VPN y totales contra el motor de la app.

Opcional posterior: PDF para impresión.

### Datos (migraciones Alembic)
| Tabla | Contenido |
|---|---|
| `planes` | Empresa, producto, año inicial, años, porcentajes globales |
| `plan_anios` | Por año: crecimiento, IPC, MO manual |
| `plan_demanda` | Cantidad por año, precio inicial |
| `plan_materias_primas` | Insumo, cantidad, costo por unidad de medida |
| `plan_inversiones` | Categoría, concepto, valor |
| `plan_capital_trabajo` | Mes 1-3: MO, gastos |
| `plan_lineas` + valores | CIF y gastos: consumo, costo, justificación; valor por año |
| `nomina_parametros`, `plan_empleados` | Tasas por año; empleado, área, novedades |

### Cálculo
Un módulo puro en Python (`app/domain/proyecciones/`), con `Decimal` y sin base de datos, es la **única** fuente de fórmulas. El front solo muestra lo que devuelve.

```
CRUD  /api/v1/planes/...            entradas
GET   /api/v1/planes/{id}/resultados    todas las tablas calculadas + observaciones
POST  /api/v1/planes/{id}/importar      receta | recursos
GET   /api/v1/planes/{id}/reporte       archivo .xlsx
```
TIR sin solución (flujos sin cambio de signo) devuelve «no aplica».

## 5. Sprints

| # | Entregable | Se termina cuando |
|---|---|---|
| 0 | Arreglos de la sección 3, pytest con BD aislada, Vitest | Build, lint y tests en verde |
| 1 | Motor de cálculo + tests | Coincide con el Excel recalculado de la plantilla, incluidos casos con pérdida y en cero |
| 2 | Tablas, migraciones y API | Crear un plan y obtener resultados por API |
| 3 | Pantallas 1-3 y tabla por años | Ingresos y cartera calculados en vivo |
| 4 | Costos y gastos (pantallas 4-5) | Margen, pagos y totales por año |
| 5 | Nómina (pantalla 6) conectada a MO y gastos | Costo por empleado verificado contra la plantilla; llena el plan por área |
| 6 | P&G, flujo, evaluación, gráficas y observaciones (7-9) | TIR y VPN iguales al Excel |
| 7 | Reporte .xlsx (pantalla 10) | Archivo abre con fórmulas y los mismos totales que la app |

Cada sprint deja front y back desplegables. Las migraciones agregan tablas y amplían precisión; no borran datos.

## 6. Decisiones pendientes

| # | Pregunta | Recomendación |
|---|---|---|
| 1 | Formato del reporte | Excel (.xlsx) como principal; PDF después |
| 2 | Salud patronal: la plantilla la calcula (8,5 %) en 3 empleados y la deja vacía en 4 | Aplicarla a todos con 8,5 %, como dice el encabezado, y que sea un parámetro |
| 3 | Intereses de cesantías: 1 % del devengado en una hoja y 1 % de la cesantía en la otra | Usar la de «Nomina global» (la que alimenta el plan) |
| 4 | ¿Un producto o varios? | Varios (con uno reproduce la plantilla) |
| 5 | Año inicial | Configurable; 2025 por defecto, 6 años |
| 6 | Autenticación antes de publicar datos reales | Al menos un acceso compartido |
