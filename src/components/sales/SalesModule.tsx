import React, { useState } from 'react';
import {
  ReceiptText,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  AlertTriangle,
  Eye,
  CheckCircle2,
  X,
  CreditCard,
  User,
} from 'lucide-react';
import { AppDatabase, fruitDesertService } from '../../services/store';
import { formatCOP, formatSimpleCOP, formatColombianDate } from '../../utils/format';
import { SaleOrder, PaymentMethod } from '../../types';
import { ReceiptModal } from './ReceiptModal';

interface SalesModuleProps {
  db: AppDatabase;
}

export const SalesModule: React.FC<SalesModuleProps> = ({ db }) => {
  const [isNewSaleOpen, setIsNewSaleOpen] = useState(false);
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<SaleOrder | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // New Sale Form State
  const [customerId, setCustomerId] = useState(db.customers[0]?.id || '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Transferencia Bancolombia');
  const [notes, setNotes] = useState('');
  const [cartItems, setCartItems] = useState<{ kitId: string; quantity: number }[]>([
    { kitId: db.kits[0]?.id || '', quantity: 2 },
  ]);
  const [errorMsg, setErrorMsg] = useState('');

  // Cart calculations
  const cartDetails = cartItems.map((item) => {
    const kit = db.kits.find((k) => k.id === item.kitId);
    const unitPrice = kit ? kit.pvpCop : 0;
    const subtotal = unitPrice * item.quantity;
    const availableStock = kit ? kit.currentStockUnits : 0;
    const isExceeded = item.quantity > availableStock;

    return {
      kit,
      quantity: item.quantity,
      unitPrice,
      subtotal,
      availableStock,
      isExceeded,
    };
  });

  const cartTotalCOP = cartDetails.reduce((acc, item) => acc + item.subtotal, 0);
  const hasStockErrors = cartDetails.some((item) => item.isExceeded);

  const handleAddItemToCart = () => {
    const availableKit = db.kits.find((k) => !cartItems.some((ci) => ci.kitId === k.id)) || db.kits[0];
    if (availableKit) {
      setCartItems([...cartItems, { kitId: availableKit.id, quantity: 1 }]);
    }
  };

  const handleRemoveItem = (index: number) => {
    setCartItems(cartItems.filter((_, idx) => idx !== index));
  };

  const handleQuantityChange = (index: number, qty: number) => {
    const updated = [...cartItems];
    updated[index].quantity = Math.max(1, qty);
    setCartItems(updated);
  };

  const handleKitSelect = (index: number, newKitId: string) => {
    const updated = [...cartItems];
    updated[index].kitId = newKitId;
    setCartItems(updated);
  };

  const handleCreateSale = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      const order = fruitDesertService.registerSale({
        customerId,
        items: cartItems,
        paymentMethod,
        notes,
      });

      setIsNewSaleOpen(false);
      setSelectedReceiptOrder(order);
      setCartItems([{ kitId: db.kits[0]?.id || '', quantity: 2 }]);
      setNotes('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al procesar la venta.');
    }
  };

  // Filter sales
  const filteredSales = db.sales.filter((s) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      s.invoiceNumber.toLowerCase().includes(term) ||
      s.customerName.toLowerCase().includes(term) ||
      s.items.some((i) => i.kitName.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-[#181C1F]">
            Ventas & Facturación Simple
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Registro de pedidos con validación de inventario en tiempo real, congelación de precios históricos y comprobantes PDF.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#94A3B8]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por factura o cliente..."
              className="pl-8 pr-3 py-1.5 rounded-md border border-[#E5E2DC] bg-[#FFFFFF] text-xs focus:border-[#C86D2C] focus:outline-none w-56"
            />
          </div>

          <button
            onClick={() => {
              setIsNewSaleOpen(true);
              setErrorMsg('');
            }}
            className="flex items-center gap-2 bg-[#C86D2C] hover:bg-[#B15C21] text-[#FFFFFF] px-3.5 py-1.5 rounded-md text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Registrar Venta</span>
          </button>
        </div>
      </div>

      {/* Sales Orders Table */}
      <div className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-lg overflow-hidden shadow-2xs">
        <div className="px-5 py-4 border-b border-[#E5E2DC] bg-[#FAF8F5] flex items-center justify-between">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#78716C] font-semibold">
            VENTAS REGISTRADAS ({filteredSales.length})
          </span>
          <span className="text-xs font-mono text-[#64748B]">
            Consecutivo Seguro Anti-duplicados
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E5E2DC] bg-[#F8F7F4] text-[#78716C] text-[10px] font-mono uppercase tracking-wider">
                <th className="py-2.5 px-4 font-semibold">CONSECUTIVO</th>
                <th className="py-2.5 px-4 font-semibold">FECHA</th>
                <th className="py-2.5 px-4 font-semibold">CLIENTE</th>
                <th className="py-2.5 px-4 font-semibold">DETALLE KITS VENDIDOS</th>
                <th className="py-2.5 px-4 font-semibold text-right">TOTAL COP</th>
                <th className="py-2.5 px-4 font-semibold text-right">COGS (COSTO)</th>
                <th className="py-2.5 px-4 font-semibold text-right">UTILIDAD BRUTA</th>
                <th className="py-2.5 px-4 font-semibold text-center">MEDIO PAGO</th>
                <th className="py-2.5 px-4 font-semibold text-center">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {filteredSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-[#FAF8F5] transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-[#944601]">
                    {sale.invoiceNumber}
                  </td>
                  <td className="py-3 px-4 text-[#64748B] font-mono">
                    {formatColombianDate(sale.date)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-[#181C1F]">{sale.customerName}</div>
                    <div className="text-[11px] text-[#64748B]">{sale.customerCity}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="space-y-0.5">
                      {sale.items.map((i, idx) => (
                        <div key={idx} className="text-[11px] text-[#475569] font-mono">
                          {i.quantity}x {i.kitName} ({formatSimpleCOP(i.unitPriceCop)})
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-[#181C1F]">
                    {formatSimpleCOP(sale.totalCop)} COP
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-[#64748B]">
                    {formatSimpleCOP(sale.totalCogsCop)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-semibold text-[#2E6930]">
                    +{formatSimpleCOP(sale.grossProfitCop)} ({sale.grossMarginPct}%)
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-[#F1F5F9] text-[#475569]">
                      {sale.paymentMethod}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => setSelectedReceiptOrder(sale)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#FAF8F5] hover:bg-[#F0EDE6] border border-[#D5D1C8] text-[#181C1F] font-semibold text-[11px] transition-colors cursor-pointer"
                      title="Ver e imprimir comprobante simple de venta"
                    >
                      <Eye className="h-3.5 w-3.5 text-[#C86D2C]" />
                      <span>Comprobante</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Registrar Venta */}
      {isNewSaleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#181C1F]/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-[#FFFFFF] rounded-lg border border-[#E5E2DC] shadow-lg max-w-2xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E2DC]">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-[#C86D2C]" />
                <h3 className="font-heading font-bold text-base text-[#181C1F]">
                  Punto de Venta — Nueva Salida Comercial
                </h3>
              </div>
              <button onClick={() => setIsNewSaleOpen(false)} className="text-[#64748B] hover:text-[#181C1F]">
                <X className="h-5 w-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-[#FBEAE8] border border-[#F5C2BE] rounded text-xs text-[#B43428] flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateSale} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#181C1F] font-semibold mb-1">
                    Cliente Registrado *
                  </label>
                  <select
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className="w-full rounded border border-[#D5D1C8] px-2.5 py-1.5 focus:border-[#C86D2C] focus:outline-none"
                    required
                  >
                    {db.customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} — {c.city} ({c.taxId})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[#181C1F] font-semibold mb-1">
                    Medio de Pago *
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full rounded border border-[#D5D1C8] px-2.5 py-1.5 focus:border-[#C86D2C] focus:outline-none"
                  >
                    <option value="Transferencia Bancolombia">Transferencia Bancolombia</option>
                    <option value="Nequi">Nequi</option>
                    <option value="Daviplata">Daviplata</option>
                    <option value="Efectivo">Efectivo contra entrega</option>
                    <option value="Tarjeta Débito/Crédito">Tarjeta Débito/Crédito</option>
                  </select>
                </div>
              </div>

              {/* Cart line items */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-[#181C1F]">Kits y Presentaciones a Vender</span>
                  <button
                    type="button"
                    onClick={handleAddItemToCart}
                    className="text-[11px] text-[#944601] hover:text-[#783801] font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Agregar otro kit</span>
                  </button>
                </div>

                <div className="border border-[#E5E2DC] rounded-lg overflow-hidden divide-y divide-[#F1F5F9]">
                  {cartDetails.map((item, idx) => (
                    <div key={idx} className="p-3 bg-[#FFFFFF] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1">
                        <select
                          value={item.kit?.id || ''}
                          onChange={(e) => handleKitSelect(idx, e.target.value)}
                          className="w-full rounded border border-[#D5D1C8] px-2 py-1 focus:border-[#C86D2C] focus:outline-none"
                        >
                          {db.kits.map((k) => (
                            <option key={k.id} value={k.id}>
                              {k.name} ({k.presentation}) — PVP: {formatSimpleCOP(k.pvpCop)} | Stock: {k.currentStockUnits} und
                            </option>
                          ))}
                        </select>
                        {item.isExceeded && (
                          <div className="text-[10px] text-[#B43428] font-semibold mt-1">
                            ¡Inventario insuficiente! Solo hay {item.availableStock} unidades disponibles.
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div>
                          <label className="text-[10px] text-[#64748B] block">Cantidad</label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleQuantityChange(idx, Number(e.target.value))}
                            className="w-20 rounded border border-[#D5D1C8] px-2 py-1 font-mono font-bold text-center focus:border-[#C86D2C] focus:outline-none"
                          />
                        </div>

                        <div className="text-right min-w-[90px]">
                          <label className="text-[10px] text-[#64748B] block">Subtotal</label>
                          <span className="font-mono font-bold text-[#181C1F]">
                            {formatSimpleCOP(item.subtotal)}
                          </span>
                        </div>

                        {cartItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1 text-[#94A3B8] hover:text-[#DC2626] transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Summary */}
              <div className="p-3.5 bg-[#FAF8F5] border border-[#E5E2DC] rounded-lg flex items-center justify-between font-mono">
                <div>
                  <span className="text-[10px] text-[#78716C] uppercase font-bold block">
                    TOTAL A COBRAR
                  </span>
                  <span className="text-xl font-bold text-[#944601]">
                    {formatSimpleCOP(cartTotalCOP)} COP
                  </span>
                </div>
                <div className="text-right text-[11px] text-[#64748B]">
                  El precio de venta y costo unitario se congelan históricamente.
                </div>
              </div>

              <div>
                <label className="block text-[#181C1F] font-semibold mb-1">
                  Notas de Despacho
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Instrucciones para mensajería o empaque de regalo..."
                  className="w-full rounded border border-[#D5D1C8] px-2.5 py-1.5 focus:border-[#C86D2C] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#E5E2DC]">
                <button
                  type="button"
                  onClick={() => setIsNewSaleOpen(false)}
                  className="px-3.5 py-1.5 rounded border border-[#D5D1C8] text-[#64748B]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={hasStockErrors || cartItems.length === 0}
                  className={`px-4 py-1.5 rounded font-semibold text-[#FFFFFF] shadow-xs ${
                    !hasStockErrors && cartItems.length > 0
                      ? 'bg-[#C86D2C] hover:bg-[#B15C21] cursor-pointer'
                      : 'bg-[#94A3B8] cursor-not-allowed'
                  }`}
                >
                  Confirmar Venta y Generar Recibo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      {selectedReceiptOrder && (
        <ReceiptModal
          order={selectedReceiptOrder}
          onClose={() => setSelectedReceiptOrder(null)}
        />
      )}
    </div>
  );
};
