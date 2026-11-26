import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom';
import Layout from './components/Layout';
import { PlanProvider } from './plan/PlanContext';
import PanelGeneral from './pages/PanelGeneral';
import Analisis from './pages/Analisis';
import PlanNegocio from './pages/PlanNegocio';
import ResultadosPlan from './pages/ResultadosPlan';
import Gestion from './pages/Gestion';
import Productos from './pages/Productos';
import Recetas from './pages/Recetas';
import Insumos from './pages/Insumos';
import Recursos from './pages/Recursos';

/** Destinos de las secciones antiguas del plan, ahora anclas dentro de una misma página. */
const DESTINO_PLAN: Record<string, string> = {
  supuestos: '/plan#supuestos',
  inversiones: '/plan#inversiones',
  demanda: '/plan#demanda',
  costos: '/plan#costos',
  gastos: '/plan#gastos',
  nomina: '/plan#nomina',
  pyg: '/resultados#pyg',
  flujo: '/resultados#flujo',
  evaluacion: '/resultados#evaluacion',
  reporte: '/resultados#reportes',
};

function RedirigirPlan() {
  const { seccion = '' } = useParams();
  return <Navigate to={DESTINO_PLAN[seccion] ?? '/plan'} replace />;
}

function App() {
  return (
    <BrowserRouter>
      <PlanProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<PanelGeneral />} />
            <Route path="/analisis" element={<Analisis />} />
            <Route path="/plan" element={<PlanNegocio />} />
            <Route path="/resultados" element={<ResultadosPlan />} />
            <Route path="/gestion" element={<Gestion />}>
              <Route index element={<Navigate to="productos" replace />} />
              <Route path="productos" element={<Productos />} />
              <Route path="recetas" element={<Recetas />} />
              <Route path="insumos" element={<Insumos />} />
              <Route path="recursos" element={<Recursos />} />
            </Route>

            {/* Rutas anteriores: se redirigen a su nuevo lugar */}
            <Route path="/calculadora" element={<Navigate to="/analisis#calculadora" replace />} />
            <Route path="/punto-equilibrio" element={<Navigate to="/analisis#punto-equilibrio" replace />} />
            <Route path="/precios-venta" element={<Navigate to="/analisis#precios-venta" replace />} />
            <Route path="/productos" element={<Navigate to="/gestion/productos" replace />} />
            <Route path="/recetas" element={<Navigate to="/gestion/recetas" replace />} />
            <Route path="/insumos" element={<Navigate to="/gestion/insumos" replace />} />
            <Route path="/recursos" element={<Navigate to="/gestion/recursos" replace />} />
            <Route path="/plan/:seccion" element={<RedirigirPlan />} />
          </Routes>
        </Layout>
      </PlanProvider>
    </BrowserRouter>
  );
}

export default App;
