import React, { useState } from 'react';
import {
  Flame,
  Plus,
  Scale,
  Clock,
  Thermometer,
  AlertTriangle,
  CheckCircle2,
  Filter,
  X,
} from 'lucide-react';
import { AppDatabase, fruitDesertService } from '../../services/store';
import { formatCOP, formatSimpleCOP, formatKilograms, formatPercent, formatColombianDate } from '../../utils/format';
import { DehydrationBatch, TunnelId } from '../../types';

interface ProductionModuleProps {
  db: AppDatabase;
}

export const ProductionModule: React.FC<ProductionModuleProps> = ({ db }) => {
  const [selectedTunnelFilter, setSelectedTunnelFilter] = useState<string>('ALL');
  const [isNewBatchModalOpen, setIsNewBatchModalOpen] = useState(false);
  const [finalizingBatch, setFinalizingBatch] = useState<DehydrationBatch | null>(null);

  // New batch form state
  const [fruitId, setFruitId] = useState(db.fruits[0]?.id || '');
  const [tunnelId, setTunnelId] = useState<TunnelId>('Túnel 1');
  const [freshKgUsed, setFreshKgUsed] = useState<number>(250);
  const [temperatureC, setTemperatureC] = useState<number>(58);
  const [dryingDurationHours, setDryingDurationHours] = useState<number>(36);
  const [status, setStatus] = useState<'EN_SECADO' | 'COMPLETADO'>('EN_SECADO');
  const [dryKgObtained, setDryKgObtained] = useState<number>(35);
  const [energyCostCop, setEnergyCostCop] = useState<number>(110000);
  const [notes, setNotes] = useState<string>('');
  const [formError, setFormError] = useState<string>('');

  // Finalize batch modal state
  const [finalizeDryKg, setFinalizeDryKg] = useState<number>(0);
  const [finalizeNotes, setFinalizeNotes] = useState<string>('');
  const [finalizeError, setFinalizeError] = useState<string>('');

  const selectedFruit = db.fruits.find((f) => f.id === fruitId);

  // Live calculation of preview yield and shrinkage
  const previewYieldPct = freshKgUsed > 0 && dryKgObtained > 0
    ? Number(((dryKgObtained / freshKgUsed) * 100).toFixed(1))
    : selectedFruit ? 100 - selectedFruit.expectedShrinkagePct : 15;
  const previewShrinkagePct = Number((100 - previewYieldPct).toFixed(1));

  const totalFreshCost = selectedFruit ? freshKgUsed * selectedFruit.averageCostPerKgCop : 0;
  const totalBatchCost = totalFreshCost + energyCostCop;
  const costPerDryKg = dryKgObtained > 0 ? Math.round(totalBatchCost / dryKgObtained) : 0;
  const costPerDryGram = Number((costPerDryKg / 1000).toFixed(1));

  // Filtered batches
  const filteredBatches = db.batches.filter((b) => {
    if (selectedTunnelFilter !== 'ALL' && b.tunnelId !== selectedTunnelFilter) return false;
    return true;
  });

  const handleCreateBatch = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    try {
      fruitDesertService.registerBatch({
        tunnelId,
        fruitId,
        freshKgUsed,
        dryKgObtained: status === 'COMPLETADO' ? dryKgObtained : undefined,
        energyTunnelCostCop: energyCostCop,
        temperatureC,
        dryingDurationHours,
        status,
        notes,
      });

      setIsNewBatchModalOpen(false);
      setNotes('');
    } catch (err: any) {
      setFormError(err.message || 'Error al registrar lote de deshidratación.');
    }
  };

  const handleFinalizeBatch = (e: React.FormEvent) => {
    e.preventDefault();
    setFinalizeError('');
    if (!finalizingBatch) return;

    try {
      fruitDesertService.finalizeBatch(finalizingBatch.id, finalizeDryKg, finalizeNotes);
      setFinalizingBatch(null);
      setFinalizeDryKg(0);
      setFinalizeNotes('');
    } catch (err: any) {
      setFinalizeError(err.message || 'Error al completar lote.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-[#181C1F]">
            Producción & Túneles de Deshidratación
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Registro de cargas a túnel, control de mermas fisiológicas y costeo real de fruta deshidratada por lote.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Tunnel filter */}
          <div className="flex items-center gap-2 bg-[#FFFFFF] border border-[#E5E2DC] px-3 py-1.5 rounded-md text-xs font-medium text-[#1E293B]">
            <Filter className="h-3.5 w-3.5 text-[#64748B]" />
            <select
              value={selectedTunnelFilter}
              onChange={(e) => setSelectedTunnelFilter(e.target.value)}
              className="bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="ALL">Todos los Túneles</option>
              <option value="Túnel 1">Túnel 1 (Aire caliente)</option>
              <option value="Túnel 2">Túnel 2 (Flujo continuo)</option>
              <option value="Túnel 3">Túnel 3 (Flujo laminar)</option>
            </select>
          </div>

          <button
            onClick={() => setIsNewBatchModalOpen(true)}
            className="flex items-center gap-2 bg-[#C86D2C] hover:bg-[#B15C21] text-[#FFFFFF] px-3.5 py-1.5 rounded-md text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Nuevo Lote de Secado</span>
          </button>
        </div>
      </div>

      {/* Batches Table */}
      <div className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-lg overflow-hidden shadow-2xs">
        <div className="px-5 py-4 border-b border-[#E5E2DC] bg-[#FAF8F5] flex items-center justify-between">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#78716C] font-semibold">
            HISTORIAL DE LOTES DE PRODUCCIÓN ({filteredBatches.length})
          </span>
          <span className="text-xs font-mono text-[#64748B]">
            Trazabilidad Lotes: #LT-AAAA-MM-XX
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E5E2DC] bg-[#F8F7F4] text-[#78716C] text-[10px] font-mono uppercase tracking-wider">
                <th className="py-2.5 px-4 font-semibold">LOTE ID</th>
                <th className="py-2.5 px-4 font-semibold">FECHA</th>
                <th className="py-2.5 px-4 font-semibold">FRUTA & VARIEDAD</th>
                <th className="py-2.5 px-4 font-semibold">TÚNEL / PARÁMETROS</th>
                <th className="py-2.5 px-4 font-semibold text-right">MATERIA FRESCA</th>
                <th className="py-2.5 px-4 font-semibold text-right">SECO OBTENIDO</th>
                <th className="py-2.5 px-4 font-semibold text-right">RENDIMIENTO %</th>
                <th className="py-2.5 px-4 font-semibold text-right">MERMA %</th>
                <th className="py-2.5 px-4 font-semibold text-right">COSTO REAL/KG</th>
                <th className="py-2.5 px-4 font-semibold text-center">ESTADO</th>
                <th className="py-2.5 px-4 font-semibold text-center">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {filteredBatches.map((batch) => {
                const isSecado = batch.status === 'EN_SECADO';

                return (
                  <tr key={batch.id} className="hover:bg-[#FAF8F5] transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#181C1F]">
                      {batch.batchCode}
                    </td>

                    <td className="py-3 px-4 text-[#64748B] font-mono">
                      {formatColombianDate(batch.date)}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#181C1F]">{batch.fruitName}</div>
                      <div className="text-[11px] text-[#64748B]">{batch.variety} • {batch.origin}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-mono text-[#181C1F]">{batch.tunnelId}</div>
                      <div className="text-[11px] text-[#64748B] font-mono">
                        {batch.temperatureC}°C • {batch.dryingDurationHours}h
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-medium text-[#181C1F]">
                      {formatKilograms(batch.freshKgUsed)}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-[#181C1F]">
                      {isSecado ? (
                        <span className="text-[#9A3412] italic font-normal">
                          ~{batch.dryKgObtained} kg (proy)
                        </span>
                      ) : (
                        formatKilograms(batch.dryKgObtained)
                      )}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-semibold text-[#2E6930]">
                      {batch.yieldPercentage}%
                    </td>

                    <td className="py-3 px-4 text-right font-mono text-[#B43428]">
                      {batch.shrinkagePercentage}%
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-[#181C1F]">
                      {isSecado ? '-' : `${formatSimpleCOP(batch.costPerDryKgCop)} COP`}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${
                        isSecado
                          ? 'bg-[#FEF7E6] text-[#9A3412] border-[#FED7AA]'
                          : 'bg-[#EAF5EB] text-[#2E6930] border-[#CDE6CF]'
                      }`}>
                        {isSecado ? <Clock className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                        <span>{isSecado ? 'En Secado' : 'Completado'}</span>
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      {isSecado ? (
                        <button
                          onClick={() => {
                            setFinalizingBatch(batch);
                            setFinalizeDryKg(batch.dryKgObtained || 30);
                          }}
                          className="px-2.5 py-1 rounded bg-[#944601] hover:bg-[#783801] text-[#FFFFFF] font-semibold text-[11px] transition-colors cursor-pointer"
                        >
                          Finalizar Pesaje
                        </button>
                      ) : (
                        <span className="text-[11px] text-[#64748B] font-mono">Verificado</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Nuevo Lote de Deshidratación */}
      {isNewBatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#181C1F]/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-[#FFFFFF] rounded-lg border border-[#E5E2DC] shadow-lg max-w-xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E2DC]">
              <div className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-[#C86D2C]" />
                <h3 className="font-heading font-bold text-base text-[#181C1F]">
                  Nuevo Lote de Deshidratación en Túnel
                </h3>
              </div>
              <button
                onClick={() => setIsNewBatchModalOpen(false)}
                className="text-[#64748B] hover:text-[#181C1F]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-[#FBEAE8] border border-[#F5C2BE] rounded text-xs text-[#B43428] flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateBatch} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Fruit Selection */}
                <div>
                  <label className="block text-[#181C1F] font-semibold mb-1">
                    Fruta Fresca de Origen *
                  </label>
                  <select
                    value={fruitId}
                    onChange={(e) => setFruitId(e.target.value)}
                    className="w-full rounded border border-[#D5D1C8] px-2.5 py-1.5 focus:border-[#C86D2C] focus:outline-none"
                    required
                  >
                    {db.fruits.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.variety}) — Stock: {f.currentStockKg} kg
                      </option>
                    ))}
                  </select>
                  {selectedFruit && (
                    <p className="text-[11px] text-[#64748B] mt-1 font-mono">
                      Costo PMP actual: {formatSimpleCOP(selectedFruit.averageCostPerKgCop)}/kg | Merma esperada: {selectedFruit.expectedShrinkagePct}%
                    </p>
                  )}
                </div>

                {/* Tunnel Selection */}
                <div>
                  <label className="block text-[#181C1F] font-semibold mb-1">
                    Túnel de Deshidratación *
                  </label>
                  <select
                    value={tunnelId}
                    onChange={(e) => setTunnelId(e.target.value as TunnelId)}
                    className="w-full rounded border border-[#D5D1C8] px-2.5 py-1.5 focus:border-[#C86D2C] focus:outline-none"
                    required
                  >
                    <option value="Túnel 1">Túnel 1 (Aire caliente forzado)</option>
                    <option value="Túnel 2">Túnel 2 (Flujo continuo bandejas)</option>
                    <option value="Túnel 3">Túnel 3 (Flujo laminar de precisión)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Fresh Kg Used */}
                <div>
                  <label className="block text-[#181C1F] font-semibold mb-1">
                    Fruta Fresca Usada (kg) *
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max={selectedFruit?.currentStockKg || 9999}
                    value={freshKgUsed}
                    onChange={(e) => setFreshKgUsed(Number(e.target.value))}
                    className="w-full rounded border border-[#D5D1C8] px-2.5 py-1.5 focus:border-[#C86D2C] focus:outline-none font-mono"
                    required
                  />
                  <span className="text-[10px] text-[#64748B]">
                    Máx disponible: {selectedFruit?.currentStockKg || 0} kg
                  </span>
                </div>

                {/* Temperature */}
                <div>
                  <label className="block text-[#181C1F] font-semibold mb-1">
                    Temperatura Túnel (°C)
                  </label>
                  <input
                    type="number"
                    min="40"
                    max="75"
                    value={temperatureC}
                    onChange={(e) => setTemperatureC(Number(e.target.value))}
                    className="w-full rounded border border-[#D5D1C8] px-2.5 py-1.5 focus:border-[#C86D2C] focus:outline-none font-mono"
                  />
                </div>

                {/* Hours */}
                <div>
                  <label className="block text-[#181C1F] font-semibold mb-1">
                    Horas de Secado (h)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="72"
                    value={dryingDurationHours}
                    onChange={(e) => setDryingDurationHours(Number(e.target.value))}
                    className="w-full rounded border border-[#D5D1C8] px-2.5 py-1.5 focus:border-[#C86D2C] focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Status and Energy */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#181C1F] font-semibold mb-1">
                    Estado Inicial del Lote
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'EN_SECADO' | 'COMPLETADO')}
                    className="w-full rounded border border-[#D5D1C8] px-2.5 py-1.5 focus:border-[#C86D2C] focus:outline-none"
                  >
                    <option value="EN_SECADO">En Secado (Carga activa en proceso)</option>
                    <option value="COMPLETADO">Completado (Pesaje final inmediato)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#181C1F] font-semibold mb-1">
                    Costo Energía & Operación Túnel (COP)
                  </label>
                  <input
                    type="number"
                    step="5000"
                    min="0"
                    value={energyCostCop}
                    onChange={(e) => setEnergyCostCop(Number(e.target.value))}
                    className="w-full rounded border border-[#D5D1C8] px-2.5 py-1.5 focus:border-[#C86D2C] focus:outline-none font-mono"
                  />
                </div>
              </div>

              {status === 'COMPLETADO' && (
                <div>
                  <label className="block text-[#181C1F] font-semibold mb-1">
                    Fruta Deshidratada Obtenida (kg secos verificados) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={dryKgObtained}
                    onChange={(e) => setDryKgObtained(Number(e.target.value))}
                    className="w-full rounded border border-[#D5D1C8] px-2.5 py-1.5 focus:border-[#C86D2C] focus:outline-none font-mono font-bold text-[#181C1F]"
                    required
                  />
                </div>
              )}

              {/* Technical Yield & Cost Preview */}
              <div className="p-3 bg-[#FAF8F5] border border-[#E5E2DC] rounded-lg">
                <div className="text-[10px] font-mono uppercase tracking-wider text-[#78716C] font-semibold mb-1.5">
                  PREVISIÓN TÉCNICA DE MERMA Y COSTO
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                  <div>
                    <span className="text-[#64748B] block text-[10px]">Rendimiento:</span>
                    <span className="font-bold text-[#2E6930]">{previewYieldPct}%</span>
                  </div>
                  <div>
                    <span className="text-[#64748B] block text-[10px]">Merma calculada:</span>
                    <span className="font-bold text-[#B43428]">{previewShrinkagePct}%</span>
                  </div>
                  <div>
                    <span className="text-[#64748B] block text-[10px]">Costo/kg Seco:</span>
                    <span className="font-bold text-[#181C1F]">{formatSimpleCOP(costPerDryKg)}</span>
                  </div>
                  <div>
                    <span className="text-[#64748B] block text-[10px]">Costo/gramo:</span>
                    <span className="font-bold text-[#944601]">${costPerDryGram}/g</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[#181C1F] font-semibold mb-1">
                  Observaciones de Control de Calidad
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej: Calibre homogéneo, grosor de rebanada 4mm, flujo laminar constante..."
                  className="w-full rounded border border-[#D5D1C8] px-2.5 py-1.5 focus:border-[#C86D2C] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#E5E2DC]">
                <button
                  type="button"
                  onClick={() => setIsNewBatchModalOpen(false)}
                  className="px-3.5 py-1.5 rounded border border-[#D5D1C8] text-[#64748B] hover:text-[#181C1F] font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-[#C86D2C] hover:bg-[#B15C21] text-[#FFFFFF] font-semibold shadow-xs"
                >
                  Registrar Lote en Túnel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Finalizar Pesaje de Lote */}
      {finalizingBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#181C1F]/50 backdrop-blur-xs p-4">
          <div className="bg-[#FFFFFF] rounded-lg border border-[#E5E2DC] shadow-lg max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E2DC]">
              <h3 className="font-heading font-bold text-base text-[#181C1F]">
                Finalizar Pesaje del Lote {finalizingBatch.batchCode}
              </h3>
              <button
                onClick={() => setFinalizingBatch(null)}
                className="text-[#64748B] hover:text-[#181C1F]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {finalizeError && (
              <div className="p-3 bg-[#FBEAE8] border border-[#F5C2BE] rounded text-xs text-[#B43428]">
                {finalizeError}
              </div>
            )}

            <form onSubmit={handleFinalizeBatch} className="space-y-4 text-xs">
              <div className="p-3 bg-[#FAF8F5] border border-[#E5E2DC] rounded font-mono space-y-1">
                <div>Fruta: <strong>{finalizingBatch.fruitName}</strong></div>
                <div>Fruta fresca cargada: <strong>{finalizingBatch.freshKgUsed} kg</strong></div>
                <div>Túnel: <strong>{finalizingBatch.tunnelId}</strong></div>
              </div>

              <div>
                <label className="block text-[#181C1F] font-semibold mb-1">
                  Kilogramos Deshidratados Obtenidos (Seco Real en Báscula) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={finalizeDryKg}
                  onChange={(e) => setFinalizeDryKg(Number(e.target.value))}
                  className="w-full rounded border border-[#D5D1C8] px-2.5 py-2 font-mono font-bold text-base focus:border-[#C86D2C] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[#181C1F] font-semibold mb-1">
                  Notas de Cierre de Lote
                </label>
                <textarea
                  rows={2}
                  value={finalizeNotes}
                  onChange={(e) => setFinalizeNotes(e.target.value)}
                  placeholder="Verificación organoléptica, textura, pesaje en báscula calibrada..."
                  className="w-full rounded border border-[#D5D1C8] px-2.5 py-1.5 focus:border-[#C86D2C] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#E5E2DC]">
                <button
                  type="button"
                  onClick={() => setFinalizingBatch(null)}
                  className="px-3.5 py-1.5 rounded border border-[#D5D1C8] text-[#64748B]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-[#944601] hover:bg-[#783801] text-[#FFFFFF] font-semibold"
                >
                  Confirmar e Ingresar a Inventario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
