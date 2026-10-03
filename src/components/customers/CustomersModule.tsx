import React, { useState } from 'react';
import { Users, Plus, Search, Mail, Phone, MapPin, Eye, X, CheckCircle2, ShoppingBag } from 'lucide-react';
import { AppDatabase, fruitDesertService } from '../../services/store';
import { formatCOP, formatSimpleCOP, formatColombianDate } from '../../utils/format';
import { Customer, SaleOrder } from '../../types';

interface CustomersModuleProps {
  db: AppDatabase;
  onViewCustomerOrder?: (order: SaleOrder) => void;
}

export const CustomersModule: React.FC<CustomersModuleProps> = ({ db, onViewCustomerOrder }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Medellín, Antioquia');
  const [address, setAddress] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      fruitDesertService.saveCustomer({
        name,
        taxId,
        email,
        phone,
        city,
        address,
      });

      setIsModalOpen(false);
      setName('');
      setTaxId('');
      setEmail('');
      setPhone('');
      setAddress('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al guardar cliente.');
    }
  };

  const filteredCustomers = db.customers.filter((c) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      c.taxId.toLowerCase().includes(term) ||
      c.email.toLowerCase().includes(term) ||
      c.city.toLowerCase().includes(term)
    );
  });

  // Sales for the selected customer
  const customerOrders = selectedCustomer
    ? db.sales.filter((s) => s.customerId === selectedCustomer.id)
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-[#181C1F]">
            Directorio de Clientes
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Gestión de compradores B2B/B2C, historial de compras y aislamiento por RLS.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#94A3B8]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, NIT o ciudad..."
              className="pl-8 pr-3 py-1.5 rounded-md border border-[#E5E2DC] bg-[#FFFFFF] text-xs focus:border-[#C86D2C] focus:outline-none w-60"
            />
          </div>

          <button
            onClick={() => {
              setIsModalOpen(true);
              setErrorMsg('');
            }}
            className="flex items-center gap-2 bg-[#C86D2C] hover:bg-[#B15C21] text-[#FFFFFF] px-3.5 py-1.5 rounded-md text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Nuevo Cliente</span>
          </button>
        </div>
      </div>

      {/* Customers Cards & Table */}
      <div className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-lg overflow-hidden shadow-2xs">
        <div className="px-5 py-4 border-b border-[#E5E2DC] bg-[#FAF8F5] flex items-center justify-between">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#78716C] font-semibold">
            CLIENTES REGISTRADOS ({filteredCustomers.length})
          </span>
          <span className="text-xs font-mono text-[#64748B]">
            Aislamiento de compras garantizado por RLS
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E5E2DC] bg-[#F8F7F4] text-[#78716C] text-[10px] font-mono uppercase tracking-wider">
                <th className="py-2.5 px-4 font-semibold">NOMBRE / RAZÓN SOCIAL</th>
                <th className="py-2.5 px-4 font-semibold">CC / NIT</th>
                <th className="py-2.5 px-4 font-semibold">CONTACTO</th>
                <th className="py-2.5 px-4 font-semibold">CIUDAD & DIRECCIÓN</th>
                <th className="py-2.5 px-4 font-semibold text-center">PEDIDOS</th>
                <th className="py-2.5 px-4 font-semibold text-right">TOTAL COMPRADO</th>
                <th className="py-2.5 px-4 font-semibold text-center">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {filteredCustomers.map((cust) => (
                <tr key={cust.id} className="hover:bg-[#FAF8F5] transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-[#181C1F]">{cust.name}</div>
                    <div className="text-[11px] text-[#64748B]">Registrado: {formatColombianDate(cust.createdAt)}</div>
                  </td>
                  <td className="py-3 px-4 font-mono text-[#181C1F]">
                    {cust.taxId}
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-[#181C1F]">{cust.email}</div>
                    <div className="text-[11px] text-[#64748B] font-mono">{cust.phone}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-[#181C1F]">{cust.city}</div>
                    <div className="text-[11px] text-[#64748B]">{cust.address}</div>
                  </td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-[#181C1F]">
                    {cust.ordersCount}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-[#0F766E]">
                    {formatSimpleCOP(cust.totalSpentCop)} COP
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => setSelectedCustomer(cust)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#FAF8F5] hover:bg-[#F0EDE6] border border-[#D5D1C8] text-[#181C1F] font-semibold text-[11px] transition-colors cursor-pointer"
                    >
                      <Eye className="h-3.5 w-3.5 text-[#C86D2C]" />
                      <span>Ver Historial</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Ver Historial de Compras de Cliente */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#181C1F]/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-[#FFFFFF] rounded-lg border border-[#E5E2DC] shadow-lg max-w-2xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E2DC]">
              <div>
                <h3 className="font-heading font-bold text-base text-[#181C1F]">
                  Historial de Compras — {selectedCustomer.name}
                </h3>
                <p className="text-xs text-[#64748B]">
                  NIT/CC: {selectedCustomer.taxId} · {selectedCustomer.city}
                </p>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="text-[#64748B] hover:text-[#181C1F]">
                <X className="h-5 w-5" />
              </button>
            </div>

            {customerOrders.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#64748B]">
                Este cliente aún no registra órdenes de compra.
              </div>
            ) : (
              <div className="border border-[#E5E2DC] rounded-lg overflow-hidden divide-y divide-[#F1F5F9]">
                {customerOrders.map((order) => (
                  <div key={order.id} className="p-3.5 hover:bg-[#FAF8F5] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#944601]">{order.invoiceNumber}</span>
                        <span className="text-[#64748B] font-mono">{formatColombianDate(order.date)}</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#EAF5EB] text-[#2E6930]">
                          {order.paymentStatus}
                        </span>
                      </div>
                      <div className="mt-1 space-y-0.5">
                        {order.items.map((i, idx) => (
                          <div key={idx} className="text-[11px] text-[#475569] font-mono">
                            {i.quantity}x {i.kitName} ({formatSimpleCOP(i.unitPriceCop)})
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-mono text-[#64748B] block">TOTAL ORDEN</span>
                      <span className="font-mono font-bold text-sm text-[#181C1F]">
                        {formatSimpleCOP(order.totalCop)} COP
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-[#E5E2DC]">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-4 py-1.5 rounded bg-[#FAF8F5] border border-[#D5D1C8] text-[#181C1F] font-semibold text-xs"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Registrar Nuevo Cliente */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#181C1F]/50 backdrop-blur-xs p-4">
          <div className="bg-[#FFFFFF] rounded-lg border border-[#E5E2DC] shadow-lg max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E2DC]">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-[#C86D2C]" />
                <h3 className="font-heading font-bold text-base text-[#181C1F]">
                  Registrar Nuevo Cliente
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-[#64748B] hover:text-[#181C1F]">
                <X className="h-5 w-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-[#FBEAE8] border border-[#F5C2BE] rounded text-xs text-[#B43428]">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSaveCustomer} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#181C1F] font-semibold mb-1">
                  Nombre Completo / Razón Social *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded border border-[#D5D1C8] px-2.5 py-1.5 focus:border-[#C86D2C] focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#181C1F] font-semibold mb-1">
                    Cédula o NIT *
                  </label>
                  <input
                    type="text"
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    className="w-full rounded border border-[#D5D1C8] px-2.5 py-1.5 font-mono focus:border-[#C86D2C] focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[#181C1F] font-semibold mb-1">
                    Teléfono Celular *
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+57 3..."
                    className="w-full rounded border border-[#D5D1C8] px-2.5 py-1.5 font-mono focus:border-[#C86D2C] focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#181C1F] font-semibold mb-1">
                  Correo Electrónico *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded border border-[#D5D1C8] px-2.5 py-1.5 focus:border-[#C86D2C] focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#181C1F] font-semibold mb-1">
                    Ciudad / Municipio *
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full rounded border border-[#D5D1C8] px-2.5 py-1.5 focus:border-[#C86D2C] focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[#181C1F] font-semibold mb-1">
                    Dirección de Envío
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full rounded border border-[#D5D1C8] px-2.5 py-1.5 focus:border-[#C86D2C] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#E5E2DC]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 rounded border border-[#D5D1C8] text-[#64748B]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-[#C86D2C] hover:bg-[#B15C21] text-[#FFFFFF] font-semibold shadow-xs"
                >
                  Guardar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
