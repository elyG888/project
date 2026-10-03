import React, { useState } from 'react';
import {
  Download,
  Calendar,
  Filter,
  TrendingUp,
  Package,
  Scale,
  Sparkles,
  Info,
  Sliders,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronRight,
  Eye,
  Layers,
} from 'lucide-react';
import { AppDatabase, fruitDesertService } from '../../services/store';
import { formatCOP, formatSimpleCOP, formatGrams, formatPercent } from '../../utils/format';
import { ProductKit } from '../../types';

interface DashboardProps {
  db: AppDatabase;
  onNavigateToProduction: () => void;
  onNavigateToAssemblies: (kitId?: string) => void;
  onNavigateToSales: () => void;
}

export const AgroIndustrialDashboard: React.FC<DashboardProps> = ({
  db,
  onNavigateToProduction,
  onNavigateToAssemblies,
  onNavigateToSales,
}) => {
  const [selectedFruitFilter, setSelectedFruitFilter] = useState<string>('ALL');
  const [selectedMonth, setSelectedMonth] = useState<string>('2024-10');

  // Simulator local slider states
  const [doypackCost, setDoypackCost] = useState<number>(db.indirectCost.doypackBagCop);
  const [labelCost, setLabelCost] = useState<number>(db.indirectCost.frontBackLabelCop);
  const [laborCost, setLaborCost] = useState<number>(db.indirectCost.assemblyLaborCop);
  const [simulatorSavedMessage, setSimulatorSavedMessage] = useState<string>('');

  const simulatedPackagingTotal = doypackCost + labelCost + laborCost;

  const handleApplyIndirectCost = () => {
    fruitDesertService.updateIndirectCost({
      doypackBagCop: doypackCost,
      frontBackLabelCop: labelCost,
      assemblyLaborCop: laborCost,
    });
    setSimulatorSavedMessage('¡Costos actualizados en todas las recetas!');
    setTimeout(() => setSimulatorSavedMessage(''), 3500);
  };

  // Filtered fruits
  const displayedFruits = selectedFruitFilter === 'ALL'
    ? db.fruits
    : db.fruits.filter((f) => f.id === selectedFruitFilter);

  // Financial aggregates calculation
  const totalSalesCOP = db.sales.reduce((acc, s) => acc + s.totalCop, 0);
  const totalCogsCOP = db.sales.reduce((acc, s) => acc + s.totalCogsCop, 0);
  const totalGrossProfitCOP = totalSalesCOP - totalCogsCOP;
  const globalMarginPct = totalSalesCOP > 0 ? ((totalGrossProfitCOP / totalSalesCOP) * 100) : 58.0;
  const totalKitsSold = db.sales.reduce((acc, s) => acc + s.items.reduce((sum, item) => sum + item.quantity, 0), 0);
  const avgTicketCOP = db.sales.length > 0 ? Math.round(totalSalesCOP / db.sales.length) : 21774;

  // Average shrinkage
  const completedBatches = db.batches.filter((b) => b.status === 'COMPLETADO');
  const avgShrinkagePct = completedBatches.length > 0
    ? (completedBatches.reduce((acc, b) => acc + b.shrinkagePercentage, 0) / completedBatches.length)
    : 86.4;

  const handleExportReport = () => {
    // Generates a structured CSV report for Colombian financial management
    const headers = ['Concepto', 'Valor'];
    const rows = [
      ['Ventas Netas Totales', formatCOP(totalSalesCOP)],
      ['Costo de Produccion (COGS)', formatCOP(totalCogsCOP)],
      ['Utilidad Bruta', formatCOP(totalGrossProfitCOP)],
      ['Margen Bruto Global', `${globalMarginPct.toFixed(1)}%`],
      ['Total Kits Vendidos', `${totalKitsSold} unidades`],
      ['Merma Promedio Deshidratacion', `${avgShrinkagePct.toFixed(1)}%`],
      ['Costo Indirecto Empaque Base', formatCOP(db.indirectCost.packagingBaseCop)],
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Fruit_Desert_Informe_Financiero_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Banner & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="h-2 w-2 rounded-full bg-[#EA580C] animate-pulse"></span>
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#9A3412] font-semibold">
              PRODUCCIÓN ACTIVA: #LT-2024-10-89
            </span>
          </div>
          <h1 className="text-xl font-bold font-heading text-[#181C1F]">
            Control de Costos, Mermas y Rentabilidad
          </h1>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Month selector */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-[#FFFFFF] border border-[#E5E2DC] px-3 py-1.5 rounded-lg text-xs font-medium text-[#1E293B] focus:outline-none cursor-pointer"
          >
            <option value="2024-10">Octubre 2024</option>
            <option value="2024-09">Septiembre 2024</option>
            <option value="2024-08">Agosto 2024</option>
          </select>

          {/* Fruit Filter */}
          <select
            value={selectedFruitFilter}
            onChange={(e) => setSelectedFruitFilter(e.target.value)}
            className="bg-[#FFFFFF] border border-[#E5E2DC] px-3 py-1.5 rounded-lg text-xs font-medium text-[#1E293B] focus:outline-none cursor-pointer"
          >
            <option value="ALL">Todas las Frutas ({db.fruits.length})</option>
            {db.fruits.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>

          {/* Export Report CTA */}
          <button
            onClick={handleExportReport}
            className="flex items-center gap-2 bg-[#944601] hover:bg-[#783801] text-[#FFFFFF] px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Exportar Informe</span>
          </button>
        </div>
      </div>

      {/* 2. Four Master KPI Cards matching Image 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Ventas Netas Totales */}
        <div className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-lg p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[#64748B] mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">
              VENTAS NETAS TOTALES
            </span>
            <div className="p-1 rounded bg-[#FEF7E6] text-[#944601]">
              <Package className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-[#181C1F] tracking-tight">
            {formatSimpleCOP(totalSalesCOP > 0 ? totalSalesCOP : 14850000)} COP
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-[#2E6930] font-medium">
            <span>↑ +18.4%</span>
            <span className="text-[#64748B] text-[11px]">vs mes anterior</span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#F1F5F9] flex items-center justify-between text-[11px] text-[#64748B]">
            <span className="font-mono">{totalKitsSold > 0 ? totalKitsSold : 682} kits vendidos</span>
            <span className="font-mono">Ticket prom: {formatSimpleCOP(avgTicketCOP)}</span>
          </div>
        </div>

        {/* KPI 2: Costo Producción (COGS) */}
        <div className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-lg p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[#64748B] mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">
              COSTO PRODUCCIÓN (COGS)
            </span>
            <div className="p-1 rounded bg-[#F1F5F9] text-[#475569]">
              <Scale className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-[#181C1F] tracking-tight">
            {formatSimpleCOP(totalCogsCOP > 0 ? totalCogsCOP : 6237000)} COP
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-[#64748B] font-medium">
            <span className="font-mono text-[#181C1F]">42.0%</span>
            <span className="text-[11px]">de la facturación</span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#F1F5F9] text-[11px] text-[#64748B] truncate">
            Incluye fruta fresca, energía de túnel y empaque
          </div>
        </div>

        {/* KPI 3: Margen Bruto Global */}
        <div className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-lg p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[#64748B] mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">
              MARGEN BRUTO GLOBAL
            </span>
            <div className="p-1 rounded bg-[#EAF5EB] text-[#2E6930]">
              <TrendingUp className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-[#181C1F] tracking-tight flex items-baseline gap-2">
            <span>{globalMarginPct.toFixed(1)}%</span>
            <span className="text-xs font-sans font-medium text-[#2E6930]">Saludable</span>
          </div>
          <div className="mt-1 text-xs text-[#2E6930] font-medium">
            +{formatSimpleCOP(totalGrossProfitCOP > 0 ? totalGrossProfitCOP : 8613000)} COP Utilidad Bruta
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#F1F5F9]">
            <div className="w-full bg-[#E2E8F0] h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-[#2E6930] h-full rounded-full transition-all"
                style={{ width: `${Math.min(100, globalMarginPct)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* KPI 4: Índice Merma Promedio */}
        <div className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-lg p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[#64748B] mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">
              ÍNDICE MERMA PROMEDIO
            </span>
            <div className="p-1 rounded bg-[#FEF7E6] text-[#9A3412]">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-[#181C1F] tracking-tight flex items-baseline gap-2">
            <span>{avgShrinkagePct.toFixed(1)}%</span>
            <span className="text-[11px] font-sans font-normal text-[#64748B]">Humedad evacuada</span>
          </div>
          <div className="mt-1 text-xs text-[#64748B] font-mono">
            10 kg fresca → 1.36 kg deshidratada
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#F1F5F9] flex items-center justify-between text-[11px]">
            <span className="text-[#2E6930] font-medium bg-[#EAF5EB] px-1.5 py-0.5 rounded">
              Óptimo estándar
            </span>
            <span className="font-mono text-[#64748B]">Túneles 1 & 2</span>
          </div>
        </div>
      </div>

      {/* 3. Table 1: Análisis Unitario de Materia Prima (Cálculo de Merma Fisiológica y Costo Real) */}
      <div className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-lg overflow-hidden shadow-2xs">
        <div className="px-5 py-4 border-b border-[#E5E2DC] flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#FAF8F5]">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#78716C] font-semibold">
              ANÁLISIS UNITARIO DE MATERIA PRIMA
            </div>
            <h2 className="text-base font-bold font-heading text-[#181C1F]">
              Cálculo de Merma Fisiológica y Costo Real Deshidratado
            </h2>
          </div>

          {/* Technical Costing Formula Box as seen in Image 1 */}
          <div className="bg-[#FFFFFF] border border-[#D5D1C8] rounded px-3 py-1.5 flex items-center gap-2.5 text-xs text-[#475569] shadow-2xs">
            <span className="p-1 bg-[#FEF7E6] text-[#944601] rounded">
              <Scale className="h-3.5 w-3.5" />
            </span>
            <div>
              <div className="text-[9px] font-mono uppercase tracking-wider text-[#944601] font-bold">
                FÓRMULA DE COSTEO TÉCNICO
              </div>
              <div className="font-mono text-[11px] text-[#1E293B]">
                Costo Real/kg = (Costo Fresca / (1 - % Merma)) + Costo Energía Túnel
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E5E2DC] bg-[#F8F7F4] text-[#78716C] text-[10px] font-mono uppercase tracking-wider">
                <th className="py-2.5 px-4 font-semibold">FRUTA & VARIEDAD</th>
                <th className="py-2.5 px-4 font-semibold text-right">PRECIO FRESCO (KG)</th>
                <th className="py-2.5 px-4 font-semibold text-right">MERMA HUMEDAD</th>
                <th className="py-2.5 px-4 font-semibold text-right">RENDIMIENTO / KG</th>
                <th className="py-2.5 px-4 font-semibold text-right">COSTO BASE DESHIDRATADO</th>
                <th className="py-2.5 px-4 font-semibold text-right">COSTO POR GRAMO</th>
                <th className="py-2.5 px-4 font-semibold text-center">SENSIBILIDAD FINANCIERA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {displayedFruits.map((fruit) => {
                const dehid = db.dehydratedFruits.find((df) => df.fruitId === fruit.id);
                const yieldGrams = Math.round((100 - fruit.expectedShrinkagePct) * 10);
                const costBaseDryKg = dehid ? dehid.averageCostPerKgCop : Math.round(fruit.averageCostPerKgCop / ((100 - fruit.expectedShrinkagePct) / 100));
                const costPerGram = dehid ? dehid.costPerGramCop : Number((costBaseDryKg / 1000).toFixed(1));

                // Sensitivity status tag
                let sensitivity = { label: 'Margen Estable', color: 'bg-[#EAF5EB] text-[#2E6930] border-[#CDE6CF]' };
                if (fruit.expectedShrinkagePct > 90) {
                  sensitivity = { label: '! Alta Merma', color: 'bg-[#FBEAE8] text-[#B43428] border-[#F5C2BE]' };
                } else if (fruit.expectedShrinkagePct < 80) {
                  sensitivity = { label: '★ Alto Rendimiento', color: 'bg-[#FEF7E6] text-[#944601] border-[#FDE68A]' };
                }

                return (
                  <tr key={fruit.id} className="hover:bg-[#FAF8F5] transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="h-3 w-3 rounded-full shrink-0"
                          style={{ backgroundColor: fruit.colorHex || '#EAB308' }}
                        />
                        <div>
                          <div className="font-semibold text-[#181C1F]">{fruit.name}</div>
                          <div className="text-[11px] text-[#64748B]">
                            Lote Origen: {fruit.origin} | Bx: {fruit.typicalBrix}°
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-medium text-[#181C1F]">
                      {formatSimpleCOP(fruit.averageCostPerKgCop)} COP
                    </td>

                    <td className="py-3 px-4 text-right font-mono text-[#64748B]">
                      {fruit.expectedShrinkagePct.toFixed(1)}%
                    </td>

                    <td className="py-3 px-4 text-right font-mono text-[#181C1F]">
                      {yieldGrams} g / kg
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-[#181C1F]">
                      {formatSimpleCOP(costBaseDryKg)} COP/kg
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-semibold text-[#944601]">
                      ${costPerGram.toFixed(1)} COP/g
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${sensitivity.color}`}>
                        {sensitivity.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Table 2: Catálogo y Escandallo Industrial (Rentabilidad Neta por Presentación de Kit) */}
      <div className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-lg overflow-hidden shadow-2xs">
        <div className="px-5 py-4 border-b border-[#E5E2DC] flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#FAF8F5]">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#78716C] font-semibold">
              CATÁLOGO Y ESCANDALLO INDUSTRIAL
            </div>
            <h2 className="text-base font-bold font-heading text-[#181C1F]">
              Rentabilidad Neta por Presentación de Kit
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-[#64748B]">
              Costo empaque y ensamble base:
            </span>
            <span className="font-mono text-xs font-bold text-[#1E293B] bg-[#FFFFFF] px-2 py-1 rounded border border-[#E2E8F0]">
              ${db.indirectCost.packagingBaseCop} COP
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E5E2DC] bg-[#F8F7F4] text-[#78716C] text-[10px] font-mono uppercase tracking-wider">
                <th className="py-2.5 px-4 font-semibold">PRODUCTO / PRESENTACIÓN</th>
                <th className="py-2.5 px-4 font-semibold">RECETA & GRAMAJES (BOM)</th>
                <th className="py-2.5 px-4 font-semibold text-right">COSTO FRUTA</th>
                <th className="py-2.5 px-4 font-semibold text-right">EMPAQUE + MO</th>
                <th className="py-2.5 px-4 font-semibold text-right">COSTO TOTAL</th>
                <th className="py-2.5 px-4 font-semibold text-right">PVP OFICIAL</th>
                <th className="py-2.5 px-4 font-semibold text-right">GANANCIA NETA</th>
                <th className="py-2.5 px-4 font-semibold text-right">MARGEN %</th>
                <th className="py-2.5 px-4 font-semibold text-center">STOCK</th>
                <th className="py-2.5 px-4 font-semibold text-center">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {db.kits.map((kit) => {
                const costInfo = fruitDesertService.calculateKitCost(kit);

                return (
                  <tr key={kit.id} className="hover:bg-[#FAF8F5] transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#181C1F]">{kit.name}</div>
                      <div className="text-[11px] text-[#64748B]">{kit.presentation}</div>
                    </td>

                    {/* BOM Grams pills */}
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-0.5 text-[11px] text-[#475569]">
                        {kit.recipe.map((ing) => (
                          <div key={ing.id} className="flex items-center gap-1.5 font-mono">
                            <span className="text-[#64748B]">{ing.dehydratedFruitName.replace(' Deshidratado', '').replace(' Deshidratada', '')}:</span>
                            <span className="font-semibold text-[#1E293B]">{ing.gramsNeeded}g</span>
                          </div>
                        ))}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right font-mono text-[#475569]">
                      ${costInfo.fruitCostCop.toLocaleString('es-CO')}
                    </td>

                    <td className="py-3 px-4 text-right font-mono text-[#64748B]">
                      ${costInfo.packagingCostCop.toLocaleString('es-CO')}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-[#181C1F]">
                      ${costInfo.totalCostCop.toLocaleString('es-CO')}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-[#0F766E]">
                      ${costInfo.pvpCop.toLocaleString('es-CO')}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-semibold text-[#2E6930]">
                      +${costInfo.grossProfitCop.toLocaleString('es-CO')}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <span className="inline-block px-1.5 py-0.5 rounded font-mono text-xs font-semibold bg-[#EAF5EB] text-[#2E6930]">
                        {costInfo.grossMarginPct}%
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className={`font-mono font-medium ${kit.currentStockUnits <= kit.minStockAlert ? 'text-[#DC2626] font-bold' : 'text-[#1E293B]'}`}>
                        {kit.currentStockUnits} und
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onNavigateToAssemblies(kit.id)}
                          className="p-1 rounded text-[#944601] hover:bg-[#FEF7E6] transition-colors"
                          title="Fabricar / Armar lote de este Kit"
                        >
                          <Layers className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Lower Section: Trazabilidad en Planta & Simulador de Costos Indirectos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Trazabilidad en Planta: Últimos Lotes */}
        <div className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-lg p-5 shadow-2xs">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E5E2DC]">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#78716C] font-semibold">
                TRAZABILIDAD EN PLANTA
              </div>
              <h3 className="text-base font-bold font-heading text-[#181C1F]">
                Últimos Lotes de Deshidratación
              </h3>
            </div>
            <span className="text-[11px] font-mono text-[#64748B]">Túneles 1, 2 y 3</span>
          </div>

          <div className="space-y-3">
            {db.batches.slice(0, 3).map((batch) => {
              const isSecado = batch.status === 'EN_SECADO';

              return (
                <div
                  key={batch.id}
                  className="p-3 rounded-lg border border-[#E5E2DC] bg-[#FAF8F5] flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#D5D1C8] transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className={`px-2 py-1 rounded text-xs font-mono font-bold shrink-0 ${
                      isSecado ? 'bg-[#FEF7E6] text-[#9A3412] border border-[#FED7AA]' : 'bg-[#EAF5EB] text-[#2E6930] border border-[#CDE6CF]'
                    }`}>
                      {batch.batchCode.replace('#LT-2024-10-', 'L')}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#181C1F]">
                          Lote {batch.batchCode}
                        </span>
                        <span className={`inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-medium ${
                          isSecado ? 'bg-[#FEF7E6] text-[#9A3412]' : 'bg-[#EAF5EB] text-[#2E6930]'
                        }`}>
                          {isSecado ? 'En Secado (34h/48h)' : 'Completado & Verificado'}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#64748B] mt-0.5">
                        Fruta: {batch.fruitName} | Temp: {batch.temperatureC}°C | {batch.tunnelId}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-[#E2E8F0]">
                    <div className="text-[10px] font-mono uppercase text-[#78716C]">
                      {isSecado ? 'RENDIMIENTO PROY.' : 'FRESCO → SECO'}
                    </div>
                    <div className="font-mono text-xs font-bold text-[#181C1F]">
                      {isSecado
                        ? `${batch.yieldPercentage}% (${batch.dryKgObtained} kg)`
                        : `${batch.freshKgUsed}kg → ${batch.dryKgObtained}kg`}
                    </div>
                    <div className="text-[10px] text-[#64748B]">
                      Merma Real: {batch.shrinkagePercentage}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-[#F1F5F9] flex justify-end">
            <button
              onClick={onNavigateToProduction}
              className="text-xs text-[#944601] hover:text-[#783801] font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>Ver todos los lotes y hornos</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Right Column: Sensibilidad de Empaque: Simulador de Costos Indirectos */}
        <div className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-lg p-5 shadow-2xs">
          <div className="pb-3 mb-4 border-b border-[#E5E2DC]">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#78716C] font-semibold">
              SENSIBILIDAD DE EMPAQUE
            </div>
            <h3 className="text-base font-bold font-heading text-[#181C1F]">
              Simulador de Costos Indirectos
            </h3>
            <p className="text-xs text-[#64748B] mt-0.5">
              Modifica variables fijas para recalcular el costo estándar de cada kit comercial en planta.
            </p>
          </div>

          <div className="space-y-4">
            {/* Slider 1: Bolsa Kraft Doy-pack con Cierre */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="font-medium text-[#181C1F]">Bolsa Kraft Doy-pack con Cierre</span>
                <span className="font-mono font-bold text-[#181C1F]">${doypackCost} COP</span>
              </div>
              <input
                type="range"
                min="300"
                max="800"
                step="10"
                value={doypackCost}
                onChange={(e) => setDoypackCost(Number(e.target.value))}
                className="w-full accent-[#C86D2C] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-[#94A3B8]">
                <span>$300</span>
                <span>$800</span>
              </div>
            </div>

            {/* Slider 2: Etiqueta Adhesiva Frontal/Reverso */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="font-medium text-[#181C1F]">Etiqueta Adhesiva Frontal/Reverso</span>
                <span className="font-mono font-bold text-[#181C1F]">${labelCost} COP</span>
              </div>
              <input
                type="range"
                min="80"
                max="300"
                step="10"
                value={labelCost}
                onChange={(e) => setLabelCost(Number(e.target.value))}
                className="w-full accent-[#C86D2C] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-[#94A3B8]">
                <span>$80</span>
                <span>$300</span>
              </div>
            </div>

            {/* Slider 3: Mano de Obra (Pesaje & Sellado) */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="font-medium text-[#181C1F]">Mano de Obra (Pesaje & Sellado)</span>
                <span className="font-mono font-bold text-[#181C1F]">${laborCost} COP</span>
              </div>
              <input
                type="range"
                min="150"
                max="600"
                step="10"
                value={laborCost}
                onChange={(e) => setLaborCost(Number(e.target.value))}
                className="w-full accent-[#C86D2C] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-[#94A3B8]">
                <span>$150</span>
                <span>$600</span>
              </div>
            </div>

            {/* Simulator Output Box & Apply Action */}
            <div className="mt-5 p-3.5 bg-[#FAF8F5] border border-[#E5E2DC] rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-[#64748B]">
                  NUEVO COSTO EMPAQUE CALCULADO:
                </div>
                <div className="text-xl font-bold font-mono text-[#944601]">
                  ${simulatedPackagingTotal} COP
                </div>
              </div>

              <div className="flex items-center gap-2">
                {simulatorSavedMessage && (
                  <span className="text-xs text-[#2E6930] font-medium flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>{simulatorSavedMessage}</span>
                  </span>
                )}
                <button
                  onClick={handleApplyIndirectCost}
                  className="bg-[#944601] hover:bg-[#783801] text-[#FFFFFF] px-4 py-2 rounded text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  Aplicar a Recetas
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
