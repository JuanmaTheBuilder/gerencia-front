import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Calculadora from './pages/Calculadora';
import Insumos from './pages/Insumos';
import Recetas from './pages/Recetas';
import Productos from './pages/Productos';
import Recursos from './pages/Recursos';
import PreciosVenta from './pages/PreciosVenta';
import PuntoEquilibrio from './pages/PuntoEquilibrio';
import { PlanProvider } from './plan/PlanContext';
import PlanShell from './plan/PlanShell';
import Supuestos from './pages/plan/Supuestos';
import Inversiones from './pages/plan/Inversiones';
import Demanda from './pages/plan/Demanda';
import Costos from './pages/plan/Costos';
import Gastos from './pages/plan/Gastos';
import Nomina from './pages/plan/Nomina';
import { Pyg, Flujo, Evaluacion } from './pages/plan/Resultados';
import Reporte from './pages/plan/Reporte';

function PlanLayout() {
  return (
    <PlanProvider>
      <PlanShell>
        <Outlet />
      </PlanShell>
    </PlanProvider>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Calculadora />} />
          <Route path="/insumos" element={<Insumos />} />
          <Route path="/recetas" element={<Recetas />} />
          <Route path="/productos" element={<Productos />} />
          <Route path="/recursos" element={<Recursos />} />
          <Route path="/precios-venta" element={<PreciosVenta />} />
          <Route path="/punto-equilibrio" element={<PuntoEquilibrio />} />
          <Route path="/plan" element={<PlanLayout />}>
            <Route index element={<Navigate to="supuestos" replace />} />
            <Route path="supuestos" element={<Supuestos />} />
            <Route path="inversiones" element={<Inversiones />} />
            <Route path="demanda" element={<Demanda />} />
            <Route path="costos" element={<Costos />} />
            <Route path="gastos" element={<Gastos />} />
            <Route path="nomina" element={<Nomina />} />
            <Route path="pyg" element={<Pyg />} />
            <Route path="flujo" element={<Flujo />} />
            <Route path="evaluacion" element={<Evaluacion />} />
            <Route path="reporte" element={<Reporte />} />
          </Route>
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
