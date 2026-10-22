import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Calculadora from './pages/Calculadora';
import Insumos from './pages/Insumos';
import Recetas from './pages/Recetas';
import Productos from './pages/Productos';
import Recursos from './pages/Recursos';
import PreciosVenta from './pages/PreciosVenta';
import PuntoEquilibrio from './pages/PuntoEquilibrio';

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
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
