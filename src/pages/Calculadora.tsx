import { useState, useEffect, useMemo } from 'react';
import { Calculator, AlertTriangle, CheckCircle, Package, DollarSign, Percent } from 'lucide-react';
import { api } from '../api/client';
import { useApi } from '../hooks/useApi';
import DataTable from '../components/DataTable';
import type { Receta, RecetaDetail, Insumo } from '../api/types';

const MARGEN_DEFAULT = 30;
const IVA_DEFAULT = 21;

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

  const costoTotal = useMemo(() => rows.reduce((sum, r) => sum + r.costo, 0), [rows]);
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

  const loading = loadingRecetas || loadingInsumos || loadingDetail;
  const error = errorRecetas || errorInsumos;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <Calculator className="w-7 h-7 text-primary-600" />
        Calculadora de producción
      </h1>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg">
          Error cargando datos: {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Versión del producto
            </label>
            <select
              value={selectedRecetaId}
              onChange={(e) => setSelectedRecetaId(e.target.value)}
              className="w-full"
            >
              <option value="">Seleccionar versión...</option>
              {recetas?.map((r: Receta) => (
                <option key={r.id} value={r.id}>{r.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cantidad a producir
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
                className="w-full pr-8"
              />
              <Percent className="w-4 h-4 text-gray-400 absolute right-3 top-3" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              IVA / Impuesto (%)
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="0.01"
                value={iva}
                onChange={(e) => setIva(e.target.value)}
                className="w-full pr-8"
              />
              <Percent className="w-4 h-4 text-gray-400 absolute right-3 top-3" />
            </div>
          </div>
        </div>

        {selectedRecetaId && recetaDetail && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-primary-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Costo total</p>
              <p className="text-2xl font-bold text-primary-700">${costoTotal.toFixed(2)}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Costo por unidad</p>
              <p className="text-2xl font-bold text-gray-900">${costoUnitario.toFixed(2)}</p>
            </div>
            <div className={`rounded-lg p-4 ${hayFaltante ? 'bg-red-50' : 'bg-green-50'}`}>
              <p className="text-sm text-gray-600">Máximo con stock actual</p>
              <p className={`text-2xl font-bold ${hayFaltante ? 'text-red-700' : 'text-green-700'}`}>
                {maxProducible === Infinity ? '—' : maxProducible} uds
              </p>
            </div>
            <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
              <p className="text-sm text-emerald-700 flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                Precio sugerido (sin IVA)
              </p>
              <p className="text-2xl font-bold text-emerald-800">${precioVentaSinIva.toFixed(2)}</p>
            </div>
          </div>
        )}

        {selectedRecetaId && recetaDetail && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold text-emerald-900 mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Precio de venta sugerido
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-emerald-700 mb-1">Costo unitario</p>
                <p className="text-xl font-semibold text-emerald-900">${costoUnitario.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-emerald-700 mb-1">Ganancia por unidad</p>
                <p className="text-xl font-semibold text-emerald-900">${gananciaUnitaria.toFixed(2)}</p>
                <p className="text-xs text-emerald-600">Margen del {margenNum}%</p>
              </div>
              <div>
                <p className="text-sm text-emerald-700 mb-1">Precio final con IVA ({ivaNum}%)</p>
                <p className="text-3xl font-bold text-emerald-800">${precioVentaConIva.toFixed(2)}</p>
              </div>
            </div>
            <p className="text-xs text-emerald-600 mt-3">
              Fórmula: costo unitario ÷ (1 − margen) × (1 + IVA)
            </p>
          </div>
        )}
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-500 bg-white rounded-lg shadow">Cargando...</div>
      ) : !selectedRecetaId ? (
        <div className="p-8 text-center bg-white rounded-lg shadow border border-gray-200">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">
            Seleccioná una versión y cantidad para calcular requerimientos.
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Si no hay versiones, crealas en la pestaña "Recetas".
          </p>
        </div>
      ) : !recetaDetail || recetaDetail.recetas_insumos.length === 0 ? (
        <div className="p-8 text-center bg-yellow-50 text-yellow-800 rounded-lg">
          Esta versión no tiene insumos configurados. Agregalos en "Recetas".
        </div>
      ) : (
        <>
          {hayFaltante && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-medium text-red-800">Stock insuficiente</p>
                <p className="text-sm text-red-700">
                  No tenés suficiente stock para producir {cantidadNum} unidades. Revisá los insumos marcados.
                </p>
              </div>
            </div>
          )}

          {!hayFaltante && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-green-800 font-medium">
                Con el stock actual podés producir {cantidadNum} unidades.
              </p>
            </div>
          )}

          <DataTable
            columns={[
              { key: 'nombre', header: 'Insumo' },
              { key: 'unidad', header: 'Unidad' },
              {
                key: 'cantidadPorUnidad',
                header: 'Por unidad',
                render: (item) => item.cantidadPorUnidad.toFixed(4),
              },
              {
                key: 'necesitas',
                header: 'Necesitas',
                render: (item) => item.necesitas.toFixed(4),
              },
              {
                key: 'stock',
                header: 'Tienes',
                render: (item) => item.stock.toFixed(4),
              },
              {
                key: 'falta',
                header: 'Te falta',
                render: (item) => (
                  <span className={item.falta > 0 ? 'text-red-600 font-semibold' : 'text-green-600'}>
                    {item.falta > 0 ? item.falta.toFixed(4) : '—'}
                  </span>
                ),
              },
              {
                key: 'precio',
                header: 'Precio',
                render: (item) => `$${item.precio.toFixed(2)}`,
              },
              {
                key: 'costo',
                header: 'Costo',
                render: (item) => `$${item.costo.toFixed(2)}`,
              },
            ]}
            data={rows}
            keyExtractor={(item) => item.id}
          />
        </>
      )}
    </div>
  );
}
