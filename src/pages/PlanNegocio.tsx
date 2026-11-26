import type { ComponentType } from 'react';
import { Briefcase, Coins, Landmark, Receipt, Settings2, Users, Wallet, type LucideIcon } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Modulo from '../components/Modulo';
import ModuloNav from '../components/ModuloNav';
import PlanShell from '../plan/PlanShell';
import type { Estudio } from '../utils/estudios';
import Supuestos from './plan/Supuestos';
import Inversiones from './plan/Inversiones';
import Demanda from './plan/Demanda';
import Costos from './plan/Costos';
import Gastos from './plan/Gastos';
import Nomina from './plan/Nomina';

interface ModuloPlan {
  id: string;
  titulo: string;
  descripcion: string;
  icono: LucideIcon;
  estudio: Estudio;
  Componente: ComponentType;
}

const MODULOS: ModuloPlan[] = [
  { id: 'supuestos', titulo: '1 · Datos y supuestos', descripcion: 'Datos generales y las tasas que usa todo el plan.', icono: Settings2, estudio: 'Financiero', Componente: Supuestos },
  { id: 'inversiones', titulo: '2 · Inversiones', descripcion: 'Activos que hay que comprar para arrancar, más el capital de trabajo de los tres primeros meses.', icono: Landmark, estudio: 'Financiero', Componente: Inversiones },
  { id: 'demanda', titulo: '3 · Demanda y ventas', descripcion: 'Cuántas unidades vendes cada año, a qué precio y cómo se cobran.', icono: Coins, estudio: 'Mercado', Componente: Demanda },
  { id: 'costos', titulo: '4 · Costos', descripcion: 'Lo que cuesta producir: materia prima, mano de obra de producción y costos indirectos.', icono: Wallet, estudio: 'Técnico', Componente: Costos },
  { id: 'gastos', titulo: '5 · Gastos adm. y ventas', descripcion: 'Nómina administrativa y de ventas, publicidad, comisiones y cualquier otro gasto.', icono: Receipt, estudio: 'Administrativo y organizacional', Componente: Gastos },
  { id: 'nomina', titulo: '6 · Nómina', descripcion: 'Liquidación mensual de cada empleado: devengado, deducciones, prestaciones y aportes.', icono: Users, estudio: 'Administrativo y organizacional', Componente: Nomina },
];

export default function PlanNegocio() {
  return (
    <>
      <PageHeader
        titulo="Plan de negocio"
        descripcion="Los seis módulos del plan en una sola pantalla. Lo que escribes se guarda solo y alimenta los resultados."
        icono={Briefcase}
      />
      <PlanShell>
        <ModuloNav items={MODULOS.map(({ id, titulo }) => ({ id, titulo }))} />
        {MODULOS.map(({ id, titulo, descripcion, icono, estudio, Componente }) => (
          <Modulo key={id} id={id} titulo={titulo} descripcion={descripcion} icono={icono} estudio={estudio}>
            <Componente />
          </Modulo>
        ))}
      </PlanShell>
    </>
  );
}
