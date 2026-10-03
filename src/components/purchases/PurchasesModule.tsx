import React, { useState } from 'react';
import { ShoppingCart, Plus, Calendar, AlertTriangle, X, CheckCircle2, Sparkles, MapPin } from 'lucide-react';
import { AppDatabase, fruitDesertService } from '../../services/store';
import { formatSimpleCOP, formatKilograms, formatColombianDate } from '../../utils/format';

interface PurchasesModuleProps {
  db: AppDatabase;
}

export const PurchasesModule: React.FC<PurchasesModuleProps> = ({ db }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewFruitModalOpen, setIsNewFruitModalOpen] = useState(false);
  const [selectedFruitFilter, setSelectedFruitFilter] = useState('ALL');

  // Purchase Form State
  const [purchaseDate, setPurchaseDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [plazaMercado, setPlazaMercado] = useState('Central Mayorista de Antioquia');
  const [fruitId, setFruitId] = useState(db.fruits[0]?.id || '');
  const [quantityKg, setQuantityKg] = useState<number>(100);
  const [totalCostCop, setTotalCostCop] = useState<number>(320000);
  const [invoiceRef, setInvoiceRef] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // New Fruit Form State (alimentar select de frutas)
  const [newFruitName, setNewFruitName] = useState('');
  const [newFruitVariety, setNewFruitVariety] = useState('');
  const [newFruitOrigin, setNewFruitOrigin] = useState('Plaza Mayorista');
  const [newFruitShrinkage, setNewFruitShrinkage] = useState<number>(85);
  const [newFruitCost, setNewFruitCost] = useState<number>(3000);
  const [newFruitError, setNewFruitError] = useState('');

  const autoUnitCost = quantityKg > 0 ? Math.round(totalCostCop / quantityKg) : 0;

  const handleRegisterPurchase = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      fruitDesertService.registerPurchase({
        date: purchaseDate,
        plazaMercado,
        fruitId,
        quantityKg,
        totalCostCop,
        invoiceRef,
        notes,
      });

      setSuccessMsg('¡Compra registrada correctamente en el inventario de fruta fresca!');
      setIsModalOpen(false);
      setInvoiceRef('');
      setNotes('');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al registrar la compra.');
    }
  };

  const handleCreateNewFruit = (e: React.FormEvent) => {
    e.preventDefault();
    setNewFruitError('');

    try {
      const created = fruitDesertService.registerNewFruit({
        name: newFruitName,
        variety: newFruitVariety || 'Criolla / Estándar',
        origin: newFruitOrigin || plazaMercado,
        expectedShrinkagePct: newFruitShrinkage,
        initialCostPerKgCop: newFruitCost,
      });

      // Automatically select the new fruit
      setFruitId(created.id);
      setIsNewFruitModalOpen(false);
      setNewFruitName('');
      setNewFruitVariety('');
    } catch (err: any) {
      setNewFruitError(err.message || 'Error al registrar la fruta.');
    }
  };

  const filteredPurchases = db.purchases.filter((p) => {
    if (selectedFruitFilter !== 'ALL' && p.fruitId !== selectedFruitFilter) return false;
    return true;
  });

  const totalSpent = filteredPurchases.reduce((acc, p) => acc + p.totalCostCop, 0);
  const totalKg = filteredPurchases.reduce((acc, p) => acc + p.quantityKg, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold font-heading text-[#181C1F]">
            Compras en Plaza de Mercado
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Registro de fruta fresca comprada en plaza o central de abastos. El precio por kilo se calcula automáticamente.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedFruitFilter}
            onChange={(e) => setSelectedFruitFilter(e.target.value)}
            className="bg-[#FFFFFF] border border-[#E5E2DC] px-3 py-1.5 rounded-lg text-xs font-medium text-[#1E293B] focus:outline-none"
          >
            <option value="ALL">Todas las frutas ({db.fruits.length})</option>
            {db.fruits.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => {
              setIsModalOpen(true);
              setErrorMsg('');
            }}
            className="flex items-center gap-2 bg-[#C86D2C] hover:bg-[#B15C21] text-[#FFFFFF] px-4 py-2 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Registrar Compra</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-[#EAF5EB] border border-[#CDE6CF] rounded-lg text-xs text-[#2E6930] flex items-center gap-2 font-medium">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Clean Metric Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl shadow-2xs">
          <span className="text-[11px] font-mono uppercase text-[#78716C] block">
            TOTAL INVERTIDO EN PLAZA
          </span>
          <span className="text-xl font-bold font-mono text-[#944601]">
            {formatSimpleCOP(totalSpent)} COP
          </span>
        </div>

        <div className="p-4 bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl shadow-2xs">
          <span className="text-[11px] font-mono uppercase text-[#78716C] block">
            KILOGRAMOS COMPRADOS
          </span>
          <span className="text-xl font-bold font-mono text-[#181C1F]">
            {formatKilograms(totalKg)}
          </span>
        </div>

        <div className="p-4 bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl shadow-2xs">
          <span className="text-[11px] font-mono uppercase text-[#78716C] block">
            COMPRAS REGISTRADAS
          </span>
          <span className="text-xl font-bold font-mono text-[#2E6930]">
            {filteredPurchases.length} compras
          </span>
        </div>
      </div>

      {/* Clean Purchases Table */}
      <div className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl overflow-hidden shadow-2xs">
        <div className="px-5 py-3.5 border-b border-[#E5E2DC] bg-[#FAF8F5] flex items-center justify-between">
          <span className="text-xs font-mono font-bold uppercase text-[#78716C]">
            HISTORIAL DE COMPRAS ({filteredPurchases.length})
          </span>
          <span className="text-[11px] text-[#64748B]">
            Entradas a inventario de fruta fresca
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E5E2DC] bg-[#F8F7F4] text-[#78716C] text-[10px] font-mono uppercase">
                <th className="py-2.5 px-4 font-semibold">CÓDIGO</th>
                <th className="py-2.5 px-4 font-semibold">FECHA</th>
                <th className="py-2.5 px-4 font-semibold">FRUTA COMPRADA</th>
                <th className="py-2.5 px-4 font-semibold">PLAZA DE MERCADO / PUESTO</th>
                <th className="py-2.5 px-4 font-semibold text-right">CANTIDAD (KG)</th>
                <th className="py-2.5 px-4 font-semibold text-right">TOTAL PAGADO</th>
                <th className="py-2.5 px-4 font-semibold text-right">PRECIO / KG</th>
                <th className="py-2.5 px-4 font-semibold">REGISTRADO POR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {filteredPurchases.map((p) => (
                <tr key={p.id} className="hover:bg-[#FAF8F5] transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-[#181C1F]">
                    {p.purchaseCode}
                  </td>
                  <td className="py-3 px-4 text-[#64748B] font-mono">
                    {formatColombianDate(p.date)}
                  </td>
                  <td className="py-3 px-4 font-semibold text-[#181C1F]">
                    {p.fruitName}
                  </td>
                  <td className="py-3 px-4 text-[#475569]">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-[#C86D2C] shrink-0" />
                      <span>{p.plazaMercado}</span>
                    </div>
                    {p.invoiceRef && (
                      <span className="text-[10px] text-[#64748B] font-mono block pl-5">
                        Ref: {p.invoiceRef}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-[#181C1F]">
                    {formatKilograms(p.quantityKg)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-[#181C1F]">
                    {formatSimpleCOP(p.totalCostCop)} COP
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-[#944601] font-bold">
                    {formatSimpleCOP(p.unitCostPerKgCop)}/kg
                  </td>
                  <td className="py-3 px-4 text-[#64748B]">
                    {p.receivedBy}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Registrar Compra en Plaza */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#181C1F]/50 backdrop-blur-xs p-4">
          <div className="bg-[#FFFFFF] rounded-xl border border-[#E5E2DC] shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E2DC]">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-[#C86D2C]" />
                <h3 className="font-heading font-bold text-base text-[#181C1F]">
                  Registrar Compra en Plaza
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#64748B] hover:text-[#181C1F]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-[#FBEAE8] border border-[#F5C2BE] rounded-lg text-xs text-[#B43428] flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleRegisterPurchase} className="space-y-4 text-xs">
              {/* Fecha de compra & Plaza */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#181C1F] font-semibold mb-1">
                    Fecha de Compra *
                  </label>
                  <input
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full rounded-lg border border-[#D5D1C8] px-3 py-1.5 font-mono focus:border-[#C86D2C] focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[#181C1F] font-semibold mb-1">
                    Plaza de Mercado / Sector *
                  </label>
                  <input
                    type="text"
                    value={plazaMercado}
                    onChange={(e) => setPlazaMercado(e.target.value)}
                    placeholder="Ej: Central Mayorista Bloque Naranjo"
                    className="w-full rounded-lg border border-[#D5D1C8] px-3 py-1.5 focus:border-[#C86D2C] focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Fruta Selection with button to ADD NEW FRUIT */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[#181C1F] font-semibold">
                    Fruta Fresca *
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsNewFruitModalOpen(true)}
                    className="text-[11px] text-[#944601] hover:text-[#783801] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>+ Agregar nueva fruta</span>
                  </button>
                </div>
                <select
                  value={fruitId}
                  onChange={(e) => setFruitId(e.target.value)}
                  className="w-full rounded-lg border border-[#D5D1C8] px-3 py-2 text-xs focus:border-[#C86D2C] focus:outline-none"
                  required
                >
                  {db.fruits.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} (Stock actual: {f.currentStockKg} kg · Merma aprox: {f.expectedShrinkagePct}%)
                    </option>
                  ))}
                </select>
              </div>

              {/* Cantidad y Costo Total */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#181C1F] font-semibold mb-1">
                    Cantidad Comprada (kg) *
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    value={quantityKg}
                    onChange={(e) => setQuantityKg(Number(e.target.value))}
                    className="w-full rounded-lg border border-[#D5D1C8] px-3 py-1.5 font-mono font-bold focus:border-[#C86D2C] focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[#181C1F] font-semibold mb-1">
                    Total Pagado ($ COP) *
                  </label>
                  <input
                    type="number"
                    step="1000"
                    min="1000"
                    value={totalCostCop}
                    onChange={(e) => setTotalCostCop(Number(e.target.value))}
                    className="w-full rounded-lg border border-[#D5D1C8] px-3 py-1.5 font-mono font-bold focus:border-[#C86D2C] focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Automatic Price Per Kg Calculation Box */}
              <div className="p-3 bg-[#FAF8F5] border border-[#E5E2DC] rounded-lg flex items-center justify-between font-mono">
                <div>
                  <span className="text-[10px] text-[#78716C] uppercase font-bold block">
                    PRECIO POR KG CALCULADO
                  </span>
                  <span className="text-lg font-bold text-[#944601]">
                    {formatSimpleCOP(autoUnitCost)} COP / kg
                  </span>
                </div>
                <div className="text-right text-[11px] text-[#64748B]">
                  = Total Pagado / {quantityKg} kg
                </div>
              </div>

              {/* Recibo / Puesto / Notas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#181C1F] font-semibold mb-1">
                    Puesto / Recibo Simple (Opcional)
                  </label>
                  <input
                    type="text"
                    value={invoiceRef}
                    onChange={(e) => setInvoiceRef(e.target.value)}
                    placeholder="Ej: Puesto 14, Local 3"
                    className="w-full rounded-lg border border-[#D5D1C8] px-3 py-1.5 focus:border-[#C86D2C] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[#181C1F] font-semibold mb-1">
                    Notas Rápidas
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ej: Fruta madura, buen calibre"
                    className="w-full rounded-lg border border-[#D5D1C8] px-3 py-1.5 focus:border-[#C86D2C] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#E5E2DC]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[#D5D1C8] text-[#64748B] hover:text-[#181C1F]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#C86D2C] hover:bg-[#B15C21] text-[#FFFFFF] font-semibold shadow-xs"
                >
                  Guardar Compra
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Crear Nueva Fruta (Alimentar Select) */}
      {isNewFruitModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-[#181C1F]/60 backdrop-blur-xs p-4">
          <div className="bg-[#FFFFFF] rounded-xl border border-[#E5E2DC] shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E2DC]">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[#C86D2C]" />
                <h3 className="font-heading font-bold text-base text-[#181C1F]">
                  Agregar Fruta al Catálogo
                </h3>
              </div>
              <button
                onClick={() => setIsNewFruitModalOpen(false)}
                className="text-[#64748B] hover:text-[#181C1F]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {newFruitError && (
              <div className="p-3 bg-[#FBEAE8] border border-[#F5C2BE] rounded-lg text-xs text-[#B43428]">
                {newFruitError}
              </div>
            )}

            <form onSubmit={handleCreateNewFruit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[#181C1F] font-semibold mb-1">
                  Nombre de la Fruta *
                </label>
                <input
                  type="text"
                  value={newFruitName}
                  onChange={(e) => setNewFruitName(e.target.value)}
                  placeholder="Ej: Mora, Papaya, Maracuyá, Pitahaya..."
                  className="w-full rounded-lg border border-[#D5D1C8] px-3 py-2 text-xs focus:border-[#C86D2C] focus:outline-none"
                  required
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#181C1F] font-semibold mb-1">
                    Variedad (Opcional)
                  </label>
                  <input
                    type="text"
                    value={newFruitVariety}
                    onChange={(e) => setNewFruitVariety(e.target.value)}
                    placeholder="Ej: Criolla, Castilla"
                    className="w-full rounded-lg border border-[#D5D1C8] px-3 py-1.5 focus:border-[#C86D2C] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[#181C1F] font-semibold mb-1">
                    Origen / Plaza
                  </label>
                  <input
                    type="text"
                    value={newFruitOrigin}
                    onChange={(e) => setNewFruitOrigin(e.target.value)}
                    className="w-full rounded-lg border border-[#D5D1C8] px-3 py-1.5 focus:border-[#C86D2C] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#181C1F] font-semibold mb-1">
                    Merma de Secado Estimada (%) *
                  </label>
                  <input
                    type="number"
                    min="50"
                    max="98"
                    step="0.5"
                    value={newFruitShrinkage}
                    onChange={(e) => setNewFruitShrinkage(Number(e.target.value))}
                    className="w-full rounded-lg border border-[#D5D1C8] px-3 py-1.5 font-mono focus:border-[#C86D2C] focus:outline-none"
                    required
                  />
                  <span className="text-[10px] text-[#64748B]">
                    Típico: 85% a 90% agua
                  </span>
                </div>

                <div>
                  <label className="block text-[#181C1F] font-semibold mb-1">
                    Precio Estimado ($ COP / kg)
                  </label>
                  <input
                    type="number"
                    min="500"
                    step="100"
                    value={newFruitCost}
                    onChange={(e) => setNewFruitCost(Number(e.target.value))}
                    className="w-full rounded-lg border border-[#D5D1C8] px-3 py-1.5 font-mono focus:border-[#C86D2C] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E5E2DC]">
                <button
                  type="button"
                  onClick={() => setIsNewFruitModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-[#D5D1C8] text-[#64748B]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#944601] hover:bg-[#783801] text-[#FFFFFF] font-semibold"
                >
                  Guardar y Seleccionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
