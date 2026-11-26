import { Calculator, DollarSign, TrendingUp } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Modulo from '../components/Modulo';
import ModuloNav from '../components/ModuloNav';
import Calculadora from './Calculadora';
import PuntoEquilibrio from './PuntoEquilibrio';
import PreciosVenta from './PreciosVenta';

const NAV = [
  { id: 'calculadora', titulo: 'Calculadora' },
  { id: 'punto-equilibrio', titulo: 'Punto de equilibrio' },
  { id: 'precios-venta', titulo: 'Precios de venta' },
];

export default function Analisis() {
  return (
    <>
      <PageHeader
        titulo="Análisis y cálculos"
        descripcion="Calcula costos por producción, el punto de equilibrio y los precios de venta, todo en una misma página."
        icono={Calculator}
      />
      <ModuloNav items={NAV} />

      <Modulo
        id="calculadora"
        titulo="Calculadora de producción"
        descripcion="Selecciona una receta y define la cantidad para proyectar insumos, stock y costos."
        icono={Calculator}
        estudio="Técnico"
      >
        <Calculadora />
      </Modulo>

      <Modulo
        id="punto-equilibrio"
        titulo="Punto de equilibrio"
        descripcion="Cuántas unidades necesitas vender al mes para cubrir costos fijos y variables."
        icono={TrendingUp}
        estudio="Financiero"
      >
        <PuntoEquilibrio />
      </Modulo>

      <Modulo
        id="precios-venta"
        titulo="Precios de venta"
        descripcion="Precios finales con IVA para cada producto y presentación."
        icono={DollarSign}
        estudio="Mercado"
      >
        <PreciosVenta />
      </Modulo>
    </>
  );
}
