import { useState, useEffect, useMemo } from 'react';
import { 
  Calculator, 
  Percent, 
  DollarSign, 
  Users, 
  Wrench, 
  Package, 
  AlertTriangle, 
  CheckCircle2, 
  AlertCircle,
  Info,
  TrendingUp,
  Layers
} from 'lucide-react';
import { api } from '../api/client';
import { useApi } from '../hooks/useApi';
import DataTable from '../components/DataTable';
import type { Receta, RecetaDetail, Insumo, RecetaCostosEstandar } from '../api/types';

const MARGEN_DEFAULT = 30;
const IVA_DEFAULT = 21;
const COSTOS_KEY = (recetaId: number) => `receta_costos_${recetaId}`;

function loadCostos(recetaId: number): RecetaCostosEstandar {
  try {
    const raw = localStorage.getItem(COSTOS_KEY(recetaId));
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return { personal: [], recursos: [] };
}

export default function Calculadora() {
  const { data: recetas, loading: loadingRecetas, error: errorRecetas } = useApi(api.recetas.list);
  const { data: insumos, loading: loadingInsumos, error: errorInsumos } = useApi(api.insumos.list);
  const [selectedRecetaId, setSelectedRecetaId] = useState('');
  const [recetaDetail, setRecetaDetail] = useState<RecetaDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [cantidad, setCantidad] = useState('1');
  const [margenUtilidad, setMargenUtilidad] = useState(() => {
    const saved = localStorage.getItem('calculadora_margen');
    return saved ? saved : MARGEN_DEFAULT.toString();
  });
  const [iva, setIva] = useState(() => {
    const saved = localStorage.getItem('calculadora_iva');
    return saved ? saved : IVA_DEFAULT.toString();
  });

  useEffect(() => {
    localStorage.setItem('calculadora_margen', margenUtilidad);
  }, [margenUtilidad]);

  useEffect(() => {
    localStorage.setItem('calculadora_iva', iva);
  }, [iva]);

  useEffect(() => {
    if (selectedRecetaId) {
      setLoadingDetail(true);
      api.recetas.detail(parseInt(selectedRecetaId))
        .then(setRecetaDetail)
        .catch(() => setRecetaDetail(null))
        .finally(() => setLoadingDetail(false));
    } else {
      setRecetaDetail(null);
    }
  }, [selectedRecetaId]);

  const cantidadNum = parseFloat(cantidad) || 0;
  const margenNum = parseFloat(margenUtilidad) || 0;
  const ivaNum = parseFloat(iva) || 0;

  const costosEstandar = useMemo(() => {
    if (!selectedRecetaId) return { personal: [], recursos: [] };
    return loadCostos(parseInt(selectedRecetaId));
  }, [selectedRecetaId]);

  const rows = useMemo(() => {
    if (!recetaDetail || !insumos) return [];
    return recetaDetail.recetas_insumos.map((ri) => {
      const insumo = insumos.find((i: Insumo) => i.id === ri.insumo_id);
      const cantidadPorUnidad = parseFloat(ri.cantidad);
      const necesitas = cantidadPorUnidad * cantidadNum;
      const stock = parseFloat(insumo?.stock_actual || '0');
      const falta = Math.max(0, necesitas - stock);
      const precio = parseFloat(insumo?.precio_compra || '0');
      const costo = necesitas * precio;
      return {
        id: ri.id,
        insumo_id: ri.insumo_id,
        nombre: insumo?.nombre || 'Insumo no encontrado',
        unidad: insumo?.unidad_medida?.abreviatura || '',
        cantidadPorUnidad,
        necesitas,
        stock,
        falta,
        precio,
        costo,
      };
    });
  }, [recetaDetail, insumos, cantidadNum]);

  const costoMateriales = useMemo(() => rows.reduce((sum, r) => sum + r.costo, 0), [rows]);
  const costoPersonal = useMemo(
    () => costosEstandar.personal.reduce((sum, c) => sum + c.horas * c.costo_hora * cantidadNum, 0),
    [costosEstandar.personal, cantidadNum]
  );
  const costoRecursos = useMemo(
    () => costosEstandar.recursos.reduce((sum, c) => sum + c.cantidad * c.costo_unitario * cantidadNum, 0),
    [costosEstandar.recursos, cantidadNum]
  );

  const costoTotal = costoMateriales + costoPersonal + costoRecursos;
  const costoUnitario = cantidadNum > 0 ? costoTotal / cantidadNum : 0;

  const maxProducible = useMemo(() => {
    if (!recetaDetail || !insumos || recetaDetail.recetas_insumos.length === 0) return 0;
    const posibles = recetaDetail.recetas_insumos.map((ri) => {
      const insumo = insumos.find((i: Insumo) => i.id === ri.insumo_id);
      const stock = parseFloat(insumo?.stock_actual || '0');
      const cantidadPorUnidad = parseFloat(ri.cantidad);
      if (cantidadPorUnidad <= 0) return Infinity;
      return Math.floor(stock / cantidadPorUnidad);
    });
    return Math.min(...posibles);
  }, [recetaDetail, insumos]);

  const margenDecimal = margenNum / 100;
  const ivaDecimal = ivaNum / 100;
  const precioVentaSinIva = margenDecimal < 1 && costoUnitario > 0
    ? costoUnitario / (1 - margenDecimal)
    : 0;
  const precioVentaConIva = precioVentaSinIva * (1 + ivaDecimal);
  const gananciaUnitaria = precioVentaSinIva - costoUnitario;

  const hayFaltante = rows.some((r) => r.falta > 0);
  const faltanCostosExtras = selectedRecetaId && costosEstandar.personal.length === 0 && costosEstandar.recursos.length === 0;

  const loading = loadingRecetas || loadingInsumos || loadingDetail;
  const error = errorRecetas || errorInsumos;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header de la Página */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100/80">
              <Calculator className="w-6 h-6" />
            </div>
            Calculadora de producción
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Selecciona una receta y define la cantidad para proyectar insumos, stock y costos de producción.
          </p>
        </div>
      </div>

      {/* Banner de Error Global */}
      {error && (
        <div className="p-4 bg-red-50/80 border border-red-200/80 rounded-2xl flex items-center gap-3 text-red-800 text-sm shadow-xs">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <div>
            <span className="font-semibold">Error al cargar datos:</span> {error}
          </div>
        </div>
      )}

      {/* Tarjeta de Formulario Principal */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Selector de Receta */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
              Receta / Versión
            </label>
            <select
              value={selectedRecetaId}
              onChange={(e) => setSelectedRecetaId(e.target.value)}
              className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
            >
              <option value="">Seleccionar receta...</option>
              {recetas?.map((r: Receta) => (
                <option key={r.id} value={r.id}>
                  {r.nombre} (v{r.version})
                </option>
              ))}
            </select>
          </div>

          {/* Cantidad */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
              Cantidad a producir
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none font-medium"
            />
          </div>

          {/* Margen de Utilidad */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
              Margen de utilidad (%)
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="99.99"
                step="0.01"
                value={margenUtilidad}
                onChange={(e) => setMargenUtilidad(e.target.value)}
                className="w-full bg-gray-50/50 border border-gray-200 rounded-xl pl-3.5 pr-9 py-2.5 text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none font-medium"
              />
              <Percent className="w-4 h-4 text-gray-400 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* IVA */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
              IVA / Impuesto (%)
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="0.01"
                value={iva}
                onChange={(e) => setIva(e.target.value)}
                className="w-full bg-gray-50/50 border border-gray-200 rounded-xl pl-3.5 pr-9 py-2.5 text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none font-medium"
              />
              <Percent className="w-4 h-4 text-gray-400 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Paneles de Resultados (si se selecciona receta) */}
        {selectedRecetaId && recetaDetail && (
          <div className="space-y-6 pt-2">
            {/* KPI Cards Principales */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Costo Total */}
              <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-4">
                <p className="text-xs font-medium text-emerald-800">Costo total estimado</p>
                <p className="text-2xl font-bold text-emerald-950 mt-1">
                  ${costoTotal.toFixed(2)}
                </p>
              </div>

              {/* Costo por Unidad */}
              <div className="bg-gray-50/80 border border-gray-100 rounded-2xl p-4">
                <p className="text-xs font-medium text-gray-600">Costo por unidad</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  ${costoUnitario.toFixed(2)}
                </p>
              </div>

              {/* Máximo Producible */}
              <div className={`border rounded-2xl p-4 ${
                hayFaltante 
                  ? 'bg-rose-50/60 border-rose-100' 
                  : 'bg-emerald-50/60 border-emerald-100'
              }`}>
                <p className="text-xs font-medium text-gray-600">Máximo con stock actual</p>
                <p className={`text-2xl font-bold mt-1 ${
                  hayFaltante ? 'text-rose-700' : 'text-emerald-700'
                }`}>
                  {maxProducible === Infinity ? '—' : maxProducible} <span className="text-sm font-normal text-gray-500">uds</span>
                </p>
              </div>

              {/* Precio sugerido sin IVA */}
              <div className="bg-emerald-600 text-white rounded-2xl p-4 shadow-md shadow-emerald-600/10 flex flex-col justify-between">
                <p className="text-xs font-medium text-emerald-100 flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5" />
                  Sugerido (sin IVA)
                </p>
                <p className="text-2xl font-bold mt-1">
                  ${precioVentaSinIva.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Desglose de Costos (Materiales, Personal, Recursos) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-emerald-600" />
                    Materiales
                  </p>
                </div>
                <p className="text-xl font-bold text-gray-900">${costoMateriales.toFixed(2)}</p>
                <p className="text-xs text-gray-400 mt-1 font-mono">
                  ${cantidadNum > 0 ? (costoMateriales / cantidadNum).toFixed(2) : '0.00'} / ud
                </p>
              </div>

              <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-emerald-600" />
                    Personal
                  </p>
                </div>
                <p className="text-xl font-bold text-gray-900">${costoPersonal.toFixed(2)}</p>
                <p className="text-xs text-gray-400 mt-1 font-mono">
                  ${cantidadNum > 0 ? (costoPersonal / cantidadNum).toFixed(2) : '0.00'} / ud
                </p>
              </div>

              <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                    <Wrench className="w-4 h-4 text-emerald-600" />
                    Recursos
                  </p>
                </div>
                <p className="text-xl font-bold text-gray-900">${costoRecursos.toFixed(2)}</p>
                <p className="text-xs text-gray-400 mt-1 font-mono">
                  ${cantidadNum > 0 ? (costoRecursos / cantidadNum).toFixed(2) : '0.00'} / ud
                </p>
              </div>
            </div>

            {/* Banner Informativo si faltan costos extras */}
            {faltanCostosExtras && (
              <div className="p-4 bg-sky-50/80 border border-sky-100 rounded-2xl flex items-start gap-3 text-sky-900 text-sm">
                <Info className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
                <p>
                  Aún no hay costos de personal o recursos configurados. Puedes agregarlos en la sección <span className="font-semibold">"Recetas"</span>. Mientras tanto, el cálculo solo considera materiales.
                </p>
              </div>
            )}

            {/* Resumen del Precio Final / Margen */}
            <div className="bg-gradient-to-br from-emerald-900 to-emerald-950 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <TrendingUp className="w-48 h-48 text-white" />
              </div>
              <h3 className="text-base font-semibold text-emerald-100 mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                Precio de venta sugerido al público
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                <div>
                  <p className="text-xs text-emerald-300 font-medium mb-1">Costo unitario</p>
                  <p className="text-2xl font-bold text-white">${costoUnitario.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-emerald-300 font-medium mb-1">Ganancia por unidad</p>
                  <p className="text-2xl font-bold text-white">${gananciaUnitaria.toFixed(2)}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 bg-emerald-800/60 rounded text-[11px] text-emerald-200">
                    Margen: {margenNum}%
                  </span>
                </div>
                <div>
                  <p className="text-xs text-emerald-300 font-medium mb-1">Precio final con IVA ({ivaNum}%)</p>
                  <p className="text-3xl font-extrabold text-emerald-400">${precioVentaConIva.toFixed(2)}</p>
                </div>
              </div>

              <p className="text-[11px] text-emerald-400/80 mt-4 font-mono relative z-10">
                Fórmula: costo unitario ÷ (1 − margen) × (1 + IVA)
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Sección Inferior: Estados o Tabla de Datos */}
      {loading ? (
        <div className="p-12 text-center text-gray-500 bg-white rounded-2xl border border-gray-100 shadow-xs">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-600 border-t-transparent mx-auto mb-3" />
          <p className="text-sm font-medium">Calculando requerimientos...</p>
        </div>
      ) : !selectedRecetaId ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-gray-100 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-3 text-gray-400">
            <Package className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">Sin receta seleccionada</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            Selecciona una receta y la cantidad a producir arriba para calcular los insumos y verificar el stock.
          </p>
        </div>
      ) : !recetaDetail || recetaDetail.recetas_insumos.length === 0 ? (
        <div className="p-8 text-center bg-amber-50/80 border border-amber-200/70 rounded-2xl text-amber-900">
          <AlertTriangle className="w-8 h-8 text-amber-600 mx-auto mb-2" />
          <p className="font-semibold">Esta receta no tiene insumos configurados.</p>
          <p className="text-sm text-amber-700 mt-1">Por favor agrega insumos desde la sección de "Recetas".</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Alertas de Stock */}
          {hayFaltante ? (
            <div className="p-4 bg-rose-50/80 border border-rose-200/80 rounded-2xl flex items-start gap-3 shadow-xs">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-rose-900 text-sm">Stock insuficiente</p>
                <p className="text-xs text-rose-700 mt-0.5">
                  No tienes suficiente stock para producir <span className="font-semibold">{cantidadNum} unidades</span>. Revisa los insumos marcados en rojo en la tabla.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl flex items-center gap-3 shadow-xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <p className="text-sm text-emerald-900 font-medium">
                ¡Stock disponible! Con el inventario actual puedes producir sin problemas <span className="font-bold">{cantidadNum} unidades</span>.
              </p>
            </div>
          )}

          {/* Tabla de Insumos */}
          <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
            <DataTable
              columns={[
                { key: 'nombre', header: 'Insumo' },
                { key: 'unidad', header: 'Unidad' },
                {
                  key: 'cantidadPorUnidad',
                  header: 'Por unidad',
                  render: (item) => <span className="font-mono text-xs">{item.cantidadPorUnidad.toFixed(4)}</span>,
                },
                {
                  key: 'necesitas',
                  header: 'Necesitas',
                  render: (item) => <span className="font-mono text-xs font-semibold">{item.necesitas.toFixed(4)}</span>,
                },
                {
                  key: 'stock',
                  header: 'Tienes',
                  render: (item) => <span className="font-mono text-xs text-gray-600">{item.stock.toFixed(4)}</span>,
                },
                {
                  key: 'falta',
                  header: 'Te falta',
                  render: (item) => (
                    <span className={item.falta > 0 ? 'text-rose-600 font-semibold font-mono text-xs' : 'text-emerald-600 font-mono text-xs'}>
                      {item.falta > 0 ? item.falta.toFixed(4) : '—'}
                    </span>
                  ),
                },
                {
                  key: 'precio',
                  header: 'Precio unitario',
                  render: (item) => <span className="font-mono text-xs">${item.precio.toFixed(2)}</span>,
                },
                {
                  key: 'costo',
                  header: 'Costo estimado',
                  render: (item) => <span className="font-mono text-xs font-bold text-gray-900">${item.costo.toFixed(2)}</span>,
                },
              ]}
              data={rows}
              keyExtractor={(item) => item.id}
            />
          </div>
        </div>
      )}
    </div>
  );
}
