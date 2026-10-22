import { useState, useMemo } from 'react';
import { TrendingUp, AlertTriangle, CheckCircle, DollarSign, Package } from 'lucide-react';
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
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
        <TrendingUp className="w-7 h-7 text-primary-600" />
        Punto de equilibrio
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        Calculá cuántas unidades necesitás vender mensualmente para cubrir todos los costos.
      </p>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Configuración del cálculo</h2>
          <form onSubmit={handleCalcular}>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mes</label>
                <select
                  value={mes}
                  onChange={(e) => setMes(parseInt(e.target.value))}
                  className="w-full"
                >
                  {MESES.map((m, i) => (
                    <option key={i + 1} value={i + 1}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Año</label>
                <input
                  type="number"
                  value={anio}
                  onChange={(e) => setAnio(parseInt(e.target.value) || new Date().getFullYear())}
                  className="w-full"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Meta de ventas mensual (unidades totales)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={meta}
                onChange={(e) => setMeta(e.target.value)}
                className="w-full"
                placeholder="Ej: 5000"
                required
              />
            </div>

            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">Mezcla de ventas (%)</label>
                <span className={`text-sm font-medium ${pesoTotal === 1 ? 'text-green-600' : 'text-red-600'}`}>
                  Total: {(pesoTotal * 100).toFixed(0)}%
                </span>
              </div>
              {mix.map((row, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 mb-2 items-center">
                  <select
                    value={row.producto_id}
                    onChange={(e) => updateMixRow(index, 'producto_id', e.target.value)}
                    className="col-span-4 text-sm"
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
                    className="col-span-4 text-sm"
                  >
                    <option value="">Presentación...</option>
                    {recetas?.map((r: Receta) => (
                      <option key={r.id} value={r.id}>{r.nombre} (v{r.version})</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.01"
                    value={row.peso}
                    onChange={(e) => updateMixRow(index, 'peso', e.target.value)}
                    className="col-span-2 text-sm"
                    placeholder="0.60"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => removeMixRow(index)}
                    className="col-span-2 text-sm text-red-600 hover:bg-red-50 rounded py-2"
                  >
                    Quitar
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addMixRow}
                className="mt-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                + Agregar producto a la mezcla
              </button>
            </div>

            <button
              type="submit"
              disabled={actionLoading || pesoTotal !== 1}
              className="w-full py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {actionLoading ? 'Calculando...' : 'Calcular punto de equilibrio'}
            </button>
          </form>
        </div>

        {resultado && (
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <div className={`p-4 rounded-lg mb-4 ${resultado.estado === 'BIEN' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex items-start gap-3">
                {resultado.estado === 'BIEN' ? (
                  <CheckCircle className="w-6 h-6 text-green-600 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-red-600 mt-0.5" />
                )}
                <div>
                  <p className={`font-semibold ${resultado.estado === 'BIEN' ? 'text-green-800' : 'text-red-800'}`}>
                    {resultado.estado === 'BIEN' ? 'Estás bien' : 'Estás mal'}
                  </p>
                  <p className="text-sm mt-1 text-gray-700">{resultado.diagnostico}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-primary-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Unidades de equilibrio</p>
                <p className="text-2xl font-bold text-primary-700">{parseFloat(resultado.unidades_equilibrio).toFixed(0)}</p>
              </div>
              <div className="bg-emerald-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">En pesos</p>
                <p className="text-2xl font-bold text-emerald-700">${parseFloat(resultado.ventas_equilibrio_pesos).toLocaleString('es-CO', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Costos fijos mensuales</p>
                <p className="text-xl font-bold text-gray-900">${parseFloat(resultado.costos_fijos_mensuales).toLocaleString('es-CO', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Utilidad estimada</p>
                <p className={`text-xl font-bold ${parseFloat(resultado.utilidad_estimada) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  ${parseFloat(resultado.utilidad_estimada).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Package className="w-4 h-4" />
              Desagregación por producto
            </h3>
            <DataTable
              columns={[
                {
                  key: 'producto',
                  header: 'Producto',
                  render: (item) => productos?.find((p: Producto) => p.id === item.producto_id)?.nombre || `ID ${item.producto_id}`,
                },
                {
                  key: 'presentacion',
                  header: 'Presentación',
                  render: (item) => item.receta_id ? recetasMap.get(item.receta_id)?.nombre || `ID ${item.receta_id}` : '-',
                },
                {
                  key: 'peso',
                  header: '% Mezcla',
                  render: (item) => `${(parseFloat(item.peso_venta) * 100).toFixed(0)}%`,
                },
                {
                  key: 'precio_sin_iva',
                  header: 'Precio s/IVA',
                  render: (item) => `$${parseFloat(item.precio_sin_iva).toLocaleString('es-CO', { minimumFractionDigits: 2 })}`,
                },
                {
                  key: 'costo_variable',
                  header: 'Costo variable',
                  render: (item) => `$${parseFloat(item.costo_variable_unitario).toLocaleString('es-CO', { minimumFractionDigits: 2 })}`,
                },
                {
                  key: 'margen',
                  header: 'Margen',
                  render: (item) => `$${parseFloat(item.margen_contribucion_unitario).toLocaleString('es-CO', { minimumFractionDigits: 2 })}`,
                },
                {
                  key: 'unidades',
                  header: 'Unidades',
                  render: (item) => parseFloat(item.unidades_equilibrio).toFixed(0),
                },
              ]}
              data={resultado.detalles}
              keyExtractor={(item) => item.id}
            />

            <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-800 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Inversión inicial total: ${parseFloat(resultado.inversion_inicial_total).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 bg-white rounded-lg shadow border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Historial de cálculos</h2>
        {error && <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>}
        <DataTable
          columns={[
            { key: 'periodo', header: 'Período', render: (item: PuntoEquilibrio) => `${MESES[item.periodo_mes - 1]} ${item.periodo_anio}` },
            { key: 'meta', header: 'Meta unidades', render: (item: PuntoEquilibrio) => parseFloat(item.meta_unidades).toFixed(0) },
            { key: 'equilibrio', header: 'Equilibrio', render: (item: PuntoEquilibrio) => parseFloat(item.unidades_equilibrio).toFixed(0) },
            { key: 'utilidad', header: 'Utilidad estimada', render: (item: PuntoEquilibrio) => `$${parseFloat(item.utilidad_estimada).toLocaleString('es-CO', { minimumFractionDigits: 2 })}` },
            { key: 'estado', header: 'Estado', render: (item: PuntoEquilibrio) => (
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.estado === 'BIEN' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {item.estado}
              </span>
            )},
          ]}
          data={historial || []}
          loading={loadingHistorial}
          keyExtractor={(item) => item.id}
          emptyMessage="No hay cálculos guardados"
        />
      </div>

      {toast.visible && (
        <div className="fixed bottom-4 right-4 z-50">
          <Toast message={toast.message} type={toast.type} onClose={() => {}} />
        </div>
      )}
    </div>
  );
}
