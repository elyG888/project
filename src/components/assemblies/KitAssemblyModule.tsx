import React, { useState } from 'react';
import { Layers, Plus, CheckCircle2, AlertTriangle, ArrowRight, X } from 'lucide-react';
import { AppDatabase, fruitDesertService } from '../../services/store';
import { formatCOP, formatSimpleCOP, formatGrams, formatColombianDate } from '../../utils/format';

interface KitAssemblyModuleProps {
  db: AppDatabase;
  initialKitId?: string;
}

export const KitAssemblyModule: React.FC<KitAssemblyModuleProps> = ({ db, initialKitId }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedKitId, setSelectedKitId] = useState(initialKitId || db.kits[0]?.id || '');
  const [quantityUnits, setQuantityUnits] = useState<number>(20);
  const [assemblyNotes, setAssemblyNotes] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  const currentKit = db.kits.find((k) => k.id === selectedKitId);

  // Check inventory feasibility for each ingredient in the BOM
  const ingredientsFeasibility = currentKit
    ? currentKit.recipe.map((ing) => {
        const dehid = db.dehydratedFruits.find((df) => df.id === ing.dehydratedFruitId);
        const availableKg = dehid ? dehid.currentStockKg : 0;
        const availableGrams = availableKg * 1000;
        const requiredGrams = ing.gramsNeeded * quantityUnits;
        const isSufficient = availableGrams >= requiredGrams;

        return {
          id: ing.id,
          fruitName: ing.dehydratedFruitName,
          gramsPerKit: ing.gramsNeeded,
          totalRequiredGrams: requiredGrams,
          availableGrams,
          availableKg,
          isSufficient,
        };
      })
    : [];

  const canAssemble = ingredientsFeasibility.length > 0 && ingredientsFeasibility.every((i) => i.isSufficient);

  const handleAssemble = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const result = fruitDesertService.assembleKits(
        selectedKitId,
        quantityUnits,
        assemblyNotes
      );

      setSuccessMsg(`¡Éxito! Se armaron ${result.quantityProduced} unidades de ${result.kitName} (${result.assemblyCode}).`);
      setIsModalOpen(false);
      setAssemblyNotes('');
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error durante el ensamble del kit.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-[#181C1F]">
            Ensamble y Armado de Kits
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Transformación de frutas deshidratadas a kits terminados según receta industrial (BOM).
          </p>
        </div>

        <button
          onClick={() => {
            setIsModalOpen(true);
            setErrorMsg('');
          }}
          className="flex items-center gap-2 bg-[#C86D2C] hover:bg-[#B15C21] text-[#FFFFFF] px-3.5 py-1.5 rounded-md text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Nueva Orden de Ensamble</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3 bg-[#EAF5EB] border border-[#CDE6CF] rounded-lg text-xs text-[#2E6930] flex items-center gap-2 font-medium">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Assembly Workstations / Kits Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {db.kits.map((kit) => {
          const costInfo = fruitDesertService.calculateKitCost(kit);

          // Calculate max units that could be assembled with current dry stock
          const maxPossibleUnits = Math.min(
            ...kit.recipe.map((ing) => {
              const df = db.dehydratedFruits.find((x) => x.id === ing.dehydratedFruitId);
              if (!df || ing.gramsNeeded === 0) return 0;
              return Math.floor((df.currentStockKg * 1000) / ing.gramsNeeded);
            })
          );

          return (
            <div key={kit.id} className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-lg p-4 flex flex-col justify-between shadow-2xs">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="font-mono text-[11px] font-bold text-[#944601]">{kit.code}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#F1F5F9] text-[#475569]">
                    {kit.category}
                  </span>
                </div>
                <h3 className="font-bold text-sm text-[#181C1F]">{kit.name}</h3>
                <p className="text-[11px] text-[#64748B] mb-3">{kit.presentation}</p>

                <div className="space-y-1 py-2 border-y border-[#F1F5F9] text-xs font-mono">
                  <div className="flex justify-between text-[#64748B]">
                    <span>Stock Actual:</span>
                    <strong className="text-[#181C1F]">{kit.currentStockUnits} und</strong>
                  </div>
                  <div className="flex justify-between text-[#64748B]">
                    <span>Capacidad Inmediata:</span>
                    <strong className="text-[#2E6930]">+{maxPossibleUnits} und</strong>
                  </div>
                  <div className="flex justify-between text-[#64748B]">
                    <span>Costo Unitario:</span>
                    <span className="text-[#181C1F]">${costInfo.totalCostCop.toLocaleString('es-CO')}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-2">
                <button
                  onClick={() => {
                    setSelectedKitId(kit.id);
                    setQuantityUnits(20);
                    setIsModalOpen(true);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded bg-[#FAF8F5] hover:bg-[#F0EDE6] border border-[#D5D1C8] text-xs font-semibold text-[#181C1F] transition-colors cursor-pointer"
                >
                  <Layers className="h-3.5 w-3.5 text-[#C86D2C]" />
                  <span>Armar Lote</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Assembly History Table */}
      <div className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-lg overflow-hidden shadow-2xs">
        <div className="px-5 py-4 border-b border-[#E5E2DC] bg-[#FAF8F5] flex items-center justify-between">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#78716C] font-semibold">
            HISTORIAL DE ENSAMBLES EN PLANTA ({db.assemblies.length})
          </span>
          <span className="text-xs font-mono text-[#64748B]">
            Kardex de Producción
          </span>
        </div>

        {db.assemblies.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#64748B]">
            No se han registrado ensambles manuales adicionales en esta sesión. Puedes crear uno usando el botón superior.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E5E2DC] bg-[#F8F7F4] text-[#78716C] text-[10px] font-mono uppercase tracking-wider">
                  <th className="py-2.5 px-4 font-semibold">ORDEN</th>
                  <th className="py-2.5 px-4 font-semibold">FECHA</th>
                  <th className="py-2.5 px-4 font-semibold">PRODUCTO / PRESENTACIÓN</th>
                  <th className="py-2.5 px-4 font-semibold text-right">UNIDADES ARMADAS</th>
                  <th className="py-2.5 px-4 font-semibold text-right">COSTO TOTAL</th>
                  <th className="py-2.5 px-4 font-semibold text-right">COSTO UNITARIO</th>
                  <th className="py-2.5 px-4 font-semibold">OPERADOR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {db.assemblies.map((a) => (
                  <tr key={a.id} className="hover:bg-[#FAF8F5]">
                    <td className="py-3 px-4 font-mono font-bold text-[#181C1F]">{a.assemblyCode}</td>
                    <td className="py-3 px-4 font-mono text-[#64748B]">{formatColombianDate(a.date)}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#181C1F]">{a.kitName}</div>
                      <div className="text-[11px] text-[#64748B]">{a.presentation}</div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-[#2E6930]">
                      +{a.quantityProduced} und
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-[#181C1F]">
                      {formatSimpleCOP(a.totalCostCop)} COP
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-[#64748B]">
                      {formatSimpleCOP(a.unitCostCop)}/und
                    </td>
                    <td className="py-3 px-4 text-[#64748B]">{a.operatorName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Armar Kits */}
      {isModalOpen && currentKit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#181C1F]/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-[#FFFFFF] rounded-lg border border-[#E5E2DC] shadow-lg max-w-xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E2DC]">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-[#C86D2C]" />
                <h3 className="font-heading font-bold text-base text-[#181C1F]">
                  Armado de Kit: {currentKit.name}
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-[#64748B] hover:text-[#181C1F]">
                <X className="h-5 w-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-[#FBEAE8] border border-[#F5C2BE] rounded text-xs text-[#B43428] flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleAssemble} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#181C1F] font-semibold mb-1">
                    Seleccionar Kit Comercial *
                  </label>
                  <select
                    value={selectedKitId}
                    onChange={(e) => setSelectedKitId(e.target.value)}
                    className="w-full rounded border border-[#D5D1C8] px-2.5 py-1.5 focus:border-[#C86D2C] focus:outline-none"
                  >
                    {db.kits.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.name} ({k.presentation})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[#181C1F] font-semibold mb-1">
                    Cantidad de Kits a Fabricar (Unidades) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={quantityUnits}
                    onChange={(e) => setQuantityUnits(Math.max(1, Number(e.target.value)))}
                    className="w-full rounded border border-[#D5D1C8] px-2.5 py-1.5 font-mono font-bold focus:border-[#C86D2C] focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Recipe BOM Verification Table */}
              <div className="border border-[#E5E2DC] rounded-lg overflow-hidden">
                <div className="px-3 py-2 bg-[#FAF8F5] border-b border-[#E5E2DC] font-mono text-[10px] uppercase font-bold text-[#78716C]">
                  VERIFICACIÓN DE MATERIA PRIMA REQUERIDA (BOM)
                </div>
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-[#F8F7F4] text-[#64748B] text-[10px] font-mono">
                      <th className="py-1.5 px-3">FRUTA DESHIDRATADA</th>
                      <th className="py-1.5 px-3 text-right">POR KIT</th>
                      <th className="py-1.5 px-3 text-right">TOTAL REQUERIDO</th>
                      <th className="py-1.5 px-3 text-right">DISPONIBLE EN BODEGA</th>
                      <th className="py-1.5 px-3 text-center">ESTADO</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9]">
                    {ingredientsFeasibility.map((ing) => (
                      <tr key={ing.id} className="hover:bg-[#FAF8F5]">
                        <td className="py-2 px-3 font-medium text-[#181C1F]">{ing.fruitName}</td>
                        <td className="py-2 px-3 text-right font-mono text-[#64748B]">{ing.gramsPerKit} g</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-[#181C1F]">
                          {formatGrams(ing.totalRequiredGrams)} ({(ing.totalRequiredGrams / 1000).toFixed(2)} kg)
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-[#64748B]">
                          {ing.availableKg.toFixed(2)} kg
                        </td>
                        <td className="py-2 px-3 text-center">
                          {ing.isSufficient ? (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#EAF5EB] text-[#2E6930]">
                              Suficiente
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#FBEAE8] text-[#B43428]">
                              Insuficiente
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                <label className="block text-[#181C1F] font-semibold mb-1">
                  Notas de Ensamble y Lote
                </label>
                <textarea
                  rows={2}
                  value={assemblyNotes}
                  onChange={(e) => setAssemblyNotes(e.target.value)}
                  placeholder="Mesa de empaque 1, termosellado verificado, fecha de vencimiento impresa..."
                  className="w-full rounded border border-[#D5D1C8] px-2.5 py-1.5 focus:border-[#C86D2C] focus:outline-none"
                />
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-[#E5E2DC]">
                <div className="text-[11px] font-mono text-[#64748B]">
                  Empaque unitario: ${db.indirectCost.packagingBaseCop} COP
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-3.5 py-1.5 rounded border border-[#D5D1C8] text-[#64748B]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={!canAssemble}
                    className={`px-4 py-1.5 rounded font-semibold text-[#FFFFFF] shadow-xs ${
                      canAssemble
                        ? 'bg-[#C86D2C] hover:bg-[#B15C21] cursor-pointer'
                        : 'bg-[#94A3B8] cursor-not-allowed'
                    }`}
                  >
                    Confirmar Ensamble
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
