import { Banknote, BarChart3, FileText, LineChart } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Modulo from '../components/Modulo';
import ModuloNav from '../components/ModuloNav';
import PlanShell from '../plan/PlanShell';
import { usePlan } from '../plan/PlanContext';
import { Pyg, Flujo, Evaluacion, Observaciones } from './plan/Resultados';
import Reporte from './plan/Reporte';
import ReporteIndicadores from './plan/ReporteIndicadores';

const NAV = [
  { id: 'pyg', titulo: 'Pérdidas y ganancias' },
  { id: 'flujo', titulo: 'Flujo de caja' },
  { id: 'evaluacion', titulo: 'Evaluación' },
  { id: 'reportes', titulo: 'Reportes' },
];

function ResultadosContenido() {
  const { resultados } = usePlan();
  return (
    <>
      <ModuloNav items={NAV} />

      <Modulo id="pyg" titulo="7 · Pérdidas y ganancias" descripcion="Cuánto gana o pierde el negocio cada año, con lo que llenaste en los módulos anteriores." icono={BarChart3} estudio="Financiero">
        <Pyg />
      </Modulo>

      <Modulo id="flujo" titulo="8 · Flujo de caja" descripcion="Dinero que realmente entra y sale cada año. La inversión inicial aparece como año 0." icono={Banknote} estudio="Financiero">
        <Flujo />
      </Modulo>

      <Modulo id="evaluacion" titulo="9 · Evaluación" descripcion="¿Vale la pena la inversión? Se compara la rentabilidad del proyecto con la tasa de oportunidad." icono={LineChart} estudio="Financiero">
        <Evaluacion />
      </Modulo>

      <Modulo id="reportes" titulo="10 · Reportes" descripcion="Descarga el plan de negocio completo o revisa los indicadores financieros." icono={FileText} estudio="Financiero">
        <Reporte />
        <ReporteIndicadores />
      </Modulo>

      {resultados && <Observaciones r={resultados} />}
    </>
  );
}

export default function ResultadosPlan() {
  return (
    <>
      <PageHeader
        titulo="Resultados del plan"
        descripcion="Ganancias, caja, evaluación y reportes del plan que construiste en el apartado anterior."
        icono={BarChart3}
      />
      <PlanShell>
        <ResultadosContenido />
      </PlanShell>
    </>
  );
}
