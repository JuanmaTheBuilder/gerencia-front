import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Calculadora from './pages/Calculadora';
import Insumos from './pages/Insumos';
import Recetas from './pages/Recetas';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Calculadora />} />
          <Route path="/insumos" element={<Insumos />} />
          <Route path="/recetas" element={<Recetas />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
