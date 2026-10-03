import React, { useState } from 'react';
import { Boxes, ArrowDownRight, ArrowUpRight, Filter, SlidersHorizontal, AlertTriangle, X, CheckCircle2 } from 'lucide-react';
import { AppDatabase, fruitDesertService } from '../../services/store';
import { formatCOP, formatSimpleCOP, formatKilograms, formatGrams, formatColombianDate, formatColombianDateTime } from '../../utils/format';
import { MovementType, ItemType } from '../../types';

interface InventoryModuleProps {
  db: AppDatabase;
}

export const InventoryModule: React.FC<InventoryModuleProps> = ({ db }) => {
  const [activeTab, setActiveTab] = useState<'existencias' | 'kardex'>('existencias');
  const [movementFilter, setMovementFilter] = useState<string>('ALL');
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);

  // Adjustment form state
  const [adjustItemType, setAdjustItemType] = useState<ItemType>('FRUTA_FRESCA');
  const [adjustItemId, setAdjustItemId] = useState<string>(db.fruits[0]?.id || '');
  const [adjustNewQuantity, setAdjustNewQuantity] = useState<number>(100);
  const [adjustReason, setAdjustReason] = useState<string>('');
  const [adjustError, setAdjustError] = useState<string>('');
  const [adjustSuccess, setAdjustSuccess] = useState<string>('');

  // Total Valuations
  const freshFruitValuationCOP = db.fruits.reduce((acc, f) => acc + (f.currentStockKg * f.averageCostPerKgCop), 0);
  const dehydratedValuationCOP = db.dehydratedFruits.reduce((acc, df) => acc + (df.currentStockKg * df.averageCostPerKgCop), 0);
  const kitsValuationCOP = db.kits.reduce((acc, k) => {
    const cost = fruitDesertService.calculateKitCost(k).totalCostCop;
    return acc + (k.currentStockUnits * cost);
  }, 0);
  const totalInventoryValuationCOP = freshFruitValuationCOP + dehydratedValuationCOP + kitsValuationCOP;

  const handleApplyAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    setAdjustError('');
    setAdjustSuccess('');

    try {
      fruitDesertService.registerInventoryAdjustment({
        itemType: adjustItemType as any,
        itemId: adjustItemId,
        newQuantity: adjustNewQuantity,
        reason: adjustReason,
      });

      setAdjustSuccess('¡Ajuste de inventario aplicado y registrado en el Kardex de auditoría!');
      setIsAdjustModalOpen(false);
      setAdjustReason('');
      setTimeout(() => setAdjustSuccess(''), 4000);
    } catch (err: any) {
      setAdjustError(err.message || 'Error al aplicar ajuste.');
    }
  };

  // Filtered Kardex movements
  const filteredMovements = db.movements.filter((m) => {
    if (movementFilter === 'ALL') return true;
    return m.movementType === movementFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-[#181C1F]">
            Inventario & Kardex Multietapa
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Trazabilidad física y contable en 3 fases: Fruta Fresca, Fruta Deshidratada y Kits Comerciales.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-[#F1F5F9] p-1 rounded-lg border border-[#E2E8F0]">
            <button
              onClick={() => setActiveTab('existencias')}
              className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
                activeTab === 'existencias'
                  ? 'bg-[#FFFFFF] text-[#944601] shadow-2xs'
                  : 'text-[#64748B] hover:text-[#181C1F]'
              }`}
            >
              Existencias en Planta
            </button>
            <button
              onClick={() => setActiveTab('kardex')}
              className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
                activeTab === 'kardex'
                  ? 'bg-[#FFFFFF] text-[#944601] shadow-2xs'
                  : 'text-[#64748B] hover:text-[#181C1F]'
              }`}
            >
              Kardex de Movimientos
            </button>
          </div>

          <button
            onClick={() => setIsAdjustModalOpen(true)}
            className="flex items-center gap-2 bg-[#FFFFFF] border border-[#CBD5E1] hover:bg-[#F8FAFC] text-[#1E293B] px-3.5 py-1.5 rounded-md text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-[#C86D2C]" />
            <span>Ajuste de Stock</span>
          </button>
        </div>
      </div>

      {adjustSuccess && (
        <div className="p-3 bg-[#EAF5EB] border border-[#CDE6CF] rounded-lg text-xs text-[#2E6930] flex items-center gap-2 font-medium">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{adjustSuccess}</span>
        </div>
      )}

      {/* Valuation Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-lg p-4 shadow-2xs">
          <span className="text-[10px] font-mono uppercase text-[#78716C] block">
            VALUACIÓN TOTAL DE INVENTARIOS
          </span>
          <span className="text-xl font-bold font-mono text-[#944601]">
            {formatSimpleCOP(totalInventoryValuationCOP)} COP
          </span>
          <span className="text-[11px] text-[#64748B] block mt-1">Activo corriente total</span>
        </div>

        <div className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-lg p-4 shadow-2xs">
          <span className="text-[10px] font-mono uppercase text-[#78716C] block">
            FASE 1: FRUTA FRESCA
          </span>
          <span className="text-lg font-bold font-mono text-[#181C1F]">
            {formatSimpleCOP(freshFruitValuationCOP)} COP
          </span>
          <span className="text-[11px] text-[#64748B] block mt-1 font-mono">
            {db.fruits.reduce((acc, f) => acc + f.currentStockKg, 0).toFixed(1)} kg en bodega fría
          </span>
        </div>

        <div className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-lg p-4 shadow-2xs">
          <span className="text-[10px] font-mono uppercase text-[#78716C] block">
            FASE 2: FRUTA DESHIDRATADA
          </span>
          <span className="text-lg font-bold font-mono text-[#181C1F]">
            {formatSimpleCOP(dehydratedValuationCOP)} COP
          </span>
          <span className="text-[11px] text-[#64748B] block mt-1 font-mono">
            {db.dehydratedFruits.reduce((acc, df) => acc + df.currentStockKg, 0).toFixed(1)} kg listos para ensamble
          </span>
        </div>

        <div className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-lg p-4 shadow-2xs">
          <span className="text-[10px] font-mono uppercase text-[#78716C] block">
            FASE 3: KITS TERMINADOS
          </span>
          <span className="text-lg font-bold font-mono text-[#2E6930]">
            {formatSimpleCOP(kitsValuationCOP)} COP
          </span>
          <span className="text-[11px] text-[#64748B] block mt-1 font-mono">
            {db.kits.reduce((acc, k) => acc + k.currentStockUnits, 0)} unidades empacadas
          </span>
        </div>
      </div>

      {/* Tab 1: Existencias Multietapa */}
      {activeTab === 'existencias' && (
        <div className="space-y-6">
          {/* Phase 1: Fresh Fruit */}
          <div className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-lg overflow-hidden shadow-2xs">
            <div className="px-5 py-3 border-b border-[#E5E2DC] bg-[#FAF8F5] flex justify-between items-center">
              <span className="text-xs font-mono uppercase font-bold text-[#78716C]">
                FASE 1: MATERIA PRIMA FRESCA (KG)
              </span>
              <span className="text-[11px] font-mono text-[#64748B]">Compras (+) | Deshidratación (-)</span>
            </div>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#F8F7F4] text-[#64748B] text-[10px] font-mono uppercase border-b border-[#E5E2DC]">
                  <th className="py-2.5 px-4">FRUTA & VARIEDAD</th>
                  <th className="py-2.5 px-4">ORIGEN</th>
                  <th className="py-2.5 px-4 text-right">EXISTENCIA ACTUAL</th>
                  <th className="py-2.5 px-4 text-right">COSTO PMP / KG</th>
                  <th className="py-2.5 px-4 text-right">VALUACIÓN TOTAL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {db.fruits.map((f) => (
                  <tr key={f.id} className="hover:bg-[#FAF8F5]">
                    <td className="py-2.5 px-4 font-semibold text-[#181C1F]">{f.name} ({f.variety})</td>
                    <td className="py-2.5 px-4 text-[#64748B]">{f.origin}</td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-[#181C1F]">
                      {formatKilograms(f.currentStockKg)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-[#64748B]">
                      {formatSimpleCOP(f.averageCostPerKgCop)} COP
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-[#181C1F]">
                      {formatSimpleCOP(f.currentStockKg * f.averageCostPerKgCop)} COP
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Phase 2: Dehydrated Fruit */}
          <div className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-lg overflow-hidden shadow-2xs">
            <div className="px-5 py-3 border-b border-[#E5E2DC] bg-[#FAF8F5] flex justify-between items-center">
              <span className="text-xs font-mono uppercase font-bold text-[#78716C]">
                FASE 2: FRUTA DESHIDRATADA A GRANEL (KG & G)
              </span>
              <span className="text-[11px] font-mono text-[#64748B]">Deshidratación (+) | Armado Kits (-)</span>
            </div>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#F8F7F4] text-[#64748B] text-[10px] font-mono uppercase border-b border-[#E5E2DC]">
                  <th className="py-2.5 px-4">FRUTA DESHIDRATADA</th>
                  <th className="py-2.5 px-4 text-right">STOCK EN KG</th>
                  <th className="py-2.5 px-4 text-right">STOCK EN GRAMOS</th>
                  <th className="py-2.5 px-4 text-right">COSTO / GRAMO</th>
                  <th className="py-2.5 px-4 text-right">COSTO / KG</th>
                  <th className="py-2.5 px-4 text-right">VALUACIÓN TOTAL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {db.dehydratedFruits.map((df) => (
                  <tr key={df.id} className="hover:bg-[#FAF8F5]">
                    <td className="py-2.5 px-4 font-semibold text-[#181C1F]">{df.name}</td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-[#181C1F]">
                      {formatKilograms(df.currentStockKg)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-[#64748B]">
                      {formatGrams(df.currentStockKg * 1000)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-semibold text-[#944601]">
                      ${df.costPerGramCop}/g
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-[#64748B]">
                      {formatSimpleCOP(df.averageCostPerKgCop)} COP
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-[#181C1F]">
                      {formatSimpleCOP(df.currentStockKg * df.averageCostPerKgCop)} COP
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Phase 3: Commercial Kits */}
          <div className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-lg overflow-hidden shadow-2xs">
            <div className="px-5 py-3 border-b border-[#E5E2DC] bg-[#FAF8F5] flex justify-between items-center">
              <span className="text-xs font-mono uppercase font-bold text-[#78716C]">
                FASE 3: KITS COMERCIALES TERMINADOS (UNIDADES)
              </span>
              <span className="text-[11px] font-mono text-[#64748B]">Armado Kits (+) | Ventas (-)</span>
            </div>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#F8F7F4] text-[#64748B] text-[10px] font-mono uppercase border-b border-[#E5E2DC]">
                  <th className="py-2.5 px-4">CÓDIGO & NOMBRE</th>
                  <th className="py-2.5 px-4">PRESENTACIÓN</th>
                  <th className="py-2.5 px-4 text-center">UNIDADES EN STOCK</th>
                  <th className="py-2.5 px-4 text-right">COSTO TOTAL UNIT.</th>
                  <th className="py-2.5 px-4 text-right">PVP OFICIAL</th>
                  <th className="py-2.5 px-4 text-right">VALUACIÓN INVENTARIO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {db.kits.map((kit) => {
                  const cost = fruitDesertService.calculateKitCost(kit).totalCostCop;
                  const isLow = kit.currentStockUnits <= kit.minStockAlert;

                  return (
                    <tr key={kit.id} className="hover:bg-[#FAF8F5]">
                      <td className="py-2.5 px-4">
                        <span className="font-mono text-[#944601] font-bold mr-2">{kit.code}</span>
                        <span className="font-semibold text-[#181C1F]">{kit.name}</span>
                      </td>
                      <td className="py-2.5 px-4 text-[#64748B]">{kit.presentation}</td>
                      <td className="py-2.5 px-4 text-center font-mono font-bold">
                        <span className={isLow ? 'text-[#DC2626] font-bold' : 'text-[#181C1F]'}>
                          {kit.currentStockUnits} und
                        </span>
                        {isLow && (
                          <span className="ml-1 text-[10px] text-[#DC2626] font-normal">(Bajo stock)</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-[#64748B]">
                        {formatSimpleCOP(cost)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-[#0F766E]">
                        {formatSimpleCOP(kit.pvpCop)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-[#181C1F]">
                        {formatSimpleCOP(kit.currentStockUnits * cost)} COP
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Kardex de Movimientos */}
      {activeTab === 'kardex' && (
        <div className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-lg overflow-hidden shadow-2xs">
          <div className="px-5 py-4 border-b border-[#E5E2DC] bg-[#FAF8F5] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#78716C] font-semibold">
                LIBRO DE MOVIMIENTOS HISTÓRICOS (KARDEX INMUTABLE)
              </span>
              <p className="text-xs text-[#64748B]">
                Registro cronológico con auditoría de usuario, documento soporte y balance de existencias.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-[#64748B]" />
              <select
                value={movementFilter}
                onChange={(e) => setMovementFilter(e.target.value)}
                className="bg-[#FFFFFF] border border-[#D5D1C8] rounded px-2.5 py-1 text-xs focus:outline-none"
              >
                <option value="ALL">Todos los Movimientos ({db.movements.length})</option>
                <option value="COMPRA">Compras Materia Prima</option>
                <option value="PRODUCCION_SALIDA">Cargas a Túnel (Salida)</option>
                <option value="PRODUCCION_ENTRADA">Salidas de Túnel (Entrada)</option>
                <option value="ENSAMBLE_SALIDA">Consumo Receta Kit</option>
                <option value="ENSAMBLE_ENTRADA">Kits Armados Terminados</option>
                <option value="VENTA">Ventas Comerciales</option>
                <option value="AJUSTE_POSITIVO">Ajustes Positivos</option>
                <option value="AJUSTE_NEGATIVO">Ajustes Negativos</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E5E2DC] bg-[#F8F7F4] text-[#78716C] text-[10px] font-mono uppercase tracking-wider">
                  <th className="py-2.5 px-4 font-semibold">FECHA / HORA</th>
                  <th className="py-2.5 px-4 font-semibold">TIPO OPERACIÓN</th>
                  <th className="py-2.5 px-4 font-semibold">ARTÍCULO / ENTIDAD</th>
                  <th className="py-2.5 px-4 font-semibold text-right">CANTIDAD</th>
                  <th className="py-2.5 px-4 font-semibold text-right">PREVIO → NUEVO</th>
                  <th className="py-2.5 px-4 font-semibold text-right">VALOR TOTAL</th>
                  <th className="py-2.5 px-4 font-semibold">DOC. SOPORTE</th>
                  <th className="py-2.5 px-4 font-semibold">RESPONSABLE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {filteredMovements.map((mov) => {
                  const isPositive = mov.quantityChange > 0;

                  return (
                    <tr key={mov.id} className="hover:bg-[#FAF8F5] transition-colors">
                      <td className="py-3 px-4 font-mono text-[#64748B] text-[11px]">
                        {formatColombianDateTime(mov.timestamp)}
                      </td>

                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                          isPositive
                            ? 'bg-[#EAF5EB] text-[#2E6930]'
                            : 'bg-[#FBEAE8] text-[#B43428]'
                        }`}>
                          {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                          <span>{mov.movementType}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#181C1F]">{mov.itemName}</div>
                        <div className="text-[10px] text-[#64748B] font-mono">{mov.reason}</div>
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold">
                        <span className={isPositive ? 'text-[#2E6930]' : 'text-[#B43428]'}>
                          {isPositive ? '+' : ''}{mov.quantityChange} {mov.unit}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-[#64748B]">
                        {mov.previousStock} → <strong className="text-[#181C1F]">{mov.newStock} {mov.unit}</strong>
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-medium text-[#181C1F]">
                        {formatSimpleCOP(mov.totalCostCop)} COP
                      </td>

                      <td className="py-3 px-4 font-mono text-[#944601] font-semibold">
                        {mov.referenceDocument}
                      </td>

                      <td className="py-3 px-4 text-[#64748B]">
                        {mov.responsibleUser}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Ajuste de Inventario con Auditoría */}
      {isAdjustModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#181C1F]/50 backdrop-blur-xs p-4">
          <div className="bg-[#FFFFFF] rounded-lg border border-[#E5E2DC] shadow-lg max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E2DC]">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5 text-[#C86D2C]" />
                <h3 className="font-heading font-bold text-base text-[#181C1F]">
                  Ajuste Auditado de Existencias
                </h3>
              </div>
              <button onClick={() => setIsAdjustModalOpen(false)} className="text-[#64748B] hover:text-[#181C1F]">
                <X className="h-5 w-5" />
              </button>
            </div>

            {adjustError && (
              <div className="p-3 bg-[#FBEAE8] border border-[#F5C2BE] rounded text-xs text-[#B43428] flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{adjustError}</span>
              </div>
            )}

            <form onSubmit={handleApplyAdjustment} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#181C1F] font-semibold mb-1">
                  Categoría del Artículo *
                </label>
                <select
                  value={adjustItemType}
                  onChange={(e) => {
                    const newType = e.target.value as ItemType;
                    setAdjustItemType(newType);
                    if (newType === 'FRUTA_FRESCA') setAdjustItemId(db.fruits[0]?.id || '');
                    else if (newType === 'FRUTA_DESHIDRATADA') setAdjustItemId(db.dehydratedFruits[0]?.id || '');
                    else if (newType === 'KIT_FINAL') setAdjustItemId(db.kits[0]?.id || '');
                  }}
                  className="w-full rounded border border-[#D5D1C8] px-2.5 py-1.5 focus:border-[#C86D2C] focus:outline-none"
                >
                  <option value="FRUTA_FRESCA">Fruta Fresca (kg)</option>
                  <option value="FRUTA_DESHIDRATADA">Fruta Deshidratada (kg)</option>
                  <option value="KIT_FINAL">Kit Comercial Terminado (und)</option>
                </select>
              </div>

              <div>
                <label className="block text-[#181C1F] font-semibold mb-1">
                  Artículo Específico *
                </label>
                <select
                  value={adjustItemId}
                  onChange={(e) => setAdjustItemId(e.target.value)}
                  className="w-full rounded border border-[#D5D1C8] px-2.5 py-1.5 focus:border-[#C86D2C] focus:outline-none"
                >
                  {adjustItemType === 'FRUTA_FRESCA' &&
                    db.fruits.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} — Actual: {f.currentStockKg} kg
                      </option>
                    ))}
                  {adjustItemType === 'FRUTA_DESHIDRATADA' &&
                    db.dehydratedFruits.map((df) => (
                      <option key={df.id} value={df.id}>
                        {df.name} — Actual: {df.currentStockKg} kg
                      </option>
                    ))}
                  {adjustItemType === 'KIT_FINAL' &&
                    db.kits.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.name} ({k.presentation}) — Actual: {k.currentStockUnits} und
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-[#181C1F] font-semibold mb-1">
                  Nueva Cantidad Real en Físico *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={adjustNewQuantity}
                  onChange={(e) => setAdjustNewQuantity(Number(e.target.value))}
                  className="w-full rounded border border-[#D5D1C8] px-2.5 py-1.5 font-mono font-bold focus:border-[#C86D2C] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[#181C1F] font-semibold mb-1">
                  Motivo Justificado del Ajuste (Auditoría) *
                </label>
                <textarea
                  rows={2}
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="Ej: Conteo físico mensual, merma extraordinaria por humedad ambiental, muestra para laboratorio..."
                  className="w-full rounded border border-[#D5D1C8] px-2.5 py-1.5 focus:border-[#C86D2C] focus:outline-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#E5E2DC]">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-3.5 py-1.5 rounded border border-[#D5D1C8] text-[#64748B]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-[#944601] hover:bg-[#783801] text-[#FFFFFF] font-semibold shadow-xs"
                >
                  Aplicar Ajuste en Kardex
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
