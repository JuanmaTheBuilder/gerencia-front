import { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  Package, 
  DollarSign, 
  History, 
  Calendar, 
  Target, 
  PieChart,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { api } from '../api/client';
import { useApi, useAsyncAction } from '../hooks/useApi';
import { useToast } from '../hooks/useToast';
import DataTable from '../components/DataTable';
import Toast from '../components/Toast';
import type { Producto, Receta, PuntoEquilibrio, PuntoEquilibrioProductoInput } from '../api/types';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

interface MixRow {
  producto_id: string;
  receta_id: string;
  peso: string;
}

export default function PuntoEquilibrio() {
  const { data: productos } = useApi(api.productos.list);
  const { data: recetas } = useApi(api.recetas.list);
  const { data: historial, loading: loadingHistorial, error, refetch } = useApi(api.puntoEquilibrio.list);
  const { loading: actionLoading, execute } = useAsyncAction();
  const { toast, showToast } = useToast();

  const [mes, setMes] = useState(() => new Date().getMonth() + 1);
  const [anio, setAnio] = useState(() => new Date().getFullYear());
  const [meta, setMeta] = useState('');
  const [mix, setMix] = useState<MixRow[]>([]);
  const [resultado, setResultado] = useState<PuntoEquilibrio | null>(null);



  const addMixRow = () => {
    setMix([...mix, { producto_id: '', receta_id: '', peso: '' }]);
  };

  const updateMixRow = (index: number, field: keyof MixRow, value: string) => {
    const updated = [...mix];
    updated[index][field] = value;
    setMix(updated);
  };

  const removeMixRow = (index: number) => {
    setMix(mix.filter((_, i) => i !== index));
  };

  const pesoTotal = useMemo(() => {
    return mix.reduce((sum, row) => sum + (parseFloat(row.peso) || 0), 0);
  }, [mix]);

  const handleCalcular = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pesoTotal < 0.9999 || pesoTotal > 1.0001) {
      showToast('La suma de los porcentajes debe ser 100%', 'error');
      return;
    }

    const productosInput: PuntoEquilibrioProductoInput[] = mix
      .filter((row) => row.producto_id && row.peso)
      .map((row) => ({
        producto_id: parseInt(row.producto_id),
        receta_id: row.receta_id ? parseInt(row.receta_id) : undefined,
        peso_venta: parseFloat(row.peso),
      }));

    const payload = {
      periodo_mes: mes,
      periodo_anio: anio,
      meta_unidades: parseFloat(meta) || 0,
      tasa_iva: 19,
      productos: productosInput,
    };

    try {
      const res = await execute(() => api.puntoEquilibrio.calcular(payload));
      setResultado(res);
      showToast('Punto de equilibrio calculado', 'success');
      refetch();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error', 'error');
    }
  };

  const recetasMap = useMemo(() => {
    return new Map((recetas || []).map((r: Receta) => [r.id, r]));
  }, [recetas]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header de la Página */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100/80">
              <TrendingUp className="w-6 h-6" />
            </div>
            Punto de equilibrio
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Calcula cuántas unidades necesitas vender mensualmente para cubrir tus costos fijos y variables.
          </p>
        </div>
      </div>

      {/* Rejilla de Formulario y Resultados */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Columna Izquierda: Configuración del Cálculo */}
        <div className="xl:col-span-6 bg-white rounded-2xl shadow-xs border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-6 pb-3 border-b border-gray-100">
            <PieChart className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-semibold text-gray-900">Configuración del cálculo</h2>
          </div>

          <form onSubmit={handleCalcular} className="space-y-5">
            {/* Período: Mes y Año */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  Mes
                </label>
                <select
                  value={mes}
                  onChange={(e) => setMes(parseInt(e.target.value))}
                  className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                >
                  {MESES.map((m, i) => (
                    <option key={i + 1} value={i + 1}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  Año
                </label>
                <input
                  type="number"
                  value={anio}
                  onChange={(e) => setAnio(parseInt(e.target.value) || new Date().getFullYear())}
                  className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none font-medium"
                />
              </div>
            </div>

            {/* Meta de ventas */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-gray-400" />
                Meta de ventas mensual (unidades totales)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={meta}
                onChange={(e) => setMeta(e.target.value)}
                className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none font-medium"
                placeholder="Ej: 5000"
                required
              />
            </div>

            {/* Mezcla de Ventas */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Mezcla de ventas (%)
                </label>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                  pesoTotal === 1 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}>
                  Total: {(pesoTotal * 100).toFixed(0)}%
                </span>
              </div>

              <div className="space-y-2.5">
                {mix.map((row, index) => (
                  <div key={index} className="flex items-center gap-2 bg-gray-50/50 p-2 rounded-xl border border-gray-100">
                    <select
                      value={row.producto_id}
                      onChange={(e) => updateMixRow(index, 'producto_id', e.target.value)}
                      className="flex-1 min-w-0 bg-white border border-gray-200 rounded-lg px-2.5 py-2 text-xs text-gray-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                      required
                    >
                      <option value="">Producto...</option>
                      {productos?.map((p: Producto) => (
                        <option key={p.id} value={p.id}>{p.nombre}</option>
                      ))}
                    </select>

                    <select
                      value={row.receta_id}
                      onChange={(e) => updateMixRow(index, 'receta_id', e.target.value)}
                      className="flex-1 min-w-0 bg-white border border-gray-200 rounded-lg px-2.5 py-2 text-xs text-gray-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                    >
                      <option value="">Presentación...</option>
                      {recetas?.map((r: Receta) => (
                        <option key={r.id} value={r.id}>{r.nombre} (v{r.version})</option>
                      ))}
                    </select>

                    <div className="w-20 shrink-0 relative">
                      <input
                        type="number"
                        min="0"
                        max="1"
                        step="0.01"
                        value={row.peso}
                        onChange={(e) => updateMixRow(index, 'peso', e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-2 text-xs text-gray-900 font-mono text-center focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                        placeholder="0.60"
                        required
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => removeMixRow(index)}
                      className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
                      title="Quitar producto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addMixRow}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50/60 hover:bg-emerald-50 border border-emerald-100/80 px-3 py-2 rounded-xl transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                Agregar producto a la mezcla
              </button>
            </div>

            {/* Botón Acción Principal */}
            <button
              type="submit"
              disabled={actionLoading || pesoTotal !== 1}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm shadow-md shadow-emerald-600/15 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Calculando...</span>
                </>
              ) : (
                'Calcular punto de equilibrio'
              )}
            </button>
          </form>
        </div>

        {/* Columna Derecha: Resultado del Cálculo */}
        <div className="xl:col-span-6">
          {resultado ? (
            <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-6 space-y-6">
              {/* Banner Estado Diagnóstico */}
              <div className={`p-4 rounded-2xl border ${
                resultado.estado === 'BIEN' 
                  ? 'bg-emerald-50/80 border-emerald-200/80' 
                  : 'bg-rose-50/80 border-rose-200/80'
              }`}>
                <div className="flex items-start gap-3">
                  {resultado.estado === 'BIEN' ? (
                    <div className="p-1.5 bg-emerald-100 rounded-xl text-emerald-700 shrink-0">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  ) : (
                    <div className="p-1.5 bg-rose-100 rounded-xl text-rose-700 shrink-0">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                  )}
                  <div>
                    <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-md mb-1 uppercase tracking-wide ${
                      resultado.estado === 'BIEN' 
                        ? 'bg-emerald-200/60 text-emerald-900' 
                        : 'bg-rose-200/60 text-rose-900'
                    }`}>
                      {resultado.estado === 'BIEN' ? 'Proyecto Viable' : 'Atención Requerida'}
                    </span>
                    <p className="text-sm font-medium text-gray-800 leading-relaxed">
                      {resultado.diagnostico}
                    </p>
                  </div>
                </div>
              </div>

              {/* Grid KPI de Equilibrio */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-emerald-50/60 border border-emerald-100/80 rounded-2xl p-4">
                  <p className="text-xs font-medium text-emerald-800">Unidades de equilibrio</p>
                  <p className="text-2xl font-bold text-emerald-950 mt-1">
                    {parseFloat(resultado.unidades_equilibrio).toFixed(0)} <span className="text-xs font-normal text-emerald-700">uds</span>
                  </p>
                </div>

                <div className="bg-gray-50/80 border border-gray-100 rounded-2xl p-4">
                  <p className="text-xs font-medium text-gray-600">Ventas en equilibrio</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    ${parseFloat(resultado.ventas_equilibrio_pesos).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                  </p>
                </div>

                <div className="bg-gray-50/80 border border-gray-100 rounded-2xl p-4">
                  <p className="text-xs font-medium text-gray-600">Costos fijos mensuales</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">
                    ${parseFloat(resultado.costos_fijos_mensuales).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                  </p>
                </div>

                <div className="bg-gray-50/80 border border-gray-100 rounded-2xl p-4">
                  <p className="text-xs font-medium text-gray-600">Utilidad estimada</p>
                  <p className={`text-xl font-bold mt-1 ${
                    parseFloat(resultado.utilidad_estimada) >= 0 ? 'text-emerald-700' : 'text-rose-700'
                  }`}>
                    ${parseFloat(resultado.utilidad_estimada).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              {/* Desagregación por Producto */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-emerald-600" />
                  Desagregación por producto
                </h3>
                
                <div className="border border-gray-100 rounded-2xl overflow-hidden">
                  <DataTable
                    columns={[
                      {
                        key: 'producto',
                        header: 'Producto',
                        render: (item) => (
                          <span className="font-medium text-gray-900">
                            {productos?.find((p: Producto) => p.id === item.producto_id)?.nombre || `ID ${item.producto_id}`}
                          </span>
                        ),
                      },
                      {
                        key: 'presentacion',
                        header: 'Presentación',
                        render: (item) => (
                          <span className="text-xs text-gray-500">
                            {item.receta_id ? recetasMap.get(item.receta_id)?.nombre || `ID ${item.receta_id}` : '-'}
                          </span>
                        ),
                      },
                      {
                        key: 'peso',
                        header: '% Mezcla',
                        render: (item) => (
                          <span className="font-mono text-xs">
                            {(parseFloat(item.peso_venta) * 100).toFixed(0)}%
                          </span>
                        ),
                      },
                      {
                        key: 'precio_sin_iva',
                        header: 'Precio s/IVA',
                        render: (item) => (
                          <span className="font-mono text-xs">
                            ${parseFloat(item.precio_sin_iva).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                          </span>
                        ),
                      },
                      {
                        key: 'costo_variable',
                        header: 'Costo Var.',
                        render: (item) => (
                          <span className="font-mono text-xs text-gray-600">
                            ${parseFloat(item.costo_variable_unitario).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                          </span>
                        ),
                      },
                      {
                        key: 'margen',
                        header: 'Margen',
                        render: (item) => (
                          <span className="font-mono text-xs text-emerald-700 font-medium">
                            ${parseFloat(item.margen_contribucion_unitario).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                          </span>
                        ),
                      },
                      {
                        key: 'unidades',
                        header: 'Unidades',
                        render: (item) => (
                          <span className="font-mono text-xs font-bold text-gray-900">
                            {parseFloat(item.unidades_equilibrio).toFixed(0)}
                          </span>
                        ),
                      },
                    ]}
                    data={resultado.detalles}
                    keyExtractor={(item) => item.id}
                  />
                </div>
              </div>

              {/* Inversión Inicial Badge */}
              <div className="p-3.5 bg-sky-50/80 border border-sky-100 rounded-xl text-sky-900 text-xs font-medium flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-sky-600" />
                  Inversión inicial total
                </span>
                <span className="font-mono font-bold text-sm">
                  ${parseFloat(resultado.inversion_inicial_total).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-12 text-center h-full flex flex-col items-center justify-center min-h-[350px]">
              <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mb-3 text-gray-400">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">Sin cálculo generado</h3>
              <p className="text-sm text-gray-500 max-w-xs">
                Configura los parámetros a la izquierda y presiona calcular para evaluar el equilibrio financiero.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Sección Inferior: Historial de Cálculos */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-6 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
          <History className="w-5 h-5 text-emerald-600" />
          <h2 className="text-base font-semibold text-gray-900">Historial de cálculos</h2>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="rounded-xl border border-gray-100 overflow-hidden">
          <DataTable
            columns={[
              { 
                key: 'periodo', 
                header: 'Período', 
                render: (item: PuntoEquilibrio) => (
                  <span className="font-medium text-gray-900">
                    {MESES[item.periodo_mes - 1]} {item.periodo_anio}
                  </span>
                ) 
              },
              { 
                key: 'meta', 
                header: 'Meta unidades', 
                render: (item: PuntoEquilibrio) => (
                  <span className="font-mono text-xs">{parseFloat(item.meta_unidades).toFixed(0)}</span>
                ) 
              },
              { 
                key: 'equilibrio', 
                header: 'Equilibrio', 
                render: (item: PuntoEquilibrio) => (
                  <span className="font-mono text-xs font-semibold">{parseFloat(item.unidades_equilibrio).toFixed(0)}</span>
                ) 
              },
              { 
                key: 'utilidad', 
                header: 'Utilidad estimada', 
                render: (item: PuntoEquilibrio) => (
                  <span className="font-mono text-xs font-bold text-gray-900">
                    ${parseFloat(item.utilidad_estimada).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                  </span>
                ) 
              },
              { 
                key: 'estado', 
                header: 'Estado', 
                render: (item: PuntoEquilibrio) => (
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    item.estado === 'BIEN' 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}>
                    {item.estado === 'BIEN' ? 'BIEN' : 'MAL'}
                  </span>
                ) 
              },
            ]}
            data={historial || []}
            loading={loadingHistorial}
            keyExtractor={(item) => item.id}
            emptyMessage="No hay cálculos guardados"
          />
        </div>
      </div>

      {/* Notificaciones Toast */}
      {toast.visible && (
        <div className="fixed bottom-4 right-4 z-50">
          <Toast message={toast.message} type={toast.type} onClose={() => {}} />
        </div>
      )}
    </div>
  );
}
