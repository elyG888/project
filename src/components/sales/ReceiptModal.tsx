import React, { useRef } from 'react';
import { X, Printer, Download, CheckCircle2 } from 'lucide-react';
import { SaleOrder } from '../../types';
import { formatCOP, formatSimpleCOP, formatColombianDate, formatColombianDateTime } from '../../utils/format';
import { Logo } from '../common/Logo';
import jsPDF from 'jspdf';

interface ReceiptModalProps {
  order: SaleOrder;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ order, onClose }) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Header Brand
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(24, 28, 31);
      doc.text('FRUIT DESERT S.A.S.', 20, 25);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text('Infusiones · Coctelería Botánica · Snacks Deshidratados', 20, 31);
      doc.text('NIT: 901.765.432-1 | Régimen Simple de Tributación', 20, 36);
      doc.text('Cra 43A # 18 Sur - 45, El Poblado, Medellín, Antioquia', 20, 41);
      doc.text('Tel: +57 312 845 9012 | www.fruitdesert.com', 20, 46);

      // Consecutivo & Date Box
      doc.setDrawColor(229, 226, 220);
      doc.setFillColor(250, 248, 245);
      doc.roundedRect(125, 18, 65, 30, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(148, 70, 1);
      doc.text(order.invoiceNumber, 130, 27);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('COMPROBANTE SIMPLE DE VENTA', 130, 33);
      doc.text(`Fecha: ${formatColombianDate(order.date)}`, 130, 38);
      doc.text(`Estado: ${order.paymentStatus}`, 130, 43);

      // Divider
      doc.setDrawColor(229, 226, 220);
      doc.line(20, 52, 190, 52);

      // Customer Info
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(24, 28, 31);
      doc.text('INFORMACIÓN DEL CLIENTE:', 20, 60);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`Cliente: ${order.customerName}`, 20, 66);
      doc.text(`NIT / CC: ${order.customerTaxId || 'Consumidor Final'}`, 20, 71);
      doc.text(`Teléfono: ${order.customerPhone || 'N/A'}`, 20, 76);
      doc.text(`Ciudad: ${order.customerCity || 'Colombia'}`, 110, 66);
      doc.text(`Dirección: ${order.customerAddress || 'Entrega en tienda'}`, 110, 71);
      doc.text(`Medio de Pago: ${order.paymentMethod}`, 110, 76);

      // Table Header
      let y = 88;
      doc.setFillColor(241, 245, 249);
      doc.rect(20, y, 170, 8, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text('DESCRIPCIÓN / PRODUCTO', 23, y + 5);
      doc.text('CANT', 115, y + 5);
      doc.text('PRECIO UNIT.', 135, y + 5);
      doc.text('TOTAL (COP)', 165, y + 5);

      y += 12;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(24, 28, 31);

      order.items.forEach((item) => {
        doc.text(`${item.kitName} (${item.presentation})`, 23, y);
        doc.text(`${item.quantity} und`, 115, y);
        doc.text(formatSimpleCOP(item.unitPriceCop), 135, y);
        doc.text(formatSimpleCOP(item.subtotalCop), 165, y);
        y += 7;
      });

      // Totals Box
      y += 5;
      doc.line(20, y, 190, y);
      y += 8;

      doc.setFont('helvetica', 'normal');
      doc.text('Subtotal:', 130, y);
      doc.text(formatSimpleCOP(order.subtotalCop), 165, y);
      y += 6;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(148, 70, 1);
      doc.text('TOTAL A PAGAR:', 120, y);
      doc.text(`${formatSimpleCOP(order.totalCop)} COP`, 155, y);

      // Footer disclaimer
      y += 20;
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text('Este documento es un comprobante interno simple de venta emitido por Fruit Desert.', 20, y);
      doc.text('No constituye factura electrónica reglamentada por la DIAN. Conserve este recibo.', 20, y + 4);
      doc.text(`Atendido por: ${order.cashierName} | Emitido: ${formatColombianDateTime(order.createdAt)}`, 20, y + 8);

      doc.save(`${order.invoiceNumber}_Fruit_Desert.pdf`);
    } catch (err) {
      console.error('Error generating PDF', err);
      window.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#181C1F]/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-[#FFFFFF] rounded-xl border border-[#E5E2DC] shadow-2xl max-w-2xl w-full p-6 space-y-6">
        {/* Action Top Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E5E2DC] no-print">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#2E6930]">
            <CheckCircle2 className="h-4 w-4" />
            <span>Venta Registrada Exitosamente en Kardex</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#CBD5E1] bg-[#FFFFFF] hover:bg-[#F8FAFC] text-xs font-semibold text-[#1E293B] transition-colors cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5 text-[#64748B]" />
              <span>Imprimir</span>
            </button>
            <button
              onClick={handleDownloadPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#944601] hover:bg-[#783801] text-xs font-semibold text-[#FFFFFF] shadow-xs transition-colors cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Descargar PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-[#64748B] hover:text-[#181C1F] rounded-lg transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Printable Voucher Body */}
        <div ref={receiptRef} className="p-6 bg-[#FFFFFF] border border-[#E5E2DC] rounded-lg shadow-2xs space-y-6 text-[#181C1F]">
          {/* Header Brand */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-[#E5E2DC]">
            <div>
              <Logo size="md" />
              <div className="text-[11px] text-[#64748B] mt-2 space-y-0.5">
                <p className="font-semibold text-[#181C1F]">Fruit Desert S.A.S.</p>
                <p>NIT: 901.765.432-1 · Régimen Simple de Tributación</p>
                <p>Cra 43A # 18 Sur - 45, Medellín, Colombia</p>
                <p>Teléfono: +57 312 845 9012 · www.fruitdesert.com</p>
              </div>
            </div>

            <div className="text-right bg-[#FAF8F5] p-3 rounded border border-[#E5E2DC] sm:min-w-[190px]">
              <div className="text-[10px] font-mono uppercase text-[#78716C] font-semibold">
                COMPROBANTE DE VENTA
              </div>
              <div className="text-base font-mono font-bold text-[#944601]">
                {order.invoiceNumber}
              </div>
              <div className="text-[11px] text-[#64748B] font-mono mt-1">
                Fecha: {formatColombianDate(order.date)}
              </div>
              <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#EAF5EB] text-[#2E6930]">
                {order.paymentStatus}
              </span>
            </div>
          </div>

          {/* Customer & Order Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-[#FAF8F5] p-3.5 rounded border border-[#E5E2DC]">
            <div>
              <span className="font-mono text-[10px] uppercase text-[#78716C] block font-semibold mb-1">
                DATOS DEL CLIENTE
              </span>
              <p className="font-bold text-[#181C1F]">{order.customerName}</p>
              <p className="text-[#64748B]">CC / NIT: {order.customerTaxId || 'Consumidor Final'}</p>
              <p className="text-[#64748B]">Tel: {order.customerPhone || 'N/A'}</p>
            </div>
            <div>
              <span className="font-mono text-[10px] uppercase text-[#78716C] block font-semibold mb-1">
                DATOS DE ENTREGA Y PAGO
              </span>
              <p className="text-[#64748B]">Ciudad: {order.customerCity || 'Colombia'}</p>
              <p className="text-[#64748B]">Dirección: {order.customerAddress || 'Entrega en tienda'}</p>
              <p className="text-[#181C1F] font-medium">Pago: {order.paymentMethod}</p>
            </div>
          </div>

          {/* Line items table with frozen prices */}
          <div className="border border-[#E5E2DC] rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#F8F7F4] text-[#64748B] text-[10px] font-mono uppercase border-b border-[#E5E2DC]">
                  <th className="py-2 px-3">PRODUCTO / PRESENTACIÓN</th>
                  <th className="py-2 px-3 text-center">CANT</th>
                  <th className="py-2 px-3 text-right">PRECIO UNITARIO</th>
                  <th className="py-2 px-3 text-right">SUBTOTAL (COP)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {order.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-[#181C1F]">{item.kitName}</div>
                      <div className="text-[11px] text-[#64748B]">{item.presentation}</div>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-[#181C1F]">
                      {item.quantity}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-[#64748B]">
                      {formatSimpleCOP(item.unitPriceCop)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-[#181C1F]">
                      {formatSimpleCOP(item.subtotalCop)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex flex-col items-end gap-1.5 text-xs font-mono">
            <div className="flex justify-between w-48 text-[#64748B]">
              <span>Subtotal:</span>
              <span>{formatSimpleCOP(order.subtotalCop)} COP</span>
            </div>
            {order.discountCop > 0 && (
              <div className="flex justify-between w-48 text-[#B43428]">
                <span>Descuento:</span>
                <span>-{formatSimpleCOP(order.discountCop)} COP</span>
              </div>
            )}
            <div className="flex justify-between w-56 pt-2 border-t border-[#E5E2DC] text-base font-bold text-[#944601]">
              <span>TOTAL PAGADO:</span>
              <span>{formatSimpleCOP(order.totalCop)} COP</span>
            </div>
          </div>

          {/* Legal / Operational footer */}
          <div className="pt-4 border-t border-[#E5E2DC] text-[10px] text-[#64748B] flex flex-col sm:flex-row justify-between gap-2">
            <div>
              <p className="italic">
                * Documento equivalente simple para control interno agroindustrial. No constituye factura electrónica DIAN.
              </p>
              <p>Fruit Desert — Calidad botánica y deshidratación artesanal controlada.</p>
            </div>
            <div className="text-right font-mono text-[9px] text-[#94A3B8]">
              Atendido por: {order.cashierName} · {formatColombianDateTime(order.createdAt)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
